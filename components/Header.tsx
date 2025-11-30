'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import ReactCountryFlag from 'react-country-flag'

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
  const pathname = usePathname() || '/'
  const isItalian = pathname.startsWith('/it')

  const basePrefix = isItalian ? '/it' : ''

  const navItems = baseItems.map(item => {
    const href =
      item.key === 'home'
        ? isItalian
          ? '/it'
          : '/'
        : `${basePrefix}${item.basePath}`

    const label = isItalian ? item.labelIt : item.labelEn

    return { key: item.key, href, label }
  })

  const ctaLabel = isItalian ? 'Prenota una call' : 'Book a call'

  const englishPath = isItalian
    ? pathname.replace(/^\/it/, '') || '/'
    : pathname || '/'

  const italianPath = isItalian
    ? pathname || '/it'
    : pathname === '/'
    ? '/it'
    : `/it${pathname}`

  const isActive = (href: string) => pathname === href

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-linear-to-r from-emerald-500/8 via-slate-950 to-sky-500/8 bg-slate-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
        <Link href={isItalian ? '/it' : '/'} className="flex items-center gap-2">
          <Image
            src="/nivello-logo-text.svg"
            alt="Nivello Logo"
            width={150}
            height={150}
            priority
            // className="h-9 w-9"
          />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-800 bg-slate-900/70 px-1 py-1 text-sm text-slate-200 md:flex">
          {navItems.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-full px-3 py-1 transition ${
                isActive(item.href)
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center rounded-full border border-slate-700 bg-slate-900/80 text-xs md:flex">
            <Link
              href={englishPath}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                isItalian ? 'text-slate-400' : 'bg-slate-100 text-slate-900'
              }`}
            >
              <ReactCountryFlag countryCode="GB" svg style={{ width: '1em', height: '1em' }} />
              EN
            </Link>
            <Link
              href={italianPath}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${
                isItalian ? 'bg-slate-100 text-slate-900' : 'text-slate-400'
              }`}
            >
              <ReactCountryFlag countryCode="IT" svg style={{ width: '1em', height: '1em' }} />
              IT
            </Link>
          </div>

          <Link
            href={isItalian ? '/it/contact' : '/contact'}
            className="hidden rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 md:inline-flex"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-900 bg-slate-950/95 px-4 py-2 text-sm text-slate-200 md:hidden">
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
          {navItems.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${
                isActive(item.href)
                  ? 'bg-slate-100 text-slate-900'
                  : 'bg-slate-900 text-slate-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}