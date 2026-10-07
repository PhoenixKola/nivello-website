'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Copy, Link2, Pencil, Plus, ShieldCheck, ShieldOff, UserCheck, UserX } from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { formatDateTime } from '@/lib/admin/format'
import type { AdminUser } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Skeleton } from '../../ui/Controls'
import { TextField } from '../../ui/Inputs'
import { Menu } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'
import UserAvatar from '../../ui/UserAvatar'

type Draft = { displayName: string; title: string; email: string; login: string }
const blank: Draft = { displayName: '', title: '', email: '', login: '' }

const STATUS: Record<AdminUser['status'], { label: string; tone: 'green' | 'amber' | 'slate' }> = {
  active: { label: 'Active', tone: 'green' },
  invited: { label: 'Setup pending', tone: 'amber' },
  disabled: { label: 'Disabled', tone: 'slate' }
}

/** Settings → Team: admin accounts, one-time setup links and enable/disable with last-admin protection. */
export default function TeamSettings() {
  const { me, setMe, refreshPeople, logout } = useAdmin()
  const toast = useToast()
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(blank)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [link, setLink] = useState<{ name: string; url: string } | null>(null)
  const [confirm, setConfirm] = useState<{ user: AdminUser; action: 'disable' | 'reset' } | null>(null)

  const apply = useCallback(
    (result: { users: AdminUser[] }) => {
      setUsers(result.users)
      const self = result.users.find(u => u.id === me.id)
      if (self) setMe(self)
      refreshPeople()
    },
    [me.id, setMe, refreshPeople]
  )

  useEffect(() => {
    let cancelled = false
    api
      .team()
      .then(result => !cancelled && setUsers(result.users))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  const showLink = (name: string, path: string) => setLink({ name, url: `${window.location.origin}${path}` })

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    try {
      if (editing === 'new') {
        const result = await api.createUser(draft)
        apply(result)
        showLink(result.created.displayName, result.setupUrl)
        toast.success('Account created', 'Share the setup link with them privately.')
      } else {
        apply(await api.updateUser(editing.id, draft))
        toast.success('Account updated')
      }
      setEditing(null)
    } catch (err) {
      toast.error('Not saved', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (user: AdminUser, status: 'active' | 'disabled', confirmSelf = false) => {
    try {
      apply(await api.setUserStatus(user.id, status, confirmSelf))
      toast.success(status === 'active' ? 'Account enabled' : 'Account disabled')
      if (status === 'disabled' && user.id === me.id) logout()
      return true
    } catch (err) {
      toast.error('Not changed', (err as Error).message)
      return false
    }
  }

  const setupLink = async (user: AdminUser, confirmSelf = false) => {
    try {
      const result = await api.userSetupLink(user.id, confirmSelf)
      if (user.id === me.id) {
        logout()
        return true
      }
      apply(result)
      showLink(user.displayName, result.setupUrl)
      return true
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LAST_ADMIN') toast.error('Not possible', err.message)
      else toast.error('No link created', (err as Error).message)
      return false
    }
  }

  const open = (user: AdminUser | 'new') => {
    setEditing(user)
    setDraft(user === 'new' ? blank : { displayName: user.displayName, title: user.title, email: user.email, login: user.login })
  }

  return (
    <Card>
      <CardHeader
        title="Team"
        description="Every admin has their own sign-in, access code and authenticator. Nothing is shared between accounts."
        actions={
          <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open('new')}>
            Add admin
          </Button>
        }
      />
      {error && !users ? (
        <EmptyState title="Team unavailable" description={error} />
      ) : !users ? (
        <Skeleton className="m-5 h-32" />
      ) : (
        <ul className="divide-y divide-slate-100 pb-2 pt-2 dark:divide-white/[0.06]">
          {users.map(user => (
            <li key={user.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
              <UserAvatar user={user} />
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {user.displayName}
                  {user.id === me.id && <span className="text-xs font-normal text-slate-400">(you)</span>}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {[user.title, user.login && `@${user.login}`, user.email].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={STATUS[user.status].tone}>{STATUS[user.status].label}</Badge>
                <span className={cx('inline-flex items-center gap-1 text-xs', user.mfaEnabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400')}>
                  {user.mfaEnabled ? <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <ShieldOff aria-hidden="true" className="h-3.5 w-3.5" />}
                  {user.mfaEnabled ? 'Authenticator on' : 'No authenticator'}
                </span>
                <span className="text-xs text-slate-400">{user.lastLoginAt ? `Last sign-in ${formatDateTime(user.lastLoginAt)}` : 'Never signed in'}</span>
              </div>
              <Menu
                label={`Manage ${user.displayName}`}
                items={[
                  { label: 'Edit details', icon: <Pencil className="h-4 w-4" />, onSelect: () => open(user) },
                  ...(user.status !== 'disabled'
                    ? [{ label: user.status === 'invited' ? 'New setup link' : 'Reset sign-in (new setup link)', icon: <Link2 className="h-4 w-4" />, onSelect: () => (user.status === 'invited' ? setupLink(user) : setConfirm({ user, action: 'reset' })) }]
                    : []),
                  user.status === 'disabled'
                    ? { label: 'Enable', icon: <UserCheck className="h-4 w-4" />, onSelect: () => setStatus(user, 'active') }
                    : { label: 'Disable', icon: <UserX className="h-4 w-4" />, danger: true, onSelect: () => setConfirm({ user, action: 'disable' }) }
                ]}
                trigger={({ ref, open: isOpen, toggle, onKeyDown, menuId }) => (
                  <button
                    ref={ref}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? menuId : undefined}
                    onClick={toggle}
                    onKeyDown={onKeyDown}
                    className={cx('h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/[0.05]', focusRing)}
                  >
                    Manage
                  </button>
                )}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        size="sm"
        title={editing === 'new' ? 'Add an admin' : 'Edit account'}
        description={editing === 'new' ? 'A one-time setup link is created. They choose their own access code and authenticator.' : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="team-user-form" loading={busy} disabled={!draft.displayName.trim() || !draft.login.trim()}>
              {editing === 'new' ? 'Create account' : 'Save'}
            </Button>
          </>
        }
      >
        <form id="team-user-form" onSubmit={save} className="space-y-3">
          <TextField label="Display name" required maxLength={60} value={draft.displayName} onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))} placeholder="e.g. Amelio CEO" />
          <TextField label="Title" maxLength={60} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. CEO" />
          <TextField label="Username (used to sign in)" required maxLength={40} value={draft.login} onChange={e => setDraft(d => ({ ...d, login: e.target.value.toLowerCase() }))} autoCapitalize="none" spellCheck={false} />
          <TextField label="Email (optional; can also be used to sign in)" type="email" maxLength={200} value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
        </form>
      </Modal>

      <Modal
        open={link !== null}
        onClose={() => setLink(null)}
        size="sm"
        title={`Setup link for ${link?.name ?? ''}`}
        description="Valid for 72 hours and usable once. Send it privately — it is not stored in readable form and is not shown again."
        footer={
          <Button variant="primary" onClick={() => setLink(null)}>
            Done
          </Button>
        }
      >
        <div className="flex gap-2">
          <code className="min-w-0 flex-1 break-all rounded-lg bg-slate-100 px-3 py-2 text-xs dark:bg-white/[0.06]">{link?.url}</code>
          <Button
            variant="secondary"
            icon={<Copy className="h-4 w-4" />}
            onClick={async () => {
              if (!link) return
              await navigator.clipboard.writeText(link.url)
              toast.success('Link copied')
            }}
          >
            Copy
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        danger
        title={confirm?.action === 'disable' ? `Disable ${confirm.user.displayName}?` : `Reset sign-in for ${confirm?.user.displayName ?? ''}?`}
        description={
          confirm?.user.id === me.id
            ? 'This is your own account: you will be signed out immediately. The last active admin can never be disabled or reset.'
            : confirm?.action === 'disable'
              ? 'They are signed out immediately and cannot sign in until re-enabled. Their history stays attributed to them.'
              : 'Their access code and authenticator are cleared and every session ends. They set up again with a new one-time link.'
        }
        confirmLabel={confirm?.action === 'disable' ? 'Disable account' : 'Reset and create link'}
        onConfirm={async () => {
          if (!confirm) return
          const self = confirm.user.id === me.id
          const ok = confirm.action === 'disable' ? await setStatus(confirm.user, 'disabled', self) : await setupLink(confirm.user, self)
          if (ok) setConfirm(null)
        }}
      />
    </Card>
  )
}
