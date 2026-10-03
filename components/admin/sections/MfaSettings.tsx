'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, Download, KeyRound, ShieldCheck, ShieldOff } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { api, ApiError, type MfaStatus } from '@/lib/admin/api'
import { formatDateTime } from '@/lib/admin/format'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { TextField } from '../ui/Inputs'
import { Modal } from '../ui/Overlay'

type Enrollment = { secret: string; provisioningUri: string; expiresIn: number }
type SetupStep = 'password' | 'scan' | 'recovery'

function saveRecoveryCodes(codes: string[]) {
  const contents = ['Nivello Admin recovery codes', 'Each code can be used once.', '', ...codes, ''].join('\n')
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'nivello-admin-recovery-codes.txt'
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function MfaSettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupStep, setSetupStep] = useState<SetupStep>('password')
  const [accessCode, setAccessCode] = useState('')
  const [token, setToken] = useState('')
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [disableOpen, setDisableOpen] = useState(false)
  const [disableAccessCode, setDisableAccessCode] = useState('')
  const [disableToken, setDisableToken] = useState('')

  useEffect(() => {
    let cancelled = false
    api.mfaStatus().then(
      result => {
        if (!cancelled) {
          setStatus(result)
          setLoadError(null)
        }
      },
      error => {
        if (!cancelled) setLoadError((error as Error).message)
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  const openSetup = () => {
    setSetupStep('password')
    setAccessCode('')
    setToken('')
    setEnrollment(null)
    setRecoveryCodes([])
    setCopied(false)
    setError(null)
    setSetupOpen(true)
  }

  const startEnrollment = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!accessCode || busy) return
    setBusy(true)
    setError(null)
    try {
      setEnrollment(await api.startMfaEnrollment(accessCode))
      setAccessCode('')
      setSetupStep('scan')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start authenticator setup.')
    } finally {
      setBusy(false)
    }
  }

  const confirmEnrollment = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!/^\d{6}$/.test(token.trim()) || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await api.confirmMfaEnrollment(token.trim())
      setStatus(result.status)
      setRecoveryCodes(result.recoveryCodes)
      setToken('')
      setSetupStep('recovery')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify that code.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!disableAccessCode || !disableToken.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      setStatus(await api.disableMfa(disableAccessCode, disableToken.trim()))
      setDisableOpen(false)
      setDisableAccessCode('')
      setDisableToken('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not disable authenticator verification.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Two-factor authentication"
          description="Require a rotating code from an authenticator app after the access code."
          actions={
            status?.enabled ? (
              <Button size="sm" variant="secondary" icon={<ShieldOff className="h-3.5 w-3.5" />} onClick={() => { setError(null); setDisableOpen(true) }}>
                Disable
              </Button>
            ) : (
              <Button size="sm" variant="primary" icon={<ShieldCheck className="h-3.5 w-3.5" />} onClick={openSetup} disabled={!status}>
                Set up
              </Button>
            )
          }
        />
        <div className="px-5 pb-5 pt-3">
          {loadError ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-300">Could not load security settings: {loadError}</p>
          ) : !status ? (
            <p className="text-sm text-slate-400">Loading security settings…</p>
          ) : status.enabled ? (
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3.5 dark:bg-emerald-400/10">
              <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Authenticator verification is enabled</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800/80 dark:text-emerald-100/70">
                  {status.enabledAt ? `Enabled ${formatDateTime(status.enabledAt)}. ` : ''}{status.recoveryCodesRemaining} recovery codes remain.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 dark:bg-amber-400/10">
              <KeyRound aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Only the access code is required</p>
                <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-100/70">Setup works with Google Authenticator, Microsoft Authenticator, 1Password, Authy, and other TOTP apps.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Modal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        size="sm"
        title={setupStep === 'recovery' ? 'Save your recovery codes' : 'Set up an authenticator'}
        description={setupStep === 'password' ? 'Confirm the current access code before adding a second factor.' : setupStep === 'scan' ? 'The QR code is generated in this browser and is never sent to another service.' : 'These codes are shown once. Keep them somewhere separate from your phone.'}
        footer={
          setupStep === 'recovery' ? (
            <Button variant="primary" onClick={() => setSetupOpen(false)}>I saved these codes</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setSetupOpen(false)} disabled={busy}>Cancel</Button>
              <Button variant="primary" loading={busy} disabled={setupStep === 'password' ? !accessCode : !/^\d{6}$/.test(token.trim())} onClick={() => setupStep === 'password' ? startEnrollment() : confirmEnrollment()}>
                {setupStep === 'password' ? 'Continue' : 'Verify and enable'}
              </Button>
            </>
          )
        }
      >
        {setupStep === 'password' && (
          <form onSubmit={startEnrollment}>
            <TextField label="Access code" type="password" autoComplete="current-password" value={accessCode} onChange={event => setAccessCode(event.target.value)} data-autofocus />
            {error && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-300">{error}</p>}
          </form>
        )}

        {setupStep === 'scan' && enrollment && (
          <form onSubmit={confirmEnrollment} className="space-y-5">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <QRCodeSVG value={enrollment.provisioningUri} size={180} level="M" aria-label="Authenticator setup QR code" role="img" />
              </div>
              <div className="w-full text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">Can’t scan it? Enter this setup key manually:</p>
                <code className="mt-1.5 block break-all rounded-lg bg-white px-3 py-2 text-xs font-semibold tracking-[0.12em] text-slate-800 dark:bg-slate-950 dark:text-slate-100">{enrollment.secret}</code>
              </div>
            </div>
            <TextField label="Six-digit authenticator code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={token} onChange={event => setToken(event.target.value.replace(/\D/g, '').slice(0, 6))} data-autofocus />
            {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
          </form>
        )}

        {setupStep === 'recovery' && (
          <div>
            <div className="grid grid-cols-1 gap-2 rounded-xl bg-slate-950 p-4 sm:grid-cols-2 dark:bg-black/40">
              {recoveryCodes.map(code => <code key={code} className="text-center text-sm font-semibold tracking-wider text-white">{code}</code>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                onClick={async () => {
                  await navigator.clipboard.writeText(recoveryCodes.join('\n'))
                  setCopied(true)
                }}
              >
                {copied ? 'Copied' : 'Copy all'}
              </Button>
              <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={() => saveRecoveryCodes(recoveryCodes)}>Download</Button>
            </div>
            <p className="mt-4 text-xs leading-5 text-amber-700 dark:text-amber-200">If you lose both your authenticator and these recovery codes, MFA must be reset directly on the server.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        size="sm"
        title="Disable two-factor authentication?"
        description="Future logins will only require the shared access code. Confirm both factors to continue."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisableOpen(false)} disabled={busy}>Cancel</Button>
            <Button variant="danger" loading={busy} disabled={!disableAccessCode || !disableToken.trim()} onClick={() => disable()}>Disable MFA</Button>
          </>
        }
      >
        <form onSubmit={disable} className="space-y-4">
          <TextField label="Access code" type="password" autoComplete="current-password" value={disableAccessCode} onChange={event => setDisableAccessCode(event.target.value)} data-autofocus />
          <TextField label="Authenticator or recovery code" autoComplete="one-time-code" value={disableToken} onChange={event => setDisableToken(event.target.value)} />
          {error && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{error}</p>}
        </form>
      </Modal>
    </>
  )
}
