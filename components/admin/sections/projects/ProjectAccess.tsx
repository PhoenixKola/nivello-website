'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, Copy, Eye, EyeOff, KeyRound, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDateTime } from '@/lib/admin/format'
import type { CredentialInput, CredentialType, ProjectCredential } from '@/lib/admin/types'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Skeleton, Switch } from '../../ui/Controls'
import { TextArea, TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'

export const CREDENTIAL_TYPES: { value: CredentialType; label: string }[] = [
  { value: 'hosting', label: 'Hosting' },
  { value: 'sftp', label: 'SFTP' },
  { value: 'domain', label: 'Domain / DNS' },
  { value: 'email', label: 'Email' },
  { value: 'cms', label: 'CMS / Admin' },
  { value: 'database', label: 'Database' },
  { value: 'github', label: 'GitHub' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Other' }
]
const TYPE_LABEL = Object.fromEntries(CREDENTIAL_TYPES.map(t => [t.value, t.label])) as Record<CredentialType, string>

type Draft = { type: CredentialType; label: string; username: string; urlOrHost: string; secret: string; notes: string; changeSecret: boolean; changeNotes: boolean }
const blank = (): Draft => ({ type: 'hosting', label: '', username: '', urlOrHost: '', secret: '', notes: '', changeSecret: true, changeNotes: true })

/**
 * Project → Access. The list holds metadata only; a secret reaches the browser only through an explicit,
 * audited Reveal or Copy, and is dropped again when hidden.
 */
export default function ProjectAccess({ projectId }: { projectId: string }) {
  const toast = useToast()
  const [items, setItems] = useState<ProjectCredential[] | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Record<string, { secret: string; notes: string }>>({})
  const [editing, setEditing] = useState<ProjectCredential | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<ProjectCredential | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .credentials(projectId)
      .then(result => {
        if (cancelled) return
        setItems(result.credentials)
        setProblem(result.problem)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [projectId])

  const apply = (result: { credentials: ProjectCredential[]; problem: string | null }) => {
    setItems(result.credentials)
    setProblem(result.problem)
  }

  const reveal = async (item: ProjectCredential) => {
    if (revealed[item.id]) {
      setRevealed(map => Object.fromEntries(Object.entries(map).filter(([id]) => id !== item.id)))
      return
    }
    try {
      const result = await api.revealCredential(item.id)
      setRevealed(map => ({ ...map, [item.id]: { secret: result.secret, notes: result.notes } }))
    } catch (err) {
      toast.error('Could not reveal', (err as Error).message)
    }
  }

  const copy = async (item: ProjectCredential) => {
    try {
      const secret = revealed[item.id]?.secret ?? (await api.revealCredential(item.id)).secret
      await navigator.clipboard.writeText(secret)
      toast.success('Secret copied', 'Clear your clipboard when you are done.')
    } catch (err) {
      toast.error('Could not copy', (err as Error).message)
    }
  }

  const open = (item?: ProjectCredential) => {
    setEditing(item ?? 'new')
    setDraft(item ? { type: item.type, label: item.label, username: item.username, urlOrHost: item.urlOrHost, secret: '', notes: '', changeSecret: false, changeNotes: false } : blank())
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    const input: CredentialInput = { type: draft.type, label: draft.label, username: draft.username, urlOrHost: draft.urlOrHost }
    if (editing === 'new' || draft.changeSecret) input.secret = draft.secret
    if (editing === 'new' || draft.changeNotes) input.notes = draft.notes
    try {
      apply(editing === 'new' ? await api.createCredential(projectId, input) : await api.updateCredential(editing.id, input))
      if (editing !== 'new') setRevealed(map => Object.fromEntries(Object.entries(map).filter(([id]) => id !== editing.id)))
      setEditing(null)
      setDraft(blank())
      toast.success(editing === 'new' ? 'Credential saved (encrypted)' : 'Credential updated')
    } catch (err) {
      toast.error('Not saved', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const groups = CREDENTIAL_TYPES.map(type => ({ ...type, items: (items ?? []).filter(i => i.type === type.value) })).filter(g => g.items.length)

  return (
    <div className="space-y-5">
      {problem && (
        <div role="alert" className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong className="font-semibold">Credential storage is locked.</strong> {problem} Nothing is ever stored unencrypted.
          </p>
        </div>
      )}
      <Card>
        <CardHeader
          title="Access & credentials"
          description="Encrypted at rest. Secrets are masked until you reveal them, and every reveal is logged."
          actions={
            <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open()} disabled={!!problem}>
              Add credential
            </Button>
          }
        />
        {error && !items ? (
          <EmptyState title="Credentials unavailable" description={error} />
        ) : !items ? (
          <Skeleton className="m-5 h-32" />
        ) : !items.length ? (
          <EmptyState icon={<KeyRound className="h-5 w-5" />} title="No credentials yet" description="Hosting, SFTP, DNS, CMS and API access for this project, stored encrypted." />
        ) : (
          <div className="space-y-5 px-5 pb-5 pt-3">
            {groups.map(group => (
              <section key={group.value} aria-label={group.label}>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">{group.label}</h3>
                <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {group.items.map(item => {
                    const shown = revealed[item.id]
                    return (
                      <li key={item.id} className="min-w-0 rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.08]">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.label}</p>
                            {item.urlOrHost && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.urlOrHost}</p>}
                          </div>
                          <button type="button" aria-label={`Edit ${item.label}`} onClick={() => open(item)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07]', focusRing)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" aria-label={`Delete ${item.label}`} onClick={() => setDeleting(item)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <dl className="mt-3 space-y-1.5 text-sm">
                          {item.username && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-xs text-slate-400">User</dt>
                              <dd className="min-w-0 break-all font-mono text-xs text-slate-700 dark:text-slate-200">{item.username}</dd>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <dt className="w-20 shrink-0 text-xs text-slate-400">Secret</dt>
                            <dd className="min-w-0 flex-1 break-all font-mono text-xs text-slate-700 dark:text-slate-200">{item.hasSecret ? shown ? shown.secret : <span aria-label="Hidden secret">••••••••••••</span> : <span className="font-sans text-slate-400">None</span>}</dd>
                            {item.hasSecret && (
                              <span className="flex shrink-0 gap-1">
                                <Button size="sm" variant="ghost" icon={shown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} onClick={() => reveal(item)} disabled={!!problem && !shown}>
                                  {shown ? 'Hide' : 'Reveal'}
                                </Button>
                                <Button size="sm" variant="ghost" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => copy(item)} disabled={!!problem && !shown} aria-label={`Copy secret for ${item.label}`}>
                                  Copy
                                </Button>
                              </span>
                            )}
                          </div>
                          {item.hasNotes && (
                            <div className="flex gap-2">
                              <dt className="w-20 shrink-0 text-xs text-slate-400">Notes</dt>
                              <dd className="min-w-0 whitespace-pre-line text-xs text-slate-600 dark:text-slate-300">{shown ? shown.notes : 'Encrypted — reveal to read'}</dd>
                            </div>
                          )}
                        </dl>
                        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Lock aria-hidden="true" className="h-3 w-3" />
                          Updated {formatDateTime(item.updatedAt)}
                          {item.updatedBy ? ` by ${item.updatedBy.displayName}` : ''}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="md"
        title={editing === 'new' ? 'Add credential' : 'Edit credential'}
        description="The secret and notes are encrypted on the server before they are saved."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="credential-form" loading={busy} disabled={!draft.label.trim()}>
              Save
            </Button>
          </>
        }
      >
        <form id="credential-form" onSubmit={save} className="space-y-3" autoComplete="off">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Type</span>
              <Select label="Type" value={draft.type} onChange={v => setDraft(d => ({ ...d, type: v }))} options={CREDENTIAL_TYPES} />
            </div>
            <TextField label="Label" required maxLength={80} value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder={`e.g. ${TYPE_LABEL[draft.type]} login`} />
            <TextField label="Username or email" maxLength={200} autoComplete="off" value={draft.username} onChange={e => setDraft(d => ({ ...d, username: e.target.value }))} />
            <TextField label="URL or host" maxLength={300} value={draft.urlOrHost} onChange={e => setDraft(d => ({ ...d, urlOrHost: e.target.value }))} />
          </div>
          {editing !== 'new' && <Switch checked={draft.changeSecret} onChange={v => setDraft(d => ({ ...d, changeSecret: v, secret: '' }))} label="Replace the stored secret" />}
          {(editing === 'new' || draft.changeSecret) && (
            <TextField label="Secret (password, token, key)" type="password" autoComplete="new-password" maxLength={4000} value={draft.secret} onChange={e => setDraft(d => ({ ...d, secret: e.target.value }))} />
          )}
          {editing !== 'new' && <Switch checked={draft.changeNotes} onChange={v => setDraft(d => ({ ...d, changeNotes: v, notes: '' }))} label="Replace the stored notes" />}
          {(editing === 'new' || draft.changeNotes) && <TextArea label="Notes (encrypted)" maxLength={4000} rows={3} value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} />}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        danger
        title={`Delete “${deleting?.label ?? ''}”?`}
        description="The encrypted credential is removed permanently. This is recorded in the project activity."
        confirmLabel="Delete credential"
        onConfirm={async () => {
          if (!deleting) return
          try {
            apply(await api.deleteCredential(deleting.id))
            setDeleting(null)
            toast.success('Credential deleted')
          } catch (err) {
            toast.error('Not deleted', (err as Error).message)
          }
        }}
      />
    </div>
  )
}
