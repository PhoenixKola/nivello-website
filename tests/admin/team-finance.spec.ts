import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, request, test, type APIRequestContext } from '@playwright/test'
import { ADMIN_BASE, loginApi, stackEnv, totp, type Api } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let api: Api
let ameliaId = ''
const AMELIO_CODE = 'amelio-personal-code-42'
let ameliaSecret = ''

/** Signs in with identifier + access code (+ authenticator when required); returns a context or the failed response. */
async function signIn(identifier: string, code: string, factor?: () => string) {
  const ctx = await request.newContext({ baseURL: ADMIN_BASE })
  const res = await ctx.post('/admin-api/auth.php?action=login', { data: { identifier, code } })
  const body = await res.json()
  if (res.status() !== 200) return { ctx, status: res.status(), body }
  if (body.data.mfaRequired && factor) {
    const verify = await ctx.post('/admin-api/auth.php?action=mfa-verify', { data: { token: factor() } })
    return { ctx, status: verify.status(), body: await verify.json() }
  }
  return { ctx, status: res.status(), body }
}

async function session(ctx: APIRequestContext) {
  return (await (await ctx.get('/admin-api/auth.php?action=session')).json()).data
}

test.beforeAll(async () => {
  api = await loginApi()
})

test.describe('admin identities', () => {
  test('the existing admin is Francesko CTO; Amelio CEO is set up through a one-time link with a personal authenticator', async () => {
    const me = (await api.get('auth.php?action=session')).body.data.user
    expect(me).toMatchObject({ displayName: 'Francesko CTO', login: 'francesko', status: 'active', role: 'admin' })
    expect(JSON.stringify(me)).not.toMatch(/accessCodeHash|secret|recovery/i)

    const created = await api.post('users.php?action=create', { user: { displayName: 'Amelio CEO', title: 'CEO', login: 'amelio', email: '' } })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    ameliaId = created.body.data.created.id
    expect(created.body.data.created.status).toBe('invited')
    const token = /token=([a-f0-9]{48})/.exec(created.body.data.setupUrl)![1]
    expect((await api.post('users.php?action=create', { user: { displayName: 'Dup', login: 'amelio' } })).status).toBe(422)

    // Before setup, the account cannot sign in at all.
    expect((await signIn('amelio', AMELIO_CODE)).status).toBe(401)

    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    expect((await (await anon.get(`/admin-api/auth.php?action=setup-info&token=${token}`)).json()).data.displayName).toBe('Amelio CEO')
    expect((await anon.post('/admin-api/auth.php?action=setup-start', { data: { token, accessCode: 'short' } })).status()).toBe(422)
    const start = await (await anon.post('/admin-api/auth.php?action=setup-start', { data: { token, accessCode: AMELIO_CODE } })).json()
    ameliaSecret = start.data.secret
    expect((await anon.post('/admin-api/auth.php?action=setup-complete', { data: { token, token2: '000000' } })).status()).toBe(422)
    const done = await anon.post('/admin-api/auth.php?action=setup-complete', { data: { token, token2: totp(ameliaSecret) } })
    expect(done.status()).toBe(200)
    expect((await done.json()).data.recoveryCodes).toHaveLength(10)
    expect((await session(anon)).user).toMatchObject({ id: ameliaId, displayName: 'Amelio CEO', mfaEnabled: true })
    // The link is single use.
    expect((await anon.get(`/admin-api/auth.php?action=setup-info&token=${token}`)).status()).toBe(404)
    await anon.dispose()
  })

  test('an authenticator code for one user never authenticates another; sessions carry the right user id', async () => {
    const other = 'JBSWY3DPEHPK3PXP'
    const wrong = await signIn('amelio', AMELIO_CODE, () => totp(other))
    expect(wrong.status).toBe(401)
    await wrong.ctx.dispose()
    expect((await signIn('francesko', AMELIO_CODE)).status).toBe(401)
    expect((await signIn('amelio', stackEnv().accessCode)).status).toBe(401)

    await new Promise(r => setTimeout(r, 31_000)) // a fresh TOTP step: codes are single use per user
    const ok = await signIn('AMELIO', AMELIO_CODE, () => totp(ameliaSecret))
    expect(ok.status).toBe(200)
    expect((await session(ok.ctx)).user.id).toBe(ameliaId)
    expect((await api.get('auth.php?action=session')).body.data.user.login).toBe('francesko')
    await ok.ctx.dispose()
  })

  test('a disabled account is signed out and cannot sign in; the last active admin is protected', async () => {
    await new Promise(r => setTimeout(r, 31_000))
    const live = await signIn('amelio', AMELIO_CODE, () => totp(ameliaSecret))
    expect(live.status).toBe(200)
    const disabled = await api.post('users.php?action=set-status', { id: ameliaId, status: 'disabled' })
    expect(disabled.status).toBe(200)
    expect((await live.ctx.get('/admin-api/dashboard.php?action=summary')).status()).toBe(401)
    expect((await signIn('amelio', AMELIO_CODE, () => totp(ameliaSecret))).status).toBe(401)
    await live.ctx.dispose()

    const me = (await api.get('auth.php?action=session')).body.data.user
    const self = await api.post('users.php?action=set-status', { id: me.id, status: 'disabled', confirmSelf: true })
    expect(self.status).toBe(409)
    expect(self.body.error.code).toBe('LAST_ADMIN')
    const people = (await api.get('users.php?action=people')).body.data.users
    expect(people.find((u: { id: string }) => u.id === ameliaId)).toMatchObject({ status: 'disabled' })
    expect(JSON.stringify(people)).not.toMatch(/login|email|mfa/)
  })
})

test.describe('project workspace data', () => {
  let projectId = ''

  test('task assignment uses real active users and is logged', async () => {
    projectId = (await api.post('projects.php?action=create', { project: { name: 'Workspace API project', clientName: 'Rossi Srl', value: 6000, stage: 'development' } })).body.data.project.id
    const me = (await api.get('auth.php?action=session')).body.data.user
    const withTask = await api.post('projects.php?action=task-create', { projectId, task: { title: 'Wire payments', assigneeUserId: me.id } })
    const task = withTask.body.data.project.tasks[0]
    expect(task).toMatchObject({ assigneeUserId: me.id, assigneeUser: { displayName: 'Francesko CTO' } })
    expect((await api.post('projects.php?action=task-update', { projectId, id: task.id, changes: { assigneeUserId: ameliaId } })).status).toBe(422)
    expect((await api.post('projects.php?action=task-update', { projectId, id: task.id, changes: { assigneeUserId: 'usr_0000000000000000' } })).status).toBe(422)
    const unassigned = await api.post('projects.php?action=task-update', { projectId, id: task.id, changes: { assigneeUserId: null } })
    const messages = unassigned.body.data.activities.map((a: { message: string }) => a.message)
    expect(messages).toContain('Task assigned to Francesko CTO: Wire payments')
    expect(messages).toContain('Task unassigned: Wire payments')
    expect(unassigned.body.data.activities[0]).toMatchObject({ actorName: 'Francesko CTO' })

    const brand = await api.post('projects.php?action=update', { id: projectId, changes: { brandColors: [{ label: 'Primary', hex: '0b1020' }, { label: '', hex: '#fdba2d' }] } })
    expect(brand.body.data.project.brandColors).toHaveLength(5)
    expect(brand.body.data.project.brandColors.slice(0, 2)).toEqual([{ label: 'Primary', hex: '#0B1020' }, { label: '', hex: '#FDBA2D' }])
    expect((await api.post('projects.php?action=update', { id: projectId, changes: { brandColors: [{ hex: 'nope' }] } })).status).toBe(422)
  })

  test('credentials are encrypted at rest, listed without secrets and revealed only on request', async () => {
    const created = await api.post('credentials.php?action=create', { projectId, credential: { type: 'sftp', label: 'Production SFTP', username: 'deploy', urlOrHost: 'sftp.example.com', secret: 'Very-Secret-Pa55!', notes: 'port 2222' } })
    expect(created.status, JSON.stringify(created.body)).toBe(200)
    const item = created.body.data.credentials[0]
    expect(JSON.stringify(created.body)).not.toContain('Very-Secret-Pa55!')
    expect(item).toMatchObject({ label: 'Production SFTP', username: 'deploy', hasSecret: true, hasNotes: true })
    const list = await api.get(`credentials.php?action=list&projectId=${projectId}`)
    expect(JSON.stringify(list.body)).not.toContain('Very-Secret-Pa55!')
    const project = await api.get(`projects.php?action=get&id=${projectId}`)
    expect(JSON.stringify(project.body)).not.toContain('Very-Secret-Pa55!')

    const onDisk = readFileSync(resolve(stackEnv().dataDir, 'vault', 'credentials.json'), 'utf8')
    expect(onDisk).not.toContain('Very-Secret-Pa55!')
    expect(onDisk).not.toContain('port 2222')

    const anon = await request.newContext({ baseURL: ADMIN_BASE })
    expect((await anon.post('/admin-api/credentials.php?action=reveal', { data: { id: item.id } })).status()).toBe(401)
    await anon.dispose()
    const revealed = await api.post('credentials.php?action=reveal', { id: item.id })
    expect(revealed.body.data).toMatchObject({ secret: 'Very-Secret-Pa55!', notes: 'port 2222' })

    const updated = await api.post('credentials.php?action=update', { id: item.id, credential: { type: 'sftp', label: 'Production SFTP', username: 'deploy2', urlOrHost: 'sftp.example.com' } })
    expect(updated.body.data.credentials[0].username).toBe('deploy2')
    expect((await api.post('credentials.php?action=reveal', { id: item.id })).body.data.secret).toBe('Very-Secret-Pa55!')

    const activity = (await api.get(`projects.php?action=get&id=${projectId}`)).body.data.activities.map((a: { message: string }) => a.message).join('\n')
    expect(activity).toContain('Credential revealed: Production SFTP')
    expect(activity).not.toContain('Very-Secret-Pa55!')
    await api.post('credentials.php?action=delete', { id: item.id })
  })

  test('payments: CRUD, duplicate submits, overpayment confirmation, and invoices count as invoiced not paid', async () => {
    const pay = (amount: number | string, requestId: string, confirm = false) => api.post('projects.php?action=payment-create', { projectId, payment: { amount, date: '2026-10-01', method: 'bank_transfer' }, requestId, confirmOverpayment: confirm })
    const first = await pay('2000', 'req-aaaa-0001')
    expect(first.status).toBe(200)
    expect((await pay('2000', 'req-aaaa-0001')).body.data.project.payments).toHaveLength(1)
    expect((await pay(-5, 'req-aaaa-0002')).status).toBe(422)
    expect((await pay(0, 'req-aaaa-0003')).status).toBe(422)
    const over = await pay(5000, 'req-aaaa-0004')
    expect(over.status).toBe(409)
    expect(over.body.error.code).toBe('OVERPAYMENT')
    const second = await pay(2000, 'req-aaaa-0005')
    const finance = second.body.data.project.finance
    expect(finance).toMatchObject({ contracted: 600000, paid: 400000, outstanding: 200000, paidPercent: 67, invoiced: 0 })

    const payments = second.body.data.project.payments
    const edited = await api.post('projects.php?action=payment-update', { projectId, id: payments[1].id, payment: { amount: 1500, date: '2026-10-02', method: 'card' } })
    expect(edited.body.data.project.finance.paid).toBe(350000)
    const removed = await api.post('projects.php?action=payment-delete', { projectId, id: payments[1].id })
    expect(removed.body.data.project.finance.paid).toBe(200000)
    const log = removed.body.data.activities.map((a: { message: string }) => a.message).join('\n')
    expect(log).toMatch(/Payment recorded: €2\.000,00/)
    expect(log).toMatch(/Payment deleted/)
  })

  test('Fatture: billing profile required, numbering, totals, XML, SdI recording, paid → one project payment', async () => {
    const draft = await api.post('invoices.php?action=create', { invoice: {}, from: { projectId } })
    expect(draft.status, JSON.stringify(draft.body)).toBe(200)
    const id = draft.body.data.invoice.id
    expect(draft.body.data.invoice).toMatchObject({ status: 'draft', number: null, projectId })

    const lines = [
      { description: 'Sviluppo piattaforma', quantity: 1, unitPrice: '3000', vatRate: 22 },
      { description: 'Spese anticipate', quantity: 1, unitPrice: '40', vatRate: 0, vatNature: 'N1', vatReference: 'Art. 15 DPR 633/72' }
    ]
    const client = { name: 'Rossi Srl', vatNumber: '01234567897', taxCode: '', address: 'Via Po', streetNumber: '2', postalCode: '10123', city: 'Torino', province: 'TO', country: 'IT', pec: '', recipientCode: 'XYZ1234' }
    const saved = await api.post('invoices.php?action=update', { id, invoice: { lines, client, dueDate: '2026-11-30', stampDuty: true } })
    expect(saved.body.data.invoice.totals).toEqual({ taxable: 304000, vat: 66000, stampDuty: 200, total: 370200 })
    // The browser cannot override server totals.
    const forged = await api.post('invoices.php?action=update', { id, invoice: { totals: { total: 1 } } })
    expect(forged.body.data.invoice.totals.total).toBe(370200)

    const blocked = await api.post('invoices.php?action=finalize', { id })
    expect(blocked.status).toBe(422)
    expect(blocked.body.error.code).toBe('BILLING_PROFILE_INCOMPLETE')
    const billing = await api.post('invoices.php?action=billing', { profile: { name: 'Studio Test S.r.l.', vatNumber: '01234567897', taxRegime: 'RF01', address: 'Via Roma', streetNumber: '1', postalCode: '20121', city: 'Milano', province: 'MI', country: 'IT' } })
    expect(billing.body.data.missing).toEqual([])
    expect((await api.post('invoices.php?action=billing', { profile: { vatNumber: '01234567890' } })).status).toBe(422)

    const ready = await api.post('invoices.php?action=finalize', { id })
    expect(ready.body.data.invoice).toMatchObject({ status: 'ready', number: expect.stringMatching(/^\d+\/\d{4}$/) })
    expect(ready.body.data.invoice.supplier.name).toBe('Studio Test S.r.l.')
    expect((await api.post('invoices.php?action=update', { id, invoice: { notes: 'late edit' } })).status).toBe(409)
    expect((await api.get(`projects.php?action=get&id=${projectId}`)).body.data.project.finance).toMatchObject({ invoiced: 370200, paid: 200000 })

    const xml = await api.get(`invoices.php?action=xml&id=${id}`)
    expect(xml.status).toBe(200)
    expect(String(xml.body)).toContain('<FormatoTrasmissione>FPR12</FormatoTrasmissione>')
    expect(String(xml.body)).toContain(`<Numero>${ready.body.data.invoice.number}</Numero>`)
    const afterXml = (await api.get(`invoices.php?action=get&id=${id}`)).body.data.invoice
    expect(afterXml.sdi.transmissionStatus).toBe('xml_generated')
    expect(afterXml.status).toBe('ready')
    expect((await api.post('invoices.php?action=set-status', { id, status: 'draft' })).status).toBe(409)

    expect((await api.post('invoices.php?action=record-sdi', { id, transmissionStatus: 'rejected', transmittedAt: '2026-10-08' })).status).toBe(422)
    const delivered = await api.post('invoices.php?action=record-sdi', { id, transmissionStatus: 'delivered', transmittedAt: '2026-10-08', sdiIdentifier: '123456789', receiptAt: '2026-10-08' })
    expect(delivered.body.data.invoice).toMatchObject({ status: 'issued', sdi: { transmissionStatus: 'delivered', receiptType: 'RC', sdiIdentifier: '123456789' } })

    const paid = await api.post('invoices.php?action=set-status', { id, status: 'paid', recordPayment: true, paymentDate: '2026-10-10', confirmOverpayment: true })
    expect(paid.body.data.invoice.status).toBe('paid')
    await api.post('invoices.php?action=set-status', { id, status: 'issued' })
    await api.post('invoices.php?action=set-status', { id, status: 'paid', recordPayment: true, paymentDate: '2026-10-10', confirmOverpayment: true })
    const project = (await api.get(`projects.php?action=get&id=${projectId}`)).body.data.project
    expect(project.payments.filter((p: { linkedInvoiceId: string | null }) => p.linkedInvoiceId === id)).toHaveLength(1)
    expect(project.finance.paid).toBe(200000 + 370200)

    const second = await api.post('invoices.php?action=create', { invoice: { lines, client } })
    const secondReady = await api.post('invoices.php?action=finalize', { id: second.body.data.invoice.id })
    const [n1, y1] = ready.body.data.invoice.number.split('/').map(Number)
    expect(secondReady.body.data.invoice.number).toBe(`${n1 + 1}/${y1}`)
    expect((await api.post('invoices.php?action=delete', { id: second.body.data.invoice.id })).status).toBe(409)
    const cancelIssued = await api.post('invoices.php?action=set-status', { id: second.body.data.invoice.id, status: 'cancelled' })
    expect(cancelIssued.body.data.invoice.status).toBe('cancelled')
  })

  test('a Fattura can start from an accepted Preventivo, in full or as a percentage', async () => {
    const proposal = await api.post('proposals.php?action=create', { proposal: { title: 'Fattura source', clientCode: 'FS', clientCompany: 'Rossi Srl', tax: { label: 'IVA', rate: 22 }, sections: [{ title: 'Web', note: '', items: [{ title: 'Design', description: '', quantity: 1, unit: 'fixed', unitPrice: 1000 }, { title: 'Build', description: '', quantity: 2, unit: 'day', unitPrice: 500 }, { title: 'Extra', description: '', quantity: 1, unit: 'fixed', unitPrice: 300, optional: true }] }] } })
    const propId = proposal.body.data.proposal.id
    expect(proposal.body.data.proposal.confidentiality).toMatch(/This document, including its structure/)
    expect((await api.post('invoices.php?action=create', { from: { proposalId: propId } })).status).toBe(422)
    await api.post('proposals.php?action=status', { id: propId, status: 'sent' })
    await api.post('proposals.php?action=status', { id: propId, status: 'accepted', project: 'none' })
    const all = await api.post('invoices.php?action=create', { from: { proposalId: propId, mode: 'items' } })
    expect(all.body.data.invoice.lines.map((l: { description: string }) => l.description)).toEqual(['A1) Design', 'A2) Build'])
    expect(all.body.data.invoice.totals.taxable).toBe(200000)
    expect(all.body.data.invoice.proposalId).toBe(propId)
    const deposit = await api.post('invoices.php?action=create', { from: { proposalId: propId, mode: 'percent', percent: 30 } })
    expect(deposit.body.data.invoice.lines).toHaveLength(1)
    expect(deposit.body.data.invoice.totals.taxable).toBe(60000)
  })
})
