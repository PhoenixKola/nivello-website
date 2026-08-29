'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { findRouteByPath, footerRoutes, getPathLocale, getRoutePath, navRoutes } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Your next project',
    title: 'Have something worth building?',
    body: 'Tell us where you are now. We will help make the next move clear.',
    cta: 'Start a conversation',
    intro: 'Strategy, design, and development for digital experiences people understand and businesses can use.',
    explore: 'Explore',
    company: 'Studio',
    contact: 'Contact',
    availability: 'Taking on selected projects',
    location: 'Working across Europe',
    rights: 'All rights reserved.'
  },
  it: {
    eyebrow: 'Il tuo prossimo progetto',
    title: 'Hai qualcosa che vale la pena costruire?',
    body: 'Raccontaci da dove parti. Ti aiutiamo a rendere chiaro il prossimo passo.',
    cta: 'Iniziamo a parlarne',
    intro: 'Strategia, design e sviluppo per esperienze digitali comprensibili alle persone e utili alle aziende.',
    explore: 'Esplora',
    company: 'Studio',
    contact: 'Contatti',
    availability: 'Disponibili per progetti selezionati',
    location: 'Lavoriamo in tutta Europa',
    rights: 'Tutti i diritti riservati.'
  }
}

export default function Footer() {
  const pathname = usePathname() || '/'
  const locale = getPathLocale(pathname)
  const content = copy[locale]
  const year = new Date().getFullYear()
  const contactPath = getRoutePath('contact', locale)
  // The contact page already ends with its own form and FAQ, so repeating the
  // "get in touch" pitch directly above the footer links reads as filler.
  const isContactPage = findRouteByPath(pathname)?.key === 'contact'
  const exploreLinks = navRoutes.map(route => ({ href: route.paths[locale], label: route.labels[locale] }))
  const companyLinks = footerRoutes
    .filter(route => route.key !== 'contact')
    .map(route => ({ href: route.paths[locale], label: route.labels[locale] }))

  return (
    <footer id="site-footer" className="bg-stone-50 text-slate-900 dark:bg-slate-950/95 dark:text-white">
      <div className={`mx-auto max-w-7xl px-4 pb-8 sm:px-6 md:pb-10 lg:px-8 ${isContactPage ? 'pt-0' : 'pt-16 md:pt-24'}`}>
        {!isContactPage && (
          <section className="relative overflow-hidden bg-slate-100 px-6 py-8 text-slate-950 sm:px-8 sm:py-10 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:px-12 lg:py-12 dark:bg-slate-950 dark:text-white">
            <div className="absolute inset-y-0 left-0 flex w-1.5 flex-col" aria-hidden="true">
              <span className="h-1/3 w-full bg-[var(--brand-blue)]" />
              <span className="h-1/3 w-full bg-[var(--brand-purple)]" />
              <span className="h-1/3 w-full bg-[var(--brand-gold)]" />
            </div>
            <div className="relative max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-400">{content.eyebrow}</p>
              <h2 className="mt-4 font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
                {content.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">{content.body}</p>
            </div>
            <Link
              href={contactPath}
              className="group relative mt-7 inline-flex min-h-12 items-center justify-between gap-8 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-blue)] lg:mt-0 dark:bg-white dark:text-slate-950 dark:hover:bg-[var(--brand-gold)]"
            >
              {content.cta}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </section>
        )}

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.45fr_0.65fr_0.65fr_1fr] lg:gap-10 lg:py-16">
          <div className="max-w-sm">
            <Link href={getRoutePath('home', locale)} aria-label="Nivello home" className="inline-block">
              <Image src="/nivello-logo-text-light.svg" alt="Nivello" width={160} height={46} loading="eager" className="block h-auto w-[138px] dark:hidden" />
              <Image src="/nivello-logo-text.svg" alt="Nivello" width={160} height={46} loading="eager" className="hidden h-auto w-[138px] dark:block" />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{content.intro}</p>
            <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="h-2 w-2 bg-emerald-500" aria-hidden="true" />
              {content.availability}
            </div>
          </div>

          <nav aria-label={content.explore}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{content.explore}</p>
            <ul className="mt-5 space-y-3">
              {exploreLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-[var(--brand-blue)] dark:text-slate-300 dark:hover:text-sky-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={content.company}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{content.company}</p>
            <ul className="mt-5 space-y-3">
              {companyLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-[var(--brand-blue)] dark:text-slate-300 dark:hover:text-sky-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{content.contact}</p>
            <a
              href="mailto:office@nivello.it"
              className="group mt-5 flex items-center justify-between border-b border-slate-300 pb-3 text-sm font-semibold text-slate-900 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] dark:border-white/15 dark:text-white dark:hover:border-sky-400 dark:hover:text-sky-400"
            >
              office@nivello.it
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
            <p className="mt-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{content.location}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-6 text-[11px] text-slate-400 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:text-slate-500">
          <p>© {year} Nivello. {content.rights}</p>
          <p>Strategy · Design · Development</p>
        </div>
      </div>
    </footer>
  )
}
