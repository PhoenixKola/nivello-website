'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { jumpToChapter } from '@/lib/cinematic/store'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    eyebrow: 'From idea to reality',
    titleStart: 'Modern web development',
    titleEnd: 'for ambitious brands.',
    body: 'Fast, maintainable websites and web apps with React and Next.js, from strategy to launch.',
    primary: 'View our work',
    secondary: 'Book a call',
    points: ['Italian & English', 'Development to launch', 'React / Next.js', 'EU-friendly'],
    scroll: 'Follow the route'
  },
  it: {
    eyebrow: 'Dall’idea alla realtà',
    titleStart: 'Sviluppo web moderno',
    titleEnd: 'per brand ambiziosi.',
    body: 'Siti e app web veloci e facili da mantenere con React e Next.js, dalla strategia al lancio.',
    primary: 'Guarda i lavori',
    secondary: 'Prenota una call',
    points: ['Italiano e inglese', 'Dallo sviluppo al lancio', 'React / Next.js', 'Mercato europeo'],
    scroll: 'Segui il percorso'
  }
} satisfies Record<Locale, {
  eyebrow: string
  titleStart: string
  titleEnd: string
  body: string
  primary: string
  secondary: string
  points: string[]
  scroll: string
}>

/** Chapter 01 — Ignition / Arrival. Three lines of type; the world does the talking. */
export default function HomeHero({ locale }: { locale: Locale }) {
  const t = copy[locale]

  return (
    <section
      id="cinematic-arrival"
      className="cin-ov cin-ov--arrival"
      data-cin-overlay="0"
      aria-labelledby="home-hero-heading"
    >
      <div className="cin-hero">
        <p className="cin-eyebrow"><i aria-hidden="true" />{t.eyebrow}</p>
        <h1 id="home-hero-heading" className="cin-hero__title">
          <span>{t.titleStart}</span>{' '}
          <em>{t.titleEnd}</em>
        </h1>
        <p className="cin-hero__body">{t.body}</p>
        <div className="cin-hero__actions">
          <Link href={getRoutePath('work', locale)} data-track-cta="hero_view_work" className="cin-btn cin-btn--solid">
            {t.primary}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={getRoutePath('contact', locale)} data-track-cta="hero_book_call" className="cin-btn cin-btn--ghost">
            {t.secondary}
          </Link>
        </div>
        <p className="cin-hero__points">{t.points.join('  ·  ')}</p>
      </div>
      <a href="#cinematic-process" className="cin-scroll-cue" onClick={event => jumpToChapter(event, 1, 0.06)}>
        {t.scroll}<ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </section>
  )
}
