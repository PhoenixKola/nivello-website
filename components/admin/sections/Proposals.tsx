'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Copy, Download, Eye, FilePlus2, FileText, Link2, Plus, Printer, Send, Trash2, X } from 'lucide-react'
import { api, type ProposalInput } from '@/lib/admin/api'
import { CURRENCIES, PROPOSAL_STATUSES, PROPOSAL_STATUS_META, PROPOSAL_UNITS, STAGE_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import { useDebounced } from '@/lib/admin/hooks'
import type { ProposalDetail, ProposalStatus, ProposalSummary } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, Skeleton, Tabs, useShowMore } from '../ui/Controls'
import { SearchInput, TextArea, TextField } from '../ui/Inputs'
import { Select } from '../ui/Listbox'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, fieldBase, focusRing } from '../ui/styles'
import { ActivityTimeline, EntityPicker, RecordLink, type PickerKind } from './ops/shared'
import { computeDraft, fromDraft, newKey, toDraft, type Draft } from './proposals/model'
import ProposalDocument, { draftToProposal } from './proposals/ProposalDocument'

type Filter = ProposalStatus | 'all'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All proposals' },
  { value: 'draft', label: 'Drafts' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' }
]

export function ProposalStatusBadge({ status, pastValidity }: { status: ProposalStatus; pastValidity?: boolean }) {
  const meta = PROPOSAL_STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge tone={meta.tone}>{meta.label}</Badge>
      {pastValidity && <Badge tone="amber">Past validity</Badge>}
    </span>
  )
}

const DEFAULT_TERMS = {
  en: 'Prices exclude VAT unless stated. Work starts after the first payment. Each payment is due within 14 days of the invoice. Up to two rounds of revisions are included per deliverable; further changes are quoted separately. Hosting, domains and third-party licences are billed at cost unless stated otherwise.',
  it: 'I prezzi si intendono IVA esclusa salvo diversa indicazione. I lavori iniziano dopo il primo pagamento. Ogni pagamento è dovuto entro 14 giorni dalla fattura. Sono incluse fino a due revisioni per ogni consegna; ulteriori modifiche vengono quotate a parte. Hosting, domini e licenze di terze parti sono fatturati al costo salvo diversa indicazione.'
}

function NewProposalModal({ open, onClose, onCreated, prefill }: { open: boolean; onClose: () => void; onCreated: (id: string) => void; prefill: { leadId?: string; projectId?: string } }) {
  const toast = useToast()
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState<'en' | 'it'>('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await api.createProposal({
        title,
        language,
        terms: DEFAULT_TERMS[language],
        leadId: prefill.leadId ?? null,
        projectId: prefill.projectId ?? null,
        milestones: [
          {
            label: language === 'it' ? 'Acconto' : 'Deposit',
            due: language === 'it' ? "All'accettazione" : 'On acceptance',
            percent: 50
          },
          {
            label: language === 'it' ? 'Saldo' : 'Final payment',
            due: language === 'it' ? 'Al lancio' : 'On launch',
            percent: 50
          }
        ]
      })
      toast.success('Draft created', created.proposal.number)
      setTitle('')
      onCreated(created.proposal.id)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New proposal"
      description={prefill.projectId || prefill.leadId ? 'Linked to the record you came from; client details are filled in automatically.' : 'You can link a lead or project in the editor.'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="new-proposal" loading={busy}>
            Create draft
          </Button>
        </>
      }
    >
      <form id="new-proposal" onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Title" value={title} maxLength={160} onChange={e => setTitle(e.target.value)} placeholder="e.g. New bilingual website" autoFocus />
        <div>
          <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Document language</p>
          <Tabs
            label="Document language"
            value={language}
            onChange={setLanguage}
            tabs={[
              { value: 'en', label: 'English' },
              { value: 'it', label: 'Italiano' }
            ]}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function AcceptDialog({ open, hasProject, onClose, onConfirm }: { open: boolean; hasProject: boolean; onClose: () => void; onConfirm: (mode: 'none' | 'create' | 'update') => Promise<void> }) {
  const [mode, setMode] = useState<'none' | 'create' | 'update'>(hasProject ? 'update' : 'create')
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Mark as accepted?"
      description="Accepted proposals are kept exactly as sent. The linked lead is marked as won."
      confirmLabel="Mark accepted"
      onConfirm={() => onConfirm(mode)}
    >
      <fieldset className="space-y-2 text-sm">
        <legend className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Project</legend>
        {(hasProject
          ? [
              ['update', 'Update the linked project (value, stage → Approved)'],
              ['none', 'Leave the project as it is']
            ]
          : [
              ['create', 'Create a project in Approved'],
              ['none', 'No project yet']
            ]
        ).map(([value, label]) => (
          <label key={value} className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="accept-mode" value={value} checked={mode === value} onChange={() => setMode(value as typeof mode)} className="accent-[var(--brand-blue)]" />
            {label}
          </label>
        ))}
      </fieldset>
    </ConfirmDialog>
  )
}

function MoneyInput({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  return <input aria-label={label} inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder="0" className={cx(fieldBase, 'h-9 text-right tabular-nums', className)} />
}

function Editor({ id, onBack, onChanged }: { id: string; onBack: () => void; onChanged: () => void }) {
  const { navigate, openLead } = useAdmin()
  const toast = useToast()
  const [detail, setDetail] = useState<ProposalDetail | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [picker, setPicker] = useState<PickerKind | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [confirm, setConfirm] = useState<null | 'delete' | 'reject'>(null)
  const [pdfBusy, setPdfBusy] = useState(false)

  const apply = useCallback((d: ProposalDetail) => {
    setDetail(d)
    setDraft(toDraft(d.proposal))
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .proposal(id)
      .then(d => !cancelled && apply(d))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id, apply])

  const editable = detail ? ['draft', 'sent'].includes(detail.proposal.status) : false
  const dirty = !!detail && !!draft && JSON.stringify(fromDraft(draft)) !== JSON.stringify(fromDraft(toDraft(detail.proposal)))
  const preview = useMemo(() => (detail && draft ? draftToProposal(draft, detail.proposal) : null), [detail, draft])
  const totals = useMemo(() => (draft ? computeDraft(draft) : null), [draft])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = async (extra?: Partial<ProposalInput>) => {
    if (!draft) return false
    setSaving(true)
    setSaveError(null)
    try {
      apply(
        await api.updateProposal(id, {
          ...(fromDraft(draft) as ProposalInput),
          ...extra
        })
      )
      onChanged()
      return true
    } catch (err) {
      setSaveError((err as Error).message)
      toast.error('Not saved', (err as Error).message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const act = async (action: () => Promise<ProposalDetail>, success: string) => {
    try {
      apply(await action())
      toast.success(success)
      onChanged()
    } catch (err) {
      toast.error('Action failed', (err as Error).message)
    }
  }

  const setStatus = async (status: ProposalStatus) => {
    if (dirty && !(await save())) return
    await act(() => api.proposalStatus(id, status), `Proposal ${PROPOSAL_STATUS_META[status].label.toLowerCase()}`)
  }

  if (error && !detail) return <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Proposal unavailable" description={error} action={<Button onClick={onBack}>Back to proposals</Button>} />
  if (!detail || !draft || !preview || !totals) return <Skeleton className="h-96" />

  const p = detail.proposal
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => (d ? { ...d, [key]: value } : d))
  const setItem = (key: string, patch: Partial<Draft['items'][number]>) =>
    setDraft(d =>
      d
        ? {
            ...d,
            items: d.items.map(i => (i.key === key ? { ...i, ...patch } : i))
          }
        : d
    )
  const moveItem = (index: number, delta: number) =>
    setDraft(d => {
      if (!d) return d
      const items = [...d.items]
      const [item] = items.splice(index, 1)
      items.splice(index + delta, 0, item)
      return { ...d, items }
    })
  const setMilestone = (key: string, patch: Partial<Draft['milestones'][number]>) =>
    setDraft(d =>
      d
        ? {
            ...d,
            milestones: d.milestones.map(m => (m.key === key ? { ...m, ...patch } : m))
          }
        : d
    )
  const money = (cents: number) => formatMoney(cents, draft.currency)
  const milestonesOff = draft.milestones.length > 0 && Math.abs(totals.percentSum - 100) > 0.001

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={onBack}>
          Proposals
        </Button>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{p.number}</span>
            <ProposalStatusBadge status={p.status} pastValidity={p.status === 'sent' && !!p.validUntil && p.validUntil < new Date().toISOString().slice(0, 10)} />
            {dirty && <Badge tone="amber">Unsaved changes</Badge>}
          </p>
        </div>
        <Tabs
          label="Editor mode"
          value={mode}
          onChange={setMode}
          tabs={[
            { value: 'edit', label: editable ? 'Edit' : 'Details' },
            { value: 'preview', label: 'Preview' }
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {editable && (
          <Button variant="primary" size="sm" loading={saving} disabled={!dirty} onClick={() => save().then(ok => ok && toast.success('Proposal saved'))}>
            Save
          </Button>
        )}
        {p.status === 'draft' && (
          <Button size="sm" icon={<Send className="h-3.5 w-3.5" />} onClick={() => setStatus('sent')}>
            Mark as sent
          </Button>
        )}
        {p.status === 'sent' && (
          <>
            <Button size="sm" onClick={() => setAccepting(true)}>
              Accepted
            </Button>
            <Button size="sm" onClick={() => setConfirm('reject')}>
              Rejected
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus('expired')}>
              Expired
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStatus('draft')}>
              Back to draft
            </Button>
          </>
        )}
        {p.status === 'expired' && (
          <Button size="sm" onClick={() => setStatus('sent')}>
            Re-send
          </Button>
        )}
        <Button
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          loading={pdfBusy}
          onClick={async () => {
            setPdfBusy(true)
            try {
              const { downloadProposalPdf } = await import('./proposals/pdf')
              await downloadProposalPdf(preview)
            } catch (err) {
              toast.error('PDF could not be created', (err as Error).message)
            } finally {
              setPdfBusy(false)
            }
          }}
        >
          PDF
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Printer className="h-3.5 w-3.5" />}
          onClick={() => {
            setMode('preview')
            requestAnimationFrame(() => window.print())
          }}
        >
          Print
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<Copy className="h-3.5 w-3.5" />}
          onClick={async () => {
            try {
              const copy = await api.duplicateProposal(id)
              toast.success('Duplicated', copy.proposal.number)
              onChanged()
              navigate('proposals', { proposal: copy.proposal.id })
            } catch (err) {
              toast.error('Could not duplicate', (err as Error).message)
            }
          }}
        >
          Duplicate
        </Button>
        {p.status === 'draft' && (
          <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 dark:text-red-400" onClick={() => setConfirm('delete')}>
            Delete
          </Button>
        )}
      </div>
      {!editable && (
        <p className="text-sm text-slate-500 print:hidden dark:text-slate-400">
          This proposal is {PROPOSAL_STATUS_META[p.status].label.toLowerCase()} and kept as it was. Duplicate it to prepare a new version.
        </p>
      )}
      {saveError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden dark:bg-red-400/10 dark:text-red-300">
          {saveError}
        </p>
      )}

      {mode === 'preview' ? (
        <div data-print-root className="overflow-x-auto rounded-2xl bg-slate-200/70 p-3 sm:p-6 print:bg-white print:p-0 dark:bg-white/[0.04]">
          <ProposalDocument proposal={preview} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <fieldset disabled={!editable} className="min-w-0 space-y-4">
            <Card>
              <CardHeader title="Document" />
              <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2">
                <TextField label="Title" value={draft.title} maxLength={160} onChange={e => set('title', e.target.value)} className="sm:col-span-2" />
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="mb-1.5 block">Language</span>
                  <Select
                    label="Language"
                    value={draft.language}
                    onChange={v => set('language', v)}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'it', label: 'Italiano' }
                    ]}
                    disabled={!editable}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="mb-1.5 block">Currency</span>
                  <Select label="Currency" value={draft.currency} onChange={v => set('currency', v)} options={CURRENCIES.map(c => ({ value: c, label: c }))} disabled={!editable} />
                </label>
                <TextField label="Issue date" type="date" value={draft.issueDate} onChange={e => set('issueDate', e.target.value)} />
                <TextField label="Valid until" type="date" value={draft.validUntil} onChange={e => set('validUntil', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Client" />
              <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-3">
                <TextField label="Company" value={draft.clientCompany} maxLength={160} onChange={e => set('clientCompany', e.target.value)} />
                <TextField label="Contact name" value={draft.clientName} maxLength={120} onChange={e => set('clientName', e.target.value)} />
                <TextField label="Email" type="email" value={draft.clientEmail} maxLength={200} onChange={e => set('clientEmail', e.target.value)} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Line items" description="Totals are recalculated on the server when you save." />
              <div className="space-y-3 px-5 pb-5 pt-3">
                {draft.items.map((item, index) => (
                  <div key={item.key} className="rounded-xl border border-slate-200 p-3 dark:border-white/[0.08]">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          aria-label={`Line ${index + 1} description`}
                          value={item.description}
                          maxLength={300}
                          placeholder="Description"
                          onChange={e => setItem(item.key, { description: e.target.value })}
                          className={cx(fieldBase, 'h-9 font-medium')}
                        />
                        <textarea
                          aria-label={`Line ${index + 1} details`}
                          value={item.details}
                          maxLength={1000}
                          rows={2}
                          placeholder="Details (optional)"
                          onChange={e => setItem(item.key, { details: e.target.value })}
                          className={cx(fieldBase, 'resize-y py-2 text-sm')}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                          className={cx(
                            'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 disabled:cursor-default disabled:opacity-30 dark:hover:bg-white/[0.07]',
                            focusRing
                          )}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={index === draft.items.length - 1}
                          onClick={() => moveItem(index, 1)}
                          className={cx(
                            'flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 disabled:cursor-default disabled:opacity-30 dark:hover:bg-white/[0.07]',
                            focusRing
                          )}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove line"
                          onClick={() =>
                            set(
                              'items',
                              draft.items.filter(i => i.key !== item.key)
                            )
                          }
                          className={cx('flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 items-center gap-2 sm:grid-cols-[7rem_5rem_8rem_1fr]">
                      <Select
                        label={`Line ${index + 1} unit`}
                        size="sm"
                        value={item.unit}
                        onChange={unit =>
                          setItem(item.key, {
                            unit,
                            quantity: unit === 'fixed' ? '1' : item.quantity
                          })
                        }
                        options={PROPOSAL_UNITS}
                        disabled={!editable}
                      />
                      <input
                        aria-label={`Line ${index + 1} quantity`}
                        inputMode="decimal"
                        value={item.quantity}
                        disabled={item.unit === 'fixed'}
                        onChange={e => setItem(item.key, { quantity: e.target.value })}
                        className={cx(fieldBase, 'h-9 text-right tabular-nums disabled:opacity-50')}
                      />
                      <MoneyInput label={`Line ${index + 1} price`} value={item.unitPrice} onChange={unitPrice => setItem(item.key, { unitPrice })} />
                      <div className="flex items-center justify-end gap-3">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <input type="checkbox" checked={item.optional} onChange={e => setItem(item.key, { optional: e.target.checked })} className="accent-[var(--brand-blue)]" />
                          Optional
                        </label>
                        <span className="min-w-20 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{money(totals.items[index] ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {editable && draft.items.length < 60 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() =>
                      set('items', [
                        ...draft.items,
                        {
                          key: newKey(),
                          description: '',
                          details: '',
                          quantity: '1',
                          unit: 'fixed',
                          unitPrice: '',
                          optional: false
                        }
                      ])
                    }
                  >
                    Add line
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Discount and tax" />
              <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Discount</p>
                  <div className="flex items-center gap-2">
                    <div className="w-32 shrink-0">
                      <Select
                        label="Discount type"
                        size="sm"
                        value={draft.discountType}
                        onChange={v => set('discountType', v)}
                        options={[
                          { value: 'none', label: 'None' },
                          { value: 'percent', label: 'Percent' },
                          { value: 'amount', label: 'Amount' }
                        ]}
                        disabled={!editable}
                      />
                    </div>
                    {draft.discountType !== 'none' && (
                      <>
                        <div className="min-w-0 flex-1">
                          <MoneyInput label={draft.discountType === 'percent' ? 'Discount percent' : 'Discount amount'} value={draft.discountValue} onChange={v => set('discountValue', v)} />
                        </div>
                        <span className="w-8 shrink-0 text-sm text-slate-500">{draft.discountType === 'percent' ? '%' : draft.currency}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Tax (optional)</p>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <input aria-label="Tax label" value={draft.taxLabel} maxLength={40} onChange={e => set('taxLabel', e.target.value)} placeholder="VAT" className={cx(fieldBase, 'h-9')} />
                    </div>
                    <div className="w-20 shrink-0">
                      <input
                        aria-label="Tax rate percent"
                        inputMode="decimal"
                        value={draft.taxRate}
                        onChange={e => set('taxRate', e.target.value)}
                        placeholder="0"
                        className={cx(fieldBase, 'h-9 text-right tabular-nums')}
                      />
                    </div>
                    <span className="w-4 shrink-0 text-sm text-slate-500">%</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment milestones" description={milestonesOff ? undefined : 'Amounts follow the total; the last payment absorbs rounding.'} />
              <div className="space-y-2 px-5 pb-5 pt-3">
                {milestonesOff && (
                  <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                    Milestones add up to {totals.percentSum}% — they must total 100% to save.
                  </p>
                )}
                {draft.milestones.map((m, index) => (
                  <div
                    key={m.key}
                    className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 border-b border-slate-100 pb-2 last:border-0 sm:grid-cols-[1fr_1fr_5rem_7rem_auto] sm:border-0 sm:pb-0 dark:border-white/[0.06]"
                  >
                    <div className="col-span-3 sm:col-span-1">
                      <input
                        aria-label={`Milestone ${index + 1} label`}
                        value={m.label}
                        maxLength={120}
                        placeholder="Label"
                        onChange={e => setMilestone(m.key, { label: e.target.value })}
                        className={cx(fieldBase, 'h-9')}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <input
                        aria-label={`Milestone ${index + 1} timing`}
                        value={m.due}
                        maxLength={120}
                        placeholder="When (e.g. on launch)"
                        onChange={e => setMilestone(m.key, { due: e.target.value })}
                        className={cx(fieldBase, 'h-9')}
                      />
                    </div>
                    <span className="relative">
                      <input
                        aria-label={`Milestone ${index + 1} percent`}
                        inputMode="decimal"
                        value={m.percent}
                        onChange={e => setMilestone(m.key, { percent: e.target.value })}
                        className={cx(fieldBase, 'h-9 pr-6 text-right tabular-nums')}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                    </span>
                    <span className="text-right text-sm tabular-nums text-slate-700 dark:text-slate-200">{money(totals.milestones[index] ?? 0)}</span>
                    <button
                      type="button"
                      aria-label="Remove milestone"
                      onClick={() =>
                        set(
                          'milestones',
                          draft.milestones.filter(x => x.key !== m.key)
                        )
                      }
                      className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {editable && draft.milestones.length < 12 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() =>
                      set('milestones', [
                        ...draft.milestones,
                        {
                          key: newKey(),
                          label: '',
                          due: '',
                          percent: String(Math.max(0, Math.round((100 - totals.percentSum) * 100) / 100))
                        }
                      ])
                    }
                  >
                    Add milestone
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Text" description="Shown in the document. Leave a section empty to hide it." />
              <div className="space-y-3 px-5 pb-5 pt-3">
                <TextArea label="Introduction" value={draft.intro} maxLength={4000} onChange={e => set('intro', e.target.value)} />
                <TextArea label="Scope of work" value={draft.scope} maxLength={8000} onChange={e => set('scope', e.target.value)} className="min-h-[140px]" />
                <TextArea label="Assumptions" value={draft.assumptions} maxLength={4000} onChange={e => set('assumptions', e.target.value)} />
                <TextArea label="Terms" value={draft.terms} maxLength={6000} onChange={e => set('terms', e.target.value)} />
                <TextArea label="Internal notes (not in the document)" value={draft.notes} maxLength={4000} onChange={e => set('notes', e.target.value)} />
              </div>
            </Card>
          </fieldset>

          <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <Card>
              <CardHeader title="Totals" />
              <dl className="space-y-1.5 px-5 pb-5 pt-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Subtotal</dt>
                  <dd className="tabular-nums">{money(totals.subtotal)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">Discount</dt>
                    <dd className="tabular-nums">−{money(totals.discount)}</dd>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500 dark:text-slate-400">{draft.taxLabel || 'Tax'}</dt>
                    <dd className="tabular-nums">{money(totals.tax)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold dark:border-white/10">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(totals.total)}</dd>
                </div>
                {totals.optional > 0 && <p className="text-xs text-slate-500">+ {money(totals.optional)} in optional extras</p>}
              </dl>
            </Card>
            <Card>
              <CardHeader title="Linked records" />
              <div className="space-y-3 px-5 pb-5 pt-2 text-sm">
                <div>
                  <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Lead</p>
                  {detail.lead ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <RecordLink onClick={() => openLead(detail.lead!.id)} hint={STATUS_LABEL[detail.lead.status]}>
                        {detail.lead.companyName}
                      </RecordLink>
                      {editable && (
                        <button type="button" className={cx('cursor-pointer text-xs text-slate-500 hover:underline', focusRing)} onClick={() => save({ leadId: null })}>
                          Unlink
                        </button>
                      )}
                    </div>
                  ) : editable ? (
                    <Button size="sm" variant="ghost" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => setPicker('lead')}>
                      Link lead
                    </Button>
                  ) : (
                    <p className="text-slate-400">None</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Project</p>
                  {detail.project ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <RecordLink onClick={() => navigate('projects', { project: detail.project!.id })} hint={STAGE_LABEL[detail.project.stage]}>
                        {detail.project.name}
                      </RecordLink>
                      {editable && (
                        <button type="button" className={cx('cursor-pointer text-xs text-slate-500 hover:underline', focusRing)} onClick={() => save({ projectId: null })}>
                          Unlink
                        </button>
                      )}
                    </div>
                  ) : editable ? (
                    <Button size="sm" variant="ghost" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => setPicker('project')}>
                      Link project
                    </Button>
                  ) : (
                    <p className="text-slate-400">None</p>
                  )}
                </div>
              </div>
            </Card>
            <Card>
              <CardHeader title="Activity" />
              <ActivityTimeline activities={detail.activities} />
            </Card>
          </div>
        </div>
      )}

      {picker && (
        <EntityPicker
          kind={picker}
          open
          onClose={() => setPicker(null)}
          onPick={async pickedId => {
            await save(picker === 'lead' ? { leadId: pickedId } : { projectId: pickedId })
          }}
        />
      )}
      {accepting && (
        <AcceptDialog
          open
          hasProject={!!p.projectId}
          onClose={() => setAccepting(false)}
          onConfirm={async mode => {
            await act(() => api.proposalStatus(id, 'accepted', mode), 'Proposal accepted')
            setAccepting(false)
          }}
        />
      )}
      <ConfirmDialog
        open={confirm === 'reject'}
        onClose={() => setConfirm(null)}
        title="Mark as rejected?"
        description="The proposal stays in the history as rejected."
        confirmLabel="Mark rejected"
        onConfirm={async () => {
          await setStatus('rejected')
          setConfirm(null)
        }}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        danger
        title="Delete this draft?"
        description="The draft is removed permanently. Its number is not reused."
        confirmLabel="Delete draft"
        onConfirm={async () => {
          try {
            await api.deleteProposal(id)
            toast.success('Draft deleted')
            setConfirm(null)
            onChanged()
            onBack()
          } catch (err) {
            toast.error('Could not delete', (err as Error).message)
          }
        }}
      />
    </div>
  )
}

export default function Proposals() {
  const { route, navigate } = useAdmin()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [data, setData] = useState<{
    proposals: ProposalSummary[]
    counts: Record<ProposalStatus, number>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const selected = route.params.get('proposal')
  const creating = route.params.get('new') === '1'
  const prefill = {
    projectId: route.params.get('project') ?? undefined,
    leadId: route.params.get('lead') ?? undefined
  }

  useEffect(() => {
    let cancelled = false
    api
      .proposals(filter, debouncedQ)
      .then(result => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [filter, debouncedQ, version])

  const refresh = useCallback(() => setVersion(v => v + 1), [])
  const { visible, button: showMore } = useShowMore(data?.proposals ?? [])

  if (selected && /^prop_[a-f0-9]{16}$/.test(selected)) {
    return <Editor key={selected} id={selected} onBack={() => navigate('proposals')} onChanged={refresh} />
  }

  const counts = data?.counts
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Proposal filter"
          value={filter}
          onChange={setFilter}
          tabs={FILTERS.map(f => ({
            ...f,
            count: f.value === 'all' ? total : counts?.[f.value]
          }))}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={q} onChange={setQ} placeholder="Search number, title, client…" label="Search proposals" className="min-w-0 flex-1 sm:w-64" />
          <Button variant="primary" size="sm" icon={<FilePlus2 className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { new: '1' })}>
            New proposal
          </Button>
        </div>
      </div>
      <Card>
        {error && !data ? (
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Proposals unavailable" description={error} action={<Button onClick={refresh}>Try again</Button>} />
        ) : !data ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data.proposals.length ? (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title={q ? 'No proposals match your search' : filter === 'all' ? 'No proposals yet' : `No ${PROPOSAL_STATUSES.find(s => s.value === filter)?.label.toLowerCase()} proposals`}
            description={filter === 'all' && !q ? 'Create a quote with line items, milestones and terms, then download it as a branded PDF.' : undefined}
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {visible.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => navigate('proposals', { proposal: p.id })}
                    className={cx('flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]', focusRing)}
                  >
                    <span className="w-28 shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">{p.number}</span>
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{p.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {[p.clientCompany || p.clientName, `Issued ${formatDay(p.issueDate)}`].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <ProposalStatusBadge status={p.status} pastValidity={p.pastValidity} />
                    <span className="w-28 text-right text-sm font-medium tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(p.total, p.currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {showMore}
          </>
        )}
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-slate-400">
        <Eye aria-hidden="true" className="h-3.5 w-3.5" />
        Drafts and sent proposals can be edited; accepted, rejected and expired ones are kept as they were.
      </p>
      <NewProposalModal
        open={creating}
        prefill={prefill}
        onClose={() => navigate('proposals')}
        onCreated={id => {
          refresh()
          navigate('proposals', { proposal: id })
        }}
      />
    </div>
  )
}
