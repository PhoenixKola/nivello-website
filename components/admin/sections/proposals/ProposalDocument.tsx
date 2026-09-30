'use client'
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Proposal } from '@/lib/admin/types'
import { computeDraft, type Draft } from './model'
import {
  acceptanceLabel,
  clientDetails,
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
  tMoney,
  type TemplateLabels
} from './template'

/** A Proposal-shaped snapshot of an unsaved draft, with totals computed like the server does. */
export function draftToProposal(d: Draft, base: Proposal): Proposal {
  const c = computeDraft(d)
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  const items = d.items.map((i, n) => ({ id: i.id ?? i.key, title: i.description, description: i.details, details: i.details, quantity: num(i.quantity), unit: i.unit, unitPrice: Math.round(num(i.unitPrice) * 100), optional: i.optional, total: c.items[n] }))
  const sections = d.sections.map((section, sectionIndex) => {
    const sectionItems = d.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.sectionKey === section.key)
      .map(({ index }, itemIndex) => ({ ...items[index], code: `${String.fromCharCode(65 + sectionIndex)}${itemIndex + 1}` }))
    return { id: section.id ?? section.key, title: section.title, note: section.note, order: sectionIndex, items: sectionItems, subtotal: sectionItems.filter(item => !item.optional).reduce((sum, item) => sum + item.total, 0) }
  })
  return {
    ...base,
    title: d.title,
    language: d.language,
    currency: d.currency,
    clientName: d.clientName,
    clientCompany: d.clientCompany,
    clientEmail: d.clientEmail,
    clientCode: d.clientCode,
    clientSector: d.clientSector,
    clientAddress: d.clientAddress,
    clientPhone: d.clientPhone,
    inboxId: d.inboxId,
    issueDate: d.issueDate,
    validUntil: d.validUntil || null,
    intro: d.intro,
    scope: d.scope,
    assumptions: d.assumptions,
    terms: d.terms,
    items,
    sections,
    discount: { type: d.discountType, value: num(d.discountValue) },
    tax: { label: d.taxLabel || 'VAT', rate: num(d.taxRate) },
    milestones: d.milestones.map((m, n) => ({ label: m.label, due: m.due, percent: num(m.percent), amount: c.milestones[n] })),
    totals: { subtotal: c.subtotal, discount: c.discount, tax: c.tax, total: c.total, optional: c.optional },
    acceptance: { place: d.acceptancePlace, date: d.acceptanceDate || null }
  }
}

const C = Object.fromEntries(Object.entries(TEMPLATE_COLORS).map(([key, hex]) => [key, `#${hex}`])) as Record<keyof typeof TEMPLATE_COLORS, string>
const SHEET_WIDTH_PX = (210 / 25.4) * 96
const font = { fontFamily: 'Arial, Helvetica, sans-serif' }

/** Nivello logo from the template itself (as the DOCX/PDF use); the site logo stands in while it loads. */
function useTemplateLogo() {
  const [logo, setLogo] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    templateLogo().then(src => !cancelled && setLogo(src))
    return () => {
      cancelled = true
    }
  }, [])
  return logo ?? '/nivello-logo-text-light.svg'
}

/** Scales the fixed A4 sheet down to the available width, like a PDF viewer. */
function useFitZoom() {
  const ref = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setZoom(Math.min(1, entry.contentRect.width / SHEET_WIDTH_PX)))
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return [ref, zoom] as const
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-[4.5mm] mb-[1.2mm] text-[8pt] font-bold uppercase" style={{ color: C.blue }}>
      {children}
    </h2>
  )
}

function Body({ text }: { text: string }) {
  return (
    <p className="mb-[1.4mm] whitespace-pre-line text-[8pt] leading-[3.4mm]" style={{ color: C.muted }}>
      {text}
    </p>
  )
}

function Footer({ page, pages, labels }: { page: number; pages: number; labels: TemplateLabels }) {
  return (
    <footer className="absolute inset-x-[14.5mm] bottom-[4.5mm] flex items-baseline justify-between gap-4 pt-[2.4mm] text-[7pt]" style={{ borderTop: `0.25mm solid ${C.border}`, color: C.muted }}>
      <span className="font-bold" style={{ color: C.ink }}>
        {TEMPLATE_SUPPLIER.footerBrand}
      </span>
      <span>{TEMPLATE_SUPPLIER.footerContact}</span>
      <span>
        {labels.page} {page} {labels.of} {pages}
      </span>
    </footer>
  )
}

function Sheet({ children, page, pages, labels }: { children: ReactNode; page: number; pages: number; labels: TemplateLabels }) {
  return (
    <div
      data-preview-page={page}
      className="relative mx-auto min-h-[297mm] w-[210mm] bg-white px-[14.5mm] pb-[16mm] pt-[11.8mm] shadow-[0_2px_24px_rgba(15,23,42,0.14)] print:shadow-none print:[break-after:page]"
      style={{ ...font, color: C.ink, colorScheme: 'light' }}
    >
      {children}
      <Footer page={page} pages={pages} labels={labels} />
    </div>
  )
}

/**
 * In-admin preview of the Preventivo, drawn with the same template design the DOCX/PDF use:
 * shared wording, colours, column widths, money/date formats and block order (template.ts).
 * Sections B onward start on a new sheet after the continuation header, as in the template.
 */
export default function ProposalDocument({ proposal: p }: { proposal: Proposal }) {
  const labels = TEMPLATE_LABELS[p.language]
  const logo = useTemplateLogo()
  const [fitRef, zoom] = useFitZoom()
  const money = (cents: number) => tMoney(cents, p.currency, p.language)
  const client = clientDetails(p)
  const blocks = textBlocks(p)
  const [first, ...rest] = p.sections
  const pages = rest.length ? 2 : 1
  const cell = { borderLeft: `0.21mm solid ${C.border}` }

  const sectionBlock = (section: Proposal['sections'][number], index: number) => {
    const letter = sectionLetter(index)
    return (
      <section key={section.id} aria-label={`${labels.section} ${letter}`} className="break-inside-avoid-page">
        <div className="mt-[1mm] flex min-h-[7.37mm] items-center justify-between gap-4 px-[2.4mm] py-[1.4mm] text-[9pt] font-bold text-white" style={{ background: `#${sectionFill(index)}` }}>
          <h3 className="min-w-0">
            {labels.section} {letter} — {section.title.toUpperCase()}
          </h3>
          <span className="shrink-0 whitespace-nowrap">
            {labels.subtotal} {money(section.subtotal)}
          </span>
        </div>
        <div className="h-[3.6mm]" />
        {section.note && <Body text={section.note} />}
        <table className="w-full table-fixed border-collapse text-[8pt]" style={{ border: `0.26mm solid ${C.border}` }}>
          <colgroup>
            {TEMPLATE_COLUMNS_MM.map((width, n) => (
              <col key={n} style={{ width: `${width}mm` }} />
            ))}
          </colgroup>
          <thead>
            <tr className="h-[6.3mm] text-[7.6pt] font-bold" style={{ background: C.tableHead, color: C.text, borderBottom: `0.44mm solid ${C.border}` }}>
              <th className="px-[1.7mm] text-left">{labels.item}</th>
              <th className="px-[1.5mm] text-left" style={cell}>
                {labels.quantity}
              </th>
              <th className="px-[1.6mm] text-right" style={cell}>
                {labels.price}
              </th>
              <th className="px-[1.6mm] text-right" style={cell}>
                {labels.total}
              </th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item, itemIndex) => (
              <tr key={item.id} className="break-inside-avoid align-top" style={{ background: itemIndex % 2 ? C.rowAlt : '#FFFFFF', borderBottom: `0.25mm solid ${C.rowLine}` }}>
                <td className="px-[1.7mm] py-[1.6mm]">
                  <p className="text-[8.5pt] font-bold leading-[3.5mm]">{itemTitle(p, item, letter, itemIndex)}</p>
                  {item.description && (
                    <p className="mt-[0.5mm] whitespace-pre-line text-[7.6pt] leading-[2.9mm]" style={{ color: C.muted }}>
                      {item.description}
                    </p>
                  )}
                </td>
                <td className="px-[1mm] py-[1.6mm] text-center tabular-nums" style={{ ...cell, color: C.text }}>
                  {itemQuantity(p, item)}
                </td>
                <td className="whitespace-nowrap px-[1.6mm] py-[1.6mm] text-right tabular-nums" style={{ ...cell, color: C.text }}>
                  {money(item.unitPrice)}
                </td>
                <td className="whitespace-nowrap px-[1.6mm] py-[1.6mm] text-right font-bold tabular-nums" style={cell}>
                  {money(item.total)}
                </td>
              </tr>
            ))}
            <tr className="h-[7mm]" style={{ background: C.sectionTotal, borderTop: `0.42mm solid ${C.blue}` }}>
              <td colSpan={3} className="px-[1.8mm] text-right text-[8.5pt] font-bold">
                {labels.sectionSubtotal} {letter}
              </td>
              <td className="whitespace-nowrap px-[1.6mm] text-right text-[9pt] font-bold tabular-nums" style={cell}>
                {money(section.subtotal)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="h-[4mm]" />
      </section>
    )
  }

  const boxTable = (title: string, rows: { label: string; value: number }[], total: { label: string; value: number }) => (
    <section aria-label={title} className="mb-[4mm] break-inside-avoid" style={{ background: C.panel, border: `0.25mm solid ${C.border}` }}>
      <h2 className="px-[2.6mm] pb-[1.2mm] pt-[1.6mm] text-[7.6pt] font-bold" style={{ color: C.blue }}>
        {title}
      </h2>
      {rows.map((row, n) => (
        <div key={n} className="flex items-start justify-between gap-4 px-[2.6mm] py-[1.3mm] text-[8pt]" style={{ borderTop: `0.14mm solid ${C.boxLine}` }}>
          <span className="min-w-0">{row.label}</span>
          <span className="shrink-0 whitespace-nowrap font-bold tabular-nums">{money(row.value)}</span>
        </div>
      ))}
      <div className="flex min-h-[6.9mm] items-center justify-between gap-4 px-[2.6mm] text-[9pt] font-bold" style={{ background: C.boxTotal, borderTop: `0.42mm solid ${C.blue}` }}>
        <span>{total.label}</span>
        <span className="whitespace-nowrap text-[9.5pt] tabular-nums">{money(total.value)}</span>
      </div>
    </section>
  )

  const closing = (
    <>
      {boxTable(labels.summary, [...p.sections.map(section => ({ label: section.title, value: section.subtotal })), ...summaryAdjustments(p)], { label: labels.grandTotal, value: p.totals.total })}
      {p.milestones.length > 0 && boxTable(labels.payments, p.milestones.map(milestone => ({ label: milestoneLabel(p, milestone), value: milestone.amount })), { label: labels.grandTotal, value: p.totals.total })}
      {blocks.after.map(block => (
        <div key={block.title}>
          <Heading>{block.title}</Heading>
          <Body text={block.text} />
        </div>
      ))}
      <section aria-label={labels.acceptance} className="break-inside-avoid">
        <Heading>{labels.acceptance}</Heading>
        <div className="grid grid-cols-2 text-[7.6pt]" style={{ color: C.muted }}>
          <div>
            <p>{acceptanceLabel(p)}</p>
            <div className="mr-[18mm] mt-[6mm]" style={{ borderBottom: `0.3mm solid ${C.text}` }} />
          </div>
          <div className="pl-[1.2mm]">
            <p>{labels.signature}</p>
            <div className="mr-[18mm] mt-[6mm]" style={{ borderBottom: `0.3mm solid ${C.text}` }} />
          </div>
        </div>
      </section>
    </>
  )

  return (
    <div ref={fitRef} className="w-full">
      <article aria-label={`${labels.word} ${p.number}`} className="mx-auto w-[210mm] space-y-6 [zoom:var(--sheet-zoom)] print:space-y-0 print:[zoom:1]" style={{ '--sheet-zoom': zoom } as CSSProperties}>
        <Sheet page={1} pages={pages} labels={labels}>
          <header className="flex items-start justify-between">
            <img src={logo} alt="Nivello" className="mt-[5.3mm] h-[15.1mm] w-[52.9mm] object-contain object-left" />
            <dl className="w-[73.3mm] bg-white px-[2.6mm] pb-[1.6mm] pt-[1.6mm]" style={{ border: `0.3mm solid ${C.metaBorder}` }}>
              <p className="text-right text-[7.6pt] font-bold tracking-[0.04em]" style={{ color: C.gold }}>
                {labels.caps}
              </p>
              {(
                [
                  [labels.number, p.number],
                  [labels.date, tDate(p.issueDate)],
                  [labels.validUntil, tDate(p.validUntil)]
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="mt-[2.2mm] flex items-baseline justify-between gap-3 pr-[2mm]">
                  <dt className="text-[7pt]" style={{ color: C.faint }}>
                    {label}
                  </dt>
                  <dd className="text-[7.6pt] font-bold tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </header>

          <div className="mt-[10mm] text-center">
            <p className="text-[26pt] font-bold leading-[11mm]">{labels.word}</p>
            <h1 className="mx-auto mt-[1mm] max-w-[181mm] text-[19pt] font-bold leading-[7.4mm]">{p.title || '—'}</h1>
          </div>

          <div className="mt-[4.8mm] grid grid-cols-2 px-[1.8mm]">
            <div className="flex min-h-[26.9mm] flex-col justify-center px-[2.7mm] py-[2mm]" style={{ background: C.panel, border: `0.3mm solid ${C.border}` }}>
              <p className="text-[7pt] font-bold" style={{ color: C.blue }}>
                {labels.supplier}
              </p>
              <p className="mt-[0.8mm] text-[10.6pt] font-bold">{TEMPLATE_SUPPLIER.name}</p>
              {TEMPLATE_SUPPLIER.lines.map(line => (
                <p key={line} className="text-[8pt] leading-[3.4mm]" style={{ color: C.muted }}>
                  {line}
                </p>
              ))}
            </div>
            <div className="grid min-h-[26.9mm] grid-cols-[34.6mm_minmax(0,1fr)] items-center" style={{ background: C.panel, border: `0.3mm solid ${C.border}`, borderLeft: 'none' }}>
              <div className="flex items-center justify-center">
                {p.clientLogo && <img src={`/admin-api/proposal-file.php?action=logo&id=${p.id}&v=${p.clientLogo.size}`} alt="" className="max-h-[16mm] max-w-[30mm] object-contain" />}
              </div>
              <div className="min-w-0 py-[2mm] pr-[2.7mm]">
                <p className="text-[7pt] font-bold" style={{ color: C.blue }}>
                  {labels.client}
                </p>
                <p className="mt-[0.8mm] break-words text-[10.6pt] font-bold leading-[4.2mm]">{client.name}</p>
                {[client.sector, client.address, client.contact].filter(Boolean).map(line => (
                  <p key={line} className="break-words text-[8pt] leading-[3.4mm]" style={{ color: C.muted }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="h-[3.7mm]" />

          {blocks.before.map(block => (
            <div key={block.title}>
              <Heading>{block.title}</Heading>
              <Body text={block.text} />
            </div>
          ))}
          {blocks.before.length > 0 && <div className="h-[2mm]" />}
          {first && sectionBlock(first, 0)}
          {!rest.length && closing}
        </Sheet>

        {rest.length > 0 && (
          <Sheet page={2} pages={pages} labels={labels}>
            <header className="mb-[4mm] flex items-end justify-between pb-[1.6mm]" style={{ borderBottom: `0.34mm solid ${C.border}` }}>
              <img src={logo} alt="Nivello" className="h-[10.5mm] w-[36.9mm] object-contain object-left" />
              <div className="text-right">
                <p className="text-[8pt] font-bold">{p.number}</p>
                <p className="text-[7pt]" style={{ color: C.muted }}>
                  {client.name} · {labels.word}
                </p>
              </div>
            </header>
            {rest.map((section, n) => sectionBlock(section, n + 1))}
            {closing}
          </Sheet>
        )}
      </article>
    </div>
  )
}
