'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError } from '@/lib/admin/api'
import { usePolling, type AdminRoute, type AdminSection } from '@/lib/admin/hooks'
import type { AdminUser, Batch, Health, Tag, TagColor, UserBrief } from '@/lib/admin/types'
import { useToast } from './ui/Toast'

type AdminContextValue = {
  /** The signed-in admin. */
  me: AdminUser
  setMe: (user: AdminUser) => void
  /** Every admin account (for assignees and attribution); disabled users stay listed for history. */
  people: UserBrief[]
  refreshPeople: () => Promise<void>
  route: AdminRoute
  navigate: (section: AdminSection, params?: Record<string, string>) => void
  tags: Tag[]
  refreshTags: () => Promise<void>
  createTag: (name: string, color: TagColor) => Promise<Tag | null>
  health: Health | null
  refreshHealth: (refresh?: boolean) => Promise<void>
  openBatches: Batch[]
  trackBatch: (batch: Batch) => void
  /** Increments whenever lead data may have changed; lists refetch when it moves. */
  dataVersion: number
  notifyChanged: () => void
  openLead: (id: string) => void
  closeLead: () => void
  leadId: string | null
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ route, navigate, onLogout, me, onMeChange, children }: { route: AdminRoute; navigate: AdminContextValue['navigate']; onLogout: () => void; me: AdminUser; onMeChange: (user: AdminUser) => void; children: ReactNode }) {
  const toast = useToast()
  const [people, setPeople] = useState<UserBrief[]>([])
  const refreshPeople = useCallback(async () => {
    try {
      setPeople((await api.people()).users)
    } catch {
      // Assignee pickers fall back to the signed-in user.
    }
  }, [])
  const [tags, setTags] = useState<Tag[]>([])
  const [health, setHealth] = useState<Health | null>(null)
  const [openBatches, setOpenBatches] = useState<Batch[]>([])
  const [dataVersion, setDataVersion] = useState(0)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [pollWanted, setPollWanted] = useState(true)
  const importedRef = useRef<Record<string, number>>({})

  const notifyChanged = useCallback(() => setDataVersion(v => v + 1), [])

  const refreshTags = useCallback(async () => {
    try {
      setTags((await api.tags()).tags)
    } catch (error) {
      if (error instanceof ApiError) toast.error('Could not load tags', error.message)
    }
  }, [toast])

  const refreshHealth = useCallback(async (refresh = false) => {
    try {
      const next = await api.health(refresh)
      setHealth(next)
      if (next.counts.openBatches > 0) setPollWanted(true)
    } catch {
      setHealth(null)
    }
  }, [])

  const createTag = useCallback(
    async (name: string, color: TagColor) => {
      try {
        const result = await api.createTag(name, color)
        setTags(result.tags)
        return result.tag
      } catch (error) {
        toast.error('Could not create tag', (error as Error).message)
        return null
      }
    },
    [toast]
  )

  useEffect(() => {
    const first = requestAnimationFrame(() => {
      refreshTags()
      refreshHealth()
      refreshPeople()
    })
    const timer = setInterval(() => refreshHealth(), 60000)
    return () => {
      cancelAnimationFrame(first)
      clearInterval(timer)
    }
  }, [refreshTags, refreshHealth, refreshPeople])

  // Polls the discovery tick while batches are open. The tick also advances work on the server.
  usePolling(
    async signal => {
      const result = await api.discoveryStatus(signal)
      setOpenBatches(result.open)
      let changed = false
      for (const batch of result.open) {
        if (importedRef.current[batch.id] !== batch.counters.imported) changed = true
        importedRef.current[batch.id] = batch.counters.imported
      }
      const stillOpen = new Set(result.open.map(b => b.id))
      for (const id of Object.keys(importedRef.current)) {
        if (!stillOpen.has(id)) {
          delete importedRef.current[id]
          changed = true
        }
      }
      if (changed) notifyChanged()
      if (!result.open.length) setPollWanted(false)
    },
    pollWanted
  )

  const trackBatch = useCallback((batch: Batch) => {
    setOpenBatches(list => [...list.filter(b => b.id !== batch.id), ...(batch.isOpen ? [batch] : [])])
    setPollWanted(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } finally {
      onLogout()
    }
  }, [onLogout])

  const value = useMemo<AdminContextValue>(
    () => ({
      me,
      setMe: onMeChange,
      people: people.length ? people : [{ id: me.id, displayName: me.displayName, title: me.title, status: me.status }],
      refreshPeople,
      route,
      navigate,
      tags,
      refreshTags,
      createTag,
      health,
      refreshHealth,
      openBatches,
      trackBatch,
      dataVersion,
      notifyChanged,
      openLead: setLeadId,
      closeLead: () => setLeadId(null),
      leadId,
      logout
    }),
    [me, onMeChange, people, refreshPeople, route, navigate, tags, refreshTags, createTag, health, refreshHealth, openBatches, trackBatch, dataVersion, notifyChanged, leadId, logout]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider')
  return ctx
}
