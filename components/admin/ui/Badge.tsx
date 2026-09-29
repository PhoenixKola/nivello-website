import type { ReactNode } from 'react'
import { BATCH_STATUS_LABEL, PRIORITY_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import type { BatchStatus, LeadPriority, LeadStatus, TagColor } from '@/lib/admin/types'
import { cx } from './styles'

type Tone = 'slate' | 'blue' | 'gold' | 'green' | 'red' | 'purple' | 'teal' | 'pink' | 'amber' | 'indigo'

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25',
  gold: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-[var(--brand-gold)]/12 dark:text-[var(--brand-gold)] dark:ring-[var(--brand-gold)]/30',
  amber: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/25',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/25',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/25',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-400/10 dark:text-teal-300 dark:ring-teal-400/25',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-400/10 dark:text-pink-300 dark:ring-pink-400/25',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/25'
}

const dots: Record<Tone, string> = {
  slate: 'bg-slate-400',
  blue: 'bg-sky-500',
  gold: 'bg-amber-500 dark:bg-[var(--brand-gold)]',
  amber: 'bg-orange-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  purple: 'bg-violet-500',
  teal: 'bg-teal-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500'
}

export function Badge({ tone = 'slate', dot, pulse, children, className }: { tone?: Tone; dot?: boolean; pulse?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex h-6 max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {pulse && <span className={cx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none', dots[tone])} />}
          <span className={cx('relative inline-flex h-1.5 w-1.5 rounded-full', dots[tone])} />
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  )
}

const statusTone: Record<LeadStatus, Tone> = {
  new: 'blue',
  contacted: 'indigo',
  follow_up: 'gold',
  interested: 'teal',
  proposal: 'purple',
  won: 'green',
  lost: 'red'
}

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge tone={statusTone[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

const priorityTone: Record<LeadPriority, Tone> = { low: 'slate', normal: 'slate', high: 'amber', urgent: 'red' }

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return <Badge tone={priorityTone[priority]}>{PRIORITY_LABEL[priority]}</Badge>
}

const batchTone: Record<BatchStatus, Tone> = {
  queued: 'slate',
  dispatching: 'blue',
  starting: 'blue',
  working: 'blue',
  retrying: 'amber',
  complete: 'green',
  stopped: 'slate',
  exhausted: 'gold',
  error: 'red'
}

export function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const active = status === 'dispatching' || status === 'starting' || status === 'working' || status === 'retrying'
  return (
    <Badge tone={batchTone[status]} dot pulse={active}>
      {BATCH_STATUS_LABEL[status]}
    </Badge>
  )
}

export const tagTone: Record<TagColor, Tone> = { blue: 'blue', gold: 'gold', purple: 'purple', green: 'green', red: 'red', teal: 'teal', pink: 'pink', slate: 'slate' }

export function TagChip({ name, color, onRemove }: { name: string; color: TagColor; onRemove?: () => void }) {
  return (
    <span className={cx('inline-flex h-6 max-w-[12rem] items-center gap-1 rounded-md px-1.5 text-xs font-medium ring-1 ring-inset', tones[tagTone[color]])}>
      <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', dots[tagTone[color]])} aria-hidden="true" />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove tag ${name}`} className="-mr-0.5 ml-0.5 cursor-pointer rounded px-0.5 opacity-70 hover:opacity-100 focus-visible:outline-2">
          ×
        </button>
      )}
    </span>
  )
}

export function TagSwatch({ color, className }: { color: TagColor; className?: string }) {
  return <span className={cx('inline-block h-3 w-3 rounded-full', dots[tagTone[color]], className)} aria-hidden="true" />
}
