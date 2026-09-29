'use client'

import { ChevronRight } from 'lucide-react'
import { formatDateTime, formatRelative } from '@/lib/admin/format'
import type { LeadSummary, Tag } from '@/lib/admin/types'
import { PriorityBadge, StatusBadge, TagChip } from '../ui/Badge'
import { cx, focusRing } from '../ui/styles'
import ContactActions from './ContactActions'

type Props = {
  items: LeadSummary[]
  tags: Tag[]
  selected: Set<string>
  onToggle: (id: string) => void
  onTogglePage: () => void
  onOpen: (id: string) => void
  now: number
}

function ScorePill({ score }: { score: number }) {
  const tone = score >= 70 ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-400/10' : score >= 45 ? 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-400/10' : 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-white/[0.06]'
  return <span className={cx('inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums', tone)}>{score}</span>
}

function FollowUpCell({ lead, now }: { lead: LeadSummary; now: number }) {
  if (!lead.followUpAt || lead.followUpCompletedAt) return <span className="text-xs text-slate-400">—</span>
  const due = now > 0 && Date.parse(lead.followUpAt) <= now
  return (
    <span className={cx('text-xs', due ? 'font-medium text-red-600 dark:text-red-300' : 'text-slate-600 dark:text-slate-300')} title={formatDateTime(lead.followUpAt)}>
      {now ? formatRelative(lead.followUpAt, now) : formatDateTime(lead.followUpAt)}
    </span>
  )
}

function TagList({ ids, tags }: { ids: string[]; tags: Tag[] }) {
  const list = ids.map(id => tags.find(t => t.id === id)).filter((t): t is Tag => Boolean(t))
  if (!list.length) return <span className="text-xs text-slate-400">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {list.slice(0, 2).map(t => (
        <TagChip key={t.id} name={t.name} color={t.color} />
      ))}
      {list.length > 2 && <span className="text-xs text-slate-400">+{list.length - 2}</span>}
    </div>
  )
}

const checkboxCls = 'h-4 w-4 cursor-pointer rounded accent-[var(--brand-blue)] dark:accent-[var(--brand-gold)]'

export default function LeadTable({ items, tags, selected, onToggle, onTogglePage, onOpen, now }: Props) {
  const allSelected = items.length > 0 && items.every(i => selected.has(i.id))
  const someSelected = items.some(i => selected.has(i.id))
  return (
    <>
      {/* Desktop: dense table, scrolls horizontally inside its own container if the window is narrow. */}
      <div className="relative hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
              <th scope="col" className="w-10 border-b border-slate-200 py-2.5 pl-4 dark:border-white/[0.08]">
                <input
                  type="checkbox"
                  className={checkboxCls}
                  checked={allSelected}
                  ref={el => {
                    if (el) el.indeterminate = !allSelected && someSelected
                  }}
                  onChange={onTogglePage}
                  aria-label="Select all leads on this page"
                />
              </th>
              {['Company', 'City', 'Category', 'Contact', 'Status', 'Priority', 'Tags', 'Next follow-up', 'Score', 'Updated', ''].map((h, i) => (
                <th key={h || i} scope="col" className="border-b border-slate-200 px-3 py-2.5 font-semibold dark:border-white/[0.08]">
                  {h || <span className="sr-only">Open</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(lead => {
              const isSelected = selected.has(lead.id)
              return (
                <tr key={lead.id} className={cx('group transition-colors', isSelected ? 'bg-[var(--brand-blue)]/[0.05] dark:bg-[var(--brand-gold)]/[0.05]' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]')}>
                  <td className="border-b border-slate-100 py-2 pl-4 dark:border-white/[0.05]">
                    <input type="checkbox" className={checkboxCls} checked={isSelected} onChange={() => onToggle(lead.id)} aria-label={`Select ${lead.companyName}`} />
                  </td>
                  <td className="max-w-[16rem] border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <button type="button" onClick={() => onOpen(lead.id)} className={cx('block max-w-full cursor-pointer truncate rounded text-left font-medium text-slate-900 hover:text-[#0b6fc0] dark:text-white dark:hover:text-[var(--brand-gold)]', focusRing)}>
                      {lead.companyName}
                    </button>
                    {lead.contactPerson && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{lead.contactPerson}</span>}
                  </td>
                  <td className="max-w-[9rem] truncate border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-white/[0.05] dark:text-slate-300">{lead.city || '—'}</td>
                  <td className="max-w-[10rem] truncate border-b border-slate-100 px-3 py-2 text-slate-600 dark:border-white/[0.05] dark:text-slate-300">{lead.category || '—'}</td>
                  <td className="border-b border-slate-100 px-2 py-1 dark:border-white/[0.05]">
                    <ContactActions lead={lead} only={['call', 'whatsapp', 'email', 'instagram']} />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <PriorityBadge priority={lead.priority} />
                  </td>
                  <td className="max-w-[12rem] border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <TagList ids={lead.tags} tags={tags} />
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <FollowUpCell lead={lead} now={now} />
                  </td>
                  <td className="border-b border-slate-100 px-3 py-2 dark:border-white/[0.05]">
                    <ScorePill score={lead.score} />
                  </td>
                  <td className="whitespace-nowrap border-b border-slate-100 px-3 py-2 text-xs text-slate-500 dark:border-white/[0.05] dark:text-slate-400" title={formatDateTime(lead.updatedAt)}>
                    {now ? formatRelative(lead.updatedAt, now) : formatDateTime(lead.updatedAt)}
                  </td>
                  <td className="border-b border-slate-100 py-2 pr-3 dark:border-white/[0.05]">
                    <button type="button" onClick={() => onOpen(lead.id)} aria-label={`Open ${lead.companyName}`} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white', focusRing)}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards instead of a squeezed table. */}
      <ul className="divide-y divide-slate-100 md:hidden dark:divide-white/[0.06]">
        {items.map(lead => (
          <li key={lead.id} className={cx('flex gap-3 px-4 py-3.5', selected.has(lead.id) && 'bg-[var(--brand-blue)]/[0.05] dark:bg-[var(--brand-gold)]/[0.05]')}>
            <input type="checkbox" className={cx(checkboxCls, 'mt-1')} checked={selected.has(lead.id)} onChange={() => onToggle(lead.id)} aria-label={`Select ${lead.companyName}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => onOpen(lead.id)} className={cx('min-w-0 cursor-pointer rounded text-left', focusRing)}>
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{lead.companyName}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[lead.category, lead.city].filter(Boolean).join(' · ') || '—'}</span>
                </button>
                <ScorePill score={lead.score} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={lead.status} />
                <PriorityBadge priority={lead.priority} />
                <TagList ids={lead.tags} tags={tags} />
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <ContactActions lead={lead} only={['call', 'whatsapp', 'email', 'instagram']} />
                <FollowUpCell lead={lead} now={now} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
