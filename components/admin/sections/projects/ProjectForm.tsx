'use client'

import { Plus, X } from 'lucide-react'
import { CURRENCIES, PRIORITIES, PROJECT_STAGES } from '@/lib/admin/constants'
import type { Currency, LeadPriority, Project, ProjectStage } from '@/lib/admin/types'
import { Button } from '../../ui/Button'
import { TextArea, TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { cx, focusRing } from '../../ui/styles'

const stageOptions = PROJECT_STAGES.map(s => ({ value: s.value, label: s.label }))

export type FormState = {
  name: string
  clientName: string
  stage: ProjectStage
  priority: LeadPriority
  value: string
  currency: Currency
  startDate: string
  targetDate: string
  deliveredDate: string
  nextAction: string
  notes: string
  tags: string
  links: { label: string; url: string }[]
}

export const toForm = (p?: Project): FormState => ({
  name: p?.name ?? '',
  clientName: p?.clientName ?? '',
  stage: p?.stage ?? 'lead',
  priority: p?.priority ?? 'normal',
  value: p?.value !== null && p?.value !== undefined ? String(p.value / 100) : '',
  currency: p?.currency ?? 'EUR',
  startDate: p?.startDate ?? '',
  targetDate: p?.targetDate ?? '',
  deliveredDate: p?.deliveredDate ?? '',
  nextAction: p?.nextAction ?? '',
  notes: p?.notes ?? '',
  tags: p?.tags.join(', ') ?? '',
  links: p?.links ?? []
})

export const fromForm = (f: FormState) => ({
  name: f.name,
  clientName: f.clientName,
  stage: f.stage,
  priority: f.priority,
  value: f.value.trim() === '' ? null : Number(f.value.replace(',', '.')),
  currency: f.currency,
  startDate: f.startDate || null,
  targetDate: f.targetDate || null,
  deliveredDate: f.deliveredDate || null,
  nextAction: f.nextAction,
  notes: f.notes,
  tags: f.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean),
  links: f.links.filter(l => l.url.trim())
})

export function ProjectFields({ form, setForm }: { form: FormState; setForm: (update: (f: FormState) => FormState) => void }) {
  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm(f => ({ ...f, [key]: value }))
  return (
    <div className="space-y-4">
      <TextField label="Project name" value={form.name} maxLength={120} onChange={e => set('name')(e.target.value)} required />
      <TextField label="Client" value={form.clientName} maxLength={120} onChange={e => set('clientName')(e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Stage</span>
          <Select label="Stage" value={form.stage} onChange={set('stage')} options={stageOptions} />
        </label>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Priority</span>
          <Select label="Priority" value={form.priority} onChange={set('priority')} options={PRIORITIES} />
        </label>
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField label="Value (optional)" inputMode="decimal" value={form.value} onChange={e => set('value')(e.target.value)} placeholder="e.g. 2400" />
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Currency</span>
          <Select label="Currency" value={form.currency} onChange={set('currency')} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField label="Start" type="date" value={form.startDate} onChange={e => set('startDate')(e.target.value)} />
        <TextField label="Target" type="date" value={form.targetDate} onChange={e => set('targetDate')(e.target.value)} />
        <TextField label="Delivered" type="date" value={form.deliveredDate} onChange={e => set('deliveredDate')(e.target.value)} />
      </div>
      <TextField label="Next action" value={form.nextAction} maxLength={200} onChange={e => set('nextAction')(e.target.value)} placeholder="e.g. Send homepage design" />
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Links</p>
        <div className="space-y-2">
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label="Link label"
                value={link.label}
                maxLength={60}
                placeholder="Label"
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    links: f.links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l))
                  }))
                }
                className="h-9 w-28 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-slate-900"
              />
              <input
                aria-label="Link URL"
                value={link.url}
                maxLength={500}
                placeholder="https://"
                inputMode="url"
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    links: f.links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l))
                  }))
                }
                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-slate-900"
              />
              <button
                type="button"
                aria-label="Remove link"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    links: f.links.filter((_, j) => j !== i)
                  }))
                }
                className={cx('flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07]', focusRing)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {form.links.length < 12 && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                setForm(f => ({
                  ...f,
                  links: [...f.links, { label: '', url: '' }]
                }))
              }
            >
              Add link
            </Button>
          )}
          <p className="text-xs text-slate-400">Production, staging, GitHub, Figma, docs. Never store passwords or credentials here.</p>
        </div>
      </div>
      <TextField label="Tags" value={form.tags} onChange={e => set('tags')(e.target.value)} placeholder="Comma separated, e.g. retainer, ecommerce" />
      <TextArea label="Notes" value={form.notes} maxLength={10000} onChange={e => set('notes')(e.target.value)} />
    </div>
  )
}
