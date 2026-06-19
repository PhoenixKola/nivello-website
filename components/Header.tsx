'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import ReactCountryFlag from 'react-country-flag'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

type NavItemBase = {
  key: string
  basePath: string
  labelEn: string
  labelIt: string
}

const baseItems: NavItemBase[] = [
  { key: 'home', basePath: '', labelEn: 'Home', labelIt: 'Home' },
  { key: 'services', basePath: '/services', labelEn: 'Services', labelIt: 'Servizi' },
  { key: 'work', basePath: '/work', labelEn: 'Our Work', labelIt: 'Lavori' },
  { key: 'process', basePath: '/process', labelEn: 'How we work', labelIt: 'Metodo' },
  { key: 'contact', basePath: '/contact', labelEn: 'Contact', labelIt: 'Contatti' }
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() || '/'
  const isItalian = pathname.startsWith('/it')
  const basePrefix = isItalian ? '/it' : ''

  const navItems = baseItems.map(item => {
    const href = item.key === 'home' ? (isItalian ? '/it' : '/') : `${basePrefix}${item.basePath}`
    return { key: item.key, href, label: isItalian ? item.labelIt : item.labelEn }
  })

  const ctaLabel = isItalian ? 'Prenota una call' : 'Book a call'
  const ctaHref = isItalian ? '/it/contact' : '/contact'
  const englishPath = isItalian ? pathname.replace(/^\/it/, '') || '/' : pathname || '/'
  const italianPath = isItalian ? pathname || '/it' : pathname === '/' ? '/it' : `/it${pathname}`
  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-3.5">
        <Link href={isItalian ? '/it' : '/'} className="flex shrink-0 items-center gap-2" aria-label="Nivello home">
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
              <ReactCountryFlag countryCode="GB" svg style={{ width: '1em', height: '1em' }} />
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
              <ReactCountryFlag countryCode="IT" svg style={{ width: '1em', height: '1em' }} />
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
            className="overflow-hidden border-t border-slate-100 bg-white/98 md:hidden dark:border-slate-800/60 dark:bg-slate-950/98"
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

              <div className="mb-4 border-t border-slate-100 dark:border-slate-800" />

              <div className="flex items-center justify-between gap-3">
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
                    <ReactCountryFlag countryCode="GB" svg style={{ width: '0.9em', height: '0.9em' }} />
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
                    <ReactCountryFlag countryCode="IT" svg style={{ width: '0.9em', height: '0.9em' }} />
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
