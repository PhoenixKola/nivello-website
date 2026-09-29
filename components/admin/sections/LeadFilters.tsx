'use client'

import { useRef, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { EMPTY_FILTERS, LEAD_STATUSES, PRIORITIES, PRIORITY_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import type { LeadFilters, LeadList, Tag } from '@/lib/admin/types'
import { Button } from '../ui/Button'
import { Switch } from '../ui/Controls'
import { SearchInput } from '../ui/Inputs'
import { MultiSelect, Select } from '../ui/Listbox'
import Popover from '../ui/Popover'
import { cx, focusRing, labelText } from '../ui/styles'

type Props = {
  filters: LeadFilters
  onChange: (next: LeadFilters) => void
  facets: LeadList['facets'] | null
  tags: Tag[]
  batchLabel: string | null
}

const ANY = '__any__'

function facetOptions(values: string[] | undefined, current: string, anyLabel: string) {
  const list = values ?? []
  const withCurrent = current && !list.includes(current) ? [current, ...list] : list
  return [{ value: ANY, label: anyLabel }, ...withCurrent.map(v => ({ value: v, label: v }))]
}

export function countActiveFilters(filters: LeadFilters) {
  return (
    filters.status.length +
    filters.priority.length +
    [filters.country, filters.city, filters.category, filters.tag, filters.batch].filter(Boolean).length +
    [filters.noWebsite, filters.hasEmail, filters.hasInstagram, filters.followUpDue].filter(Boolean).length
  )
}

export default function LeadFiltersBar({ filters, onChange, facets, tags, batchLabel }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLButtonElement>(null)
  const set = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => onChange({ ...filters, [key]: value })
  const extraCount = [filters.country, filters.city, filters.category, filters.tag].filter(Boolean).length + [filters.noWebsite, filters.hasEmail, filters.hasInstagram, filters.followUpDue].filter(Boolean).length

  const chips: { key: string; label: string; clear: () => void }[] = []
  if (filters.batch) chips.push({ key: 'batch', label: `Batch: ${batchLabel ?? 'loading…'}`, clear: () => set('batch', '') })
  filters.status.forEach(s => chips.push({ key: `s-${s}`, label: `Status: ${STATUS_LABEL[s]}`, clear: () => set('status', filters.status.filter(v => v !== s)) }))
  filters.priority.forEach(p => chips.push({ key: `p-${p}`, label: `Priority: ${PRIORITY_LABEL[p]}`, clear: () => set('priority', filters.priority.filter(v => v !== p)) }))
  if (filters.country) chips.push({ key: 'country', label: `Country: ${filters.country}`, clear: () => set('country', '') })
  if (filters.city) chips.push({ key: 'city', label: `City: ${filters.city}`, clear: () => set('city', '') })
  if (filters.category) chips.push({ key: 'category', label: `Category: ${filters.category}`, clear: () => set('category', '') })
  if (filters.tag) chips.push({ key: 'tag', label: `Tag: ${tags.find(t => t.id === filters.tag)?.name ?? 'deleted tag'}`, clear: () => set('tag', '') })
  if (filters.noWebsite) chips.push({ key: 'nw', label: 'No website', clear: () => set('noWebsite', false) })
  if (filters.hasEmail) chips.push({ key: 'he', label: 'Has email', clear: () => set('hasEmail', false) })
  if (filters.hasInstagram) chips.push({ key: 'hi', label: 'Has Instagram', clear: () => set('hasInstagram', false) })
  if (filters.followUpDue) chips.push({ key: 'fd', label: 'Follow-up due', clear: () => set('followUpDue', false) })

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))_auto]">
        <SearchInput value={filters.q} onChange={q => set('q', q)} placeholder="Search company, phone, email, city…" label="Search leads" className="sm:col-span-2 lg:col-span-1" />
        <MultiSelect label="Status" values={filters.status} onChange={v => set('status', v)} options={LEAD_STATUSES} placeholder="Any status" />
        <MultiSelect label="Priority" values={filters.priority} onChange={v => set('priority', v)} options={PRIORITIES} placeholder="Any priority" />
        <Button ref={moreRef} variant="secondary" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setMoreOpen(o => !o)} aria-expanded={moreOpen} aria-haspopup="dialog" className="sm:col-span-2 lg:col-span-1">
          More filters
          {extraCount > 0 && <span className="rounded-full bg-[var(--brand-blue)]/12 px-1.5 text-[10px] font-semibold text-[#0b6fc0] dark:bg-[var(--brand-gold)]/15 dark:text-[var(--brand-gold)]">{extraCount}</span>}
        </Button>
      </div>

      <Popover anchorRef={moreRef} open={moreOpen} onClose={() => setMoreOpen(false)} align="end" minWidth={320} className="p-4" role="dialog" ariaLabel="More filters">
        <div className="grid gap-3">
          <div>
            <p className={labelText}>Country</p>
            <Select label="Country" value={filters.country || ANY} onChange={v => set('country', v === ANY ? '' : v)} options={facetOptions(facets?.countries, filters.country, 'Any country')} />
          </div>
          <div>
            <p className={labelText}>City</p>
            <Select label="City" value={filters.city || ANY} onChange={v => set('city', v === ANY ? '' : v)} options={facetOptions(facets?.cities, filters.city, 'Any city')} />
          </div>
          <div>
            <p className={labelText}>Category</p>
            <Select label="Category" value={filters.category || ANY} onChange={v => set('category', v === ANY ? '' : v)} options={facetOptions(facets?.categories, filters.category, 'Any category')} />
          </div>
          <div>
            <p className={labelText}>Tag</p>
            <Select label="Tag" value={filters.tag || ANY} onChange={v => set('tag', v === ANY ? '' : v)} options={[{ value: ANY, label: 'Any tag' }, ...tags.map(t => ({ value: t.id, label: t.name }))]} />
          </div>
          <div className="mt-1 space-y-3 border-t border-slate-100 pt-3 dark:border-white/[0.07]">
            <Switch checked={filters.noWebsite} onChange={v => set('noWebsite', v)} label="No website" />
            <Switch checked={filters.hasEmail} onChange={v => set('hasEmail', v)} label="Has email" />
            <Switch checked={filters.hasInstagram} onChange={v => set('hasInstagram', v)} label="Has Instagram" />
            <Switch checked={filters.followUpDue} onChange={v => set('followUpDue', v)} label="Follow-up due" />
          </div>
        </div>
      </Popover>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Active filters">
          {chips.map(chip => (
            <span
              key={chip.key}
              className={cx(
                'inline-flex h-7 max-w-full items-center gap-1 rounded-full pl-2.5 pr-1 text-xs font-medium',
                chip.key === 'batch'
                  ? 'bg-[var(--brand-blue)]/10 text-[#0b6fc0] ring-1 ring-inset ring-[var(--brand-blue)]/25 dark:bg-[var(--brand-gold)]/12 dark:text-[var(--brand-gold)] dark:ring-[var(--brand-gold)]/30'
                  : 'bg-slate-100 text-slate-700 dark:bg-white/[0.07] dark:text-slate-200'
              )}
            >
              <span className="truncate">{chip.label}</span>
              <button type="button" onClick={chip.clear} aria-label={`Remove filter ${chip.label}`} className={cx('flex h-5 w-5 cursor-pointer items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10', focusRing)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q })} className={cx('ml-1 cursor-pointer rounded px-1 text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:hover:text-white', focusRing)}>
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
