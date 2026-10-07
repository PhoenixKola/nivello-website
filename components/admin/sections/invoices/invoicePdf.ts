import type { jsPDF as JsPDF } from 'jspdf'
import type { Invoice } from '@/lib/admin/types'
import { TEMPLATE_COLORS, templateLogo, tDate, tMoney } from '../proposals/template'

/*
 * Courtesy copy of a Fattura. It is a human-readable rendering only: in Italy the fiscal invoice is
 * the FatturaPA XML delivered through SdI, and every page says so. Invoice-specific layout using the
 * Nivello palette and logo from the Preventivo template.
 */

const LEFT = 15
const RIGHT = 195
const { ink: INK, text: TEXT, muted: MUTED, faint: FAINT, blue: BLUE, border: BORDER } = TEMPLATE_COLORS
const PAYMENT_MODES: Record<string, string> = { MP01: 'Contanti', MP02: 'Assegno', MP05: 'Bonifico', MP08: 'Carta di pagamento', MP12: 'RIBA', MP19: 'SEPA Direct Debit' }

type Rgb = [number, number, number]
const rgb = (hex: string): Rgb => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
const safe = (value: string) => value.replace(/−/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[  ]/g, ' ')
const qty = (value: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value)

export async function buildInvoicePdf(inv: Invoice) {
  const { jsPDF } = await import('jspdf')
  const doc: JsPDF = new jsPDF({ unit: 'mm', format: 'a4' })
  const logo = await templateLogo()
  const money = (cents: number) => safe(tMoney(cents, inv.currency, 'it'))
  const supplier = inv.supplier
  let y = 15

  const text = (value: string, x: number, baseline: number, size: number, color: string, options: { bold?: boolean; align?: 'left' | 'right' | 'center' } = {}) => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...rgb(color))
    doc.text(safe(value), x, baseline, { align: options.align ?? 'left' })
  }
  const wrap = (value: string, size: number, width: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size)
    return doc.splitTextToSize(safe(value), width) as string[]
  }
  const rule = (top: number, color: string = BORDER, width = 0.25) => {
    doc.setDrawColor(...rgb(color)).setLineWidth(width)
    doc.line(LEFT, top, RIGHT, top)
  }
  const ensure = (height: number) => {
    if (y + height > 272) {
      doc.addPage()
      y = 20
    }
  }

  // Header
  if (logo) doc.addImage(logo, 'PNG', LEFT, y, 46, 13.1, undefined, 'FAST')
  text('FATTURA', RIGHT, y + 6, 20, INK, { bold: true, align: 'right' })
  text(inv.number ? `N. ${inv.number}` : 'BOZZA — numero non ancora assegnato', RIGHT, y + 12, 9, inv.number ? INK : 'B45309', { bold: true, align: 'right' })
  text(`Data ${tDate(inv.issueDate)}${inv.dueDate ? `  ·  Scadenza ${tDate(inv.dueDate)}` : ''}`, RIGHT, y + 17, 8, MUTED, { align: 'right' })
  y += 26
  rule(y)
  y += 6

  // Parties
  const party = (x: number, title: string, lines: string[]) => {
    text(title, x, y, 7, BLUE, { bold: true })
    let line = y + 5
    lines.filter(Boolean).forEach((value, index) => {
      for (const chunk of wrap(value, index === 0 ? 10 : 8, 80, index === 0)) {
        text(chunk, x, line, index === 0 ? 10 : 8, index === 0 ? INK : MUTED, { bold: index === 0 })
        line += index === 0 ? 4.6 : 3.8
      }
    })
    return line
  }
  const address = (p: { address: string; streetNumber: string; postalCode: string; city: string; province: string; country: string }) =>
    [[p.address, p.streetNumber].filter(Boolean).join(' '), [p.postalCode, p.city, p.province && `(${p.province})`].filter(Boolean).join(' '), p.country !== 'IT' ? p.country : ''].filter(Boolean).join(', ')
  const supplierEnd = party(LEFT, 'FORNITORE', supplier
    ? [supplier.name, address(supplier), supplier.vatNumber && `P.IVA ${supplier.vatNumber}`, supplier.taxCode && supplier.taxCode !== supplier.vatNumber ? `C.F. ${supplier.taxCode}` : '', [supplier.email, supplier.pec && `PEC ${supplier.pec}`].filter(Boolean).join(' · ')]
    : ['Dati fornitore assegnati alla finalizzazione'])
  const c = inv.client
  const clientEnd = party(110, 'CLIENTE', [c.name, address(c), c.vatNumber && `P.IVA ${c.vatNumber}`, c.taxCode && c.taxCode !== c.vatNumber ? `C.F. ${c.taxCode}` : '', c.recipientCode ? `Codice destinatario ${c.recipientCode}` : c.pec ? `PEC ${c.pec}` : ''])
  y = Math.max(supplierEnd, clientEnd) + 4

  // Lines
  const cols = { desc: LEFT + 2, qty: 120, price: 143, disc: 156, vat: 168, total: RIGHT - 2 }
  const header = () => {
    doc.setFillColor(...rgb('E9EEF5'))
    doc.rect(LEFT, y, RIGHT - LEFT, 7, 'F')
    text('Descrizione', cols.desc, y + 4.7, 7.6, TEXT, { bold: true })
    text('Q.tà', cols.qty, y + 4.7, 7.6, TEXT, { bold: true, align: 'right' })
    text('Prezzo', cols.price, y + 4.7, 7.6, TEXT, { bold: true, align: 'right' })
    text('Sc.%', cols.disc, y + 4.7, 7.6, TEXT, { bold: true, align: 'right' })
    text('IVA', cols.vat, y + 4.7, 7.6, TEXT, { bold: true, align: 'right' })
    text('Importo', cols.total, y + 4.7, 7.6, TEXT, { bold: true, align: 'right' })
    y += 7
  }
  header()
  inv.lines.forEach(line => {
    const desc = wrap(line.description, 8.2, 92)
    const height = Math.max(7, 3 + desc.length * 3.6)
    if (y + height > 272) {
      doc.addPage()
      y = 20
      header()
    }
    desc.forEach((chunk, i) => text(chunk, cols.desc, y + 4.6 + i * 3.6, 8.2, INK))
    text(`${qty(line.quantity)}${line.unit ? ` ${line.unit}` : ''}`, cols.qty, y + 4.6, 8, TEXT, { align: 'right' })
    text(money(line.unitPrice), cols.price, y + 4.6, 8, TEXT, { align: 'right' })
    text(line.discountPercent ? qty(line.discountPercent) : '—', cols.disc, y + 4.6, 8, TEXT, { align: 'right' })
    text(line.vatRate > 0 ? `${qty(line.vatRate)}%` : line.vatNature, cols.vat, y + 4.6, 8, TEXT, { align: 'right' })
    text(money(line.total), cols.total, y + 4.6, 8, INK, { bold: true, align: 'right' })
    y += height
    rule(y, 'E7ECF2')
  })
  y += 5

  // VAT summary and totals
  ensure(24 + inv.vatSummary.length * 5)
  const summaryTop = y
  text('RIEPILOGO IVA', LEFT, y, 7, BLUE, { bold: true })
  y += 4.5
  inv.vatSummary.forEach(group => {
    const label = group.vatNature ? `${group.vatNature} — ${group.vatReference}` : `Aliquota ${qty(group.vatRate)}%`
    wrap(label, 7.6, 78).forEach((chunk, i) => text(chunk, LEFT, y + i * 3.4, 7.6, MUTED))
    text(`Imponibile ${money(group.taxable)}  ·  IVA ${money(group.vat)}`, 108, y, 7.6, TEXT, { align: 'right' })
    y += Math.max(4.2, wrap(label, 7.6, 78).length * 3.4 + 0.8)
  })
  let t = summaryTop
  const total = (label: string, value: number, strong = false) => {
    text(label, 150, t, strong ? 9.5 : 8, strong ? INK : MUTED, { bold: strong, align: 'right' })
    text(money(value), RIGHT, t, strong ? 10.5 : 8.5, INK, { bold: strong, align: 'right' })
    t += strong ? 7 : 5
  }
  total('Imponibile', inv.totals.taxable)
  total('IVA', inv.totals.vat)
  if (inv.totals.stampDuty) total('Imposta di bollo (virtuale)', inv.totals.stampDuty)
  doc.setDrawColor(...rgb(BLUE)).setLineWidth(0.4)
  doc.line(120, t - 3, RIGHT, t - 3)
  t += 1.5
  total('TOTALE DOCUMENTO', inv.totals.total, true)
  y = Math.max(y, t) + 4

  // Payment and notes
  ensure(22)
  rule(y)
  y += 5
  text('PAGAMENTO', LEFT, y, 7, BLUE, { bold: true })
  y += 4.5
  const payment = [PAYMENT_MODES[inv.paymentMode] ?? inv.paymentMode, inv.dueDate ? `entro il ${tDate(inv.dueDate)}` : '', inv.paymentTerms].filter(Boolean).join(' · ')
  wrap(payment, 8, RIGHT - LEFT).forEach(chunk => {
    text(chunk, LEFT, y, 8, TEXT)
    y += 3.8
  })
  if (supplier?.showBankDetails && supplier.iban) {
    text(`IBAN ${supplier.iban}${supplier.bankName ? ` · ${supplier.bankName}` : ''}`, LEFT, y, 8, INK, { bold: true })
    y += 4.5
  }
  if (inv.notes) {
    y += 2
    text('NOTE', LEFT, y, 7, BLUE, { bold: true })
    y += 4.5
    wrap(inv.notes, 8, RIGHT - LEFT).forEach(chunk => {
      ensure(4)
      text(chunk, LEFT, y, 8, MUTED)
      y += 3.8
    })
  }

  // Footer on every page: this PDF is never the fiscal document.
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    rule(281)
    text('Copia di cortesia. Il documento fiscalmente valido è il file XML FatturaPA trasmesso tramite il Sistema di Interscambio (SdI).', 105, 285, 6.6, FAINT, { align: 'center' })
    text(supplier ? `${supplier.name}${supplier.vatNumber ? ` · P.IVA ${supplier.vatNumber}` : ''}` : 'Nivello', LEFT, 290, 7, INK, { bold: true })
    text(`Pagina ${page} di ${pages}`, RIGHT, 290, 7, MUTED, { align: 'right' })
  }

  doc.setProperties({ title: `Fattura ${inv.number ?? 'bozza'}`, author: supplier?.name ?? 'Nivello', creator: 'Nivello Admin' })
  return doc
}

export async function downloadInvoicePdf(inv: Invoice) {
  const doc = await buildInvoicePdf(inv)
  doc.save(`Fattura-${(inv.number ?? 'bozza').replace('/', '-')}${inv.status === 'draft' ? '-BOZZA' : ''}-cortesia.pdf`)
}
