import type { Proposal } from '@/lib/admin/types'
import { DOC_COPY, NIVELLO, computeDraft, docDate, docMoney, formatQuantity, type Draft } from './model'

/** A Proposal-shaped snapshot of an unsaved draft, with totals computed like the server does. */
export function draftToProposal(d: Draft, base: Proposal): Proposal {
  const c = computeDraft(d)
  const num = (v: string) => Number(v.replace(',', '.')) || 0
  return {
    ...base,
    title: d.title,
    language: d.language,
    currency: d.currency,
    clientName: d.clientName,
    clientCompany: d.clientCompany,
    clientEmail: d.clientEmail,
    issueDate: d.issueDate,
    validUntil: d.validUntil || null,
    intro: d.intro,
    scope: d.scope,
    assumptions: d.assumptions,
    terms: d.terms,
    items: d.items.map((i, n) => ({ description: i.description, details: i.details, quantity: num(i.quantity), unit: i.unit, unitPrice: Math.round(num(i.unitPrice) * 100), optional: i.optional, total: c.items[n] })),
    discount: { type: d.discountType, value: num(d.discountValue) },
    tax: { label: d.taxLabel || 'VAT', rate: num(d.taxRate) },
    milestones: d.milestones.map((m, n) => ({ label: m.label, due: m.due, percent: num(m.percent), amount: c.milestones[n] })),
    totals: { subtotal: c.subtotal, discount: c.discount, tax: c.tax, total: c.total, optional: c.optional }
  }
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null
  return (
    <section className="mt-8 break-inside-avoid-page">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b6fc0]">{title}</h2>
      <p className="whitespace-pre-line text-[13px] leading-relaxed text-slate-700">{text}</p>
    </section>
  )
}

/** Print-quality HTML rendition of the proposal; mirrors the PDF layout. Always light, like paper. */
export default function ProposalDocument({ proposal: p }: { proposal: Proposal }) {
  const t = DOC_COPY[p.language]
  const money = (cents: number) => docMoney(cents, p.currency, p.language)
  const included = p.items.filter(i => !i.optional)
  const optional = p.items.filter(i => i.optional)
  const unitLabel = (unit: Proposal['items'][number]['unit']) => t.units[unit]

  const table = (items: Proposal['items']) => (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="border-b-2 border-slate-900 text-left text-[11px] uppercase tracking-wide text-slate-500">
          <th className="py-2 pr-3 font-semibold">{t.description}</th>
          <th className="w-16 py-2 pr-3 text-right font-semibold">{t.qty}</th>
          <th className="w-28 py-2 pr-3 text-right font-semibold">{t.unitPrice}</th>
          <th className="w-28 py-2 text-right font-semibold">{t.total}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, n) => (
          <tr key={n} className="break-inside-avoid border-b border-slate-200 align-top">
            <td className="py-2.5 pr-3">
              <p className="font-medium text-slate-900">{item.description || '—'}</p>
              {item.details && <p className="mt-0.5 whitespace-pre-line text-[11.5px] text-slate-500">{item.details}</p>}
            </td>
            <td className="py-2.5 pr-3 text-right tabular-nums text-slate-700">{item.unit === 'fixed' ? '1' : `${formatQuantity(item.quantity, p.language)} ${unitLabel(item.unit)}`}</td>
            <td className="py-2.5 pr-3 text-right tabular-nums text-slate-700">{item.unit === 'fixed' ? '—' : money(item.unitPrice)}</td>
            <td className="py-2.5 text-right font-medium tabular-nums text-slate-900">{money(item.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    <article className="mx-auto w-full max-w-[210mm] bg-white px-[14mm] py-[16mm] text-slate-900 shadow-[0_2px_24px_rgba(15,23,42,0.12)] print:max-w-none print:px-0 print:py-0 print:shadow-none" style={{ colorScheme: 'light' }}>
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nivello-logo-text-light.svg" alt="Nivello" width={150} height={43} className="h-auto w-[140px]" />
          <p className="mt-2 text-[11px] text-slate-500">
            {NIVELLO.web} · {NIVELLO.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b6fc0]">{t.proposal}</p>
          <p className="mt-1 font-mono text-sm text-slate-700">{p.number}</p>
        </div>
      </header>

      <h1 className="mt-8 text-[26px] font-bold leading-tight tracking-tight">{p.title || '—'}</h1>

      <dl className="mt-6 grid grid-cols-1 gap-4 text-[12.5px] sm:grid-cols-3">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">{t.preparedFor}</dt>
          <dd className="mt-1 font-medium">{p.clientCompany || p.clientName || '—'}</dd>
          {p.clientCompany && p.clientName && <dd className="text-slate-600">{p.clientName}</dd>}
          {p.clientEmail && <dd className="text-slate-600">{p.clientEmail}</dd>}
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">{t.issueDate}</dt>
          <dd className="mt-1">{docDate(p.issueDate, p.language)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">{t.validUntil}</dt>
          <dd className="mt-1">{docDate(p.validUntil, p.language)}</dd>
        </div>
      </dl>

      <Section title={t.introduction} text={p.intro} />
      <Section title={t.scope} text={p.scope} />

      <section className="mt-8">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b6fc0]">{t.investment}</h2>
        {table(included)}
        <div className="ml-auto mt-3 w-full max-w-72 space-y-1 text-[12.5px] break-inside-avoid">
          <div className="flex justify-between">
            <span className="text-slate-600">{t.subtotal}</span>
            <span className="tabular-nums">{money(p.totals.subtotal)}</span>
          </div>
          {p.totals.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">
                {t.discount}
                {p.discount.type === 'percent' ? ` (${formatQuantity(p.discount.value, p.language)}%)` : ''}
              </span>
              <span className="tabular-nums">−{money(p.totals.discount)}</span>
            </div>
          )}
          {p.tax.rate > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-600">
                {p.tax.label} ({formatQuantity(p.tax.rate, p.language)}%)
              </span>
              <span className="tabular-nums">{money(p.totals.tax)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-[15px] font-bold">
            <span>{t.grandTotal}</span>
            <span className="tabular-nums">{money(p.totals.total)}</span>
          </div>
        </div>
        {optional.length > 0 && (
          <div className="mt-6 break-inside-avoid">
            <p className="mb-1 text-[11.5px] font-medium text-slate-600">{t.optionalItems}</p>
            {table(optional)}
          </div>
        )}
      </section>

      {p.milestones.length > 0 && (
        <section className="mt-8 break-inside-avoid">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b6fc0]">{t.payments}</h2>
          <table className="w-full border-collapse text-[12.5px]">
            <tbody>
              {p.milestones.map((m, n) => (
                <tr key={n} className="border-b border-slate-200">
                  <td className="py-2 pr-3 font-medium">{m.label}</td>
                  <td className="py-2 pr-3 text-slate-600">{m.due}</td>
                  <td className="w-16 py-2 pr-3 text-right tabular-nums text-slate-600">{formatQuantity(m.percent, p.language)}%</td>
                  <td className="w-28 py-2 text-right font-medium tabular-nums">{money(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Section title={t.assumptions} text={p.assumptions} />
      <Section title={t.terms} text={p.terms} />

      <footer className="mt-10 border-t border-slate-200 pt-4 text-[10.5px] text-slate-400">
        {NIVELLO.name} · {NIVELLO.web} · {NIVELLO.email} · {p.number}
      </footer>
    </article>
  )
}
