'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Activity, AlertCircle, CheckCircle2, CircleSlash, ExternalLink, Pause, Pencil, Play, Plus, RefreshCw, ShieldAlert, Trash2, X, XCircle } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDateTime, formatRelative, formatShortDate, formatTime, hostname } from '@/lib/admin/format'
import { useNow } from '@/lib/admin/hooks'
import type { HealthOverview, Incident, Monitor, MonitorInput, MonitorState } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button, IconButton } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { Sparkline, TrendChart } from '../ui/Charts'
import { EmptyState, Skeleton, Switch, Tabs } from '../ui/Controls'
import { TextArea, TextField } from '../ui/Inputs'
import { ConfirmDialog, Drawer, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'

type Tab = 'overview' | 'monitors' | 'incidents'

const STATE_META: Record<MonitorState, { label: string; tone: 'green' | 'amber' | 'red' | 'slate' | 'blue' }> = {
  healthy: { label: 'Healthy', tone: 'green' },
  warning: { label: 'Warning', tone: 'amber' },
  down: { label: 'Down', tone: 'red' },
  paused: { label: 'Paused', tone: 'slate' },
  pending: { label: 'Not checked yet', tone: 'blue' }
}

export function MonitorStateBadge({ state }: { state: MonitorState }) {
  const meta = STATE_META[state]
  return (
    <Badge tone={meta.tone} dot pulse={state === 'down'}>
      {meta.label}
    </Badge>
  )
}

const ms = (value: number | null | undefined) => (value === null || value === undefined ? '—' : value >= 1000 ? `${(value / 1000).toFixed(1)} s` : `${value} ms`)

function duration(from: string, to: string | null, now: number) {
  const end = to ? new Date(to).getTime() : now
  const minutes = Math.max(0, Math.round((end - new Date(from).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  if (minutes < 60 * 48) return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
  return `${Math.floor(minutes / 1440)} days`
}

function MonitorForm({ open, monitor, onClose, onSaved }: { open: boolean; monitor: Monitor | null; onClose: () => void; onSaved: (id: string) => void }) {
  const toast = useToast()
  const initial: MonitorInput = monitor
    ? { name: monitor.name, url: monitor.url, expectedStatus: monitor.expectedStatus, enabled: monitor.enabled, notes: monitor.notes }
    : { name: '', url: '', expectedStatus: 200, enabled: true, notes: '' }
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.url.trim()) {
      setError('Name and URL are required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const saved = monitor ? await api.updateMonitor(monitor.id, form) : await api.createMonitor(form)
      toast.success(monitor ? 'Monitor updated' : 'Monitor added', saved.monitor.name)
      onSaved(saved.monitor.id)
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
      title={monitor ? 'Edit monitor' : 'New monitor'}
      description="Only public http(s) sites on standard ports can be monitored."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="monitor-form" loading={busy}>
            {monitor ? 'Save changes' : 'Add monitor'}
          </Button>
        </>
      }
    >
      <form id="monitor-form" onSubmit={submit} className="space-y-4" noValidate>
        <TextField label="Name" value={form.name} maxLength={80} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nivello website" autoFocus />
        <TextField label="URL" value={form.url} maxLength={500} inputMode="url" onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://www.example.com" hint={monitor && form.url !== monitor.url ? 'Changing the URL clears this monitor’s check history.' : undefined} />
        <TextField
          label="Expected HTTP status"
          type="number"
          min={100}
          max={599}
          value={form.expectedStatus}
          onChange={e => setForm(f => ({ ...f, expectedStatus: Number(e.target.value) || 0 }))}
          hint="Usually 200. Redirects are followed unless you expect a 3xx status."
        />
        <Switch checked={form.enabled} onChange={enabled => setForm(f => ({ ...f, enabled }))} label="Enabled" description="Paused monitors are skipped by scheduled checks." />
        <TextArea label="Notes" value={form.notes} maxLength={1000} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Hosting, owner, anything useful during an incident" />
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function IncidentList({ incidents, now, showMonitor, onOpen }: { incidents: Incident[]; now: number; showMonitor?: boolean; onOpen?: (monitorId: string) => void }) {
  if (!incidents.length) return <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No incidents" description="Outages appear here when a check fails and close when the site recovers." />
  return (
    <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
      {incidents.map(incident => (
        <li key={incident.id} className="flex flex-wrap items-start gap-3 px-5 py-3">
          <span className={cx('mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', incident.resolvedAt ? 'bg-slate-100 text-slate-500 dark:bg-white/[0.06]' : 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300')}>
            {incident.resolvedAt ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {showMonitor && onOpen ? (
                <button type="button" onClick={() => onOpen(incident.monitorId)} className={cx('cursor-pointer hover:underline', focusRing)}>
                  {incident.monitorName}
                </button>
              ) : showMonitor ? (
                incident.monitorName
              ) : null}
              {showMonitor && ' · '}
              {incident.cause ?? 'Check failed'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Started {formatDateTime(incident.startedAt)} · {incident.resolvedAt ? `resolved after ${duration(incident.startedAt, incident.resolvedAt, now)}` : `ongoing for ${duration(incident.startedAt, null, now)}`} · {incident.failedChecks} failed check{incident.failedChecks === 1 ? '' : 's'}
            </p>
            {incident.lastError && incident.lastError !== incident.cause && <p className="mt-0.5 text-xs text-slate-400">Latest: {incident.lastError}</p>}
          </div>
          {!incident.resolvedAt && <Badge tone="red">Open</Badge>}
        </li>
      ))}
    </ul>
  )
}

function MonitorDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast()
  const now = useNow(30000)
  const [data, setData] = useState<{ monitor: Monitor; incidents: Incident[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(() => {
    api
      .monitor(id)
      .then(result => {
        setData(result)
        setError(null)
      })
      .catch(err => setError(err.message))
  }, [id])

  useEffect(load, [load])

  const checkNow = async () => {
    setChecking(true)
    try {
      const result = await api.checkMonitor(id)
      setData(result)
      const last = result.monitor.last
      if (last?.ok) toast.success('Site is up', `HTTP ${last.status} in ${ms(last.ms)}`)
      else toast.error('Check failed', last?.error ?? undefined)
      onChanged()
    } catch (err) {
      toast.error('Check could not run', (err as Error).message)
    } finally {
      setChecking(false)
    }
  }

  const toggle = async () => {
    if (!data) return
    try {
      setData(await api.updateMonitor(id, { enabled: !data.monitor.enabled }))
      onChanged()
    } catch (err) {
      toast.error('Could not update the monitor', (err as Error).message)
    }
  }

  const m = data?.monitor
  const checks = m?.recent ?? []
  const points = checks.filter(c => c.ok && c.ms !== null).map(c => ({ label: c.at, values: [c.ms ?? 0] }))

  return (
    <Drawer open onClose={onClose} label={m ? `Monitor ${m.name}` : 'Monitor'}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/[0.08]">
        <div className="min-w-0">
          {m ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-slate-900 dark:text-white">{m.name}</h2>
                <MonitorStateBadge state={m.state} />
              </div>
              <a href={m.url} target="_blank" rel="noopener noreferrer" className={cx('mt-0.5 inline-flex items-center gap-1 break-all text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white', focusRing)}>
                {m.url}
                <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" />
              </a>
            </>
          ) : (
            <Skeleton className="h-6 w-48" />
          )}
        </div>
        <IconButton label="Close" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {error && !data && <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Monitor unavailable" description={error} />}
        {m && data && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={checking} onClick={checkNow}>
                Check now
              </Button>
              <Button size="sm" icon={m.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} onClick={toggle}>
                {m.enabled ? 'Pause' : 'Resume'}
              </Button>
              <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmDelete(true)} className="text-red-600 dark:text-red-400">
                Delete
              </Button>
            </div>

            {m.warnings.length > 0 && (
              <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                {m.warnings.map(w => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Last status', m.last ? (m.last.status ? `HTTP ${m.last.status}` : 'No response') : '—'],
                ['Response time', ms(m.last?.ms)],
                ['Uptime (30 days)', m.uptime === null ? '—' : `${m.uptime}%`],
                ['Last checked', m.last ? formatRelative(m.last.at, now) : 'Never']
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-white/[0.08] dark:bg-slate-900/60">
                  <dt className="text-[11px] text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-slate-400">
              Uptime is based on the {m.uptimeChecks} check{m.uptimeChecks === 1 ? '' : 's'} collected in the last 30 days (scheduled every 6 hours plus manual checks), not continuous monitoring.
            </p>

            <Card>
              <CardHeader title="Response time" description="Successful checks, most recent last." />
              <div className="px-3 pb-4 pt-2 sm:px-5">
                {points.length > 1 ? (
                  <TrendChart points={points} series={['Response time (ms)']} height={140} formatLabel={label => `${formatShortDate(label)} ${formatTime(label)}`} />
                ) : (
                  <p className="py-6 text-center text-sm text-slate-400">Not enough checks yet.</p>
                )}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader title="SSL certificate" />
                <div className="px-5 pb-4 pt-2 text-sm">
                  {!m.url.startsWith('https://') ? (
                    <p className="text-slate-500">This monitor uses plain http, so there is no certificate to check.</p>
                  ) : m.ssl ? (
                    <dl className="space-y-1.5">
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Expires</dt>
                        <dd className={cx('font-medium', (m.sslDaysLeft ?? 99) < 14 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white')}>
                          {formatDateTime(m.ssl.expiresAt)} ({m.sslDaysLeft} days)
                        </dd>
                      </div>
                      {m.ssl.issuer && (
                        <div className="flex justify-between gap-3">
                          <dt className="text-slate-500">Issuer</dt>
                          <dd className="text-right text-slate-900 dark:text-white">{m.ssl.issuer}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-3">
                        <dt className="text-slate-500">Read at</dt>
                        <dd className="text-slate-900 dark:text-white">{formatDateTime(m.ssl.checkedAt)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-slate-500">Not read yet. Certificate details are recorded when a check can read them.</p>
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader title="Details" />
                <dl className="space-y-1.5 px-5 pb-4 pt-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Expected status</dt>
                    <dd className="text-slate-900 dark:text-white">{m.expectedStatus}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Last success</dt>
                    <dd className="text-slate-900 dark:text-white">{m.lastSuccessAt ? formatDateTime(m.lastSuccessAt) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Last failure</dt>
                    <dd className="text-slate-900 dark:text-white">{m.lastFailureAt ? formatDateTime(m.lastFailureAt) : '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Consecutive failures</dt>
                    <dd className="text-slate-900 dark:text-white">{m.consecutiveFailures}</dd>
                  </div>
                  {m.notes && <p className="whitespace-pre-line border-t border-slate-100 pt-2 text-slate-600 dark:border-white/[0.06] dark:text-slate-300">{m.notes}</p>}
                </dl>
              </Card>
            </div>

            <Card>
              <CardHeader title="Incidents" />
              <IncidentList incidents={data.incidents} now={now} />
            </Card>

            <Card>
              <CardHeader title="Recent checks" />
              {checks.length ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">Result</th>
                        <th className="px-3 py-2 font-medium">Response</th>
                        <th className="px-5 py-2 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                      {[...checks].reverse().slice(0, 50).map(check => (
                        <tr key={check.at + check.source}>
                          <td className="whitespace-nowrap px-5 py-2 text-slate-700 dark:text-slate-200">{formatDateTime(check.at)}</td>
                          <td className="px-3 py-2">
                            {check.ok ? <span className="text-emerald-600 dark:text-emerald-400">HTTP {check.status}</span> : <span className="text-red-600 dark:text-red-400">{check.error}</span>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-600 dark:text-slate-300">{ms(check.ms)}</td>
                          <td className="px-5 py-2 text-slate-500">{check.source === 'manual' ? 'Check now' : 'Scheduled'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="px-5 pb-5 pt-2 text-sm text-slate-400">No checks yet. Use “Check now” or wait for the next scheduled run.</p>
              )}
            </Card>
          </>
        )}
      </div>
      {m && editing && (
        <MonitorForm
          open
          monitor={m}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false)
            load()
            onChanged()
          }}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete monitor?"
        description={m ? `"${m.name}" and its check history and incidents will be removed. This cannot be undone.` : undefined}
        confirmLabel="Delete monitor"
        onConfirm={async () => {
          try {
            await api.deleteMonitor(id)
            toast.success('Monitor deleted')
            setConfirmDelete(false)
            onChanged()
            onClose()
          } catch (err) {
            toast.error('Could not delete', (err as Error).message)
          }
        }}
      />
    </Drawer>
  )
}

function MonitorRow({ monitor, now, onOpen }: { monitor: Monitor; now: number; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className={cx('flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]', focusRing)}>
        <span className="min-w-0 flex-1 basis-48">
          <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{monitor.name}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{hostname(monitor.url)}</span>
        </span>
        <MonitorStateBadge state={monitor.state} />
        <span className="hidden w-28 sm:block">
          <Sparkline values={monitor.recent.map(c => (c.ok ? c.ms : null))} label={`Response times for ${monitor.name}`} tone={monitor.state === 'down' ? 'red' : 'brand'} />
        </span>
        <span className="w-20 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300">{monitor.last?.ok ? ms(monitor.last.ms) : '—'}</span>
        <span className="w-24 text-right text-xs text-slate-500 dark:text-slate-400">{monitor.last ? formatRelative(monitor.last.at, now) : 'Never'}</span>
        {monitor.sslDaysLeft !== null && monitor.sslDaysLeft < 14 && (
          <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
            <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
            SSL {monitor.sslDaysLeft < 0 ? 'expired' : `${monitor.sslDaysLeft}d`}
          </span>
        )}
      </button>
    </li>
  )
}

export default function SiteHealth() {
  const { route, navigate, refreshHealth } = useAdmin()
  const now = useNow(30000)
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<HealthOverview | null>(null)
  const [incidents, setIncidents] = useState<Incident[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [version, setVersion] = useState(0)
  const selected = route.params.get('monitor')

  useEffect(() => {
    const controller = new AbortController()
    api
      .siteHealth(controller.signal)
      .then(result => {
        setData(result)
        setError(null)
      })
      .catch(err => err.name !== 'AbortError' && setError(err.message))
    return () => controller.abort()
  }, [version])

  useEffect(() => {
    if (tab !== 'incidents') return
    let cancelled = false
    api
      .incidents()
      .then(result => !cancelled && setIncidents(result.incidents))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [tab, version])

  const open = (id: string) => navigate('health', { monitor: id })
  const refresh = () => {
    setVersion(v => v + 1)
    refreshHealth()
  }

  let body
  if (error && !data) {
    body = (
      <Card>
        <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Site Health unavailable" description={error} action={<Button onClick={refresh}>Try again</Button>} />
      </Card>
    )
  } else if (!data) {
    body = (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[76px]" />
        ))}
      </div>
    )
  } else if (!data.monitors.length) {
    body = (
      <Card>
        <EmptyState
          icon={<Activity className="h-5 w-5" />}
          title="No monitors yet"
          description="Add the Nivello site and client sites to track uptime, response time and SSL expiry."
          action={
            <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
              Add monitor
            </Button>
          }
        />
      </Card>
    )
  } else {
    const c = data.counts
    const summary: { key: MonitorState; icon: typeof CheckCircle2; tone: string }[] = [
      { key: 'healthy', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300' },
      { key: 'warning', icon: ShieldAlert, tone: 'bg-orange-50 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300' },
      { key: 'down', icon: XCircle, tone: 'bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300' },
      { key: 'paused', icon: CircleSlash, tone: 'bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-400' }
    ]
    const attention = data.monitors.filter(m => m.state === 'down' || m.state === 'warning')
    const list = (monitors: Monitor[]) => (
      <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {monitors.map(monitor => (
          <MonitorRow key={monitor.id} monitor={monitor} now={now} onOpen={() => open(monitor.id)} />
        ))}
      </ul>
    )
    body = (
      <div className="space-y-4">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {summary.map(({ key, icon: Icon, tone }) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/60">
                  <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{c[key]}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{STATE_META[key].label}</span>
                  </span>
                </div>
              ))}
            </div>
            {c.pending > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{c.pending} monitor{c.pending === 1 ? ' has' : 's have'} not been checked yet.</p>}
            <Card>
              <CardHeader title="Needs attention" description={attention.length ? undefined : 'Everything that has been checked is responding normally.'} />
              {attention.length ? list(attention) : <div className="h-3" />}
            </Card>
            <Card>
              <CardHeader title="Open incidents" />
              <IncidentList incidents={data.openIncidents} now={now} showMonitor onOpen={open} />
            </Card>
          </>
        )}
        {tab === 'monitors' && (
          <Card>
            <CardHeader title={`${data.monitors.length} monitor${data.monitors.length === 1 ? '' : 's'}`} />
            <div className="mt-2">{list(data.monitors)}</div>
          </Card>
        )}
        {tab === 'incidents' && (
          <Card>
            <CardHeader title="Incident history" description="Most recent first." />
            {incidents ? <IncidentList incidents={incidents} now={now} showMonitor onOpen={open} /> : <Skeleton className="m-5 h-24" />}
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Site Health views"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'monitors', label: 'Monitors', count: data?.monitors.length },
            { value: 'incidents', label: 'Incidents', count: data?.openIncidents.length || undefined }
          ]}
        />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={refresh}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>
            Add monitor
          </Button>
        </div>
      </div>
      {body}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        {data?.lastRun ? `Last scheduled run ${formatRelative(data.lastRun.at, now)} (${data.lastRun.recorded} checks). ` : 'No scheduled run has reported yet. '}
        Scheduled checks run every 6 hours from GitHub Actions; “Check now” checks from this server.
      </p>
      {creating && (
        <MonitorForm
          open
          monitor={null}
          onClose={() => setCreating(false)}
          onSaved={id => {
            setCreating(false)
            refresh()
            open(id)
          }}
        />
      )}
      {selected && /^mon_[a-f0-9]{16}$/.test(selected) && <MonitorDetail key={selected} id={selected} onClose={() => navigate('health')} onChanged={refresh} />}
    </div>
  )
}
