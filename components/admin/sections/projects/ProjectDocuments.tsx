'use client'

import { FileCode2, FilePlus2, FileText, Receipt } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { PROPOSAL_STATUS_META } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import type { ProjectDetail } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState } from '../../ui/Controls'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'
import { INVOICE_STATUS_META, SDI_STATUS_META } from '../invoices/meta'

type Row = { key: string; kind: 'preventivo' | 'fattura'; number: string; status: { label: string; tone: 'slate' | 'blue' | 'green' | 'red' | 'amber' | 'indigo' | 'teal' }; sub?: string; date: string; amount: string; open: () => void; xml?: () => void }

/** Every document linked to the project, read from the existing Preventivi and Fatture stores. */
export default function ProjectDocuments({ detail }: { detail: ProjectDetail }) {
  const { navigate } = useAdmin()
  const toast = useToast()
  const p = detail.project
  const rows: Row[] = [
    ...detail.proposals.map(prop => ({
      key: prop.id,
      kind: 'preventivo' as const,
      number: prop.number,
      status: PROPOSAL_STATUS_META[prop.status],
      sub: prop.title,
      date: prop.issueDate,
      amount: formatMoney(prop.total, prop.currency),
      open: () => navigate('proposals', { proposal: prop.id })
    })),
    ...detail.invoices.map(inv => ({
      key: inv.id,
      kind: 'fattura' as const,
      number: inv.number ?? 'Draft',
      status: inv.due === 'overdue' ? { label: 'Overdue', tone: 'red' as const } : INVOICE_STATUS_META[inv.status],
      sub: `SdI: ${SDI_STATUS_META[inv.sdiStatus].label}`,
      date: inv.issueDate,
      amount: formatMoney(inv.total, inv.currency),
      open: () => navigate('proposals', { doc: 'invoices', invoice: inv.id }),
      xml:
        inv.status === 'draft' || inv.status === 'cancelled'
          ? undefined
          : async () => {
              try {
                await api.downloadInvoiceXml(inv.id)
              } catch (err) {
                toast.error('XML not available', (err as Error).message)
              }
            }
    }))
  ].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card>
      <CardHeader
        title="Documents"
        description="Preventivi and Fatture linked to this project. Files are generated and downloaded from each document."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<FilePlus2 className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { new: '1', project: p.id })}>
              New Preventivo
            </Button>
            <Button size="sm" variant="secondary" icon={<Receipt className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { doc: 'invoices', new: '1', project: p.id })}>
              New Fattura
            </Button>
          </div>
        }
      />
      {!rows.length ? (
        <EmptyState icon={<FileText className="h-5 w-5" />} title="No documents yet" description="Create a Preventivo, or a Fattura once work is agreed." />
      ) : (
        <ul className="divide-y divide-slate-100 pb-2 pt-2 dark:divide-white/[0.06]">
          {rows.map(row => (
            <li key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
              <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', row.kind === 'fattura' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300')}>
                {row.kind === 'fattura' ? <Receipt aria-hidden="true" className="h-4 w-4" /> : <FileText aria-hidden="true" className="h-4 w-4" />}
              </span>
              <button type="button" onClick={row.open} className={cx('min-w-0 flex-1 basis-48 cursor-pointer text-left', focusRing)}>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {row.kind === 'fattura' ? 'Fattura' : 'Preventivo'} {row.number}
                </span>
                {row.sub && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{row.sub}</span>}
              </button>
              <Badge tone={row.status.tone}>{row.status.label}</Badge>
              <span className="w-24 text-xs text-slate-500 dark:text-slate-400">{formatDay(row.date)}</span>
              <span className="w-28 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{row.amount}</span>
              <span className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={row.open}>
                  Open
                </Button>
                {row.xml && (
                  <Button size="sm" variant="ghost" icon={<FileCode2 className="h-3.5 w-3.5" />} onClick={row.xml}>
                    XML
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
