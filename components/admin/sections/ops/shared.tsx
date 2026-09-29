'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { EMPTY_FILTERS, STAGE_LABEL } from '@/lib/admin/constants'
import { formatDateTime } from '@/lib/admin/format'
import { useDebounced } from '@/lib/admin/hooks'
import type { OpsActivity } from '@/lib/admin/types'
import { Modal } from '../../ui/Overlay'
import { cx, fieldBase, focusRing } from '../../ui/styles'

export type PickerKind = 'lead' | 'project'
type PickerResult = { id: string; title: string; subtitle: string }

async function searchEntities(kind: PickerKind, q: string, signal: AbortSignal): Promise<PickerResult[]> {
  if (kind === 'lead') {
    const list = await api.leads({ ...EMPTY_FILTERS, q }, 1, 8, 'updated', 'desc', signal)
    return list.items.map(l => ({ id: l.id, title: l.companyName, subtitle: [l.contactPerson, l.email, l.city].filter(Boolean).join(' · ') }))
  }
  const list = await api.projects(q)
  return list.projects.slice(0, 8).map(p => ({ id: p.id, title: p.name, subtitle: [p.clientName, STAGE_LABEL[p.stage]].filter(Boolean).join(' · ') }))
}

/** Search-and-pick dialog for linking an existing lead or project. */
export function EntityPicker({ kind, open, onClose, onPick }: { kind: PickerKind; open: boolean; onClose: () => void; onPick: (id: string) => Promise<void> | void }) {
  const [q, setQ] = useState('')
  const debounced = useDebounced(q, 250)
  const [results, setResults] = useState<PickerResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    searchEntities(kind, debounced, controller.signal)
      .then(r => {
        setResults(r)
        setError(null)
      })
      .catch(err => err.name !== 'AbortError' && setError(err.message))
    return () => controller.abort()
  }, [kind, debounced, open])

  const label = kind === 'lead' ? 'lead' : 'project'
  return (
    <Modal open={open} onClose={onClose} title={`Link a ${label}`} description={`Search your ${label}s and pick one.`} size="md">
      <label className="relative block">
        <span className="sr-only">Search {label}s</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={kind === 'lead' ? 'Company, email, phone…' : 'Project or client…'} className={cx(fieldBase, 'h-10 pl-9')} />
      </label>
      <div className="mt-3 min-h-40">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {results && !results.length && <p className="py-8 text-center text-sm text-slate-400">No {label}s found.</p>}
        <ul className="space-y-1">
          {results?.map(r => (
            <li key={r.id}>
              <button
                type="button"
                onClick={async () => {
                  await onPick(r.id)
                  onClose()
                }}
                className={cx('w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-white/[0.06]', focusRing)}
              >
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{r.title}</span>
                {r.subtitle && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{r.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}

export function ActivityTimeline({ activities, empty = 'No activity yet.' }: { activities: OpsActivity[]; empty?: string }) {
  if (!activities.length) return <p className="px-5 pb-5 pt-2 text-sm text-slate-400">{empty}</p>
  return (
    <ol className="space-y-3 px-5 pb-5 pt-2">
      {activities.map(a => (
        <li key={a.id} className="flex gap-3">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-white/25" />
          <div className="min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-200">{a.message}</p>
            <p className="text-xs text-slate-400">{formatDateTime(a.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

/** A compact link-style button to another record (lead, project, proposal, inquiry). */
export function RecordLink({ onClick, children, hint }: { onClick: () => void; children: ReactNode; hint?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cx('group inline-flex max-w-full cursor-pointer items-center gap-1 text-left text-sm font-medium text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]', focusRing)}>
      <span className="truncate">{children}</span>
      {hint && <span className="shrink-0 text-xs font-normal text-slate-500 no-underline dark:text-slate-400">{hint}</span>}
      <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100" />
    </button>
  )
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <dt className="shrink-0 text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right text-slate-900 dark:text-white">{children}</dd>
    </div>
  )
}

export function DrawerHeader({ title, badge, subtitle, onClose, closeIcon }: { title: ReactNode; badge?: ReactNode; subtitle?: ReactNode; onClose: () => void; closeIcon: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 break-words text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          {badge}
        </div>
        {subtitle && <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</div>}
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className={cx('flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.07]', focusRing)}>
        {closeIcon}
      </button>
    </div>
  )
}
