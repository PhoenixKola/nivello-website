'use client'

import { useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { getProjectPath, getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'

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

const accentBg = 'bg-[var(--accent)] dark:bg-[var(--accent-dark)]'

export default function ProofSection({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const reducedMotion = useReducedMotion()
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

  const ease = [0.22, 0.61, 0.36, 1] as const
  const swap = reducedMotion ? { duration: 0 } : { duration: 0.4, ease }

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95" aria-labelledby="home-proof-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
            {t.eyebrow}
          </p>
          <h2
            id="home-proof-heading"
            className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white"
          >
            {t.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.intro}</p>
        </div>

        {/* ── Client selector: an editorial index, not a pill row ── */}
        <div role="tablist" aria-label={t.selector} className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-0">
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
                className={`group relative flex min-h-16 flex-col items-start gap-1 border-t border-slate-200 px-1 pb-4 pt-4 text-left transition-colors sm:px-3 dark:border-white/10 ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`${baseId}-indicator`}
                    aria-hidden="true"
                    className={`absolute inset-x-0 -top-px h-[3px] ${accentBg}`}
                    style={accentStyle(item.project.color)}
                    transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <span className="flex items-center gap-2 text-[11px] font-semibold tabular-nums tracking-[0.16em]">
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-1.5 rounded-full transition-transform ${accentBg} ${isActive ? 'scale-150' : 'scale-100 opacity-60'}`}
                    style={accentStyle(item.project.color)}
                  />
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={`text-sm leading-snug sm:text-base ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.project.title}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{item.project.category}</span>
              </button>
            )
          })}
        </div>

        {/* ── Active proof ── */}
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${active.slug}`}
          className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
        >
          <div className="order-2 flex min-w-0 flex-col lg:order-1">
            <AnimatePresence initial={false} mode="wait">
              <motion.figure
                key={active.slug}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
                transition={swap}
                className="flex min-h-[15rem] flex-col"
              >
                <span
                  aria-hidden="true"
                  className="font-display text-6xl leading-none text-[var(--accent)] sm:text-7xl dark:text-[var(--accent-dark)]"
                  style={accentStyle(project.color)}
                >
                  &ldquo;
                </span>
                <blockquote className="-mt-4 font-display text-xl leading-snug text-slate-900 sm:text-2xl lg:text-[1.7rem] lg:leading-[1.35] dark:text-white">
                  {active.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span aria-hidden="true" className="h-px w-8 bg-slate-300 dark:bg-white/25" />
                  <span className="text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">{active.name}</span>
                    <span className="text-slate-500 dark:text-slate-400"> · {active.role}</span>
                  </span>
                </figcaption>

                <div className="mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-white/10">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{t.delivered}</p>
                    <ul className="mt-2.5 flex flex-wrap gap-1.5">
                      {project.services.map(service => (
                        <li
                          key={service}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300"
                        >
                          {service}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{t.outcome}</p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{project.result}</p>
                  </div>
                </div>

                <Link
                  href={getProjectPath(project.slug, locale)}
                  className="group mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:text-blue-600 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300"
                >
                  {t.caseStudy}
                  <span className="sr-only">: {project.title}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* project preview */}
          <div className="order-1 min-w-0 lg:order-2">
            <div className="relative aspect-[16/11] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10">
              <AnimatePresence initial={false}>
                <motion.div
                  key={project.slug}
                  className="absolute inset-0"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04, clipPath: 'inset(0 0 0 100%)' }}
                  animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, clipPath: 'inset(0 0 0 0%)' }}
                  exit={{ opacity: 0 }}
                  transition={reducedMotion ? { duration: 0 } : { duration: 0.55, ease }}
                >
                  <Image
                    src={project.shot}
                    alt={t.alt(project.title)}
                    fill
                    sizes="(max-width: 1024px) 92vw, 520px"
                    className="object-cover object-top"
                  />
                </motion.div>
              </AnimatePresence>
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-1 transition-colors duration-500 motion-reduce:transition-none ${accentBg}`}
                style={accentStyle(project.color)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
