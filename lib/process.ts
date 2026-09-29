import { Code2, Compass, FileText, Rocket, Sparkles, type LucideIcon } from 'lucide-react'
import type { Locale } from './site'

/**
 * The five Nivello workflow stages, shared by /process/ and the homepage
 * pipeline so the two surfaces can no longer drift apart.
 *
 * `description` and `clientView` carry the full process-page detail; `short`
 * is the condensed homepage line. The homepage deliberately shows less.
 */

type LocalizedStage = {
  title: string
  description: string
  short: string
  clientView: string
  duration: string
}

export type ProcessStage = LocalizedStage & {
  id: string
  icon: LucideIcon
  color: string
}

const stages = [
  {
    id: 'intro',
    icon: Compass,
    color: 'var(--brand-gold)',
    locales: {
      en: {
        title: 'Intro call and fit check',
        description: 'We clarify goals, constraints, timing, and what a good outcome looks like.',
        short: 'We clarify goals, constraints, and what a good outcome looks like.',
        clientView: 'A first scope direction and a clear sense of whether we are the right fit.',
        duration: '30-45 minutes'
      },
      it: {
        title: 'Call introduttiva e fit check',
        description: 'Chiariamo obiettivi, vincoli, tempi e cosa significa un buon risultato.',
        short: 'Chiariamo obiettivi, vincoli e cosa significa un buon risultato.',
        clientView: 'Una prima direzione di scope e la sensazione chiara che siamo il partner giusto o no.',
        duration: '30-45 minuti'
      }
    }
  },
  {
    id: 'scope',
    icon: FileText,
    color: 'var(--brand-blue)',
    locales: {
      en: {
        title: 'Scope, plan, and proposal',
        description: 'We define deliverables, milestones, responsibilities, and decision points.',
        short: 'We define deliverables, milestones, and decision points.',
        clientView: 'A proposal with timeline, investment, and the practical next steps.',
        duration: '3-5 days'
      },
      it: {
        title: 'Scope, piano e proposta',
        description: 'Definiamo deliverable, milestone, responsabilità e punti decisionali.',
        short: 'Definiamo deliverable, milestone e punti decisionali.',
        clientView: 'Una proposta con timeline, investimento e prossimi passi pratici.',
        duration: '3-5 giorni'
      }
    }
  },
  {
    id: 'design',
    icon: Sparkles,
    color: 'var(--brand-purple)',
    locales: {
      en: {
        title: 'Design and content',
        description: 'We shape structure, flows, visual direction, and the core page messaging.',
        short: 'We shape structure, flows, and the core page messaging.',
        clientView: 'Layouts and key screens to review, with focused rounds of feedback.',
        duration: '1-3 weeks'
      },
      it: {
        title: 'Design e contenuti',
        description: 'Costruiamo struttura, flussi, direzione visiva e messaggi principali delle pagine.',
        short: 'Costruiamo struttura, flussi e i messaggi principali delle pagine.',
        clientView: 'Layout e schermate chiave da revisionare, con feedback mirato.',
        duration: '1-3 settimane'
      }
    }
  },
  {
    id: 'build',
    icon: Code2,
    color: 'var(--brand-pink)',
    locales: {
      en: {
        title: 'Build and implementation',
        description: 'We implement the approved direction with performance and accessibility in mind.',
        short: 'We implement the approved direction with performance in mind.',
        clientView: 'A staging preview you can test across desktop and mobile.',
        duration: '1-2 weeks'
      },
      it: {
        title: 'Sviluppo e implementazione',
        description: 'Implementiamo la direzione approvata con attenzione a performance e accessibilità.',
        short: 'Implementiamo la direzione approvata con attenzione alle performance.',
        clientView: 'Una preview staging da testare su desktop e mobile.',
        duration: '1-2 settimane'
      }
    }
  },
  {
    id: 'launch',
    icon: Rocket,
    color: 'var(--brand-gold)',
    locales: {
      en: {
        title: 'Launch and refinement',
        description: 'We launch, check the essentials, and refine details based on real use.',
        short: 'We launch, check the essentials, and refine based on real use.',
        clientView: 'A stable release, essential documentation, and a path for future iterations.',
        duration: 'First 1-2 weeks after launch'
      },
      it: {
        title: 'Lancio e miglioramento',
        description: 'Lanciamo, controlliamo gli elementi essenziali e rifiniamo i dettagli in base all’uso reale.',
        short: 'Lanciamo, controlliamo gli essenziali e rifiniamo in base all’uso reale.',
        clientView: 'Una release stabile, documentazione essenziale e una strada per iterazioni future.',
        duration: 'Prime 1-2 settimane dopo il lancio'
      }
    }
  }
] satisfies { id: string; icon: LucideIcon; color: string; locales: Record<Locale, LocalizedStage> }[]

export function getProcessStages(locale: Locale): ProcessStage[] {
  return stages.map(stage => ({
    id: stage.id,
    icon: stage.icon,
    color: stage.color,
    ...stage.locales[locale]
  }))
}
