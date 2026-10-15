'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react'
import { footerCopy } from '@/components/Footer'
import { cinematic, useCinematic } from '@/lib/cinematic/store'
import { footerRoutes, getRoutePath, navRoutes, type Locale } from '@/lib/site'

const toggleCopy = {
  en: { hide: 'Hide footer', show: 'Show footer', home: 'Nivello, homepage' },
  it: { hide: 'Nascondi il footer', show: 'Mostra il footer', home: 'Nivello, homepage' }
}

/**
 * The homepage's own footer: the final beat of the cinematic story. Same content, links and tracking as the
 * shared footer (which renders nothing on the homepage), set over the closing vista instead of a flat block.
 */
export default function HomeFooter({ locale }: { locale: Locale }) {
  const t = footerCopy[locale]
  const toggle = toggleCopy[locale]
  const hidden = useCinematic(state => state.footerHidden, false)
  const live = useCinematic(state => state.mode === 'live', false)
  const year = new Date().getFullYear()
  const explore = navRoutes.map(route => ({ href: route.paths[locale], label: route.labels[locale] }))
  const studio = footerRoutes.filter(route => route.key !== 'contact').map(route => ({ href: route.paths[locale], label: route.labels[locale] }))

  return (
    <footer id="site-footer" role="contentinfo" className="cin-ov cin-ov--footer" data-cin-overlay="8" data-cin-from="0.5" data-active="false" data-hidden={hidden && live ? 'true' : 'false'}>
      {live && (
        <button type="button" className="cin-foot__toggle" aria-pressed={hidden} aria-controls="cin-foot-body" onClick={() => cinematic.set({ footerHidden: !hidden })}>
          {hidden ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          {hidden ? toggle.show : toggle.hide}
        </button>
      )}
      <div className="cin-foot" id="cin-foot-body" inert={hidden && live ? true : undefined}>
        <div className="cin-foot__lead">
          <p className="cin-eyebrow"><i aria-hidden="true" />{t.eyebrow}</p>
          <h2 className="cin-foot__title">{t.title}</h2>
          <p className="cin-foot__body">{t.body}</p>
          <Link href={getRoutePath('contact', locale)} data-track-cta="footer_start" className="cin-btn cin-btn--ghost">
            {t.cta}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="cin-foot__grid">
          <div className="cin-foot__brand">
            <Link href={getRoutePath('home', locale)} aria-label={toggle.home}>
              <Image src="/nivello-logo-text-light.svg" alt="Nivello" width={160} height={46} className="cin-foot__logo cin-foot__logo--light" />
              <Image src="/nivello-logo-text.svg" alt="Nivello" width={160} height={46} className="cin-foot__logo cin-foot__logo--dark" />
            </Link>
            <p className="cin-foot__intro">{t.intro}</p>
            <p className="cin-foot__status"><span aria-hidden="true" />{t.availability}</p>
          </div>

          <nav aria-label={t.explore} className="cin-foot__col">
            <p>{t.explore}</p>
            <ul>{explore.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          </nav>

          <nav aria-label={t.company} className="cin-foot__col">
            <p>{t.company}</p>
            <ul>{studio.map(link => <li key={link.href}><Link href={link.href}>{link.label}</Link></li>)}</ul>
          </nav>

          <div className="cin-foot__col cin-foot__contact">
            <p>{t.contact}</p>
            <a href="mailto:office@nivello.it">office@nivello.it<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
            <span>{t.location}</span>
          </div>
        </div>

        <div className="cin-foot__legal">
          <p>© {year} Nivello. {t.rights}</p>
          <p>Development · Design · Strategy</p>
        </div>
      </div>
    </footer>
  )
}
