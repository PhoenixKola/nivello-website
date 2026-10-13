'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { footerCopy } from '@/components/Footer'
import { footerRoutes, getRoutePath, navRoutes, type Locale } from '@/lib/site'

/**
 * The homepage's own footer: the final beat of the cinematic story. Same content, links and tracking as the
 * shared footer (which renders nothing on the homepage), set over the closing vista instead of a flat block.
 */
export default function HomeFooter({ locale }: { locale: Locale }) {
  const t = footerCopy[locale]
  const year = new Date().getFullYear()
  const explore = navRoutes.map(route => ({ href: route.paths[locale], label: route.labels[locale] }))
  const studio = footerRoutes.filter(route => route.key !== 'contact').map(route => ({ href: route.paths[locale], label: route.labels[locale] }))

  return (
    <footer id="site-footer" role="contentinfo" className="cin-ov cin-ov--footer" data-cin-overlay="6" data-cin-from="0.5" data-active="false">
      <div className="cin-foot">
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
            <Link href={getRoutePath('home', locale)} aria-label="Nivello home">
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
