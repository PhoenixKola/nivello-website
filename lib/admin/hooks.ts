'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export type AdminSection =
  | 'dashboard'
  | 'find'
  | 'leads'
  | 'followups'
  | 'duplicates'
  | 'history'
  | 'analytics'
  | 'inbox'
  | 'projects'
  | 'proposals'
  | 'health'
  | 'settings'
const SECTIONS: AdminSection[] = ['dashboard', 'find', 'leads', 'followups', 'duplicates', 'history', 'analytics', 'inbox', 'projects', 'proposals', 'health', 'settings']

export type AdminRoute = { section: AdminSection; params: URLSearchParams }

function subscribeHash(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

/** Hash-based routing (#/leads?batch=...) so the static /admin/ page supports deep links and back/forward. */
export function useHashRoute(): [AdminRoute, (section: AdminSection, params?: Record<string, string>) => void] {
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => '')
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const section = (SECTIONS as string[]).includes(path) ? (path as AdminSection) : 'dashboard'
  const navigate = useCallback((next: AdminSection, params?: Record<string, string>) => {
    const search = params ? new URLSearchParams(params).toString() : ''
    window.location.hash = `/${next}${search ? `?${search}` : ''}`
  }, [])
  return [{ section, params: new URLSearchParams(query) }, navigate]
}

/** A clock that ticks while mounted; use for elapsed/relative times instead of Date.now() in render. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const update = () => setNow(Date.now())
    const first = requestAnimationFrame(update)
    const timer = setInterval(update, intervalMs)
    return () => {
      cancelAnimationFrame(first)
      clearInterval(timer)
    }
  }, [intervalMs])
  return now
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener('visibilitychange', callback)
  return () => document.removeEventListener('visibilitychange', callback)
}

export function usePageVisible() {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === 'visible', () => true)
}

export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/**
 * Runs `task` every `intervalMs` while `enabled`, never overlapping, slower while the tab is hidden,
 * and immediately when the tab becomes visible again.
 */
export function usePolling(task: (signal: AbortSignal) => Promise<void>, enabled: boolean, intervalMs = 5000, hiddenIntervalMs = 30000) {
  const visible = usePageVisible()
  const taskRef = useRef(task)
  useEffect(() => {
    taskRef.current = task
  })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const controller = new AbortController()
    const run = async () => {
      try {
        await taskRef.current(controller.signal)
      } catch {
        // Errors are surfaced by the task itself; keep polling.
      }
      if (!cancelled) timer = setTimeout(run, visible ? intervalMs : hiddenIntervalMs)
    }
    timer = setTimeout(run, visible ? 0 : hiddenIntervalMs)
    return () => {
      cancelled = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [enabled, visible, intervalMs, hiddenIntervalMs])
}

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    callback => {
      const list = window.matchMedia(query)
      list.addEventListener('change', callback)
      return () => list.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false
  )
}
