'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDateTime } from '@/lib/admin/format'
import { useAdmin } from '../../AdminContext'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { TextField } from '../../ui/Inputs'
import { useToast } from '../../ui/Toast'
import UserAvatar from '../../ui/UserAvatar'
import MfaSettings from '../MfaSettings'

/** Settings → Account: the signed-in user's own sign-in details. */
export default function AccountSettings() {
  const { me, setMe, logout } = useAdmin()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)

  const change = async (event: FormEvent) => {
    event.preventDefault()
    if (next !== repeat) {
      toast.error('Not changed', 'The new access codes do not match.')
      return
    }
    setBusy(true)
    try {
      setMe((await api.changeAccessCode(current, next)).user)
      setCurrent('')
      setNext('')
      setRepeat('')
      toast.success('Access code changed', 'Your other sessions were signed out.')
    } catch (err) {
      toast.error('Not changed', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <div className="space-y-5">
        <Card>
          <CardHeader title="Your account" />
          <div className="flex items-center gap-4 px-5 pb-5 pt-3">
            <UserAvatar user={me} className="h-11 w-11 text-sm" />
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900 dark:text-white">{me.displayName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{[me.title, `@${me.login}`, me.email].filter(Boolean).join(' · ')}</p>
              <p className="mt-1 text-xs text-slate-400">{me.lastLoginAt ? `Signed in ${formatDateTime(me.lastLoginAt)}` : ''}</p>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Access code"
            description={me.usesServerAccessCode ? 'You still sign in with the server-configured access code. Set a personal one so the server code is no longer needed.' : 'Your personal access code. Changing it signs out your other sessions.'}
          />
          <form onSubmit={change} className="space-y-3 px-5 pb-5 pt-3">
            <TextField label="Current access code" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="New access code (12+ characters)" type="password" autoComplete="new-password" value={next} onChange={e => setNext(e.target.value)} />
              <TextField label="Repeat new access code" type="password" autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" icon={<KeyRound className="h-4 w-4" />} loading={busy} disabled={!current || next.length < 12 || !repeat}>
                Change access code
              </Button>
            </div>
          </form>
        </Card>
      </div>

      <div className="space-y-5">
        <MfaSettings />
        <Card>
          <CardHeader title="Session" description="Sessions end after 12 hours of inactivity." />
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">Signed in as {me.displayName}</span>
            <Button variant="secondary" icon={<LogOut className="h-4 w-4" />} onClick={logout}>
              Log out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
