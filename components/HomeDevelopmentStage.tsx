'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Build',
    kind: 'Code to launch',
    title: 'Code that becomes the product.',
    intro: 'A small team (design, frontend and backend) turns the plan into a working product: written, tested and shipped.',
    stage: 'Step',
    rail: 'Development steps',
    link: 'See how we work',
    beats: [
      { kicker: 'Implementation', title: 'Logic becomes structure.', body: 'React and Next.js, built for speed, accessibility and easy maintenance, with every line written to last.' },
      { kicker: 'Integration', title: 'Wire it all together.', body: 'Content, forms and integrations connect into one system that is fast, accessible and easy to maintain.' }
    ]
  },
  it: {
    name: 'Sviluppo',
    kind: 'Dal codice al lancio',
    title: 'Il codice che diventa prodotto.',
    intro: 'Un piccolo team (design, frontend e backend) trasforma il piano in un prodotto funzionante: scritto, testato e pubblicato.',
    stage: 'Passo',
    rail: 'Passi dello sviluppo',
    link: 'Scopri come lavoriamo',
    beats: [
      { kicker: 'Implementazione', title: 'La logica diventa struttura.', body: 'React e Next.js, pensati per velocità, accessibilità e manutenzione semplice, con ogni riga scritta per durare.' },
      { kicker: 'Integrazione', title: 'Colleghiamo ogni pezzo.', body: 'Contenuti, form e integrazioni si collegano in un unico sistema veloce, accessibile e facile da mantenere.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 05: the coding bay. */
export default function HomeDevelopmentStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="development"
      chapter={4}
      number="05"
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
