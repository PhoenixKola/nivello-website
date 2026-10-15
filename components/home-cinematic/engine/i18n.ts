/**
 * Every human-readable word painted into the 3D world lives here, in both locales. The engine receives the page's
 * locale (the route decides it) and the painters read from this dictionary, so no English is baked into a texture on
 * an Italian page. Programming syntax, file names and brand names stay as they are on purpose (see the `neutral` notes).
 */
export type SceneLocale = 'en' | 'it'

export type SceneCopy = {
  call: { title: string; participants: [string, string, string, string] }
  plan: {
    title: (version: number) => string
    goalsHeading: string
    goals: [string, string, string]
    audienceHeading: string
    audience: [string, string]
    nodes: [string, string, string, string, string, string]
    notes: [string, string]
  }
  design: {
    heroLine1: string
    heroLine2: string
    heroBody: string
    cta: string
    cards: [string, string, string]
    specimen: { caption: string }
  }
  dev: {
    editorTitle: string
    editorComment: string
    flowTitle: string
    flow: { browser: string; edge: string; api: string; database: string; queue: string }
    previewTitle: string
    previewHero: [string, string]
    previewCards: [string, string, string]
  }
  roles: { design: string; frontend: string; backend: string }
  signs: { projects: string; reviews: string; exit: string }
  tunnel: { sign: string }
}

export const sceneCopy: Record<SceneLocale, SceneCopy> = {
  en: {
    call: { title: 'Project kickoff', participants: ['Client', 'Product owner', 'Nivello', 'Designer'] },
    plan: {
      title: version => `Site plan  ·  v${version}`,
      goalsHeading: 'GOALS',
      goals: ['More enquiries', 'A clear offer', 'Faster site'],
      audienceHeading: 'AUDIENCE',
      audience: ['New clients', 'Mobile first'],
      nodes: ['Home', 'Services', 'Work', 'About', 'Case studies', 'Contact'],
      notes: ['Add booking here', 'Simplify menu']
    },
    design: {
      heroLine1: 'Websites that',
      heroLine2: 'work for you.',
      heroBody: 'Clear structure, honest design, built to last.',
      cta: 'Get started',
      cards: ['Fast', 'Clear', 'Yours'],
      specimen: { caption: 'Display · Text · Caption' }
    },
    dev: {
      editorTitle: 'page.tsx  ·  Frontend',
      editorComment: '// accessible, fast, and typed end to end',
      flowTitle: 'architecture  ·  Backend',
      flow: { browser: 'Browser', edge: 'Edge / CDN', api: 'API', database: 'Database', queue: 'Queue' },
      previewTitle: 'preview  ·  localhost:3000',
      previewHero: ['Websites that', 'work for you.'],
      previewCards: ['Fast', 'Clear', 'Yours']
    },
    roles: { design: 'Design', frontend: 'Frontend', backend: 'Backend' },
    signs: { projects: 'PROJECTS', reviews: 'CLIENT FEEDBACK', exit: 'REVIEWS' },
    tunnel: { sign: 'CLIENT FEEDBACK' }
  },
  it: {
    call: { title: 'Kickoff del progetto', participants: ['Cliente', 'Responsabile prodotto', 'Nivello', 'Designer'] },
    plan: {
      title: version => `Piano del sito  ·  v${version}`,
      goalsHeading: 'OBIETTIVI',
      goals: ['Più richieste', 'Offerta chiara', 'Sito più veloce'],
      audienceHeading: 'PUBBLICO',
      audience: ['Nuovi clienti', 'Prima il mobile'],
      nodes: ['Home', 'Servizi', 'Lavori', 'Chi siamo', 'Case study', 'Contatti'],
      notes: ['Qui la prenotazione', 'Menu più semplice']
    },
    design: {
      heroLine1: 'Siti web che',
      heroLine2: 'lavorano per te.',
      heroBody: 'Struttura chiara, design onesto, fatto per durare.',
      cta: 'Iniziamo',
      cards: ['Veloce', 'Chiaro', 'Tuo'],
      specimen: { caption: 'Titoli · Testo · Didascalie' }
    },
    dev: {
      editorTitle: 'page.tsx  ·  Frontend',
      editorComment: '// accessibile, veloce e tipizzato da cima a fondo',
      flowTitle: 'architettura  ·  Backend',
      flow: { browser: 'Browser', edge: 'Edge / CDN', api: 'API', database: 'Database', queue: 'Coda' },
      previewTitle: 'anteprima  ·  localhost:3000',
      previewHero: ['Siti web che', 'lavorano per te.'],
      previewCards: ['Veloce', 'Chiaro', 'Tuo']
    },
    roles: { design: 'Design', frontend: 'Frontend', backend: 'Backend' },
    signs: { projects: 'PROGETTI', reviews: 'DICONO DI NOI', exit: 'RECENSIONI' },
    tunnel: { sign: 'DICONO DI NOI' }
  }
}

/**
 * Strings that are deliberately language-neutral: brand names, product names, file names and language syntax.
 * The localisation test uses this list to tell an intentional repeat from an untranslated string.
 */
export const NEUTRAL_STRINGS = new Set<string>([
  'Home', 'Browser', 'API', 'Database', 'Nivello', 'Edge / CDN', 'Design', 'Designer', 'Frontend', 'Backend', 'page.tsx  ·  Frontend'
])

/** In snap mode the painters record every label here, so a test can assert what was really drawn in each locale. */
export function recordLabel(text: string) {
  if (typeof window === 'undefined') return
  const store = (window as unknown as { __cinLabels?: Set<string> }).__cinLabels
  store?.add(text)
}
