'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { Download, KeyRound, ShieldCheck } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api, ApiError } from '@/lib/admin/api'
import AdminThemeToggle from './AdminThemeToggle'
import { saveRecoveryCodes } from './sections/MfaSettings'
import { Button } from './ui/Button'
import { TextField } from './ui/Inputs'

type Step = 'loading' | 'invalid' | 'code' | 'scan' | 'recovery'

/**
 * One-time account setup from a Settings → Team link: choose a personal access code, then enrol a
 * personal authenticator. The account becomes active only once the authenticator code is confirmed.
 */
export default function SetupScreen({ token, onDone }: { token: string; onDone: (csrf: string) => void }) {
  const [step, setStep] = useState<Step>('loading')
  const [info, setInfo] = useState<{ displayName: string; login: string } | null>(null)
  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [enrollment, setEnrollment] = useState<{ secret: string; provisioningUri: string } | null>(null)
  const [totp, setTotp] = useState('')
  const [recovery, setRecovery] = useState<{ codes: string[]; csrf: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .setupInfo(token)
      .then(result => {
        if (cancelled) return
        setInfo(result)
        setStep('code')
      })
      .catch(() => !cancelled && setStep('invalid'))
    return () => {
      cancelled = true
    }
  }, [token])

  const start = async (event: FormEvent) => {
    event.preventDefault()
    if (code !== confirm) {
      setError('The two access codes do not match.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      setEnrollment(await api.setupStart(token, code))
      setStep('scan')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Setup failed.')
    } finally {
      setBusy(false)
    }
  }

  const complete = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await api.setupComplete(token, totp.trim())
      setRecovery({ codes: result.recoveryCodes, csrf: result.csrfToken ?? '' })
      setStep('recovery')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-4 py-10 dark:bg-slate-950">
      <div aria-hidden="true" className="admin-grid-bg pointer-events-none absolute inset-0" />
      <div className="absolute right-4 top-4">
        <AdminThemeToggle />
      </div>
      <div className="admin-pop-in relative w-full max-w-md">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80 sm:p-8">
          <Image src="/nivello-logo-text-light.svg" alt="Nivello" width={160} height={46} priority className="h-auto w-[132px] dark:hidden" />
          <Image src="/nivello-logo-text.svg" alt="Nivello" width={160} height={46} priority className="hidden h-auto w-[132px] dark:block" />

          {step === 'loading' && <p className="mt-7 text-sm text-slate-500">Checking your setup link…</p>}

          {step === 'invalid' && (
            <>
              <h1 className="mt-7 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Link not valid</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">This setup link is invalid, already used or expired. Ask an admin to create a new one in Settings → Team.</p>
            </>
          )}

          {step === 'code' && info && (
            <form onSubmit={start} className="mt-7 space-y-4" noValidate>
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <KeyRound aria-hidden="true" className="h-3.5 w-3.5" /> Step 1 of 2
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome, {info.displayName}</h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                  You will sign in as <strong className="font-semibold text-slate-700 dark:text-slate-200">{info.login}</strong>. Choose a personal access code of at least 12 characters.
                </p>
              </div>
              <TextField label="Access code" type="password" autoComplete="new-password" autoFocus value={code} onChange={e => setCode(e.target.value)} />
              <TextField label="Repeat access code" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={code.length < 12 || !confirm}>
                Continue
              </Button>
            </form>
          )}

          {step === 'scan' && enrollment && (
            <form onSubmit={complete} className="mt-7 space-y-4" noValidate>
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> Step 2 of 2
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Add your authenticator</h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Scan the code with your own authenticator app (1Password, Google Authenticator, Authy…), then enter the six-digit code it shows.</p>
              </div>
              <div className="flex justify-center rounded-2xl bg-white p-4">
                <QRCodeSVG value={enrollment.provisioningUri} size={176} level="M" aria-label="Authenticator setup QR code" role="img" />
              </div>
              <p className="break-all text-center font-mono text-xs text-slate-500">{enrollment.secret}</p>
              <TextField label="Six-digit code" inputMode="numeric" autoComplete="one-time-code" autoFocus value={totp} onChange={e => setTotp(e.target.value)} />
              {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy} disabled={!/^\s*\d{6}\s*$/.test(totp)}>
                Activate my account
              </Button>
            </form>
          )}

          {step === 'recovery' && recovery && (
            <div className="mt-7 space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Save your recovery codes</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Each code works once if you lose your authenticator. They are shown only now.</p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-950 p-4">
                {recovery.codes.map(item => (
                  <code key={item} className="text-center text-sm font-semibold tracking-wider text-white">
                    {item}
                  </code>
                ))}
              </div>
              <Button variant="secondary" className="w-full" icon={<Download className="h-4 w-4" />} onClick={() => saveRecoveryCodes(recovery.codes)}>
                Download codes
              </Button>
              <Button variant="primary" size="lg" className="w-full" onClick={() => onDone(recovery.csrf)}>
                I saved them — open the admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
