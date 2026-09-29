'use client'

import { useEffect, useState } from 'react'
import { History } from 'lucide-react'
import { api } from '@/lib/admin/api'
import type { Batch } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState, Pagination, Skeleton } from '../ui/Controls'
import DiscoveryCard from './DiscoveryCard'

export default function DiscoveryHistory() {
  const { dataVersion, openBatches, navigate } = useAdmin()
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState<{ items: Batch[]; pages: number; total: number } | null>(null)
  const openKey = openBatches.map(b => `${b.id}:${b.status}`).join('|')

  useEffect(() => {
    let cancelled = false
    api.batches(page, 6).then(result => {
      if (cancelled) return
      setData(result)
      if (page > result.pages) setPage(result.pages)
    })
    return () => {
      cancelled = true
    }
  }, [page, reload, dataVersion, openKey])

  const live = new Map(openBatches.map(b => [b.id, b]))
  if (!data) return <Skeleton className="h-64" />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {data.total} discover{data.total === 1 ? 'y' : 'ies'}. Deleting a discovery keeps its leads unless you choose otherwise.
        </p>
        {data.pages > 1 && <Pagination page={page} pages={data.pages} onPage={setPage} label="Discovery history pages" />}
      </div>
      {data.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History className="h-5 w-5" />}
            title="No discovery history"
            action={
              <Button variant="primary" onClick={() => navigate('find')}>
                Find leads
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {data.items.map(batch => (
            <DiscoveryCard key={batch.id} batch={live.get(batch.id) ?? batch} onChanged={() => setReload(r => r + 1)} />
          ))}
        </div>
      )}
      {data.pages > 1 && (
        <div className="flex justify-end">
          <Pagination page={page} pages={data.pages} onPage={setPage} label="Discovery history pages (bottom)" />
        </div>
      )}
    </div>
  )
}
