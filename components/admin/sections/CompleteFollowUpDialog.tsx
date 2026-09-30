'use client'

import { useState } from 'react'
import { api } from '@/lib/admin/api'
import type { LeadDetail } from '@/lib/admin/types'
import { Button } from '../ui/Button'
import DateTimePicker from '../ui/DateTimePicker'
import { TextField } from '../ui/Inputs'
import { Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing, labelText } from '../ui/styles'

type Target = { id: string; companyName: string; nextAction: string }

/** 09:00 local time, `days` from today. */
function morning(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(9, 0, 0, 0)
  return date.toISOString()
}

const QUICK = [
  { label: 'No next follow-up', days: null },
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 }
] as const

/** Marks a follow-up done (logged in the lead's activity) and optionally schedules the next one. */
export default function CompleteFollowUpDialog({ lead, onClose, onDone }: { lead: Target | null; onClose: () => void; onDone: (detail: LeadDetail) => void }) {
  return lead ? <Dialog key={lead.id} lead={lead} onClose={onClose} onDone={onDone} /> : null
}

function Dialog({ lead, onClose, onDone }: { lead: Target; onClose: () => void; onDone: (detail: LeadDetail) => void }) {
  const toast = useToast()
  const [next, setNext] = useState<string | null>(null)
  const [quick, setQuick] = useState<number | null>(null)
  const [nextAction, setNextAction] = useState(lead.nextAction)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const detail = await api.completeFollowUp(lead.id, { at: next, ...(nextAction.trim() !== lead.nextAction ? { nextAction: nextAction.trim() } : {}) })
      toast.success(next ? 'Follow-up done · next one scheduled' : 'Follow-up marked done')
      onDone(detail)
    } catch (error) {
      toast.error('Could not update follow-up', (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Complete follow-up · ${lead.companyName}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={submit}>
            {next ? 'Complete & schedule' : 'Complete'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <p className={labelText}>Next follow-up</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Next follow-up">
            {QUICK.map(option => {
              const active = option.days === null ? next === null : quick === option.days && next !== null
              return (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setQuick(option.days)
                    setNext(option.days === null ? null : morning(option.days))
                  }}
                  className={cx(
                    'h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium ring-1 ring-inset transition-colors',
                    active ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-950 dark:ring-white' : 'text-slate-600 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/[0.05]',
                    focusRing
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
          <div className="mt-2">
            <DateTimePicker
              label="Next follow-up date"
              value={next}
              onChange={value => {
                setQuick(null)
                setNext(value)
              }}
              placeholder="Or pick a date and time"
            />
          </div>
        </div>
        <TextField label="Next action" value={nextAction} maxLength={300} onChange={e => setNextAction(e.target.value)} placeholder="e.g. Send the website mock-up" />
        <p className="text-xs text-slate-500 dark:text-slate-400">The completion is recorded in the lead’s activity.</p>
      </div>
    </Modal>
  )
}
