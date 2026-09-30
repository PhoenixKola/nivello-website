import type { ComponentType } from 'react'
import { Activity, BarChart3, CalendarDays, FileText, FolderKanban, Inbox, LayoutDashboard, Radar, Settings } from 'lucide-react'
import type { AdminSection } from '@/lib/admin/hooks'

/**
 * Two-level navigation: the sidebar lists product areas; pages inside an area use local tabs.
 */
export type AreaId = 'overview' | 'leadforge' | 'analytics' | 'inbox' | 'calendar' | 'projects' | 'proposals' | 'health' | 'settings'

export type Area = {
  id: AreaId
  label: string
  icon: ComponentType<{ className?: string }>
  /** Section opened from the sidebar. */
  home: AdminSection
  sections: AdminSection[]
}

export const AREA_GROUPS: { label: string; areas: Area[] }[] = [
  { label: 'Overview', areas: [{ id: 'overview', label: 'Overview', icon: LayoutDashboard, home: 'dashboard', sections: ['dashboard'] }] },
  {
    label: 'Growth',
    areas: [
      { id: 'leadforge', label: 'Lead Forge', icon: Radar, home: 'leads', sections: ['find', 'leads', 'followups', 'insights', 'duplicates', 'history'] },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, home: 'analytics', sections: ['analytics'] }
    ]
  },
  {
    label: 'Business',
    areas: [
      { id: 'inbox', label: 'Inbox', icon: Inbox, home: 'inbox', sections: ['inbox'] },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays, home: 'calendar', sections: ['calendar'] },
      { id: 'projects', label: 'Projects', icon: FolderKanban, home: 'projects', sections: ['projects'] },
      { id: 'proposals', label: 'Proposals', icon: FileText, home: 'proposals', sections: ['proposals'] }
    ]
  },
  { label: 'Operations', areas: [{ id: 'health', label: 'Site Health', icon: Activity, home: 'health', sections: ['health'] }] },
  { label: 'System', areas: [{ id: 'settings', label: 'Settings', icon: Settings, home: 'settings', sections: ['settings'] }] }
]

export function areaFor(section: AdminSection): Area {
  for (const group of AREA_GROUPS) {
    for (const area of group.areas) {
      if (area.sections.includes(section)) return area
    }
  }
  return AREA_GROUPS[0].areas[0]
}

export const LEADFORGE_TABS: { section: AdminSection; label: string }[] = [
  { section: 'find', label: 'Find leads' },
  { section: 'leads', label: 'Leads' },
  { section: 'followups', label: 'Follow-ups' },
  { section: 'insights', label: 'Insights' },
  { section: 'duplicates', label: 'Duplicate review' },
  { section: 'history', label: 'Discovery history' }
]

export const SECTION_TITLES: Record<AdminSection, string> = {
  dashboard: 'Overview',
  find: 'Find leads',
  leads: 'Leads',
  followups: 'Follow-ups',
  duplicates: 'Duplicate review',
  history: 'Discovery history',
  insights: 'Lead insights',
  analytics: 'Analytics',
  inbox: 'Inbox',
  calendar: 'Calendar',
  projects: 'Projects',
  proposals: 'Proposals',
  health: 'Site Health',
  settings: 'Settings'
}
