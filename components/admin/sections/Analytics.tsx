'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle, ArrowDownRight, ArrowUpRight, BarChart3, RefreshCw, ShieldCheck } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatNumber } from '@/lib/admin/format'
import type { AnalyticsSummary, CountItem } from '@/lib/admin/types'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { BarList, TrendChart } from '../ui/Charts'
import { EmptyState, Skeleton, Tabs } from '../ui/Controls'
import { cx, fieldBase } from '../ui/styles'

type Preset = 'today' | '7' | '30' | '90' | 'custom'
type Tab = 'overview' | 'traffic' | 'conversions' | 'pages'

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'custom', label: 'Custom' }
]

const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const dayLabel = (date: string) => shortDay.format(new Date(`${date}T00:00:00Z`))

function utcDay(offsetDays = 0) {
  return new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10)
}

function rangeFor(preset: Preset, custom: { from: string; to: string }): { from: string; to: string } | null {
  if (preset === 'custom') return custom.from && custom.to && custom.from <= custom.to ? custom : null
  const days = preset === 'today' ? 1 : Number(preset)
  return { from: utcDay(days - 1), to: utcDay() }
}

const pretty = (label: string) => label.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return current > 0 ? <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">New</span> : null
  const change = ((current - previous) / previous) * 100
  if (Math.abs(change) < 0.5) return <span className="text-[11px] text-slate-400">No change</span>
  const up = change > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cx('inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums', up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
      <Icon aria-hidden="true" className="h-3 w-3" />
      {Math.abs(change).toFixed(0)}%<span className="sr-only"> {up ? 'more' : 'less'} than the previous period</span>
    </span>
  )
}

function Stat({ label, value, hint, delta }: { label: string; value: string; hint?: ReactNode; delta?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/60">
      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
      <div className="mt-1 flex min-h-4 items-center gap-2 text-[11px] text-slate-400">
        {delta}
        {hint}
      </div>
    </div>
  )
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 0)
  return (
    <ol className="space-y-3 px-5 pb-5 pt-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value : null
        const rate = prev ? Math.round((step.value / prev) * 100) : null
        return (
          <li key={step.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">{step.label}</span>
              <span className="tabular-nums text-slate-500">
                {formatNumber(step.value)}
                {rate !== null && <span className="ml-1.5 text-slate-400">({rate}% of previous)</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-purple)]"
                style={{ width: `${Math.max(step.value ? 2 : 0, (step.value / top) * 100)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ListCard({ title, description, items, empty, prettify }: { title: string; description?: string; items: CountItem[]; empty: string; prettify?: boolean }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <BarList items={prettify ? items.map(i => ({ ...i, label: pretty(i.label) })) : items} empty={empty} />
    </Card>
  )
}

export default function Analytics() {
  const [preset, setPreset] = useState<Preset>('7')
  const [custom, setCustom] = useState({ from: '', to: '' })
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reload, setReload] = useState(0)
  const customInvalid = preset === 'custom' && !!custom.from && !!custom.to && custom.from > custom.to

  useEffect(() => {
    const range = rangeFor(preset, custom)
    if (!range) return
    const controller = new AbortController()
    queueMicrotask(() => !controller.signal.aborted && setLoading(true))
    api
      .analytics(range.from, range.to, controller.signal)
      .then(result => {
        setData(result)
        setError(null)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => !controller.signal.aborted && setLoading(false))
    return () => controller.abort()
  }, [preset, custom, reload])

  const t = data?.totals
  const hasData = !!t && (t.pageViews > 0 || t.sessions > 0)
  const rate = (value: number | null) => (value === null ? '—' : `${value}%`)

  const controls = (
    <div className="flex flex-wrap items-end gap-3">
      <Tabs label="Date range" tabs={PRESETS} value={preset} onChange={setPreset} />
      {preset === 'custom' && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">
            <span className="mb-1 block">From</span>
            <input type="date" value={custom.from} max={custom.to || undefined} onChange={e => setCustom(c => ({ ...c, from: e.target.value }))} className={cx(fieldBase, 'h-9 w-40')} aria-label="From date" />
          </label>
          <label className="text-xs text-slate-500 dark:text-slate-400">
            <span className="mb-1 block">To</span>
            <input type="date" value={custom.to} min={custom.from || undefined} onChange={e => setCustom(c => ({ ...c, to: e.target.value }))} className={cx(fieldBase, 'h-9 w-40')} aria-label="To date" />
          </label>
        </div>
      )}
      <Button variant="ghost" size="sm" icon={<RefreshCw className={cx('h-3.5 w-3.5', loading && 'animate-spin motion-reduce:animate-none')} />} onClick={() => setReload(n => n + 1)} disabled={loading}>
        Refresh
      </Button>
    </div>
  )

  let body: ReactNode
  if (preset === 'custom' && !rangeFor(preset, custom)) {
    body = (
      <Card>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title={customInvalid ? 'The start date is after the end date' : 'Choose a date range'}
          description="Pick a start and end date (up to one year) to see analytics for that period."
        />
      </Card>
    )
  } else if (error && !data) {
    body = (
      <Card>
        <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Analytics unavailable" description={error} action={<Button variant="secondary" onClick={() => setReload(n => n + 1)}>Try again</Button>} />
      </Card>
    )
  } else if (!data || !t) {
    body = (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px]" />
        ))}
        <Skeleton className="col-span-2 h-64 lg:col-span-4" />
      </div>
    )
  } else if (!hasData) {
    body = (
      <Card>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" />}
          title="No visits recorded in this period"
          description="Analytics start counting once the public site is deployed with the tracker. Visitors with Do Not Track or Global Privacy Control enabled are never counted."
        />
      </Card>
    )
  } else {
    const points = data.series.map(d => ({ label: d.date, values: [d.pageViews, d.sessions] }))
    const conversionPoints = data.series.map(d => ({ label: d.date, values: [d.contactSubmits, d.launcherCompletes] }))
    body = (
      <div className={cx('space-y-4 transition-opacity', loading && 'opacity-60')} aria-busy={loading}>
        {data.unreadableDays.length > 0 && (
          <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            {data.unreadableDays.length} day{data.unreadableDays.length > 1 ? 's' : ''} could not be read and {data.unreadableDays.length > 1 ? 'are' : 'is'} excluded: {data.unreadableDays.join(', ')}.
          </p>
        )}

        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Page views" value={formatNumber(t.pageViews)} delta={<Delta current={t.pageViews} previous={data.previous.pageViews} />} />
              <Stat label="Sessions" value={formatNumber(t.sessions)} delta={<Delta current={t.sessions} previous={data.previous.sessions} />} />
              <Stat label="Contact submissions" value={formatNumber(t.contactSubmits)} delta={<Delta current={t.contactSubmits} previous={data.previous.contactSubmits} />} hint={`${rate(t.contactConversionRate)} of sessions`} />
              <Stat label="Launcher completions" value={formatNumber(t.launcherCompletes)} delta={<Delta current={t.launcherCompletes} previous={data.previous.launcherCompletes} />} hint={`${rate(t.launcherConversionRate)} of sessions`} />
            </div>
            <Card>
              <CardHeader title="Traffic" description="Page views (solid) and sessions (dashed) per day, UTC." />
              <div className="px-3 pb-4 pt-2 sm:px-5">
                <TrendChart points={points} series={['Page views', 'Sessions']} formatLabel={dayLabel} />
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ListCard title="Top pages" items={data.topPages.slice(0, 5)} empty="No page views yet." />
              <ListCard title="Top referrers" items={data.topReferrers.slice(0, 5)} empty="No referrers yet." />
              <ListCard title="Top CTAs" items={data.ctas.slice(0, 5)} empty="No CTA clicks yet." prettify />
            </div>
          </>
        )}

        {tab === 'traffic' && (
          <>
            <Card>
              <CardHeader title="Page views and sessions" description="Per day, UTC." />
              <div className="px-3 pb-4 pt-2 sm:px-5">
                <TrendChart points={points} series={['Page views', 'Sessions']} formatLabel={dayLabel} />
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ListCard title="Referrers" description="Where sessions came from." items={data.topReferrers} empty="No referrers yet." />
              <ListCard title="Devices" items={data.devices} empty="No device data yet." prettify />
              <ListCard title="Languages" items={data.locales.map(l => ({ ...l, label: l.label === 'it' ? 'Italian' : l.label === 'en' ? 'English' : l.label }))} empty="No language data yet." />
            </div>
          </>
        )}

        {tab === 'conversions' && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Contact conversion" value={rate(t.contactConversionRate)} hint={`${formatNumber(t.contactSubmits)} submissions`} />
              <Stat label="Launcher conversion" value={rate(t.launcherConversionRate)} hint={`${formatNumber(t.launcherCompletes)} completed`} />
              <Stat label="CTA clicks" value={formatNumber(t.ctaClicks)} />
              <Stat label="Case study opens" value={formatNumber(t.caseStudyOpens)} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Project launcher funnel" />
                <Funnel steps={[{ label: 'Sessions', value: t.sessions }, { label: 'Started launcher', value: t.launcherStarts }, { label: 'Completed launcher', value: t.launcherCompletes }]} />
              </Card>
              <Card>
                <CardHeader title="Contact funnel" />
                <Funnel steps={[{ label: 'Sessions', value: t.sessions }, { label: 'Started the form', value: t.contactStarts }, { label: 'Submitted', value: t.contactSubmits }]} />
              </Card>
            </div>
            <Card>
              <CardHeader title="Conversions per day" description="Contact submissions (solid) and launcher completions (dashed)." />
              <div className="px-3 pb-4 pt-2 sm:px-5">
                <TrendChart points={conversionPoints} series={['Contact submissions', 'Launcher completions']} formatLabel={dayLabel} height={150} />
              </div>
            </Card>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ListCard title="CTA clicks" items={data.ctas} empty="No CTA clicks yet." prettify />
              <ListCard title="Launcher outcomes" description="Build type and stage chosen." items={data.launcherOutcomes} empty="No completed launches yet." prettify />
              <ListCard title="Contact sources" items={data.contactSources} empty="No submissions yet." prettify />
            </div>
          </>
        )}

        {tab === 'pages' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ListCard title="Most viewed pages" items={data.topPages} empty="No page views yet." />
            <ListCard title="Landing pages" description="First page of each session." items={data.topLandingPages} empty="No sessions yet." />
            <ListCard title="Case studies opened" items={data.caseStudies} empty="No case studies opened yet." prettify />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Tabs
            label="Analytics views"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'traffic', label: 'Traffic' },
              { value: 'conversions', label: 'Conversions' },
              { value: 'pages', label: 'Top pages' }
            ]}
          />
          {data && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {data.from === data.to ? longDay.format(new Date(`${data.from}T00:00:00Z`)) : `${longDay.format(new Date(`${data.from}T00:00:00Z`))} – ${longDay.format(new Date(`${data.to}T00:00:00Z`))}`} · UTC
            </p>
          )}
        </div>
        {controls}
      </div>
      {body}
      <p className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        First-party, cookie-free and aggregate only: no IP addresses, user agents or personal data are stored. Sessions are per browser tab, not unique people.
      </p>
    </div>
  )
}
