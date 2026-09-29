import { getRoutePath, type Locale } from './site'

export const buildOptions = ['website', 'app', 'unsure'] as const
export const stageOptions = ['new', 'redesign', 'improve'] as const

export type BuildOption = (typeof buildOptions)[number]
export type StageOption = (typeof stageOptions)[number]

export type ProjectBrief = {
  build: BuildOption | null
  stage: StageOption | null
}

type OptionCopy = { label: string; hint: string }

export const briefCopy = {
  en: {
    build: {
      website: { label: 'Website', hint: 'Company site, portfolio, booking or service pages' },
      app: { label: 'Web app / software', hint: 'Internal tool, client portal or product' },
      unsure: { label: 'Not sure yet', hint: 'We will work out the right shape together' }
    },
    stage: {
      new: { label: 'New project', hint: 'Starting from zero' },
      redesign: { label: 'Redesign', hint: 'Replacing what exists today' },
      improve: { label: 'Improve an existing product', hint: 'Fix, extend or speed up' }
    }
  },
  it: {
    build: {
      website: { label: 'Sito web', hint: 'Sito aziendale, portfolio, prenotazioni o servizi' },
      app: { label: 'App web / software', hint: 'Gestionale interno, portale clienti o prodotto' },
      unsure: { label: 'Non lo so ancora', hint: 'Troviamo insieme la forma giusta' }
    },
    stage: {
      new: { label: 'Nuovo progetto', hint: 'Si parte da zero' },
      redesign: { label: 'Redesign', hint: 'Sostituire ciò che esiste oggi' },
      improve: { label: 'Migliorare un prodotto esistente', hint: 'Correggere, estendere o velocizzare' }
    }
  }
} satisfies Record<Locale, { build: Record<BuildOption, OptionCopy>; stage: Record<StageOption, OptionCopy> }>

// Index into ContactForm's localized `projectTypes` list.
export const buildToProjectTypeIndex: Record<BuildOption, number> = {
  website: 0,
  app: 1,
  unsure: 4
}

function pick<T extends string>(allowed: readonly T[], value: string | null): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export function parseBrief(search: string): ProjectBrief {
  const params = new URLSearchParams(search)
  return {
    build: pick(buildOptions, params.get('build')),
    stage: pick(stageOptions, params.get('stage'))
  }
}

export function getBriefContactHref(brief: ProjectBrief, locale: Locale) {
  const params = new URLSearchParams()
  if (brief.build) params.set('build', brief.build)
  if (brief.stage) params.set('stage', brief.stage)
  const query = params.toString()
  return `${getRoutePath('contact', locale)}${query ? `?${query}` : ''}`
}

export function describeBrief(brief: ProjectBrief, locale: Locale) {
  const labels = briefCopy[locale]
  return [brief.build && labels.build[brief.build].label, brief.stage && labels.stage[brief.stage].label]
    .filter(Boolean)
    .join(' · ')
}
