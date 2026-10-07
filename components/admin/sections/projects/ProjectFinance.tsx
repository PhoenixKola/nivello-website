'use client'

import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { formatDay, formatMoney } from '@/lib/admin/format'
import type { PaymentMethod, ProjectDetail, ProjectFinance as Finance, ProjectPayment } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Progress } from '../../ui/Controls'
import { TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'
import { PAYMENT_METHOD_LABEL } from '../invoices/meta'

const today = () => new Date().toISOString().slice(0, 10)
const newRequestId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)

/** Contracted / invoiced / paid / outstanding, with payment progress based on money actually received. */
export function FinanceSummary({ finance }: { finance: Finance }) {
  const money = (cents: number | null) => (cents === null ? '—' : formatMoney(cents, finance.currency))
  const items: { label: string; value: string; hint?: string; tone?: string }[] = [
    { label: 'Contracted', value: money(finance.contracted), hint: finance.contractedSource === 'proposal' ? `From accepted ${finance.acceptedProposal?.number}` : finance.contractedSource === 'project' ? 'Project value' : 'Set a project value' },
    { label: 'Invoiced', value: money(finance.invoiced), hint: `${finance.invoiceCount} Fattur${finance.invoiceCount === 1 ? 'a' : 'e'}` },
    { label: 'Paid', value: money(finance.paid), hint: 'Payments received', tone: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Outstanding', value: money(finance.outstanding), hint: finance.overpaid ? 'Paid more than contracted' : 'Contracted − paid', tone: finance.overpaid ? 'text-amber-600 dark:text-amber-300' : undefined }
  ]
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(item => (
          <div key={item.label} className="rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]">
            <dt className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className={cx('mt-1 truncate font-semibold tabular-nums text-slate-900 dark:text-white', item.tone)}>{item.value}</dd>
            {item.hint && <dd className="truncate text-[11px] text-slate-400">{item.hint}</dd>}
          </div>
        ))}
      </dl>
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Payment progress</span>
          <span className="font-medium tabular-nums">{finance.paidPercent === null ? '—' : `${finance.paidPercent}% paid`}</span>
        </div>
        <Progress value={finance.paidPercent ?? 0} max={100} label="Payment progress" tone={finance.overpaid ? 'amber' : 'green'} />
      </div>
    </div>
  )
}

type Draft = { amount: string; date: string; method: PaymentMethod; reference: string; note: string; linkedInvoiceId: string }
const blankDraft = (): Draft => ({ amount: '', date: today(), method: 'bank_transfer', reference: '', note: '', linkedInvoiceId: '' })

export default function ProjectFinance({ detail, onChange }: { detail: ProjectDetail; onChange: (detail: ProjectDetail) => void }) {
  const { people } = useAdmin()
  const toast = useToast()
  const p = detail.project
  const [editing, setEditing] = useState<ProjectPayment | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(blankDraft)
  const [requestId, setRequestId] = useState('')
  const [busy, setBusy] = useState(false)
  const [overpay, setOverpay] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ProjectPayment | null>(null)

  const open = (payment?: ProjectPayment) => {
    setEditing(payment ?? 'new')
    setOverpay(null)
    // One request id per opened form: double submits and retries record the payment once.
    setRequestId(newRequestId())
    setDraft(payment ? { amount: String(payment.amount / 100), date: payment.date, method: payment.method, reference: payment.reference, note: payment.note, linkedInvoiceId: payment.linkedInvoiceId ?? '' } : blankDraft())
  }

  const submit = async (event?: FormEvent, confirmOverpayment = false) => {
    event?.preventDefault()
    if (busy || !editing) return
    setBusy(true)
    const payload = { amount: draft.amount.replace(',', '.'), date: draft.date, method: draft.method, reference: draft.reference, note: draft.note, linkedInvoiceId: draft.linkedInvoiceId || null }
    try {
      const next = editing === 'new' ? await api.createPayment(p.id, payload, requestId, confirmOverpayment) : await api.updatePayment(p.id, editing.id, payload, confirmOverpayment)
      onChange(next)
      setEditing(null)
      setOverpay(null)
      toast.success(editing === 'new' ? 'Payment recorded' : 'Payment updated')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'OVERPAYMENT') setOverpay(err.message)
      else toast.error('Payment not saved', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const amountValid = Number(draft.amount.replace(',', '.')) > 0
  const recorder = (id: string | null) => people.find(u => u.id === id)?.displayName

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Financial overview" description="Quoted, invoiced and paid are different numbers. Progress follows money actually received." />
        <div className="px-5 pb-5 pt-3">
          <FinanceSummary finance={p.finance} />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Payments received"
          description="Record each payment from the client as it arrives."
          actions={
            <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open()}>
              Record payment
            </Button>
          }
        />
        {!p.payments.length ? (
          <EmptyState icon={<Wallet className="h-5 w-5" />} title="No payments yet" description="Record a payment when money is received. Creating a Fattura does not count as payment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                  <th scope="col" className="px-5 py-2">Date</th>
                  <th scope="col" className="px-3 py-2">Method / reference</th>
                  <th scope="col" className="px-3 py-2">Recorded by</th>
                  <th scope="col" className="px-3 py-2 text-right">Amount</th>
                  <th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {p.payments.map(payment => (
                  <tr key={payment.id}>
                    <td className="whitespace-nowrap px-5 py-2.5 text-slate-700 dark:text-slate-200">{formatDay(payment.date)}</td>
                    <td className="px-3 py-2.5">
                      <span className="block text-slate-800 dark:text-slate-100">{PAYMENT_METHOD_LABEL[payment.method]}</span>
                      {(payment.reference || payment.note) && <span className="block text-xs text-slate-500">{[payment.reference, payment.note].filter(Boolean).join(' · ')}</span>}
                      {payment.linkedInvoiceId && <span className="block text-xs text-slate-500">Fattura {detail.invoices.find(i => i.id === payment.linkedInvoiceId)?.number ?? ''}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{recorder(payment.recordedByUserId) ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(payment.amount, payment.currency)}</td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right">
                      <button type="button" aria-label={`Edit payment of ${formatMoney(payment.amount, payment.currency)}`} onClick={() => open(payment)} className={cx('inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07]', focusRing)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" aria-label={`Delete payment of ${formatMoney(payment.amount, payment.currency)}`} onClick={() => setDeleting(payment)} className={cx('inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-white/[0.1]">
                  <td colSpan={3} className="px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500">Total paid</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{formatMoney(p.finance.paid, p.currency)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing === 'new' ? 'Record a payment' : 'Edit payment'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            {overpay ? (
              <Button variant="primary" loading={busy} onClick={() => submit(undefined, true)}>
                Record anyway
              </Button>
            ) : (
              <Button variant="primary" type="submit" form="payment-form" loading={busy} disabled={!amountValid || !draft.date}>
                {editing === 'new' ? 'Record payment' : 'Save'}
              </Button>
            )}
          </>
        }
      >
        <form id="payment-form" onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TextField label={`Amount (${p.currency})`} inputMode="decimal" required value={draft.amount} onChange={e => { setOverpay(null); setDraft(d => ({ ...d, amount: e.target.value })) }} placeholder="2000" />
            <TextField label="Date received" type="date" required value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Method</span>
            <Select label="Method" value={draft.method} onChange={v => setDraft(d => ({ ...d, method: v }))} options={(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map(value => ({ value, label: PAYMENT_METHOD_LABEL[value] }))} />
          </div>
          <TextField label="Reference (optional)" maxLength={120} value={draft.reference} onChange={e => setDraft(d => ({ ...d, reference: e.target.value }))} placeholder="e.g. CRO / transfer reference" />
          {detail.invoices.length > 0 && (
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Linked Fattura (optional)</span>
              <Select
                label="Linked Fattura"
                value={draft.linkedInvoiceId}
                onChange={v => setDraft(d => ({ ...d, linkedInvoiceId: v }))}
                options={[{ value: '', label: 'None' }, ...detail.invoices.filter(i => i.number).map(i => ({ value: i.id, label: `${i.number} · ${formatMoney(i.total, i.currency)}` }))]}
              />
            </div>
          )}
          <TextField label="Note (optional)" maxLength={500} value={draft.note} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} />
          {overpay && (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              {overpay}
            </p>
          )}
          <p className="text-xs text-slate-400">Do not enter card numbers or other banking secrets here.</p>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        danger
        title={`Delete the payment of ${deleting ? formatMoney(deleting.amount, deleting.currency) : ''}?`}
        description="The paid total and progress are recalculated. The deletion is recorded in the project activity."
        confirmLabel="Delete payment"
        onConfirm={async () => {
          if (!deleting) return
          try {
            onChange(await api.deletePayment(p.id, deleting.id))
            setDeleting(null)
            toast.success('Payment deleted')
          } catch (err) {
            toast.error('Not deleted', (err as Error).message)
          }
        }}
      />
    </div>
  )
}
