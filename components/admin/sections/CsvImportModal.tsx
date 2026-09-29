'use client'

import { useRef, useState } from 'react'
import { FileUp, Upload } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatNumber } from '@/lib/admin/format'
import type { ImportPreview, ImportRow } from '@/lib/admin/types'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Select } from '../ui/Listbox'
import { Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx } from '../ui/styles'

const FIELD_LABELS: Record<string, string> = {
  companyName: 'Company name',
  category: 'Category',
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  email: 'Email',
  website: 'Website',
  instagram: 'Instagram',
  address: 'Address',
  city: 'City',
  country: 'Country',
  googleMapsUrl: 'Google Maps URL',
  contactPerson: 'Contact person',
  contactRole: 'Role',
  nextAction: 'Next action',
  note: 'Note',
  sourceId: 'Place ID'
}
const SKIP = '__skip__'

export default function CsvImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [counts, setCounts] = useState<ImportPreview['counts'] | null>(null)
  const [sample, setSample] = useState<ImportRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const reset = () => {
    setPreview(null)
    setMapping({})
    setCounts(null)
    setSample([])
    setError(null)
  }
  const close = () => {
    reset()
    onClose()
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('CSV files can be at most 5 MB.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await api.importPreview(file)
      setPreview(result)
      setMapping(result.mapping)
      setCounts(result.counts)
      setSample(result.sample)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const remap = async (header: string, field: string) => {
    if (!preview) return
    const next = { ...mapping }
    for (const [h, f] of Object.entries(next)) if (f === field && h !== header) delete next[h]
    if (field === SKIP) delete next[header]
    else next[header] = field
    setMapping(next)
    if (!Object.values(next).includes('companyName')) {
      setCounts(null)
      setSample([])
      return
    }
    try {
      const result = await api.importEvaluate(preview.token, next)
      setCounts(result.counts)
      setSample(result.sample)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const commit = async () => {
    if (!preview) return
    setBusy(true)
    try {
      const result = await api.importCommit(preview.token, mapping)
      toast.success(
        `${formatNumber(result.imported)} leads imported`,
        `${formatNumber(result.duplicate)} duplicates skipped${result.duplicateCandidates ? ` (${result.duplicateCandidates} sent to Duplicate review)` : ''}, ${formatNumber(result.invalid)} invalid rows.`
      )
      onImported()
      close()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const hasCompany = Object.values(mapping).includes('companyName')

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Import leads from CSV"
      description="The first row must contain column names. Rows are checked for duplicates before anything is imported."
      footer={
        preview ? (
          <>
            <Button variant="ghost" onClick={reset}>
              Choose another file
            </Button>
            <Button variant="primary" onClick={commit} loading={busy} disabled={!hasCompany || !counts?.new}>
              Import {counts ? formatNumber(counts.new) : 0} new leads
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
        )
      }
    >
      {!preview ? (
        <div
          onDragOver={event => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => {
            event.preventDefault()
            setDragging(false)
            upload(event.dataTransfer.files[0])
          }}
          className={cx('flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors', dragging ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)]/5 dark:border-[var(--brand-gold)]' : 'border-slate-200 dark:border-white/10')}
        >
          <FileUp aria-hidden="true" className="h-8 w-8 text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-100">Drop a CSV file here</p>
          <p className="mt-1 text-xs text-slate-500">Up to 5 MB and 10,000 rows. UTF-8 recommended.</p>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={event => upload(event.target.files?.[0])} aria-label="Choose CSV file" />
          <Button className="mt-4" variant="primary" icon={<Upload className="h-4 w-4" />} loading={busy} onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-slate-900 dark:text-white">{preview.fileName}</span>
            {counts ? (
              <>
                <Badge tone="slate">{formatNumber(counts.total)} rows</Badge>
                <Badge tone="green">{formatNumber(counts.new)} new</Badge>
                <Badge tone="gold">{formatNumber(counts.duplicate)} duplicates</Badge>
                <Badge tone="red">{formatNumber(counts.invalid)} invalid</Badge>
              </>
            ) : (
              <Badge tone="red">Map a column to Company name</Badge>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Column mapping</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {preview.headers.map(header => (
                <div key={header} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10">
                  <p className="mb-1.5 truncate text-xs font-medium text-slate-700 dark:text-slate-200" title={header}>
                    {header}
                  </p>
                  <Select
                    size="sm"
                    label={`Map column ${header}`}
                    value={mapping[header] ?? SKIP}
                    onChange={value => remap(header, value)}
                    options={[{ value: SKIP, label: 'Do not import' }, ...preview.fields.map(f => ({ value: f, label: FIELD_LABELS[f] ?? f }))]}
                  />
                </div>
              ))}
            </div>
          </div>

          {sample.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Preview (first {sample.length} rows)</h3>
              <div className="relative overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 dark:bg-white/[0.03] dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Row</th>
                      <th scope="col" className="px-3 py-2 font-medium">Result</th>
                      <th scope="col" className="px-3 py-2 font-medium">Company</th>
                      <th scope="col" className="px-3 py-2 font-medium">City</th>
                      <th scope="col" className="px-3 py-2 font-medium">Phone</th>
                      <th scope="col" className="px-3 py-2 font-medium">Email</th>
                      <th scope="col" className="px-3 py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {sample.map(row => (
                      <tr key={row.row}>
                        <td className="px-3 py-2 tabular-nums text-slate-400">{row.row}</td>
                        <td className="px-3 py-2">
                          <Badge tone={row.status === 'new' ? 'green' : row.status === 'duplicate' ? 'gold' : 'red'}>{row.status}</Badge>
                        </td>
                        <td className="max-w-[12rem] truncate px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{row.lead.companyName || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.lead.city || '—'}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.lead.phone || '—'}</td>
                        <td className="max-w-[10rem] truncate px-3 py-2 text-slate-600 dark:text-slate-300">{row.lead.email || '—'}</td>
                        <td className="max-w-[16rem] truncate px-3 py-2 text-slate-500 dark:text-slate-400" title={[row.reason, ...row.warnings].filter(Boolean).join('; ')}>
                          {[row.reason, ...row.warnings].filter(Boolean).join('; ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
