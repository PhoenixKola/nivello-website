import { spawnSync } from 'node:child_process'
import { createHmac } from 'node:crypto'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { ADMIN_BASE, loginApi, stackEnv, type Api } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let api: Api
let site: APIRequestContext

const today = () => new Date().toISOString().slice(0, 10)
const sid = (n: number) => n.toString(16).padStart(16, 'a')

async function signedHealth(payload: Record<string, unknown>, options: { timestamp?: number; signature?: string } = {}) {
  const body = JSON.stringify(payload)
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000))
  const signature = options.signature ?? 'sha256=' + createHmac('sha256', stackEnv().secret).update(`${timestamp}.${body}`).digest('hex')
  const res = await site.post('/admin-api/health-callback.php', {
    headers: { 'Content-Type': 'application/json', 'X-Nivello-Timestamp': timestamp, 'X-Nivello-Signature': signature },
    data: body
  })
  return { status: res.status(), body: await res.json() }
}

function runHealthRunner(extraEnv: Record<string, string> = {}) {
  return spawnSync('node', ['scripts/site-health-runner.mjs'], {
    encoding: 'utf8',
    timeout: 60_000,
    env: {
      ...process.env,
      NIVELLO_HEALTH_ENDPOINT: `${ADMIN_BASE}/admin-api/health-callback.php`,
      NIVELLO_CALLBACK_SECRET: stackEnv().secret,
      NIVELLO_ALLOW_HTTP_CALLBACK: '1',
      NIVELLO_HEALTH_ALLOW_PRIVATE: '1',
      ...extraEnv
    }
  })
}

function clearRateLimits() {
  rmSync(resolve(stackEnv().dataDir, 'ratelimit'), { recursive: true, force: true })
}

async function track(payload: unknown, headers: Record<string, string> = { Origin: ADMIN_BASE }) {
  const res = await site.post('/admin-api/analytics-track.php', {
    headers: { 'Content-Type': 'text/plain', ...headers },
    data: typeof payload === 'string' ? payload : JSON.stringify(payload)
  })
  return { status: res.status(), text: await res.text() }
}

test.beforeAll(async () => {
  api = await loginApi()
  site = await request.newContext({ baseURL: ADMIN_BASE })
  clearRateLimits()
  rmSync(resolve(stackEnv().dataDir, 'analytics'), { recursive: true, force: true })
})

test.afterAll(async () => {
  clearRateLimits()
  await site.dispose()
})

test.describe('analytics', () => {
  test('ingestion only accepts allowlisted, same-origin, small events and never returns data', async () => {
    const ok = await track({ e: 'page_view', p: '/work', s: sid(1), l: 'en', d: 'desktop', r: 'https://www.google.com/search?q=x' })
    expect(ok.status).toBe(204)
    expect(ok.text).toBe('')

    expect((await track({ e: 'purchase', p: '/', s: sid(1) })).status).toBe(422)
    expect((await track({ e: 'page_view', p: '/', s: 'not-hex' })).status).toBe(422)
    expect((await track({ e: 'cta_click', p: '/', s: sid(1), c: 'Bad Label!' })).status).toBe(422)
    expect((await track({ e: 'page_view', p: '/admin/', s: sid(1) })).status).toBe(422)
    expect((await track({ e: 'page_view', p: 'https://evil.test/', s: sid(1) })).status).toBe(422)
    expect((await track('not json')).status).toBe(400)
    expect((await track({ e: 'page_view', p: '/', s: sid(1), pad: 'x'.repeat(3000) })).status).toBe(413)

    const foreign = await track({ e: 'page_view', p: '/', s: sid(1) }, { Origin: 'https://evil.test' })
    expect(foreign.status).toBe(403)
    const noOrigin = await track({ e: 'page_view', p: '/', s: sid(1) }, {})
    expect(noOrigin.status).toBe(403)

    const get = await site.get('/admin-api/analytics-track.php')
    expect(get.status()).toBe(405)
    const errorBody = await get.text()
    expect(errorBody).not.toMatch(/pageViews|sessions/)

    // The summary is admin-only.
    const anon = await site.get('/admin-api/analytics.php?action=summary')
    expect(anon.status()).toBe(401)
  })

  test('aggregates sessions, pages, referrers, events and conversion rates', async () => {
    clearRateLimits()
    for (const [i, path] of ['/', '/work/', '/it/'].entries()) {
      await track({ e: 'page_view', p: path, s: sid(10 + i), l: path.startsWith('/it') ? 'it' : 'en', d: i ? 'mobile' : 'desktop', r: i === 1 ? 'https://linkedin.com/feed' : '', z: ['Europe/Rome', 'Europe/Kiev', 'UTC'][i] })
    }
    await track({ e: 'page_view', p: '/services', s: sid(10), r: `${ADMIN_BASE}/` })
    await track({ e: 'cta_click', p: '/', s: sid(10), c: 'hero_book_call' })
    await track({ e: 'project_launcher_start', p: '/', s: sid(10) })
    await track({ e: 'project_launcher_complete', p: '/', s: sid(10), c: 'website_new' })
    await track({ e: 'contact_start', p: '/contact/', s: sid(11) })
    await track({ e: 'contact_submit', p: '/contact/', s: sid(11), c: 'direct' })
    await track({ e: 'work_case_study_open', p: '/work/alpha/', s: sid(11), c: 'alpha' })

    const res = await api.get(`analytics.php?action=summary&from=${today()}&to=${today()}`)
    expect(res.status).toBe(200)
    const data = res.body.data
    // One session from the first test plus three here.
    expect(data.totals.sessions).toBe(4)
    expect(data.totals.pageViews).toBe(5)
    expect(data.totals.contactSubmits).toBe(1)
    expect(data.totals.launcherCompletes).toBe(1)
    expect(data.totals.contactConversionRate).toBe(25)
    expect(data.topPages.find((p: any) => p.label === '/services/')?.count).toBe(1)
    expect(data.topPages.find((p: any) => p.label === '/work/')?.count).toBe(2)
    const referrers = data.topReferrers.map((r: any) => r.label)
    expect(referrers).toEqual(expect.arrayContaining(['google.com', 'linkedin.com', '(direct)']))
    expect(referrers).not.toContain('(internal)')
    expect(data.ctas).toEqual([{ label: 'hero_book_call', count: 1 }])
    expect(data.launcherOutcomes).toEqual([{ label: 'website_new', count: 1 }])
    expect(data.caseStudies).toEqual([{ label: 'alpha', count: 1 }])
    expect(data.locales.find((l: any) => l.label === 'it')?.count).toBe(1)
    // Country comes from the browser time zone (legacy names included); UTC-style zones stay unknown.
    const countries = Object.fromEntries(data.countries.map((c: any) => [c.label, c.count]))
    expect(countries).toMatchObject({ IT: 1, UA: 1 })
    expect(countries['(unknown)']).toBe(2)
    expect(data.series).toHaveLength(1)

    // Nothing personal is stored in the aggregate document.
    const raw = JSON.stringify(data)
    expect(raw).not.toContain('127.0.0.1')
    expect(raw).not.toContain(sid(10))
  })

  test('range validation, previous period and empty days', async () => {
    const bad = await api.get('analytics.php?action=summary&from=2026-13-01&to=2026-01-01')
    expect(bad.status).toBe(422)
    const reversed = await api.get('analytics.php?action=summary&from=2026-02-01&to=2026-01-01')
    expect(reversed.status).toBe(422)
    const tooLong = await api.get('analytics.php?action=summary&from=2024-01-01&to=2026-01-01')
    expect(tooLong.status).toBe(422)

    const empty = await api.get('analytics.php?action=summary&from=2020-01-01&to=2020-01-30')
    expect(empty.status).toBe(200)
    expect(empty.body.data.series).toHaveLength(30)
    expect(empty.body.data.totals.sessions).toBe(0)
    expect(empty.body.data.totals.contactConversionRate).toBeNull()
    expect(empty.body.data.previous).toMatchObject({ pageViews: 0, sessions: 0 })
  })

  test('public ingestion is rate limited per client', async () => {
    clearRateLimits()
    let limited = 0
    for (let i = 0; i < 305; i++) {
      const { status } = await track({ e: 'cta_click', p: '/', s: sid(99), c: 'rate_test' })
      if (status === 429) limited++
    }
    expect(limited).toBe(5)
    clearRateLimits()
  })
})

// ── Site Health ─────────────────────────────────────────────────────────────

test.describe('site health', () => {
  const mockUrl = (path: string) => `http://127.0.0.1:${stackEnv().ports.scraper}${path}`
  const ids: Record<string, string> = {}

  test.beforeAll(() => {
    rmSync(resolve(stackEnv().dataDir, 'health'), { recursive: true, force: true })
  })

  test('monitor CRUD validates input and refuses non-web targets', async () => {
    for (const [url, code] of [
      ['ftp://example.com/', 'VALIDATION_ERROR'],
      ['http://user:pw@example.com/', 'MONITOR_BLOCKED'],
      ['', 'VALIDATION_ERROR']
    ]) {
      const res = await api.post('site-health.php?action=create', { monitor: { name: 'Bad', url } })
      expect(res.status, url).toBe(422)
      expect(res.body.error.code, url).toBe(code)
    }
    const noName = await api.post('site-health.php?action=create', { monitor: { name: '', url: mockUrl('/status/200') } })
    expect(noName.status).toBe(422)

    for (const [key, path] of [
      ['up', '/redirect'],
      ['down', '/status/503'],
      ['slow', '/slow/3300']
    ] as const) {
      const res = await api.post('site-health.php?action=create', { monitor: { name: `Mock ${key}`, url: mockUrl(path), expectedStatus: 200 } })
      expect(res.status, JSON.stringify(res.body)).toBe(200)
      expect(res.body.data.monitor.state).toBe('pending')
      ids[key] = res.body.data.monitor.id
    }
    const dup = await api.post('site-health.php?action=create', { monitor: { name: 'Again', url: mockUrl('/redirect') } })
    expect(dup.status).toBe(422)

    const renamed = await api.post('site-health.php?action=update', { id: ids.up, monitor: { name: 'Mock website', notes: 'Primary site' } })
    expect(renamed.body.data.monitor).toMatchObject({ name: 'Mock website', notes: 'Primary site', expectedStatus: 200 })

    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    expect((await anon.get('/admin-api/site-health.php?action=list')).status()).toBe(401)
    await anon.dispose()
  })

  test('check now follows redirects, records failures as incidents and flags slow responses', async () => {
    const up = await api.post('site-health.php?action=check', { id: ids.up })
    expect(up.body.data.monitor).toMatchObject({ state: 'healthy', consecutiveFailures: 0 })
    expect(up.body.data.monitor.last).toMatchObject({ ok: true, status: 200 })

    const down = await api.post('site-health.php?action=check', { id: ids.down })
    expect(down.body.data.monitor.state).toBe('down')
    expect(down.body.data.incidents).toHaveLength(1)
    expect(down.body.data.incidents[0]).toMatchObject({ cause: 'HTTP 503 (expected 200)', resolvedAt: null })

    const slow = await api.post('site-health.php?action=check', { id: ids.slow })
    expect(slow.body.data.monitor.state).toBe('warning')
    expect(slow.body.data.monitor.warnings[0]).toMatch(/Slow response/)

    const list = await api.get('site-health.php?action=list')
    expect(list.body.data.counts).toMatchObject({ healthy: 1, down: 1, warning: 1 })
    expect(list.body.data.openIncidents).toHaveLength(1)
  })

  test('a fixed expectation resolves the incident on the next check; pause and URL change work', async () => {
    await api.post('site-health.php?action=update', { id: ids.down, monitor: { expectedStatus: 503 } })
    const recovered = await api.post('site-health.php?action=check', { id: ids.down })
    expect(recovered.body.data.monitor.state).toBe('healthy')
    expect(recovered.body.data.incidents[0].resolvedAt).not.toBeNull()

    const paused = await api.post('site-health.php?action=update', { id: ids.slow, monitor: { enabled: false } })
    expect(paused.body.data.monitor.state).toBe('paused')

    const moved = await api.post('site-health.php?action=update', { id: ids.down, monitor: { url: mockUrl('/status/204'), expectedStatus: 204 } })
    expect(moved.body.data.monitor.state).toBe('pending')
    expect(moved.body.data.monitor.recent).toHaveLength(0)
  })

  test('scheduled runner: signed monitor list, checks and results; paused monitors skipped', async () => {
    const run = runHealthRunner({ NIVELLO_RUN_ID: 'test-run-1' })
    expect(run.status, run.stderr + run.stdout).toBe(0)
    expect(run.stdout).toContain('Checking 2 monitor(s)')
    expect(run.stdout).toContain('Recorded 2 result(s)')
    expect(run.stdout).not.toContain('127.0.0.1')

    const list = await api.get('site-health.php?action=list')
    const byId = Object.fromEntries(list.body.data.monitors.map((m: any) => [m.id, m]))
    expect(byId[ids.up].recent.at(-1).source).toBe('scheduled')
    expect(byId[ids.down].state).toBe('healthy')
    expect(byId[ids.slow].recent.every((c: any) => c.source === 'manual')).toBe(true)
    expect(list.body.data.lastRun).toMatchObject({ recorded: 2 })

    // Replaying the same run id records nothing.
    const replay = await signedHealth({ event: 'results', runId: 'test-run-1', results: [{ monitorId: ids.up, status: 500, at: new Date().toISOString() }] })
    expect(replay.body.data).toMatchObject({ recorded: 0, duplicateRun: true })
  })

  test('runner refuses private targets outside test mode', async () => {
    const run = runHealthRunner({ NIVELLO_HEALTH_ALLOW_PRIVATE: '0', NIVELLO_RUN_ID: 'test-run-2' })
    expect(run.status, run.stderr).toBe(0)
    expect(run.stdout).toMatch(/Blocked: private network address|standard web ports/)
    const detail = await api.get(`site-health.php?action=get&id=${ids.up}`)
    expect(detail.body.data.monitor.state).toBe('down')
  })

  test('health callback rejects bad signatures, stale timestamps and unknown events', async () => {
    expect((await signedHealth({ event: 'monitors' }, { signature: 'sha256=' + '0'.repeat(64) })).status).toBe(401)
    expect((await signedHealth({ event: 'monitors' }, { timestamp: Math.floor(Date.now() / 1000) - 3600 })).status).toBe(401)
    expect((await signedHealth({ event: 'nope' })).status).toBe(422)
    const monitors = await signedHealth({ event: 'monitors' })
    expect(monitors.status).toBe(200)
    expect(Object.keys(monitors.body.data.monitors[0]).sort()).toEqual(['expectedStatus', 'id', 'url'])
    const unknown = await signedHealth({ event: 'results', runId: 'test-run-3', results: [{ monitorId: 'mon_ffffffffffffffff', status: 200 }] })
    expect(unknown.body.data).toMatchObject({ recorded: 0, ignored: 1 })
  })

  test('deleting a monitor removes it with its history', async () => {
    const res = await api.post('site-health.php?action=delete', { id: ids.slow })
    expect(res.body.data.deleted).toBe(true)
    expect((await api.get(`site-health.php?action=get&id=${ids.slow}`)).status).toBe(404)
  })
})

// ── Contact Inbox → Lead → Proposal → Project ───────────────────────────────

async function capture(payload: Record<string, unknown>, headers: Record<string, string> = { Origin: ADMIN_BASE }) {
  const res = await site.post('/admin-api/inbox-capture.php', { headers: { 'Content-Type': 'text/plain', ...headers }, data: JSON.stringify(payload) })
  return { status: res.status(), text: await res.text() }
}

const inquiry = (overrides: Record<string, unknown> = {}) => ({
  submissionId: 'c'.repeat(32),
  delivery: 'delivered',
  source: 'launcher_website',
  locale: 'en',
  page: '/contact/',
  name: 'Giulia Rossi',
  email: 'Giulia@Example.com',
  company: 'Rossi Studio',
  projectType: 'Website development',
  budget: 'EUR 1,800-3,500',
  timing: '1-3 months',
  deadline: '',
  message: 'We need a new bilingual website.',
  ...overrides
})

test.describe('operations workflow', () => {
  const ref: Record<string, string> = {}

  test.beforeAll(() => clearRateLimits())

  test('public capture validates, dedupes retries by submission id and never returns data', async () => {
    expect((await capture(inquiry(), { Origin: 'https://evil.test' })).status).toBe(403)
    expect((await capture(inquiry({ email: 'not-an-email' }))).status).toBe(422)
    expect((await capture(inquiry({ submissionId: 'short' }))).status).toBe(422)
    expect((await capture(inquiry({ message: '' }))).status).toBe(422)
    expect((await capture({ ...inquiry({ submissionId: 'd'.repeat(32) }), website: 'http://spam.test' })).status).toBe(204)

    const failed = await capture(inquiry({ delivery: 'failed', message: 'First draft' }))
    expect(failed).toEqual({ status: 204, text: '' })
    const retried = await capture(inquiry())
    expect(retried.status).toBe(204)

    const list = await api.get('inbox.php?action=list')
    expect(list.body.data.total).toBe(1)
    const item = list.body.data.items[0]
    expect(item).toMatchObject({ name: 'Giulia Rossi', email: 'giulia@example.com', status: 'new', delivery: 'delivered', excerpt: 'We need a new bilingual website.' })
    ref.inquiry = item.id

    const detail = await api.get(`inbox.php?action=get&id=${ref.inquiry}`)
    expect(detail.body.data.activities.map((a: any) => a.type)).toEqual(['delivered', 'received'])

    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    expect((await anon.get('/admin-api/inbox.php?action=list')).status()).toBe(401)
    expect((await anon.get('/admin-api/inbox-capture.php')).status()).toBe(405)
    await anon.dispose()
  })

  test('inbox notes, status, search and conversion to a lead (deduped by email)', async () => {
    const noted = await api.post('inbox.php?action=note', { id: ref.inquiry, body: 'Asked for a call on Tuesday' })
    expect(noted.body.data.item.notes).toHaveLength(1)
    const replied = await api.post('inbox.php?action=mark-replied', { id: ref.inquiry })
    expect(replied.body.data.item.status).toBe('replied')

    expect((await api.get('inbox.php?action=list&q=bilingual')).body.data.total).toBe(1)
    expect((await api.get('inbox.php?action=list&q=nothing-like-this')).body.data.total).toBe(0)
    expect((await api.get('inbox.php?action=list&status=replied')).body.data.total).toBe(1)

    const converted = await api.post('inbox.php?action=convert-lead', { id: ref.inquiry })
    expect(converted.body.data.item.status).toBe('converted')
    expect(converted.body.data.lead).toMatchObject({ companyName: 'Rossi Studio', email: 'giulia@example.com', status: 'interested' })
    ref.lead = converted.body.data.lead.id

    // A second inquiry from the same address links the same lead instead of creating another.
    await capture(inquiry({ submissionId: 'e'.repeat(32), message: 'Also: a booking page?' }))
    const second = (await api.get('inbox.php?action=list&status=new')).body.data.items[0]
    const linked = await api.post('inbox.php?action=convert-lead', { id: second.id })
    expect(linked.body.data.lead.id).toBe(ref.lead)

    const lead = await api.get(`leads.php?action=get&id=${ref.lead}`)
    expect(lead.body.data.lead.source).toBe('inbox')
    expect(lead.body.data.related.inbox).toHaveLength(2)

    const spam = await api.post('inbox.php?action=status', { id: second.id, status: 'spam' })
    expect(spam.body.data.item.status).toBe('spam')
    expect((await api.get('inbox.php?action=list')).body.data.total).toBe(1)
    expect((await api.post('inbox.php?action=delete', { id: ref.inquiry })).status).toBe(422)
    expect((await api.post('inbox.php?action=delete', { id: second.id })).body.data.deleted).toBe(true)
  })

  test('proposal totals are computed on the server; numbering is sequential; milestones must sum to 100%', async () => {
    const bad = await api.post('proposals.php?action=create', { proposal: { title: 'Bad', milestones: [{ label: 'Deposit', percent: 40 }] } })
    expect(bad.status).toBe(422)
    expect(bad.body.error.message).toMatch(/100%/)

    const created = await api.post('proposals.php?action=create', {
      proposal: {
        title: 'Bilingual website',
        leadId: ref.lead,
        items: [
          { description: 'Design', quantity: 1, unit: 'fixed', unitPrice: 1200, total: 1 },
          { description: 'Development', quantity: 2.5, unit: 'day', unitPrice: 480.1 },
          { description: 'Blog module', quantity: 1, unitPrice: 300, optional: true }
        ],
        discount: { type: 'percent', value: 10 },
        tax: { label: 'VAT', rate: 22 },
        milestones: [
          { label: 'Deposit', percent: 33.33 },
          { label: 'Launch', percent: 66.67 }
        ]
      }
    })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    const p = created.body.data.proposal
    expect(p.number).toMatch(/^NIV-\d{4}-001$/)
    expect(p.items[0].total).toBe(120000)
    expect(p.items[1].total).toBe(120025)
    // subtotal 2400.25; 10% = 240.03 (rounded); taxable 2160.22; VAT 22% = 475.25; total 2635.47
    expect(p.totals).toEqual({ subtotal: 240025, discount: 24003, tax: 47525, total: 263547, optional: 30000 })
    expect(p.milestones.map((m: any) => m.amount)).toEqual([87840, 175707])
    expect(p.milestones[0].amount + p.milestones[1].amount).toBe(p.totals.total)
    expect(p.clientCompany).toBe('Rossi Studio')
    ref.proposal = p.id

    const copy = await api.post('proposals.php?action=duplicate', { id: ref.proposal })
    expect(copy.body.data.proposal.number).toMatch(/-002$/)
    expect(copy.body.data.proposal.status).toBe('draft')
    expect((await api.post('proposals.php?action=delete', { id: copy.body.data.proposal.id })).body.data.deleted).toBe(true)
    const third = await api.post('proposals.php?action=duplicate', { id: ref.proposal })
    expect(third.body.data.proposal.number).toMatch(/-003$/)
    await api.post('proposals.php?action=delete', { id: third.body.data.proposal.id })
  })

  test('status flow: sent locks nothing, accepted creates the project and wins the lead; decided proposals are kept', async () => {
    expect((await api.post('proposals.php?action=status', { id: ref.proposal, status: 'accepted' })).status).toBe(409)
    const sent = await api.post('proposals.php?action=status', { id: ref.proposal, status: 'sent' })
    expect(sent.body.data.proposal.sentAt).not.toBeNull()
    expect((await api.get(`leads.php?action=get&id=${ref.lead}`)).body.data.lead.status).toBe('proposal')

    const edited = await api.post('proposals.php?action=update', { id: ref.proposal, proposal: { intro: 'Thanks for the call.' } })
    expect(edited.status).toBe(200)

    const accepted = await api.post('proposals.php?action=status', { id: ref.proposal, status: 'accepted', project: 'create' })
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200)
    expect(accepted.body.data.project).toMatchObject({ name: 'Bilingual website', stage: 'approved' })
    ref.project = accepted.body.data.project.id

    const project = await api.get(`projects.php?action=get&id=${ref.project}`)
    expect(project.body.data.project).toMatchObject({ value: 263547, currency: 'EUR', proposalId: ref.proposal, leadId: ref.lead, clientName: 'Rossi Studio' })
    expect(project.body.data.proposals).toHaveLength(1)
    expect((await api.get(`leads.php?action=get&id=${ref.lead}`)).body.data.lead.status).toBe('won')

    expect((await api.post('proposals.php?action=update', { id: ref.proposal, proposal: { title: 'Changed' } })).status).toBe(409)
    expect((await api.post('proposals.php?action=delete', { id: ref.proposal })).status).toBe(409)
    expect((await api.post('proposals.php?action=status', { id: ref.proposal, status: 'draft' })).status).toBe(409)
  })

  test('projects: create, stage moves with activity, due dates, links without credentials, delete unlinks', async () => {
    const bad = await api.post('projects.php?action=create', { project: { name: 'X', links: [{ label: 'Admin', url: 'https://user:secret@example.com' }] } })
    expect(bad.status).toBe(422)

    const past = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
    const created = await api.post('projects.php?action=create', {
      project: { name: 'Maintenance retainer', clientName: 'Acme', stage: 'development', targetDate: past, value: 900, links: [{ label: 'Staging', url: 'https://staging.example.com' }], tags: ['retainer', 'Retainer'] }
    })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    const project = created.body.data.project
    expect(project).toMatchObject({ due: 'overdue', value: 90000, tags: ['retainer'] })

    const moved = await api.post('projects.php?action=update', { id: project.id, changes: { stage: 'delivered' } })
    expect(moved.body.data.project.stage).toBe('delivered')
    expect(moved.body.data.project.deliveredDate).toBe(new Date().toISOString().slice(0, 10))
    expect(moved.body.data.project.due).toBeNull()
    expect(moved.body.data.activities[0].message).toBe('Moved from Development to Delivered')

    const noop = await api.post('projects.php?action=update', { id: project.id, changes: { stage: 'delivered' } })
    expect(noop.body.data.activities).toHaveLength(moved.body.data.activities.length)

    const list = await api.get('projects.php?action=list')
    expect(list.body.data.counts).toMatchObject({ approved: 1, delivered: 1 })
    expect(list.body.data.stats.active).toBe(1)

    // Link the inquiry to the accepted project, then delete that project: references are cleared.
    await api.post('inbox.php?action=link-project', { id: ref.inquiry, projectId: ref.project })
    expect((await api.post('projects.php?action=delete', { id: ref.project })).body.data.deleted).toBe(true)
    expect((await api.get(`inbox.php?action=get&id=${ref.inquiry}`)).body.data.item.projectId).toBeNull()
    expect((await api.get(`proposals.php?action=get&id=${ref.proposal}`)).body.data.proposal.projectId).toBeNull()

    const fromInbox = await api.post('inbox.php?action=create-project', { id: ref.inquiry })
    expect(fromInbox.body.data.project).toMatchObject({ stage: 'discovery' })
    expect((await api.post('inbox.php?action=create-project', { id: ref.inquiry })).status).toBe(409)
  })

  test('preventivo sections, private files and accepted project work stay linked and server-authoritative', async () => {
    const sections = [
      { title: 'Discovery and UX', note: 'Planning and validation', items: [
        { title: 'Workshop', description: 'Stakeholder workshop and delivery plan.', quantity: 1, unit: 'day', unitPrice: 700, total: 1 },
        { title: 'User flows', description: 'Responsive user flows for the primary journeys.', quantity: 2, unit: 'day', unitPrice: 500, total: 1 }
      ] },
      { title: 'Product build', items: [
        { title: 'Application shell', description: 'React and Next.js implementation with role-aware navigation.', quantity: 1, unit: 'fixed', unitPrice: 3200, total: 1 },
        { title: 'Reporting dashboard', description: 'Charts, exports and saved filters.', quantity: 1, unit: 'fixed', unitPrice: 1800, total: 1 }
      ] },
      { title: 'Launch and support', items: [
        { title: 'Launch', description: 'Production launch, monitoring and handover.', quantity: 1, unit: 'fixed', unitPrice: 900, total: 1 },
        { title: 'Support', description: 'Optional monthly support.', quantity: 1, unit: 'month', unitPrice: 450, optional: true, total: 999999 }
      ] }
    ]
    const created = await api.post('proposals.php?action=create', { proposal: { title: 'Operations platform', clientCode: 'qa', clientCompany: 'QA Client', clientSector: 'Energy', clientAddress: 'Via Roma 1, Milano', clientPhone: '+39 02 0000', clientEmail: 'ops@example.test', sections, acceptance: { place: 'Milano', date: today() } } })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    const proposal = created.body.data.proposal
    expect(proposal.number).toMatch(/^NIV-QA-\d{4}-001$/)
    expect(proposal.sections).toHaveLength(3)
    expect(proposal.sections.map((section: any) => section.items[0].code)).toEqual(['A1', 'B1', 'C1'])
    expect(proposal.sections.map((section: any) => section.subtotal)).toEqual([170000, 500000, 90000])
    expect(proposal.totals).toMatchObject({ subtotal: 760000, optional: 45000, total: 760000 })
    expect(proposal.items.every((item: any) => item.total !== 1 && item.total !== 999999)).toBe(true)

    const second = await api.post('proposals.php?action=create', { proposal: { title: 'Second QA quote', clientCode: 'qa', sections: [{ title: 'Service', items: [{ title: 'Audit', quantity: 1, unitPrice: 100 }] }] } })
    expect(second.body.data.proposal.number).toMatch(/-002$/)
    await api.post('proposals.php?action=delete', { id: second.body.data.proposal.id })

    const badLogo = await api.ctx.post(`/admin-api/proposals.php?action=upload-logo`, { headers: { 'X-CSRF-Token': api.csrf }, multipart: { id: proposal.id, logo: { name: '../../bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') } } })
    expect(badLogo.status()).toBe(422)
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
    const logo = await api.ctx.post(`/admin-api/proposals.php?action=upload-logo`, { headers: { 'X-CSRF-Token': api.csrf }, multipart: { id: proposal.id, logo: { name: '../../client.png', mimeType: 'image/png', buffer: png } } })
    expect(logo.status()).toBe(200)
    expect((await logo.json()).data.proposal.clientLogo).toMatchObject({ mime: 'image/png', size: png.length })

    const sent = await api.post('proposals.php?action=status', { id: proposal.id, status: 'sent' })
    expect(sent.body.data.proposal.versions).toHaveLength(1)
    expect(sent.body.data.proposal.versions[0].files).toEqual({ docx: false, pdf: false })
    const archived = await api.ctx.post(`/admin-api/proposals.php?action=archive-files`, {
      headers: { 'X-CSRF-Token': api.csrf },
      multipart: {
        id: proposal.id,
        revision: '1',
        docx: { name: 'quote.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: Buffer.from('PK\u0003\u0004fake-docx-snapshot') },
        pdf: { name: 'quote.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% fixture\n%%EOF') }
      }
    })
    expect(archived.status()).toBe(200)
    expect((await archived.json()).data.proposal.versions[0].files).toEqual({ docx: true, pdf: true })
    const overwrite = await api.ctx.post(`/admin-api/proposals.php?action=archive-files`, { headers: { 'X-CSRF-Token': api.csrf }, multipart: { id: proposal.id, revision: '1', pdf: { name: 'quote.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nnew content\n%%EOF') } } })
    expect(overwrite.status()).toBe(409)

    const edited = await api.post('proposals.php?action=update', { id: proposal.id, proposal: { notes: 'Revision requested' } })
    expect(edited.body.data.proposal.status).toBe('sent')
    expect(edited.body.data.proposal.versions).toHaveLength(2)
    expect(edited.body.data.proposal.versions[1].files).toEqual({ docx: false, pdf: false })
    const accepted = await api.post('proposals.php?action=status', { id: proposal.id, status: 'accepted', project: 'create', createTasks: true })
    expect(accepted.status, JSON.stringify(accepted.body)).toBe(200)
    const projectId = accepted.body.data.project.id
    let project = (await api.get(`projects.php?action=get&id=${projectId}`)).body.data
    expect(project.project.milestones).toHaveLength(3)
    expect(project.project.tasks).toHaveLength(6)
    expect(project.project.tasks[0]).toMatchObject({ title: 'Workshop', description: 'Stakeholder workshop and delivery plan.' })
    expect(project.project.progress).toMatchObject({ hasTasks: true, taskPercent: 0, milestonePercent: 0, taskCount: 6 })

    const extraMilestone = await api.post('projects.php?action=milestone-create', { projectId, milestone: { title: 'Final review', dueDate: today() } })
    const milestoneId = extraMilestone.body.data.project.milestones.at(-1).id
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const extraTask = await api.post('projects.php?action=task-create', { projectId, task: { title: 'Collect sign-off', milestoneId, priority: 'urgent', dueDate: yesterday, assignee: 'Nivello' } })
    const task = extraTask.body.data.project.tasks.at(-1)
    expect(task.overdue).toBe(true)
    project = (await api.post('projects.php?action=task-update', { projectId, id: task.id, changes: { status: 'done' } })).body.data
    expect(project.project.progress.completedTasks).toBe(1)
    expect(project.activities[0].type).toBe('task_completed')
    project = (await api.post('projects.php?action=milestone-update', { projectId, id: milestoneId, changes: { status: 'completed' } })).body.data
    expect(project.project.progress.completedMilestones).toBe(1)
    expect((await api.post('projects.php?action=milestone-update', { projectId, id: milestoneId, changes: { status: 'in_progress' } })).body.data.activities[0].type).toBe('milestone_reopened')
    expect((await api.post('proposals.php?action=status', { id: proposal.id, status: 'accepted', project: 'update', createTasks: true })).status).toBe(409)
    expect((await api.get(`projects.php?action=get&id=${projectId}`)).body.data.project.tasks).toHaveLength(7)
    expect((await api.post('projects.php?action=task-delete', { projectId, id: task.id })).body.data.project.tasks).toHaveLength(6)
    expect((await api.post('projects.php?action=milestone-delete', { projectId, id: milestoneId })).body.data.project.milestones).toHaveLength(3)
  })

  test('deleting a lead clears its references everywhere', async () => {
    await api.post('leads.php?action=delete', { ids: [ref.lead] })
    expect((await api.get(`inbox.php?action=get&id=${ref.inquiry}`)).body.data.item.leadId).toBeNull()
    expect((await api.get(`proposals.php?action=get&id=${ref.proposal}`)).body.data.proposal.leadId).toBeNull()
  })
})
