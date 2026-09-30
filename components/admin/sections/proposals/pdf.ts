import type { jsPDF as JsPDF } from 'jspdf'
import type { Proposal } from '@/lib/admin/types'
import {
  acceptanceLabel,
  clientDetails,
  clientLogoPng,
  fit,
  itemQuantity,
  itemTitle,
  milestoneLabel,
  sectionFill,
  sectionLetter,
  summaryAdjustments,
  TEMPLATE_COLORS,
  TEMPLATE_COLUMNS_MM,
  TEMPLATE_LABELS,
  TEMPLATE_SUPPLIER,
  templateLogo,
  textBlocks,
  tDate,
  tMoney
} from './template'

/*
 * PDF twin of the Nivello Word template. Positions, sizes and colours are taken from Word's own
 * rendering of Template_Preventivo_Nivello_Clienti.docx (A4, Arial ≈ Helvetica), so the PDF and the
 * DOCX are two representations of the same Preventivo. The Nivello logo is read from the template.
 */

const LEFT = 14.5
const RIGHT = 195.5
const TOP = 11.8
const BOTTOM = 283.5
const COL = TEMPLATE_COLUMNS_MM.reduce((edges, width) => [...edges, Math.round((edges[edges.length - 1] + width) * 10) / 10], [LEFT])
const { ink: INK, text: TEXT, muted: MUTED, faint: FAINT, blue: BLUE, border: BORDER } = TEMPLATE_COLORS

type Rgb = [number, number, number]
const rgb = (hex: string): Rgb => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]

/** jsPDF's built-in fonts are WinAnsi; map the few characters they lack. */
function safe(text: string) {
  return text.replace(/−/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[  ]/g, ' ')
}

export async function buildProposalPdf(p: Proposal) {
  const { jsPDF } = await import('jspdf')
  const labels = TEMPLATE_LABELS[p.language]
  const money = (cents: number) => safe(tMoney(cents, p.currency, p.language))
  const doc: JsPDF = new jsPDF({ unit: 'mm', format: 'a4' })
  const [logo, clientLogo] = await Promise.all([templateLogo(), clientLogoPng(p)])
  const client = clientDetails(p)
  let y = TOP

  const text = (value: string, x: number, baseline: number, size: number, color: string, options: { bold?: boolean; align?: 'left' | 'right' | 'center' } = {}) => {
    doc.setFont('helvetica', options.bold ? 'bold' : 'normal').setFontSize(size).setTextColor(...rgb(color))
    doc.text(safe(value), x, baseline, { align: options.align ?? 'left' })
  }
  const wrap = (value: string, size: number, width: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal').setFontSize(size)
    return doc.splitTextToSize(safe(value), width) as string[]
  }
  const fill = (x: number, top: number, w: number, h: number, color: string) => {
    doc.setFillColor(...rgb(color))
    doc.rect(x, top, w, h, 'F')
  }
  const line = (x1: number, y1: number, x2: number, y2: number, color: string, width: number) => {
    doc.setDrawColor(...rgb(color)).setLineWidth(width)
    doc.line(x1, y1, x2, y2)
  }
  const box = (x: number, top: number, w: number, h: number, color: string, width: number) => {
    doc.setDrawColor(...rgb(color)).setLineWidth(width)
    doc.rect(x, top, w, h, 'S')
  }
  const newPage = () => {
    doc.addPage()
    y = TOP
  }
  const ensure = (height: number) => {
    if (y + height > BOTTOM) newPage()
  }

  // ── Header: Nivello logo and the metadata box ──
  if (logo) doc.addImage(logo, 'PNG', 14.5, 17.1, 52.9, 15.1, undefined, 'FAST')
  fill(122.4, 11.8, 73.3, 25.7, 'FFFFFF')
  box(122.4, 11.8, 73.3, 25.7, 'CBD5E1', 0.3)
  text(labels.caps, 193.1, 16.4, 7.6, 'FFBF43', { bold: true, align: 'right' })
  ;([[labels.number, p.number, 19.6], [labels.date, tDate(p.issueDate), 27.0], [labels.validUntil, tDate(p.validUntil), 34.3]] as const).forEach(([label, value, baseline]) => {
    text(label, 125.0, baseline, 7, FAINT)
    text(value, 191.0, baseline + 0.2, 7.6, INK, { bold: true, align: 'right' })
  })

  // ── Centered title ──
  text(labels.word, 105, 57.5, 26, INK, { bold: true, align: 'center' })
  let baseline = 66.6
  wrap(p.title, 19, 181, true).forEach((titleLine, index) => {
    if (index > 0) baseline += 7.4
    text(titleLine, 105, baseline, 19, INK, { bold: true, align: 'center' })
  })

  // ── Supplier / client ──
  const partiesTop = baseline + 4.8
  const nameLines = wrap(client.name, 10.6, 54, true)
  const clientLines = [client.sector, client.address, client.contact].filter(Boolean).flatMap(value => wrap(value, 8, 54))
  const clientHeight = 4.3 + (nameLines.length - 1) * 4.2 + clientLines.length * 3.4
  const partiesHeight = Math.max(26.9, clientHeight + 12)
  fill(16.3, partiesTop, 88.7, partiesHeight, 'F7F9FC')
  fill(105.05, partiesTop, 88.7, partiesHeight, 'F7F9FC')
  box(16.3, partiesTop, 88.7, partiesHeight, BORDER, 0.3)
  box(105.05, partiesTop, 88.7, partiesHeight, BORDER, 0.3)
  const supplierTop = partiesTop + (partiesHeight - 26.9) / 2
  text(labels.supplier, 19.0, supplierTop + 6.7, 7, BLUE, { bold: true })
  text(TEMPLATE_SUPPLIER.name, 19.0, supplierTop + 11.4, 10.6, INK, { bold: true })
  ;TEMPLATE_SUPPLIER.lines.forEach((value, index) => text(value, 19.0, supplierTop + 15.1 + index * 3.4, 8, MUTED))
  let clientBaseline = partiesTop + (partiesHeight - clientHeight) / 2 + 2.6
  text(labels.client, 139.7, clientBaseline, 7, BLUE, { bold: true })
  clientBaseline += 4.3
  nameLines.forEach((nameLine, index) => text(nameLine, 139.7, clientBaseline + index * 4.2, 10.6, INK, { bold: true }))
  clientBaseline += (nameLines.length - 1) * 4.2 + 3.8
  clientLines.forEach((detail, index) => text(detail, 139.7, clientBaseline + index * 3.4, 8, MUTED))
  if (clientLogo) {
    const size = fit(clientLogo.width, clientLogo.height, 30, 16)
    try {
      doc.addImage(clientLogo.data, 'PNG', 123.7 - size.width / 2, partiesTop + partiesHeight / 2 - size.height / 2, size.width, size.height, undefined, 'FAST')
    } catch {
      // A logo the browser cannot decode must not block the Preventivo.
    }
  }
  y = partiesTop + partiesHeight + 3.7

  // ── Template building blocks ──
  const heading = (title: string) => {
    ensure(12)
    text(title, LEFT, y + 7.6, 8, BLUE, { bold: true })
    y += 9
  }
  const bodyText = (value: string) => {
    for (const bodyLine of wrap(value, 8, 181)) {
      ensure(3.4)
      text(bodyLine, LEFT, y + 2.8, 8, MUTED)
      y += 3.4
    }
    y += 1.4
  }
  const sectionHeader = (index: number, title: string, subtotal: number) => {
    const titleLines = wrap(`${labels.section} ${sectionLetter(index)} — ${title.toUpperCase()}`, 9, 130, true)
    const height = 7.37 + (titleLines.length - 1) * 3.8
    ensure(height + 3.6 + 6.3 + 10)
    fill(LEFT, y, RIGHT - LEFT, height, sectionFill(index))
    titleLines.forEach((titleLine, n) => text(titleLine, 16.9, y + 4.8 + n * 3.8, 9, 'FFFFFF', { bold: true }))
    text(`${labels.subtotal} ${money(subtotal)}`, 193.2, y + 4.8, 9, 'FFFFFF', { bold: true, align: 'right' })
    y += height + 3.6
  }
  const tableHeader = () => {
    const top = y
    fill(LEFT, top, RIGHT - LEFT, 6.3, 'E9EEF5')
    COL.forEach(x => line(x, top, x, top + 6.3, BORDER, 0.26))
    line(LEFT, top, RIGHT, top, BORDER, 0.26)
    line(LEFT, top + 6.3, RIGHT, top + 6.3, BORDER, 0.44)
    text(labels.item, 16.2, top + 4.2, 7.6, TEXT, { bold: true })
    text(labels.quantity, 129.7, top + 4.2, 7.6, TEXT, { bold: true })
    text(labels.price, 169.4, top + 4.2, 7.6, TEXT, { bold: true, align: 'right' })
    text(labels.total, 193.9, top + 4.2, 7.6, TEXT, { bold: true, align: 'right' })
    y = top + 6.3
  }
  const itemsTable = (section: Proposal['sections'][number], index: number) => {
    const letter = sectionLetter(index)
    tableHeader()
    section.items.forEach((item, itemIndex) => {
      const titleLines = wrap(itemTitle(p, item, letter, itemIndex), 8.5, 110, true)
      const descriptionLines = item.description ? wrap(item.description, 7.6, 110) : []
      const last = 4.5 + (titleLines.length - 1) * 3.5 + (descriptionLines.length ? 3.4 + (descriptionLines.length - 1) * 2.9 : 0)
      const height = Math.max(6.8, last + 2.2)
      if (y + height > BOTTOM) {
        newPage()
        tableHeader()
      }
      const top = y
      fill(LEFT, top, RIGHT - LEFT, height, itemIndex % 2 === 0 ? 'FFFFFF' : 'FAFBFD')
      COL.forEach(x => line(x, top, x, top + height, BORDER, 0.21))
      line(LEFT, top + height, RIGHT, top + height, 'E7ECF2', 0.25)
      titleLines.forEach((titleLine, n) => text(titleLine, 16.2, top + 4.5 + n * 3.5, 8.5, INK, { bold: true }))
      const descriptionTop = top + 4.5 + (titleLines.length - 1) * 3.5 + 3.4
      descriptionLines.forEach((descriptionLine, n) => text(descriptionLine, 16.2, descriptionTop + n * 2.9, 7.6, MUTED))
      text(itemQuantity(p, item), 137.25, top + 4.3, 8, TEXT, { align: 'center' })
      text(money(item.unitPrice), 169.4, top + 4.3, 8, TEXT, { align: 'right' })
      text(money(item.total), 193.9, top + 4.3, 8, INK, { bold: true, align: 'right' })
      y = top + height
    })
    ensure(7.3)
    const top = y
    fill(LEFT, top, RIGHT - LEFT, 7.0, 'EAF6FF')
    ;[LEFT, 171.1, RIGHT].forEach(x => line(x, top, x, top + 7.0, BORDER, 0.21))
    line(LEFT, top, RIGHT, top, BLUE, 0.42)
    line(LEFT, top + 7.0, RIGHT, top + 7.0, BORDER, 0.3)
    text(`${labels.sectionSubtotal} ${letter}`, 169.3, top + 4.9, 8.5, INK, { bold: true, align: 'right' })
    text(money(section.subtotal), 193.8, top + 5.1, 9, INK, { bold: true, align: 'right' })
    y = top + 7.0 + 4.0
  }
  const boxTable = (title: string, rows: { label: string; value: number }[], total: { label: string; value: number }) => {
    const wrapped = rows.map(row => ({ ...row, lines: wrap(row.label, 8, 134) }))
    const heights = wrapped.map(row => 5.9 + (row.lines.length - 1) * 3.3)
    const height = 5.7 + heights.reduce((a, b) => a + b, 0) + 6.9
    ensure(height)
    const top = y
    fill(LEFT, top, RIGHT - LEFT, height, 'F7F9FC')
    text(title, 17.1, top + 4.4, 7.6, BLUE, { bold: true })
    let rowTop = top + 5.7
    wrapped.forEach((row, n) => {
      line(LEFT, rowTop, RIGHT, rowTop, 'E2E8F0', 0.14)
      row.lines.forEach((rowLine, k) => text(rowLine, 17.1, rowTop + 4.1 + k * 3.3, 8, INK))
      text(money(row.value), 193.0, rowTop + 4.1, 8, INK, { bold: true, align: 'right' })
      rowTop += heights[n]
    })
    fill(LEFT, rowTop, RIGHT - LEFT, 6.9, 'EEF7FD')
    line(LEFT, rowTop, RIGHT, rowTop, BLUE, 0.42)
    text(total.label, 17.1, rowTop + 5.0, 9, INK, { bold: true })
    text(money(total.value), 193.0, rowTop + 5.1, 9.5, INK, { bold: true, align: 'right' })
    box(LEFT, top, RIGHT - LEFT, height, BORDER, 0.25)
    y = top + height + 4.0
  }

  // ── Content, in the template's order ──
  const blocks = textBlocks(p)
  for (const block of blocks.before) {
    heading(block.title)
    bodyText(block.text)
  }
  if (blocks.before.length) y += 2
  p.sections.forEach((section, index) => {
    if (index === 1) {
      // Continuation header before Sezione B, as in the template.
      newPage()
      if (logo) doc.addImage(logo, 'PNG', 14.5, 11.8, 36.9, 10.5, undefined, 'FAST')
      text(p.number, 195.5, 14.4, 8, INK, { bold: true, align: 'right' })
      text(`${client.name} · ${labels.word}`, 195.5, 17.4, 7, MUTED, { align: 'right' })
      line(14.3, 23.8, RIGHT, 23.8, BORDER, 0.34)
      y = 27.8
    }
    sectionHeader(index, section.title, section.subtotal)
    if (section.note) bodyText(section.note)
    itemsTable(section, index)
  })
  boxTable(labels.summary, [...p.sections.map(section => ({ label: section.title, value: section.subtotal })), ...summaryAdjustments(p)], { label: labels.grandTotal, value: p.totals.total })
  if (p.milestones.length) {
    boxTable(labels.payments, p.milestones.map(milestone => ({ label: milestoneLabel(p, milestone), value: milestone.amount })), { label: labels.grandTotal, value: p.totals.total })
  }
  for (const block of blocks.after) {
    heading(block.title)
    bodyText(block.text)
  }

  // ── Acceptance and signatures ──
  ensure(22)
  y -= 4.0
  text(labels.acceptance, LEFT, y + 7.6, 8, BLUE, { bold: true })
  text(acceptanceLabel(p), LEFT, y + 12.6, 7.6, MUTED)
  text(labels.signature, 105.0, y + 12.6, 7.6, MUTED)
  const underline = '_'.repeat(40)
  text(underline, LEFT, y + 17.2, 9, TEXT)
  text(underline, 105.0, y + 17.2, 9, TEXT)

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages()
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    line(LEFT, 287.7, RIGHT, 287.7, BORDER, 0.25)
    text(TEMPLATE_SUPPLIER.footerBrand, LEFT, 291.5, 7, INK, { bold: true })
    text(TEMPLATE_SUPPLIER.footerContact, 120.5, 291.5, 7, MUTED, { align: 'center' })
    text(`${labels.page} ${page} ${labels.of} ${pages}`, RIGHT, 291.5, 7, MUTED, { align: 'right' })
  }

  doc.setProperties({ title: `${p.number} ${safe(p.title)}`, author: 'Nivello', creator: 'Nivello Admin' })
  return doc
}

export async function downloadProposalPdf(p: Proposal) {
  const doc = await buildProposalPdf(p)
  const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  doc.save(`${p.number}${slug ? `-${slug}` : ''}.pdf`)
}
