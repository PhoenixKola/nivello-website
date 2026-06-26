import type { Locale } from './site'

type LocalizedProject = {
  category: string
  body: string
  desc: string
  details: string[]
  challenge: string
  solution: string
  result: string
  services: string[]
}

export type Project = {
  slug: string
  href: string
  shot: string
  title: string
  color: string
  category: string
  body: string
  desc: string
  details: string[]
  challenge: string
  solution: string
  result: string
  services: string[]
}

const projects = [
  {
    slug: 'rombo-nord',
    href: 'https://rombonord.com/it/',
    shot: '/work-rombonord.webp',
    title: 'Rombo Nord',
    color: '#0a1f44',
    locales: {
      en: {
        category: 'Hospitality',
        body: 'Bilingual site for a seaside restaurant and cocktail bar in Genova Pegli.',
        desc: 'Bilingual website for a historic seaside restaurant and cocktail bar in Pegli, with clear paths to menus, events, and reservations.',
        details: ['Separate drink and restaurant menus', 'Booking flow linked to contact channel', 'Atmospheric visuals aligned with the brand'],
        challenge: 'Rombo Nord needed a digital presence that matched a strong local reputation while making menus, events, and reservations easy to reach.',
        solution: 'We shaped a bilingual hospitality site with clear navigation, strong atmosphere, and direct paths to the information guests look for first.',
        result: 'A more polished brand experience that helps both locals and international visitors understand the venue before they arrive.',
        services: ['Strategy', 'Design', 'Development', 'Bilingual structure']
      },
      it: {
        category: 'Hospitality',
        body: 'Sito bilingue per ristorante e cocktail bar sul mare a Genova Pegli.',
        desc: 'Sito bilingue per uno storico ristorante e cocktail bar sul mare a Pegli, con percorsi chiari verso menu, eventi e prenotazioni.',
        details: ['Menu drink e ristorante separati', 'Flusso prenotazione collegato al contatto', 'Visual atmosferici allineati al brand'],
        challenge: 'Rombo Nord aveva bisogno di una presenza digitale allineata alla reputazione locale, con menu, eventi e prenotazioni facili da raggiungere.',
        solution: 'Abbiamo costruito un sito hospitality bilingue con navigazione chiara, atmosfera visiva e percorsi diretti verso le informazioni piu richieste.',
        result: 'Un’esperienza brand piu curata che aiuta clienti locali e internazionali a capire il locale prima ancora di arrivare.',
        services: ['Strategia', 'Design', 'Sviluppo', 'Struttura bilingue']
      }
    } satisfies Record<Locale, LocalizedProject>
  },
  {
    slug: 'le-camelie',
    href: 'https://le-camelie.com/',
    shot: '/work-lecamelie.webp',
    title: 'Le Camelie',
    color: '#385948',
    locales: {
      en: {
        category: 'Guesthouse',
        body: 'Conversion-focused property site for a guesthouse in central Genova.',
        desc: 'Compact property site for a guesthouse in the centre of Genova, focused on clarity, comfort details, and booking-engine conversions.',
        details: ['Room galleries and amenities overview', 'Trust-focused layout with review highlights', 'Clear booking engine call to action'],
        challenge: 'The guesthouse needed a compact website that could communicate comfort, location, and booking value quickly.',
        solution: 'We organized the content around rooms, location, amenities, and booking intent, keeping the interface calm and easy to scan.',
        result: 'A cleaner booking path and stronger first impression for guests comparing stays in central Genova.',
        services: ['Strategy', 'Design', 'Development', 'Booking flow']
      },
      it: {
        category: 'Guesthouse',
        body: 'Sito orientato alle prenotazioni per una guesthouse nel centro di Genova.',
        desc: 'Sito compatto per una guesthouse nel centro di Genova, focalizzato su chiarezza, dettagli di comfort e conversioni verso booking engine.',
        details: ['Gallerie camere e servizi', 'Layout con segnali di fiducia', 'Call to action chiara verso prenotazione'],
        challenge: 'La guesthouse aveva bisogno di un sito compatto capace di comunicare comfort, posizione e valore della prenotazione in modo rapido.',
        solution: 'Abbiamo organizzato contenuti intorno a camere, posizione, servizi e prenotazione, mantenendo l’interfaccia calma e leggibile.',
        result: 'Un percorso di prenotazione piu chiaro e una prima impressione piu forte per chi confronta soggiorni nel centro di Genova.',
        services: ['Strategia', 'Design', 'Sviluppo', 'Flusso prenotazione']
      }
    } satisfies Record<Locale, LocalizedProject>
  },
  {
    slug: 'gjergj-jozef-kola',
    href: 'https://gjergj-jozef-kola.com/',
    shot: '/work-gjergj.webp',
    title: 'Gjergj Jozef Kola',
    color: '#A36124',
    locales: {
      en: {
        category: 'Author portfolio',
        body: 'Multilingual author website with biography, books, and contact paths.',
        desc: 'Multilingual author website with a small shop, presenting books, biography, and contact in a calm, literary layout.',
        details: ['Author intro and featured books', 'Book pages ready for e-commerce', 'Contact for readers and media'],
        challenge: 'The author needed a multilingual home for biography, books, and reader contact without making the experience feel commercial.',
        solution: 'We designed a restrained editorial interface with clear book discovery, biography context, and practical paths for readers and media.',
        result: 'A calm literary presence that gives the author more control over how his work is presented online.',
        services: ['Content structure', 'Design', 'Development', 'Multilingual pages']
      },
      it: {
        category: 'Portfolio autore',
        body: 'Sito autore multilingua con biografia, libri e percorsi di contatto.',
        desc: 'Sito autore multilingua con piccolo shop, libri, biografia e contatti in un layout calmo e letterario.',
        details: ['Intro autore e libri in evidenza', 'Pagine libro pronte per e-commerce', 'Contatto per lettori e media'],
        challenge: 'L’autore aveva bisogno di una casa multilingua per biografia, libri e contatti senza rendere l’esperienza troppo commerciale.',
        solution: 'Abbiamo progettato un’interfaccia editoriale sobria, con scoperta libri, contesto biografico e percorsi pratici per lettori e media.',
        result: 'Una presenza letteraria calma che offre piu controllo su come l’opera viene presentata online.',
        services: ['Struttura contenuti', 'Design', 'Sviluppo', 'Pagine multilingua']
      }
    } satisfies Record<Locale, LocalizedProject>
  },
  {
    slug: 'consteam',
    href: 'https://consteam.eu/',
    shot: '/work-consteam.webp',
    title: 'Consteam',
    color: '#FFBF43',
    locales: {
      en: {
        category: 'Local services',
        body: 'Multi-page website for cleaning and maintenance services.',
        desc: 'Responsive multi-page site for a cleaning and maintenance company, emphasizing services, contact flows and trust signals.',
        details: ['Service overview by offer', 'Contact form and request flow', 'Professional B2B and B2C layout'],
        challenge: 'Consteam needed to explain several local service lines in a way that felt professional for both private and business clients.',
        solution: 'We split the offer into clear service areas, added trust signals, and made contact paths visible throughout the experience.',
        result: 'A more organized service presence that makes requests easier and gives the company a more credible digital profile.',
        services: ['Service architecture', 'UI design', 'Development', 'Contact flow']
      },
      it: {
        category: 'Servizi locali',
        body: 'Sito multi-pagina per servizi di pulizia e manutenzione.',
        desc: "Sito multi-pagina responsive per un'azienda di pulizie e manutenzioni, con focus su servizi, contatti e fiducia.",
        details: ['Servizi organizzati per offerta', 'Form contatto e richiesta rapida', 'Layout professionale B2B e B2C'],
        challenge: 'Consteam doveva spiegare diverse linee di servizio locali in modo professionale sia per clienti privati sia business.',
        solution: 'Abbiamo diviso l’offerta in aree chiare, aggiunto segnali di fiducia e reso i percorsi di contatto visibili in piu punti.',
        result: 'Una presenza servizi piu ordinata, con richieste piu semplici e un profilo digitale piu credibile.',
        services: ['Architettura servizi', 'UI design', 'Sviluppo', 'Flusso contatto']
      }
    } satisfies Record<Locale, LocalizedProject>
  },
  {
    slug: 'your-assist-in-italy',
    href: 'https://yourassistinitaly.com/',
    shot: '/work-yourassist.webp',
    title: 'Your Assist in Italy',
    color: '#DC2626',
    locales: {
      en: {
        category: 'Expat services',
        body: 'Bilingual consulting site for immigration and relocation support.',
        desc: 'Bilingual site for an immigration consultancy based in Florence, helping expats navigate permits and work authorizations.',
        details: ['English and Italian service pages', 'Clear consultation paths', 'Trust-building FAQs and testimonials'],
        challenge: 'Your Assist in Italy needed to make complex immigration and relocation services feel understandable and trustworthy for expats.',
        solution: 'We created a bilingual structure with service pages, consultation paths, FAQs, and proof points that reduce uncertainty.',
        result: 'A clearer consulting presence that helps international clients understand the next step before booking support.',
        services: ['Strategy', 'Messaging', 'Design', 'Bilingual development']
      },
      it: {
        category: 'Servizi expat',
        body: 'Sito bilingue per consulenza immigrazione e trasferimenti in Italia.',
        desc: 'Sito bilingue per una consulenza immigrazione a Firenze, pensato per expat che devono orientarsi tra permessi e autorizzazioni.',
        details: ['Pagine servizio in inglese e italiano', 'Percorsi chiari per consulenza', 'FAQ e testimonianze per fiducia'],
        challenge: 'Your Assist in Italy doveva rendere servizi complessi di immigrazione e relocation piu comprensibili e affidabili per expat.',
        solution: 'Abbiamo creato una struttura bilingue con pagine servizio, percorsi consulenza, FAQ e prove di fiducia per ridurre l’incertezza.',
        result: 'Una presenza consulenziale piu chiara che aiuta clienti internazionali a capire il prossimo passo prima di prenotare supporto.',
        services: ['Strategia', 'Messaggio', 'Design', 'Sviluppo bilingue']
      }
    } satisfies Record<Locale, LocalizedProject>
  }
]

export function getProjects(locale: Locale): Project[] {
  return projects.map(project => ({
    href: project.href,
    slug: project.slug,
    shot: project.shot,
    title: project.title,
    color: project.color,
    ...project.locales[locale]
  }))
}

export function getProjectId(title: string) {
  return title.toLowerCase().replaceAll(' ', '-')
}

export function getProject(slug: string, locale: Locale) {
  const project = projects.find(item => item.slug === slug)
  if (!project) return null

  return {
    href: project.href,
    slug: project.slug,
    shot: project.shot,
    title: project.title,
    color: project.color,
    ...project.locales[locale]
  }
}

export function getProjectPath(slug: string, locale: Locale) {
  return locale === 'it' ? `/it/work/${slug}/` : `/work/${slug}/`
}
