// Local stand-in for the GitHub Actions REST API used by the Nivello admin (tests and development only).
// Each workflow_dispatch spawns the real scripts/lead-discovery-runner.mjs against the mock scraper,
// mirroring the env mapping in .github/workflows/nivello-lead-discovery.yml.
//
//   POST /__mock/mode  {"dispatch": "ok"|"reject"|"notfound"|"unauthorized"|"down"|"hold", "cancel": "ok"|"fail", "workflow": "found"|"missing"}
//   GET  /__mock/state
//
// Env: PORT (8092), MOCK_GITHUB_TOKEN (required bearer), NIVELLO_ADMIN_CALLBACK_SECRET, SCRAPER_URL,
//      RUNNER_TIME_SCALE, TIME_BUDGET_SECONDS
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const port = Number(process.env.PORT || 8092)
const token = process.env.MOCK_GITHUB_TOKEN || 'mock-token'
const runnerPath = join(dirname(fileURLToPath(import.meta.url)), 'lead-discovery-runner.mjs')
const WORKFLOW = 'nivello-lead-discovery.yml'

let mode = { dispatch: 'ok', cancel: 'ok', workflow: 'found', budget: null }
let nextRunId = 9000001
const runs = new Map()

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

function publicRun(run) {
  return {
    id: run.id,
    name: 'Nivello lead discovery',
    display_title: `Nivello discovery ${run.inputs.batch_id} · segment ${run.inputs.segment}`,
    status: run.status,
    conclusion: run.conclusion,
    html_url: `https://github.com/mock/nivello/actions/runs/${run.id}`,
    created_at: run.createdAt,
    updated_at: new Date().toISOString(),
    event: 'workflow_dispatch'
  }
}

function startRunner(run) {
  run.status = 'in_progress'
  const child = spawn(process.execPath, [runnerPath], {
    env: {
      ...process.env,
      GITHUB_RUN_ID: String(run.id),
      GITHUB_REPOSITORY: 'mock/nivello',
      GITHUB_SERVER_URL: 'https://github.com',
      NIVELLO_BATCH_ID: run.inputs.batch_id,
      NIVELLO_SEGMENT: run.inputs.segment,
      NIVELLO_CALLBACK_URL: run.inputs.callback_url,
      NIVELLO_CALLBACK_SECRET: process.env.NIVELLO_ADMIN_CALLBACK_SECRET,
      ALLOW_INSECURE_CALLBACK: '1',
      TIME_BUDGET_SECONDS: String(mode.budget ?? process.env.TIME_BUDGET_SECONDS ?? 2880)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  run.child = child
  run.log = []
  const collect = chunk => run.log.push(...String(chunk).trim().split('\n').filter(Boolean))
  child.stdout.on('data', collect)
  child.stderr.on('data', collect)
  child.on('exit', code => {
    run.status = 'completed'
    run.conclusion = run.conclusion ?? (code === 0 ? 'success' : 'failure')
    run.child = null
  })
}

async function readJson(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname

  if (path === '/__mock/mode' && req.method === 'POST') {
    mode = { ...mode, ...(await readJson(req)) }
    return send(res, 200, mode)
  }
  if (path === '/__mock/state') {
    return send(res, 200, { mode, runs: [...runs.values()].map(run => ({ ...publicRun(run), inputs: run.inputs, log: run.log ?? [] })) })
  }
  if (path === '/__mock/start' && req.method === 'POST') {
    // Releases runs held with dispatch "hold" (simulates a queued run finally getting a runner).
    for (const run of runs.values()) if (run.status === 'queued') startRunner(run)
    return send(res, 200, { ok: true })
  }

  if (mode.dispatch === 'down') {
    req.socket.destroy()
    return
  }
  if (req.headers.authorization !== `Bearer ${token}`) return send(res, 401, { message: 'Bad credentials' })

  const workflowMatch = path.match(/^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/([^/]+)(\/dispatches|\/runs)?$/)
  if (workflowMatch) {
    if (decodeURIComponent(workflowMatch[1]) !== WORKFLOW || mode.workflow === 'missing') return send(res, 404, { message: 'Not Found' })
    if (!workflowMatch[2]) return send(res, 200, { id: 1, name: 'Nivello lead discovery', path: `.github/workflows/${WORKFLOW}`, state: 'active', html_url: 'https://github.com/mock/nivello/actions/workflows/x' })
    if (workflowMatch[2] === '/runs') {
      const list = [...runs.values()].reverse().slice(0, Number(url.searchParams.get('per_page') || 30))
      return send(res, 200, { total_count: runs.size, workflow_runs: list.map(publicRun) })
    }
    const body = await readJson(req)
    if (mode.dispatch === 'unauthorized') return send(res, 403, { message: 'Resource not accessible by personal access token' })
    if (mode.dispatch === 'notfound') return send(res, 404, { message: 'Not Found' })
    if (mode.dispatch === 'reject') return send(res, 422, { message: 'Unexpected inputs provided' })
    const run = { id: nextRunId++, inputs: body.inputs ?? {}, status: 'queued', conclusion: null, createdAt: new Date().toISOString() }
    runs.set(String(run.id), run)
    if (mode.dispatch !== 'hold') setTimeout(() => startRunner(run), 150)
    return send(res, 204)
  }

  const runMatch = path.match(/^\/repos\/[^/]+\/[^/]+\/actions\/runs\/(\d+)(\/cancel)?$/)
  if (runMatch) {
    const run = runs.get(runMatch[1])
    if (!run) return send(res, 404, { message: 'Not Found' })
    if (!runMatch[2]) return send(res, 200, publicRun(run))
    if (mode.cancel === 'fail') return send(res, 500, { message: 'Server Error' })
    if (run.status === 'completed') return send(res, 409, { message: 'Cannot cancel a workflow run that is completed.' })
    run.conclusion = 'cancelled'
    run.status = 'completed'
    run.child?.kill()
    return send(res, 202, {})
  }

  send(res, 404, { message: 'Not Found' })
}).listen(port, '127.0.0.1', () => console.log(`Mock GitHub Actions API on http://127.0.0.1:${port}`))
