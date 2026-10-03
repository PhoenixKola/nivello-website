import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, request, test } from '@playwright/test'
import { accessCode, ADMIN_BASE, getBatch, loginApi, mockMode, mockState, resetMocks, signedCallback, stackEnv, startBatch, terminal, totp, waitForBatch, type Api } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let api: Api

test.beforeAll(async () => {
  await resetMocks()
  api = await loginApi()
})

test.afterEach(async () => {
  await resetMocks()
})

// ── Auth & CSRF ─────────────────────────────────────────────────────────────

test.describe('auth', () => {
  test('rejects unauthenticated requests, wrong codes and missing CSRF; logout ends the session', async () => {
    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    const unauth = await anon.get('/admin-api/dashboard.php?action=summary')
    expect(unauth.status()).toBe(401)
    expect((await unauth.json()).error.code).toBe('UNAUTHENTICATED')

    const wrong = await anon.post('/admin-api/auth.php?action=login', { data: { code: 'not-the-code' } })
    expect(wrong.status()).toBe(401)
    expect((await wrong.json()).error.code).toBe('INVALID_CODE')

    const ok = await anon.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
    expect(ok.status()).toBe(200)
    const csrf = (await ok.json()).data.csrfToken
    expect(csrf).toMatch(/^[a-f0-9]{64}$/)
    const setCookie = ok.headers()['set-cookie'] ?? ''
    expect(setCookie).toMatch(/HttpOnly/i)
    expect(setCookie).toMatch(/SameSite=Strict/i)

    const noCsrf = await anon.post('/admin-api/tags.php?action=create', { data: { name: 'x' } })
    expect(noCsrf.status()).toBe(403)
    expect((await noCsrf.json()).error.code).toBe('CSRF_INVALID')
    const badCsrf = await anon.post('/admin-api/tags.php?action=create', { data: { name: 'x' }, headers: { 'X-CSRF-Token': 'f'.repeat(64) } })
    expect(badCsrf.status()).toBe(403)

    const session = await anon.get('/admin-api/auth.php?action=session')
    expect((await session.json()).data).toMatchObject({ authenticated: true, csrfToken: csrf })

    await anon.post('/admin-api/auth.php?action=logout', { data: {} })
    expect((await anon.get('/admin-api/dashboard.php?action=summary')).status()).toBe(401)
    await anon.dispose()
  })

  test('internal PHP files are not directly usable', async () => {
    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    for (const file of ['_config.php', '_store.php', '_github.php']) {
      const res = await anon.get(`/admin-api/${file}`)
      expect(res.status(), file).toBe(404)
      expect(await res.text()).not.toContain('NivelloAdmin')
    }
    await anon.dispose()
  })

  test('TOTP enrollment adds a second login step and recovery codes are single-use', async () => {
    expect((await api.get('auth.php?action=mfa-status')).body.data.enabled).toBe(false)

    const stale = await request.newContext({ baseURL: ADMIN_BASE })
    expect((await stale.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })).status()).toBe(200)

    const start = await api.post('auth.php?action=mfa-enroll-start', { accessCode: accessCode() })
    expect(start.status, JSON.stringify(start.body)).toBe(200)
    expect(start.body.data.secret).toMatch(/^[A-Z2-7]{32}$/)
    expect(start.body.data.provisioningUri).toContain('otpauth://totp/')

    const confirm = await api.post('auth.php?action=mfa-enroll-confirm', { token: totp(start.body.data.secret) })
    expect(confirm.status, JSON.stringify(confirm.body)).toBe(200)
    expect(confirm.body.data.status.enabled).toBe(true)
    expect(confirm.body.data.recoveryCodes).toHaveLength(10)
    const recoveryCodes = confirm.body.data.recoveryCodes as string[]
    expect((await stale.get('/admin-api/dashboard.php?action=summary')).status()).toBe(401)
    await stale.dispose()

    const second = await request.newContext({ baseURL: ADMIN_BASE })
    const password = await second.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
    expect(password.status()).toBe(200)
    expect((await password.json()).data).toMatchObject({ authenticated: false, mfaRequired: true, csrfToken: null })
    expect((await (await second.get('/admin-api/auth.php?action=session')).json()).data.mfaRequired).toBe(true)

    const verify = await second.post('/admin-api/auth.php?action=mfa-verify', { data: { token: recoveryCodes[0] } })
    expect(verify.status()).toBe(200)
    expect((await verify.json()).data).toMatchObject({ authenticated: true, mfaRequired: false, usedRecoveryCode: true })

    await second.post('/admin-api/auth.php?action=logout', { data: {} })
    const passwordAgain = await second.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
    expect(passwordAgain.status()).toBe(200)
    const reused = await second.post('/admin-api/auth.php?action=mfa-verify', { data: { token: recoveryCodes[0] } })
    expect(reused.status()).toBe(401)
    expect((await reused.json()).error.code).toBe('INVALID_MFA_CODE')
    await second.dispose()

    const disable = await api.post('auth.php?action=mfa-disable', { accessCode: accessCode(), token: recoveryCodes[1] })
    expect(disable.status, JSON.stringify(disable.body)).toBe(200)
    expect(disable.body.data.enabled).toBe(false)

    const direct = await request.newContext({ baseURL: ADMIN_BASE })
    const directLogin = await direct.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
    expect((await directLogin.json()).data).toMatchObject({ authenticated: true, mfaRequired: false })
    await direct.dispose()
  })
})

// ── Discovery availability ──────────────────────────────────────────────────

test.describe('discovery availability', () => {
  test('health reports GitHub integration without exposing secrets', async () => {
    const res = await api.get('health.php?action=status&refresh=1')
    const d = res.body.data.discovery
    expect(d).toMatchObject({ available: true, tokenConfigured: true, callbackSecretConfigured: true, workflowFound: true, apiReachable: true })
    const raw = JSON.stringify(res.body)
    expect(raw).not.toContain(stackEnv().secret)
    expect(raw).not.toContain(stackEnv().token)
    expect(raw).not.toContain(accessCode())
  })

  test('workflow not found on branch blocks discovery but not the CRM', async () => {
    await mockMode('github', { workflow: 'missing' })
    const start = await api.post('discovery.php?action=start', { country: 'Albania', city: 'Tirana', target: 1, languages: ['en'] })
    expect(start.status).toBe(503)
    expect(start.body.error.code).toBe('DISCOVERY_UNAVAILABLE')
    expect(start.body.error.details.issues[0].code).toBe('WORKFLOW_NOT_FOUND')
    const health = await api.get('health.php?action=status&refresh=1')
    expect(health.body.data.discovery.available).toBe(false)
    expect((await api.get('leads.php?action=list')).status).toBe(200)
  })

  test('GitHub API unavailable blocks new discovery with a clear cause', async () => {
    await mockMode('github', { dispatch: 'down' })
    const start = await api.post('discovery.php?action=start', { country: 'Albania', city: 'Tirana', target: 1, languages: ['en'] })
    expect(start.status).toBe(503)
    expect(start.body.error.details.issues[0].code).toBe('GITHUB_UNAVAILABLE')
    await mockMode('github', { dispatch: 'ok' })
    await api.get('health.php?action=status&refresh=1')
  })

  test('start validation is enforced by the backend', async () => {
    for (const [body, fragment] of [
      [{ city: 'Tirana', target: 5, languages: ['en'] }, 'Country'],
      [{ country: 'Albania', city: 'Tirana', target: 0, languages: ['en'] }, 'Qualified leads'],
      [{ country: 'Albania', city: 'Tirana', target: 5001, languages: ['en'] }, 'Qualified leads'],
      [{ country: 'Albania', city: 'Tirana', target: 5, languages: ['xx'] }, 'language']
    ] as const) {
      const res = await api.post('discovery.php?action=start', body)
      expect(res.status).toBe(422)
      expect(res.body.error.message).toContain(fragment)
    }
  })
})

// ── Discovery through the mock GitHub Actions runner ────────────────────────

test.describe('discovery runs', () => {
  test('target = 1 imports exactly one lead and completes', async () => {
    const batch = await startBatch(api, { target: 1 })
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.status).toBe('complete')
    expect(done.counters.imported).toBe(1)
    expect(done.github.runId).toMatch(/^\d+$/)
    expect(done.github.runUrl).toContain('/actions/runs/')
  })

  test('target = 10 with two languages: exact target, cross-language duplicates not re-counted', async () => {
    const batch = await startBatch(api, { category: 'bakery', target: 10, languages: ['en', 'it'], requirePhone: true })
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.status).toBe('complete')
    const c = done.counters
    expect(c.imported).toBe(10)
    expect(c.checked).toBe(c.imported + c.rejected + c.duplicates)
    expect(c.rejectedPhone).toBeGreaterThan(0)
    const leads = await api.get(`leads.php?action=list&batch=${batch.id}&pageSize=100`)
    expect(leads.body.data.total).toBe(10)
  })

  test('duplicates against existing CRM leads are counted and not imported twice', async () => {
    const batch = await startBatch(api, { category: 'bakery', target: 5, languages: ['en'] })
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.counters.duplicates).toBeGreaterThan(0)
    expect(done.counters.imported).toBe(5)
  })

  test('no-website and must-have-phone filters reject with a clear breakdown', async () => {
    const batch = await startBatch(api, { category: 'florist', target: 6, noWebsite: true, requirePhone: true })
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.counters.rejectedWebsite).toBeGreaterThan(0)
    const leads = await api.get(`leads.php?action=list&batch=${batch.id}&pageSize=100`)
    for (const lead of leads.body.data.items) {
      expect(lead.website).toBe('')
      expect(lead.phone).not.toBe('')
    }
  })

  test('email option keeps scraper emails; blank category uses the broad plan', async () => {
    const batch = await startBatch(api, { category: '', target: 4, noWebsite: false, email: true })
    expect(batch.planLength).toBeGreaterThan(100)
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.status).toBe('complete')
    const leads = await api.get(`leads.php?action=list&batch=${batch.id}&pageSize=100`)
    const withSite = leads.body.data.items.filter((l: any) => l.website)
    for (const lead of withSite) expect(lead.email).toMatch(/@/)
  })

  test('dispatch rejected by GitHub fails the batch with the cause', async () => {
    await mockMode('github', { dispatch: 'reject' })
    const batch = await startBatch(api, { target: 3 })
    const done = await waitForBatch(api, batch.id, terminal)
    expect(done.status).toBe('error')
    expect(done.error.code).toBe('DISPATCH_REJECTED')
  })

  test('a second batch queues behind the first and is not replaced', async () => {
    await mockMode('scraper', { jobSeconds: 2 })
    const first = await startBatch(api, { category: 'cafe', target: 12 })
    const second = await startBatch(api, { category: 'gym', target: 1 })
    expect(second.status).toBe('queued')
    const firstDone = await waitForBatch(api, first.id, terminal, 90_000)
    const secondDone = await waitForBatch(api, second.id, terminal, 90_000)
    expect(firstDone.status).toBe('complete')
    expect(secondDone.status).toBe('complete')
    const runs = (await mockState('github')).runs as any[]
    const firstRun = runs.find(r => r.inputs.batch_id === first.id)
    const secondRun = runs.find(r => r.inputs.batch_id === second.id)
    expect(firstRun && secondRun).toBeTruthy()
    expect(Number(secondRun.id)).toBeGreaterThan(Number(firstRun.id))
  })

  test('Stop cancels the GitHub run, keeps imported leads and rejects late callbacks', async () => {
    await mockMode('scraper', { jobSeconds: 2 })
    const batch = await startBatch(api, { category: 'hotel', target: 300 })
    const running = await waitForBatch(api, batch.id, b => b.counters.imported > 0 && b.github.runId)
    const stop = await api.post('discovery.php?action=stop', { id: batch.id })
    expect(stop.body.data.batch.status).toBe('stopped')
    expect(stop.body.data.batch.github.cancel).toBe('cancelled')
    const kept = stop.body.data.batch.counters.imported
    expect(kept).toBeGreaterThanOrEqual(running.counters.imported)

    // A late result from the cancelled run must not import anything or revive the batch.
    const late = await signedCallback({
      event: 'pass_result', batchId: batch.id, segment: 1, seq: 999, runId: running.github.runId,
      passIndex: 0, attempt: 1, chunkId: 'late-chunk', final: true,
      rows: [{ title: 'Late Arrival', phone: '+355 69 000 0001', place_id: 'late-1' }]
    })
    expect(late.body.data.stop).toBe(true)
    await new Promise(r => setTimeout(r, 1500))
    const after = await getBatch(api, batch.id)
    expect(after.status).toBe('stopped')
    expect(after.counters.imported).toBe(kept)
    const run = ((await mockState('github')).runs as any[]).find(r => r.id === Number(running.github.runId))
    expect(run.conclusion).toBe('cancelled')
    expect((await api.get(`leads.php?action=list&batch=${batch.id}&pageSize=10`)).body.data.total).toBe(kept)
  })

  test('if GitHub cancel fails the batch still stays stopped', async () => {
    await mockMode('scraper', { jobSeconds: 2 })
    await mockMode('github', { cancel: 'fail' })
    const batch = await startBatch(api, { category: 'pharmacy', target: 300 })
    await waitForBatch(api, batch.id, b => b.github.runId && b.status === 'working')
    const stop = await api.post('discovery.php?action=stop', { id: batch.id })
    expect(stop.body.data.batch.status).toBe('stopped')
    expect(stop.body.data.batch.github.cancel).toBe('failed')
    await new Promise(r => setTimeout(r, 3000))
    await api.post('discovery.php?action=status', {})
    expect((await getBatch(api, batch.id)).status).toBe('stopped')
  })

  test('a large target continues across GitHub Actions runs without resetting counters', async () => {
    await mockMode('github', { budget: 14 })
    const batch = await startBatch(api, { category: 'locksmith', target: 30 })
    const done = await waitForBatch(api, batch.id, terminal, 110_000)
    expect(done.status, JSON.stringify({ error: done.error, events: done.events })).toBe('complete')
    expect(done.github.segment).toBeGreaterThanOrEqual(2)
    expect(done.counters.imported).toBe(30)
    expect(done.counters.checked).toBe(done.counters.imported + done.counters.rejected + done.counters.duplicates)
    const runs = ((await mockState('github')).runs as any[]).filter(r => r.inputs.batch_id === batch.id)
    expect(runs.length).toBe(done.github.segment)
    expect(runs.map(r => r.inputs.segment)).toEqual(runs.map((_, i) => String(i + 1)))
  })

  test('plan exhausts below the target and reports exhausted, not complete', async () => {
    const batch = await startBatch(api, { category: 'optician', target: 5000, noWebsite: true, requirePhone: true })
    const done = await waitForBatch(api, batch.id, terminal, 115_000)
    expect(done.status).toBe('exhausted')
    expect(done.counters.imported).toBeGreaterThan(0)
    expect(done.counters.imported).toBeLessThan(5000)
    expect(done.planIndex).toBe(done.planLength)
  })

  test('failing scraper passes are retried, skipped, then the batch needs attention', async () => {
    await mockMode('scraper', { mode: 'fail' })
    const batch = await startBatch(api, { category: 'plumber', target: 5 })
    const done = await waitForBatch(api, batch.id, terminal, 90_000)
    expect(done.status).toBe('error')
    expect(done.error.code).toBe('RUNNER_ERROR')
    expect(done.passesFailed).toBe(3)
    expect(done.counters.imported).toBe(0)
  })

  test('scraper job that disappears (404) is handled as a failed pass', async () => {
    await mockMode('scraper', { mode: 'vanish' })
    const batch = await startBatch(api, { category: 'barber', target: 5 })
    const done = await waitForBatch(api, batch.id, terminal, 90_000)
    expect(done.status).toBe('error')
    expect(done.events.map((e: any) => e.message).join(' ')).toContain('disappeared')
  })

  test('stale "working" status with stable results is imported after the stability window', async () => {
    await mockMode('scraper', { mode: 'stale', jobSeconds: 1 })
    const batch = await startBatch(api, { category: 'roofing contractor', target: 3 })
    const done = await waitForBatch(api, batch.id, terminal, 90_000)
    expect(done.status).toBe('complete')
    expect(done.counters.imported).toBe(3)
  })

  test('a run that ends without a final callback is reconciled and continued', async () => {
    await mockMode('scraper', { jobSeconds: 2 })
    const batch = await startBatch(api, { category: 'electrician', target: 300 })
    const running = await waitForBatch(api, batch.id, b => b.github.runId && b.counters.imported > 0)
    const { ports, token } = stackEnv()
    const gh = await request.newContext()
    await gh.post(`http://127.0.0.1:${ports.github}/repos/x/y/actions/runs/${running.github.runId}/cancel`, { headers: { Authorization: `Bearer ${token}` } })
    await gh.dispose()
    await new Promise(r => setTimeout(r, 500))
    const reconciled = await api.post('discovery.php?action=reconcile', { id: batch.id })
    expect(reconciled.body.data.batch.github.segment).toBe(2)
    const continued = await waitForBatch(api, batch.id, b => b.github.segment === 2 && b.github.runId && b.status === 'working')
    expect(continued.counters.imported).toBeGreaterThanOrEqual(running.counters.imported)
    await api.post('discovery.php?action=stop', { id: batch.id })
  })
})

// ── Callback protocol (the test acts as the runner) ─────────────────────────

test.describe('callback endpoint', () => {
  test('authentication, idempotent chunks, out-of-order events and late results', async () => {
    await mockMode('github', { dispatch: 'hold' })
    const batch = await startBatch(api, { category: 'car wash', target: 2 })
    await waitForBatch(api, batch.id, b => b.status === 'starting')
    const base = { batchId: batch.id, segment: 1, runId: '424242' }

    expect((await signedCallback({ event: 'run_started', ...base, seq: 1 }, { secret: 'x'.repeat(64) })).status).toBe(401)
    expect((await signedCallback({ event: 'run_started', ...base, seq: 1 }, { signature: 'sha256=deadbeef' })).status).toBe(401)
    expect((await signedCallback({ event: 'run_started', ...base, seq: 1 }, { timestamp: Math.floor(Date.now() / 1000) - 3600 })).status).toBe(401)

    const started = await signedCallback({ event: 'run_started', ...base, seq: 1 })
    expect(started.status).toBe(200)
    expect(started.body.data.stop).toBe(false)
    expect(started.body.data.plan[0]).toMatchObject({ index: 0, query: 'car wash in Tirana, Albania', lang: 'en' })

    await signedCallback({ event: 'pass_started', ...base, seq: 5, passIndex: 0, attempt: 1 })
    // Out of order: an older heartbeat must not overwrite newer state.
    await signedCallback({ event: 'heartbeat', ...base, seq: 3, passIndex: 0, attempt: 1, scraperStatus: 'stale-old' })
    expect((await getBatch(api, batch.id)).currentPass.scraperStatus).not.toBe('stale-old')

    const chunk = { event: 'pass_result', ...base, passIndex: 0, attempt: 1, chunkId: 'r1-c0', final: false, rows: [{ title: 'Car Wash One', phone: '+355 69 111 1111', place_id: 'cw-1' }] }
    const first = await signedCallback({ ...chunk, seq: 6 })
    expect(first.body.data.imported).toBe(1)
    // Retried delivery of the same chunk changes nothing.
    const retry = await signedCallback({ ...chunk, seq: 6 })
    expect(retry.body.data.duplicateChunk).toBe(true)
    expect(retry.body.data.imported).toBe(1)
    // Same business again in another chunk is deduped by batchSeen.
    const again = await signedCallback({ ...chunk, seq: 7, chunkId: 'r1-c1', final: true })
    expect(again.body.data.imported).toBe(1)
    expect((await getBatch(api, batch.id)).counters.checked).toBe(1)

    const skipped = await signedCallback({ event: 'pass_failed', ...base, seq: 8, passIndex: 1, attempt: 3, reason: 'boom', skipped: true })
    expect(skipped.body.data.planIndex).toBe(2)

    const finished = await signedCallback({ event: 'finished', ...base, seq: 9, reason: 'plan_exhausted', nextIndex: 2 })
    expect(finished.body.data.stop).toBe(true)
    expect(finished.body.data.status).toBe('exhausted')

    const late = await signedCallback({ ...chunk, seq: 10, chunkId: 'r1-late', rows: [{ title: 'Car Wash Two', phone: '+355 69 222 2222', place_id: 'cw-2' }] })
    expect(late.body.data.stop).toBe(true)
    expect((await getBatch(api, batch.id)).counters.imported).toBe(1)

    const unknown = await signedCallback({ event: 'run_started', batchId: 'batch_0000000000000000', segment: 1, seq: 1 })
    expect(unknown.status).toBe(404)
  })
})

// ── CRM ─────────────────────────────────────────────────────────────────────

test.describe('crm', () => {
  let leadId: string

  test('manual create, duplicate warning, validation and in-place update with activity', async () => {
    const created = await api.post('leads.php?action=create', { lead: { companyName: 'Acme Dental', city: 'Tirana', country: 'Albania', phone: '+355 69 555 0101', category: 'Dentist' } })
    expect(created.status).toBe(200)
    leadId = created.body.data.lead.id
    const dup = await api.post('leads.php?action=create', { lead: { companyName: 'Acme Dental', phone: '+355 69 555 0101' } })
    expect(dup.status).toBe(409)
    expect(dup.body.error.code).toBe('DUPLICATE_LEAD')
    expect((await api.post('leads.php?action=update', { id: leadId, changes: { email: 'not-an-email' } })).status).toBe(422)
    expect((await api.post('leads.php?action=update', { id: leadId, changes: { status: 'bogus' } })).status).toBe(422)

    const followUp = new Date(Date.now() - 3600_000).toISOString()
    const updated = await api.post('leads.php?action=update', { id: leadId, changes: { status: 'interested', priority: 'high', followUpAt: followUp, email: 'hello@acme.example' } })
    const detail = updated.body.data
    expect(detail.lead).toMatchObject({ status: 'interested', priority: 'high', email: 'hello@acme.example' })
    const messages = detail.activities.map((a: any) => a.message).join(' | ')
    expect(messages).toContain('Status changed')
    expect(messages).toContain('Follow-up scheduled')
    expect(detail.score.reasons.some((r: any) => r.label === 'Email available')).toBe(true)
  })

  test('notes, contact logging and follow-up buckets', async () => {
    const noted = await api.post('leads.php?action=note', { id: leadId, body: 'Owner prefers WhatsApp.' })
    expect(noted.body.data.notes[0].body).toBe('Owner prefers WhatsApp.')
    const overdue = await api.get('leads.php?action=followups&bucket=overdue&tzOffset=0')
    expect(overdue.body.data.items.some((l: any) => l.id === leadId)).toBe(true)

    const next = new Date(Date.now() + 3 * 86400_000).toISOString()
    const logged = await api.post('leads.php?action=log-contact', { id: leadId, type: 'whatsapp', outcome: 'Sent mock-up', followUpAt: next })
    expect(logged.body.data.lead.lastContactedAt).toBeTruthy()
    expect(logged.body.data.lead.followUpAt).toBe(next.replace(/\.\d{3}Z$/, 'Z'))
    const upcoming = await api.get('leads.php?action=followups&bucket=upcoming&tzOffset=0')
    expect(upcoming.body.data.items.some((l: any) => l.id === leadId)).toBe(true)
    const done = await api.post('leads.php?action=complete-follow-up', { id: leadId })
    expect(done.body.data.lead.followUpCompletedAt).toBeTruthy()
  })

  test('tags: create, assign, bulk add/remove, rename and delete (unassigns only)', async () => {
    const tag = (await api.post('tags.php?action=create', { name: 'Warm lead', color: 'gold' })).body.data.tag
    expect((await api.post('tags.php?action=create', { name: 'warm lead', color: 'gold' })).status).toBe(422)
    const some = (await api.get('leads.php?action=list&pageSize=10')).body.data.items.map((l: any) => l.id).slice(0, 3)
    expect((await api.post('leads.php?action=bulk', { ids: some, op: 'addTag', value: tag.id })).body.data.updated).toBe(3)
    expect((await api.get(`leads.php?action=list&tag=${tag.id}`)).body.data.total).toBe(3)
    await api.post('leads.php?action=bulk', { ids: [some[0]], op: 'removeTag', value: tag.id })
    expect((await api.get(`leads.php?action=list&tag=${tag.id}`)).body.data.total).toBe(2)
    await api.post('tags.php?action=update', { id: tag.id, name: 'Warm', color: 'green' })
    const deleted = await api.post('tags.php?action=delete', { id: tag.id })
    expect(deleted.body.data.tags.some((t: any) => t.id === tag.id)).toBe(false)
    expect((await api.get(`leads.php?action=get&id=${some[1]}`)).body.data.lead.tags).not.toContain(tag.id)
  })

  test('saved views persist, rename and delete', async () => {
    const created = await api.post('saved-views.php?action=create', { name: 'Hot', filters: { priority: ['high'], hasEmail: true } })
    const view = created.body.data.view
    expect(view.filters).toMatchObject({ priority: ['high'], hasEmail: true })
    await api.post('saved-views.php?action=update', { id: view.id, name: 'Hot leads' })
    expect((await api.get('saved-views.php?action=list')).body.data.views.find((v: any) => v.id === view.id).name).toBe('Hot leads')
    await api.post('saved-views.php?action=delete', { id: view.id })
    expect((await api.get('saved-views.php?action=list')).body.data.views.some((v: any) => v.id === view.id)).toBe(false)
  })

  test('CSV export escapes formulas; CSV import previews, dedupes and records duplicates for review', async () => {
    const formula = (await api.post('leads.php?action=create', { lead: { companyName: '=HYPERLINK("x")', phone: '+355 69 777 7777' } })).body.data.lead.id
    const csv = await api.post('export.php?action=leads', { ids: [formula, leadId] })
    expect(csv.status).toBe(200)
    expect(csv.body).toContain('Company,Category,Status')
    expect(csv.body).toContain(`"'=HYPERLINK(""x"")"`)

    const file = [
      'Business Name,Phone,E-mail,City,Notes',
      'Acme Dental,+355 69 555 0101,,Tirana,existing',
      'Brand New Studio,+355 69 888 8888,info@new.example,Durres,first contact',
      ',+355 69 999 9999,,Vlore,missing name',
      'Brand New Studio,+355 69 888 8888,,Durres,repeat'
    ].join('\n')
    const ctx = api.ctx
    const preview = await ctx.post('/admin-api/import.php?action=preview', {
      headers: { 'X-CSRF-Token': api.csrf },
      multipart: { file: { name: 'leads.csv', mimeType: 'text/csv', buffer: Buffer.from(file) } }
    })
    const p = (await preview.json()).data
    expect(p.mapping).toMatchObject({ 'Business Name': 'companyName', Phone: 'phone', 'E-mail': 'email', City: 'city', Notes: 'note' })
    expect(p.counts).toEqual({ total: 4, new: 1, duplicate: 2, invalid: 1 })
    const commit = await api.post('import.php?action=commit', { token: p.token, mapping: p.mapping })
    expect(commit.body.data.imported).toBe(1)
    const imported = await api.get('leads.php?action=list&q=Brand%20New%20Studio')
    expect(imported.body.data.total).toBe(1)
  })

  test('duplicate review merges only chosen fields and never touches CRM status', async () => {
    const created = await api.post('leads.php?action=create', { lead: { companyName: 'Merge Me', phone: '+355 69 444 4444' } })
    const id = created.body.data.lead.id
    await api.post('leads.php?action=update', { id, changes: { status: 'proposal' } })
    const file = 'Company,Phone,Email,Website\nMerge Me,+355 69 444 4444,merge@me.example,https://merge.example\n'
    const preview = await api.ctx.post('/admin-api/import.php?action=preview', {
      headers: { 'X-CSRF-Token': api.csrf },
      multipart: { file: { name: 'dup.csv', mimeType: 'text/csv', buffer: Buffer.from(file) } }
    })
    const p = (await preview.json()).data
    await api.post('import.php?action=commit', { token: p.token, mapping: p.mapping })
    const list = (await api.get('duplicates.php?action=list')).body.data.items
    const item = list.find((d: any) => d.existing.id === id)
    expect(item.fills).toEqual(expect.arrayContaining(['email', 'website']))
    const merged = await api.post('duplicates.php?action=merge', { id: item.id, fields: ['email'] })
    expect(merged.body.data.merged).toEqual(['email'])
    const lead = (await api.get(`leads.php?action=get&id=${id}`)).body.data.lead
    expect(lead).toMatchObject({ email: 'merge@me.example', website: '', status: 'proposal' })
    expect((await api.post('duplicates.php?action=merge', { id: item.id, fields: [] })).status).toBe(409)
  })

  test('Instagram enrichment reads one homepage and normalizes the profile URL', async () => {
    const { ports } = stackEnv()
    const created = await api.post('leads.php?action=create', {
      lead: { companyName: 'Insta Shop', website: `http://127.0.0.1:${ports.scraper}/site/mock-insta-shop-2` }
    })
    const enriched = await api.post('leads.php?action=enrich', { id: created.body.data.lead.id })
    expect(enriched.body.data.result.status).toBe('found')
    expect(enriched.body.data.lead.instagram).toBe('https://www.instagram.com/studio_3/')
  })

  test('batch filter, bulk status, bulk delete, batch delete keeps or removes leads explicitly', async () => {
    const batches = (await api.get('batches.php?action=list&pageSize=50')).body.data.items
    const completed = batches.find((b: any) => b.status === 'complete' && b.counters.imported === 10)
    const inBatch = await api.get(`leads.php?action=list&batch=${completed.id}&pageSize=100`)
    expect(inBatch.body.data.items.length).toBe(10)
    const ids = inBatch.body.data.items.map((l: any) => l.id)
    await api.post('leads.php?action=bulk', { ids: ids.slice(0, 2), op: 'status', value: 'won' })
    expect((await api.get(`leads.php?action=list&batch=${completed.id}&status=won`)).body.data.total).toBe(2)

    expect((await api.post('batches.php?action=delete', { id: completed.id })).body.data).toMatchObject({ deleted: true, deletedLeads: 0 })
    expect((await api.get(`leads.php?action=get&id=${ids[0]}`)).status).toBe(200)

    const other = batches.find((b: any) => b.status === 'complete' && b.id !== completed.id && b.counters.imported > 0)
    const removed = await api.post('batches.php?action=delete', { id: other.id, deleteLeads: true })
    expect(removed.body.data.deletedLeads).toBe(other.counters.imported)

    const del = await api.post('leads.php?action=delete', { ids: ids.slice(0, 3) })
    expect(del.body.data.deleted).toBe(3)
    expect((await api.get(`leads.php?action=get&id=${ids[0]}`)).status).toBe(404)
  })

  test('dashboard, backups and health counts stay consistent', async () => {
    const summary = (await api.get('dashboard.php?action=summary')).body.data
    const total = (await api.get('leads.php?action=list')).body.data.total
    expect(summary.totals.leads).toBe(total)
    const backup = await api.post('health.php?action=backup', {})
    expect(backup.body.data.file).toMatch(/^store-\d{8}-\d{6}\.json$/)
    const health = (await api.get('health.php?action=status')).body.data
    expect(health.storage).toMatchObject({ ok: true, writable: true })
    expect(health.storage.backupCount).toBeGreaterThan(0)
    expect(health.counts.leads).toBe(total)
  })
})

// Runs last: it locks this IP out of login for a minute.
test('repeated wrong codes are throttled', async () => {
  const anon = await request.newContext({ baseURL: ADMIN_BASE })
  let last = 0
  for (let i = 0; i < 6; i++) {
    last = (await anon.post('/admin-api/auth.php?action=login', { data: { code: `wrong-${i}` } })).status()
  }
  expect(last).toBe(429)
  const blocked = await anon.post('/admin-api/auth.php?action=login', { data: { code: accessCode() } })
  expect(blocked.status()).toBe(429)
  await anon.dispose()
  rmSync(resolve(stackEnv().dataDir, 'login-throttle.json'), { force: true })
})
