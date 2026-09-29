'use client'

import { useState } from 'react'
import { AlertTriangle, ExternalLink, Globe2, RefreshCw, Square, Trash2, Users } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { LANGUAGE_LABEL } from '@/lib/admin/constants'
import { formatDateTime, formatDuration, formatNumber, formatRelative, formatShortDate } from '@/lib/admin/format'
import { useNow } from '@/lib/admin/hooks'
import type { Batch } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { BatchStatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Progress } from '../ui/Controls'
import { ConfirmDialog } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx } from '../ui/styles'

export function batchTitle(batch: Batch) {
  return `${batch.params.category || 'All categories'} · ${batch.params.city}`
}

export function batchChipLabel(batch: Pick<Batch, 'params' | 'createdAt'>) {
  return `${batch.params.category || 'All categories'} · ${batch.params.city} · ${formatShortDate(batch.createdAt)}`
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={cx('text-lg font-semibold tabular-nums text-slate-900 dark:text-white', tone)}>{formatNumber(value)}</dd>
    </div>
  )
}

export default function DiscoveryCard({ batch, compact, onChanged }: { batch: Batch; compact?: boolean; onChanged?: () => void }) {
  const { navigate, trackBatch, notifyChanged } = useAdmin()
  const toast = useToast()
  const now = useNow(1000)
  const [confirmStop, setConfirmStop] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteLeads, setDeleteLeads] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const c = batch.counters
  const target = batch.params.target
  const open = batch.isOpen
  const active = batch.status === 'dispatching' || batch.status === 'working' || batch.status === 'starting' || batch.status === 'retrying'
  const started = batch.startedAt ? Date.parse(batch.startedAt) : null
  const finished = batch.finishedAt ? Date.parse(batch.finishedAt) : null
  const totalRuntime = started ? (finished ?? (now || started)) - started : null
  const pass = batch.currentPass
  const passRuntime = pass?.startedAt && open ? (now || Date.parse(pass.startedAt)) - Date.parse(pass.startedAt) : null
  const shownPass = pass ?? batch.lastPass
  const progressTone = batch.status === 'complete' ? 'green' : batch.status === 'error' ? 'red' : batch.status === 'exhausted' ? 'amber' : batch.status === 'stopped' ? 'slate' : 'brand'

  const stop = async () => {
    try {
      const result = await api.stopBatch(batch.id)
      trackBatch(result.batch)
      notifyChanged()
      onChanged?.()
      toast.success('Discovery stopped', `${formatNumber(result.batch.counters.imported)} imported leads kept.`)
      setConfirmStop(false)
    } catch (error) {
      toast.error('Could not stop discovery', (error as Error).message)
    }
  }
  const refresh = async () => {
    setRefreshing(true)
    try {
      const result = await api.reconcileBatch(batch.id)
      trackBatch(result.batch)
      onChanged?.()
    } catch (error) {
      toast.error('Refresh failed', (error as Error).message)
    } finally {
      setRefreshing(false)
    }
  }
  const remove = async () => {
    try {
      const result = await api.deleteBatch(batch.id, deleteLeads)
      notifyChanged()
      onChanged?.()
      toast.success('Discovery deleted', result.deletedLeads ? `${formatNumber(result.deletedLeads)} leads deleted too.` : 'Imported leads were kept.')
      setConfirmDelete(false)
    } catch (error) {
      toast.error('Could not delete', (error as Error).message)
    }
  }

  return (
    <Card className="overflow-hidden" role="group" aria-label={`Discovery ${batchTitle(batch)}`}>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{batchTitle(batch)}</h3>
              <BatchStatusBadge status={batch.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {batch.params.country} · {formatDateTime(batch.createdAt)} · {batch.params.languages.map(l => LANGUAGE_LABEL[l]).join(', ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="secondary" icon={<Users className="h-3.5 w-3.5" />} onClick={() => navigate('leads', { batch: batch.id })}>
              View leads
            </Button>
            {open ? (
              <>
                <Button size="sm" variant="ghost" icon={<RefreshCw className={cx('h-3.5 w-3.5', refreshing && 'animate-spin')} />} onClick={refresh} disabled={refreshing}>
                  Refresh
                </Button>
                <Button size="sm" variant="danger" icon={<Square className="h-3 w-3 fill-current" />} onClick={() => setConfirmStop(true)}>
                  Stop
                </Button>
              </>
            ) : (
              !compact && (
                <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmDelete(true)} aria-label={`Delete discovery ${batchTitle(batch)}`}>
                  Delete
                </Button>
              )
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">{formatNumber(c.imported)}</span>
              <span className="text-slate-400"> / {formatNumber(target)}</span> qualified leads imported
            </p>
            <p className="text-xs tabular-nums text-slate-500">{Math.floor((Math.min(c.imported, target) / target) * 100)}%</p>
          </div>
          <Progress value={c.imported} max={target} active={active} tone={progressTone} label={`${c.imported} of ${target} qualified leads imported`} />
          {batch.status === 'exhausted' && <p className="mt-2 text-xs font-medium text-orange-700 dark:text-orange-300">Search plan exhausted before reaching the target.</p>}
          {batch.status === 'stopped' && <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">Stopped. {formatNumber(c.imported)} imported leads kept.</p>}
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Imported" value={c.imported} tone="text-emerald-600 dark:text-emerald-400" />
          <Stat label="Checked" value={c.checked} />
          <Stat label="Duplicates" value={c.duplicates} />
          <Stat label="Rejected" value={c.rejected} />
        </dl>
        {c.rejected > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Rejected: {c.rejectedWebsite} had a website · {c.rejectedPhone} missing phone · {c.rejectedInvalid} invalid record
          </p>
        )}

        {!compact && (
          <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs dark:bg-white/[0.03] sm:grid-cols-2">
            <p className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
              <Globe2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {shownPass ? (
                  <>
                    {pass ? 'Pass' : 'Last pass'} {shownPass.index + 1}/{batch.planLength} · {LANGUAGE_LABEL[shownPass.lang]} · “{shownPass.query}”
                  </>
                ) : open ? (
                  'Waiting for the first pass'
                ) : (
                  `${batch.passesCompleted} passes completed`
                )}
              </span>
            </p>
            <p className="tabular-nums text-slate-500 sm:text-right dark:text-slate-400">
              Runtime {totalRuntime !== null ? formatDuration(totalRuntime) : '—'}
              {passRuntime !== null && ` · this pass ${formatDuration(passRuntime)}`}
            </p>
          </div>
        )}

        {open && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {batch.status === 'queued'
                ? 'Waiting for the current discovery to finish.'
                : batch.status === 'dispatching'
                  ? batch.github.dispatchAttempts > 0
                    ? `Dispatching to GitHub Actions (attempt ${batch.github.dispatchAttempts + 1}).`
                    : 'Dispatching to GitHub Actions…'
                  : batch.status === 'starting'
                    ? 'Waiting for a GitHub Actions runner to start.'
                    : batch.github.lastCallbackAt
                      ? `Last update from the runner ${formatRelative(batch.github.lastCallbackAt, now || Date.parse(batch.github.lastCallbackAt))}.`
                      : 'Runner starting.'}
            </span>
            {batch.github.segment > 1 && <span>Run {batch.github.segment} of this batch</span>}
          </p>
        )}
        {batch.github.runUrl && (
          <a
            href={batch.github.runUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]"
          >
            GitHub Actions run <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        )}
        {batch.runner.state === 'degraded' && batch.runner.message && open && (
          <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {batch.runner.message}
          </p>
        )}
        {batch.status === 'retrying' && pass?.lastError && (
          <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Retrying pass {pass.index + 1}: {pass.lastError}
          </p>
        )}
        {batch.status === 'stopped' && batch.github.cancel === 'failed' && (
          <p role="status" className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            GitHub did not confirm the run cancellation; the batch stays stopped and any late results are ignored.
          </p>
        )}
        {batch.error && (
          <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-400/10 dark:text-red-300">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {batch.error.message}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={stop}
        title="Stop this discovery?"
        description={`No new search passes will start. The ${formatNumber(c.imported)} leads already imported are kept.`}
        confirmLabel="Stop discovery"
        danger
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title="Delete this discovery?"
        description="The discovery record is removed from history."
        confirmLabel={deleteLeads ? `Delete discovery and ${formatNumber(c.imported)} leads` : 'Delete discovery'}
        danger
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-white/10">
          <input type="checkbox" checked={deleteLeads} onChange={event => setDeleteLeads(event.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
          <span>
            <span className="font-medium text-slate-900 dark:text-white">Also delete the leads it imported</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Removes those leads with their notes and activity. This cannot be undone. Leave unticked to keep them.</span>
          </span>
        </label>
      </ConfirmDialog>
    </Card>
  )
}
