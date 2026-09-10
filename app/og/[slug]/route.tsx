import { ImageResponse } from 'next/og'
import { loadOgFonts, OgCard, ogSize } from '@/lib/og'

export const dynamic = 'force-static'

const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  home: {
    eyebrow: 'Nivello',
    title: 'Modern web development for ambitious brands',
    description: 'Fast, maintainable websites and web apps built with Next.js.'
  },
  'home-it': {
    eyebrow: 'Nivello',
    title: 'Sviluppo web moderno per brand ambiziosi',
    description: 'Siti e app web veloci e mantenibili, sviluppati in Next.js.'
  },
  services: {
    eyebrow: 'Services',
    title: 'Web development, with the right support',
    description: 'Strategy, marketing, and design strengthen the core build.'
  },
  'services-it': {
    eyebrow: 'Servizi',
    title: 'Sviluppo web, con il supporto giusto',
    description: 'Strategia, marketing e design rafforzano il build centrale.'
  },
  work: {
    eyebrow: 'Work',
    title: 'Websites, landing pages, and apps',
    description: 'Public-facing experiences and behind-the-scenes products.'
  },
  'work-it': {
    eyebrow: 'Lavori',
    title: 'Siti, landing page e app',
    description: 'Esperienze pubbliche e prodotti digitali dietro le quinte.'
  },
  process: {
    eyebrow: 'How we work',
    title: 'A clear path from scope to launch',
    description: 'Five calm steps, focused checkpoints, no messy handovers.'
  },
  'process-it': {
    eyebrow: 'Metodo',
    title: 'Dal brief al lancio, con metodo',
    description: 'Cinque fasi chiare, revisioni mirate, nessun passaggio caotico.'
  },
  contact: {
    eyebrow: 'Contact',
    title: 'Tell us what you are building',
    description: 'We usually reply within one business day.'
  },
  'contact-it': {
    eyebrow: 'Contatti',
    title: 'Raccontaci cosa vuoi costruire',
    description: 'Di solito rispondiamo entro un giorno lavorativo.'
  },
  about: { eyebrow: 'About', title: 'A digital studio built on clarity', description: 'Clear thinking, premium execution.' },
  'about-it': { eyebrow: 'Chi siamo', title: 'Uno studio digitale fondato sulla chiarezza', description: 'Pensiero chiaro, esecuzione premium.' },
  imprint: { eyebrow: 'Legal', title: 'Imprint', description: 'Legal and contact information for Nivello.' },
  'imprint-it': { eyebrow: 'Legale', title: 'Impronta', description: 'Informazioni legali e contatti di Nivello.' },
  privacy: { eyebrow: 'Legal', title: 'Privacy Policy', description: 'How Nivello handles personal data.' },
  'privacy-it': { eyebrow: 'Legale', title: 'Privacy', description: 'Come Nivello gestisce i dati personali.' },
  disclaimer: { eyebrow: 'Legal', title: 'Disclaimer', description: 'General website disclaimer for Nivello.' },
  'disclaimer-it': { eyebrow: 'Legale', title: 'Disclaimer', description: 'Disclaimer generale del sito Nivello.' }
}

export function generateStaticParams() {
  return Object.keys(pages).map(slug => ({ slug }))
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const page = pages[slug] || pages.home

  const fonts = await loadOgFonts()

  return new ImageResponse(
    <OgCard eyebrow={page.eyebrow} title={page.title} description={page.description} />,
    { ...ogSize, fonts: fonts.length ? fonts : undefined }
  )
}
