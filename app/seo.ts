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
    title: { absolute: 'Nivello' },
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
    description: 'Modern Next.js development for fast, maintainable websites and web apps, supported by strategy, design, and marketing.',
    route: 'home',
    ogSlug: 'home'
  }),
  homeIt: makeMetadata({
    title: 'Nivello',
    description: 'Sviluppo Next.js per siti e app web veloci e mantenibili, supportato da strategia, design e marketing.',
    route: 'home',
    ogSlug: 'home-it',
    locale: 'it'
  }),
  services: makeMetadata({
    title: 'Services',
    description: 'Web development for modern websites and digital products, with strategy, marketing, and design available as supporting services.',
    route: 'services',
    ogSlug: 'services'
  }),
  servicesIt: makeMetadata({
    title: 'Servizi',
    description: 'Sviluppo web per siti e prodotti digitali moderni, con strategia, marketing e design come servizi di supporto.',
    route: 'services',
    ogSlug: 'services-it',
    locale: 'it'
  }),
  work: makeMetadata({
    title: 'Work',
    description: 'Selected Nivello websites, landing pages, and custom web apps for hospitality, construction, local services, publishing, and consulting brands.',
    route: 'work',
    ogSlug: 'work'
  }),
  workIt: makeMetadata({
    title: 'Lavori',
    description: 'Siti, landing page e app web custom realizzati da Nivello per hospitality, edilizia, servizi locali, editoria e consulenza.',
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
    description: 'Tell Nivello about the website, web app, or software you need developed. We usually reply within one business day.',
    route: 'contact',
    ogSlug: 'contact'
  }),
  contactIt: makeMetadata({
    title: 'Contatti',
    description: 'Raccontaci il sito, la web app o il software che vuoi sviluppare. Di solito rispondiamo entro un giorno lavorativo.',
    route: 'contact',
    ogSlug: 'contact-it',
    locale: 'it'
  }),
  about: makeMetadata({
    title: 'About',
    description: 'Nivello is a development-led studio for modern websites and web apps, supported by strategy, marketing, and design.',
    route: 'about',
    ogSlug: 'about'
  }),
  aboutIt: makeMetadata({
    title: 'Chi siamo',
    description: 'Nivello e uno studio guidato dallo sviluppo di siti e app web moderni, supportato da strategia, marketing e design.',
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
