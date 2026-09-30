import type { Proposal } from '@/lib/admin/types'
import { docDate, docMoney, formatQuantity, NIVELLO, proposalUnitLabel } from './model'

const BLUE = '0B6FC0'
const INK = '0F172A'
const MUTED = '64748B'
const LINE = 'CBD5E1'

async function imageBytes(url: string): Promise<{ data: Uint8Array; type: 'png' | 'jpg' } | null> {
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) return null
  const blob = await response.blob()
  if (blob.type === 'image/png') return { data: new Uint8Array(await blob.arrayBuffer()), type: 'png' }
  if (blob.type === 'image/jpeg') return { data: new Uint8Array(await blob.arrayBuffer()), type: 'jpg' }
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
  bitmap.close()
  const png = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
  return png ? { data: new Uint8Array(await png.arrayBuffer()), type: 'png' } : null
}

export async function buildProposalDocx(p: Proposal) {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    ImageRun,
    PageBreak,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
  } = await import('docx')
  const money = (value: number) => docMoney(value, p.currency, p.language)
  const label = (en: string, it: string) => (p.language === 'it' ? it : en)
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE }
  const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const cell = (content: string, options: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; color?: string } = {}) =>
    new TableCell({
      borders: { top: border, bottom: border, left: noBorder, right: noBorder },
      margins: { top: 120, bottom: 120, left: 100, right: 100 },
      children: [new Paragraph({ alignment: options.align, children: [new TextRun({ text: content, bold: options.bold, color: options.color ?? INK, size: 18 })] })]
    })
  const heading = (text: string) => new Paragraph({ spacing: { before: 260, after: 100 }, children: [new TextRun({ text: text.toUpperCase(), bold: true, color: BLUE, size: 18, characterSpacing: 20 })] })
  const logo = await imageBytes('/nivello-icon.png')
  const clientLogo = p.clientLogo ? await imageBytes(`/admin-api/proposal-file.php?action=logo&id=${p.id}`) : null
  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = []

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: border, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
      rows: [new TableRow({ children: [
        new TableCell({ borders: { top: noBorder, bottom: border, left: noBorder, right: noBorder }, children: [new Paragraph({ children: [
          ...(logo ? [new ImageRun({ data: logo.data, transformation: { width: 34, height: 34 }, type: logo.type })] : []),
          new TextRun({ text: `  ${NIVELLO.name}`, bold: true, size: 30, color: INK }),
          new TextRun({ text: `\n${NIVELLO.email}  ${NIVELLO.web}`, size: 16, color: MUTED })
        ] })] }),
        new TableCell({ borders: { top: noBorder, bottom: border, left: noBorder, right: noBorder }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'PREVENTIVO', bold: true, color: BLUE, size: 18 }), new TextRun({ text: `\n${p.number}`, font: 'Courier New', size: 20, color: INK })] })] })
      ] })]
    }),
    new Paragraph({ spacing: { before: 360, after: 200 }, children: [new TextRun({ text: p.title, bold: true, size: 38, color: INK })] })
  )

  const clientLines = [p.clientCompany || p.clientName, p.clientCompany && p.clientName ? p.clientName : '', p.clientSector, p.clientAddress, p.clientPhone, p.clientEmail].filter(Boolean)
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideHorizontal: noBorder, insideVertical: noBorder },
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, children: [
        new Paragraph({ children: [new TextRun({ text: label('CLIENT', 'CLIENTE'), bold: true, color: BLUE, size: 16 })] }),
        ...(clientLogo ? [new Paragraph({ spacing: { before: 80, after: 80 }, children: [new ImageRun({ data: clientLogo.data, transformation: { width: 120, height: 48 }, type: clientLogo.type })] })] : []),
        ...clientLines.map((line, index) => new Paragraph({ children: [new TextRun({ text: line, bold: index === 0, size: 19, color: index === 0 ? INK : MUTED })] }))
      ] }),
      new TableCell({ borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }, children: [
        new Paragraph({ children: [new TextRun({ text: label('DATE', 'DATA'), bold: true, color: BLUE, size: 16 }), new TextRun({ text: `\n${docDate(p.issueDate, p.language)}`, size: 19 })] }),
        new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: label('VALID UNTIL', 'VALIDO FINO AL'), bold: true, color: BLUE, size: 16 }), new TextRun({ text: `\n${docDate(p.validUntil, p.language)}`, size: 19 })] })
      ] })
    ] })]
  }))

  for (const [title, text] of [[label('Introduction', 'Introduzione'), p.intro], [label('Scope of work', 'Ambito del lavoro'), p.scope]] as const) {
    if (text.trim()) children.push(heading(title), new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 19, color: MUTED })] }))
  }

  p.sections.forEach((section, sectionIndex) => {
    const letter = String.fromCharCode(65 + sectionIndex)
    children.push(heading(`${label('Section', 'Sezione')} ${letter} — ${section.title}`))
    if (section.note) children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: section.note, italics: true, color: MUTED, size: 18 })] }))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ tableHeader: true, children: [cell(label('Item / description', 'Voce / descrizione'), { bold: true }), cell(label('Qty', 'Quantità'), { bold: true, align: AlignmentType.RIGHT }), cell(label('Price', 'Prezzo'), { bold: true, align: AlignmentType.RIGHT }), cell(label('Total', 'Totale'), { bold: true, align: AlignmentType.RIGHT })] }),
        ...section.items.map(item => new TableRow({ cantSplit: true, children: [
          new TableCell({ borders: { top: border, bottom: border, left: noBorder, right: noBorder }, margins: { top: 120, bottom: 120, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: `${item.code}) ${item.title}${item.optional ? ` (${label('optional', 'opzionale')})` : ''}`, bold: true, size: 18 }), ...(item.description ? [new TextRun({ text: `\n${item.description}`, color: MUTED, size: 17 })] : [])] })] }),
          cell(item.unit === 'fixed' ? '1' : `${formatQuantity(item.quantity, p.language)} ${proposalUnitLabel(item.unit, item.quantity, p.language)}`, { align: AlignmentType.RIGHT }),
          cell(item.unit === 'fixed' ? '—' : money(item.unitPrice), { align: AlignmentType.RIGHT }),
          cell(money(item.total), { bold: true, align: AlignmentType.RIGHT })
        ] })),
        new TableRow({ children: [new TableCell({ columnSpan: 3, borders: { top: border, bottom: border, left: noBorder, right: noBorder }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${label('Section subtotal', 'Subtotale sezione')} ${letter}`, bold: true, size: 18 })] })] }), cell(money(section.subtotal), { bold: true, align: AlignmentType.RIGHT })] })
      ]
    }))
  })

  children.push(heading(label('Summary', 'Riepilogo')))
  const summaryRows = p.sections.map((section, index) => new TableRow({ children: [cell(`${String.fromCharCode(65 + index)} — ${section.title}`), cell(money(section.subtotal), { align: AlignmentType.RIGHT })] }))
  if (p.totals.discount > 0) summaryRows.push(new TableRow({ children: [cell(`${label('Discount', 'Sconto')}${p.discount.type === 'percent' ? ` (${formatQuantity(p.discount.value, p.language)}%)` : ''}`), cell(`-${money(p.totals.discount)}`, { align: AlignmentType.RIGHT })] }))
  if (p.totals.tax > 0) summaryRows.push(new TableRow({ children: [cell(`${p.tax.label} (${formatQuantity(p.tax.rate, p.language)}%)`), cell(money(p.totals.tax), { align: AlignmentType.RIGHT })] }))
  summaryRows.push(new TableRow({ children: [cell(label('TOTAL', 'TOTALE'), { bold: true }), cell(money(p.totals.total), { bold: true, align: AlignmentType.RIGHT })] }))
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: summaryRows }))
  if (p.milestones.length) {
    children.push(
      heading(label('Payment plan', 'Piano dei pagamenti')),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: p.milestones.map(milestone => new TableRow({
          children: [
            cell(milestone.label, { bold: true }),
            cell(milestone.due, { color: MUTED }),
            cell(`${formatQuantity(milestone.percent, p.language)}%`, { align: AlignmentType.RIGHT }),
            cell(money(milestone.amount), { align: AlignmentType.RIGHT })
          ]
        }))
      })
    )
  }
  if (p.assumptions) children.push(heading(label('Assumptions', 'Premesse')), new Paragraph({ children: [new TextRun({ text: p.assumptions, size: 18, color: MUTED })] }))
  if (p.terms) children.push(heading(label('Terms', 'Condizioni')), new Paragraph({ children: [new TextRun({ text: p.terms, size: 18, color: MUTED })] }))
  const acceptance = [p.acceptance.place, p.acceptance.date ? docDate(p.acceptance.date, p.language) : ''].filter(Boolean).join(' · ')
  children.push(new Paragraph({ children: [new PageBreak()] }), heading(label('Proposal acceptance', 'Accettazione del preventivo')), new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [new TableRow({ children: [cell(`${label('Place and date', 'Luogo e data')}${acceptance ? `\n${acceptance}` : '\n\n'}`), cell(`${label('Client signature', 'Firma del cliente')}\n\n`)] })] }))

  const doc = new Document({
    creator: NIVELLO.name,
    title: `${p.number} ${p.title}`,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 900, right: 900, bottom: 1000, left: 900 } } },
      children,
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${NIVELLO.name} · ${NIVELLO.web} · ${NIVELLO.email} · ${p.number}`, color: MUTED, size: 15 })] })] }) }
    }]
  })
  return Packer.toBlob(doc)
}

export async function downloadProposalDocx(p: Proposal) {
  const blob = await buildProposalDocx(p)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${p.number}.docx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
