'use client'

import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { cx, fieldBase, focusRing } from './styles'

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: ReactNode; description?: ReactNode; disabled?: boolean }) {
  const id = useId()
  return (
    <div className={cx('flex items-start justify-between gap-4', disabled && 'opacity-55')}>
      <div className="min-w-0">
        <label htmlFor={id} className={cx('text-sm font-medium text-slate-800 dark:text-slate-100', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}>
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed',
          checked ? 'bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]' : 'bg-slate-200 dark:bg-white/15',
          focusRing
        )}
      >
        <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

export function NumberStepper({ value, onChange, min, max, step = 1, label, id }: { value: number; onChange: (value: number) => void; min: number; max: number; step?: number; label: string; id?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)))
  const commit = (text: string) => {
    const parsed = Number(text.replace(/[^\d]/g, ''))
    onChange(clamp(Number.isFinite(parsed) && text.trim() !== '' ? parsed : value))
    setDraft(null)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const delta = (event.key === 'ArrowUp' ? 1 : -1) * (event.shiftKey ? step * 10 : step)
      onChange(clamp(value + delta))
      setDraft(null)
    } else if (event.key === 'Enter') {
      // Commit the typed number without submitting the surrounding form.
      event.preventDefault()
      commit(event.currentTarget.value)
    }
  }
  const buttonCls = cx(
    'flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white',
    focusRing
  )
  return (
    <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[var(--brand-blue)] focus-within:ring-2 focus-within:ring-[var(--brand-blue)]/20 dark:border-white/10 dark:bg-slate-950/60 dark:focus-within:border-[var(--brand-gold)] dark:focus-within:ring-[var(--brand-gold)]/20">
      <button type="button" className={buttonCls} aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - step))}>
        <Minus className="h-4 w-4" />
      </button>
      <input
        id={id}
        role="spinbutton"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        inputMode="numeric"
        value={draft ?? String(value)}
        onFocus={event => event.currentTarget.select()}
        onChange={event => setDraft(event.target.value.replace(/[^\d]/g, '').slice(0, String(max).length))}
        onBlur={event => commit(event.currentTarget.value)}
        onKeyDown={onKeyDown}
        className="min-w-0 flex-1 border-x border-slate-200 bg-transparent text-center text-sm font-semibold tabular-nums text-slate-900 outline-none dark:border-white/10 dark:text-white"
      />
      <button type="button" className={buttonCls} aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + step))}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function Pagination({ page, pages, onPage, label = 'Pagination', compact }: { page: number; pages: number; onPage: (page: number) => void; label?: string; compact?: boolean }) {
  const btn = cx(
    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.06]',
    focusRing
  )
  return (
    <nav aria-label={label} className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className={cx('min-w-[4.5rem] text-center text-xs tabular-nums text-slate-500 dark:text-slate-400', compact && 'min-w-[3rem]')} aria-live="polite">
        {compact ? `${page} / ${pages}` : `Page ${page} of ${pages}`}
      </span>
      <button type="button" className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}

export function Progress({ value, max, active, tone = 'brand', label }: { value: number; max: number; active?: boolean; tone?: 'brand' | 'green' | 'amber' | 'slate' | 'red'; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const fill = {
    brand: 'bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]',
    green: 'bg-emerald-500',
    amber: 'bg-orange-400',
    slate: 'bg-slate-400 dark:bg-slate-500',
    red: 'bg-red-500'
  }[tone]
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.07]">
      <div className={cx('relative h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none', fill)} style={{ width: `${pct}%` }}>
        {active && <span className="admin-progress-sheen absolute inset-0 rounded-full" aria-hidden="true" />}
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none dark:bg-white/[0.06]', className)} aria-hidden="true" />
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400">{icon}</div>}
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (value: T) => void; label: string }) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    onChange(next.value)
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons?.[(index + delta + tabs.length) % tabs.length]?.focus()
  }
  return (
    <div role="tablist" aria-label={label} className="relative flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 [scrollbar-width:none] dark:bg-white/[0.05]">
      {tabs.map((tab, index) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={event => onKeyDown(event, index)}
            className={cx(
              'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors',
              active ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              focusRing
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cx('rounded-full px-1.5 text-[10px] tabular-nums', active ? 'bg-slate-100 dark:bg-white/10' : 'bg-slate-200/70 dark:bg-white/[0.06]')}>{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-[16rem] -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs leading-snug text-white shadow-lg group-focus-within/tip:block group-hover/tip:block dark:bg-slate-700"
      >
        {content}
      </span>
    </span>
  )
}

export function inputClass(extra?: string) {
  return cx(fieldBase, 'h-9', extra)
}

/** Renders long lists in pages of `step` so hundreds of records never land in the DOM at once. */
export function useShowMore<T>(items: T[], step = 50) {
  const [limit, setLimit] = useState(step)
  const visible = items.slice(0, limit)
  const more = items.length - visible.length
  const button =
    more > 0 ? (
      <div className="border-t border-slate-100 px-5 py-3 text-center dark:border-white/[0.06]">
        <button type="button" onClick={() => setLimit(l => l + step)} className={cx('cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.06]', focusRing)}>
          Show {Math.min(step, more)} more of {more}
        </button>
      </div>
    ) : null
  return { visible, button }
}
