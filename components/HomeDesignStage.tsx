'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Design',
    kind: 'Strategy to interface',
    title: 'Structure before pixels.',
    intro: 'Design at Nivello starts with strategy and structure, so every page has a clear job before it is made beautiful.',
    stage: 'Step',
    rail: 'Design steps',
    link: 'See our five-stage process',
    beats: [
      { kicker: 'Strategy', title: 'Start with the goal.', body: 'We clarify goals, audience and constraints, so every page and every decision has a reason.' },
      { kicker: 'Structure and UX', title: 'Make it obvious.', body: 'Flows, wireframes and content hierarchy make the product easy to use before any visual polish.' },
      { kicker: 'Visual design', title: 'Give it a voice.', body: 'Type, colour and components shaped into an interface that feels like your brand and works on every screen.' }
    ]
  },
  it: {
    name: 'Design',
    kind: 'Dalla strategia all’interfaccia',
    title: 'La struttura prima dei pixel.',
    intro: 'Il design in Nivello parte da strategia e struttura, così ogni pagina ha uno scopo chiaro prima di diventare bella.',
    stage: 'Passo',
    rail: 'Passi del design',
    link: 'Scopri le nostre cinque fasi',
    beats: [
      { kicker: 'Strategia', title: 'Si parte dall’obiettivo.', body: 'Chiariamo obiettivi, pubblico e vincoli, così ogni pagina e ogni scelta ha un motivo.' },
      { kicker: 'Struttura e UX', title: 'Renderlo ovvio.', body: 'Flussi, wireframe e gerarchia dei contenuti rendono il prodotto facile da usare prima di ogni rifinitura grafica.' },
      { kicker: 'Design visivo', title: 'Dargli una voce.', body: 'Tipografia, colore e componenti diventano un’interfaccia che somiglia al tuo brand e funziona su ogni schermo.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 03: design being created, from strategy to structure to interface. */
export default function HomeDesignStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="design"
      chapter={2}
      number="03"
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
