import { expect, test } from '@playwright/test'
import { loginApi, type Api } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

let api: Api
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10)
const tz = '&tzOffset=0'

async function createLead(fields: Record<string, unknown>) {
  const res = await api.post('leads.php?action=create', { lead: fields, force: true })
  expect(res.status, JSON.stringify(res.body)).toBe(200)
  return res.body.data.lead
}

test.beforeAll(async () => {
  api = await loginApi()
})

test.describe('calendar', () => {
  test('manual events: validation, create, update, list by range, delete', async () => {
    expect((await api.post('calendar.php?action=event-create', { event: { title: '', allDay: true, start: day(1) } })).status).toBe(422)
    expect((await api.post('calendar.php?action=event-create', { event: { title: 'Bad', allDay: true, start: day(2), end: day(1) } })).status).toBe(422)
    expect((await api.get(`calendar.php?action=list&from=${day(0)}&to=${day(400)}`)).status).toBe(422)

    const created = await api.post('calendar.php?action=event-create', { event: { title: '<b>Trade fair</b>', allDay: true, start: day(3), end: day(4), category: 'meeting', notes: 'Stand 12' } })
    expect(created.status).toBe(200)
    const event = created.body.data.event
    expect(event).toMatchObject({ title: '<b>Trade fair</b>', start: day(3), end: day(4), allDay: true, category: 'meeting' })

    const list = (await api.get(`calendar.php?action=list&from=${day(0)}&to=${day(10)}${tz}`)).body.data
    const item = list.items.find((i: { id: string }) => i.id === `event:${event.id}`)
    expect(item).toMatchObject({ source: 'event', date: day(3), endDate: day(4), link: { type: 'event', id: event.id } })
    expect((await api.get(`calendar.php?action=list&from=${day(5)}&to=${day(10)}${tz}`)).body.data.items.some((i: { id: string }) => i.id === `event:${event.id}`)).toBe(false)

    const updated = await api.post('calendar.php?action=event-update', { id: event.id, event: { title: 'Client call', allDay: false, start: `${day(5)}T14:00:00Z`, end: `${day(5)}T15:00:00Z`, category: 'call' } })
    expect(updated.body.data.event).toMatchObject({ title: 'Client call', allDay: false, start: `${day(5)}T14:00:00Z`, createdAt: event.createdAt })
    const timed = (await api.get(`calendar.php?action=list&from=${day(5)}&to=${day(5)}${tz}`)).body.data.items.find((i: { id: string }) => i.id === `event:${event.id}`)
    expect(timed).toMatchObject({ allDay: false, at: `${day(5)}T14:00:00Z`, date: day(5) })

    expect((await api.post('calendar.php?action=event-delete', { id: event.id })).body.data.deleted).toBe(true)
    expect((await api.get(`calendar.php?action=event&id=${event.id}`)).status).toBe(404)
    expect((await api.post('calendar.php?action=event-delete', { id: 'evt_zz' })).status).toBe(422)
  })

  test('source records appear on their dates and link to the real record', async () => {
    const lead = await createLead({ companyName: 'Calendar Lead Co', followUpAt: `${day(2)}T09:00:00Z` })
    const project = (await api.post('projects.php?action=create', { project: { name: 'Calendar Project', clientName: 'Calendar Client', stage: 'development', targetDate: day(6) } })).body.data.project
    const withTask = (await api.post('projects.php?action=task-create', { projectId: project.id, task: { title: 'Calendar task', dueDate: day(4) } })).body.data.project
    const task = withTask.tasks.find((t: { title: string }) => t.title === 'Calendar task')
    const proposal = (await api.post('proposals.php?action=create', { proposal: { title: 'Calendar proposal', clientCode: 'CAL', clientCompany: 'Calendar Client', validUntil: day(5), sections: [{ title: 'Web', note: '', items: [{ title: 'Site', description: '', quantity: 1, unit: 'fixed', unitPrice: 100 }] }] } })).body.data.proposal

    const items = (await api.get(`calendar.php?action=list&from=${day(0)}&to=${day(10)}${tz}`)).body.data.items as { id: string; date: string; link: { type: string; id: string; tab: string | null } }[]
    const find = (id: string) => items.find(i => i.id === id)
    expect(find(`lead:${lead.id}`)).toMatchObject({ date: day(2), link: { type: 'lead', id: lead.id } })
    expect(find(`task:${task.id}`)).toMatchObject({ date: day(4), link: { type: 'project', id: project.id, tab: 'tasks' } })
    expect(find(`project:${project.id}`)).toMatchObject({ date: day(6), link: { type: 'project', id: project.id } })
    expect(find(`proposal:${proposal.id}`)).toMatchObject({ date: day(5), link: { type: 'proposal', id: proposal.id } })
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)

    await api.post('projects.php?action=task-update', { projectId: project.id, id: task.id, changes: { status: 'done' } })
    const after = (await api.get(`calendar.php?action=list&from=${day(4)}&to=${day(4)}${tz}`)).body.data.items.find((i: { id: string }) => i.id === `task:${task.id}`)
    expect(after.done).toBe(true)
  })
})

test.describe('overview', () => {
  test('attention aggregates overdue and today items once, with deep links; upcoming never repeats them', async () => {
    const overdueLead = await createLead({ companyName: 'Overdue Follow Co', followUpAt: `${day(-2)}T09:00:00Z` })
    const project = (await api.post('projects.php?action=create', { project: { name: 'Overview Project', clientName: 'Aurora Fitness', stage: 'development', targetDate: day(20) } })).body.data.project
    const created = (await api.post('projects.php?action=task-create', { projectId: project.id, task: { title: 'Deploy production', dueDate: day(-1) } })).body.data.project
    const task = created.tasks.find((t: { title: string }) => t.title === 'Deploy production')
    await api.post('projects.php?action=milestone-create', { projectId: project.id, milestone: { title: 'Launch review', dueDate: day(9) } })

    const summary = (await api.get(`dashboard.php?action=summary${tz}`)).body.data
    const items = summary.attention.items as { id: string; urgency: string; link: { type: string; id: string; tab: string | null } }[]
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)
    expect(items.find(i => i.id === `lead:${overdueLead.id}`)).toMatchObject({ urgency: 'overdue', link: { type: 'lead', id: overdueLead.id } })
    expect(items.find(i => i.id === `task:${task.id}`)).toMatchObject({ urgency: 'overdue', link: { type: 'project', id: project.id, tab: 'tasks' } })
    const upcomingIds = (summary.upcoming as { id: string }[]).map(i => i.id)
    expect(upcomingIds.filter(id => items.some(i => i.id === id))).toEqual([])
    expect(upcomingIds.some(id => id.startsWith('milestone:'))).toBe(true)
    expect(summary.kpis.overdueTasks).toBeGreaterThanOrEqual(1)
    expect(summary.kpis.followUpsDue).toBeGreaterThanOrEqual(1)
    expect(Object.keys(summary.pipeline.projects)).toContain('maintenance')
    expect(summary.attention.counts.overdue).toBeGreaterThanOrEqual(2)
  })
})

test.describe('lead forge', () => {
  test('saved views: update filters, set and clear the default', async () => {
    const created = (await api.post('saved-views.php?action=create', { name: 'Genoa prospects', filters: { city: 'Genova', noWebsite: true } })).body.data
    const id = created.view.id
    expect(created.view).toMatchObject({ isDefault: false, filters: { city: 'Genova', noWebsite: true, minScore: 0, followUp: '' } })
    const updated = (await api.post('saved-views.php?action=update', { id, filters: { city: 'Genova', minScore: 70, followUp: 'overdue', hasPhone: true } })).body.data.views
    expect(updated.find((v: { id: string }) => v.id === id)).toMatchObject({ name: 'Genoa prospects', filters: { minScore: 70, followUp: 'overdue', hasPhone: true, noWebsite: false } })
    let views = (await api.post('saved-views.php?action=set-default', { id })).body.data.views as { id: string; isDefault: boolean }[]
    expect(views.filter(v => v.isDefault).map(v => v.id)).toEqual([id])
    views = (await api.post('saved-views.php?action=set-default', { id: null })).body.data.views
    expect(views.some(v => v.isDefault)).toBe(false)
    await api.post('saved-views.php?action=delete', { id })
  })

  test('follow-up filters, completing with a next follow-up, bulk clear and conversion metrics', async () => {
    const a = await createLead({ companyName: 'FU Overdue', phone: '+39 010 111 2222', followUpAt: `${day(-1)}T08:00:00Z` })
    const b = await createLead({ companyName: 'FU Upcoming', followUpAt: `${day(3)}T08:00:00Z` })
    const list = async (query: string) => ((await api.get(`leads.php?action=list&pageSize=100${tz}&${query}`)).body.data.items as { id: string }[]).map(i => i.id)
    expect(await list('followUp=overdue')).toContain(a.id)
    expect(await list('followUp=overdue')).not.toContain(b.id)
    expect(await list('followUp=upcoming')).toContain(b.id)
    expect(await list('hasPhone=1&q=FU')).toEqual([a.id])

    const next = `${day(7)}T09:00:00.000Z`
    const done = (await api.post('leads.php?action=complete-follow-up', { id: a.id, next, nextAction: 'Send mock-up' })).body.data
    expect(done.lead).toMatchObject({ followUpAt: `${day(7)}T09:00:00Z`, followUpCompletedAt: null, nextAction: 'Send mock-up' })
    expect(done.activities.map((x: { type: string }) => x.type)).toEqual(expect.arrayContaining(['follow_up_completed', 'follow_up_scheduled']))
    expect(await list('followUp=overdue')).not.toContain(a.id)

    expect((await api.post('leads.php?action=bulk', { ids: [a.id, b.id], op: 'followUp', value: null })).body.data.updated).toBe(2)
    expect(await list('followUp=none&q=FU')).toEqual(expect.arrayContaining([a.id, b.id]))
    expect((await api.post('leads.php?action=bulk', { ids: Array.from({ length: 5001 }, (_, i) => `lead_${i.toString(16).padStart(16, '0')}`), op: 'status', value: 'won' })).status).toBe(422)

    await api.post('proposals.php?action=create', { proposal: { title: 'Linked', clientCode: 'LF', leadId: b.id, sections: [{ title: 'Web', note: '', items: [{ title: 'Site', description: '', quantity: 1, unit: 'fixed', unitPrice: 100 }] }] } })
    const stats = (await api.get(`leads.php?action=stats${tz}`)).body.data
    expect(stats.total).toBe(stats.active + stats.byStatus.won + stats.byStatus.lost)
    expect(stats.converted.proposal).toBeGreaterThanOrEqual(1)
    expect(stats.rates.toProposal).toBeCloseTo((stats.converted.proposal * 100) / stats.total, 0)
    expect(stats.scoreBands.high + stats.scoreBands.medium + stats.scoreBands.low).toBe(stats.total)
  })
})
