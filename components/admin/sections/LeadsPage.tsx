'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowDownUp, Download, Plus, SearchX, Upload, Users } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { BUILT_IN_VIEWS, EMPTY_FILTERS, LEAD_STATUSES } from '@/lib/admin/constants'
import { formatNumber } from '@/lib/admin/format'
import { useDebounced, useNow } from '@/lib/admin/hooks'
import type { LeadFilters, LeadList, LeadSort, LeadStatus, SavedView } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState, Pagination, Skeleton } from '../ui/Controls'
import { Select } from '../ui/Listbox'
import { useToast } from '../ui/Toast'
import BulkBar from './BulkBar'
import CsvImportModal from './CsvImportModal'
import { batchChipLabel } from './DiscoveryCard'
import LeadFiltersBar, { countActiveFilters } from './LeadFilters'
import LeadTable from './LeadTable'
import LeadViews from './LeadViews'
import NewLeadModal from './NewLeadModal'

const SORTS: { value: string; label: string }[] = [
  { value: 'updated:desc', label: 'Recently updated' },
  { value: 'created:desc', label: 'Newest first' },
  { value: 'score:desc', label: 'Highest score' },
  { value: 'followUp:asc', label: 'Next follow-up' },
  { value: 'company:asc', label: 'Company A–Z' }
]

function initialState(params: URLSearchParams): { filters: LeadFilters; view: string | null; plain: boolean } {
  const view = BUILT_IN_VIEWS.find(v => v.id === params.get('view'))
  const filters: LeadFilters = { ...EMPTY_FILTERS, ...(view?.filters ?? {}) }
  const status = params.get('status')
  if (status && LEAD_STATUSES.some(s => s.value === status)) filters.status = [status as LeadStatus]
  const batch = params.get('batch')
  if (batch && /^batch_[a-f0-9]{16}$/.test(batch)) filters.batch = batch
  return { filters, view: view?.id ?? (status || batch ? null : 'all'), plain: !view && !status && !batch }
}

export default function LeadsPage() {
  const { route, navigate, tags, dataVersion, openLead, notifyChanged } = useAdmin()
  const toast = useToast()
  const now = useNow(60000)
  const [initial] = useState(() => initialState(route.params))
  const [filters, setFiltersState] = useState<LeadFilters>(initial.filters)
  const [activeView, setActiveView] = useState<string | null>(initial.view)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [sort, setSort] = useState('updated:desc')
  const [data, setData] = useState<LeadList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [allMatching, setAllMatching] = useState(false)
  const [views, setViews] = useState<SavedView[]>([])
  const [batchLabel, setBatchLabel] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(() => route.params.get('new') === '1')
  const [reload, setReload] = useState(0)
  const q = useDebounced(filters.q, 300)
  const query = useMemo(() => ({ ...filters, q }), [filters, q])
  const [sortKey, dir] = sort.split(':') as [LeadSort, 'asc' | 'desc']

  const setFilters = (next: LeadFilters, view: string | null = null) => {
    setFiltersState(next)
    setActiveView(view)
    setPage(1)
    setSelected(new Set())
    setAllMatching(false)
  }

  useEffect(() => {
    let cancelled = false
    api
      .views()
      .then(result => {
        if (cancelled) return
        setViews(result.views)
        // A default saved view applies when Leads opens without a view or filter in the link.
        const preferred = initial.plain ? result.views.find(v => v.isDefault) : undefined
        if (preferred) {
          setFiltersState(current => (current === initial.filters ? { ...EMPTY_FILTERS, ...preferred.filters } : current))
          setActiveView(current => (current === initial.view ? preferred.id : current))
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [initial])

  useEffect(() => {
    if (!filters.batch) return
    let cancelled = false
    api
      .batch(filters.batch)
      .then(result => !cancelled && setBatchLabel(batchChipLabel(result.batch)))
      .catch(() => !cancelled && setBatchLabel('deleted discovery'))
    return () => {
      cancelled = true
    }
  }, [filters.batch])

  useEffect(() => {
    const controller = new AbortController()
    api
      .leads(query, page, pageSize, sortKey, dir, controller.signal)
      .then(result => {
        setData(result)
        setError(null)
        setLoading(false)
        if (page > result.pages) setPage(result.pages)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })
    return () => controller.abort()
  }, [query, page, pageSize, sortKey, dir, dataVersion, reload])

  const refresh = () => {
    setReload(r => r + 1)
    notifyChanged()
  }

  const togglePage = () => {
    if (!data) return
    const pageIds = data.items.map(i => i.id)
    const all = pageIds.every(id => selected.has(id))
    const next = new Set(selected)
    pageIds.forEach(id => (all ? next.delete(id) : next.add(id)))
    setSelected(next)
    setAllMatching(false)
  }

  const selectAllMatching = async () => {
    try {
      const result = await api.leads(query, 1, 10, sortKey, dir, undefined, true)
      setSelected(new Set(result.ids ?? []))
      setAllMatching(true)
    } catch (err) {
      toast.error('Could not select all', (err as Error).message)
    }
  }

  const exportFiltered = async () => {
    try {
      const rows = await api.exportLeads(filters.batch && countActiveFilters(filters) === 1 && !filters.q ? { batchId: filters.batch } : { filters: query })
      toast.success('Export ready', `${formatNumber(rows)} leads exported.`)
    } catch (err) {
      toast.error('Export failed', (err as Error).message)
    }
  }

  const filtered = countActiveFilters(filters) > 0 || filters.q !== ''

  return (
    <div className="space-y-4">
      <LeadViews views={views} onViewsChange={setViews} activeView={activeView} currentFilters={filters} onApply={(id, viewFilters) => setFilters({ ...EMPTY_FILTERS, ...viewFilters }, id)} />

      <Card className="p-3 sm:p-4">
        <LeadFiltersBar filters={filters} onChange={next => setFilters(next)} facets={data?.facets ?? null} tags={tags} batchLabel={batchLabel} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            {data ? (
              <>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatNumber(data.total)}</span> {data.total === 1 ? 'lead' : 'leads'}
                {filtered && ' match'}
              </>
            ) : (
              'Loading leads…'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-44">
              <Select size="sm" label="Sort" value={sort} onChange={setSort} options={SORTS.map(s => ({ ...s, icon: <ArrowDownUp className="h-3.5 w-3.5 text-slate-400" /> }))} />
            </div>
            <Button size="sm" variant="secondary" icon={<Download className="h-3.5 w-3.5" />} onClick={exportFiltered} disabled={!data?.total}>
              Export
            </Button>
            <Button size="sm" variant="secondary" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => setImportOpen(true)}>
              Import
            </Button>
            <Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setNewOpen(true)}>
              New lead
            </Button>
          </div>
        </div>

        {error && !data ? (
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Could not load leads" description={error} action={<Button onClick={() => setReload(r => r + 1)}>Try again</Button>} />
        ) : loading && !data ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          filtered ? (
            <EmptyState icon={<SearchX className="h-5 w-5" />} title="No leads match these filters" action={<Button onClick={() => setFilters({ ...EMPTY_FILTERS }, 'all')}>Clear filters</Button>} />
          ) : (
            <EmptyState icon={<Users className="h-5 w-5" />} title="No leads yet" description="Run a discovery, import a CSV, or add a lead manually." />
          )
        ) : (
          data && <LeadTable items={data.items} tags={tags} selected={selected} onToggle={id => {
            const next = new Set(selected)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            setSelected(next)
            setAllMatching(false)
          }} onTogglePage={togglePage} onOpen={openLead} now={now} />
        )}

        {data && data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Rows per page</span>
              <div className="w-20">
                <Select
                  size="sm"
                  label="Rows per page"
                  value={String(pageSize)}
                  onChange={v => {
                    setPageSize(Number(v))
                    setPage(1)
                  }}
                  options={['10', '25', '50', '100'].map(v => ({ value: v, label: v }))}
                />
              </div>
            </div>
            <Pagination page={data.page} pages={data.pages} onPage={setPage} label="Leads pages" />
          </div>
        )}
      </Card>

      {selected.size > 0 && (
        <BulkBar
          ids={[...selected]}
          tags={tags}
          totalMatching={data?.total ?? 0}
          allMatchingSelected={allMatching}
          onSelectAllMatching={selectAllMatching}
          onClear={() => {
            setSelected(new Set())
            setAllMatching(false)
          }}
          onDone={refresh}
        />
      )}

      <CsvImportModal open={importOpen} onClose={() => setImportOpen(false)} onImported={refresh} />
      <NewLeadModal
        open={newOpen}
        onClose={() => {
          setNewOpen(false)
          if (route.params.get('new')) navigate('leads')
        }}
        onCreated={id => {
          refresh()
          openLead(id)
        }}
        onOpenExisting={openLead}
      />
    </div>
  )
}
