'use client'

import { useState, type ReactNode } from 'react'
import { CheckCircle2, Database, Download, ExternalLink, GitBranch, HardDriveDownload, LogOut, Pencil, RefreshCw, Tag as TagIcon, Trash2, XCircle } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { TAG_COLORS } from '@/lib/admin/constants'
import { formatBytes, formatDateTime, formatNumber } from '@/lib/admin/format'
import type { Tag, TagColor } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { TagSwatch } from '../ui/Badge'
import { Button, IconButton } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { Skeleton } from '../ui/Controls'
import { TextField } from '../ui/Inputs'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import MfaSettings from './MfaSettings'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="min-w-0 text-right text-sm text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  )
}

function State({ ok, children }: { ok: boolean | null; children: ReactNode }) {
  if (ok === null) return <span className="text-slate-400">{children}</span>
  return (
    <span className={cx('inline-flex items-center gap-1.5 font-medium', ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-300')}>
      {ok ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : <XCircle aria-hidden="true" className="h-4 w-4" />}
      {children}
    </span>
  )
}

function TagManager() {
  const { tags, refreshTags, createTag, notifyChanged } = useAdmin()
  const toast = useToast()
  const [editing, setEditing] = useState<Tag | 'new' | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState<TagColor>('blue')
  const [deleting, setDeleting] = useState<Tag | null>(null)
  const [busy, setBusy] = useState(false)

  const open = (tag: Tag | 'new') => {
    setEditing(tag)
    setName(tag === 'new' ? '' : tag.name)
    setColor(tag === 'new' ? 'blue' : tag.color)
  }
  const save = async () => {
    if (!name.trim() || !editing) return
    setBusy(true)
    try {
      if (editing === 'new') await createTag(name.trim(), color)
      else await api.updateTag(editing.id, name.trim(), color)
      await refreshTags()
      notifyChanged()
      setEditing(null)
    } catch (err) {
      toast.error('Could not save tag', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title="Tags"
        description="Rename or recolor anytime. Deleting a tag only removes it from leads."
        actions={
          <Button size="sm" variant="secondary" icon={<TagIcon className="h-3.5 w-3.5" />} onClick={() => open('new')}>
            New tag
          </Button>
        }
      />
      <ul className="divide-y divide-slate-100 px-5 pb-3 pt-2 dark:divide-white/[0.05]">
        {tags.map(tag => (
          <li key={tag.id} className="flex items-center gap-3 py-2">
            <TagSwatch color={tag.color} />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-800 dark:text-slate-100">{tag.name}</span>
            <span className="text-xs tabular-nums text-slate-400">{formatNumber(tag.count)} leads</span>
            <IconButton size="sm" label={`Edit tag ${tag.name}`} onClick={() => open(tag)}>
              <Pencil className="h-3.5 w-3.5" />
            </IconButton>
            <IconButton size="sm" label={`Delete tag ${tag.name}`} onClick={() => setDeleting(tag)}>
              <Trash2 className="h-3.5 w-3.5" />
            </IconButton>
          </li>
        ))}
        {!tags.length && <li className="py-3 text-sm text-slate-400">No tags yet.</li>}
      </ul>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing === 'new' ? 'New tag' : 'Edit tag'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} disabled={!name.trim()} onClick={save}>
              Save
            </Button>
          </>
        }
      >
        <form
          onSubmit={event => {
            event.preventDefault()
            save()
          }}
          className="space-y-4"
        >
          <TextField label="Name" value={name} onChange={e => setName(e.target.value)} maxLength={40} data-autofocus />
          <div role="radiogroup" aria-label="Tag color" className="flex flex-wrap gap-2">
            {TAG_COLORS.map(c => (
              <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-full', color === c && 'ring-2 ring-slate-400 dark:ring-white/50', focusRing)}>
                <TagSwatch color={c} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        danger
        title={`Delete tag “${deleting?.name ?? ''}”?`}
        description={deleting ? `It will be removed from ${formatNumber(deleting.count)} leads. The leads themselves are kept.` : undefined}
        confirmLabel="Delete tag"
        onConfirm={async () => {
          if (!deleting) return
          try {
            await api.deleteTag(deleting.id)
            await refreshTags()
            notifyChanged()
            setDeleting(null)
          } catch (err) {
            toast.error('Could not delete tag', (err as Error).message)
          }
        }}
      />
    </Card>
  )
}

export default function SettingsPage() {
  const { health, refreshHealth, logout } = useAdmin()
  const toast = useToast()
  const [checking, setChecking] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [exporting, setExporting] = useState(false)

  const recheck = async () => {
    setChecking(true)
    await refreshHealth(true)
    setChecking(false)
  }

  if (!health) return <Skeleton className="h-96" />
  const d = health.discovery
  const s = health.storage

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader
          title="Lead discovery (GitHub Actions)"
          description="Discovery runs on demand in GitHub Actions and reports back to this server."
          actions={
            <Button size="sm" variant="ghost" icon={<RefreshCw className={cx('h-3.5 w-3.5', checking && 'animate-spin')} />} onClick={recheck} disabled={checking}>
              Check now
            </Button>
          }
        />
        <dl className="divide-y divide-slate-100 px-5 pb-3 pt-2 dark:divide-white/[0.05]">
          <Row label="Status">
            <State ok={d.available}>{d.available ? 'Available' : 'Lead discovery unavailable'}</State>
          </Row>
          <Row label="Repository">
            <span className="inline-flex items-center gap-1.5">
              <GitBranch aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
              {d.repo} · {d.ref}
            </span>
          </Row>
          <Row label="Workflow">
            <State ok={d.workflowFound}>{d.workflow}</State>
          </Row>
          <Row label="GitHub token (server-side)">
            <State ok={d.tokenConfigured}>{d.tokenConfigured ? 'Configured' : 'Missing'}</State>
          </Row>
          <Row label="Callback secret (server-side)">
            <State ok={d.callbackSecretConfigured}>{d.callbackSecretConfigured ? 'Configured' : 'Missing'}</State>
          </Row>
          <Row label="GitHub API">
            <State ok={d.apiReachable}>{d.apiReachable === null ? 'Not checked' : d.apiReachable ? 'Reachable' : 'Unreachable'}</State>
          </Row>
          <Row label="Callback URL">
            <span className="break-all font-mono text-xs">{d.callbackUrl || '—'}</span>
          </Row>
          <Row label="Latest workflow run">
            {d.latestRun ? (
              d.latestRun.htmlUrl ? (
                <a href={d.latestRun.htmlUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]">
                  {d.latestRun.status}
                  {d.latestRun.conclusion ? ` · ${d.latestRun.conclusion}` : ''} <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              ) : (
                `${d.latestRun.status}${d.latestRun.conclusion ? ` · ${d.latestRun.conclusion}` : ''}`
              )
            ) : (
              <span className="text-slate-400">None yet</span>
            )}
          </Row>
        </dl>
        {!d.available && (
          <div role="status" className="mx-5 mb-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">
            <p className="font-semibold">CRM and lead management are still available.</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {d.issues.map(issue => (
                <li key={issue.code}>{issue.message}</li>
              ))}
            </ul>
            <p className="mt-1.5">Setup steps are in docs/NIVELLO-ADMIN-DEPLOYMENT.md.</p>
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Storage & data" />
          <dl className="divide-y divide-slate-100 px-5 pb-3 pt-2 dark:divide-white/[0.05]">
            <Row label="PHP API">
              <State ok={health.api.ok}>{health.api.ok ? 'Online' : 'Offline'}</State>
            </Row>
            <Row label="Storage">
              <State ok={s.ok && s.writable}>{s.ok && s.writable ? 'Writable' : (s.error ?? 'Not writable')}</State>
            </Row>
            <Row label="Data file size">{formatBytes(s.fileSize)}</Row>
            <Row label="Leads">{formatNumber(health.counts.leads)}</Row>
            <Row label="Discovery batches">{formatNumber(health.counts.batches)}</Row>
            <Row label="Last backup">{s.lastBackupAt ? `${formatDateTime(s.lastBackupAt)} (${s.backupCount} kept)` : 'None yet'}</Row>
            {s.lastRecovery && (
              <Row label="Last recovery">
                <span className="text-amber-700 dark:text-amber-300">
                  {formatDateTime(s.lastRecovery.at)} from {s.lastRecovery.restoredFrom}
                </span>
              </Row>
            )}
          </dl>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]">
            <Button
              variant="secondary"
              icon={<HardDriveDownload className="h-4 w-4" />}
              loading={backingUp}
              onClick={async () => {
                setBackingUp(true)
                try {
                  const result = await api.backupNow()
                  toast.success('Backup created', result.file)
                  await refreshHealth()
                } catch (err) {
                  toast.error('Backup failed', (err as Error).message)
                } finally {
                  setBackingUp(false)
                }
              }}
            >
              Back up now
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              loading={exporting}
              disabled={!health.counts.leads}
              onClick={async () => {
                setExporting(true)
                try {
                  const rows = await api.exportLeads({ filters: {} })
                  toast.success('Export ready', `${formatNumber(rows)} leads exported.`)
                } catch (err) {
                  toast.error('Export failed', (err as Error).message)
                } finally {
                  setExporting(false)
                }
              }}
            >
              Download all leads (CSV)
            </Button>
          </div>
        </Card>

        <TagManager />

        <MfaSettings />

        <Card>
          <CardHeader title="Session" description="Sessions end after 12 hours of inactivity." />
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <Database aria-hidden="true" className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Signed in to the Nivello workspace</span>
            <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={logout}>
              Log out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
