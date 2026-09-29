// Nivello lead-discovery runner. Runs inside the GitHub Actions job (.github/workflows/nivello-lead-discovery.yml)
// next to a local gosom/google-maps-scraper container, and reports to Nivello through signed callbacks.
// Nivello (PHP) owns the search plan, qualification, dedupe against the CRM and all counters.
//
// Required env: NIVELLO_CALLBACK_URL, NIVELLO_CALLBACK_SECRET, NIVELLO_BATCH_ID, NIVELLO_SEGMENT
// Optional env: SCRAPER_URL (http://127.0.0.1:8080), TIME_BUDGET_SECONDS (2880), SCRAPER_RESTART_CMD,
//               GITHUB_RUN_ID / GITHUB_SERVER_URL / GITHUB_REPOSITORY (set by Actions),
//               RUNNER_TIME_SCALE + ALLOW_INSECURE_CALLBACK (local tests only).
import { createHash, createHmac } from 'node:crypto'
import { exec } from 'node:child_process'

const env = process.env
const CALLBACK_URL = env.NIVELLO_CALLBACK_URL ?? ''
const SECRET = env.NIVELLO_CALLBACK_SECRET ?? ''
const BATCH_ID = env.NIVELLO_BATCH_ID ?? ''
const SEGMENT = Number(env.NIVELLO_SEGMENT ?? '1')
const SCRAPER_URL = (env.SCRAPER_URL || 'http://127.0.0.1:8080').replace(/\/$/, '')
const SCALE = Number(env.RUNNER_TIME_SCALE || 1)
const BUDGET_MS = Number(env.TIME_BUDGET_SECONDS || 2880) * 1000
const RUN_ID = env.GITHUB_RUN_ID ?? `local${Date.now()}`
const RUN_URL = env.GITHUB_RUN_ID && env.GITHUB_REPOSITORY ? `${env.GITHUB_SERVER_URL || 'https://github.com'}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}` : undefined

const PASS_MAX_ATTEMPTS = 3
const MAX_CONSECUTIVE_FAILED_PASSES = 3
const CHUNK_SIZE = 200
const s = seconds => Math.max(50, seconds * 1000 * SCALE)
const POLL_MS = s(5)
const HEARTBEAT_MS = s(45)
const STALE_GRACE_MS = s(90)
const STABLE_RESULT_MS = s(45)
const ROW_FIELDS = ['title', 'category', 'address', 'website', 'phone', 'review_count', 'review_rating', 'latitude', 'longitude', 'link', 'place_id', 'data_id', 'cid', 'complete_address', 'emails']
const SUCCESS = ['ok', 'completed', 'complete', 'done', 'success', 'succeeded', 'finished']
const ERROR = ['error', 'failed', 'failure', 'cancelled', 'canceled', 'aborted']

const started = Date.now()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const log = message => console.log(`[discovery] ${message}`)

class CallbackRejected extends Error {}
class StopRequested extends Error {}
class PassError extends Error {
  constructor(message, unhealthy = false) {
    super(message)
    this.unhealthy = unhealthy
  }
}

// ── Callbacks ──────────────────────────────────────────────────────────────

let seq = 0

async function callback(event, payload = {}) {
  const body = JSON.stringify({ event, batchId: BATCH_ID, segment: SEGMENT, seq: ++seq, runId: env.GITHUB_RUN_ID, runUrl: RUN_URL, ...payload })
  for (let attempt = 1; ; attempt++) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = 'sha256=' + createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex')
    let status = 0
    let json = null
    try {
      const response = await fetch(CALLBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Nivello-Timestamp': timestamp, 'X-Nivello-Signature': signature },
        body,
        signal: AbortSignal.timeout(30000)
      })
      status = response.status
      json = await response.json().catch(() => null)
    } catch {
      status = 0
    }
    if (status >= 200 && status < 300 && json?.ok) return json.data
    const retryable = status === 0 || status === 408 || status === 429 || status >= 500
    if (!retryable || attempt >= 6) {
      throw new CallbackRejected(`Callback "${event}" failed (HTTP ${status}${json?.error?.code ? ` ${json.error.code}` : ''}).`)
    }
    await sleep(Math.min(30000, 1000 * 2 ** attempt) * Math.min(1, SCALE * 20))
  }
}

// ── Local scraper ──────────────────────────────────────────────────────────

async function scraper(method, path, body, timeoutMs = 20000) {
  try {
    const response = await fetch(SCRAPER_URL + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs)
    })
    return { status: response.status, text: await response.text() }
  } catch {
    return { status: 0, text: '' }
  }
}

async function scraperHealthy() {
  const health = await scraper('GET', '/health', null, 5000)
  if (health.status >= 200 && health.status < 300) return true
  const jobs = await scraper('GET', '/api/v1/jobs', null, 8000)
  return jobs.status >= 200 && jobs.status < 300
}

function restartScraper() {
  if (!env.SCRAPER_RESTART_CMD) return Promise.resolve(false)
  log('restarting local scraper')
  return new Promise(resolve => exec(env.SCRAPER_RESTART_CMD, { timeout: 120000 }, error => resolve(!error)))
}

async function waitForScraper(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await scraperHealthy()) return true
    await sleep(s(2))
  }
  return false
}

async function ensureScraper() {
  if (await waitForScraper(s(180))) return true
  await restartScraper()
  return waitForScraper(s(120))
}

function jobStatus(job) {
  for (const key of ['Status', 'status', 'State', 'state']) if (typeof job?.[key] === 'string') return job[key].trim().toLowerCase()
  for (const key of ['Data', 'data']) if (typeof job?.[key]?.status === 'string') return job[key].status.trim().toLowerCase()
  return ''
}

async function getJob(id) {
  const res = await scraper('GET', `/api/v1/jobs/${encodeURIComponent(id)}`)
  if (res.status === 0) throw new PassError('Local scraper stopped responding.', true)
  if (res.status === 200) return JSON.parse(res.text || '{}')
  if (res.status !== 404) throw new PassError(`Scraper status request failed (HTTP ${res.status}).`)
  const list = await scraper('GET', '/api/v1/jobs')
  const jobs = list.status === 200 ? JSON.parse(list.text || '[]') : []
  return (Array.isArray(jobs) ? jobs : jobs.jobs ?? []).find(job => (job.ID ?? job.id) === id) ?? null
}

/** RFC 4180 CSV parser (quoted fields, escaped quotes, newlines inside quotes). */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const input = text.replace(/^﻿/, '')
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      if (row.some(v => v !== '')) rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    if (row.some(v => v !== '')) rows.push(row)
  }
  const [headers = [], ...data] = rows
  return data.map(cells => Object.fromEntries(headers.map((h, i) => [h.trim(), cells[i] ?? ''])))
}

/** One scraper pass. Never treats an empty download from a still-running job as "zero results". */
async function runPass(pass, params, onHeartbeat) {
  const created = await scraper('POST', '/api/v1/jobs', {
    name: `nivello-${BATCH_ID.slice(-8)}-s${SEGMENT}-p${pass.index + 1}`,
    keywords: [pass.query],
    lang: pass.lang,
    zoom: 15,
    lat: '0',
    lon: '0',
    fast_mode: false,
    radius: 10000,
    depth: pass.depth,
    email: Boolean(params.email),
    extra_reviews: false,
    max_time: pass.maxTime,
    proxies: null
  })
  if (created.status === 0) throw new PassError('Local scraper is not reachable.', true)
  if (created.status < 200 || created.status >= 300) throw new PassError(`Scraper rejected the job (HTTP ${created.status}).`, created.status >= 500)
  const jobId = JSON.parse(created.text || '{}').id
  if (!jobId) throw new PassError('Scraper did not return a job id.')

  const begin = Date.now()
  const maxMs = pass.maxTime * 1000 * SCALE
  const stuckMs = maxMs * 2 + s(180)
  let lastBeat = 0
  let probe = null
  try {
    for (;;) {
      await sleep(POLL_MS)
      const elapsed = Date.now() - begin
      const job = await getJob(jobId)
      if (!job) throw new PassError('The scraper job disappeared.')
      const status = jobStatus(job)
      if (Date.now() - lastBeat > HEARTBEAT_MS) {
        lastBeat = Date.now()
        await onHeartbeat(status)
      }
      if (SUCCESS.includes(status)) {
        const download = await scraper('GET', `/api/v1/jobs/${encodeURIComponent(jobId)}/download`, null, 60000)
        if (download.status === 200) return parseCsv(download.text)
        if (download.status === 404) throw new PassError('The scraper finished but its result file is missing.')
        if (elapsed > stuckMs) throw new PassError(`Could not download results (HTTP ${download.status}).`)
        continue
      }
      if (ERROR.includes(status)) throw new PassError(`The scraper reported "${status}".`)
      // Active or unknown status.
      if (elapsed <= maxMs + STALE_GRACE_MS) continue
      const download = await scraper('GET', `/api/v1/jobs/${encodeURIComponent(jobId)}/download`, null, 60000)
      const rows = download.status === 200 ? parseCsv(download.text) : []
      if (rows.length) {
        // Stale status but real results: import only once the file stops changing.
        const hash = createHash('sha1').update(download.text).digest('hex')
        if (probe?.hash === hash && Date.now() - probe.since >= STABLE_RESULT_MS) return rows
        if (probe?.hash !== hash) probe = { hash, since: Date.now() }
      } else if (elapsed > stuckMs) {
        throw new PassError('The scraper pass got stuck without results.', true)
      }
    }
  } finally {
    await scraper('DELETE', `/api/v1/jobs/${encodeURIComponent(jobId)}`)
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

function slimRow(row) {
  return Object.fromEntries(ROW_FIELDS.map(field => [field, String(row[field] ?? row[field === 'website' ? 'web_site' : field] ?? '').slice(0, 2000)]))
}

function rowKey(row) {
  return row.place_id || row.data_id || row.cid || `${row.title}|${row.address}`.toLowerCase()
}

async function main() {
  if (!/^batch_[a-f0-9]{16}$/.test(BATCH_ID)) throw new Error('Invalid batch id.')
  if (!Number.isInteger(SEGMENT) || SEGMENT < 1) throw new Error('Invalid segment.')
  if (SECRET.length < 32) throw new Error('NIVELLO_CALLBACK_SECRET is missing or too short.')
  if (!/^https:\/\//.test(CALLBACK_URL) && !(env.ALLOW_INSECURE_CALLBACK === '1' && /^http:\/\/127\.0\.0\.1[:/]/.test(CALLBACK_URL))) {
    throw new Error('Callback URL must use HTTPS.')
  }

  const start = await callback('run_started')
  if (start.stop) {
    log(`batch is ${start.status}; nothing to do`)
    return
  }
  const { plan, params } = start
  log(`segment ${SEGMENT}: ${plan.length} passes remaining, ${start.remaining} leads to go`)

  if (!(await ensureScraper())) {
    await callback('finished', { reason: 'error', message: 'The local scraper could not be started on the GitHub runner.', nextIndex: plan[0]?.index ?? 0 })
    process.exitCode = 1
    return
  }

  const seen = new Set()
  let consecutiveFailures = 0
  let passesThisRun = 0

  for (const pass of plan) {
    const passBudget = (pass.maxTime * 2 + 240) * 1000 * SCALE
    // Every run does at least one pass, so a pass larger than the budget can never stall the batch.
    if (passesThisRun > 0 && Date.now() - started + passBudget > BUDGET_MS) {
      log(`time budget reached before pass ${pass.index + 1}; handing over to a continuation run`)
      await callback('segment_end', { nextIndex: pass.index })
      return
    }

    let done = false
    for (let attempt = 1; attempt <= PASS_MAX_ATTEMPTS && !done; attempt++) {
      passesThisRun++
      const ref = { passIndex: pass.index, attempt }
      const ack = await callback('pass_started', { ...ref, retrying: attempt > 1 })
      if (ack.stop) return
      try {
        const rows = await runPass(pass, params, async status => {
          const beat = await callback('heartbeat', { ...ref, scraperStatus: status })
          if (beat.stop) throw new StopRequested(`batch is ${beat.status}`)
        })
        const fresh = []
        for (const row of rows.map(slimRow)) {
          const key = rowKey(row)
          if (seen.has(key)) continue
          seen.add(key)
          fresh.push(row)
        }
        const chunks = []
        for (let i = 0; i < fresh.length; i += CHUNK_SIZE) chunks.push(fresh.slice(i, i + CHUNK_SIZE))
        if (!chunks.length) chunks.push([])
        for (let c = 0; c < chunks.length; c++) {
          const reply = await callback('pass_result', {
            ...ref,
            chunkId: `${RUN_ID}-s${SEGMENT}-p${pass.index}-a${attempt}-c${c}`,
            rows: chunks[c],
            final: c === chunks.length - 1,
            totalRows: rows.length
          })
          if (reply.stop) {
            log(`batch is ${reply.status} (${reply.imported}/${reply.target}); stopping`)
            return
          }
        }
        log(`pass ${pass.index + 1}: ${rows.length} results, ${fresh.length} new in this run`)
        consecutiveFailures = 0
        done = true
      } catch (error) {
        if (error instanceof CallbackRejected || error instanceof StopRequested) throw error
        const last = attempt === PASS_MAX_ATTEMPTS
        log(`pass ${pass.index + 1} attempt ${attempt} failed: ${error.message}`)
        await callback('pass_failed', { ...ref, reason: error.message, skipped: last })
        if (error.unhealthy || !(await scraperHealthy())) {
          if (!(await restartScraper()) && !(await waitForScraper(s(60)))) {
            await callback('finished', { reason: 'error', message: 'The local scraper became unhealthy and could not be recovered.', nextIndex: pass.index })
            process.exitCode = 1
            return
          }
        }
        if (last) {
          consecutiveFailures++
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILED_PASSES) {
            await callback('finished', { reason: 'error', message: `${consecutiveFailures} search passes failed in a row (last: ${error.message})`, nextIndex: pass.index + 1 })
            process.exitCode = 1
            return
          }
        } else {
          await sleep(s(10))
        }
      }
    }
  }
  const lastIndex = plan.length ? plan[plan.length - 1].index + 1 : 0
  await callback('finished', { reason: 'plan_exhausted', nextIndex: lastIndex })
}

main().catch(async error => {
  if (error instanceof StopRequested) {
    log(`${error.message}; stopping`)
    return
  }
  if (error instanceof CallbackRejected) {
    log(error.message)
  } else {
    log(`fatal: ${error.message}`)
    try {
      await callback('finished', { reason: 'error', message: `Runner error: ${error.message}` })
    } catch {
      // Nivello will reconcile the run status when the callback cannot be delivered.
    }
  }
  process.exitCode = 1
})
