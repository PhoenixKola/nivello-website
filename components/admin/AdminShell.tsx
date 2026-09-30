'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Image from 'next/image'
import { ChevronDown, LogOut, Menu as MenuIcon, X } from 'lucide-react'
import type { AdminSection } from '@/lib/admin/hooks'
import { useAdmin } from './AdminContext'
import AdminThemeToggle from './AdminThemeToggle'
import { AREA_GROUPS, areaFor, LEADFORGE_TABS, SECTION_TITLES, type AreaId } from './navigation'
import LeadDrawer from './sections/LeadDrawer'
import Dashboard from './sections/Dashboard'
import FindLeads from './sections/FindLeads'
import LeadsPage from './sections/LeadsPage'
import FollowUps from './sections/FollowUps'
import DuplicateReview from './sections/DuplicateReview'
import DiscoveryHistory from './sections/DiscoveryHistory'
import Analytics from './sections/Analytics'
import Calendar from './sections/Calendar'
import LeadInsights from './sections/LeadInsights'
import SettingsPage from './sections/Settings'
import SiteHealth from './sections/SiteHealth'
import Inbox from './sections/Inbox'
import Projects from './sections/Projects'
import Proposals from './sections/Proposals'
import { IconButton } from './ui/Button'
import LocalNav from './ui/LocalNav'
import { Menu } from './ui/Listbox'
import { cx, focusRing } from './ui/styles'

/** Screens that exist; sidebar areas without a screen are not shown. */
const VIEWS: Partial<Record<AdminSection, ComponentType>> = {
  dashboard: Dashboard,
  find: FindLeads,
  followups: FollowUps,
  duplicates: DuplicateReview,
  history: DiscoveryHistory,
  insights: LeadInsights,
  analytics: Analytics,
  health: SiteHealth,
  inbox: Inbox,
  calendar: Calendar,
  projects: Projects,
  proposals: Proposals,
  settings: SettingsPage
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { route, navigate, health, openBatches } = useAdmin()
  const activeArea = areaFor(route.section).id
  const badge = (area: AreaId) => {
    if (area === 'leadforge') return openBatches.length + (health?.counts.pendingDuplicates ?? 0) || null
    if (area === 'inbox') return health?.counts.newInquiries || null
    if (area === 'health') return health?.counts.siteIssues || null
    return null
  }
  return (
    <div className="space-y-5">
      {AREA_GROUPS.map(group => {
        const areas = group.areas.filter(area => area.home === 'leads' || VIEWS[area.home])
        if (!areas.length) return null
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{group.label}</p>
            <ul className="space-y-0.5">
              {areas.map(area => {
                const active = activeArea === area.id
                const count = badge(area.id)
                return (
                  <li key={area.id}>
                    <a
                      href={`#/${area.home}`}
                      onClick={() => {
                        navigate(area.home)
                        onNavigate?.()
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={cx(
                        'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80 dark:bg-white/[0.08] dark:text-white dark:ring-white/10'
                          : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.05] dark:hover:text-white',
                        focusRing
                      )}
                    >
                      {active && <span aria-hidden="true" className="absolute -left-3 top-2 h-5 w-1 rounded-r-full bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]" />}
                      <area.icon className={cx('h-4 w-4 shrink-0', active ? 'text-[var(--brand-blue)] dark:text-[var(--brand-gold)]' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                      <span className="flex-1 truncate">{area.label}</span>
                      {count !== null && (
                        <span className="rounded-full bg-[var(--brand-blue)]/12 px-1.5 text-[10px] font-semibold tabular-nums text-[#0b6fc0] dark:bg-[var(--brand-gold)]/15 dark:text-[var(--brand-gold)]">{count}</span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

function DiscoveryPill() {
  const { health, navigate } = useAdmin()
  if (!health) return null
  const online = health.discovery.available
  return (
    <button
      type="button"
      onClick={() => navigate('settings')}
      className={cx(
        'hidden h-8 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-medium sm:inline-flex',
        online ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300',
        focusRing
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', online ? 'bg-emerald-500' : 'bg-red-500')} aria-hidden="true" />
      {online ? 'Discovery ready' : 'Discovery unavailable'}
    </button>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <Image src="/nivello-logo-text-light.svg" alt="Nivello" width={160} height={46} className="h-auto w-[104px] dark:hidden" />
      <Image src="/nivello-logo-text.svg" alt="Nivello" width={160} height={46} className="hidden h-auto w-[104px] dark:block" />
      <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-white/10 dark:text-slate-200">Admin</span>
    </div>
  )
}

function LeadForgeNav() {
  const { route, navigate, health, openBatches } = useAdmin()
  const counts: Partial<Record<AdminSection, number>> = { find: openBatches.length, duplicates: health?.counts.pendingDuplicates ?? 0 }
  return (
    <LocalNav
      label="Lead Forge"
      items={LEADFORGE_TABS.map(tab => ({
        id: tab.section,
        label: tab.label,
        href: `#/${tab.section}`,
        active: route.section === tab.section,
        count: counts[tab.section] || null,
        onSelect: () => navigate(tab.section)
      }))}
    />
  )
}

export default function AdminShell() {
  const { route, logout } = useAdmin()
  const [mobileOpen, setMobileOpen] = useState(false)
  const area = areaFor(route.section)
  const View = VIEWS[route.section]

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMobileOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const account = (
    <Menu
      label="Account"
      items={[{ label: 'Log out', icon: <LogOut className="h-4 w-4" />, onSelect: logout }]}
      trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
        <button
          ref={ref}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className={cx('flex h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.07]', focusRing)}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-purple)] text-xs font-semibold text-white">N</span>
          <span className="hidden md:inline">Nivello team</span>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
        </button>
      )}
    />
  )

  return (
    <div className="flex min-h-screen bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:text-white">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-stone-100/60 px-3 py-4 lg:flex dark:border-white/[0.06] dark:bg-slate-950">
        <Brand />
        <nav aria-label="Admin" className="mt-7 flex-1 overflow-y-auto">
          <NavList />
        </nav>
        <p className="px-2 text-[11px] text-slate-400 dark:text-slate-500">Nivello internal workspace</p>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[65] lg:hidden">
          <div className="admin-fade-in absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Navigation" className="admin-slide-in-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-stone-50 px-4 py-4 shadow-2xl dark:bg-slate-950">
            <div className="flex items-center justify-between">
              <Brand />
              <IconButton label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <nav aria-label="Admin" className="mt-6 pl-3">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </nav>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-stone-50/90 px-4 backdrop-blur-md sm:px-6 dark:border-white/[0.06] dark:bg-slate-950/85">
          <IconButton label="Open navigation" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <MenuIcon className="h-5 w-5" />
          </IconButton>
          <div className="min-w-0 flex-1">
            {area.id === 'leadforge' && <p className="hidden text-[11px] font-medium text-slate-400 sm:block dark:text-slate-500">Lead Forge</p>}
            <h1 className="truncate text-base font-semibold tracking-tight">{SECTION_TITLES[route.section]}</h1>
          </div>
          <DiscoveryPill />
          <AdminThemeToggle />
          {account}
        </header>
        <main id="admin-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7">
          <div className="mx-auto w-full max-w-[1400px]">
            {area.id === 'leadforge' && <LeadForgeNav />}
            {route.section === 'leads' ? <LeadsPage key={route.params.toString()} /> : View ? <View /> : <Dashboard />}
          </div>
        </main>
      </div>
      <LeadDrawer />
    </div>
  )
}
