'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Design',
    kind: 'Wireframe to finished page',
    title: 'Design, layer by layer.',
    intro: 'Watch one page move from wireframe to layout to finished design: structure first, then type, colour and components.',
    stage: 'Step',
    rail: 'Design steps',
    link: 'See our five-stage process',
    beats: [
      { kicker: 'Structure and UX', title: 'Make it obvious.', body: 'Flows, wireframes and content hierarchy make the product easy to use before any visual polish.' },
      { kicker: 'Visual design', title: 'Give it a voice.', body: 'Type, colour and components shaped into an interface that feels like your brand and works on every screen.' }
    ]
  },
  it: {
    name: 'Design',
    kind: 'Dal wireframe alla pagina finita',
    title: 'Il design, livello dopo livello.',
    intro: 'Guarda una pagina passare da wireframe a layout a design finito: prima la struttura, poi tipografia, colore e componenti.',
    stage: 'Passo',
    rail: 'Passi del design',
    link: 'Scopri le nostre cinque fasi',
    beats: [
      { kicker: 'Struttura e UX', title: 'Renderlo ovvio.', body: 'Flussi, wireframe e gerarchia dei contenuti rendono il prodotto facile da usare prima di ogni rifinitura grafica.' },
      { kicker: 'Design visivo', title: 'Dargli una voce.', body: 'Tipografia, colore e componenti diventano un’interfaccia che somiglia al tuo brand e funziona su ogni schermo.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 04: design: structure and UX first, then the visual interface. */
export default function HomeDesignStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="design"
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
