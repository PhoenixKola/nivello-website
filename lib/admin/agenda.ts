import type { AdminSection } from './hooks'
import type { AgendaItem, AgendaLink } from './types'

/*
 * Calendar-day helpers. Days are YYYY-MM-DD strings in the viewer's local time, matching what the
 * agenda API returns (it places timed items with the browser's UTC offset).
 */

const pad = (n: number) => String(n).padStart(2, '0')

export function toDay(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDay(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(day: string, days: number) {
  const date = fromDay(day)
  date.setDate(date.getDate() + days)
  return toDay(date)
}

export function addMonths(day: string, months: number) {
  const date = fromDay(day)
  return toDay(new Date(date.getFullYear(), date.getMonth() + months, 1))
}

/** Monday of the week containing `day`. */
export function weekStart(day: string) {
  const date = fromDay(day)
  return addDays(day, -((date.getDay() + 6) % 7))
}

export function monthStart(day: string) {
  return `${day.slice(0, 7)}-01`
}

/** The 6×7 grid of days shown for the month containing `day`, starting on a Monday. */
export function monthGrid(day: string) {
  const first = weekStart(monthStart(day))
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

export function daysBetween(from: string, to: string) {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

/** Items per day; multi-day events appear on every day they cover inside [from, to]. */
export function groupByDay(items: AgendaItem[], from: string, to: string) {
  const map = new Map<string, AgendaItem[]>()
  for (const item of items) {
    const last = item.endDate && item.endDate > item.date ? item.endDate : item.date
    for (let d = item.date < from ? from : item.date; d <= last && d <= to; d = addDays(d, 1)) {
      const list = map.get(d)
      if (list) list.push(item)
      else map.set(d, [item])
    }
  }
  return map
}

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const longDayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export function itemTime(item: Pick<AgendaItem, 'at' | 'allDay'>) {
  return !item.allDay && item.at ? timeFormat.format(new Date(item.at)) : ''
}

/** "Today", "Tomorrow", "Yesterday" or "Wed 1 Oct". */
export function relativeDayLabel(day: string, today: string, long = false) {
  if (day === today) return 'Today'
  if (day === addDays(today, 1)) return 'Tomorrow'
  if (day === addDays(today, -1)) return 'Yesterday'
  return (long ? longDayFormat : dayFormat).format(fromDay(day))
}

/** Human due text for an attention row: "Due yesterday", "3 days overdue", "Due today · 15:00". */
export function dueText(item: Pick<AgendaItem, 'date' | 'at' | 'allDay'>, today: string) {
  const time = itemTime(item)
  if (item.date === today) return time ? `Today · ${time}` : 'Due today'
  const diff = Math.round((fromDay(item.date).getTime() - fromDay(today).getTime()) / 86400000)
  if (diff === -1) return time ? `Yesterday · ${time}` : 'Due yesterday'
  if (diff < 0) return `${-diff} days overdue`
  if (diff === 1) return time ? `Tomorrow · ${time}` : 'Due tomorrow'
  return `Due ${dayFormat.format(fromDay(item.date))}`
}

/** Where a linked item opens: its real record, never a copy. */
export function linkTarget(link: AgendaLink): { lead: string } | { event: string } | { section: AdminSection; params: Record<string, string> } {
  switch (link.type) {
    case 'lead':
      return { lead: link.id }
    case 'event':
      return { event: link.id }
    case 'project':
      return { section: 'projects', params: link.tab ? { project: link.id, tab: link.tab } : { project: link.id } }
    case 'proposal':
      return { section: 'proposals', params: { proposal: link.id } }
    case 'inbox':
      return { section: 'inbox', params: { inquiry: link.id } }
    case 'health':
      return { section: 'health', params: { monitor: link.id } }
  }
}
