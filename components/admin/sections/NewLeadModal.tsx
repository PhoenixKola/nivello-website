'use client'

import { useState, type FormEvent } from 'react'
import { api, ApiError } from '@/lib/admin/api'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Inputs'
import { Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'

const EMPTY = { companyName: '', category: '', city: '', country: '', phone: '', email: '', website: '' }

export default function NewLeadModal({ open, onClose, onCreated, onOpenExisting }: { open: boolean; onClose: () => void; onCreated: (id: string) => void; onOpenExisting: (id: string) => void }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateOf, setDuplicateOf] = useState<string | null>(null)
  const set = (key: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: event.target.value }))

  const close = () => {
    setForm(EMPTY)
    setError(null)
    setDuplicateOf(null)
    onClose()
  }

  const submit = async (event?: FormEvent, force = false) => {
    event?.preventDefault()
    if (!form.companyName.trim()) {
      setError('Company name is required.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const detail = await api.createLead(form, force)
      toast.success('Lead created', detail.lead.companyName)
      onCreated(detail.lead.id)
      close()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'DUPLICATE_LEAD') {
        setDuplicateOf(String(err.details?.leadId ?? ''))
        setError(err.message)
      } else {
        setError((err as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="New lead"
      description="Add a business manually. You can fill in CRM details afterwards."
      footer={
        duplicateOf ? (
          <>
            <Button
              variant="ghost"
              onClick={() => {
                onOpenExisting(duplicateOf)
                close()
              }}
            >
              Open existing lead
            </Button>
            <Button variant="primary" loading={busy} onClick={() => submit(undefined, true)}>
              Create anyway
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" loading={busy} onClick={() => submit()}>
              Create lead
            </Button>
          </>
        )
      }
    >
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2" noValidate>
        <TextField label="Company name" required value={form.companyName} onChange={set('companyName')} className="sm:col-span-2" data-autofocus maxLength={200} />
        <TextField label="Category" value={form.category} onChange={set('category')} maxLength={120} />
        <TextField label="City" value={form.city} onChange={set('city')} maxLength={120} />
        <TextField label="Country" value={form.country} onChange={set('country')} maxLength={120} />
        <TextField label="Phone" type="tel" value={form.phone} onChange={set('phone')} maxLength={40} />
        <TextField label="Email" type="email" value={form.email} onChange={set('email')} maxLength={200} />
        <TextField label="Website" type="url" value={form.website} onChange={set('website')} maxLength={500} placeholder="https://" />
        {error && (
          <p role="alert" className="text-sm text-red-600 sm:col-span-2 dark:text-red-300">
            {error}
          </p>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  )
}
