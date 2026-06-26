'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { getLocalizedPath, getPathLocale, getRoutePath, navRoutes, normalizePath, type Locale } from '@/lib/site'

function LocaleMark({ label }: { label: 'EN' | 'IT' }) {
  return (
    <span className="block h-3 w-[18px] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)]">
      {label === 'IT' ? (
        <svg viewBox="0 0 3 2" className="h-full w-full" aria-hidden="true">
          <rect width="1" height="2" x="0" fill="#009246" />
          <rect width="1" height="2" x="1" fill="#fff" />
          <rect width="1" height="2" x="2" fill="#ce2b37" />
        </svg>
      ) : (
        <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden="true">
          <rect width="60" height="30" fill="#012169" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
          <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="4" />
          <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
          <path d="M30,0 V30 M0,15 H60" stroke="#c8102e" strokeWidth="6" />
        </svg>
      )}
    </span>
  )
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() || '/'
  const currentPath = normalizePath(pathname)
  const locale: Locale = getPathLocale(currentPath)
  const isItalian = locale === 'it'

  const navItems = navRoutes.map(item => ({
    key: item.key,
    href: item.paths[locale],
    label: item.labels[locale]
  }))

  const ctaLabel = isItalian ? 'Prenota una call' : 'Book a call'
  const ctaHref = getRoutePath('contact', locale)
  const englishPath = getLocalizedPath(currentPath, 'en')
  const italianPath = getLocalizedPath(currentPath, 'it')
  const isActive = (href: string) => normalizePath(href) === currentPath

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-3.5">
        <Link href={isItalian ? '/it/' : '/'} className="flex shrink-0 items-center gap-2" aria-label="Nivello home">
          <Image
            src="/nivello-logo-text-light.svg"
            alt="Nivello"
            width={160}
            height={46}
            priority
            className="block h-auto w-[120px] dark:hidden md:w-[130px]"
          />
          <Image
            src="/nivello-logo-text.svg"
            alt="Nivello"
            width={160}
            height={46}
            priority
            className="hidden h-auto w-[120px] dark:block md:w-[130px]"
          />
        </Link>

        <nav className="hidden items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100/80 px-1 py-1 text-sm md:flex dark:border-slate-800 dark:bg-slate-900/70">
          {navItems.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                isActive(item.href)
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-slate-200 bg-slate-100/80 text-xs md:flex dark:border-slate-700 dark:bg-slate-900/80">
            <Link
              href={englishPath}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all ${
                isItalian
                  ? 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              }`}
            >
              <LocaleMark label="EN" />
              EN
            </Link>
            <Link
              href={italianPath}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-all ${
                isItalian
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <LocaleMark label="IT" />
              IT
            </Link>
          </div>

          <ThemeToggle />

          <Link
            href={ctaHref}
            className="hidden rounded-full border border-[var(--brand-gold)]/70 bg-[var(--brand-gold)]/12 px-4 py-1.5 text-xs font-semibold text-slate-900 transition-all hover:bg-[var(--brand-gold)]/20 md:inline-flex dark:border-[var(--brand-gold)]/45 dark:bg-[var(--brand-gold)]/10 dark:text-[var(--brand-gold)] dark:hover:bg-[var(--brand-gold)]/15"
          >
            {ctaLabel}
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 md:hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden bg-stone-50/98 md:hidden dark:bg-slate-950/95"
          >
            <div className="mx-auto max-w-6xl px-4 py-4">
              <nav className="mb-4 flex flex-col gap-0.5">
                {navItems.map(item => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 text-xs dark:border-slate-700 dark:bg-slate-800/80">
                  <Link
                    href={englishPath}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-all ${
                      isItalian
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    }`}
                  >
                    <LocaleMark label="EN" />
                    EN
                  </Link>
                  <Link
                    href={italianPath}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 transition-all ${
                      isItalian
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <LocaleMark label="IT" />
                    IT
                  </Link>
                </div>

                <Link
                  href={ctaHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-[var(--brand-gold)]/70 bg-[var(--brand-gold)]/12 px-4 py-1.5 text-xs font-semibold text-slate-900 transition-all hover:bg-[var(--brand-gold)]/20 dark:border-[var(--brand-gold)]/45 dark:bg-[var(--brand-gold)]/10 dark:text-[var(--brand-gold)]"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
