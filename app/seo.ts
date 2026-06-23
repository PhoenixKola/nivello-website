import type { Metadata } from 'next'

type PageSeo = {
  title: string
  description: string
  path: string
  itPath: string
  ogSlug: string
  locale?: 'en_US' | 'it_IT'
}

export function makeMetadata({
  title,
  description,
  path,
  itPath,
  ogSlug,
  locale = 'en_US'
}: PageSeo): Metadata {
  const canonical = path || '/'
  const url = `https://www.nivello.it${canonical === '/' ? '' : canonical}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: path,
        it: itPath
      }
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Nivello',
      type: 'website',
      locale,
      images: [{ url: `/og/${ogSlug}`, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og/${ogSlug}`]
    }
  }
}

export const pageSeo = {
  home: makeMetadata({
    title: 'Nivello',
    description: 'Strategy, marketing, design, and Next.js development for Italian and European brands that need a sharper digital presence.',
    path: '/',
    itPath: '/it',
    ogSlug: 'home'
  }),
  homeIt: makeMetadata({
    title: 'Nivello',
    description: 'Strategia, marketing, design e sviluppo Next.js per brand italiani ed europei che vogliono una presenza digitale piu chiara.',
    path: '/it',
    itPath: '/it',
    ogSlug: 'home-it',
    locale: 'it_IT'
  }),
  services: makeMetadata({
    title: 'Services | Nivello',
    description: 'Strategy, marketing, design, and development services for modern websites, product pages, and lead-focused digital experiences.',
    path: '/services',
    itPath: '/it/services',
    ogSlug: 'services'
  }),
  servicesIt: makeMetadata({
    title: 'Servizi | Nivello',
    description: 'Strategia, marketing, design e sviluppo per siti moderni, pagine prodotto ed esperienze digitali orientate ai contatti.',
    path: '/it/services',
    itPath: '/it/services',
    ogSlug: 'services-it',
    locale: 'it_IT'
  }),
  work: makeMetadata({
    title: 'Work | Nivello',
    description: 'Selected Nivello website projects for hospitality, publishing, local services, consulting, and expat support brands.',
    path: '/work',
    itPath: '/it/work',
    ogSlug: 'work'
  }),
  workIt: makeMetadata({
    title: 'Lavori | Nivello',
    description: 'Progetti web selezionati per hospitality, editoria, servizi locali, consulenza e supporto expat.',
    path: '/it/work',
    itPath: '/it/work',
    ogSlug: 'work-it',
    locale: 'it_IT'
  }),
  process: makeMetadata({
    title: 'How We Work | Nivello',
    description: 'A clear five-step process from discovery and scope to design, build, launch, and refinement.',
    path: '/process',
    itPath: '/it/process',
    ogSlug: 'process'
  }),
  processIt: makeMetadata({
    title: 'Metodo | Nivello',
    description: 'Un processo chiaro in cinque fasi: analisi, proposta, design, sviluppo, lancio e miglioramento.',
    path: '/it/process',
    itPath: '/it/process',
    ogSlug: 'process-it',
    locale: 'it_IT'
  }),
  contact: makeMetadata({
    title: 'Contact | Nivello',
    description: 'Tell Nivello about your website, marketing, design, or software project. We usually reply within one business day.',
    path: '/contact',
    itPath: '/it/contact',
    ogSlug: 'contact'
  }),
  contactIt: makeMetadata({
    title: 'Contatti | Nivello',
    description: 'Raccontaci il tuo progetto web, marketing, design o software. Di solito rispondiamo entro un giorno lavorativo.',
    path: '/it/contact',
    itPath: '/it/contact',
    ogSlug: 'contact-it',
    locale: 'it_IT'
  }),
  about: makeMetadata({
    title: 'About | Nivello',
    description: 'Nivello is an Italy-based digital studio for strategy, marketing, design, and modern web development.',
    path: '/about',
    itPath: '/it/chi-siamo',
    ogSlug: 'about'
  }),
  aboutIt: makeMetadata({
    title: 'Chi siamo | Nivello',
    description: 'Nivello e uno studio digitale basato in Italia per strategia, marketing, design e sviluppo web moderno.',
    path: '/it/chi-siamo',
    itPath: '/it/chi-siamo',
    ogSlug: 'about-it',
    locale: 'it_IT'
  }),
  imprint: makeMetadata({
    title: 'Imprint | Nivello',
    description: 'Legal information and company contact details for Nivello.',
    path: '/imprint',
    itPath: '/it/impronta',
    ogSlug: 'imprint'
  }),
  imprintIt: makeMetadata({
    title: 'Impronta | Nivello',
    description: 'Informazioni legali e dettagli di contatto di Nivello.',
    path: '/it/impronta',
    itPath: '/it/impronta',
    ogSlug: 'imprint-it',
    locale: 'it_IT'
  }),
  privacy: makeMetadata({
    title: 'Privacy Policy | Nivello',
    description: 'How Nivello handles personal data, contact requests, and website analytics.',
    path: '/privacy',
    itPath: '/it/privacy',
    ogSlug: 'privacy'
  }),
  privacyIt: makeMetadata({
    title: 'Privacy | Nivello',
    description: 'Come Nivello gestisce dati personali, richieste di contatto e analytics del sito.',
    path: '/it/privacy',
    itPath: '/it/privacy',
    ogSlug: 'privacy-it',
    locale: 'it_IT'
  }),
  disclaimer: makeMetadata({
    title: 'Disclaimer | Nivello',
    description: 'General website disclaimer for Nivello content, links, and services.',
    path: '/disclaimer',
    itPath: '/it/disclaimer',
    ogSlug: 'disclaimer'
  }),
  disclaimerIt: makeMetadata({
    title: 'Disclaimer | Nivello',
    description: 'Disclaimer generale per contenuti, link e servizi del sito Nivello.',
    path: '/it/disclaimer',
    itPath: '/it/disclaimer',
    ogSlug: 'disclaimer-it',
    locale: 'it_IT'
  })
}
