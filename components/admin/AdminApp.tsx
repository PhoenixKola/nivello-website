'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api, setCsrfToken, setUnauthenticatedHandler } from '@/lib/admin/api'
import { useHashRoute } from '@/lib/admin/hooks'
import type { AdminUser } from '@/lib/admin/types'
import { AdminProvider } from './AdminContext'
import AdminShell from './AdminShell'
import LoginScreen from './LoginScreen'
import SetupScreen from './SetupScreen'
import { ToastProvider } from './ui/Toast'

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous'; notice: string | null; mfaRequired?: boolean }
  | { status: 'authenticated'; user: AdminUser }
  | { status: 'error'; message: string }

export default function AdminApp() {
  const [session, setSession] = useState<SessionState>({ status: 'loading' })
  const [route, navigate] = useHashRoute()
  const setupToken = route.raw === 'setup' ? route.params.get('token') : null

  const signOut = useCallback((notice: string | null = null) => {
    setCsrfToken(null)
    setSession({ status: 'anonymous', notice })
  }, [])

  /** Reads the session (and the signed-in user) after load or a successful sign-in. */
  const loadSession = useCallback(async (afterLogin = false) => {
    const result = await api.session()
    setCsrfToken(result.csrfToken)
    if (result.authenticated && result.user) setSession({ status: 'authenticated', user: result.user })
    else setSession({ status: 'anonymous', notice: afterLogin ? 'Please sign in again.' : result.expired ? 'Your session expired. Please sign in again.' : null, mfaRequired: result.mfaRequired })
  }, [])

  useEffect(() => {
    setUnauthenticatedHandler(expired => signOut(expired ? 'Your session expired. Please sign in again.' : 'Please sign in to continue.'))
    let cancelled = false
    api
      .session()
      .then(result => {
        if (cancelled) return
        setCsrfToken(result.csrfToken)
        setSession(
          result.authenticated && result.user
            ? { status: 'authenticated', user: result.user }
            : { status: 'anonymous', notice: result.expired ? 'Your session expired. Please sign in again.' : null, mfaRequired: result.mfaRequired }
        )
      })
      .catch(error => {
        if (!cancelled) setSession({ status: 'error', message: error.message })
      })
    return () => {
      cancelled = true
      setUnauthenticatedHandler(null)
    }
  }, [signOut])

  const signedIn = (csrf: string) => {
    setCsrfToken(csrf)
    loadSession(true).catch(error => setSession({ status: 'error', message: error.message }))
  }

  return (
    <ToastProvider>
      {session.status === 'loading' && (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-slate-950" role="status" aria-label="Loading">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      )}
      {session.status === 'error' && (
        <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-slate-950">
          <div role="alert" className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-sm dark:border-red-400/20 dark:bg-slate-900">
            <p className="font-semibold text-slate-900 dark:text-white">The admin API is not available</p>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{session.message}</p>
            <p className="mt-3 text-xs text-slate-400">The admin needs PHP to run /admin-api. Locally, use npm run serve:php after a build.</p>
          </div>
        </div>
      )}
      {session.status === 'anonymous' &&
        (setupToken ? (
          <SetupScreen token={setupToken} onDone={csrf => {
            navigate('dashboard')
            signedIn(csrf)
          }} />
        ) : (
          <LoginScreen notice={session.notice} initialMfaRequired={session.mfaRequired} onSuccess={signedIn} />
        ))}
      {session.status === 'authenticated' && (
        <AdminProvider
          route={route}
          navigate={navigate}
          me={session.user}
          onMeChange={user => setSession({ status: 'authenticated', user })}
          onLogout={() => signOut('You have been signed out.')}
        >
          <AdminShell />
        </AdminProvider>
      )}
    </ToastProvider>
  )
}
