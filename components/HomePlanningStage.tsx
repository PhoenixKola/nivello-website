'use client'

import ChapterBeats from '@/components/home-cinematic/ChapterBeats'
import { getRoutePath, type Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Planning',
    kind: 'Listen, plan, revise',
    title: 'Every project starts with a conversation.',
    intro: 'Planning is where we listen to you, turn it into a clear plan, and revise it with your feedback before any design starts.',
    stage: 'Step',
    rail: 'Planning steps',
    link: 'See our five-stage process',
    beats: [
      { kicker: 'Discovery', title: 'We listen first.', body: 'We talk through your goals, your audience and your constraints, and write down what you actually need.' },
      { kicker: 'Plan', title: 'Goals become a plan.', body: 'Goals turn into pages, structure and milestones, so everyone can see the route before any work starts.' },
      { kicker: 'Revisions', title: 'We revise it with you.', body: 'Your feedback goes straight into the next version, round after round, until the plan feels right.' }
    ]
  },
  it: {
    name: 'Pianificazione',
    kind: 'Ascolto, piano, revisioni',
    title: 'Ogni progetto inizia con una conversazione.',
    intro: 'La pianificazione è il momento in cui ti ascoltiamo, trasformiamo tutto in un piano chiaro e lo rivediamo con i tuoi feedback, prima di iniziare il design.',
    stage: 'Passo',
    rail: 'Passi della pianificazione',
    link: 'Scopri le nostre cinque fasi',
    beats: [
      { kicker: 'Scoperta', title: 'Prima ascoltiamo.', body: 'Parliamo di obiettivi, pubblico e vincoli, e scriviamo ciò di cui hai davvero bisogno.' },
      { kicker: 'Piano', title: 'Gli obiettivi diventano un piano.', body: 'Gli obiettivi diventano pagine, struttura e tappe, così tutti vedono il percorso prima che il lavoro inizi.' },
      { kicker: 'Revisioni', title: 'Lo rivediamo con te.', body: 'I tuoi feedback entrano subito nella versione successiva, giro dopo giro, finché il piano funziona.' }
    ]
  }
} satisfies Record<Locale, unknown>

/** Chapter 03: the planning hall. */
export default function HomePlanningStage({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <ChapterBeats
      id="planning"
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
