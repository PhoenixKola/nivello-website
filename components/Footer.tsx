'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function Footer() {
  const pathname = usePathname() || '/'
  const isItalian = pathname.startsWith('/it')
  const year = new Date().getFullYear()

  const links = isItalian
    ? [
        { href: '/it/chi-siamo', label: 'Chi siamo' },
        { href: '/it/impronta', label: 'Impronta' },
        { href: '/it/privacy', label: 'Privacy' },
        { href: '/it/disclaimer', label: 'Disclaimer' },
        { href: '/it/contact', label: 'Contatti' }
      ]
    : [
        { href: '/about', label: 'About' },
        { href: '/imprint', label: 'Imprint' },
        { href: '/privacy', label: 'Privacy' },
        { href: '/disclaimer', label: 'Disclaimer' },
        { href: '/contact', label: 'Contact' }
      ]

  const tagline = isItalian
    ? 'Basato in Italia · Collaboriamo con clienti in tutta Europa'
    : 'Based in Italy · Working with clients across Europe'

  return (
    <footer className="border-t border-slate-900 bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/nivello-logo.svg"
            alt="Nivello Studio Logo"
            width={36}
            height={36}
            className="h-9 w-9"
          />
          <div className="leading-tight">
            <p className="text-[0.7rem] text-slate-200">{tagline}</p>
            <p className="mt-1 text-[0.7rem] text-slate-400">
              © {year} Nivello. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex flex-wrap gap-3 md:justify-end">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.75rem] text-slate-400 hover:text-slate-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-[0.7rem] text-slate-400">
            Email:{' '}
            <a
              href="mailto:office@nivello.it"
              className="text-emerald-300 hover:text-emerald-200"
            >
              office@nivello.it
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}