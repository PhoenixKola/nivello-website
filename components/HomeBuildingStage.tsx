'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Realisation',
    kind: 'Draft to finished',
    title: 'What we build becomes real.',
    intro: 'The plan, the design and the code come together in one finished product.',
    stage: 'Step',
    rail: 'Building steps',
    link: 'See how we work',
    beats: [
      { kicker: 'Framework', title: 'The frame goes up first.', body: 'The skeleton rises tier by tier: structure, braces and foundations, exactly as planned, designed and coded.' },
      { kicker: 'Launch', title: 'Finished, lit, live.', body: 'We launch, check the essentials and keep improving from real use.' }
    ]
  },
  it: {
    name: 'Realizzazione',
    kind: 'Dalla bozza al finito',
    title: 'Ciò che costruiamo diventa reale.',
    intro: 'Piano, design e codice si uniscono in un unico prodotto finito.',
    stage: 'Passo',
    rail: 'Passi della realizzazione',
    link: 'Scopri come lavoriamo',
    beats: [
      { kicker: 'Struttura', title: 'Prima sale lo scheletro.', body: 'Lo scheletro cresce livello dopo livello: struttura, controventi e fondamenta, esattamente come pianificato, progettato e scritto.' },
      { kicker: 'Lancio', title: 'Finito, acceso, online.', body: 'Lanciamo, controlliamo gli essenziali e continuiamo a migliorare in base all’uso reale.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 06: one building rises from draft to finished form. */
export default function HomeBuildingStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="building"
      chapter={5}
      number="06"
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
