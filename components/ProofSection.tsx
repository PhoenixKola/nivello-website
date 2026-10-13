'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ClientLogoMarquee from '@/components/ClientLogoMarquee'
import { cinematic } from '@/lib/cinematic/store'
import { getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'
import { useHydratedReducedMotion } from '@/lib/useHydratedReducedMotion'

type ProofQuote = { slug: string; name: string; role: string; quote: string }

// Only feedback that matches the project facts in lib/projects.ts is shown.
// Le Camelie and Consteam are left out until their wording is verified.
const quotes: Record<Locale, ProofQuote[]> = {
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

/**
 * Chapter 04 — Proof. A slower, golden-hour moment: the quote is the composition, client pillars stand
 * along the causeway in the world, and the selected client's pillar lights up.
 */
export default function ProofSection({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const reducedMotion = useHydratedReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [activeIndex, setActiveIndex] = useState(0)

  const items = useMemo(() => {
    const projects = getProjects(locale)
    return quotes[locale].flatMap(quote => {
      const project = projects.find(p => p.slug === quote.slug)
      return project ? [{ ...quote, project }] : []
    })
  }, [locale])

  useEffect(() => {
    cinematic.set({ proofIndex: activeIndex })
  }, [activeIndex])

  const active = items[activeIndex]
  const { project } = active

  const focusTab = (index: number) => {
    setActiveIndex(index)
    tabRefs.current[index]?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = items.length - 1
    const map: Record<string, number> = {
      ArrowRight: activeIndex === last ? 0 : activeIndex + 1,
      ArrowDown: activeIndex === last ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? last : activeIndex - 1,
      ArrowUp: activeIndex === 0 ? last : activeIndex - 1,
      Home: 0,
      End: last
    }
    if (event.key in map) {
      event.preventDefault()
      focusTab(map[event.key])
    }
  }

  const swap = reducedMotion ? { duration: 0 } : { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const }

  return (
    <section id="cinematic-trust" className="cin-ov cin-ov--trust" data-cin-overlay="3" style={accentStyle(project.color)} aria-labelledby="home-proof-heading">
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">04</span><span className="cin-head__name">{t.chapter}</span><span className="cin-head__sep" aria-hidden="true" /><span className="cin-head__kind">{t.eyebrow}</span></p>
        <h2 id="home-proof-heading" className="cin-head__title">{t.title}</h2>
        <p className="cin-head__intro">{t.intro}</p>
      </header>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${active.slug}`} className="cin-quote">
        <AnimatePresence initial={false} mode="wait">
          <motion.figure
            key={active.slug}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -4 }}
            transition={swap}
          >
            <span className="cin-quote__mark" aria-hidden="true">&ldquo;</span>
            <blockquote className="cin-quote__text">{active.quote}</blockquote>
            <figcaption className="cin-quote__by">
              <span aria-hidden="true" className="cin-quote__rule" />
              <span>
                <b>{active.name}</b>
                <span> · {active.role}</span>
              </span>
              <Link href={getProjectPath(project.slug, locale)} className="cin-link">
                {t.caseStudy}
                <span className="sr-only">: {project.title}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
        <div className="cin-quote__media" aria-hidden="true">
          <Image src={project.shot} alt="" width={800} height={550} sizes="(max-width: 1024px) 92vw, 520px" />
        </div>
      </div>

      <div className="cin-trust-foot">
        <div role="tablist" aria-label={t.selector} className="cin-clients">
          {items.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={item.slug}
                ref={node => {
                  tabRefs.current[index] = node
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${item.slug}`}
                aria-selected={isActive}
                aria-controls={`${baseId}-panel`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                onKeyDown={onKeyDown}
                className="cin-clients__tab"
                style={accentStyle(item.project.color)}
              >
                <span className="cin-clients__no">{String(index + 1).padStart(2, '0')}</span>
                <span className="cin-clients__name">{item.project.title}</span>
              </button>
            )
          })}
        </div>
        <ClientLogoMarquee locale={locale} />
      </div>
    </section>
  )
}
