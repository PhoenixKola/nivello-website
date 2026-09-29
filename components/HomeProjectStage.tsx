'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink, Lock } from 'lucide-react'
import { getProjectPath, getProjects, type Project } from '@/lib/projects'
import { getRoutePath, type Locale } from '@/lib/site'

/**
 * Live Project Stage — the homepage featured-work section.
 *
 * Real projects from lib/projects.ts are the visual content: a project index
 * (tablist) drives one dominant stage, and the media + metadata resolve in
 * together on every change (CONNECT -> RESOLVE).
 *
 * ProGreen additionally exposes a website/app switch, because it is the one
 * project with both a public site and an internal product. The app view only
 * ever uses the pre-redacted screenshot and never shows a reachable URL.
 */

const copy = {
  en: {
    eyebrow: 'Featured work',
    title: 'Real projects, brought on stage.',
    intro: 'From the website a customer first sees to the tools a team uses every day. Pick a project to bring it into focus.',
    allWork: 'See all work',
    indexLabel: 'Choose a project',
    caseStudy: 'View case study',
    liveSite: 'Visit live site',
    website: 'Website',
    app: 'Web app',
    appCategory: 'Internal web app',
    privateWorkspace: 'Private workspace',
    result: 'Result',
    previous: 'Previous project',
    next: 'Next project',
    websiteAlt: (title: string) => `${title} website preview`,
    appAlt: (title: string) => `Anonymised preview of the ${title} web app`
  },
  it: {
    eyebrow: 'Lavori selezionati',
    title: 'Progetti reali, portati in scena.',
    intro: 'Dal sito che un cliente vede per primo agli strumenti che un team usa ogni giorno. Scegli un progetto per metterlo a fuoco.',
    allWork: 'Vedi tutti i lavori',
    indexLabel: 'Scegli un progetto',
    caseStudy: 'Vedi il case study',
    liveSite: 'Visita il sito live',
    website: 'Sito',
    app: 'App web',
    appCategory: 'App web interna',
    privateWorkspace: 'Spazio riservato',
    result: 'Risultato',
    previous: 'Progetto precedente',
    next: 'Progetto successivo',
    websiteAlt: (title: string) => `Anteprima del sito ${title}`,
    appAlt: (title: string) => `Anteprima anonimizzata dell’app web ${title}`
  }
} satisfies Record<Locale, Record<string, unknown>>

function getDomain(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, '')
  } catch {
    return href
  }
}

export default function HomeProjectStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const projects = useMemo(() => getProjects(locale), [locale])
  const reducedMotion = useReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const [activeIndex, setActiveIndex] = useState(0)
  const [appMode, setAppMode] = useState(false)

  const project: Project = projects[activeIndex]
  const hasApp = project.kinds.includes('app') && Boolean(project.app && project.appShot)
  const showingApp = appMode && hasApp

  const select = useCallback((index: number) => {
    setActiveIndex(index)
    setAppMode(false)
  }, [])

  const move = useCallback(
    (delta: number, focusTab = false) => {
      const next = (activeIndex + delta + projects.length) % projects.length
      select(next)
      if (focusTab) tabRefs.current[next]?.focus()
    },
    [activeIndex, projects.length, select]
  )

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(1, true)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1, true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      select(0)
      tabRefs.current[0]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      const last = projects.length - 1
      select(last)
      tabRefs.current[last]?.focus()
    }
  }

  const fast = reducedMotion ? { duration: 0 } : { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] as const }
  const mediaKey = `${project.slug}-${showingApp ? 'app' : 'site'}`

  const media = showingApp ? project.appShot! : project.shot
  const mediaAlt = showingApp ? t.appAlt(project.title) : t.websiteAlt(project.title)
  const category = showingApp ? t.appCategory : project.category
  const body = showingApp ? project.app!.description : project.websiteSummary ?? project.desc
  const bullets = showingApp ? project.app!.details : project.details

  return (
    <section className="bg-stone-50 dark:bg-slate-950/95" aria-labelledby="home-work-heading">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {t.eyebrow}
            </p>
            <h2
              id="home-work-heading"
              className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white"
            >
              {t.title}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">{t.intro}</p>
          </div>
          <Link
            href={getRoutePath('work', locale)}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] hover:text-blue-600 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300"
          >
            {t.allWork}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* ── Project index ── */}
        <div
          role="tablist"
          aria-label={t.indexLabel}
          className="-mx-4 mb-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        >
          {projects.map((item, index) => {
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
                onClick={() => select(index)}
                onKeyDown={onTabKeyDown}
                className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-950'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-white/12 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                  style={{ backgroundColor: item.color }}
                />
                {item.title}
              </button>
            )
          })}
        </div>

        {/* ── Stage ── */}
        <div
          id={`${baseId}-panel`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${project.slug}`}
          className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:gap-8"
        >
          {/* media frame */}
          <div className="min-w-0">
            <div
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.6)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="ml-2 inline-flex min-w-0 items-center gap-1.5 truncate rounded-md bg-white px-2.5 py-1 text-[11px] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                  {showingApp ? (
                    <>
                      <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">
                        {project.title} · {t.privateWorkspace}
                      </span>
                    </>
                  ) : (
                    <span className="truncate">{getDomain(project.href)}</span>
                  )}
                </span>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={mediaKey}
                    className="absolute inset-0"
                    initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)', scale: 1.02 }}
                    animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)', scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={fast}
                  >
                    <Image
                      src={media}
                      alt={mediaAlt}
                      fill
                      sizes="(max-width: 768px) 92vw, (max-width: 1280px) 60vw, 700px"
                      className="object-cover object-top"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* website / app switch + prev-next */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {hasApp ? (
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 dark:border-white/12 dark:bg-white/[0.04]">
                  {[
                    { label: t.website, active: !showingApp, onClick: () => setAppMode(false) },
                    { label: t.app, active: showingApp, onClick: () => setAppMode(true) }
                  ].map(option => (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={option.active}
                      onClick={option.onClick}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        option.active
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs font-medium tabular-nums text-slate-400 dark:text-slate-500">
                  {String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label={t.previous}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label={t.next}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* metadata */}
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={mediaKey}
              className="flex min-w-0 flex-col"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={fast}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                  style={{ backgroundColor: project.color }}
                />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {category}
                </p>
              </div>

              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {project.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{body}</p>

              <ul className="mt-5 space-y-2.5">
                {bullets.map(detail => (
                  <li key={detail} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]" />
                    {detail}
                  </li>
                ))}
              </ul>

              {!showingApp && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    {t.result}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{project.result}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={getProjectPath(project.slug, locale)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                >
                  {t.caseStudy}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!showingApp && (
                  <a
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                  >
                    {t.liveSite}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
