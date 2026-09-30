'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { BATCH_STATUS_LABEL, HIGH_SCORE, LEAD_STATUSES } from '@/lib/admin/constants'
import { formatNumber } from '@/lib/admin/format'
import type { LeadForgeStats } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, Skeleton } from '../ui/Controls'
import { cx, focusRing } from '../ui/styles'

const SOURCE_LABEL: Record<string, string> = { discovery: 'Discovery', csv: 'CSV import', manual: 'Manual', inbox: 'Website inquiry' }
const pct = (value: number | null) => (value === null ? '—' : `${value}%`)

function Stat({ label, value, hint, onClick }: { label: string; value: ReactNode; hint?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="mt-1 block truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</span>
      {hint && <span className="block truncate text-[11px] text-slate-400">{hint}</span>}
    </>
  )
  const cls = 'min-w-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-left dark:border-white/[0.08] dark:bg-slate-900/60'
  return onClick ? (
    <button type="button" onClick={onClick} className={cx(cls, 'cursor-pointer hover:border-slate-300 dark:hover:border-white/20', focusRing)}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default function LeadInsights() {
  const { navigate, dataVersion } = useAdmin()
  const [data, setData] = useState<LeadForgeStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .leadStats()
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

  if (error && !data) return <Card><EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Insights unavailable" description={error} /></Card>
  if (!data) return <Skeleton className="h-80" />
  if (!data.total) return <Card><EmptyState title="No leads yet" description="Insights appear once leads are discovered, imported or added." action={<Button variant="primary" onClick={() => navigate('find')}>Find leads</Button>} /></Card>

  const max = Math.max(1, ...Object.values(data.byStatus))
  return (
    <div className="space-y-4">
      <section aria-label="Lead Forge metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Stat label="Active leads" value={formatNumber(data.active)} hint={`${formatNumber(data.total)} in total`} onClick={() => navigate('leads')} />
        <Stat label="Follow-ups overdue" value={data.followUps.overdue} hint={`${data.followUps.today} today · ${data.followUps.upcoming} upcoming`} onClick={() => navigate('leads', { view: 'overdue' })} />
        <Stat label="High opportunity" value={formatNumber(data.scoreBands.high)} hint={`Score ${HIGH_SCORE}+`} onClick={() => navigate('leads', { view: 'high-score' })} />
        <Stat label="Lead → proposal" value={pct(data.rates.toProposal)} hint={`${data.converted.proposal} leads with a proposal`} />
        <Stat label="Lead → project" value={pct(data.rates.toProject)} hint={`${data.converted.project} leads with a project`} />
        <Stat label="Win rate" value={pct(data.rates.winRate)} hint={`${data.byStatus.won} won · ${data.byStatus.lost} lost`} />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Leads by status" />
          <ul className="space-y-2 px-5 pb-5 pt-4">
            {LEAD_STATUSES.map(s => (
              <li key={s.value}>
                <button type="button" onClick={() => navigate('leads', { status: s.value })} className={cx('grid w-full cursor-pointer grid-cols-[6rem_minmax(0,1fr)_3rem] items-center gap-3 rounded text-left text-xs', focusRing)}>
                  <span className="truncate text-slate-600 dark:text-slate-300">{s.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <span className="block h-full rounded-full bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]" style={{ width: `${(data.byStatus[s.value] / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-medium tabular-nums text-slate-900 dark:text-white">{data.byStatus[s.value]}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="By source" description="Proposals and wins counted from records linked to each lead" />
          <div className="overflow-x-auto px-5 pb-5 pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-slate-400">
                  <th className="py-1.5 font-semibold">Source</th>
                  <th className="py-1.5 text-right font-semibold">Leads</th>
                  <th className="py-1.5 text-right font-semibold">Proposals</th>
                  <th className="py-1.5 text-right font-semibold">Won</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {data.sources.map(row => (
                  <tr key={row.source}>
                    <td className="py-2 text-slate-700 dark:text-slate-200">{SOURCE_LABEL[row.source] ?? row.source}</td>
                    <td className="py-2 text-right tabular-nums">{formatNumber(row.leads)}</td>
                    <td className="py-2 text-right tabular-nums">{row.proposals}</td>
                    <td className="py-2 text-right tabular-nums">{row.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Discovery batches" description="What each recent discovery produced, and how many of those leads moved forward" />
        {!data.batches.length ? (
          <p className="px-5 pb-5 pt-3 text-sm text-slate-400">No discoveries yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 px-2 pb-2 pt-2 dark:divide-white/[0.06]">
            {data.batches.map(batch => (
              <li key={batch.id}>
                <button type="button" onClick={() => navigate('leads', { batch: batch.id })} className={cx('flex w-full cursor-pointer flex-wrap items-center gap-x-5 gap-y-1 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04]', focusRing)}>
                  <span className="min-w-0 flex-1 basis-52">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{batch.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{BATCH_STATUS_LABEL[batch.status]}</span>
                  </span>
                  {[
                    ['Checked', batch.checked],
                    ['Imported', batch.imported],
                    ['Still in CRM', batch.inCrm],
                    ['Qualified', batch.qualified],
                    ['Proposals', batch.proposals]
                  ].map(([label, value]) => (
                    <span key={label} className="text-right">
                      <span className="block text-sm font-medium tabular-nums text-slate-900 dark:text-white">{value}</span>
                      <span className="block text-[11px] text-slate-400">{label}</span>
                    </span>
                  ))}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-white/[0.06]">Qualified = Interested, Proposal or Won. No forecasts or revenue attribution — only what is recorded.</p>
      </Card>
    </div>
  )
}
