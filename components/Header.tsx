'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/work', label: 'Our Work' },
  { href: '/process', label: 'How we work' },
  { href: '/contact', label: 'Contact' }
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/40">
            <span className="text-sm font-semibold text-emerald-400">NV</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-wide">Nivello</p>
            <p className="text-xs text-slate-400">Marketing · Design · Development</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-900/70 px-1 py-1 text-sm text-slate-200 md:flex">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1 transition ${
                  active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <Link
          href="/contact"
          className="hidden rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 md:inline-flex"
        >
          Book a call
        </Link>
      </div>

      <div className="border-t border-slate-900 bg-slate-950/95 px-4 py-2 text-sm text-slate-200 md:hidden">
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                  active
                    ? 'bg-slate-100 text-slate-900'
                    : 'bg-slate-900 text-slate-300'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}