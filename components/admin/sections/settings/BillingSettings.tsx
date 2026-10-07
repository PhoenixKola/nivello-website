'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/admin/api'
import type { BillingMeta, BillingProfile } from '@/lib/admin/types'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { Skeleton, Switch } from '../../ui/Controls'
import { TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { useToast } from '../../ui/Toast'

/** Settings → Billing: Nivello's own fiscal identity for Fatture. Nothing is pre-filled or invented. */
export default function BillingSettings() {
  const toast = useToast()
  const [meta, setMeta] = useState<BillingMeta | null>(null)
  const [form, setForm] = useState<BillingProfile | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .billing()
      .then(result => {
        if (cancelled) return
        setMeta(result)
        setForm(result.profile)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [])

  if (error && !meta) return <Card><p className="p-5 text-sm text-red-600">{error}</p></Card>
  if (!meta || !form) return <Skeleton className="h-96" />

  const set = <K extends keyof BillingProfile>(key: K, value: BillingProfile[K]) => setForm(f => (f ? { ...f, [key]: value } : f))
  const save = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await api.saveBilling(form)
      setMeta(result)
      setForm(result.profile)
      toast.success('Billing profile saved')
    } catch (err) {
      toast.error('Not saved', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2" noValidate>
      <Card className="xl:col-span-2">
        <div className="flex items-start gap-3 px-5 py-4">
          {meta.missing.length ? <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" /> : <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
          <div className="text-sm">
            <p className="font-semibold text-slate-900 dark:text-white">{meta.missing.length ? 'Fatture cannot be finalized yet' : 'Ready to finalize Fatture'}</p>
            <p className="mt-0.5 text-slate-500 dark:text-slate-400">
              {meta.missing.length ? `Missing: ${meta.missing.join(', ')}.` : 'These details are copied into each Fattura when it is finalized, so later edits never change issued documents.'} Use the details registered with the Agenzia delle Entrate; this information is stored privately on the server.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Fiscal identity" description="Cedente / prestatore" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2">
          <TextField label="Legal name (denominazione)" wrapperClassName="sm:col-span-2" maxLength={80} value={form.name} onChange={e => set('name', e.target.value)} />
          <TextField label="Partita IVA" inputMode="numeric" maxLength={11} value={form.vatNumber} onChange={e => set('vatNumber', e.target.value.replace(/\s/g, ''))} />
          <TextField label="Codice fiscale (if different)" maxLength={16} value={form.taxCode} onChange={e => set('taxCode', e.target.value.toUpperCase())} />
          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Regime fiscale</span>
            <Select
              label="Regime fiscale"
              value={form.taxRegime}
              onChange={v => set('taxRegime', v)}
              options={[{ value: '', label: 'Choose the regime registered for Nivello' }, ...Object.entries(meta.taxRegimes).map(([value, label]) => ({ value, label: `${value} — ${label}` }))]}
            />
          </div>
          <TextField label="PEC" type="email" maxLength={200} value={form.pec} onChange={e => set('pec', e.target.value)} />
          <TextField label="Transmitter tax ID (optional)" maxLength={28} hint="Leave empty to use the Partita IVA in the SdI file name." value={form.transmitterId} onChange={e => set('transmitterId', e.target.value.toUpperCase())} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Registered address" />
        <div className="grid grid-cols-6 gap-3 px-5 pb-5 pt-3">
          <TextField label="Address" wrapperClassName="col-span-6 sm:col-span-4" maxLength={60} value={form.address} onChange={e => set('address', e.target.value)} />
          <TextField label="Number" wrapperClassName="col-span-2 sm:col-span-2" maxLength={8} value={form.streetNumber} onChange={e => set('streetNumber', e.target.value)} />
          <TextField label="CAP" wrapperClassName="col-span-4 sm:col-span-2" inputMode="numeric" maxLength={5} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
          <TextField label="Comune" wrapperClassName="col-span-6 sm:col-span-2" maxLength={60} value={form.city} onChange={e => set('city', e.target.value)} />
          <TextField label="Provincia" wrapperClassName="col-span-3 sm:col-span-1" maxLength={2} value={form.province} onChange={e => set('province', e.target.value.toUpperCase())} />
          <TextField label="Country" wrapperClassName="col-span-3 sm:col-span-1" maxLength={2} value={form.country} onChange={e => set('country', e.target.value.toUpperCase())} />
          <TextField label="Email (shown on invoices)" wrapperClassName="col-span-6 sm:col-span-3" type="email" maxLength={200} value={form.email} onChange={e => set('email', e.target.value)} />
          <TextField label="Phone" wrapperClassName="col-span-6 sm:col-span-3" maxLength={20} value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="Payment details" description="Optional. Bank details are included in the XML and the courtesy PDF only when you choose so." />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="IBAN" maxLength={34} value={form.iban} onChange={e => set('iban', e.target.value.toUpperCase().replace(/\s/g, ''))} />
          <TextField label="Bank" maxLength={80} value={form.bankName} onChange={e => set('bankName', e.target.value)} />
          <TextField label="Default payment terms" maxLength={200} value={form.defaultPaymentTerms} onChange={e => set('defaultPaymentTerms', e.target.value)} placeholder="e.g. Bonifico a 30 giorni data fattura" />
          <div className="sm:col-span-2 lg:col-span-3">
            <Switch checked={form.showBankDetails} onChange={v => set('showBankDetails', v)} label="Show bank details on the courtesy PDF" />
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
          <Button type="submit" variant="primary" loading={busy}>
            Save billing profile
          </Button>
        </div>
      </Card>
    </form>
  )
}
