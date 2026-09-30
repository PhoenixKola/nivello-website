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
  TEMPLATE_LABELS,
  templateBytes,
  textBlocks,
  tDate,
  tMoney
} from './template'

/*
 * Fills the original Nivello Word template instead of generating a new document: every table, row,
 * paragraph and image comes from the template itself (cloned where more are needed), so fonts,
 * colours, borders, widths, spacing, footer and page setup stay exactly as designed.
 *
 * Template body (by position): 0 header · 1 title · 2 supplier/client · 3 spacer · 4 section A header ·
 * 5 spacer · 6 section A items · 7 page break · 8 continuation header · 9 spacer · 10 section B header ·
 * 11 spacer · 12 section B items · 13 spacer · 14 summary · 15 acceptance heading · 16 signatures · 17 spacer.
 */

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PKG_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const XML_NS = 'http://www.w3.org/XML/1998/namespace'
const EMU_PER_MM = 36000
const CLIENT_LOGO_REL = 'rIdNivelloClientLogo'

const elements = (node: Node) => Array.from(node.childNodes).filter((child): child is Element => child.nodeType === 1)
const wChildren = (node: Node, name: string) => elements(node).filter(child => child.namespaceURI === W && child.localName === name)
const wAll = (node: Element | Document, name: string) => Array.from(node.getElementsByTagNameNS(W, name))
const anyAll = (node: Element, name: string) => Array.from(node.getElementsByTagName('*')).filter(child => child.localName === name)
const clone = <T extends Node>(node: T) => node.cloneNode(true) as T
const remove = (node: Node) => node.parentNode?.removeChild(node)

function setText(t: Element, value: string) {
  t.textContent = value
  t.setAttributeNS(XML_NS, 'xml:space', 'preserve')
}

/** Replaces `find` inside the nth w:t that contains it. */
function replaceText(scope: Element, find: string, value: string, occurrence = 0) {
  let seen = 0
  for (const t of wAll(scope, 't')) {
    const text = t.textContent ?? ''
    if (!text.includes(find)) continue
    if (seen++ === occurrence) {
      setText(t, text.replace(find, value))
      return true
    }
  }
  return false
}

/** Rewrites a run's text, keeping its formatting; newlines become Word line breaks. */
function writeRun(run: Element, text: string) {
  const doc = run.ownerDocument
  for (const child of elements(run)) if (child.localName !== 'rPr') remove(child)
  text.split('\n').forEach((line, index) => {
    if (index > 0) run.appendChild(doc.createElementNS(W, 'w:br'))
    const t = doc.createElementNS(W, 'w:t')
    setText(t, line)
    run.appendChild(t)
  })
}

/** Writes a cell's value into its first text run (keeping that run's formatting) and clears the rest. */
function setCell(cell: Element, value: string) {
  const [first, ...rest] = wAll(cell, 't')
  if (!first) throw new Error('Template cell has no text run.')
  setText(first, value)
  for (const t of rest) setText(t, '')
}

/** The run holding a given placeholder text. */
function runWith(scope: Element, find: string) {
  const t = wAll(scope, 't').find(node => (node.textContent ?? '').includes(find))
  if (!t) throw new Error(`Template placeholder not found: ${find}`)
  return t.parentNode as Element
}

function paragraphOf(node: Node) {
  let current: Node | null = node
  while (current && !(current.nodeType === 1 && (current as Element).localName === 'p')) current = current.parentNode
  return current as Element
}

export async function buildProposalDocx(p: Proposal) {
  const { default: JSZip } = await import('jszip')
  const labels = TEMPLATE_LABELS[p.language]
  const money = (cents: number) => tMoney(cents, p.currency, p.language)
  const zip = await JSZip.loadAsync(await templateBytes())
  const parser = new DOMParser()
  const serializer = new XMLSerializer()
  const documentXml = parser.parseFromString(await zip.file('word/document.xml')!.async('string'), 'application/xml')
  const body = wAll(documentXml, 'body')[0]
  const nodes = elements(body)
  const sectPr = nodes[nodes.length - 1]
  if (nodes.length < 19 || sectPr.localName !== 'sectPr' || [0, 2, 4, 6, 8, 10, 12, 14, 16].some(i => nodes[i].localName !== 'tbl')) {
    throw new Error('The Preventivo template does not have the expected structure.')
  }
  const [header, title, parties, spacerAfterParties, headerA, spacerInSection, itemsA, pageBreak, continuation, spacerAfterContinuation, headerB, , , spacerBeforeSummary, summary, acceptanceHeading, signatures, closingSpacer] = nodes

  // Pristine prototypes, taken before anything is filled in.
  const proto = {
    sectionHeader: [clone(headerA), clone(headerB)],
    spacer: clone(spacerInSection),
    items: clone(itemsA),
    summary: clone(summary),
    heading: clone(acceptanceHeading),
    body: paragraphOf(runWith(parties, '[SETTORE')).cloneNode(true) as Element
  }

  // Header: logo stays; metadata box gets the proposal values.
  replaceText(header, 'PREVENTIVO', labels.caps)
  replaceText(header, 'Numero', labels.number)
  replaceText(header, 'NIV-[CLI]-[AAAA]-[001]', p.number)
  replaceText(header, 'Valido fino al', labels.validUntil)
  replaceText(header, 'Data', labels.date)
  replaceText(header, '[GG/MM/AAAA]', tDate(p.issueDate))
  replaceText(header, '[GG/MM/AAAA]', tDate(p.validUntil))
  if (wAll(header, 't').some(t => (t.textContent ?? '').includes('['))) throw new Error('Template header placeholders were not all filled.')

  // Centered title.
  replaceText(title, 'Preventivo', labels.word)
  replaceText(title, '[TITOLO DEL PROGETTO / SERVIZIO]', p.title)

  // Supplier / client block.
  replaceText(parties, 'FORNITORE', labels.supplier)
  const clientTable = wAll(wChildren(wChildren(parties, 'tr')[0], 'tc')[1], 'tbl')[0]
  const [logoCell, clientCell] = wChildren(wChildren(clientTable, 'tr')[0], 'tc')
  const logoParagraph = wChildren(logoCell, 'p')[0]
  for (const run of wChildren(logoParagraph, 'r')) remove(run)
  const client = clientDetails(p)
  const [labelParagraph, nameParagraph, sectorParagraph, addressParagraph, contactParagraph] = wChildren(clientCell, 'p')
  replaceText(labelParagraph, 'CLIENTE', labels.client)
  replaceText(nameParagraph, '[NOME CLIENTE / AZIENDA]', client.name)
  for (const [paragraph, value] of [[sectorParagraph, client.sector], [addressParagraph, client.address], [contactParagraph, client.contact]] as const) {
    if (value) writeRun(wChildren(paragraph, 'r')[0], value)
    else remove(paragraph)
  }

  const logo = await clientLogoPng(p)
  if (logo) {
    const logoRun = clone(wAll(header, 'drawing')[0].parentNode as Element)
    const size = fit(logo.width, logo.height, 30 * EMU_PER_MM, 16 * EMU_PER_MM)
    const cx = String(Math.round(size.width))
    const cy = String(Math.round(size.height))
    for (const extent of [...anyAll(logoRun, 'extent'), ...anyAll(logoRun, 'ext')]) {
      if (extent.hasAttribute('cx')) {
        extent.setAttribute('cx', cx)
        extent.setAttribute('cy', cy)
      }
    }
    for (const docPr of anyAll(logoRun, 'docPr')) {
      docPr.setAttribute('id', '9001')
      docPr.setAttribute('name', 'Client logo')
    }
    for (const blip of anyAll(logoRun, 'blip')) blip.setAttributeNS(REL_NS, 'r:embed', CLIENT_LOGO_REL)
    logoParagraph.appendChild(logoRun)
    zip.file('word/media/nivello-client-logo.png', logo.data)
    const rels = parser.parseFromString(await zip.file('word/_rels/document.xml.rels')!.async('string'), 'application/xml')
    const relationship = rels.createElementNS(PKG_NS, 'Relationship')
    relationship.setAttribute('Id', CLIENT_LOGO_REL)
    relationship.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image')
    relationship.setAttribute('Target', 'media/nivello-client-logo.png')
    rels.documentElement.appendChild(relationship)
    zip.file('word/_rels/document.xml.rels', serializer.serializeToString(rels))
    const types = await zip.file('[Content_Types].xml')!.async('string')
    if (!/Extension="png"/i.test(types)) zip.file('[Content_Types].xml', types.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>'))
  }

  // Building blocks cloned from the template.
  const heading = (text: string) => {
    const paragraph = clone(proto.heading)
    replaceText(paragraph, 'ACCETTAZIONE DEL PREVENTIVO', text)
    return paragraph
  }
  const bodyText = (text: string) => {
    const paragraph = clone(proto.body)
    writeRun(wChildren(paragraph, 'r')[0], text)
    return paragraph
  }
  const sectionHeader = (index: number, sectionTitle: string, subtotal: number) => {
    const table = clone(proto.sectionHeader[index % 2])
    const [titleCell, subtotalCell] = wChildren(wChildren(table, 'tr')[0], 'tc')
    setCell(titleCell, `${labels.section} ${sectionLetter(index)} — ${sectionTitle.toUpperCase()}`)
    setCell(subtotalCell, `${labels.subtotal} ${money(subtotal)}`)
    for (const shd of wAll(table, 'shd')) shd.setAttributeNS(W, 'w:fill', sectionFill(index))
    return table
  }
  const itemsTable = (section: Proposal['sections'][number], index: number) => {
    const letter = sectionLetter(index)
    const table = clone(proto.items)
    const rows = wChildren(table, 'tr')
    const [head, odd, even, subtotal] = [rows[0], rows[1], rows[2], rows[rows.length - 1]]
    rows.forEach(remove)
    wChildren(head, 'tc').forEach((cell, n) => setCell(cell, [labels.item, labels.quantity, labels.price, labels.total][n]))
    table.appendChild(head)
    section.items.forEach((item, itemIndex) => {
      const row = clone(itemIndex % 2 === 0 ? odd : even)
      const [descriptionCell, quantityCell, priceCell, totalCell] = wChildren(row, 'tc')
      writeRun(runWith(descriptionCell, '[TITOLO VOCE]'), itemTitle(p, item, letter, itemIndex))
      const descriptionRun = runWith(descriptionCell, '[Descrizione sintetica')
      if (item.description) writeRun(descriptionRun, item.description)
      else remove(paragraphOf(descriptionRun))
      setCell(quantityCell, itemQuantity(p, item))
      setCell(priceCell, money(item.unitPrice))
      setCell(totalCell, money(item.total))
      table.appendChild(row)
    })
    const [subtotalLabel, subtotalValue] = wChildren(subtotal, 'tc')
    setCell(subtotalLabel, `${labels.sectionSubtotal} ${letter}`)
    setCell(subtotalValue, money(section.subtotal))
    table.appendChild(subtotal)
    return table
  }
  const boxTable = (title: string, rows: { label: string; value: number }[], total: { label: string; value: number }) => {
    const table = clone(proto.summary)
    const [head, row, , totalRow] = wChildren(table, 'tr')
    wChildren(table, 'tr').forEach(remove)
    setCell(wChildren(head, 'tc')[0], title)
    table.appendChild(head)
    for (const entry of rows) {
      const line = clone(row)
      const [labelCell, valueCell] = wChildren(line, 'tc')
      setCell(labelCell, entry.label)
      setCell(valueCell, money(entry.value))
      table.appendChild(line)
    }
    const [totalLabel, totalValue] = wChildren(totalRow, 'tc')
    setCell(totalLabel, total.label)
    setCell(totalValue, money(total.value))
    table.appendChild(totalRow)
    return table
  }

  // Continuation header before Sezione B, as in the template.
  replaceText(continuation, 'NIV-[CLI]-[AAAA]-[001]', p.number)
  writeRun(runWith(continuation, '[NOME CLIENTE]'), `${client.name} · ${labels.word}`)

  const blocks = textBlocks(p)
  const out: Element[] = [header, title, parties, spacerAfterParties]
  for (const block of blocks.before) out.push(heading(block.title), bodyText(block.text))
  if (blocks.before.length) out.push(clone(proto.spacer))
  p.sections.forEach((section, index) => {
    if (index === 1) out.push(pageBreak, continuation, spacerAfterContinuation)
    else if (index > 1) out.push(clone(proto.spacer))
    out.push(sectionHeader(index, section.title, section.subtotal), clone(proto.spacer))
    if (section.note) out.push(bodyText(section.note))
    out.push(itemsTable(section, index))
  })
  out.push(spacerBeforeSummary)
  out.push(boxTable(labels.summary, [...p.sections.map(section => ({ label: section.title, value: section.subtotal })), ...summaryAdjustments(p)], { label: labels.grandTotal, value: p.totals.total }))
  if (p.milestones.length) {
    out.push(clone(proto.spacer), boxTable(labels.payments, p.milestones.map(milestone => ({ label: milestoneLabel(p, milestone), value: milestone.amount })), { label: labels.grandTotal, value: p.totals.total }))
  }
  for (const block of blocks.after) out.push(heading(block.title), bodyText(block.text))

  // Acceptance and signatures.
  replaceText(acceptanceHeading, 'ACCETTAZIONE DEL PREVENTIVO', labels.acceptance)
  replaceText(signatures, 'Luogo e data', acceptanceLabel(p))
  replaceText(signatures, 'Firma del cliente', labels.signature)
  out.push(acceptanceHeading, signatures, closingSpacer)

  for (const node of elements(body)) remove(node)
  for (const node of out) body.appendChild(node)
  body.appendChild(sectPr)
  zip.file('word/document.xml', serializer.serializeToString(documentXml))

  if (p.language === 'en') {
    let footer = await zip.file('word/footer1.xml')!.async('string')
    footer = footer.replace('>Pagina <', `>${labels.page} <`).replace('> di <', `> ${labels.of} <`)
    zip.file('word/footer1.xml', footer)
  }

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' })
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
