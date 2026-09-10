import type { Locale } from './site'

export type ServiceSlug = 'strategy' | 'marketing' | 'design' | 'development'

type ServiceContent = {
  label: string
  title: string
  shortTitle: string
  desc: string
  intro: string
  items: string[]
  ideal: string
  deliverables: string[]
  outcomes: string[]
  process: string[]
}

type Service = {
  slug: ServiceSlug
  icon: 'compass' | 'megaphone' | 'palette' | 'code'
  color: string
  locales: Record<Locale, ServiceContent>
}

export const services: Service[] = [
  {
    slug: 'strategy',
    icon: 'compass',
    color: 'var(--brand-gold)',
    locales: {
      en: {
        label: 'Strategy',
        title: 'Website strategy and positioning',
        shortTitle: 'Strategy',
        desc: 'Focused direction that gives the development work clear priorities.',
        intro: 'As a supporting service, strategy clarifies who the product is for, what it needs to prove, and what the build should prioritize.',
        items: ['Audience and offer clarity', 'Site structure and priorities', 'Conversion path mapping', 'Launch plan and next steps'],
        ideal: 'Ideal when the business needs sharper direction.',
        deliverables: ['Positioning notes', 'Page map and content priorities', 'Conversion path recommendations', 'Launch checklist'],
        outcomes: ['Clearer offer', 'Faster design decisions', 'Less copy/design rework'],
        process: ['Discovery session', 'Audit of current presence', 'Site architecture', 'Action plan']
      },
      it: {
        label: 'Strategia',
        title: 'Strategia e posizionamento per siti web',
        shortTitle: 'Strategia',
        desc: 'Una direzione focalizzata che assegna priorita chiare allo sviluppo.',
        intro: 'Come servizio di supporto, la strategia chiarisce a chi parla il prodotto, cosa deve dimostrare e quali priorita deve seguire il build.',
        items: ['Chiarezza su pubblico e offerta', 'Struttura e priorita del sito', 'Mappatura del percorso di conversione', 'Piano di lancio e prossimi passi'],
        ideal: 'Ideale quando il business ha bisogno di una direzione piu chiara.',
        deliverables: ['Note di posizionamento', 'Mappa pagine e priorita contenuti', 'Raccomandazioni per la conversione', 'Checklist di lancio'],
        outcomes: ['Offerta piu chiara', 'Decisioni design piu rapide', 'Meno revisioni su testi e layout'],
        process: ['Sessione discovery', 'Audit presenza attuale', 'Architettura sito', 'Piano operativo']
      }
    }
  },
  {
    slug: 'marketing',
    icon: 'megaphone',
    color: 'var(--brand-blue)',
    locales: {
      en: {
        label: 'Marketing',
        title: 'Marketing pages and conversion messaging',
        shortTitle: 'Marketing',
        desc: 'Supporting messaging that helps the finished product turn attention into qualified leads.',
        intro: 'When the build needs it, we shape the page narrative, calls to action, and proof so visitors understand the offer quickly.',
        items: ['Landing pages and sales pages', 'Messaging and microcopy', 'Lead magnets and email flow ideas', 'Basic analytics and tracking setup'],
        ideal: 'Ideal for launches, lead generation, and clearer offers.',
        deliverables: ['Page messaging framework', 'CTA hierarchy', 'Lead capture recommendations', 'Analytics event plan'],
        outcomes: ['Sharper page story', 'Better qualified inquiries', 'More measurable launches'],
        process: ['Offer review', 'Message hierarchy', 'Page flow', 'Measurement setup']
      },
      it: {
        label: 'Marketing',
        title: 'Pagine marketing e messaggi di conversione',
        shortTitle: 'Marketing',
        desc: 'Messaggi di supporto che aiutano il prodotto finale a generare contatti qualificati.',
        intro: 'Quando il build lo richiede, costruiamo narrativa, call to action e prove per rendere l’offerta chiara in pochi secondi.',
        items: ['Landing page e sales page', 'Messaggi e microcopy', 'Idee per lead magnet ed email flow', 'Setup base di analytics e tracking'],
        ideal: 'Ideale per lanci, lead generation e offerte piu leggibili.',
        deliverables: ['Framework messaggi pagina', 'Gerarchia CTA', 'Raccomandazioni lead capture', 'Piano eventi analytics'],
        outcomes: ['Storia pagina piu chiara', 'Contatti piu qualificati', 'Lanci piu misurabili'],
        process: ['Revisione offerta', 'Gerarchia messaggi', 'Flusso pagina', 'Setup misurazione']
      }
    }
  },
  {
    slug: 'design',
    icon: 'palette',
    color: 'var(--brand-purple)',
    locales: {
      en: {
        label: 'Design',
        title: 'Brand and product interface design',
        shortTitle: 'Brand & product design',
        desc: 'Clean, contemporary interfaces designed to support a strong, usable build.',
        intro: 'We design calm, premium interfaces around the product, giving the development a clear visual system without sacrificing usability.',
        items: ['Brand look and feel', 'Website and app UI design', 'Design systems and components', 'Marketing visuals and assets'],
        ideal: 'Ideal for SaaS, agencies, and service businesses.',
        deliverables: ['Visual direction', 'Key page designs', 'Responsive UI states', 'Reusable component guidance'],
        outcomes: ['More polished brand perception', 'Cleaner mobile experience', 'Reusable design language'],
        process: ['Mood and direction', 'Key screens', 'Responsive passes', 'Design handoff']
      },
      it: {
        label: 'Design',
        title: 'Design brand e interfacce prodotto',
        shortTitle: 'Brand e product design',
        desc: 'Interfacce pulite e contemporanee, progettate per un build solido e usabile.',
        intro: 'Progettiamo interfacce premium, calme e leggibili intorno al prodotto, dando allo sviluppo un sistema visivo chiaro senza sacrificare l’usabilita.',
        items: ['Look and feel del brand', 'UI design per siti e app', 'Design system e componenti', 'Asset visual per marketing'],
        ideal: 'Ideale per SaaS, agenzie e aziende di servizi.',
        deliverables: ['Direzione visiva', 'Design pagine chiave', 'Stati responsive UI', 'Linee guida componenti'],
        outcomes: ['Percezione brand piu curata', 'Esperienza mobile piu pulita', 'Linguaggio design riutilizzabile'],
        process: ['Mood e direzione', 'Schermate chiave', 'Pass responsive', 'Handoff design']
      }
    }
  },
  {
    slug: 'development',
    icon: 'code',
    color: 'var(--brand-pink)',
    locales: {
      en: {
        label: 'Development',
        title: 'Custom web development with Next.js',
        shortTitle: 'Development & implementation',
        desc: 'Our core service: fast, accessible websites and web apps built for long-term maintainability.',
        intro: 'Development sits at the centre of our work. We build performant, maintainable digital products that are ready to launch and easy to iterate.',
        items: ['Corporate sites and landing pages', 'Custom React and Next.js frontends', 'Headless CMS integration on request', 'Performance and accessibility checks'],
        ideal: 'Ideal when you want a long-term technical partner.',
        deliverables: ['Next.js implementation', 'Responsive build', 'Static export setup', 'Launch support'],
        outcomes: ['Faster load times', 'Cleaner code ownership', 'Deployment-ready static output'],
        process: ['Technical setup', 'Page build', 'QA and performance', 'Launch handoff']
      },
      it: {
        label: 'Sviluppo',
        title: 'Sviluppo web custom con Next.js',
        shortTitle: 'Sviluppo e implementazione',
        desc: 'Il nostro servizio centrale: siti e app web veloci, accessibili e facili da mantenere.',
        intro: 'Lo sviluppo e al centro del nostro lavoro. Costruiamo prodotti digitali performanti e mantenibili, pronti al lancio e facili da migliorare.',
        items: ['Siti corporate e landing page', 'Frontend custom React e Next.js', 'Integrazione headless CMS su richiesta', 'Controlli performance e accessibilita'],
        ideal: 'Ideale quando vuoi un partner tecnico nel tempo.',
        deliverables: ['Implementazione Next.js', 'Build responsive', 'Setup static export', 'Supporto lancio'],
        outcomes: ['Caricamenti piu rapidi', 'Codice piu ordinato', 'Output statico pronto al deploy'],
        process: ['Setup tecnico', 'Sviluppo pagine', 'QA e performance', 'Handoff lancio']
      }
    }
  }
]

export function getServices(locale: Locale) {
  return services.map(service => ({
    slug: service.slug,
    icon: service.icon,
    color: service.color,
    ...service.locales[locale]
  }))
}

export function getService(slug: string, locale: Locale) {
  const service = services.find(item => item.slug === slug)
  if (!service) return null
  return {
    slug: service.slug,
    icon: service.icon,
    color: service.color,
    ...service.locales[locale]
  }
}

export function getServicePath(slug: ServiceSlug, locale: Locale) {
  return locale === 'it' ? `/it/services/${slug}/` : `/services/${slug}/`
}
