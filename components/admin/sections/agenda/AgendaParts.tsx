'use client'

import { useCallback, type ComponentType } from 'react'
import { Activity, CalendarDays, FileText, Flag, FolderKanban, Inbox, ListChecks, PhoneCall } from 'lucide-react'
import { linkTarget } from '@/lib/admin/agenda'
import type { AgendaLink, AttentionItem } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { cx } from '../../ui/styles'

type Source = AttentionItem['source']

/** One restrained accent per source, always paired with an icon and a label. */
export const SOURCE_STYLE: Record<Source, { label: string; icon: ComponentType<{ className?: string }>; chip: string; bar: string }> = {
  lead: { label: 'Follow-up', icon: PhoneCall, chip: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-400/10', bar: 'bg-sky-500' },
  task: { label: 'Task', icon: ListChecks, chip: 'text-slate-700 bg-slate-100 dark:text-slate-200 dark:bg-white/[0.08]', bar: 'bg-slate-500 dark:bg-slate-400' },
  milestone: { label: 'Milestone', icon: Flag, chip: 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-400/10', bar: 'bg-violet-500' },
  project: { label: 'Project target', icon: FolderKanban, chip: 'text-teal-700 bg-teal-50 dark:text-teal-300 dark:bg-teal-400/10', bar: 'bg-teal-500' },
  proposal: { label: 'Proposal expiry', icon: FileText, chip: 'text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-400/10', bar: 'bg-amber-500' },
  event: { label: 'Event', icon: CalendarDays, chip: 'text-[#0b6fc0] bg-[var(--brand-blue)]/10 dark:text-[var(--brand-gold)] dark:bg-[var(--brand-gold)]/12', bar: 'bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]' },
  inbox: { label: 'Inquiry', icon: Inbox, chip: 'text-sky-700 bg-sky-50 dark:text-sky-300 dark:bg-sky-400/10', bar: 'bg-sky-500' },
  health: { label: 'Site health', icon: Activity, chip: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-400/10', bar: 'bg-red-500' }
}

export function SourceTag({ source, label, className }: { source: Source; label?: string; className?: string }) {
  const style = SOURCE_STYLE[source]
  return (
    <span className={cx('inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-[0.06em]', style.chip, className)}>
      <style.icon aria-hidden="true" className="h-3 w-3" />
      {label ?? style.label}
    </span>
  )
}

/** Opens the record behind an agenda link; manual events go to `onEvent` (or the Calendar). */
export function useOpenAgendaLink(onEvent?: (id: string) => void) {
  const { navigate, openLead } = useAdmin()
  return useCallback(
    (link: AgendaLink) => {
      const target = linkTarget(link)
      if ('lead' in target) openLead(target.lead)
      else if ('event' in target) {
        if (onEvent) onEvent(target.event)
        else navigate('calendar', { event: target.event })
      } else navigate(target.section, target.params)
    },
    [navigate, openLead, onEvent]
  )
}
