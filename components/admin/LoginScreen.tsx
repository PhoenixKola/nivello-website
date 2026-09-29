'use client'

import { useState, type FormEvent } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { Button } from './ui/Button'
import { cx, fieldBase, focusRing } from './ui/styles'
import AdminThemeToggle from './AdminThemeToggle'

export default function LoginScreen({ onSuccess, notice }: { onSuccess: (csrf: string) => void; notice?: string | null }) {
  const [code, setCode] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await api.login(code)
      onSuccess(result.csrfToken)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in.')
      setBusy(false)
    }
  }

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-4 py-10 dark:bg-slate-950">
      <div aria-hidden="true" className="admin-grid-bg pointer-events-none absolute inset-0" />
      <div className="absolute right-4 top-4">
        <AdminThemeToggle />
      </div>
      <div className="admin-pop-in relative w-full max-w-sm">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-8">
          <Image src="/nivello-logo-text-light.svg" alt="Nivello" width={160} height={46} priority className="h-auto w-[132px] dark:hidden" />
          <Image src="/nivello-logo-text.svg" alt="Nivello" width={160} height={46} priority className="hidden h-auto w-[132px] dark:block" />
          <div className="mt-7 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-blue)]/10 text-[var(--brand-blue)] dark:bg-[var(--brand-gold)]/15 dark:text-[var(--brand-gold)]">
              <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Internal workspace</p>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Sign in to Nivello Admin</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Lead discovery and CRM for the Nivello team.</p>

          {notice && (
            <p role="status" className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              {notice}
            </p>
          )}

          <form onSubmit={submit} className="mt-6" noValidate>
            <label htmlFor="access-code" className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
              Access code
            </label>
            <div className="relative">
              <input
                id="access-code"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                autoFocus
                value={code}
                onChange={event => setCode(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
                className={cx(fieldBase, 'h-11 pr-11 text-[15px]', error && 'border-red-400 dark:border-red-400/60')}
              />
              <button
                type="button"
                onClick={() => setVisible(v => !v)}
                aria-label={visible ? 'Hide access code' : 'Show access code'}
                aria-pressed={visible}
                className={cx('absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white', focusRing)}
              >
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="login-error" role="alert" className="mt-2 min-h-5 text-xs text-red-600 dark:text-red-300">
              {error}
            </p>
            <Button type="submit" variant="primary" size="lg" loading={busy} disabled={!code.trim()} className="mt-2 w-full">
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">Private area. Access is logged per session.</p>
      </div>
    </main>
  )
}
