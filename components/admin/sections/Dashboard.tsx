'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, BarChart3, CalendarClock, CalendarDays, CalendarPlus, CheckCircle2, Copy, FilePlus2, FileText, FolderKanban, FolderPlus, Inbox, ListChecks, UserPlus, Wallet } from 'lucide-react'
import { dueText, groupByDay, itemTime, relativeDayLabel } from '@/lib/admin/agenda'
import { api } from '@/lib/admin/api'
import { LEAD_STATUSES, PROPOSAL_STATUSES, STAGE_LABEL, WORKFLOW_GROUPS } from '@/lib/admin/constants'
import { formatMoney, formatNumber, formatRelative, formatShortDay } from '@/lib/admin/format'
import { useNow, type AdminSection } from '@/lib/admin/hooks'
import type { AttentionItem, AttentionUrgency, DashboardSummary, LeadStatus, Money } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { TrendChart } from '../ui/Charts'
import { EmptyState, Skeleton } from '../ui/Controls'
import { cx, focusRing } from '../ui/styles'
import { SourceTag, useOpenAgendaLink } from './agenda/AgendaParts'
import DiscoveryCard from './DiscoveryCard'

const STATUS_BAR: Record<LeadStatus, string> = {
  new: 'bg-sky-500',
  contacted: 'bg-indigo-500',
  follow_up: 'bg-amber-400',
  interested: 'bg-teal-500',
  proposal: 'bg-violet-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-400'
}

const URGENCY: Record<AttentionUrgency, { heading: string; badge: string; tone: 'red' | 'amber' | 'blue' | 'slate' }> = {
  overdue: { heading: 'Overdue', badge: 'Overdue', tone: 'red' },
  issue: { heading: 'Site issues', badge: 'Issue', tone: 'red' },
  today: { heading: 'Today', badge: 'Today', tone: 'amber' },
  new: { heading: 'New inquiries', badge: 'New', tone: 'blue' },
  soon: { heading: 'Due this week', badge: 'Soon', tone: 'slate' }
}

const ACTION_LABEL: Record<AttentionItem['link']['type'], string> = {
  lead: 'Open lead',
  project: 'Open project',
  proposal: 'Open proposal',
  event: 'Open event',
  inbox: 'Open inquiry',
  health: 'Open monitor'
}

const money = (values: Money) =>
  Object.entries(values)
    .map(([currency, cents]) => formatMoney(cents ?? 0, currency))
    .join(' + ') || '—'

function Kpi({ label, value, icon: Icon, onClick, hint, alert }: { label: string; value: ReactNode; icon: ComponentType<{ className?: string }>; onClick: () => void; hint?: ReactNode; alert?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 dark:border-white/[0.08] dark:bg-slate-900/60 dark:hover:border-white/20',
        focusRing
      )}
    >
      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      <span className={cx('mt-1 truncate text-xl font-semibold tabular-nums tracking-tight', alert ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>{value}</span>
      {hint && <span className="truncate text-[11px] text-slate-400">{hint}</span>}
    </button>
  )
}

function statusDetail(item: AttentionItem) {
  if (item.source === 'health') return item.status === 'down' ? 'Down' : 'Warning'
  if (item.source === 'inbox') return item.status === 'delivery_failed' ? 'Email delivery failed' : 'Not triaged yet'
  return null
}

function AttentionList({ data, now }: { data: DashboardSummary; now: number }) {
  const open = useOpenAgendaLink()
  const [expanded, setExpanded] = useState(false)
  const { items, total } = data.attention
  const visible = expanded ? items : items.slice(0, 8)
  const groups = (Object.keys(URGENCY) as AttentionUrgency[]).map(urgency => ({ urgency, items: visible.filter(item => item.urgency === urgency) })).filter(group => group.items.length)

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Needs attention"
        description={total ? `${total} item${total === 1 ? '' : 's'} across leads, projects, proposals, inbox and sites` : 'Overdue work, today’s deadlines and new inquiries'}
      />
      {!total ? (
        <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="All clear" description="Nothing overdue or due today. Upcoming dates are listed on the right." />
      ) : (
        <div className="px-2 pb-2 pt-2">
          {groups.map(group => (
            <section key={group.urgency} aria-label={URGENCY[group.urgency].heading} className="mt-1 first:mt-0">
              <h3 className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                {URGENCY[group.urgency].heading} <span className="tabular-nums">· {data.attention.counts[group.urgency]}</span>
              </h3>
              <ul className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {group.items.map(item => {
                  const detail = statusDetail(item)
                  return (
                    <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2.5 sm:flex-nowrap">
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SourceTag source={item.source} />
                          <Badge tone={item.urgency === 'issue' && item.status === 'warning' ? 'amber' : URGENCY[item.urgency].tone}>{item.urgency === 'issue' ? (item.status === 'down' ? 'Down' : 'Warning') : URGENCY[item.urgency].badge}</Badge>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-white">
                          {item.context && (item.source === 'task' || item.source === 'milestone') ? `${item.context} — ${item.title}` : item.title}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {item.source === 'inbox'
                            ? [item.context, detail, now && item.at ? formatRelative(item.at, now) : null].filter(Boolean).join(' · ')
                            : item.source === 'health'
                              ? item.context || detail
                              : [dueText(item, data.today), item.source === 'task' || item.source === 'milestone' ? null : item.context].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => open(item.link)} className="shrink-0">
                        {ACTION_LABEL[item.link.type]}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          {items.length > 8 && (
            <div className="px-3 pb-2 pt-1">
              <button type="button" onClick={() => setExpanded(e => !e)} className={cx('cursor-pointer rounded text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white', focusRing)}>
                {expanded ? 'Show fewer' : `Show all ${items.length}${total > items.length ? ` of ${total}` : ''}`}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function Upcoming({ data }: { data: DashboardSummary }) {
  const { navigate } = useAdmin()
  const open = useOpenAgendaLink()
  const days = [...groupByDay(data.upcoming, data.today, '9999-12-31').entries()].slice(0, 7)
  return (
    <Card>
      <CardHeader
        title="Upcoming"
        description="Next 14 days"
        actions={
          <Button size="sm" variant="ghost" onClick={() => navigate('calendar')}>
            Calendar <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        }
      />
      {!days.length ? (
        <p className="px-5 pb-5 pt-3 text-sm text-slate-400">Nothing scheduled in the next two weeks.</p>
      ) : (
        <div className="space-y-3 px-2 pb-3 pt-3">
          {days.map(([day, items]) => (
            <section key={day} aria-label={relativeDayLabel(day, data.today)}>
              <h3 className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{relativeDayLabel(day, data.today)}</h3>
              <ul className="mt-1">
                {items.map(item => (
                  <li key={item.id}>
                    <button type="button" onClick={() => open(item.link)} className={cx('flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04]', focusRing)}>
                      <SourceTag source={item.source} label="" className="mt-0.5 px-1" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-800 dark:text-slate-100">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[itemTime(item), item.context].filter(Boolean).join(' · ') || ' '}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}

function Pipeline({ data }: { data: DashboardSummary }) {
  const { navigate } = useAdmin()
  const { leads, proposals, projects } = data.pipeline
  const leadTotal = Math.max(1, data.totals.leads)
  const row = 'flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-left text-xs hover:bg-slate-50 dark:hover:bg-white/[0.04]'
  return (
    <Card>
      <CardHeader
        title="Pipeline"
        description="Leads, proposals and projects as they stand today"
        actions={
          data.pendingDuplicates > 0 ? (
            <Button size="sm" variant="subtle" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => navigate('duplicates')}>
              {data.pendingDuplicates} duplicates to review
            </Button>
          ) : undefined
        }
      />
      <div className="grid grid-cols-1 gap-6 px-5 pb-5 pt-4 md:grid-cols-3">
        <section aria-label="Leads by status">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Leads · {formatNumber(data.totals.leads)}</h3>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]" role="img" aria-label={LEAD_STATUSES.map(s => `${s.label}: ${leads[s.value]}`).join(', ')}>
            {LEAD_STATUSES.map(s => (leads[s.value] ? <div key={s.value} className={STATUS_BAR[s.value]} style={{ width: `${(leads[s.value] / leadTotal) * 100}%` }} /> : null))}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3">
            {LEAD_STATUSES.map(s => (
              <li key={s.value}>
                <button type="button" onClick={() => navigate('leads', { status: s.value })} className={cx(row, focusRing)}>
                  <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_BAR[s.value])} aria-hidden="true" />
                  <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{s.label}</span>
                  <span className="font-medium tabular-nums text-slate-900 dark:text-white">{leads[s.value]}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Proposals by status">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Proposals</h3>
          <ul className="mt-2">
            {PROPOSAL_STATUSES.map(s => (
              <li key={s.value}>
                <button type="button" onClick={() => navigate('proposals')} className={cx(row, focusRing)}>
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="flex-1 truncate text-right tabular-nums text-slate-500 dark:text-slate-400">{proposals[s.value].count ? money(proposals[s.value].value) : ''}</span>
                  <span className="w-6 text-right font-medium tabular-nums text-slate-900 dark:text-white">{proposals[s.value].count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section aria-label="Projects by group">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Projects</h3>
          <ul className="mt-2">
            {WORKFLOW_GROUPS.map(group => {
              const count = group.stages.reduce((sum, stage) => sum + projects[stage], 0)
              const detail = group.stages.filter(stage => projects[stage]).map(stage => `${projects[stage]} ${STAGE_LABEL[stage]}`).join(' · ')
              return (
                <li key={group.id}>
                  <button type="button" onClick={() => navigate('projects')} className={cx(row, 'items-start', focusRing)}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-slate-700 dark:text-slate-200">{group.label}</span>
                      <span className="block truncate text-[11px] text-slate-400">{detail || 'None'}</span>
                    </span>
                    <span className="font-medium tabular-nums text-slate-900 dark:text-white">{count}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </Card>
  )
}

const QUICK_ACTIONS: { label: string; icon: ComponentType<{ className?: string }>; section: AdminSection }[] = [
  { label: 'New lead', icon: UserPlus, section: 'leads' },
  { label: 'New proposal', icon: FilePlus2, section: 'proposals' },
  { label: 'New project', icon: FolderPlus, section: 'projects' },
  { label: 'New event', icon: CalendarPlus, section: 'calendar' }
]

const todayHeading = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export default function Dashboard() {
  const { dataVersion, navigate, openLead, openBatches } = useAdmin()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const now = useNow(30000)

  useEffect(() => {
    let cancelled = false
    api
      .dashboard()
      .then(result => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [dataVersion])

  if (error && !data) {
    return (
      <Card>
        <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Overview unavailable" description={error} />
      </Card>
    )
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px]" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  const k = data.kpis
  const analytics = data.analytics
  const rel = (iso: string) => formatRelative(iso, now || Date.parse(iso))
  const openFeed = (item: NonNullable<DashboardSummary['feed']>[number]) => {
    if (item.entity === 'lead') openLead(item.entityId)
    else {
      const [section, param] = ({ inbox: ['inbox', 'inquiry'], project: ['projects', 'project'], proposal: ['proposals', 'proposal'] } as Record<string, [AdminSection, string]>)[item.entity]
      navigate(section, { [param]: item.entityId })
    }
  }

  return (
    <div className="space-y-5">
      {openBatches.length > 0 && (
        <section aria-label="Active discovery" className="space-y-3">
          {openBatches.slice(0, 2).map(batch => (
            <DiscoveryCard key={batch.id} batch={batch} compact />
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Today</h2>
          <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{todayHeading.format(new Date(`${data.today}T12:00:00`))}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick actions">
          {QUICK_ACTIONS.map(action => (
            <Button key={action.label} size="sm" variant="ghost" icon={<action.icon className="h-3.5 w-3.5" />} onClick={() => navigate(action.section, { new: '1' })}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <section aria-label="Business snapshot" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Active projects" value={k.activeProjects} icon={FolderKanban} onClick={() => navigate('projects')} />
        <Kpi label="Open pipeline value" value={money(k.pipelineValue)} icon={Wallet} onClick={() => navigate('projects')} hint="Active projects" />
        <Kpi label="Proposals awaiting" value={k.proposalsAwaiting} icon={FileText} onClick={() => navigate('proposals')} hint={k.proposalsAwaiting ? money(k.proposalsAwaitingValue) : undefined} />
        <Kpi label="Follow-ups due" value={k.followUpsDue} icon={CalendarClock} onClick={() => navigate('followups')} alert={k.followUpsDue > 0} hint="Overdue or today" />
        <Kpi label="Overdue tasks" value={k.overdueTasks} icon={ListChecks} onClick={() => navigate('calendar')} alert={k.overdueTasks > 0} />
        <Kpi label="Unread inbox" value={k.unreadInbox} icon={Inbox} onClick={() => navigate('inbox')} hint={k.inboxFailed ? `${k.inboxFailed} not delivered by email` : undefined} />
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <AttentionList data={data} now={now} />
        <Upcoming data={data} />
      </div>

      <Pipeline data={data} />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" description="Status changes, completions and conversions" />
          {data.feed?.length ? (
            <ul className="grid grid-cols-1 gap-x-4 px-2 pb-3 pt-2 md:grid-cols-2">
              {data.feed.map(item => (
                <li key={item.id}>
                  <button type="button" onClick={() => openFeed(item)} className={cx('w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04]', focusRing)}>
                    <span className="flex items-center gap-2">
                      <Badge tone={item.entity === 'lead' ? 'blue' : item.entity === 'inbox' ? 'teal' : item.entity === 'project' ? 'indigo' : 'purple'}>{item.entity === 'inbox' ? 'Inquiry' : item.entity[0].toUpperCase() + item.entity.slice(1)}</Badge>
                      <span className="truncate text-sm text-slate-800 dark:text-slate-100">{item.label ?? 'Deleted record'}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.message} · {rel(item.at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-5 pt-3 text-sm text-slate-400">No activity yet.</p>
          )}
        </Card>
        <Card>
          <CardHeader
            title="Website · last 7 days"
            description={analytics ? `${formatNumber(analytics.totals.pageViews)} views · ${analytics.totals.contactSubmits} contact submissions` : 'Analytics unavailable'}
            actions={
              <Button size="sm" variant="ghost" icon={<BarChart3 className="h-3.5 w-3.5" />} onClick={() => navigate('analytics')}>
                Analytics
              </Button>
            }
          />
          <div className="px-3 pb-4 pt-2 sm:px-5">
            {analytics && analytics.totals.pageViews > 0 ? (
              <TrendChart points={analytics.series.map(d => ({ label: d.date, values: [d.pageViews] }))} series={['Page views']} height={110} formatLabel={formatShortDay} />
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">No visits recorded in the last 7 days.</p>
            )}
          </div>
        </Card>
      </div>

      {data.monitors === 0 && (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" /> No sites are monitored yet — add one in Site Health to see outages here.
        </p>
      )}
    </div>
  )
}
