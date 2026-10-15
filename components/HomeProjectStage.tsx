'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, ExternalLink, Globe2, LayoutDashboard } from 'lucide-react'
import { cinematic, useCinematic } from '@/lib/cinematic/store'
import { getProjectPath, getProjects, type Project } from '@/lib/projects'
import { getRoutePath, type Locale } from '@/lib/site'
import { useHydratedReducedMotion } from '@/lib/useHydratedReducedMotion'

/**
 * Chapter 07, The Work. The real projects hang as holograms on the wall of a cylinder. Overview: the view turns by
 * dragging (or the look buttons) and every project has a hotspot under it. Opening a hotspot flies the view to that
 * project and shows its information; scrolling stays locked until Back returns to the chamber.
 *
 * ProGreen additionally exposes a website/app switch. The app view only ever uses the pre-redacted screenshot.
 * Without WebGL the hotspots become a plain list and the information panel stays visible.
 */

const copy = {
  en: {
    chapter: 'The work',
    eyebrow: 'Featured work',
    title: 'Real projects, brought on stage.',
    intro: 'From the website a customer first sees to the tools a team uses every day. Pick a project to bring it into focus.',
    allWork: 'See all work',
    hint: 'Drag to look around. Select a project to open it.',
    lookLeft: 'Look left',
    lookRight: 'Look right',
    open: 'Open project',
    back: 'Back',
    backLabel: 'Back to all projects',
    caseStudy: 'View case study',
    liveSite: 'Visit live site',
    website: 'Website',
    app: 'Web app',
    surfaceLabel: 'Project surface',
    websiteCategory: 'Public website',
    appCategory: 'Operations web app',
    result: 'Result',
    list: 'Projects',
    websiteAlt: (title: string) => `${title} website preview`,
    appAlt: (title: string) => `Anonymised preview of the ${title} web app`
  },
  it: {
    chapter: 'I lavori',
    eyebrow: 'Lavori selezionati',
    title: 'Progetti reali, portati in scena.',
    intro: 'Dal sito che un cliente vede per primo agli strumenti che un team usa ogni giorno. Scegli un progetto per metterlo a fuoco.',
    allWork: 'Vedi tutti i lavori',
    hint: 'Trascina per guardarti intorno. Scegli un progetto per aprirlo.',
    lookLeft: 'Guarda a sinistra',
    lookRight: 'Guarda a destra',
    open: 'Apri il progetto',
    back: 'Indietro',
    backLabel: 'Torna a tutti i progetti',
    caseStudy: 'Vedi il case study',
    liveSite: 'Visita il sito live',
    website: 'Sito',
    app: 'App web',
    surfaceLabel: 'Esperienza',
    websiteCategory: 'Sito pubblico',
    appCategory: 'Gestionale operativo',
    result: 'Risultato',
    list: 'Progetti',
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
  const spotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const backRef = useRef<HTMLButtonElement>(null)
  const live = useCinematic(state => state.mode === 'live', false)
  const detail = useCinematic(state => state.workDetail, false)
  const chapter = useCinematic(state => state.chapter, 0)
  const inChamber = useCinematic(state => state.inChamber, false)

  const [activeIndex, setActiveIndex] = useState(0)
  const [appMode, setAppMode] = useState(false)

  const project: Project = projects[activeIndex]
  const hasApp = project.kinds.includes('app') && Boolean(project.app && project.appShot)
  const showingApp = appMode && hasApp

  useEffect(() => {
    cinematic.set({ workIndex: activeIndex, workApp: showingApp })
  }, [activeIndex, showingApp])

  const open = useCallback((index: number) => {
    setActiveIndex(index)
    setAppMode(false)
    cinematic.set({ workIndex: index, workApp: false, workDetail: true })
  }, [])

  const close = useCallback(() => {
    cinematic.set({ workDetail: false, workApp: false })
    window.requestAnimationFrame(() => spotRefs.current[cinematic.get().workIndex]?.focus({ preventScroll: true }))
  }, [])

  // Move focus into the opened project, and always release the rail if the chapter is left or the page unmounts.
  useEffect(() => {
    if (detail && live) window.requestAnimationFrame(() => backRef.current?.focus({ preventScroll: true }))
  }, [detail, live])
  useEffect(() => {
    if (chapter !== 6 && cinematic.get().workDetail) cinematic.set({ workDetail: false })
  }, [chapter])
  useEffect(() => {
    if (!detail) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detail, close])
  useEffect(
    () => () => {
      cinematic.set({ workDetail: false })
    },
    []
  )

  const look = (direction: 1 | -1) => window.dispatchEvent(new CustomEvent('nivello:look', { detail: direction }))

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
    <section id="cinematic-work" className="cin-ov cin-ov--work" data-cin-overlay="6" data-detail={detail ? 'true' : 'false'} data-chamber={inChamber ? 'true' : 'false'} style={sectionStyle} aria-labelledby="home-work-heading">
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">07</span><span className="cin-head__name">{t.chapter}</span><span className="cin-head__sep" aria-hidden="true" /><span className="cin-head__kind">{t.eyebrow}</span></p>
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

      <div className="cin-look" aria-hidden={detail}>
        <p className="cin-look__hint">{t.hint}</p>
        <div className="cin-look__buttons">
          <button type="button" onClick={() => look(-1)} aria-label={t.lookLeft} tabIndex={detail ? -1 : 0}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => look(1)} aria-label={t.lookRight} tabIndex={detail ? -1 : 0}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul className="cin-hotspots" aria-label={t.list}>
        {projects.map((item, index) => (
          <li key={item.slug}>
            <button
              ref={node => {
                spotRefs.current[index] = node
              }}
              type="button"
              className="cin-hotspot"
              data-cin-hotspot="work"
              data-index={index}
              data-show="false"
              aria-label={`${t.open}: ${item.title}`}
              aria-expanded={detail && activeIndex === index}
              aria-controls={`${baseId}-panel`}
              tabIndex={detail ? -1 : 0}
              onClick={() => open(index)}
            >
              <span className="cin-hotspot__dot" aria-hidden="true" />
              <span className="cin-hotspot__label">
                <span className="cin-hotspot__no">{String(index + 1).padStart(2, '0')}</span>
                {item.title}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button ref={backRef} type="button" className="cin-back" onClick={close} aria-label={t.backLabel} tabIndex={detail ? 0 : -1}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t.back}
      </button>

      <div id={`${baseId}-panel`} role="region" aria-label={project.title} className="cin-work-info" data-open={detail ? 'true' : 'false'} data-scroll-ok>
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
              {bullets.map(detailItem => (
                <li key={detailItem}>{detailItem}</li>
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
      </div>
    </section>
  )
}
