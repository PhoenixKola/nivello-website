'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Build',
    kind: 'Code to launch',
    title: 'Code that becomes the product.',
    intro: 'Development is where the plan turns into a working product: written, tested and shipped.',
    stage: 'Step',
    rail: 'Development steps',
    link: 'See how we work',
    beats: [
      { kicker: 'Implementation', title: 'Logic becomes structure.', body: 'React and Next.js, built for speed, accessibility and easy maintenance, with every line written to last.' },
      { kicker: 'Launch', title: 'Ship it, then keep improving.', body: 'We launch, check the essentials and refine from real use, so the product keeps getting better.' }
    ]
  },
  it: {
    name: 'Sviluppo',
    kind: 'Dal codice al lancio',
    title: 'Il codice che diventa prodotto.',
    intro: 'Lo sviluppo è il momento in cui il piano diventa un prodotto funzionante: scritto, testato e pubblicato.',
    stage: 'Passo',
    rail: 'Passi dello sviluppo',
    link: 'Scopri come lavoriamo',
    beats: [
      { kicker: 'Implementazione', title: 'La logica diventa struttura.', body: 'React e Next.js, pensati per velocità, accessibilità e manutenzione semplice, con ogni riga scritta per durare.' },
      { kicker: 'Lancio', title: 'Pubblichiamo, poi miglioriamo.', body: 'Lanciamo, controlliamo gli essenziali e rifiniamo in base all’uso reale, così il prodotto continua a crescere.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 04: coding builds the thing in front of you. */
export default function HomeDevelopmentStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="development"
      chapter={3}
      number="04"
      name={t.name}
      kind={t.kind}
      title={t.title}
      intro={t.intro}
      beats={t.beats}
      stageLabel={t.stage}
      railLabel={t.rail}
      link={{ href: getRoutePath('process', locale), label: t.link }}
    />
  )
}
