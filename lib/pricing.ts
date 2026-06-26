import type { Locale } from './site'

export const pricing = {
  en: {
    eyebrow: 'Investment ranges',
    title: 'Clear packages, shaped around scope.',
    body: 'These ranges keep the first conversation practical. Final pricing depends on content readiness, page count, integrations, and timeline.',
    note: 'Custom software, CMS work, and multilingual content can be scoped separately.',
    packages: [
      {
        name: 'Launch',
        range: 'from EUR 1,500',
        desc: 'A focused one-page or compact site for a clear offer.',
        items: ['Strategy mini-session', 'Landing page or small site', 'Responsive build', 'Static export launch']
      },
      {
        name: 'Premium Website',
        range: 'from EUR 3,500',
        desc: 'A polished multi-page presence for growing brands.',
        items: ['Site structure and messaging', 'Custom visual direction', 'Core pages', 'Launch support']
      },
      {
        name: 'Custom Build',
        range: 'scoped proposal',
        desc: 'For advanced workflows, integrations, dashboards, or product interfaces.',
        items: ['Technical planning', 'React / Next.js implementation', 'Integrations', 'Iteration roadmap']
      }
    ]
  },
  it: {
    eyebrow: 'Range investimento',
    title: 'Pacchetti chiari, definiti in base allo scope.',
    body: 'Questi range rendono la prima conversazione piu pratica. Il prezzo finale dipende da contenuti, numero pagine, integrazioni e tempi.',
    note: 'Software custom, CMS e contenuti multilingua possono essere quotati separatamente.',
    packages: [
      {
        name: 'Launch',
        range: 'da EUR 1.500',
        desc: 'Una one-page o un sito compatto per un’offerta chiara.',
        items: ['Mini-sessione strategia', 'Landing page o piccolo sito', 'Build responsive', 'Lancio static export']
      },
      {
        name: 'Premium Website',
        range: 'da EUR 3.500',
        desc: 'Una presenza multi-pagina curata per brand in crescita.',
        items: ['Struttura e messaggi', 'Direzione visiva custom', 'Pagine principali', 'Supporto lancio']
      },
      {
        name: 'Custom Build',
        range: 'proposta su misura',
        desc: 'Per workflow avanzati, integrazioni, dashboard o interfacce prodotto.',
        items: ['Pianificazione tecnica', 'Implementazione React / Next.js', 'Integrazioni', 'Roadmap iterazioni']
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
