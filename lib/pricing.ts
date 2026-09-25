import type { Locale } from './site'

export const pricing = {
  en: {
    eyebrow: 'Investment ranges',
    title: 'Clear packages, shaped around scope.',
    body: 'These ranges keep the first conversation practical. Final pricing depends on content readiness, page count, integrations, and timeline.',
    note: 'Custom software, CMS work, and multilingual content can be scoped separately.',
    packages: [
      {
        name: 'One-page Website',
        range: 'from EUR 800',
        desc: 'A focused one-page website for a clear offer.',
        items: ['Strategy mini-session', 'One-page website', 'Responsive development', 'Static export and launch']
      },
      {
        name: 'Premium Website',
        range: 'from EUR 1,800',
        desc: 'A polished multi-page presence for growing brands.',
        items: ['Site structure and messaging', 'Custom visual direction', 'Core pages', 'Launch support']
      },
      {
        name: 'Custom Software',
        range: 'tailored proposal',
        desc: 'Management systems, client portals, dashboards, workflow tools, and other tailored software.',
        items: ['Technical planning', 'React and Next.js development', 'Management systems and dashboards', 'Integrations and iteration roadmap']
      }
    ]
  },
  it: {
    eyebrow: 'Fasce di investimento',
    title: 'Pacchetti chiari, definiti in base al progetto.',
    body: 'Queste fasce rendono la prima conversazione più pratica. Il prezzo finale dipende da contenuti, numero di pagine, integrazioni e tempistiche.',
    note: 'Software su misura, sistemi di gestione dei contenuti e contenuti multilingue possono essere quotati separatamente.',
    packages: [
      {
        name: 'Sito monopagina',
        range: 'da EUR 800',
        desc: 'Un sito monopagina focalizzato su un’offerta chiara.',
        items: ['Sessione strategica iniziale', 'Sito monopagina', 'Sviluppo adattabile a ogni dispositivo', 'Esportazione statica e pubblicazione']
      },
      {
        name: 'Sito premium',
        range: 'da EUR 1.800',
        desc: 'Un sito multipagina curato per aziende e marchi in crescita.',
        items: ['Architettura del sito e testi', 'Direzione visiva su misura', 'Pagine principali', 'Supporto alla pubblicazione']
      },
      {
        name: 'Software su misura',
        range: 'proposta su misura',
        desc: 'Gestionali, portali clienti, pannelli di controllo, strumenti per i flussi di lavoro e altri software su misura.',
        items: ['Pianificazione tecnica', 'Sviluppo React e Next.js', 'Gestionali e pannelli di controllo', 'Integrazioni e piano evolutivo']
      }
    ]
  }
} satisfies Record<Locale, {
  eyebrow: string
  title: string
  body: string
  note: string
  packages: { name: string; range: string; desc: string; items: string[] }[]
}>
