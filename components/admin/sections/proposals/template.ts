import type { Proposal } from '@/lib/admin/types'
import { formatQuantity, proposalUnitLabel } from './model'

/*
 * Shared by the DOCX and PDF builders. The authoritative design is the Nivello Word template
 * (Template_Preventivo_Nivello_Clienti.docx, served privately as public/admin-api/_preventivo-template.docx).
 * Both outputs reproduce it; only the dynamic values below change.
 */

let templateCache: Promise<ArrayBuffer> | null = null

/** The original template bytes, fetched once per page load (admin session required). */
export function templateBytes(): Promise<ArrayBuffer> {
  templateCache ??= fetch('/admin-api/proposal-file.php?action=template', { credentials: 'same-origin', cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('The Preventivo template could not be loaded.')
      return response.arrayBuffer()
    })
    .catch(error => {
      templateCache = null
      throw error
    })
  return templateCache
}

/** Template wording; Italian is the template's own text, English replaces it word for word. */
export const TEMPLATE_LABELS = {
  it: {
    caps: 'PREVENTIVO',
    word: 'Preventivo',
    number: 'Numero',
    date: 'Data',
    validUntil: 'Valido fino al',
    supplier: 'FORNITORE',
    client: 'CLIENTE',
    section: 'SEZIONE',
    subtotal: 'Subtotale',
    sectionSubtotal: 'Subtotale Sezione',
    item: 'Voce / descrizione',
    quantity: 'Quantità',
    price: 'Prezzo',
    total: 'Totale',
    summary: 'RIEPILOGO',
    grandTotal: 'TOTALE',
    discount: 'Sconto',
    optional: 'opzionale',
    payments: 'PIANO DEI PAGAMENTI',
    introduction: 'INTRODUZIONE',
    scope: 'AMBITO DEL LAVORO',
    assumptions: 'PREMESSE',
    terms: 'CONDIZIONI',
    acceptance: 'ACCETTAZIONE DEL PREVENTIVO',
    placeDate: 'Luogo e data',
    signature: 'Firma del cliente',
    page: 'Pagina',
    of: 'di'
  },
  en: {
    caps: 'PROPOSAL',
    word: 'Proposal',
    number: 'Number',
    date: 'Date',
    validUntil: 'Valid until',
    supplier: 'SUPPLIER',
    client: 'CLIENT',
    section: 'SECTION',
    subtotal: 'Subtotal',
    sectionSubtotal: 'Subtotal Section',
    item: 'Item / description',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    summary: 'SUMMARY',
    grandTotal: 'TOTAL',
    discount: 'Discount',
    optional: 'optional',
    payments: 'PAYMENT PLAN',
    introduction: 'INTRODUCTION',
    scope: 'SCOPE OF WORK',
    assumptions: 'ASSUMPTIONS',
    terms: 'TERMS',
    acceptance: 'PROPOSAL ACCEPTANCE',
    placeDate: 'Place and date',
    signature: 'Client signature',
    page: 'Page',
    of: 'of'
  }
}

export type TemplateLabels = (typeof TEMPLATE_LABELS)['it']

const SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF' }

/** Money as the template writes it: symbol first ("€ 1.250,00"). */
export function tMoney(cents: number, currency: string, language: 'en' | 'it') {
  const amount = new Intl.NumberFormat(language === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' } as Intl.NumberFormatOptions).format(Math.abs(cents) / 100)
  return `${cents < 0 ? '- ' : ''}${SYMBOLS[currency] ?? currency} ${amount}`
}

/** Dates as the template writes them: GG/MM/AAAA. */
export function tDate(date: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export const sectionLetter = (index: number) => String.fromCharCode(65 + index)

/** Section header colour, alternating exactly like Sezione A (green) and Sezione B (dark) in the template. */
export const sectionFill = (index: number) => (index % 2 === 0 ? '0B5A46' : '0F172A')

export function itemCode(item: Proposal['sections'][number]['items'][number], letter: string, index: number) {
  return item.code || `${letter}${index + 1}`
}

export function itemTitle(p: Proposal, item: Proposal['sections'][number]['items'][number], letter: string, index: number) {
  const labels = TEMPLATE_LABELS[p.language]
  return `${itemCode(item, letter, index)}) ${item.title}${item.optional ? ` (${labels.optional})` : ''}`
}

export function itemQuantity(p: Proposal, item: Proposal['sections'][number]['items'][number]) {
  return item.unit === 'fixed' ? '1' : `${formatQuantity(item.quantity, p.language)} ${proposalUnitLabel(item.unit, item.quantity, p.language)}`
}

/** The client block lines under the name: sector, address, then contact details. */
export function clientDetails(p: Proposal) {
  const name = p.clientCompany || p.clientName || '—'
  const contact = [p.clientCompany && p.clientName ? p.clientName : '', p.clientPhone, p.clientEmail].filter(Boolean).join(' · ')
  return { name, sector: p.clientSector, address: p.clientAddress, contact }
}

/** Extra rows shown in the summary between the sections and the total. */
export function summaryAdjustments(p: Proposal) {
  const labels = TEMPLATE_LABELS[p.language]
  const rows: { label: string; value: number }[] = []
  if (p.totals.discount > 0) rows.push({ label: `${labels.discount}${p.discount.type === 'percent' ? ` (${formatQuantity(p.discount.value, p.language)}%)` : ''}`, value: -p.totals.discount })
  if (p.totals.tax > 0) rows.push({ label: `${p.tax.label} (${formatQuantity(p.tax.rate, p.language)}%)`, value: p.totals.tax })
  return rows
}

export function milestoneLabel(p: Proposal, milestone: Proposal['milestones'][number]) {
  return `${milestone.label}${milestone.due ? ` — ${milestone.due}` : ''} (${formatQuantity(milestone.percent, p.language)}%)`
}

export function acceptanceLabel(p: Proposal) {
  const labels = TEMPLATE_LABELS[p.language]
  const value = [p.acceptance.place, p.acceptance.date ? tDate(p.acceptance.date) : ''].filter(Boolean).join(', ')
  return value ? `${labels.placeDate}: ${value}` : labels.placeDate
}

/** Text blocks the template has no slot for, rendered with its heading/body styles. */
export function textBlocks(p: Proposal) {
  const labels = TEMPLATE_LABELS[p.language]
  return {
    before: [{ title: labels.introduction, text: p.intro }, { title: labels.scope, text: p.scope }].filter(block => block.text.trim()),
    after: [{ title: labels.assumptions, text: p.assumptions }, { title: labels.terms, text: p.terms }].filter(block => block.text.trim())
  }
}

/** The client logo as PNG with its pixel size, or null when there is none or it cannot be decoded. */
export async function clientLogoPng(p: Proposal): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  if (!p.clientLogo) return null
  try {
    const response = await fetch(`/admin-api/proposal-file.php?action=logo&id=${p.id}`, { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) return null
    const bitmap = await createImageBitmap(await response.blob())
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    bitmap.close()
    const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    return png ? { data: new Uint8Array(await png.arrayBuffer()), width: canvas.width, height: canvas.height } : null
  } catch {
    return null
  }
}

/** Fits an image into a box, keeping its aspect ratio. */
export function fit(width: number, height: number, maxWidth: number, maxHeight: number) {
  const scale = Math.min(maxWidth / width, maxHeight / height)
  return { width: width * scale, height: height * scale }
}
