'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cinematic, useCinematic } from '@/lib/cinematic/store'
import { getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'
import { useHydratedReducedMotion } from '@/lib/useHydratedReducedMotion'

type ProofQuote = { slug: string; name: string; role: string; quote: string }

// Only feedback that matches the project facts in lib/projects.ts is shown.
// Le Camelie and Consteam are left out until their wording is verified.
export const proofQuotes: Record<Locale, ProofQuote[]> = {
  en: [
    {
      slug: 'rombo-nord',
      name: 'Eduard',
      role: 'Owner, Rombo Nord',
      quote: 'Nivello gave us a modern site and a clearer story. We finally feel proud to share the link with guests.'
    },
    {
      slug: 'le-camelie',
      name: 'The owners',
      role: 'Le Camelie, Genova',
      quote: 'Guests now see the rooms, the location and how to book in a few seconds. More of them book directly with us instead of asking first.'
    },
    {
      slug: 'gjergj-jozef-kola',
      name: 'Gjergj',
      role: 'Author',
      quote: 'Communication was clear, deadlines were respected, and every design choice had a reason behind it.'
    },
    {
      slug: 'consteam',
      name: 'The founders',
      role: 'Consteam',
      quote: 'Our services finally make sense on one page, for private clients and companies alike. Requests arrive with the details we need to quote.'
    },
    {
      slug: 'your-assist-in-italy',
      name: 'Davide',
      role: 'Founder, Your Assist in Italy',
      quote: 'Nivello made our services immediately clear. International clients now understand what we offer before even booking a call.'
    },
    {
      slug: 'progreen',
      name: 'Klajdi',
      role: 'Owner, ProGreen',
      quote: 'We asked for a landing page and a tool to run our sites, and both arrived working the way we actually work on site.'
    }
  ],
  it: [
    {
      slug: 'rombo-nord',
      name: 'Eduard',
      role: 'Titolare, Rombo Nord',
      quote: 'Nivello ci ha dato un sito moderno e una storia più chiara. Ora siamo felici di condividere il link con gli ospiti.'
    },
    {
      slug: 'le-camelie',
      name: 'I titolari',
      role: 'Le Camelie, Genova',
      quote: 'Ora gli ospiti vedono camere, posizione e come prenotare in pochi secondi. Sempre più persone prenotano direttamente, senza doverci scrivere prima.'
    },
    {
      slug: 'gjergj-jozef-kola',
      name: 'Gjergj',
      role: 'Autore',
      quote: 'Comunicazione chiara, rispetto delle scadenze e scelte di design sempre motivate.'
    },
    {
      slug: 'consteam',
      name: 'I fondatori',
      role: 'Consteam',
      quote: 'I nostri servizi finalmente si capiscono al primo sguardo, per privati e aziende. Le richieste arrivano già con i dettagli che ci servono per il preventivo.'
    },
    {
      slug: 'your-assist-in-italy',
      name: 'Davide',
      role: 'Fondatore, Your Assist in Italy',
      quote: 'Nivello ha reso chiari i nostri servizi in modo immediato. I clienti internazionali ora capiscono cosa facciamo prima ancora di prenotare una consulenza.'
    },
    {
      slug: 'progreen',
      name: 'Klajdi',
      role: 'Titolare, ProGreen',
      quote: 'Avevamo chiesto una landing page e uno strumento per seguire i cantieri: sono arrivati entrambi, e funzionano come lavoriamo davvero.'
    }
  ]
}

const copy = {
  en: {
    chapter: 'Proof',
    eyebrow: 'Client feedback',
    title: 'What it is like to build with us.',
    intro: 'Feedback from the people we built for, shown next to the work it refers to.',
    selector: 'Choose a client',
    hint: 'Scroll to walk the corridor. Select a painting to read the review.',
    close: 'Back to the corridor',
    back: 'Back',
    openReview: 'Open review',
    pair: 'Section',
    delivered: 'What we delivered',
    outcome: 'Outcome',
    caseStudy: 'Read the case study',
    alt: (title: string) => `${title} website preview`
  },
  it: {
    chapter: 'Prove',
    eyebrow: 'Feedback dei clienti',
    title: 'Com’è costruire con noi.',
    intro: 'Il feedback delle persone per cui abbiamo lavorato, accanto al progetto a cui si riferisce.',
    selector: 'Scegli un cliente',
    hint: 'Scorri per percorrere il corridoio. Scegli un quadro per leggere la recensione.',
    close: 'Torna al corridoio',
    back: 'Indietro',
    openReview: 'Apri la recensione',
    pair: 'Sezione',
    delivered: 'Cosa abbiamo realizzato',
    outcome: 'Risultato',
    caseStudy: 'Leggi il case study',
    alt: (title: string) => `Anteprima del sito ${title}`
  }
} satisfies Record<Locale, Record<string, unknown>>

// Project colours are brand colours; very dark ones need a lighter stand-in on the dark theme.
function accentStyle(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return { '--accent': hex, '--accent-dark': luminance < 0.25 ? '#94a3b8' : hex } as React.CSSProperties
}

/** Progressive reveal for the opened review. The full text is always in the DOM for assistive tech and reduced motion. */
function TypedQuote({ text, run }: { text: string; run: boolean }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!run) return
    let shown = 0
    const timer = window.setInterval(() => {
      shown += 2
      setCount(Math.min(text.length, shown))
      if (shown >= text.length) window.clearInterval(timer)
    }, 16)
    return () => window.clearInterval(timer)
  }, [text, run])
  const visible = run ? text.slice(0, count) : text
  return (
    <>
      <span aria-hidden="true">{visible}</span>
      <span className="sr-only">{text}</span>
    </>
  )
}

/**
 * Chapter 08: the review tunnel. While travelling, the displays live in the 3D corridor and this overlay stays quiet
 * (a short hint and the selector). Selecting a display brings the camera to it and opens the real quote here.
 */
export default function ProofSection({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const reducedMotion = useHydratedReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const returnFocus = useRef(-1)
  const opener = useRef<HTMLElement | null>(null)
  const spotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const live = useCinematic(state => state.mode === 'live', false)
  const focused = useCinematic(state => state.reviewFocus, -1)
  const nearest = useCinematic(state => state.proofIndex, 0)
  const chapter = useCinematic(state => state.chapter, 0)
  const [localIndex, setLocalIndex] = useState(0)

  const items = useMemo(() => {
    const projects = getProjects(locale)
    return proofQuotes[locale].flatMap(quote => {
      const project = projects.find(p => p.slug === quote.slug)
      return project ? [{ ...quote, project }] : []
    })
  }, [locale])

  // The opened review is released by Escape, by the close button, or by scrolling on: never a trap.
  const release = (restoreFocus = false) => {
    const from = cinematic.get().reviewFocus
    cinematic.set({ reviewFocus: -1 })
    if (restoreFocus) {
      const target = returnFocus.current >= 0 ? returnFocus.current : from
      window.requestAnimationFrame(() => {
        const back = opener.current && document.contains(opener.current) ? opener.current : tabRefs.current[target]
        back?.focus({ preventScroll: true })
      })
    }
  }
  useEffect(() => {
    if (!live || focused < 0) return
    const startY = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 60) release()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') release(true)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [live, focused])
  useEffect(() => {
    if (chapter !== 7 && cinematic.get().reviewFocus >= 0) release()
  }, [chapter])

  const openIndex = live ? focused : localIndex
  const highlighted = live ? (focused >= 0 ? focused : nearest) : localIndex
  const active = openIndex >= 0 ? items[Math.min(openIndex, items.length - 1)] : null

  // Keep the highlighted chip in view inside the horizontal chip row (phones) without scrolling the page.
  useEffect(() => {
    const list = listRef.current
    const chip = tabRefs.current[highlighted]
    if (!list || !chip || list.scrollWidth <= list.clientWidth + 1) return
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2, behavior: reducedMotion ? 'auto' : 'smooth' })
  }, [highlighted, reducedMotion])

  const select = (index: number, from?: HTMLElement | null) => {
    returnFocus.current = index
    opener.current = from ?? tabRefs.current[index]
    if (live) cinematic.set({ reviewFocus: focused === index ? -1 : index })
    else setLocalIndex(index)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1
    const map: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowDown: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last
    }
    if (event.key in map) {
      event.preventDefault()
      select(map[event.key])
      tabRefs.current[map[event.key]]?.focus()
    }
  }

  const pairs: (typeof items)[] = []
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2))

  return (
    <section id="cinematic-trust" className="cin-ov cin-ov--trust" data-cin-overlay="7" style={active ? accentStyle(active.project.color) : undefined} aria-labelledby="home-proof-heading">
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">08</span><span className="cin-head__name">{t.chapter}</span><span className="cin-head__sep" aria-hidden="true" /><span className="cin-head__kind">{t.eyebrow}</span></p>
        <h2 id="home-proof-heading" className="cin-head__title">{t.title}</h2>
        <p className="cin-head__intro">{t.intro}</p>
      </header>

      <div id={`${baseId}-panel`} role="tabpanel" aria-live="polite" aria-labelledby={active ? `${baseId}-tab-${active.slug}` : undefined} className="cin-review" data-open={active ? 'true' : 'false'} data-scroll-ok>
        {active ? (
          <figure key={active.slug} className="cin-review__card">
            <button type="button" className="cin-review__close" onClick={() => (live ? release(true) : setLocalIndex(0))} aria-label={t.close} hidden={!live}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t.back}
            </button>
            <span className="cin-review__client">{active.project.title}</span>
            <blockquote className="cin-review__text">
              <TypedQuote key={active.slug} text={active.quote} run={live && !reducedMotion} />
            </blockquote>
            <figcaption className="cin-review__by">
              <span aria-hidden="true" className="cin-quote__rule" />
              <span>
                <b>{active.name}</b>
                <span> · {active.role}</span>
              </span>
            </figcaption>
            <Link href={getProjectPath(active.project.slug, locale)} className="cin-link">
              {t.caseStudy}
              <span className="sr-only">: {active.project.title}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </figure>
        ) : (
          <p className="cin-review__hint">{t.hint}</p>
        )}
      </div>

      <ul className="cin-hotspots cin-hotspots--reviews" aria-hidden={focused >= 0}>
        {items.map((item, index) => (
          <li key={item.slug}>
            <button
              ref={node => {
                spotRefs.current[index] = node
              }}
              type="button"
              className="cin-hotspot cin-hotspot--review"
              data-cin-hotspot="review"
              data-index={index}
              data-show="false"
              aria-label={`${t.openReview}: ${item.project.title}`}
              tabIndex={focused >= 0 || !live ? -1 : 0}
              onClick={event => select(index, event.currentTarget)}
            >
              <span className="cin-hotspot__dot" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="cin-trust-foot">
        <div ref={listRef} role="tablist" aria-label={t.selector} className="cin-clients">
          {pairs.map((pair, g) => (
            <div key={g} role="presentation" className="cin-clients__pair" aria-label={`${t.pair} ${g + 1}`}>
              {pair.map(item => {
                const index = items.indexOf(item)
                const isActive = index === highlighted
                return (
                  <button
                    key={item.slug}
                    ref={node => {
                      tabRefs.current[index] = node
                    }}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${item.slug}`}
                    aria-selected={index === openIndex}
                    aria-controls={`${baseId}-panel`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={event => select(index, event.currentTarget)}
                    onKeyDown={event => onKeyDown(event, index)}
                    className="cin-clients__tab"
                    data-near={isActive ? 'true' : 'false'}
                    style={accentStyle(item.project.color)}
                  >
                    <span className="cin-clients__no">{String(index + 1).padStart(2, '0')}</span>
                    <span className="cin-clients__name">{item.project.title}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
