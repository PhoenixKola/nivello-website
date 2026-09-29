'use client'

import { useEffect, useState } from 'react'
import { CalendarCheck, CalendarClock, ChevronRight } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDateTime, formatRelative } from '@/lib/admin/format'
import { useNow } from '@/lib/admin/hooks'
import type { LeadSummary } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState, Pagination, Skeleton, Tabs } from '../ui/Controls'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import ContactActions from './ContactActions'

type Bucket = 'overdue' | 'today' | 'upcoming' | 'done'

const EMPTY: Record<Bucket, string> = {
  overdue: 'Nothing overdue. Nice.',
  today: 'No follow-ups left for today.',
  upcoming: 'No upcoming follow-ups scheduled.',
  done: 'Completed follow-ups and closed leads show up here.'
}

export default function FollowUps() {
  const { dataVersion, openLead, notifyChanged } = useAdmin()
  const toast = useToast()
  const now = useNow(60000)
  const [bucket, setBucket] = useState<Bucket>('overdue')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: LeadSummary[]; page: number; pages: number; total: number; counts: Record<Bucket, number> } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .followUps(bucket, page)
      .then(result => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [bucket, page, dataVersion])

  const complete = async (id: string) => {
    try {
      await api.completeFollowUp(id)
      toast.success('Follow-up marked done')
      notifyChanged()
    } catch (err) {
      toast.error('Could not update follow-up', (err as Error).message)
    }
  }

  const counts = data?.counts
  return (
    <div className="space-y-4">
      <Tabs<Bucket>
        label="Follow-up views"
        value={bucket}
        onChange={value => {
          setBucket(value)
          setPage(1)
        }}
        tabs={[
          { value: 'overdue', label: 'Overdue', count: counts?.overdue },
          { value: 'today', label: 'Today', count: counts?.today },
          { value: 'upcoming', label: 'Upcoming', count: counts?.upcoming },
          { value: 'done', label: 'Completed / closed', count: counts?.done }
        ]}
      />

      <Card className="overflow-hidden">
        {error && !data ? (
          <EmptyState title="Could not load follow-ups" description={error} />
        ) : !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState icon={<CalendarClock className="h-5 w-5" />} title={EMPTY[bucket]} />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {data.items.map(lead => {
              const overdue = bucket === 'overdue'
              return (
                <li key={lead.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
                  <button type="button" onClick={() => openLead(lead.id)} className={cx('min-w-0 flex-1 cursor-pointer rounded text-left', focusRing)}>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.companyName}</span>
                      <StatusBadge status={lead.status} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{lead.nextAction || [lead.category, lead.city].filter(Boolean).join(' · ') || 'No next action set'}</span>
                  </button>
                  <div className="text-right text-xs" title={formatDateTime(lead.followUpAt)}>
                    <p className={cx('font-medium', overdue ? 'text-red-600 dark:text-red-300' : 'text-slate-700 dark:text-slate-200')}>{formatDateTime(lead.followUpAt)}</p>
                    {now > 0 && lead.followUpAt && <p className="text-slate-400">{formatRelative(lead.followUpAt, now)}</p>}
                  </div>
                  <ContactActions lead={lead} only={['call', 'whatsapp', 'email']} />
                  {bucket !== 'done' && (
                    <Button size="sm" variant="secondary" icon={<CalendarCheck className="h-3.5 w-3.5" />} onClick={() => complete(lead.id)}>
                      Done
                    </Button>
                  )}
                  <button type="button" onClick={() => openLead(lead.id)} aria-label={`Open ${lead.companyName}`} className={cx('hidden h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 sm:flex dark:hover:bg-white/10 dark:hover:text-white', focusRing)}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {data && data.pages > 1 && (
          <div className="flex justify-end border-t border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <Pagination page={data.page} pages={data.pages} onPage={setPage} label="Follow-up pages" />
          </div>
        )}
      </Card>
    </div>
  )
}
