'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Activity, AlertCircle, ArrowRight, BarChart3, CalendarClock, Copy, FileText, FolderKanban, Inbox, Radar, Sparkles, Users } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { LEAD_STATUSES, STAGE_LABEL } from '@/lib/admin/constants'
import { formatDateTime, formatDay, formatMoney, formatNumber, formatRelative, formatShortDay } from '@/lib/admin/format'
import { useNow, type AdminSection } from '@/lib/admin/hooks'
import type { DashboardSummary, LeadStatus } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { TrendChart } from '../ui/Charts'
import { EmptyState, Skeleton } from '../ui/Controls'
import { cx, focusRing } from '../ui/styles'
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

function Metric({ label, value, icon: Icon, tone, onClick, hint }: { label: string; value: ReactNode; icon: ComponentType<{ className?: string }>; tone: string; onClick?: () => void; hint?: ReactNode }) {
  const inner = (
    <>
      <span className={cx('hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex', tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-2xl dark:text-white">{value}</span>
        <span className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{label}</span>
        {hint && <span className="line-clamp-2 text-[11px] text-slate-400">{hint}</span>}
      </span>
    </>
  )
  const cls = 'flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 text-left transition-colors dark:border-white/[0.08] dark:bg-slate-900/60'
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(cls, 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20', focusRing)}>
      {inner}
    </button>
  ) : (
    <div className={cls}>{inner}</div>
  )
}

function Row({ title, subtitle, right, onClick }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button type="button" onClick={onClick} className={cx('flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04]', focusRing)}>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{title}</span>
          {subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</span>}
        </span>
        {right}
      </button>
    </li>
  )
}

function ListCard({ title, action, empty, children, count }: { title: string; action?: () => void; empty: string; children: ReactNode; count: number }) {
  return (
    <Card>
      <CardHeader
        title={title}
        actions={
          action && (
            <Button size="sm" variant="ghost" onClick={action}>
              All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )
        }
      />
      {count ? <ul className="divide-y divide-slate-100 px-2 pb-2 pt-2 dark:divide-white/[0.05]">{children}</ul> : <p className="px-5 pb-5 pt-3 text-sm text-slate-400">{empty}</p>}
    </Card>
  )
}

const sum = (values: Partial<Record<string, number>>) =>
  Object.entries(values)
    .map(([currency, cents]) => formatMoney(cents ?? 0, currency))
    .join(' + ') || '—'

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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-[74px]" />
        ))}
      </div>
    )
  }

  const t = data.totals
  const ops = data.ops
  const health = data.health
  const analytics = data.analytics
  const statusTotal = Math.max(1, t.leads)
  const rel = (iso: string) => formatRelative(iso, now || Date.parse(iso))
  const healthIssues = health ? health.counts.down + health.counts.warning : 0
  const openFeed = (item: NonNullable<DashboardSummary['feed']>[number]) => {
    if (item.entity === 'lead') openLead(item.entityId)
    else {
      const [section, param] = ({ inbox: ['inbox', 'inquiry'], project: ['projects', 'project'], proposal: ['proposals', 'proposal'] } as Record<string, [AdminSection, string]>)[item.entity]
      navigate(section, { [param]: item.entityId })
    }
  }

  return (
    <div className="space-y-6">
      {openBatches.length > 0 && (
        <section aria-label="Active discovery" className="space-y-3">
          {openBatches.slice(0, 2).map(batch => (
            <DiscoveryCard key={batch.id} batch={batch} compact />
          ))}
        </section>
      )}

      <section aria-labelledby="today-heading" className="space-y-3">
        <h2 id="today-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Today
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="New inquiries" value={ops ? ops.inbox.new : '—'} icon={Inbox} tone="bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300" onClick={() => navigate('inbox')} hint={ops?.inbox.failedDelivery ? `${ops.inbox.failedDelivery} not delivered by email` : undefined} />
          <Metric label="Follow-ups due" value={t.followUpsDue} icon={CalendarClock} tone="bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" onClick={() => navigate('followups')} />
          <Metric label="Active discoveries" value={openBatches.length} icon={Radar} tone="bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" onClick={() => navigate('find')} />
          <Metric
            label="Site-health issues"
            value={health ? healthIssues : '—'}
            icon={Activity}
            tone={healthIssues ? 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'}
            onClick={() => navigate('health')}
            hint={health ? (health.total ? `${health.total} monitor${health.total === 1 ? '' : 's'}` : 'No monitors yet') : 'Unavailable'}
          />
          <Metric
            label="Projects due soon"
            value={ops ? ops.projects.dueSoon + ops.projects.overdue : '—'}
            icon={FolderKanban}
            tone={ops?.projects.overdue ? 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'}
            onClick={() => navigate('projects')}
            hint={ops?.projects.overdue ? `${ops.projects.overdue} overdue` : undefined}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <ListCard title="New inquiries" action={() => navigate('inbox')} empty="No new inquiries." count={ops?.inbox.latest.length ?? 0}>
          {ops?.inbox.latest.map(item => (
            <Row key={item.id} title={item.name} subtitle={item.company || item.projectType || item.excerpt} right={<span className="shrink-0 text-xs text-slate-400">{rel(item.createdAt)}</span>} onClick={() => navigate('inbox', { inquiry: item.id })} />
          ))}
        </ListCard>
        <ListCard title="Upcoming follow-ups" action={() => navigate('followups')} empty="Nothing scheduled." count={data.upcomingFollowUps.length}>
          {data.upcomingFollowUps.slice(0, 5).map(item => (
            <Row key={item.id} title={item.companyName} subtitle={item.nextAction || formatDateTime(item.followUpAt)} right={<Badge tone={item.overdue ? 'red' : 'slate'}>{rel(item.followUpAt)}</Badge>} onClick={() => openLead(item.id)} />
          ))}
        </ListCard>
        <ListCard title="Needs attention" empty="Nothing urgent. Projects and monitored sites are on track." count={(ops?.projects.due.length ?? 0) + (health?.attention.length ?? 0)}>
          {health?.attention.map(m => (
            <Row key={m.id} title={m.name} subtitle={m.detail} right={<Badge tone={m.state === 'down' ? 'red' : 'amber'}>{m.state === 'down' ? 'Down' : 'Warning'}</Badge>} onClick={() => navigate('health', { monitor: m.id })} />
          ))}
          {ops?.projects.due.map(p => (
            <Row key={p.id} title={p.name} subtitle={[p.clientName, STAGE_LABEL[p.stage]].filter(Boolean).join(' · ')} right={<Badge tone={p.due === 'overdue' ? 'red' : 'amber'}>{p.due === 'overdue' ? 'Overdue' : `Due ${formatDay(p.targetDate)}`}</Badge>} onClick={() => navigate('projects', { project: p.id })} />
          ))}
        </ListCard>
      </div>

      <section aria-labelledby="business-heading" className="space-y-3">
        <h2 id="business-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Business
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metric label="Total leads" value={formatNumber(t.leads)} icon={Users} tone="bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300" onClick={() => navigate('leads')} hint={`${t.importedThisWeek} added this week`} />
          <Metric label="Active projects" value={ops ? ops.projects.active : '—'} icon={FolderKanban} tone="bg-indigo-100 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300" onClick={() => navigate('projects')} hint={ops ? `${ops.projects.inDevelopment} in development · ${ops.projects.inQa} in QA` : undefined} />
          <Metric label="Proposals awaiting reply" value={ops ? ops.proposals.sent : '—'} icon={FileText} tone="bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" onClick={() => navigate('proposals')} hint={ops && ops.proposals.sent ? sum(ops.proposals.sentValue) : undefined} />
          <Metric label="Accepted this month" value={ops ? ops.proposals.acceptedThisMonth : '—'} icon={Sparkles} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" onClick={() => navigate('proposals')} hint={ops && ops.proposals.draft ? `${ops.proposals.draft} draft${ops.proposals.draft === 1 ? '' : 's'} in progress` : undefined} />
          <Metric label="Open project value" value={ops ? sum(ops.projects.value) : '—'} icon={FolderKanban} tone="bg-teal-100 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300" onClick={() => navigate('projects')} hint={ops?.projects.recentlyDelivered ? `${ops.projects.recentlyDelivered} delivered in 30 days` : undefined} />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Lead pipeline" description={`${formatNumber(t.leads)} lead${t.leads === 1 ? '' : 's'} by status`} actions={data.pendingDuplicates > 0 ? <Button size="sm" variant="subtle" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => navigate('duplicates')}>{data.pendingDuplicates} duplicates to review</Button> : undefined} />
          {t.leads === 0 ? (
            <EmptyState
              icon={<Sparkles className="h-5 w-5" />}
              title="No leads yet"
              description="Start a discovery to find businesses, or import an existing CSV from the Leads page."
              action={
                <Button variant="primary" onClick={() => navigate('find')}>
                  Find leads
                </Button>
              }
            />
          ) : (
            <div className="px-5 pb-5 pt-4">
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]" role="img" aria-label={LEAD_STATUSES.map(s => `${s.label}: ${data.byStatus[s.value]}`).join(', ')}>
                {LEAD_STATUSES.map(s => (data.byStatus[s.value] ? <div key={s.value} className={STATUS_BAR[s.value]} style={{ width: `${(data.byStatus[s.value] / statusTotal) * 100}%` }} /> : null))}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {LEAD_STATUSES.map(s => (
                  <li key={s.value}>
                    <button type="button" onClick={() => navigate('leads', { status: s.value })} className={cx('flex w-full cursor-pointer items-center gap-2 rounded-md py-0.5 text-left text-xs', focusRing)}>
                      <span className={cx('h-2 w-2 shrink-0 rounded-full', STATUS_BAR[s.value])} aria-hidden="true" />
                      <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{s.label}</span>
                      <span className="font-medium tabular-nums text-slate-900 dark:text-white">{data.byStatus[s.value]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
        <ListCard title="Proposals awaiting reply" action={() => navigate('proposals')} empty="No proposals out right now." count={ops?.proposals.awaiting.length ?? 0}>
          {ops?.proposals.awaiting.map(p => (
            <Row
              key={p.id}
              title={p.title}
              subtitle={`${p.number} · ${p.clientCompany || p.clientName || '—'}${p.sentAt ? ` · sent ${rel(p.sentAt)}` : ''}`}
              right={p.pastValidity ? <Badge tone="amber">Past validity</Badge> : <span className="shrink-0 text-xs font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatMoney(p.total, p.currency)}</span>}
              onClick={() => navigate('proposals', { proposal: p.id })}
            />
          ))}
        </ListCard>
      </div>

      <section aria-labelledby="growth-heading" className="space-y-3">
        <h2 id="growth-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Growth · last 7 days
        </h2>
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Website traffic"
              description={analytics ? `${formatNumber(analytics.totals.pageViews)} page views · ${formatNumber(analytics.totals.sessions)} sessions` : 'Analytics unavailable'}
              actions={
                <Button size="sm" variant="ghost" icon={<BarChart3 className="h-3.5 w-3.5" />} onClick={() => navigate('analytics')}>
                  Analytics
                </Button>
              }
            />
            <div className="px-3 pb-4 pt-2 sm:px-5">
              {analytics && analytics.totals.pageViews > 0 ? (
                <TrendChart points={analytics.series.map(d => ({ label: d.date, values: [d.pageViews] }))} series={['Page views']} height={120} formatLabel={formatShortDay} />
              ) : (
                <p className="py-6 text-center text-sm text-slate-400">No visits recorded in the last 7 days.</p>
              )}
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <Metric label="Contact submissions" value={analytics ? analytics.totals.contactSubmits : '—'} icon={Inbox} tone="bg-sky-100 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300" onClick={() => navigate('analytics')} hint={analytics?.totals.contactConversionRate !== null && analytics ? `${analytics.totals.contactConversionRate}% of sessions` : undefined} />
            <Metric label="Launcher completions" value={analytics ? analytics.totals.launcherCompletes : '—'} icon={Sparkles} tone="bg-violet-100 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300" onClick={() => navigate('analytics')} hint={analytics?.totals.launcherConversionRate !== null && analytics ? `${analytics.totals.launcherConversionRate}% of sessions` : undefined} />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader title="Recent activity" description="Across leads, inquiries, projects and proposals" />
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
    </div>
  )
}
