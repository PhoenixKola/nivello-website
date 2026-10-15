'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BEAT_STOPS, cinematic, scrollToChapter, useCinematic } from '@/lib/cinematic/store'

export type Beat = { kicker: string; title: string; body: string }

type Props = {
  id: string
  chapter: number
  number: string
  name: string
  kind: string
  title: string
  intro: string
  beats: Beat[]
  stageLabel: string
  railLabel: string
  link: { href: string; label: string }
}

/**
 * Shared overlay for the Design and Development chapters: a heading, one active beat at a time (picked by the
 * scroll-driven world), a small rail to jump between beats, and a link out. All beats stay in the DOM.
 */
export default function ChapterBeats({ id, chapter, number, name, kind, title, intro, beats, stageLabel, railLabel, link }: Props) {
  const active = useCinematic(state => state.processStage, 0)
  const live = useCinematic(state => state.mode === 'live', false)
  const current = useCinematic(state => state.chapter, 0)
  const shown = current === chapter ? active : 0

  const go = (index: number) => {
    if (live) scrollToChapter(chapter, BEAT_STOPS[chapter]?.[index] ?? (index + 0.5) / beats.length)
  }

  const onRailKey = (event: React.KeyboardEvent<HTMLElement>) => {
    const delta = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 0
    if (!delta) return
    event.preventDefault()
    const next = Math.min(beats.length - 1, Math.max(0, cinematic.get().processStage + delta))
    go(next)
    event.currentTarget.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  return (
    <section id={id} className={`cin-ov cin-ov--${id}`} data-cin-overlay={chapter} aria-labelledby={`${id}-heading`}>
      <header className="cin-head">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">{number}</span><span className="cin-head__name">{name}</span><span className="cin-head__sep" aria-hidden="true" /><span className="cin-head__kind">{kind}</span></p>
        <h2 id={`${id}-heading`} className="cin-head__title">{title}</h2>
        <p className="cin-head__intro">{intro}</p>
      </header>

      <ol className="cin-stages">
        {beats.map((beat, index) => (
          <li key={beat.title} className="cin-stage" data-active={index === shown ? 'true' : 'false'}>
            <span className="cin-stage__ghost" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <p className="cin-stage__kicker">{stageLabel} {String(index + 1).padStart(2, '0')} / {String(beats.length).padStart(2, '0')}<span>{beat.kicker}</span></p>
            <h3 className="cin-stage__title">{beat.title}</h3>
            <p className="cin-stage__body">{beat.body}</p>
          </li>
        ))}
      </ol>

      <div className="cin-stage-rail" role="group" aria-label={railLabel} onKeyDown={onRailKey}>
        {beats.map((beat, index) => (
          <button key={beat.title} type="button" className="cin-stage-rail__node" aria-label={`${stageLabel} ${index + 1}: ${beat.title}`} aria-current={index === shown ? 'step' : undefined} onClick={() => go(index)}>
            <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </div>

      <Link href={link.href} className="cin-link cin-link--corner">
        {link.label}
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  )
}
