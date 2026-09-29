'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cx } from './styles'

type ToastTone = 'success' | 'error' | 'info'
type ToastItem = { id: number; tone: ToastTone; title: string; description?: string }
type ToastApi = { success: (title: string, description?: string) => void; error: (title: string, description?: string) => void; info: (title: string, description?: string) => void }

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), [])
  const push = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = nextId.current++
      setToasts(list => [...list.slice(-3), { id, tone, title, description }])
      setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500)
    },
    [dismiss]
  )
  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push('success', title, description),
      error: (title, description) => push('error', title, description),
      info: (title, description) => push('info', title, description)
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:left-auto sm:right-4 sm:items-end sm:p-0">
        {toasts.map(toast => {
          const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? XCircle : Info
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="admin-pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_50px_-12px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-slate-900"
            >
              <Icon aria-hidden="true" className={cx('mt-0.5 h-4 w-4 shrink-0', toast.tone === 'success' ? 'text-emerald-500' : toast.tone === 'error' ? 'text-red-500' : 'text-sky-500')} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{toast.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss" className="cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
