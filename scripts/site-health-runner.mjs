#!/usr/bin/env node
// Scheduled Site Health checks (GitHub Actions: .github/workflows/nivello-site-health.yml).
// 1. asks the Nivello API for the enabled monitors (signed request)
// 2. checks each URL from this runner, refusing private/loopback/metadata targets
// 3. posts the results back (signed)
//
// Env: NIVELLO_HEALTH_ENDPOINT (https://…/admin-api/health-callback.php), NIVELLO_CALLBACK_SECRET,
// optional NIVELLO_RUN_ID. Test-only: NIVELLO_ALLOW_HTTP_CALLBACK=1, NIVELLO_HEALTH_ALLOW_PRIVATE=1.

import { createHmac } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import http from 'node:http'
import https from 'node:https'
import net from 'node:net'

const endpoint = process.env.NIVELLO_HEALTH_ENDPOINT ?? ''
const secret = process.env.NIVELLO_CALLBACK_SECRET ?? ''
const allowHttpCallback = process.env.NIVELLO_ALLOW_HTTP_CALLBACK === '1'
const allowPrivate = process.env.NIVELLO_HEALTH_ALLOW_PRIVATE === '1'
const runId = (process.env.NIVELLO_RUN_ID || `local-${Date.now()}`).replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 64)
const TIMEOUT_MS = 10_000
const CONCURRENCY = 4

function fail(message) {
  console.error(`::error::${message}`)
  process.exit(1)
}

if (!endpoint || !secret) {
  console.log('::notice::Site Health is not configured (NIVELLO_ADMIN_BASE_URL / NIVELLO_ADMIN_CALLBACK_SECRET). Nothing to do.')
  process.exit(0)
}
if (!endpoint.startsWith('https://') && !allowHttpCallback) fail('The health endpoint must use https.')

async function signedPost(payload) {
  const body = JSON.stringify(payload)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Nivello-Timestamp': timestamp, 'X-Nivello-Signature': signature },
    body,
    signal: AbortSignal.timeout(30_000)
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.ok) throw new Error(`Nivello API answered HTTP ${res.status}${json?.error ? ` (${json.error.code})` : ''}`)
  return json.data
}

function ipv4Public(ip) {
  const [a, b] = ip.split('.').map(Number)
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 192 && b === 0) return false
  if (a === 198 && (b === 18 || b === 19)) return false
  return true
}

function ipIsPublic(ip) {
  if (net.isIPv4(ip)) return ipv4Public(ip)
  if (!net.isIPv6(ip)) return false
  const lower = ip.toLowerCase()
  const mapped = lower.match(/^(?:::ffff:|64:ff9b::|::)(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return ipv4Public(mapped[1])
  if (lower === '::' || lower === '::1') return false
  if (/^::ffff:/.test(lower) || /^64:ff9b::/.test(lower)) return false
  if (/^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || /^ff/.test(lower)) return false
  return true
}

async function resolveTarget(rawUrl) {
  const url = new URL(rawUrl)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only http(s) targets are checked')
  if (url.username || url.password) throw new Error('Credentials in URLs are not allowed')
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80
  if (!allowPrivate && port !== 80 && port !== 443) throw new Error('Only standard web ports are checked')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = net.isIP(host) ? [{ address: host, family: net.isIP(host) }] : await lookup(host, { all: true, verbatim: true })
  if (!addresses.length) throw new Error('The domain could not be resolved')
  if (!allowPrivate && addresses.some(a => !ipIsPublic(a.address))) throw new Error('Blocked: private network address')
  return { url, address: addresses[0] }
}

function requestOnce(target) {
  const { url, address } = target
  const client = url.protocol === 'https:' ? https : http
  return new Promise(resolve => {
    const req = client.request(
      url,
      {
        method: 'GET',
        headers: { 'User-Agent': 'NivelloSiteHealth/1.0 (+https://www.nivello.it)', Accept: '*/*' },
        // Pin the connection to the address that was validated above.
        lookup: (_host, options, callback) => (options?.all ? callback(null, [address]) : callback(null, address.address, address.family)),
        timeout: TIMEOUT_MS
      },
      res => {
        let ssl = null
        const cert = res.socket.getPeerCertificate?.()
        if (cert && cert.valid_to) {
          const expires = new Date(cert.valid_to)
          if (!Number.isNaN(expires.getTime())) ssl = { expiresAt: expires.toISOString(), issuer: cert.issuer?.O ?? null }
        }
        res.resume()
        res.on('end', () => resolve({ status: res.statusCode ?? 0, location: res.headers.location ?? null, ssl }))
        res.on('error', () => resolve({ status: res.statusCode ?? 0, location: null, ssl }))
      }
    )
    req.on('timeout', () => req.destroy(new Error('Timed out')))
    req.on('error', error => resolve({ status: 0, error: error.message === 'Timed out' ? 'Timed out' : error.code || error.message }))
    req.end()
  })
}

async function checkMonitor(monitor) {
  const started = Date.now()
  const follow = monitor.expectedStatus < 300 || monitor.expectedStatus >= 400
  let current = monitor.url
  let ssl = null
  for (let hop = 0; hop < 5; hop++) {
    let target
    try {
      target = await resolveTarget(current)
    } catch (error) {
      return { monitorId: monitor.id, at: new Date().toISOString(), status: 0, ms: null, error: String(error.message).slice(0, 160), ssl }
    }
    const result = await requestOnce(target)
    if (result.ssl) ssl = result.ssl
    if (follow && result.status >= 300 && result.status < 400 && result.location) {
      current = new URL(result.location, target.url).toString()
      continue
    }
    return {
      monitorId: monitor.id,
      at: new Date().toISOString(),
      status: result.status,
      ms: Date.now() - started,
      error: result.status ? null : String(result.error ?? 'No response').slice(0, 160),
      ssl
    }
  }
  return { monitorId: monitor.id, at: new Date().toISOString(), status: 0, ms: null, error: 'Too many redirects', ssl }
}

async function main() {
  const { monitors } = await signedPost({ event: 'monitors' })
  console.log(`Checking ${monitors.length} monitor(s)…`)
  const results = []
  const queue = [...monitors]
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length) {
        const monitor = queue.shift()
        const result = await checkMonitor(monitor)
        // Only the monitor id and outcome are logged, never URLs with possible secrets in query strings.
        console.log(`${monitor.id}: ${result.status || 'no response'}${result.ms !== null ? ` in ${result.ms} ms` : ''}${result.error ? ` (${result.error})` : ''}`)
        results.push(result)
      }
    })
  )
  const reply = await signedPost({ event: 'results', runId, results })
  console.log(`Recorded ${reply.recorded} result(s).`)
}

main().catch(error => fail(`Site Health run failed: ${error.message}`))
