'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Popover from './Popover'
import { Button } from './Button'
import { cx, fieldBase, focusRing } from './styles'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const displayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, date.getHours(), date.getMinutes())
const addMonths = (date: Date, months: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes())
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

/**
 * Two-digit time segment. Focus selects the value; the first digit typed replaces it and a second digit
 * completes it, so a full "23" never blocks typing (no maxLength). Arrow keys step, values clamp.
 */
function TimeSegment({ value, max, label, onChange, onComplete, inputRef }: { value: number; max: number; label: string; onChange: (value: number) => void; onComplete?: () => void; inputRef?: React.Ref<HTMLInputElement> }) {
  const [buffer, setBuffer] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(0, n))

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const key = event.key
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault()
      onChange((value + (key === 'ArrowUp' ? 1 : -1) + max + 1) % (max + 1))
      setBuffer(null)
      return
    }
    if (/^\d$/.test(key)) {
      event.preventDefault()
      const next = buffer === null ? key : buffer + key
      const number = clamp(Number(next))
      onChange(number)
      // Complete after two digits, or after one digit that cannot start a valid two-digit value.
      if (next.length >= 2 || Number(key) * 10 > max) {
        setBuffer(null)
        onComplete?.()
      } else {
        setBuffer(next)
      }
      return
    }
    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault()
      onChange(0)
      setBuffer(null)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      aria-label={label}
      role="spinbutton"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      value={buffer !== null ? buffer.padStart(1, '0') : String(value).padStart(2, '0')}
      onFocus={event => {
        setBuffer(null)
        event.currentTarget.select()
      }}
      onClick={event => event.currentTarget.select()}
      onBlur={() => setBuffer(null)}
      onKeyDown={onKeyDown}
      onChange={event => {
        // Paste / IME fallback.
        const digits = event.target.value.replace(/\D/g, '').slice(-2)
        if (digits) onChange(clamp(Number(digits)))
      }}
      className={cx(fieldBase.replace('w-full ', ''), 'h-9 w-14 px-0 text-center font-semibold tabular-nums')}
    />
  )
}

type DateTimePickerProps = {
  value: string | null
  onChange: (value: string | null) => void
  label: string
  placeholder?: string
  id?: string
  className?: string
}

export default function DateTimePicker({ value, onChange, label, placeholder = 'Not scheduled', id, className }: DateTimePickerProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Date>(() => new Date())
  const [focusDay, setFocusDay] = useState<Date>(() => new Date())
  const [month, setMonth] = useState<Date>(() => new Date())
  const buttonRef = useRef<HTMLButtonElement>(null)
  const minuteRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const dialogId = useId()

  const openPicker = () => {
    const base = value ? new Date(value) : defaultTime()
    setDraft(base)
    setFocusDay(base)
    setMonth(new Date(base.getFullYear(), base.getMonth(), 1))
    setOpen(true)
  }

  const close = () => setOpen(false)
  const apply = () => {
    onChange(draft.toISOString())
    close()
    buttonRef.current?.focus()
  }
  const pickDay = (day: Date) => {
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate(), draft.getHours(), draft.getMinutes())
    setDraft(next)
    setFocusDay(next)
  }
  const moveFocus = (next: Date) => {
    setFocusDay(next)
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) setMonth(new Date(next.getFullYear(), next.getMonth(), 1))
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>('[data-focus="true"]')?.focus())
  }

  const onGridKey = (event: KeyboardEvent) => {
    const map: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focusDay, -1),
      ArrowRight: () => addDays(focusDay, 1),
      ArrowUp: () => addDays(focusDay, -7),
      ArrowDown: () => addDays(focusDay, 7),
      PageUp: () => addMonths(focusDay, -1),
      PageDown: () => addMonths(focusDay, 1),
      Home: () => addDays(focusDay, -((focusDay.getDay() + 6) % 7)),
      End: () => addDays(focusDay, 6 - ((focusDay.getDay() + 6) % 7))
    }
    if (map[event.key]) {
      event.preventDefault()
      moveFocus(map[event.key]())
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pickDay(focusDay)
    }
  }

  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = addDays(first, -((first.getDay() + 6) % 7))
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))
  const today = new Date()

  return (
    <div className={cx('flex items-center gap-1.5', className)}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        aria-label={`${label}: ${value ? displayFormat.format(new Date(value)) : placeholder}`}
        onClick={() => (open ? close() : openPicker())}
        className={cx(fieldBase, 'flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 text-left')}
      >
        <CalendarClock aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={cx('truncate', !value && 'text-slate-400')}>{value ? displayFormat.format(new Date(value)) : placeholder}</span>
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Clear ${label}`}
          className={cx('flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white', focusRing)}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <Popover anchorRef={buttonRef} open={open} onClose={close} minWidth={296} className="p-3" id={dialogId} role="dialog" ariaLabel={label}>
        <div className="flex items-center justify-between gap-2 pb-2">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10', focusRing)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-slate-900 dark:text-white" aria-live="polite">
            {monthFormat.format(month)}
          </p>
          <button type="button" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10', focusRing)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div ref={gridRef} role="grid" aria-label={monthFormat.format(month)} onKeyDown={onGridKey} className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map(d => (
            <span key={d} role="columnheader" className="pb-1 text-center text-[11px] font-medium text-slate-400">
              {d}
            </span>
          ))}
          {days.map(day => {
            const inMonth = day.getMonth() === month.getMonth()
            const selected = sameDay(day, draft)
            const focused = sameDay(day, focusDay)
            return (
              <button
                key={day.toISOString()}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={dayLabel.format(day)}
                tabIndex={focused ? 0 : -1}
                data-focus={focused}
                onClick={() => pickDay(day)}
                className={cx(
                  'flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm tabular-nums transition-colors',
                  selected
                    ? 'bg-[var(--brand-blue)] font-semibold text-white dark:bg-[var(--brand-gold)] dark:text-slate-950'
                    : inMonth
                      ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                      : 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-white/5',
                  !selected && sameDay(day, today) && 'ring-1 ring-inset ring-slate-300 dark:ring-white/25',
                  focusRing
                )}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-white/[0.07]">
          <div className="flex items-center gap-1.5" role="group" aria-label="Time">
            <TimeSegment label="Hour" max={23} value={draft.getHours()} onChange={h => setDraft(d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, d.getMinutes()))} onComplete={() => minuteRef.current?.focus()} />
            <span className="font-semibold text-slate-400" aria-hidden="true">
              :
            </span>
            <TimeSegment inputRef={minuteRef} label="Minute" max={59} value={draft.getMinutes()} onChange={m => setDraft(d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), m))} />
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const now = new Date()
              setDraft(now)
              setFocusDay(now)
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
            }}
          >
            Now
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(null)
              close()
            }}
          >
            Clear
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={apply}>
              Done
            </Button>
          </div>
        </div>
      </Popover>
    </div>
  )
}

function defaultTime() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(10, 0, 0, 0)
  return date
}
