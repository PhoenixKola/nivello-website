import type { Proposal } from '@/lib/admin/types'
import { DOC_COPY, NIVELLO, docDate, docMoney, formatQuantity, proposalUnitLabel } from './model'

const BLUE: [number, number, number] = [11, 111, 192]
const INK: [number, number, number] = [15, 23, 42]
const MUTED: [number, number, number] = [100, 116, 139]
const LINE: [number, number, number] = [226, 232, 240]

async function logoDataUrl(url = '/nivello-icon.png'): Promise<string | null> {
  try {
    const response = await fetch(url, { credentials: 'same-origin' })
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** jsPDF's built-in fonts are WinAnsi; map the few characters they lack so text never turns into garbage. */
function safe(text: string) {
  return text.replace(/−/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/ | /g, ' ')
}

/** Builds the proposal PDF in the browser (admin only; loaded on demand). */
export async function buildProposalPdf(p: Proposal) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const t = DOC_COPY[p.language]
  const money = (cents: number) => safe(docMoney(cents, p.currency, p.language))
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const width = pageW - margin * 2
  let y = margin

  const ensure = (needed: number) => {
    if (y + needed > pageH - 22) {
      doc.addPage()
      y = margin
    }
  }
  const heading = (text: string) => {
    ensure(14)
    doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...BLUE)
    doc.text(safe(text.toUpperCase()), margin, y, { charSpace: 0.6 })
    y += 5
  }
  const paragraph = (text: string) => {
    doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(51, 65, 85)
    for (const line of doc.splitTextToSize(safe(text), width) as string[]) {
      ensure(5.2)
      doc.text(line, margin, y)
      y += 5.2
    }
  }
  const block = (title: string, text: string) => {
    if (!text.trim()) return
    y += 6
    heading(title)
    paragraph(text)
  }

  // Header
  const logo = await logoDataUrl()
  if (logo) doc.addImage(logo, 'PNG', margin, y - 2, 11, 11)
  doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(...INK)
  doc.text(NIVELLO.name, margin + (logo ? 14 : 0), y + 6)
  doc.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...MUTED)
  doc.text(`${NIVELLO.web} · ${NIVELLO.email}`, margin + (logo ? 14 : 0), y + 10.5)
  doc.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...BLUE)
  doc.text(t.proposal.toUpperCase(), pageW - margin, y + 3, { align: 'right', charSpace: 0.6 })
  doc.setFont('courier', 'normal').setFontSize(10).setTextColor(...INK)
  doc.text(p.number, pageW - margin, y + 8.5, { align: 'right' })
  y += 16
  doc.setDrawColor(...LINE).setLineWidth(0.3).line(margin, y, pageW - margin, y)
  y += 11

  // Title
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(...INK)
  for (const line of doc.splitTextToSize(safe(p.title), width) as string[]) {
    doc.text(line, margin, y)
    y += 8.5
  }
  y += 2

  // Meta
  const col = width / 3
  const meta: [string, string[]][] = [
    [t.preparedFor, [p.clientCompany || p.clientName || '-', p.clientCompany && p.clientName ? p.clientName : '', p.clientSector, p.clientAddress, p.clientPhone, p.clientEmail].filter(Boolean)],
    [t.issueDate, [docDate(p.issueDate, p.language)]],
    [t.validUntil, [docDate(p.validUntil, p.language)]]
  ]
  const clientLogo = p.clientLogo ? await logoDataUrl(`/admin-api/proposal-file.php?action=logo&id=${p.id}`) : null
  let metaBottom = y
  meta.forEach(([label, lines], i) => {
    const x = margin + col * i
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED)
    doc.text(safe(label.toUpperCase()), x, y, { charSpace: 0.3 })
    let ly = y + 5
    if (i === 0 && clientLogo) {
      const format = clientLogo.startsWith('data:image/png') ? 'PNG' : clientLogo.startsWith('data:image/webp') ? 'WEBP' : 'JPEG'
      try {
        doc.addImage(clientLogo, format, x, ly - 1, 32, 12, undefined, 'FAST')
        ly += 15
      } catch { /* Keep the preventivo usable if a browser cannot decode the uploaded image. */ }
    }
    lines.forEach((line, n) => {
      doc.setFont('helvetica', n === 0 ? 'bold' : 'normal').setFontSize(9.5).setTextColor(...INK)
      for (const wrapped of doc.splitTextToSize(safe(line), col - 4) as string[]) {
        doc.text(wrapped, x, ly)
        ly += 4.6
      }
    })
    metaBottom = Math.max(metaBottom, ly)
  })
  y = metaBottom

  block(t.introduction, p.intro)
  block(t.scope, p.scope)

  // Line items
  const rows = (items: Proposal['items']) =>
    items.map(item => [
      { content: safe(`${item.code ? `${item.code}) ` : ''}${item.title}${item.optional ? ` (${p.language === 'it' ? 'opzionale' : 'optional'})` : ''}${item.description ? `\n${item.description}` : ''}`) },
      item.unit === 'fixed' ? '1' : safe(`${formatQuantity(item.quantity, p.language)} ${proposalUnitLabel(item.unit, item.quantity, p.language)}`),
      item.unit === 'fixed' ? '-' : money(item.unitPrice),
      money(item.total)
    ])
  const tableOptions = {
    margin: { left: margin, right: margin, bottom: 22 },
    theme: 'plain' as const,
    styles: { font: 'helvetica', fontSize: 9.5, textColor: INK, cellPadding: { top: 2.4, bottom: 2.4, left: 0, right: 3 }, overflow: 'linebreak' as const },
    headStyles: { fontStyle: 'bold' as const, fontSize: 7.5, textColor: MUTED },
    columnStyles: { 0: { cellWidth: 'auto' as const }, 1: { halign: 'right' as const, cellWidth: 26 }, 2: { halign: 'right' as const, cellWidth: 30 }, 3: { halign: 'right' as const, cellWidth: 30, fontStyle: 'bold' as const, cellPadding: { top: 2.4, bottom: 2.4, left: 0, right: 0 } } },
    didParseCell: (data: { section: string; column: { index: number }; cell: { styles: { halign?: string } } }) => {
      if (data.section === 'head' && data.column.index > 0) data.cell.styles.halign = 'right'
    },
    didDrawCell: (data:{ section: string; row: { index: number }; cell: { x: number; y: number; width: number; height: number } }) => {
      if (data.section === 'body' || data.section === 'head') {
        doc.setDrawColor(...(data.section === 'head' ? INK : LINE)).setLineWidth(data.section === 'head' ? 0.5 : 0.2)
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height)
      }
    }
  }
  const head = [[t.description.toUpperCase(), t.qty.toUpperCase(), t.unitPrice.toUpperCase(), t.total.toUpperCase()]]
  y += 6
  heading(t.investment)
  for (let index = 0; index < p.sections.length; index++) {
    const section = p.sections[index]
    const firstItem = section.items[0]
    const firstItemText = firstItem ? `${firstItem.code ? `${firstItem.code}) ` : ''}${firstItem.title}${firstItem.description ? `\n${firstItem.description}` : ''}` : ''
    const firstItemLines = firstItemText ? (doc.splitTextToSize(safe(firstItemText), width - 88) as string[]).length : 1
    const noteLines = section.note ? (doc.splitTextToSize(safe(section.note), width) as string[]).length : 0
    ensure(18 + firstItemLines * 4.5 + noteLines * 4)
    doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...INK)
    doc.text(safe(`${p.language === 'it' ? 'Sezione' : 'Section'} ${String.fromCharCode(65 + index)} — ${section.title}`), margin, y)
    y += 4
    if (section.note) { doc.setFont('helvetica', 'italic').setFontSize(8.5).setTextColor(...MUTED); doc.text(doc.splitTextToSize(safe(section.note), width), margin, y); y += 6 }
    autoTable(doc, { ...tableOptions, startY: y, head, body: rows(section.items) })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3
    doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...INK)
    doc.text(`${p.language === 'it' ? 'Subtotale sezione' : 'Section subtotal'} ${String.fromCharCode(65 + index)}: ${money(section.subtotal)}`, pageW - margin, y, { align: 'right' })
    y += 7
  }

  // Totals
  const totals: [string, string, boolean][] = [[t.subtotal, money(p.totals.subtotal), false]]
  if (p.totals.discount > 0) totals.push([`${t.discount}${p.discount.type === 'percent' ? ` (${formatQuantity(p.discount.value, p.language)}%)` : ''}`, `-${money(p.totals.discount)}`, false])
  if (p.tax.rate > 0) totals.push([`${p.tax.label} (${formatQuantity(p.tax.rate, p.language)}%)`, money(p.totals.tax), false])
  totals.push([t.grandTotal, money(p.totals.total), true])
  ensure(totals.length * 6 + 6)
  const labelX = pageW - margin - 75
  for (const [label, value, strong] of totals) {
    if (strong) {
      doc.setDrawColor(...INK).setLineWidth(0.5).line(labelX, y - 1, pageW - margin, y - 1)
      y += 4
    }
    doc.setFont('helvetica', strong ? 'bold' : 'normal').setFontSize(strong ? 12 : 9.5).setTextColor(...(strong ? INK : ([71, 85, 105] as [number, number, number])))
    doc.text(safe(label), labelX, y)
    doc.text(value, pageW - margin, y, { align: 'right' })
    y += strong ? 7 : 5.5
  }

  if (p.milestones.length) {
    y += 6
    heading(t.payments)
    autoTable(doc, {
      ...tableOptions,
      startY: y,
      body: p.milestones.map(m => [safe(m.label), safe(m.due), `${formatQuantity(m.percent, p.language)}%`, money(m.amount)]),
      columnStyles: { 0: { fontStyle: 'bold' as const }, 1: { textColor: MUTED }, 2: { halign: 'right' as const, cellWidth: 20 }, 3: { halign: 'right' as const, cellWidth: 32, cellPadding: { top: 2.4, bottom: 2.4, left: 0, right: 0 } } }
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  }

  block(t.assumptions, p.assumptions)
  block(t.terms, p.terms)

  ensure(42)
  y += 8
  heading(p.language === 'it' ? 'Accettazione del preventivo' : 'Proposal acceptance')
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...MUTED)
  doc.text(safe(`${p.language === 'it' ? 'Luogo e data' : 'Place and date'}${p.acceptance.place ? `: ${p.acceptance.place}` : ''}${p.acceptance.date ? ` · ${docDate(p.acceptance.date, p.language)}` : ''}`), margin, y)
  doc.text(p.language === 'it' ? 'Firma del cliente' : 'Client signature', margin + width / 2, y)
  y += 18
  doc.setDrawColor(...LINE).line(margin, y, margin + width * 0.42, y).line(margin + width / 2, y, pageW - margin, y)

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...LINE).setLineWidth(0.2).line(margin, pageH - 14, pageW - margin, pageH - 14)
    doc.setFont('helvetica', 'normal').setFontSize(7.5).setTextColor(...MUTED)
    doc.text(`${NIVELLO.name} · ${NIVELLO.web} · ${NIVELLO.email} · ${p.number}`, margin, pageH - 9)
    doc.text(`${t.page} ${i} ${t.of} ${pages}`, pageW - margin, pageH - 9, { align: 'right' })
  }

  doc.setProperties({ title: `${p.number} ${safe(p.title)}`, author: NIVELLO.name, creator: 'Nivello Admin' })
  return doc
}

export async function downloadProposalPdf(p: Proposal) {
  const doc = await buildProposalPdf(p)
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  doc.save(`${p.number}${slug ? `-${slug}` : ''}.pdf`)
}
