'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cinematic, scrollToChapter, stageCenter, useCinematic } from '@/lib/cinematic/store'
import { getProcessStages } from '@/lib/process'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    chapter: 'Formation',
    eyebrow: 'Process',
    title: 'One project, five clear stages.',
    intro: 'The same pipeline runs behind every Nivello project: from a first conversation to a live product that keeps improving.',
    link: 'See how we work',
    rail: 'Process stages',
    stage: 'Stage'
  },
  it: {
    chapter: 'Formazione',
    eyebrow: 'Metodo',
    title: 'Un progetto, cinque fasi chiare.',
    intro: 'Dietro ogni progetto Nivello c’è lo stesso percorso: dalla prima conversazione a un prodotto live che continua a migliorare.',
    link: 'Scopri come lavoriamo',
    rail: 'Fasi del processo',
    stage: 'Fase'
  }
} satisfies Record<Locale, Record<string, string>>

/**
 * Chapter 02 — Formation. The five real workflow stages materialise in the world one by one:
 * the camera flies the build site while a single editorial caption names the active stage.
 * All five stay in the DOM (and are all shown without WebGL); scroll position picks the active one.
 */
export default function HomeBuildPipeline({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const stages = getProcessStages(locale)
  const active = useCinematic(state => state.processStage, 0)

  const go = (index: number) => {
    if (document.querySelector('[data-cin-root]:not([data-mode="static"])')) scrollToChapter(1, stageCenter(index))
  }

  const onRailKey = (event: React.KeyboardEvent<HTMLElement>) => {
    const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = Math.min(stages.length - 1, Math.max(0, cinematic.get().processStage + delta))
    go(next)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <section id="cinematic-process" className="cin-ov cin-ov--process" data-cin-overlay="1" aria-labelledby="home-process-heading">
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">02</span><span className="cin-head__name">{t.chapter}</span><span className="cin-head__sep" aria-hidden="true" /><span className="cin-head__kind">{t.eyebrow}</span></p>
        <h2 id="home-process-heading" className="cin-head__title">{t.title}</h2>
        <p className="cin-head__intro">{t.intro}</p>
      </header>

      <ol className="cin-stages">
        {stages.map((stage, index) => (
          <li key={stage.id} className="cin-stage" data-active={index === active ? 'true' : 'false'}>
            <span className="cin-stage__ghost" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <p className="cin-stage__kicker">{t.stage} {String(index + 1).padStart(2, '0')} / 05<span>{stage.duration}</span></p>
            <h3 className="cin-stage__title">{stage.title}</h3>
            <p className="cin-stage__body">{stage.short}</p>
          </li>
        ))}
      </ol>

      <div className="cin-stage-rail" role="group" aria-label={t.rail} onKeyDown={onRailKey}>
        {stages.map((stage, index) => (
          <button
            key={stage.id}
            type="button"
            className="cin-stage-rail__node"
            aria-label={`${t.stage} ${index + 1}: ${stage.title}`}
            aria-current={index === active ? 'step' : undefined}
            onClick={() => go(index)}
          >
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      <Link href={getRoutePath('process', locale)} className="cin-link cin-link--corner">
        {t.link}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
