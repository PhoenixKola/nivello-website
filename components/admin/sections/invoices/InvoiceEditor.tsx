'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, FileCode2, Info, Plus, Stamp, Trash2, X } from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { CURRENCIES } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import type { BillingMeta, ClientBilling, Invoice, InvoiceDetail, InvoiceLineInput, SdiStatus } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Skeleton, Switch } from '../../ui/Controls'
import { TextArea, TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, fieldBase, focusRing } from '../../ui/styles'
import { ActivityTimeline, RecordLink } from '../ops/shared'
import { INVOICE_STATUS_META, SDI_STATUS_META } from './meta'

type LineDraft = { key: string; description: string; quantity: string; unit: string; unitPrice: string; discountPercent: string; vatRate: string; vatNature: string; vatReference: string }
type Draft = {
  issueDate: string
  dueDate: string
  currency: Invoice['currency']
  client: ClientBilling
  paymentMode: string
  paymentTerms: string
  notes: string
  stampDuty: boolean
  lines: LineDraft[]
}

let keySeq = 0
const key = () => `l${++keySeq}`
const num = (value: string) => {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
const blankLine = (): LineDraft => ({ key: key(), description: '', quantity: '1', unit: '', unitPrice: '', discountPercent: '', vatRate: '22', vatNature: '', vatReference: '' })

function toDraft(inv: Invoice): Draft {
  return {
    issueDate: inv.issueDate,
    dueDate: inv.dueDate ?? '',
    currency: inv.currency,
    client: { ...inv.client },
    paymentMode: inv.paymentMode,
    paymentTerms: inv.paymentTerms,
    notes: inv.notes,
    stampDuty: inv.stampDuty,
    lines: inv.lines.map(line => ({
      key: key(),
      description: line.description,
      quantity: String(line.quantity),
      unit: line.unit,
      unitPrice: String(line.unitPrice / 100),
      discountPercent: line.discountPercent ? String(line.discountPercent) : '',
      vatRate: String(line.vatRate),
      vatNature: line.vatNature,
      vatReference: line.vatReference
    }))
  }
}

function toInput(d: Draft) {
  return {
    issueDate: d.issueDate,
    dueDate: d.dueDate || null,
    currency: d.currency,
    client: d.client,
    paymentMode: d.paymentMode,
    paymentTerms: d.paymentTerms,
    notes: d.notes,
    stampDuty: d.stampDuty,
    lines: d.lines.map<InvoiceLineInput>(l => ({ description: l.description, quantity: l.quantity || '0', unit: l.unit, unitPrice: l.unitPrice || '0', discountPercent: l.discountPercent || '0', vatRate: l.vatRate || '0', vatNature: l.vatNature, vatReference: l.vatReference }))
  }
}

/** Mirrors invoice_compute() in _invoices.php for a live estimate; the server result is authoritative. */
function estimate(d: Draft) {
  const groups = new Map<string, { rate: number; nature: string; taxable: number }>()
  const totals = d.lines.map(l => Math.round(num(l.quantity) * Math.round(num(l.unitPrice) * 100) * (100 - num(l.discountPercent)) / 100))
  d.lines.forEach((l, i) => {
    const rate = num(l.vatRate)
    const k = `${rate}|${rate > 0 ? '' : l.vatNature}`
    const g = groups.get(k) ?? { rate, nature: rate > 0 ? '' : l.vatNature, taxable: 0 }
    g.taxable += totals[i]
    groups.set(k, g)
  })
  let taxable = 0
  let vat = 0
  for (const g of groups.values()) {
    taxable += g.taxable
    vat += Math.round((g.taxable * g.rate) / 100)
  }
  const stamp = d.stampDuty ? 200 : 0
  return { lines: totals, taxable, vat, stamp, total: taxable + vat + stamp }
}

const SDI_OPTIONS: { value: Exclude<SdiStatus, 'not_exported' | 'xml_generated'>; label: string }[] = [
  { value: 'to_send', label: 'To send via SdI' },
  { value: 'sent', label: 'Sent to SdI' },
  { value: 'delivered', label: 'Delivered (ricevuta di consegna)' },
  { value: 'rejected', label: 'Rejected (notifica di scarto)' },
  { value: 'undeliverable', label: 'Unable to deliver (mancata consegna)' }
]

export default function InvoiceEditor({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { navigate } = useAdmin()
  const toast = useToast()
  const [detail, setDetail] = useState<InvoiceDetail | null>(null)
  const [meta, setMeta] = useState<BillingMeta | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [paidOpen, setPaidOpen] = useState(false)
  const [paidDate, setPaidDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [recordPayment, setRecordPayment] = useState(true)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [sdi, setSdi] = useState<{ transmissionStatus: (typeof SDI_OPTIONS)[number]['value']; transmittedAt: string; sdiIdentifier: string; receiptAt: string; rejectionReason: string }>({ transmissionStatus: 'sent', transmittedAt: '', sdiIdentifier: '', receiptAt: '', rejectionReason: '' })

  const apply = (next: InvoiceDetail) => {
    setDetail(next)
    setDraft(toDraft(next.invoice))
    onChanged()
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([api.invoice(id), api.billing()])
      .then(([d, m]) => {
        if (cancelled) return
        setDetail(d)
        setDraft(toDraft(d.invoice))
        setMeta(m)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const est = useMemo(() => (draft ? estimate(draft) : null), [draft])
  const back = () => navigate('proposals', { doc: 'invoices' })

  if (error && !detail) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={back}>
          Fatture
        </Button>
        <Card>
          <EmptyState title="Fattura unavailable" description={error} />
        </Card>
      </div>
    )
  }
  if (!detail || !draft || !meta || !est) return <Skeleton className="h-96" />

  const inv = detail.invoice
  const editable = inv.status === 'draft'
  const dirty = editable && JSON.stringify(toInput(draft)) !== JSON.stringify(toInput(toDraft(inv)))
  const money = (cents: number) => formatMoney(cents, editable ? draft.currency : inv.currency)
  const fiscallyIssued = inv.sdi.transmissionStatus === 'delivered' || inv.sdi.transmissionStatus === 'undeliverable'
  const setD = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(d => (d ? { ...d, [k]: v } : d))
  const setClient = <K extends keyof ClientBilling>(k: K, v: ClientBilling[K]) => setDraft(d => (d ? { ...d, client: { ...d.client, [k]: v } } : d))
  const setLine = (index: number, patch: Partial<LineDraft>) => setDraft(d => (d ? { ...d, lines: d.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) } : d))

  const run = async (label: string, fn: () => Promise<InvoiceDetail>, success: string) => {
    setBusy(label)
    try {
      apply(await fn())
      toast.success(success)
      return true
    } catch (err) {
      toast.error('Not done', (err as Error).message)
      return false
    } finally {
      setBusy(null)
    }
  }
  const save = () => run('save', () => api.updateInvoice(id, toInput(draft)), 'Draft saved')
  const finalize = async () => {
    if (dirty && !(await save())) return
    await run('finalize', () => api.finalizeInvoice(id), 'Finalized — number assigned')
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 sm:px-5 dark:border-white/[0.08] dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={back} className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white', focusRing)}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Fatture
          </button>
          <div className="ml-auto flex flex-wrap gap-2">
            {editable && (
              <>
                <Button size="sm" variant="secondary" loading={busy === 'save'} disabled={!dirty} onClick={save}>
                  Save draft
                </Button>
                <Button size="sm" variant="primary" icon={<Stamp className="h-3.5 w-3.5" />} loading={busy === 'finalize'} onClick={finalize}>
                  Finalize & number
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={<Download className="h-3.5 w-3.5" />}
              loading={busy === 'pdf'}
              onClick={async () => {
                setBusy('pdf')
                try {
                  const { downloadInvoicePdf } = await import('./invoicePdf')
                  await downloadInvoicePdf(inv)
                } catch (err) {
                  toast.error('PDF could not be created', (err as Error).message)
                } finally {
                  setBusy(null)
                }
              }}
            >
              Courtesy PDF
            </Button>
            {!editable && inv.status !== 'cancelled' && (
              <Button
                size="sm"
                variant="secondary"
                icon={<FileCode2 className="h-3.5 w-3.5" />}
                loading={busy === 'xml'}
                disabled={inv.xmlProblems.length > 0}
                onClick={async () => {
                  setBusy('xml')
                  try {
                    await api.downloadInvoiceXml(id)
                    apply(await api.invoice(id))
                  } catch (err) {
                    toast.error('XML not generated', err instanceof ApiError ? err.message : 'Please try again.')
                  } finally {
                    setBusy(null)
                  }
                }}
              >
                XML for SdI
              </Button>
            )}
            {inv.status === 'ready' && (
              <Button size="sm" variant="secondary" onClick={() => run('issued', () => api.invoiceStatus(id, 'issued'), 'Marked as issued externally')}>
                Mark issued
              </Button>
            )}
            {(inv.status === 'ready' || inv.status === 'issued') && (
              <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => setPaidOpen(true)}>
                Mark paid
              </Button>
            )}
            {inv.status === 'paid' && (
              <Button size="sm" variant="ghost" onClick={() => run('unpaid', () => api.invoiceStatus(id, 'issued'), 'Marked as not paid')}>
                Not paid
              </Button>
            )}
            {inv.status === 'ready' && inv.sdi.transmissionStatus === 'not_exported' && (
              <Button size="sm" variant="ghost" onClick={() => run('draft', () => api.invoiceStatus(id, 'draft'), 'Back to draft (number kept)')}>
                Back to draft
              </Button>
            )}
            {(inv.status === 'ready' || inv.status === 'issued') && (
              <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
            {editable && inv.number === null && (
              <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 dark:text-red-400" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Fattura {inv.number ?? <span className="text-slate-400">(draft)</span>}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {inv.client.name || 'Client not set'} · {formatDay(inv.issueDate)}
              {inv.dueDate ? ` · due ${formatDay(inv.dueDate)}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={INVOICE_STATUS_META[inv.status].tone}>{INVOICE_STATUS_META[inv.status].label}</Badge>
            {inv.due === 'overdue' && <Badge tone="red">Overdue</Badge>}
            <Badge tone={SDI_STATUS_META[inv.sdi.transmissionStatus].tone}>SdI · {SDI_STATUS_META[inv.sdi.transmissionStatus].label}</Badge>
            <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{money(editable ? est.total : inv.totals.total)}</span>
          </div>
        </div>
      </header>

      {!fiscallyIssued && inv.status !== 'cancelled' && (
        <div role="note" className="flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Not fiscally issued yet. An Italian Fattura is issued only when its XML is delivered through the Sistema di Interscambio (SdI); the PDF is a courtesy copy. Download the XML, send it via the Agenzia delle Entrate portal, PEC or your accountant, then record the SdI outcome below.
          </p>
        </div>
      )}
      {!editable && inv.xmlProblems.length > 0 && inv.status !== 'cancelled' && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">XML export is blocked for this Fattura</p>
            <ul className="mt-1 list-disc pl-4">
              {inv.xmlProblems.map(problem => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <fieldset disabled={!editable} className="min-w-0 space-y-5">
            <Card>
              <CardHeader title="Client billing details" description="The fiscal identity on this Fattura. It is a snapshot: later lead or project edits do not change it." />
              <div className="grid grid-cols-6 gap-3 px-5 pb-5 pt-3">
                <TextField label="Legal name" wrapperClassName="col-span-6" maxLength={80} value={draft.client.name} onChange={e => setClient('name', e.target.value)} />
                <TextField label="Partita IVA" wrapperClassName="col-span-6 sm:col-span-3" maxLength={11} value={draft.client.vatNumber} onChange={e => setClient('vatNumber', e.target.value.replace(/\s/g, ''))} />
                <TextField label="Codice fiscale" wrapperClassName="col-span-6 sm:col-span-3" maxLength={16} value={draft.client.taxCode} onChange={e => setClient('taxCode', e.target.value.toUpperCase())} />
                <TextField label="Address" wrapperClassName="col-span-6 sm:col-span-4" maxLength={60} value={draft.client.address} onChange={e => setClient('address', e.target.value)} />
                <TextField label="Number" wrapperClassName="col-span-2 sm:col-span-2" maxLength={8} value={draft.client.streetNumber} onChange={e => setClient('streetNumber', e.target.value)} />
                <TextField label="CAP" wrapperClassName="col-span-4 sm:col-span-2" maxLength={5} inputMode="numeric" value={draft.client.postalCode} onChange={e => setClient('postalCode', e.target.value)} />
                <TextField label="Comune" wrapperClassName="col-span-6 sm:col-span-2" maxLength={60} value={draft.client.city} onChange={e => setClient('city', e.target.value)} />
                <TextField label="Prov." wrapperClassName="col-span-3 sm:col-span-1" maxLength={2} value={draft.client.province} onChange={e => setClient('province', e.target.value.toUpperCase())} />
                <TextField label="Country" wrapperClassName="col-span-3 sm:col-span-1" maxLength={2} value={draft.client.country} onChange={e => setClient('country', e.target.value.toUpperCase())} />
                <TextField label="Codice destinatario" wrapperClassName="col-span-6 sm:col-span-3" maxLength={7} value={draft.client.recipientCode} onChange={e => setClient('recipientCode', e.target.value.toUpperCase())} hint="Leave empty to use PEC or 0000000." />
                <TextField label="PEC" type="email" wrapperClassName="col-span-6 sm:col-span-3" maxLength={200} value={draft.client.pec} onChange={e => setClient('pec', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Lines" description="Amounts excluding VAT. A 0% line needs a Natura code and its legal reference." />
              <div className="space-y-3 px-5 pb-4 pt-3">
                {draft.lines.map((line, index) => (
                  <div key={line.key} className="rounded-xl border border-slate-200/80 p-3 dark:border-white/[0.08]">
                    <div className="flex items-start gap-2">
                      <span className="mt-2 w-5 shrink-0 text-xs tabular-nums text-slate-400">{index + 1}</span>
                      <textarea
                        aria-label={`Line ${index + 1} description`}
                        value={line.description}
                        maxLength={1000}
                        rows={2}
                        onChange={e => setLine(index, { description: e.target.value })}
                        className={cx(fieldBase, 'min-h-[3.25rem] resize-y py-2')}
                      />
                      {editable && draft.lines.length > 1 && (
                        <button type="button" aria-label={`Remove line ${index + 1}`} onClick={() => setD('lines', draft.lines.filter((_, i) => i !== index))} className={cx('mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}>
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 pl-7 sm:grid-cols-6">
                      <TextField label="Qty" inputMode="decimal" value={line.quantity} onChange={e => setLine(index, { quantity: e.target.value })} />
                      <TextField label="Unit" maxLength={10} value={line.unit} onChange={e => setLine(index, { unit: e.target.value })} placeholder="ore" />
                      <TextField label="Price" inputMode="decimal" value={line.unitPrice} onChange={e => setLine(index, { unitPrice: e.target.value })} />
                      <TextField label="Disc. %" inputMode="decimal" value={line.discountPercent} onChange={e => setLine(index, { discountPercent: e.target.value })} />
                      <TextField label="VAT %" inputMode="decimal" value={line.vatRate} onChange={e => setLine(index, { vatRate: e.target.value })} />
                      <div className="flex flex-col justify-end pb-1.5 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{money(est.lines[index] ?? 0)}</div>
                    </div>
                    {num(line.vatRate) === 0 && (
                      <div className="mt-2 grid grid-cols-1 gap-2 pl-7 sm:grid-cols-2">
                        <div>
                          <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Natura</span>
                          <Select label={`Line ${index + 1} Natura`} value={line.vatNature} onChange={v => setLine(index, { vatNature: v })} options={[{ value: '', label: 'Choose why there is no VAT' }, ...Object.entries(meta.natures).map(([value, label]) => ({ value, label: `${value} — ${label}` }))]} />
                        </div>
                        <TextField label="Legal reference" maxLength={100} value={line.vatReference} onChange={e => setLine(index, { vatReference: e.target.value })} placeholder="e.g. Art. 1, c. 54-89, L. 190/2014" />
                      </div>
                    )}
                  </div>
                ))}
                {editable && (
                  <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setD('lines', [...draft.lines, blankLine()])}>
                    Add line
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment & notes" />
              <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2">
                <TextField label="Issue date" type="date" value={draft.issueDate} onChange={e => setD('issueDate', e.target.value)} />
                <TextField label="Due date" type="date" value={draft.dueDate} onChange={e => setD('dueDate', e.target.value)} />
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Payment method</span>
                  <Select label="Payment method" value={draft.paymentMode} onChange={v => setD('paymentMode', v)} options={Object.entries(meta.paymentModes).map(([value, label]) => ({ value, label: `${label} (${value})` }))} />
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Currency</span>
                  <Select label="Currency" value={draft.currency} onChange={v => setD('currency', v)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                </div>
                <TextField label="Payment terms" wrapperClassName="sm:col-span-2" maxLength={200} value={draft.paymentTerms} onChange={e => setD('paymentTerms', e.target.value)} />
                <TextArea label="Notes (causale)" className="sm:col-span-2" maxLength={1000} rows={2} value={draft.notes} onChange={e => setD('notes', e.target.value)} />
                <div className="sm:col-span-2">
                  <Switch checked={draft.stampDuty} onChange={v => setD('stampDuty', v)} label="Virtual stamp duty (bollo) € 2,00" description="Usually required when the VAT-exempt or out-of-scope amount exceeds € 77,47. Check with your accountant." />
                </div>
              </div>
            </Card>
          </fieldset>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Totals" description={editable ? 'Estimate — the server recalculates on save.' : 'Calculated by the server.'} />
            <dl className="space-y-1.5 px-5 pb-5 pt-3 text-sm">
              {(editable ? null : inv.vatSummary)?.map(group => (
                <div key={`${group.vatRate}-${group.vatNature}`} className="flex justify-between gap-3 text-xs text-slate-500">
                  <dt>{group.vatNature ? `${group.vatNature} (0%)` : `VAT ${group.vatRate}%`} on {money(group.taxable)}</dt>
                  <dd className="tabular-nums">{money(group.vat)}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Taxable</dt>
                <dd className="tabular-nums">{money(editable ? est.taxable : inv.totals.taxable)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">VAT</dt>
                <dd className="tabular-nums">{money(editable ? est.vat : inv.totals.vat)}</dd>
              </div>
              {(editable ? est.stamp : inv.totals.stampDuty) > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Stamp duty</dt>
                  <dd className="tabular-nums">{money(editable ? est.stamp : inv.totals.stampDuty)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 border-t border-slate-200 pt-2 text-base font-semibold dark:border-white/[0.1]">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(editable ? est.total : inv.totals.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="SdI transmission" description={SDI_STATUS_META[inv.sdi.transmissionStatus].hint} />
            <div className="space-y-3 px-5 pb-5 pt-3 text-sm">
              {inv.sdi.fileName && <p className="break-all font-mono text-xs text-slate-500">{inv.sdi.fileName}</p>}
              {inv.sdi.sdiIdentifier && <p className="text-xs text-slate-500">SdI identifier: {inv.sdi.sdiIdentifier}</p>}
              {inv.sdi.transmittedAt && <p className="text-xs text-slate-500">Sent {formatDay(inv.sdi.transmittedAt)}{inv.sdi.receiptAt ? ` · receipt ${formatDay(inv.sdi.receiptAt)}` : ''}</p>}
              {inv.sdi.rejectionReason && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-400/10 dark:text-red-300">{inv.sdi.rejectionReason}</p>}
              {inv.status !== 'draft' && inv.status !== 'cancelled' ? (
                <form
                  className="space-y-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]"
                  onSubmit={async event => {
                    event.preventDefault()
                    await run('sdi', () => api.recordSdi(id, { ...sdi, transmittedAt: sdi.transmittedAt || null, receiptAt: sdi.receiptAt || null }), 'SdI status recorded')
                  }}
                >
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Record what SdI reported</p>
                  <Select label="SdI result" value={sdi.transmissionStatus} onChange={v => setSdi(s => ({ ...s, transmissionStatus: v }))} options={SDI_OPTIONS} />
                  {sdi.transmissionStatus !== 'to_send' && (
                    <div className="grid grid-cols-2 gap-2">
                      <TextField label="Sent on" type="date" value={sdi.transmittedAt} onChange={e => setSdi(s => ({ ...s, transmittedAt: e.target.value }))} />
                      <TextField label="SdI identifier" maxLength={40} value={sdi.sdiIdentifier} onChange={e => setSdi(s => ({ ...s, sdiIdentifier: e.target.value }))} />
                    </div>
                  )}
                  {['delivered', 'rejected', 'undeliverable'].includes(sdi.transmissionStatus) && <TextField label="Receipt date" type="date" value={sdi.receiptAt} onChange={e => setSdi(s => ({ ...s, receiptAt: e.target.value }))} />}
                  {sdi.transmissionStatus === 'rejected' && <TextArea label="Rejection reason (from the notifica di scarto)" maxLength={500} rows={2} value={sdi.rejectionReason} onChange={e => setSdi(s => ({ ...s, rejectionReason: e.target.value }))} />}
                  <Button type="submit" size="sm" variant="secondary" className="w-full" loading={busy === 'sdi'}>
                    Save SdI status
                  </Button>
                </form>
              ) : (
                <p className="text-xs text-slate-400">{inv.status === 'draft' ? 'Finalize the Fattura to export its XML and track SdI.' : 'Cancelled.'}</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Linked records" />
            <div className="space-y-2 px-5 pb-5 pt-2 text-sm">
              {inv.project ? <RecordLink onClick={() => navigate('projects', { project: inv.project!.id, tab: 'finance' })} hint="Project">{inv.project.name}</RecordLink> : <p className="text-slate-400">No project linked</p>}
              {inv.proposal && <RecordLink onClick={() => navigate('proposals', { proposal: inv.proposal!.id })} hint="Preventivo">{inv.proposal.number}</RecordLink>}
              {inv.createdBy && <p className="text-xs text-slate-400">Created by {inv.createdBy.displayName}</p>}
            </div>
          </Card>

          <Card>
            <CardHeader title="Activity" />
            <ActivityTimeline activities={detail.activities} />
          </Card>
        </div>
      </div>

      <Modal
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        size="sm"
        title="Mark as paid"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPaidOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy === 'paid'}
              onClick={async () => {
                if (await run('paid', () => api.invoiceStatus(id, 'paid', { recordPayment: recordPayment && !!inv.projectId, paymentDate: paidDate, confirmOverpayment: true }), 'Marked as paid')) setPaidOpen(false)
              }}
            >
              Mark paid
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <TextField label="Payment received on" type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} />
          {inv.projectId ? (
            <Switch checked={recordPayment} onChange={setRecordPayment} label="Record this payment in the project" description="Adds the full amount to the project’s payments once. It is skipped if a payment linked to this Fattura already exists." />
          ) : (
            <p className="text-xs text-slate-500">This Fattura is not linked to a project, so no project payment is recorded.</p>
          )}
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        size="sm"
        title="Cancel this Fattura?"
        description={inv.status === 'issued' || fiscallyIssued ? 'An issued Fattura cannot be deleted. Issue a nota di credito (credit note) through your usual channel and describe it here.' : 'The number stays used and is never reassigned.'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              loading={busy === 'cancel'}
              onClick={async () => {
                if (await run('cancel', () => api.invoiceStatus(id, 'cancelled', { reason: cancelReason }), 'Fattura cancelled')) setCancelOpen(false)
              }}
            >
              Cancel Fattura
            </Button>
          </>
        }
      >
        <TextArea label={inv.status === 'issued' ? 'Credit note details (required)' : 'Reason (optional)'} maxLength={300} rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        danger
        title="Delete this draft?"
        description="Only unnumbered drafts can be deleted."
        confirmLabel="Delete draft"
        onConfirm={async () => {
          try {
            await api.deleteInvoice(id)
            toast.success('Draft deleted')
            onChanged()
            back()
          } catch (err) {
            toast.error('Not deleted', (err as Error).message)
          }
        }}
      />
    </div>
  )
}
