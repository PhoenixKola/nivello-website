'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Info, Radar, WifiOff } from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { SEARCH_LANGUAGES } from '@/lib/admin/constants'
import type { Batch, SearchLanguage } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, NumberStepper, Pagination, Skeleton, Switch } from '../ui/Controls'
import { Field, TextField } from '../ui/Inputs'
import { MultiSelect } from '../ui/Listbox'
import { useToast } from '../ui/Toast'
import DiscoveryCard from './DiscoveryCard'

type FormState = {
  country: string
  city: string
  category: string
  target: number
  languages: SearchLanguage[]
  noWebsite: boolean
  requirePhone: boolean
  email: boolean
  instagram: boolean
}

const INITIAL: FormState = { country: '', city: '', category: '', target: 50, languages: ['en'], noWebsite: true, requirePhone: true, email: false, instagram: false }

function RecentActivity() {
  const { dataVersion, openBatches } = useAdmin()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: Batch[]; pages: number; total: number } | null>(null)
  const [reload, setReload] = useState(0)
  const openKey = openBatches.map(b => `${b.id}:${b.status}`).join('|')

  useEffect(() => {
    let cancelled = false
    api
      .batches(page, 3)
      .then(result => !cancelled && setData(result))
      .catch(() => !cancelled && setData(d => d ?? { items: [], pages: 1, total: 0 }))
    return () => {
      cancelled = true
    }
  }, [page, dataVersion, reload, openKey])

  const live = new Map(openBatches.map(b => [b.id, b]))
  return (
    <section aria-labelledby="recent-discovery" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="recent-discovery" className="text-sm font-semibold text-slate-900 dark:text-white">
          Recent activity
        </h2>
        {data && data.pages > 1 && <Pagination page={Math.min(page, data.pages)} pages={data.pages} onPage={setPage} label="Recent discovery pages" compact />}
      </div>
      {!data ? (
        <div className="space-y-3">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon={<Radar className="h-5 w-5" />} title="No discoveries yet" description="Start one with the form. Progress appears here while it runs." />
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map(batch => (
            <DiscoveryCard key={batch.id} batch={live.get(batch.id) ?? batch} onChanged={() => setReload(r => r + 1)} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function FindLeads() {
  const { health, refreshHealth, trackBatch, openBatches } = useAdmin()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const discoveryUnavailable = health !== null && !health.discovery.available
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: typeof errors = {}
    if (!form.country.trim()) nextErrors.country = 'Country is required.'
    if (!form.city.trim()) nextErrors.city = 'City is required.'
    if (!form.languages.length) nextErrors.languages = 'Select at least one language.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      const { batch } = await api.startDiscovery({ ...form, email: !form.noWebsite && form.email, instagram: !form.noWebsite && form.instagram })
      trackBatch(batch)
      toast.success(
        batch.status === 'queued' ? 'Discovery queued' : 'Discovery started',
        batch.status === 'queued' ? 'It will start when the current discovery finishes.' : `Looking for ${batch.params.target} qualified leads.`
      )
    } catch (error) {
      if (error instanceof ApiError && error.code === 'DISCOVERY_UNAVAILABLE') refreshHealth(true)
      toast.error('Could not start discovery', (error as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const broad = !form.category.trim() || /^(business(es)?|compan(y|ies)|shops?|stores?|services?|all|any)$/i.test(form.category.trim())

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <Card className="self-start">
        <CardHeader title="New discovery" description="Runs on GitHub Actions, finds businesses on Google Maps, and imports only those that match your filters. You can close this tab while it runs." />
        <form onSubmit={submit} noValidate className="space-y-4 p-5">
          {discoveryUnavailable && health && (
            <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Lead discovery unavailable</p>
                <p className="mt-0.5">CRM and lead management are still available.</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                  {health.discovery.issues.map(issue => (
                    <li key={issue.code}>{issue.message}</li>
                  ))}
                </ul>
                <p className="mt-1.5">See Settings for the GitHub Actions integration status.</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Country" required value={form.country} onChange={e => set('country', e.target.value)} placeholder="Albania" error={errors.country} autoComplete="off" />
            <TextField label="City" required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Tirana" error={errors.city} autoComplete="off" />
          </div>
          <TextField
            label="Business category"
            value={form.category}
            onChange={e => set('category', e.target.value)}
            placeholder="e.g. dentist, restaurant (optional)"
            hint={broad ? 'Blank or generic: searches across ~50 common business categories.' : undefined}
            autoComplete="off"
          />
          <Field label="Qualified leads wanted" hint="Number of new leads that pass your filters and get imported. Duplicates and rejected businesses do not count." htmlFor="target">
            <NumberStepper id="target" label="Qualified leads wanted" value={form.target} onChange={v => set('target', v)} min={1} max={5000} step={10} />
          </Field>
          <Field label="Search languages" error={errors.languages} hint="Languages control the Google Maps search locale. They do not prove that a business speaks that language." htmlFor="languages">
            <MultiSelect id="languages" label="Search languages" values={form.languages} onChange={v => set('languages', v)} options={SEARCH_LANGUAGES.map(l => ({ value: l.value, label: l.label, hint: l.value }))} placeholder="Select languages" />
          </Field>

          <div className="space-y-4 rounded-xl border border-slate-200/80 p-4 dark:border-white/[0.08]">
            <Switch checked={form.noWebsite} onChange={v => set('noWebsite', v)} label="Only businesses without a website" description="Businesses that already list a website are rejected." />
            <Switch checked={form.requirePhone} onChange={v => set('requirePhone', v)} label="Must have phone" />
            <Switch
              checked={!form.noWebsite && form.email}
              onChange={v => set('email', v)}
              disabled={form.noWebsite}
              label="Extract email from website"
              description={form.noWebsite ? 'Unavailable while “Only businesses without a website” is on.' : 'Slower: the scraper visits each website.'}
            />
            <Switch
              checked={!form.noWebsite && form.instagram}
              onChange={v => set('instagram', v)}
              disabled={form.noWebsite}
              label="Find Instagram from website"
              description={form.noWebsite ? 'Unavailable while “Only businesses without a website” is on.' : 'Slower: checks each imported website’s homepage.'}
            />
          </div>

          {openBatches.length > 0 && (
            <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              One discovery runs at a time on GitHub Actions; a new one is queued and starts automatically.
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={discoveryUnavailable} icon={<Radar className="h-4 w-4" />} className="w-full">
            Start discovery
          </Button>
        </form>
      </Card>
      <RecentActivity />
    </div>
  )
}
