'use client'

import { useEffect, useState } from 'react'
import { Copy, GitMerge, X } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDateTime } from '@/lib/admin/format'
import type { DuplicateItem } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState, Pagination, Skeleton } from '../ui/Controls'
import { useToast } from '../ui/Toast'
import { cx } from '../ui/styles'

const FIELD_LABELS: Record<string, string> = {
  phone: 'Phone',
  email: 'Email',
  website: 'Website',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  address: 'Address',
  category: 'Category',
  googleMapsUrl: 'Google Maps',
  rating: 'Rating',
  reviewCount: 'Reviews',
  latitude: 'Latitude',
  longitude: 'Longitude',
  sourceId: 'Place ID'
}

const show = (value: unknown) => (value === null || value === undefined || value === '' ? '—' : String(value))

function DuplicateCard({ item, onResolved }: { item: DuplicateItem; onResolved: () => void }) {
  const toast = useToast()
  const { openLead, notifyChanged } = useAdmin()
  const [fields, setFields] = useState<string[]>(item.fills)
  const [busy, setBusy] = useState<'merge' | 'dismiss' | null>(null)
  const rows = Object.keys(FIELD_LABELS).filter(f => show(item.existing[f as keyof typeof item.existing]) !== '—' || show(item.candidate[f as keyof typeof item.candidate]) !== '—')

  const merge = async () => {
    setBusy('merge')
    try {
      const result = await api.mergeDuplicate(item.id, fields)
      toast.success('Merged', result.merged.length ? `Updated: ${result.merged.map(f => FIELD_LABELS[f] ?? f).join(', ')}.` : 'No fields were changed.')
      notifyChanged()
      onResolved()
    } catch (err) {
      toast.error('Merge failed', (err as Error).message)
    } finally {
      setBusy(null)
    }
  }
  const dismiss = async () => {
    setBusy('dismiss')
    try {
      await api.dismissDuplicate(item.id)
      onResolved()
    } catch (err) {
      toast.error('Could not dismiss', (err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
        <div className="min-w-0">
          <button type="button" onClick={() => openLead(item.existing.id)} className="cursor-pointer truncate text-left text-sm font-semibold text-slate-900 hover:underline dark:text-white">
            {item.existing.companyName}
          </button>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Badge tone={item.reason === 'Same phone number' ? 'amber' : 'slate'}>{item.reason}</Badge>
            <span>
              From {item.source === 'csv' ? 'CSV import' : 'discovery'} · {formatDateTime(item.createdAt)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={<X className="h-3.5 w-3.5" />} onClick={dismiss} loading={busy === 'dismiss'}>
            Dismiss
          </Button>
          <Button size="sm" variant="primary" icon={<GitMerge className="h-3.5 w-3.5" />} onClick={merge} loading={busy === 'merge'}>
            {fields.length ? `Merge ${fields.length} field${fields.length > 1 ? 's' : ''}` : 'Mark reviewed'}
          </Button>
        </div>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            <tr>
              <th scope="col" className="w-12 px-4 py-2">
                <span className="sr-only">Merge</span>
              </th>
              <th scope="col" className="px-2 py-2">Field</th>
              <th scope="col" className="px-2 py-2">Existing lead</th>
              <th scope="col" className="px-2 py-2">Incoming candidate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            <tr>
              <td className="px-4 py-2" />
              <td className="px-2 py-2 text-xs text-slate-500">Company</td>
              <td className="px-2 py-2 font-medium text-slate-800 dark:text-slate-100">{item.existing.companyName}</td>
              <td className="px-2 py-2 text-slate-700 dark:text-slate-200">{show(item.candidate.companyName)}</td>
            </tr>
            {rows.map(field => {
              const existing = show(item.existing[field as keyof typeof item.existing])
              const candidate = show(item.candidate[field as keyof typeof item.candidate])
              const fills = item.fills.includes(field)
              const differs = candidate !== '—' && candidate !== existing
              const checked = fields.includes(field)
              return (
                <tr key={field} className={cx(fills && 'bg-emerald-50/60 dark:bg-emerald-400/[0.05]')}>
                  <td className="px-4 py-2">
                    {differs && (
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setFields(list => (checked ? list.filter(f => f !== field) : [...list, field]))}
                        aria-label={`Use candidate ${FIELD_LABELS[field]}`}
                        className="h-4 w-4 cursor-pointer accent-[var(--brand-blue)] dark:accent-[var(--brand-gold)]"
                      />
                    )}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">{FIELD_LABELS[field]}</td>
                  <td className="max-w-[16rem] truncate px-2 py-2 text-slate-700 dark:text-slate-200" title={existing}>
                    {existing}
                  </td>
                  <td className="max-w-[16rem] truncate px-2 py-2 text-slate-700 dark:text-slate-200" title={candidate}>
                    {candidate}
                    {fills && <span className="ml-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">fills a gap</span>}
                    {!fills && differs && existing !== '—' && <span className="ml-2 text-[11px] font-medium text-amber-700 dark:text-amber-300">would replace</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 pb-3 pt-2 text-xs text-slate-500 dark:text-slate-400">Only ticked fields change. Status, notes, tags and other CRM fields are never touched.</p>
    </Card>
  )
}

export default function DuplicateReview() {
  const { refreshHealth } = useAdmin()
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<{ items: DuplicateItem[]; pages: number; total: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    api.duplicates(page).then(result => {
      if (cancelled) return
      setData(result)
      if (page > result.pages) setPage(result.pages)
    })
    return () => {
      cancelled = true
    }
  }, [page, reload])

  if (!data) return <Skeleton className="h-64" />
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data.total} possible duplicate{data.total === 1 ? '' : 's'} to review. Green rows are values the candidate could fill in.
        </p>
        {data.pages > 1 && <Pagination page={page} pages={data.pages} onPage={setPage} label="Duplicate pages" />}
      </div>
      {data.items.length === 0 ? (
        <Card>
          <EmptyState icon={<Copy className="h-5 w-5" />} title="Nothing to review" description="When discovery or CSV import finds a business you already have, it appears here if it could add information." />
        </Card>
      ) : (
        data.items.map(item => (
          <DuplicateCard
            key={item.id}
            item={item}
            onResolved={() => {
              setReload(r => r + 1)
              refreshHealth()
            }}
          />
        ))
      )}
    </div>
  )
}
