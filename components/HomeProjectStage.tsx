'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, ExternalLink, Globe2, LayoutDashboard } from 'lucide-react'
import { cinematic } from '@/lib/cinematic/store'
import { getProjectPath, getProjects, type Project } from '@/lib/projects'
import { getRoutePath, type Locale } from '@/lib/site'
import { useHydratedReducedMotion } from '@/lib/useHydratedReducedMotion'

/**
 * Chapter 03 — The Work. The six real projects hang in a monumental hall inside the world; this overlay is
 * only the typography and controls. Selecting a project sends the camera (and the hall's light) to its portal.
 *
 * ProGreen additionally exposes a website/app switch. The app view only ever uses the pre-redacted screenshot.
 */

const copy = {
  en: {
    chapter: 'The work',
    eyebrow: 'Featured work',
    title: 'Real projects, brought on stage.',
    intro: 'From the website a customer first sees to the tools a team uses every day. Pick a project to bring it into focus.',
    allWork: 'See all work',
    indexLabel: 'Choose a project',
    caseStudy: 'View case study',
    liveSite: 'Visit live site',
    website: 'Website',
    app: 'Web app',
    surfaceLabel: 'Project surface',
    websiteCategory: 'Public website',
    appCategory: 'Operations web app',
    result: 'Result',
    previous: 'Previous project',
    next: 'Next project',
    websiteAlt: (title: string) => `${title} website preview`,
    appAlt: (title: string) => `Anonymised preview of the ${title} web app`
  },
  it: {
    chapter: 'I lavori',
    eyebrow: 'Lavori selezionati',
    title: 'Progetti reali, portati in scena.',
    intro: 'Dal sito che un cliente vede per primo agli strumenti che un team usa ogni giorno. Scegli un progetto per metterlo a fuoco.',
    allWork: 'Vedi tutti i lavori',
    indexLabel: 'Scegli un progetto',
    caseStudy: 'Vedi il case study',
    liveSite: 'Visita il sito live',
    website: 'Sito',
    app: 'App web',
    surfaceLabel: 'Esperienza',
    websiteCategory: 'Sito pubblico',
    appCategory: 'Gestionale operativo',
    result: 'Risultato',
    previous: 'Progetto precedente',
    next: 'Progetto successivo',
    websiteAlt: (title: string) => `Anteprima del sito ${title}`,
    appAlt: (title: string) => `Anteprima anonimizzata dell’app web ${title}`
  }
} satisfies Record<Locale, Record<string, unknown>>

export default function HomeProjectStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const projects = useMemo(() => {
    const allProjects = getProjects(locale)
    const proGreen = allProjects.find(item => item.slug === 'progreen')

    return proGreen ? [proGreen, ...allProjects.filter(item => item.slug !== 'progreen')] : allProjects
  }, [locale])
  const reducedMotion = useHydratedReducedMotion()
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const [activeIndex, setActiveIndex] = useState(0)
  const [appMode, setAppMode] = useState(false)

  const project: Project = projects[activeIndex]
  const hasApp = project.kinds.includes('app') && Boolean(project.app && project.appShot)
  const showingApp = appMode && hasApp

  useEffect(() => {
    cinematic.set({ workIndex: activeIndex, workApp: showingApp })
  }, [activeIndex, showingApp])

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

  const fast = reducedMotion ? { duration: 0 } : { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] as const }
  const mediaKey = `${project.slug}-${showingApp ? 'app' : 'site'}`

  const media = showingApp ? project.appShot! : project.shot
  const mediaAlt = showingApp ? t.appAlt(project.title) : t.websiteAlt(project.title)
  const category = hasApp ? (showingApp ? t.appCategory : t.websiteCategory) : project.category
  const body = showingApp ? project.app!.description : project.website?.description ?? project.websiteSummary ?? project.desc
  const bullets = (showingApp ? project.app!.details : project.website?.details ?? project.details)
  const result = showingApp ? project.app!.result : project.website?.result ?? project.result
  const sectionStyle = { '--project-accent': project.color } as React.CSSProperties

  return (
    <section id="cinematic-work" className="cin-ov cin-ov--work" data-cin-overlay="2" style={sectionStyle} aria-labelledby="home-work-heading">
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">03</span>{t.chapter}<span className="cin-head__sep" aria-hidden="true" />{t.eyebrow}</p>
        <h2 id="home-work-heading" className="cin-head__title">{t.title}</h2>
        <p className="cin-head__intro">{t.intro}</p>
      </header>

      <Link href={getRoutePath('work', locale)} className="cin-link cin-link--corner">
        {t.allWork}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>

      {/* Real project imagery: shown as a plain image without WebGL, kept for assistive tech and crawlers otherwise. */}
      <figure className="cin-work-media">
        <Image src={media} alt={mediaAlt} width={1600} height={900} sizes="(max-width: 768px) 92vw, 720px" />
      </figure>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${project.slug}`} className="cin-work-info">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={mediaKey}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={fast}
          >
            <p className="cin-work-info__category">
              <span aria-hidden="true" style={{ backgroundColor: project.color }} />
              {category}
            </p>
            <h3 className="cin-work-info__title">{project.title}</h3>
            <p className="cin-work-info__body">{body}</p>
            <ul className="cin-work-info__bullets">
              {bullets.map(detail => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {result && (
              <p className="cin-work-info__result">
                <b>{t.result}</b>
                {result}
              </p>
            )}
            <div className="cin-work-info__actions">
              <Link href={getProjectPath(project.slug, locale)} className="cin-btn cin-btn--solid">
                {t.caseStudy}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              {!showingApp && (
                <a href={project.href} target="_blank" rel="noopener noreferrer" className="cin-btn cin-btn--ghost">
                  {t.liveSite}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="cin-work-controls">
        {hasApp && (
          <div role="group" aria-label={t.surfaceLabel} className="cin-surface">
            {[
              { label: t.website, active: !showingApp, onClick: () => setAppMode(false), Icon: Globe2 },
              { label: t.app, active: showingApp, onClick: () => setAppMode(true), Icon: LayoutDashboard }
            ].map(option => (
              <button key={option.label} type="button" aria-pressed={option.active} onClick={option.onClick} className="cin-surface__option">
                <option.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div role="tablist" aria-label={t.indexLabel} className="cin-index">
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
                className="cin-index__tab"
              >
                <span className="cin-index__no">{String(index + 1).padStart(2, '0')}</span>
                <span className="cin-index__name">{item.title}</span>
                <span className="cin-index__dot" aria-hidden="true" style={{ backgroundColor: item.color }} />
              </button>
            )
          })}
        </div>

        <div className="cin-pager">
          <button type="button" onClick={() => move(-1)} aria-label={t.previous}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span aria-hidden="true">{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
          <button type="button" onClick={() => move(1)} aria-label={t.next}>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
