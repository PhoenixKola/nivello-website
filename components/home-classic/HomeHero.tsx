'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, CheckCircle2, Code2, Globe2, Languages, Workflow } from 'lucide-react'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'Working across Europe',
    titleStart: 'Modern web development for',
    titleEnd: 'ambitious brands.',
    body: 'We build fast, maintainable websites and web apps with React and Next.js, with strategy, design, and marketing support where the product needs it.',
    primary: 'View our work',
    secondary: 'Book a call',
    points: ['Italian & English', 'Development to launch', 'React / Next.js', 'EU-friendly'],
    frontLabel: 'Customer experience',
    frontTitle: 'Built around your next move.',
    frontBody: 'Clear story. Confident action. A digital presence that earns attention.',
    frontCta: 'Explore the experience',
    backLabel: 'Operations',
    backTitle: 'Work moving today',
    activeProjects: 'Active projects',
    newRequests: 'New requests',
    flow: ['New request', 'Qualified', 'In progress'],
    request: 'Website request',
    connected: 'Added to workflow'
  },
  it: {
    eyebrow: 'Attivi in Europa',
    titleStart: 'Sviluppo web moderno per brand',
    titleEnd: 'ambiziosi.',
    body: 'Sviluppiamo siti e applicazioni web veloci e facili da mantenere con React e Next.js, con strategia, design e marketing a supporto del prodotto quando servono.',
    primary: 'Guarda i lavori',
    secondary: 'Prenota una call',
    points: ['Italiano e inglese', 'Dallo sviluppo al lancio', 'React / Next.js', 'Mercato europeo'],
    frontLabel: 'Esperienza cliente',
    frontTitle: 'Costruito intorno alla tua prossima mossa.',
    frontBody: 'Una storia chiara, un’azione sicura e una presenza digitale che conquista attenzione.',
    frontCta: 'Esplora l’esperienza',
    backLabel: 'Operatività',
    backTitle: 'Il lavoro in movimento',
    activeProjects: 'Progetti attivi',
    newRequests: 'Nuove richieste',
    flow: ['Nuova richiesta', 'Qualificata', 'In corso'],
    request: 'Richiesta dal sito',
    connected: 'Aggiunta al flusso'
  }
} satisfies Record<Locale, {
  eyebrow: string
  titleStart: string
  titleEnd: string
  body: string
  primary: string
  secondary: string
  points: string[]
  frontLabel: string
  frontTitle: string
  frontBody: string
  frontCta: string
  backLabel: string
  backTitle: string
  activeProjects: string
  newRequests: string
  flow: string[]
  request: string
  connected: string
}>

const POINT_ICONS = [Languages, CheckCircle2, Code2, Globe2]

const INTRO_SESSION_KEY ='nivello-product-assembly-seen-v1'

export default function HomeHero({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const sectionRef = useRef<HTMLElement>(null)
  const [phase, setPhase] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 639px)').matches
    let seen = false

    try {
      seen = window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1'
    } catch {
      seen = false
    }

    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => setPhase(11))
      return () => window.cancelAnimationFrame(frame)
    }

    if (seen) {
      const phases = [6, 7, 8, 9, 10, 11]
      const timers = phases.map((nextPhase, index) => window.setTimeout(() => setPhase(nextPhase), 50 + index * 80))
      return () => timers.forEach(window.clearTimeout)
    }

    const timings = compact
      ? [60, 170, 290, 430, 620, 790, 970, 1110, 1260, 1410, 1560]
      : [120, 290, 470, 690, 940, 1190, 1480, 1690, 1890, 2110, 2290]

    const timers = timings.map((delay, index) => window.setTimeout(() => {
      const nextPhase = index + 1
      setPhase(nextPhase)
      if (nextPhase === 11) {
        try {
          window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')
        } catch {
          // The final state remains usable when session storage is unavailable.
        }
      }
    }, delay))

    return () => timers.forEach(window.clearTimeout)
  }, [])

  useEffect(() => {
    const node = sectionRef.current
    if (!node || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.06 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="home-assembly-hero bg-stone-50 dark:bg-slate-950/95"
      data-phase={phase}
      data-front-ready={phase >= 4 ? 'true' : 'false'}
      data-back-ready={phase >= 5 ? 'true' : 'false'}
      data-connected={phase >= 6 ? 'true' : 'false'}
      data-headline-ready={phase >= 7 ? 'true' : 'false'}
      data-body-ready={phase >= 8 ? 'true' : 'false'}
      data-actions-ready={phase >= 9 ? 'true' : 'false'}
      data-nav-ready={phase >= 10 ? 'true' : 'false'}
      data-interactive={phase >= 11 ? 'true' : 'false'}
      data-visible={isVisible ? 'true' : 'false'}
      aria-labelledby="home-hero-heading"
    >
      <div className="assembly-stage" aria-hidden="true">
        <span className="assembly-rail assembly-rail--horizontal" />
        <span className="assembly-rail assembly-rail--vertical" />

        <div className="assembly-object">
          <div className="assembly-back-motion">
            <div className="assembly-back-panel">
              <div className="assembly-panel-depth" />
              <div className="assembly-ops-header assembly-detail">
                <span className="assembly-product-mark">
                  <Image src="/nivello-icon.png" alt="" width={28} height={28} loading="eager" />
                </span>
                <span>
                  <small>{t.backLabel}</small>
                  <strong>{t.backTitle}</strong>
                </span>
                <span className="assembly-online-dot" />
              </div>

              <div className="assembly-metrics assembly-detail">
                <div><span>{t.activeProjects}</span><strong>06</strong><small>+2</small></div>
                <div><span>{t.newRequests}</span><strong>12</strong><small>+4</small></div>
              </div>

              <div className="assembly-workflow assembly-detail">
                {t.flow.map((label, index) => (
                  <div key={label} className={index === 1 ? 'is-current' : ''}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{label}</strong>
                    {index === 1 && <Check />}
                  </div>
                ))}
              </div>

              <div className="assembly-request-row assembly-detail">
                <span className="assembly-request-icon"><Globe2 /></span>
                <span><strong>{t.request}</strong><small>{t.connected}</small></span>
                <span className="assembly-status-dot" />
              </div>
            </div>
          </div>

          <div className="assembly-spine">
            <span className="assembly-signal" />
          </div>
          <span className="assembly-back-hit" />

          <div className="assembly-front-motion">
            <div className="assembly-front-panel">
              <span className="assembly-frame assembly-frame--top" />
              <span className="assembly-frame assembly-frame--right" />
              <span className="assembly-frame assembly-frame--bottom" />
              <span className="assembly-frame assembly-frame--left" />
              <div className="assembly-front-surface">
                <div className="assembly-front-nav assembly-front-layer assembly-front-layer--nav">
                  <span className="assembly-wordmark">
                    <Image src="/nivello-icon.png" alt="" width={24} height={24} loading="eager" />
                    <strong>Nivello</strong>
                  </span>
                  <span className="assembly-nav-lines"><i /><i /><i /></span>
                  <span className="assembly-nav-action" />
                </div>

                <div className="assembly-front-content">
                  <div className="assembly-front-copy">
                    <span className="assembly-kicker assembly-front-layer assembly-front-layer--type">{t.frontLabel}</span>
                    <strong className="assembly-demo-title assembly-front-layer assembly-front-layer--type">{t.frontTitle}</strong>
                    <p className="assembly-front-layer assembly-front-layer--type">{t.frontBody}</p>
                    <span className="assembly-demo-cta assembly-front-layer assembly-front-layer--controls">
                      {t.frontCta}<ArrowRight />
                    </span>
                  </div>

                  <div className="assembly-media assembly-front-layer assembly-front-layer--media">
                    <span className="assembly-media-index">01 / 03</span>
                    <Image className="assembly-media-logo" src="/nivello-icon.png" alt="" width={120} height={120} loading="eager" />
                    <span className="assembly-media-caption">Digital systems<br />made tangible.</span>
                    <span className="assembly-media-rule" />
                  </div>
                </div>

                <div className="assembly-front-footer assembly-front-layer assembly-front-layer--details">
                  <span>Strategy</span><span>Design</span><span>Development</span>
                  <Workflow />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="assembly-hero-copy">
        <p className="assembly-hero-eyebrow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" aria-hidden="true" />
          {t.eyebrow}
        </p>
        <h1 id="home-hero-heading">
          <span>{t.titleStart}</span>
          <em>{t.titleEnd}</em>
        </h1>
        <p className="assembly-hero-body">{t.body}</p>
        <div className="assembly-hero-actions">
          <Link href={getRoutePath('work', locale)} data-track-cta="hero_view_work" className="assembly-hero-primary">
            {t.primary}<ArrowRight aria-hidden="true" />
          </Link>
          <Link href={getRoutePath('contact', locale)} data-track-cta="hero_book_call" className="assembly-hero-secondary">
            {t.secondary}
          </Link>
        </div>
        <ul className="assembly-hero-points">
          {t.points.map((label, index) => {
            const Icon = POINT_ICONS[index]
            return (
              <li key={label}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
