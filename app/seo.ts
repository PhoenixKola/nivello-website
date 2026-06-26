import type { Metadata } from 'next'
import { absoluteUrl, getRoutePath, type Locale, type RouteKey } from '@/lib/site'

type PageSeo = {
  title: string
  description: string
  route: RouteKey
  ogSlug: string
  locale?: Locale
}

export function makeMetadata({
  title,
  description,
  route,
  ogSlug,
  locale = 'en'
}: PageSeo): Metadata {
  const canonical = getRoutePath(route, locale)
  const localeCode = locale === 'it' ? 'it_IT' : 'en_US'

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: getRoutePath(route, 'en'),
        it: getRoutePath(route, 'it')
      }
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: 'Nivello',
      type: 'website',
      locale: localeCode,
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
    route: 'home',
    ogSlug: 'home'
  }),
  homeIt: makeMetadata({
    title: 'Nivello',
    description: 'Strategia, marketing, design e sviluppo Next.js per brand italiani ed europei che vogliono una presenza digitale piu chiara.',
    route: 'home',
    ogSlug: 'home-it',
    locale: 'it'
  }),
  services: makeMetadata({
    title: 'Services',
    description: 'Strategy, marketing, design, and development services for modern websites, product pages, and lead-focused digital experiences.',
    route: 'services',
    ogSlug: 'services'
  }),
  servicesIt: makeMetadata({
    title: 'Servizi',
    description: 'Strategia, marketing, design e sviluppo per siti moderni, pagine prodotto ed esperienze digitali orientate ai contatti.',
    route: 'services',
    ogSlug: 'services-it',
    locale: 'it'
  }),
  work: makeMetadata({
    title: 'Work',
    description: 'Selected Nivello website projects for hospitality, publishing, local services, consulting, and expat support brands.',
    route: 'work',
    ogSlug: 'work'
  }),
  workIt: makeMetadata({
    title: 'Lavori',
    description: 'Progetti web selezionati per hospitality, editoria, servizi locali, consulenza e supporto expat.',
    route: 'work',
    ogSlug: 'work-it',
    locale: 'it'
  }),
  process: makeMetadata({
    title: 'How We Work',
    description: 'A clear five-step process from discovery and scope to design, build, launch, and refinement.',
    route: 'process',
    ogSlug: 'process'
  }),
  processIt: makeMetadata({
    title: 'Metodo',
    description: 'Un processo chiaro in cinque fasi: analisi, proposta, design, sviluppo, lancio e miglioramento.',
    route: 'process',
    ogSlug: 'process-it',
    locale: 'it'
  }),
  contact: makeMetadata({
    title: 'Contact',
    description: 'Tell Nivello about your website, marketing, design, or software project. We usually reply within one business day.',
    route: 'contact',
    ogSlug: 'contact'
  }),
  contactIt: makeMetadata({
    title: 'Contatti',
    description: 'Raccontaci il tuo progetto web, marketing, design o software. Di solito rispondiamo entro un giorno lavorativo.',
    route: 'contact',
    ogSlug: 'contact-it',
    locale: 'it'
  }),
  about: makeMetadata({
    title: 'About',
    description: 'Nivello is an Italy-based digital studio for strategy, marketing, design, and modern web development.',
    route: 'about',
    ogSlug: 'about'
  }),
  aboutIt: makeMetadata({
    title: 'Chi siamo',
    description: 'Nivello e uno studio digitale basato in Italia per strategia, marketing, design e sviluppo web moderno.',
    route: 'about',
    ogSlug: 'about-it',
    locale: 'it'
  }),
  imprint: makeMetadata({
    title: 'Imprint',
    description: 'Legal information and company contact details for Nivello.',
    route: 'imprint',
    ogSlug: 'imprint'
  }),
  imprintIt: makeMetadata({
    title: 'Impronta',
    description: 'Informazioni legali e dettagli di contatto di Nivello.',
    route: 'imprint',
    ogSlug: 'imprint-it',
    locale: 'it'
  }),
  privacy: makeMetadata({
    title: 'Privacy Policy',
    description: 'How Nivello handles personal data, contact requests, and website analytics.',
    route: 'privacy',
    ogSlug: 'privacy'
  }),
  privacyIt: makeMetadata({
    title: 'Privacy',
    description: 'Come Nivello gestisce dati personali, richieste di contatto e analytics del sito.',
    route: 'privacy',
    ogSlug: 'privacy-it',
    locale: 'it'
  }),
  disclaimer: makeMetadata({
    title: 'Disclaimer',
    description: 'General website disclaimer for Nivello content, links, and services.',
    route: 'disclaimer',
    ogSlug: 'disclaimer'
  }),
  disclaimerIt: makeMetadata({
    title: 'Disclaimer',
    description: 'Disclaimer generale per contenuti, link e servizi del sito Nivello.',
    route: 'disclaimer',
    ogSlug: 'disclaimer-it',
    locale: 'it'
  })
}
