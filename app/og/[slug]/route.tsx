import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'

const size = { width: 1200, height: 630 }

const pages: Record<string, { title: string; eyebrow: string; description: string }> = {
  home: {
    eyebrow: 'Nivello',
    title: 'Premium websites for Italian brands',
    description: 'Strategy, marketing, design, and Next.js development.'
  },
  'home-it': {
    eyebrow: 'Nivello',
    title: 'Siti web premium per brand italiani',
    description: 'Strategia, marketing, design e sviluppo Next.js.'
  },
  services: {
    eyebrow: 'Services',
    title: 'Strategy, marketing, design, development',
    description: 'A focused digital studio for clear growth work.'
  },
  'services-it': {
    eyebrow: 'Servizi',
    title: 'Strategia, marketing, design, sviluppo',
    description: 'Uno studio digitale per crescere con chiarezza.'
  },
  work: {
    eyebrow: 'Work',
    title: 'Selected website projects',
    description: 'Hospitality, publishing, services, and consulting.'
  },
  'work-it': {
    eyebrow: 'Lavori',
    title: 'Progetti web selezionati',
    description: 'Hospitality, editoria, servizi e consulenza.'
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
  about: { eyebrow: 'About', title: 'Italy-based digital studio', description: 'Small team, clear thinking, premium execution.' },
  'about-it': { eyebrow: 'Chi siamo', title: 'Studio digitale basato in Italia', description: 'Team piccolo, pensiero chiaro, esecuzione premium.' },
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#020408',
          color: '#f8fafc',
          padding: '68px 78px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 38, fontWeight: 800 }}>Nivello</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 52, height: 8, borderRadius: 999, background: '#ffbf43' }} />
            <div style={{ width: 52, height: 8, borderRadius: 999, background: '#159bff' }} />
            <div style={{ width: 52, height: 8, borderRadius: 999, background: '#7c3aed' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              display: 'flex',
              border: '1px solid rgba(255,191,67,0.55)',
              borderRadius: 999,
              padding: '10px 20px',
              color: '#ffbf43',
              fontSize: 22,
              fontWeight: 700
            }}
          >
            {page.eyebrow}
          </div>
          <div style={{ display: 'flex', maxWidth: 930, fontSize: 76, lineHeight: 1.02, fontWeight: 800 }}>
            {page.title}
          </div>
          <div style={{ display: 'flex', maxWidth: 760, fontSize: 28, lineHeight: 1.35, color: '#cbd5e1' }}>
            {page.description}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 24 }}>
          <span>Based in Italy</span>
          <span>nivello.it</span>
        </div>
      </div>
    ),
    size
  )
}
