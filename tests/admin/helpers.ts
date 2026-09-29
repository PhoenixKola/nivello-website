import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, request, type APIRequestContext } from '@playwright/test'

export const ADMIN_BASE = 'http://127.0.0.1:4174'

type StackEnv = { secret: string; token: string; dataDir: string; ports: { php: number; scraper: number; github: number }; accessCode: string }

export function stackEnv(): StackEnv {
  return JSON.parse(readFileSync(resolve('.admin-test', 'env.json'), 'utf8'))
}

/** The test stack generates a random access code per run (scripts/serve-admin-test.mjs). */
export function accessCode(): string {
  return stackEnv().accessCode
}

export type Api = {
  ctx: APIRequestContext
  csrf: string
  get: (path: string) => Promise<{ status: number; body: any }>
  post: (path: string, data?: unknown, headers?: Record<string, string>) => Promise<{ status: number; body: any }>
}

export async function loginApi(): Promise<Api> {
  const ctx = await request.newContext({ baseURL: ADMIN_BASE })
  const res = await ctx.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
  expect(res.status()).toBe(200)
  const csrf = (await res.json()).data.csrfToken as string
  const wrap = async (promise: ReturnType<APIRequestContext['get']>) => {
    const r = await promise
    const text = await r.text()
    let body: any = text
    try {
      body = JSON.parse(text)
    } catch {
      // CSV and other raw responses
    }
    return { status: r.status(), body }
  }
  return {
    ctx,
    csrf,
    get: path => wrap(ctx.get('/admin-api/' + path)),
    post: (path, data = {}, headers = {}) => wrap(ctx.post('/admin-api/' + path, { data, headers: { 'X-CSRF-Token': csrf, ...headers } }))
  }
}

export async function mockMode(service: 'github' | 'scraper', mode: Record<string, unknown>) {
  const { ports } = stackEnv()
  const ctx = await request.newContext()
  await ctx.post(`http://127.0.0.1:${ports[service]}/__mock/mode`, { data: mode })
  await ctx.dispose()
}

export async function mockState(service: 'github' | 'scraper') {
  const { ports } = stackEnv()
  const ctx = await request.newContext()
  const res = await ctx.get(`http://127.0.0.1:${ports[service]}/__mock/state`)
  const body = await res.json()
  await ctx.dispose()
  return body
}

export async function resetMocks() {
  await mockMode('github', { dispatch: 'ok', cancel: 'ok', workflow: 'found', budget: null })
  await mockMode('scraper', { mode: 'normal', jobSeconds: 1 })
}

/** Sends a callback exactly like the runner would (HMAC over "timestamp.body"). */
export async function signedCallback(payload: Record<string, unknown>, options: { secret?: string; timestamp?: number; signature?: string } = {}) {
  const body = JSON.stringify(payload)
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000))
  const secret = options.secret ?? stackEnv().secret
  const signature = options.signature ?? 'sha256=' + createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const ctx = await request.newContext()
  const res = await ctx.post(`${ADMIN_BASE}/admin-api/github-callback.php`, {
    headers: { 'Content-Type': 'application/json', 'X-Nivello-Timestamp': timestamp, 'X-Nivello-Signature': signature },
    data: body
  })
  const result = { status: res.status(), body: await res.json() }
  await ctx.dispose()
  return result
}

export async function startBatch(api: Api, params: Record<string, unknown>) {
  const res = await api.post('discovery.php?action=start', { country: 'Albania', city: 'Tirana', category: 'dentist', languages: ['en'], ...params })
  expect(res.status, JSON.stringify(res.body)).toBe(200)
  return res.body.data.batch
}

export async function getBatch(api: Api, id: string) {
  const res = await api.get(`batches.php?action=get&id=${id}`)
  return res.body.data.batch
}

/** Polls the status endpoint (as the UI does) until the predicate holds. */
export async function waitForBatch(api: Api, id: string, predicate: (batch: any) => boolean, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  let batch: any
  while (Date.now() < deadline) {
    await api.post('discovery.php?action=status', {})
    batch = await getBatch(api, id)
    if (predicate(batch)) return batch
    await new Promise(r => setTimeout(r, 400))
  }
  throw new Error(`Batch ${id} did not reach the expected state. Last: ${JSON.stringify({ status: batch?.status, counters: batch?.counters, github: batch?.github, events: batch?.events?.slice(-4) })}`)
}

export const terminal = (b: any) => !b.isOpen
