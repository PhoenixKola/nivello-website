'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { addDays, addMonths, daysBetween, fromDay, groupByDay, itemTime, monthGrid, relativeDayLabel, toDay, weekStart } from '@/lib/admin/agenda'
import { api } from '@/lib/admin/api'
import { AGENDA_SOURCES, CALENDAR_EVENT_CATEGORIES } from '@/lib/admin/constants'
import { useMediaQuery } from '@/lib/admin/hooks'
import type { AgendaItem, AgendaSource, CalendarEvent, CalendarEventCategory, CalendarEventInput } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Button, IconButton } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, Skeleton, Switch, Tabs } from '../ui/Controls'
import { TextArea, TextField } from '../ui/Inputs'
import { Select } from '../ui/Listbox'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import { SOURCE_STYLE, SourceTag, useOpenAgendaLink } from './agenda/AgendaParts'

type View = 'month' | 'week' | 'agenda'
const VIEW_KEY = 'nivello-admin-calendar-view'
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const AGENDA_DAYS = 30
const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })
const shortTitle = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function storedView(): View {
  try {
    const value = localStorage.getItem(VIEW_KEY)
    return value === 'week' || value === 'agenda' ? value : 'month'
  } catch {
    return 'month'
  }
}

function rangeFor(view: View, anchor: string): [string, string] {
  if (view === 'month') {
    const grid = monthGrid(anchor)
    return [grid[0], grid[41]]
  }
  if (view === 'week') {
    const start = weekStart(anchor)
    return [start, addDays(start, 6)]
  }
  return [anchor, addDays(anchor, AGENDA_DAYS - 1)]
}

function isPast(item: AgendaItem, today: string) {
  return (item.endDate ?? item.date) < today
}

// ── Event pills and lists ───────────────────────────────────────────────────

function ItemPill({ item, onOpen }: { item: AgendaItem; onOpen: (item: AgendaItem) => void }) {
  const style = SOURCE_STYLE[item.source]
  const time = itemTime(item)
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      title={`${style.label}: ${item.title}${item.context ? ` · ${item.context}` : ''}`}
      className={cx('flex w-full min-w-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-left text-[11px] leading-4', style.chip, item.done && 'line-through opacity-60', focusRing)}
    >
      <style.icon aria-hidden="true" className="h-3 w-3 shrink-0" />
      {time && <span className="shrink-0 tabular-nums">{time}</span>}
      <span className="truncate">{item.title}</span>
    </button>
  )
}

function ItemRow({ item, onOpen }: { item: AgendaItem; onOpen: (item: AgendaItem) => void }) {
  const time = itemTime(item)
  return (
    <li>
      <button type="button" onClick={() => onOpen(item)} className={cx('flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.04]', focusRing)}>
        <span className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">{time || 'All day'}</span>
        <span className="min-w-0 flex-1">
          <span className={cx('block truncate text-sm font-medium text-slate-900 dark:text-white', item.done && 'text-slate-400 line-through dark:text-slate-500')}>{item.title}</span>
          <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5">
            <SourceTag source={item.source} />
            {item.done && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Done</span>}
            {item.context && <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">{item.context}</span>}
          </span>
        </span>
      </button>
    </li>
  )
}

function DayList({ days, byDay, today, onOpen, empty }: { days: string[]; byDay: Map<string, AgendaItem[]>; today: string; onOpen: (item: AgendaItem) => void; empty: string }) {
  const withItems = days.filter(day => byDay.get(day)?.length)
  if (!withItems.length) return <p className="px-5 py-6 text-center text-sm text-slate-400">{empty}</p>
  return (
    <div className="space-y-3 px-2 py-3">
      {withItems.map(day => (
        <section key={day} aria-label={relativeDayLabel(day, today, true)}>
          <h3 className={cx('px-3 text-[11px] font-semibold uppercase tracking-[0.14em]', day === today ? 'text-[#0b6fc0] dark:text-[var(--brand-gold)]' : 'text-slate-400 dark:text-slate-500')}>{relativeDayLabel(day, today, true)}</h3>
          <ul className="mt-1">
            {byDay.get(day)!.map(item => (
              <ItemRow key={`${day}-${item.id}`} item={item} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ── Views ───────────────────────────────────────────────────────────────────

function MonthView({ anchor, today, byDay, selected, onSelect, onOpen, compact }: { anchor: string; today: string; byDay: Map<string, AgendaItem[]>; selected: string | null; onSelect: (day: string) => void; onOpen: (item: AgendaItem) => void; compact: boolean }) {
  const month = anchor.slice(0, 7)
  const limit = 3
  return (
    <div role="grid" aria-label={`Month of ${monthTitle.format(fromDay(anchor))}`} className="overflow-hidden">
      <div role="row" className="grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06]">
        {WEEKDAYS.map(day => (
          <div key={day} role="columnheader" className="py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            {compact ? day[0] : day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {monthGrid(anchor).map(day => {
          const items = byDay.get(day) ?? []
          const inMonth = day.startsWith(month)
          const isToday = day === today
          const isSelected = day === selected
          return (
            <div
              key={day}
              role="gridcell"
              aria-selected={isSelected}
              className={cx('min-w-0 border-b border-r border-slate-100 dark:border-white/[0.06] [&:nth-child(7n)]:border-r-0', compact ? 'h-14' : 'min-h-[6.75rem] p-1', !inMonth && 'bg-slate-50/70 dark:bg-white/[0.015]', isSelected && 'bg-sky-50/70 dark:bg-white/[0.05]')}
            >
              <button
                type="button"
                onClick={() => onSelect(day)}
                aria-label={`${relativeDayLabel(day, today, true)}${items.length ? `, ${items.length} item${items.length === 1 ? '' : 's'}` : ''}`}
                className={cx('flex cursor-pointer items-center justify-center rounded-full text-xs tabular-nums', compact ? 'mx-auto mt-1.5 h-7 w-7' : 'h-6 w-6', isToday ? 'bg-[var(--brand-blue)] font-semibold text-white dark:bg-[var(--brand-gold)] dark:text-slate-950' : inMonth ? 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10' : 'text-slate-400', focusRing)}
              >
                {Number(day.slice(8))}
              </button>
              {compact ? (
                items.length > 0 && (
                  <div className="mt-1 flex justify-center gap-0.5" aria-hidden="true">
                    {items.slice(0, 3).map(item => (
                      <span key={item.id} className={cx('h-1.5 w-1.5 rounded-full', SOURCE_STYLE[item.source].bar, item.done && 'opacity-40')} />
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, limit).map(item => (
                    <ItemPill key={item.id} item={item} onOpen={onOpen} />
                  ))}
                  {items.length > limit && (
                    <button type="button" onClick={() => onSelect(day)} className={cx('w-full cursor-pointer rounded px-1.5 text-left text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white', focusRing)}>
                      +{items.length - limit} more
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ anchor, today, byDay, onOpen }: { anchor: string; today: string; byDay: Map<string, AgendaItem[]>; onOpen: (item: AgendaItem) => void }) {
  const days = daysBetween(weekStart(anchor), addDays(weekStart(anchor), 6))
  return (
    <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-7 lg:divide-x lg:divide-y-0 dark:divide-white/[0.06]">
      {days.map(day => {
        const items = byDay.get(day) ?? []
        return (
          <section key={day} aria-label={relativeDayLabel(day, today, true)} className="min-w-0 p-2 lg:min-h-[22rem]">
            <h3 className={cx('px-1 pb-2 text-xs font-semibold', day === today ? 'text-[#0b6fc0] dark:text-[var(--brand-gold)]' : 'text-slate-500 dark:text-slate-400')}>
              {WEEKDAYS[(fromDay(day).getDay() + 6) % 7]} <span className="tabular-nums">{Number(day.slice(8))}</span>
              {day === today && <span className="ml-1 font-normal">· Today</span>}
            </h3>
            {items.length ? (
              <div className="space-y-1">
                {items.map(item => (
                  <ItemPill key={item.id} item={item} onOpen={onOpen} />
                ))}
              </div>
            ) : (
              <p className="px-1 text-[11px] text-slate-300 dark:text-slate-600">—</p>
            )}
          </section>
        )
      })}
    </div>
  )
}

// ── Manual event editor ─────────────────────────────────────────────────────

type EventForm = { title: string; allDay: boolean; startDate: string; startTime: string; endDate: string; endTime: string; category: CalendarEventCategory; notes: string }

function localParts(iso: string) {
  const date = new Date(iso)
  return { date: toDay(date), time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` }
}

function toForm(event: CalendarEvent | null, day: string): EventForm {
  if (!event) return { title: '', allDay: true, startDate: day, startTime: '09:00', endDate: '', endTime: '', category: '', notes: '' }
  if (event.allDay) return { title: event.title, allDay: true, startDate: event.start, startTime: '09:00', endDate: event.end ?? '', endTime: '', category: event.category, notes: event.notes }
  const start = localParts(event.start)
  const end = event.end ? localParts(event.end) : null
  return { title: event.title, allDay: false, startDate: start.date, startTime: start.time, endDate: end?.date ?? '', endTime: end?.time ?? '', category: event.category, notes: event.notes }
}

function fromForm(form: EventForm): CalendarEventInput {
  const instant = (date: string, time: string) => new Date(`${date}T${time || '00:00'}:00`).toISOString()
  const base = { title: form.title.trim(), allDay: form.allDay, category: form.category, notes: form.notes.trim() }
  if (form.allDay) return { ...base, start: form.startDate, end: form.endDate && form.endDate !== form.startDate ? form.endDate : null }
  const endDate = form.endDate || (form.endTime ? form.startDate : '')
  return { ...base, start: instant(form.startDate, form.startTime), end: endDate ? instant(endDate, form.endTime || form.startTime) : null }
}

function EventEditor({ state, onClose, onSaved }: { state: { event: CalendarEvent | null; day: string } | null; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState<EventForm>(() => toForm(state?.event ?? null, state?.day ?? toDay(new Date())))
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof EventForm>(key: K, value: EventForm[K]) => setForm(f => ({ ...f, [key]: value }))
  const editing = state?.event ?? null

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.startDate) return
    setBusy(true)
    try {
      const input = fromForm(form)
      if (editing) await api.updateCalendarEvent(editing.id, input)
      else await api.createCalendarEvent(input)
      toast.success(editing ? 'Event updated' : 'Event added')
      onSaved()
    } catch (err) {
      toast.error('Event not saved', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Modal
        open={state !== null}
        onClose={onClose}
        size="sm"
        title={editing ? 'Edit event' : 'New event'}
        description="Manual events are for things that do not belong to a lead, project or proposal."
        footer={
          <>
            {editing && (
              <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)} className="mr-auto text-red-600 dark:text-red-400">
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="calendar-event-form" loading={busy} disabled={!form.title.trim() || !form.startDate}>
              {editing ? 'Save event' : 'Add event'}
            </Button>
          </>
        }
      >
        <form id="calendar-event-form" onSubmit={save} className="space-y-3">
          <TextField label="Title" required maxLength={160} value={form.title} onChange={e => set('title', e.target.value)} data-autofocus />
          <Switch checked={form.allDay} onChange={v => set('allDay', v)} label="All day" />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Start date" type="date" required value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            {!form.allDay && <TextField label="Start time" type="time" required value={form.startTime} onChange={e => set('startTime', e.target.value)} />}
            <TextField label="End date (optional)" type="date" min={form.startDate} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            {!form.allDay && <TextField label="End time (optional)" type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} />}
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</span>
            <Select label="Category" value={form.category} onChange={v => set('category', v)} options={CALENDAR_EVENT_CATEGORIES} />
          </div>
          <TextArea label="Notes (optional)" maxLength={2000} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </form>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title={`Delete “${editing?.title ?? ''}”?`}
        description="Only this manual event is removed."
        confirmLabel="Delete event"
        onConfirm={async () => {
          if (!editing) return
          try {
            await api.deleteCalendarEvent(editing.id)
            toast.success('Event deleted')
            setConfirmDelete(false)
            onSaved()
          } catch (err) {
            toast.error('Could not delete event', (err as Error).message)
          }
        }}
      />
    </>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function Calendar() {
  const { route, navigate, dataVersion } = useAdmin()
  const toast = useToast()
  const compact = !useMediaQuery('(min-width: 640px)')
  const [view, setViewState] = useState<View>(storedView)
  const [today] = useState(() => toDay(new Date()))
  const [anchor, setAnchor] = useState(today)
  const [selected, setSelected] = useState<string | null>(null)
  const [sources, setSources] = useState<Set<AgendaSource>>(() => new Set(AGENDA_SOURCES.map(s => s.value)))
  const [showCompleted, setShowCompleted] = useState(false)
  const [hidePast, setHidePast] = useState(false)
  const [items, setItems] = useState<AgendaItem[] | null>(null)
  const [upcoming, setUpcoming] = useState<AgendaItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [editor, setEditor] = useState<{ event: CalendarEvent | null; day: string } | null>(null)
  const [from, to] = rangeFor(view, anchor)
  const eventParam = route.params.get('event')
  const newParam = route.params.get('new')

  const setView = (next: View) => {
    setViewState(next)
    setSelected(null)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Remembering the view is a convenience only.
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    api
      .calendar(from, to, controller.signal)
      .then(result => {
        setItems(result.items)
        setError(null)
      })
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [from, to, version, dataVersion])

  useEffect(() => {
    const controller = new AbortController()
    api
      .calendar(today, addDays(today, 13), controller.signal)
      .then(result => setUpcoming(result.items.filter(item => !item.done)))
      .catch(() => {})
    return () => controller.abort()
  }, [today, version, dataVersion])

  const openEvent = useCallback(
    async (id: string) => {
      try {
        const { event } = await api.calendarEvent(id)
        setEditor({ event, day: event.allDay ? event.start : toDay(new Date(event.start)) })
      } catch (err) {
        toast.error('Event unavailable', (err as Error).message)
      }
    },
    [toast]
  )
  const openLink = useOpenAgendaLink(openEvent)
  const open = useCallback((item: AgendaItem) => openLink(item.link), [openLink])

  useEffect(() => {
    if (eventParam && /^evt_[a-f0-9]{16}$/.test(eventParam)) {
      const timer = setTimeout(() => openEvent(eventParam), 0)
      return () => clearTimeout(timer)
    }
    if (newParam === '1') {
      const timer = setTimeout(() => setEditor({ event: null, day: today }), 0)
      return () => clearTimeout(timer)
    }
  }, [eventParam, newParam, openEvent, today])

  const closeEditor = () => {
    setEditor(null)
    if (eventParam || newParam) navigate('calendar')
  }

  const visible = useMemo(
    () => (items ?? []).filter(item => sources.has(item.source) && (showCompleted || !item.done) && (!hidePast || !isPast(item, today))),
    [items, sources, showCompleted, hidePast, today]
  )
  const byDay = useMemo(() => groupByDay(visible, from, to), [visible, from, to])
  const upcomingByDay = useMemo(() => groupByDay((upcoming ?? []).filter(item => sources.has(item.source)), today, addDays(today, 13)), [upcoming, sources, today])

  const step = (direction: 1 | -1) => {
    setSelected(null)
    setAnchor(a => (view === 'month' ? addMonths(a, direction) : addDays(a, direction * (view === 'week' ? 7 : AGENDA_DAYS))))
  }
  const title = view === 'month' ? monthTitle.format(fromDay(anchor)) : `${shortTitle.format(fromDay(from))} – ${shortTitle.format(fromDay(to))}`
  const toggleSource = (source: AgendaSource) =>
    setSources(current => {
      const next = new Set(current)
      if (next.has(source)) next.delete(source)
      else next.add(source)
      return next
    })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton label="Previous" onClick={() => step(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <Button size="sm" variant="secondary" onClick={() => { setAnchor(today); setSelected(null) }}>
            Today
          </Button>
          <IconButton label="Next" onClick={() => step(1)}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <h2 className="ml-1 truncate text-base font-semibold tracking-tight text-slate-900 dark:text-white" aria-live="polite">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Tabs<View>
            label="Calendar views"
            value={view}
            onChange={setView}
            tabs={[
              { value: 'month', label: 'Month' },
              { value: 'week', label: 'Week' },
              { value: 'agenda', label: 'Agenda' }
            ]}
          />
          <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditor({ event: null, day: selected ?? (anchor.startsWith(today.slice(0, 7)) ? today : anchor) })}>
            <span className="hidden sm:inline">New event</span>
            <span className="sm:hidden">Event</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show sources">
          {AGENDA_SOURCES.map(source => {
            const on = sources.has(source.value)
            const style = SOURCE_STYLE[source.value]
            return (
              <button
                key={source.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSource(source.value)}
                className={cx(
                  'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset transition-colors',
                  on ? 'bg-white text-slate-800 ring-slate-300 dark:bg-white/[0.08] dark:text-slate-100 dark:ring-white/20' : 'text-slate-400 ring-slate-200 dark:ring-white/10',
                  focusRing
                )}
              >
                <span className={cx('h-2 w-2 rounded-full', on ? style.bar : 'bg-slate-300 dark:bg-slate-600')} aria-hidden="true" />
                {source.label}
              </button>
            )
          })}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-40">
            <Switch checked={showCompleted} onChange={setShowCompleted} label="Show completed" />
          </div>
          <div className="w-32">
            <Switch checked={hidePast} onChange={setHidePast} label="Hide past" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden">
            {error && !items ? (
              <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Calendar unavailable" description={error} action={<Button onClick={() => setVersion(v => v + 1)}>Try again</Button>} />
            ) : !items ? (
              <Skeleton className="m-4 h-80" />
            ) : view === 'month' ? (
              <MonthView anchor={anchor} today={today} byDay={byDay} selected={selected} onSelect={day => setSelected(s => (s === day ? null : day))} onOpen={open} compact={compact} />
            ) : view === 'week' ? (
              <WeekView anchor={anchor} today={today} byDay={byDay} onOpen={open} />
            ) : (
              <DayList days={daysBetween(from, to)} byDay={byDay} today={today} onOpen={open} empty="Nothing scheduled in this period." />
            )}
          </Card>

          {view === 'month' && items && (selected || compact) && (
            <Card>
              <CardHeader
                title={selected ? relativeDayLabel(selected, today, true) : 'This month'}
                actions={
                  selected ? (
                    <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditor({ event: null, day: selected })}>
                      Add
                    </Button>
                  ) : undefined
                }
              />
              <DayList
                days={selected ? [selected] : daysBetween(from, to).filter(day => day.startsWith(anchor.slice(0, 7)))}
                byDay={byDay}
                today={today}
                onOpen={open}
                empty={selected ? 'Nothing on this day.' : 'Nothing scheduled this month.'}
              />
            </Card>
          )}
        </div>

        <Card>
          <CardHeader title="Upcoming" description="Today and the next 13 days" />
          {!upcoming ? (
            <Skeleton className="m-4 h-40" />
          ) : (
            <DayList days={daysBetween(today, addDays(today, 13))} byDay={upcomingByDay} today={today} onOpen={open} empty="Nothing coming up. Enjoy the calm." />
          )}
          <p className="flex items-center gap-1.5 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400 dark:border-white/[0.06]">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Dates come from leads, projects and proposals — edit them there.
          </p>
        </Card>
      </div>

      {editor && (
        <EventEditor
          key={editor.event?.id ?? `new-${editor.day}`}
          state={editor}
          onClose={closeEditor}
          onSaved={() => {
            closeEditor()
            setVersion(v => v + 1)
          }}
        />
      )}
    </div>
  )
}
