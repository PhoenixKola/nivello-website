import type { Proposal, ProposalUnit } from '@/lib/admin/types'

/** Editable proposal state: money as decimal strings, exactly what the user typed. */
export type DraftItem = { key: string; id?: string; sectionKey: string; description: string; details: string; quantity: string; unit: ProposalUnit; unitPrice: string; optional: boolean }
export type DraftSection = { key: string; id?: string; title: string; note: string }
export type DraftMilestone = { key: string; label: string; due: string; percent: string }

export type Draft = {
  title: string
  language: 'en' | 'it'
  currency: Proposal['currency']
  leadId: string | null
  projectId: string | null
  inboxId: string | null
  clientCode: string
  clientName: string
  clientCompany: string
  clientEmail: string
  clientSector: string
  clientAddress: string
  clientPhone: string
  issueDate: string
  validUntil: string
  intro: string
  scope: string
  assumptions: string
  terms: string
  notes: string
  sections: DraftSection[]
  items: DraftItem[]
  discountType: 'none' | 'percent' | 'amount'
  discountValue: string
  taxLabel: string
  taxRate: string
  milestones: DraftMilestone[]
  acceptancePlace: string
  acceptanceDate: string
}

let keySeq = 0
export const newKey = () => `k${++keySeq}`
const decimal = (value: string) => {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
const amount = (cents: number) => String(cents / 100)

export function toDraft(p: Proposal): Draft {
  const sections = p.sections.length ? p.sections : [{ id: undefined, title: p.language === 'it' ? 'Servizi' : 'Services', note: '', items: p.items }]
  const draftSections = sections.map(section => ({ key: newKey(), id: section.id, title: section.title, note: section.note }))
  return {
    title: p.title,
    language: p.language,
    currency: p.currency,
    leadId: p.leadId,
    projectId: p.projectId,
    inboxId: p.inboxId,
    clientCode: p.clientCode,
    clientName: p.clientName,
    clientCompany: p.clientCompany,
    clientEmail: p.clientEmail,
    clientSector: p.clientSector,
    clientAddress: p.clientAddress,
    clientPhone: p.clientPhone,
    issueDate: p.issueDate,
    validUntil: p.validUntil ?? '',
    intro: p.intro,
    scope: p.scope,
    assumptions: p.assumptions,
    terms: p.terms,
    notes: p.notes,
    sections: draftSections,
    items: sections.flatMap((section, sectionIndex) => section.items.map(i => ({ key: newKey(), id: i.id, sectionKey: draftSections[sectionIndex].key, description: i.title || i.description, details: i.description || i.details, quantity: String(i.quantity), unit: i.unit, unitPrice: amount(i.unitPrice), optional: i.optional }))),
    discountType: p.discount.type,
    discountValue: p.discount.type === 'none' ? '' : String(p.discount.value),
    taxLabel: p.tax.label,
    taxRate: p.tax.rate ? String(p.tax.rate) : '',
    milestones: p.milestones.map(m => ({ key: newKey(), label: m.label, due: m.due, percent: String(m.percent) })),
    acceptancePlace: p.acceptance.place,
    acceptanceDate: p.acceptance.date ?? ''
  }
}

export function fromDraft(d: Draft) {
  return {
    title: d.title,
    language: d.language,
    currency: d.currency,
    leadId: d.leadId,
    projectId: d.projectId,
    inboxId: d.inboxId,
    clientCode: d.clientCode,
    clientName: d.clientName,
    clientCompany: d.clientCompany,
    clientEmail: d.clientEmail,
    clientSector: d.clientSector,
    clientAddress: d.clientAddress,
    clientPhone: d.clientPhone,
    issueDate: d.issueDate,
    validUntil: d.validUntil || null,
    intro: d.intro,
    scope: d.scope,
    assumptions: d.assumptions,
    terms: d.terms,
    notes: d.notes,
    sections: d.sections.map(section => ({
      id: section.id,
      title: section.title,
      note: section.note,
      items: d.items.filter(item => item.sectionKey === section.key).map(i => ({ id: i.id, title: i.description, description: i.details, quantity: decimal(i.quantity), unit: i.unit, unitPrice: decimal(i.unitPrice), optional: i.optional }))
    })),
    discount: { type: d.discountType, value: d.discountType === 'none' ? 0 : decimal(d.discountValue) },
    tax: { label: d.taxLabel, rate: decimal(d.taxRate) },
    milestones: d.milestones.map(m => ({ label: m.label, due: m.due, percent: decimal(m.percent) })),
    acceptance: { place: d.acceptancePlace, date: d.acceptanceDate || null }
  }
}

/** PHP-compatible rounding (half away from zero) so the preview matches the saved totals. */
const round = (n: number) => Math.sign(n) * Math.round(Math.abs(n))

/** Mirrors proposal_compute() in _ops.php for a live preview. The server stays authoritative. */
export function computeDraft(d: Draft): Proposal['totals'] & { items: number[]; milestones: number[]; percentSum: number } {
  const items = d.items.map(i => round(Math.round(decimal(i.quantity) * 100) / 100 * round(decimal(i.unitPrice) * 100)))
  let subtotal = 0
  let optional = 0
  d.items.forEach((item, n) => {
    if (item.optional) optional += items[n]
    else subtotal += items[n]
  })
  const discount = d.discountType === 'percent' ? round((subtotal * Math.min(100, Math.max(0, decimal(d.discountValue)))) / 100) : d.discountType === 'amount' ? Math.min(subtotal, round(decimal(d.discountValue) * 100)) : 0
  const taxable = subtotal - discount
  const tax = round((taxable * decimal(d.taxRate)) / 100)
  const total = taxable + tax
  let allocated = 0
  const percents = d.milestones.map(m => decimal(m.percent))
  const milestones = percents.map((percent, n) => {
    const value = n === percents.length - 1 ? total - allocated : round((total * percent) / 100)
    allocated += value
    return value
  })
  return { subtotal, discount, tax, total, optional, items, milestones, percentSum: Math.round(percents.reduce((a, b) => a + b, 0) * 100) / 100 }
}

export const DOC_COPY = {
  en: {
    proposal: 'Proposal',
    preparedFor: 'Prepared for',
    issueDate: 'Date',
    validUntil: 'Valid until',
    reference: 'Reference',
    introduction: 'Introduction',
    scope: 'Scope of work',
    investment: 'Investment',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Price',
    total: 'Total',
    optionalItems: 'Optional extras (not included in the total)',
    subtotal: 'Subtotal',
    discount: 'Discount',
    grandTotal: 'Total',
    payments: 'Payment schedule',
    assumptions: 'Assumptions',
    terms: 'Terms',
    page: 'Page',
    of: 'of',
    units: { fixed: 'fixed', hour: 'hour', day: 'day', month: 'month', item: 'item', page: 'page' } as Record<ProposalUnit, string>
  },
  it: {
    proposal: 'Preventivo',
    preparedFor: 'Preparata per',
    issueDate: 'Data',
    validUntil: 'Valida fino al',
    reference: 'Riferimento',
    introduction: 'Introduzione',
    scope: 'Ambito del lavoro',
    investment: 'Investimento',
    description: 'Descrizione',
    qty: 'Q.tà',
    unitPrice: 'Prezzo',
    total: 'Totale',
    optionalItems: 'Extra opzionali (non inclusi nel totale)',
    subtotal: 'Subtotale',
    discount: 'Sconto',
    grandTotal: 'Totale',
    payments: 'Piano dei pagamenti',
    assumptions: 'Premesse',
    terms: 'Condizioni',
    page: 'Pagina',
    of: 'di',
    units: { fixed: 'forfait', hour: 'ora', day: 'giorno', month: 'mese', item: 'pezzo', page: 'pagina' } as Record<ProposalUnit, string>
  }
}

export function docLocale(language: 'en' | 'it') {
  return language === 'it' ? 'it-IT' : 'en-GB'
}

export function formatQuantity(q: number, language: 'en' | 'it') {
  return new Intl.NumberFormat(docLocale(language), { maximumFractionDigits: 2 }).format(q)
}

export function proposalUnitLabel(unit: ProposalUnit, quantity: number, language: 'en' | 'it') {
  if (quantity === 1) return DOC_COPY[language].units[unit]

  const plurals: Record<'en' | 'it', Record<ProposalUnit, string>> = {
    en: { fixed: 'fixed', hour: 'hours', day: 'days', month: 'months', item: 'items', page: 'pages' },
    it: { fixed: 'forfait', hour: 'ore', day: 'giorni', month: 'mesi', item: 'pezzi', page: 'pagine' }
  }

  return plurals[language][unit]
}
