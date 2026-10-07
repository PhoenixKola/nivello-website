'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, Receipt } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDay, formatMoney } from '@/lib/admin/format'
import { useDebounced } from '@/lib/admin/hooks'
import type { InvoiceStatus, InvoiceSummary } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { EmptyState, Skeleton, Tabs, useShowMore } from '../../ui/Controls'
import { SearchInput, TextField } from '../../ui/Inputs'
import { Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'
import DocumentTabs from './DocumentTabs'
import InvoiceEditor from './InvoiceEditor'
import { INVOICE_STATUS_META, SDI_STATUS_META } from './meta'

type Filter = InvoiceStatus | 'all' | 'overdue'
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'ready', label: 'Ready' },
  { value: 'issued', label: 'Issued' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' }
]

/** Creates the draft for a `new=1` link (blank, from a project or from an accepted Preventivo), then opens it. */
function NewInvoice({ proposalId, projectId }: { proposalId: string | null; projectId: string | null }) {
  const { navigate } = useAdmin()
  const toast = useToast()
  const [mode, setMode] = useState<'items' | 'percent'>('items')
  const [percent, setPercent] = useState('30')
  const [busy, setBusy] = useState(false)
  const started = useRef(false)

  const create = useCallback(
    async (from?: { proposalId?: string; projectId?: string; mode?: 'items' | 'percent'; percent?: number }) => {
      setBusy(true)
      try {
        const detail = await api.createInvoice({}, from)
        toast.success('Draft Fattura created')
        navigate('proposals', { doc: 'invoices', invoice: detail.invoice.id })
      } catch (err) {
        toast.error('Could not create the Fattura', (err as Error).message)
        navigate('proposals', { doc: 'invoices' })
      } finally {
        setBusy(false)
      }
    },
    [navigate, toast]
  )

  useEffect(() => {
    if (proposalId || started.current) return
    started.current = true
    const timer = setTimeout(() => create(projectId ? { projectId } : undefined), 0)
    return () => clearTimeout(timer)
  }, [proposalId, projectId, create])

  if (!proposalId) return <Skeleton className="h-64" />
  return (
    <Modal
      open
      onClose={() => navigate('proposals', { proposal: proposalId })}
      size="sm"
      title="Create Fattura from Preventivo"
      description="The draft starts from the Preventivo. Every line, amount and client detail stays editable before you finalize it."
      footer={
        <>
          <Button variant="ghost" onClick={() => navigate('proposals', { proposal: proposalId })}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} disabled={mode === 'percent' && !(Number(percent.replace(',', '.')) > 0 && Number(percent.replace(',', '.')) <= 100)} onClick={() => create({ proposalId, mode, percent: Number(percent.replace(',', '.')) })}>
            Create draft
          </Button>
        </>
      }
    >
      <div className="space-y-3" role="radiogroup" aria-label="What to invoice">
        {(
          [
            ['items', 'All Preventivo items', 'Every non-optional line, with its price. Remove or adjust lines in the draft.'],
            ['percent', 'A percentage of the total', 'One line for a deposit or instalment, e.g. 30% on acceptance.']
          ] as const
        ).map(([value, label, hint]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cx('w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-colors', mode === value ? 'border-[var(--brand-blue)] bg-sky-50/60 dark:border-[var(--brand-gold)] dark:bg-white/[0.05]' : 'border-slate-200 hover:border-slate-300 dark:border-white/10', focusRing)}
          >
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
          </button>
        ))}
        {mode === 'percent' && <TextField label="Percentage of the Preventivo total" inputMode="decimal" value={percent} onChange={e => setPercent(e.target.value)} />}
      </div>
    </Modal>
  )
}

/** Fatture list and routing (Proposals area, `doc=invoices`). */
export default function Invoices() {
  const { route, navigate } = useAdmin()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [data, setData] = useState<{ invoices: InvoiceSummary[]; counts: Record<Filter, number>; billingReady: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const selected = route.params.get('invoice')
  const creating = route.params.get('new') === '1'
  const { visible, button: showMore } = useShowMore(data?.invoices ?? [])

  useEffect(() => {
    if (selected || creating) return
    let cancelled = false
    api
      .invoices(filter, debouncedQ)
      .then(result => {
        if (cancelled) return
        setData({ ...result, counts: { ...result.counts, all: Object.entries(result.counts).filter(([k]) => k !== 'overdue').reduce((sum, [, n]) => sum + n, 0) } })
        setError(null)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [filter, debouncedQ, version, selected, creating])

  if (selected && /^inv_[a-f0-9]{16}$/.test(selected)) {
    return <InvoiceEditor key={selected} id={selected} onChanged={() => setVersion(v => v + 1)} />
  }
  if (creating) {
    return <NewInvoice proposalId={route.params.get('proposal')} projectId={route.params.get('project')} />
  }

  return (
    <div className="space-y-5">
      <DocumentTabs value="invoices" />
      {data && !data.billingReady && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span className="flex-1">Complete Nivello’s billing profile before finalizing Fatture.</span>
          <Button size="sm" variant="secondary" onClick={() => navigate('settings', { tab: 'billing' })}>
            Settings → Billing
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs label="Fattura filter" value={filter} onChange={setFilter} tabs={FILTERS.map(f => ({ ...f, count: data?.counts[f.value] }))} />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={q} onChange={setQ} placeholder="Search number or client…" label="Search Fatture" className="min-w-0 flex-1 sm:w-64" />
          <Button variant="primary" size="sm" icon={<Receipt className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { doc: 'invoices', new: '1' })}>
            New Fattura
          </Button>
        </div>
      </div>
      <Card>
        {error && !data ? (
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Fatture unavailable" description={error} action={<Button onClick={() => setVersion(v => v + 1)}>Try again</Button>} />
        ) : !data ? (
          <Skeleton className="m-5 h-32" />
        ) : !data.invoices.length ? (
          <EmptyState icon={<Receipt className="h-5 w-5" />} title={q || filter !== 'all' ? 'No Fatture match' : 'No Fatture yet'} description={filter === 'all' && !q ? 'Create one from an accepted Preventivo, a project, or from scratch.' : undefined} />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {visible.map(inv => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => navigate('proposals', { doc: 'invoices', invoice: inv.id })}
                    className={cx('flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]', focusRing)}
                  >
                    <span className="w-24 shrink-0 font-mono text-xs text-slate-500 dark:text-slate-400">{inv.number ?? 'Draft'}</span>
                    <span className="min-w-0 flex-1 basis-48">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{inv.clientName || 'Client not set'}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {formatDay(inv.issueDate)}
                        {inv.dueDate ? ` · due ${formatDay(inv.dueDate)}` : ''} · SdI: {SDI_STATUS_META[inv.sdiStatus].label}
                      </span>
                    </span>
                    {inv.due === 'overdue' && <Badge tone="red">Overdue</Badge>}
                    <Badge tone={INVOICE_STATUS_META[inv.status].tone}>{INVOICE_STATUS_META[inv.status].label}</Badge>
                    <span className="w-28 text-right text-sm font-medium tabular-nums text-slate-800 dark:text-slate-100">{formatMoney(inv.total, inv.currency)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {showMore}
          </>
        )}
      </Card>
      <p className="text-xs text-slate-400">The fiscal Fattura is the XML delivered through the Sistema di Interscambio (SdI). Nivello prepares the XML and a courtesy PDF; send the XML via the Agenzia delle Entrate portal, PEC or your accountant, then record the outcome here.</p>
    </div>
  )
}
