'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { Button, IconButton } from './Button'
import { cx } from './styles'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Focus trap, Escape to close, scroll lock and focus restore shared by Modal and Drawer. */
function useDialogBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const initial = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    initial?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (!panel) return
      // Only the topmost dialog reacts.
      const dialogs = document.querySelectorAll('[data-admin-dialog]')
      if (dialogs[dialogs.length - 1] !== panel) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(el => el.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  return panelRef
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const panelRef = useDialogBehaviour(open, onClose)
  const titleId = useId()
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="admin-fade-in absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] dark:bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        data-admin-dialog
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'admin-pop-in relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl outline-none sm:rounded-2xl dark:border-white/10 dark:bg-slate-900',
          { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }[size]
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger,
  children,
  confirmDisabled
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  danger?: boolean
  children?: ReactNode
  confirmDisabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {danger && <AlertTriangle aria-hidden="true" className="h-4 w-4 text-red-500" />}
          {title}
        </span>
      }
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={busy} disabled={confirmDisabled} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  )
}

export function Drawer({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const panelRef = useDialogBehaviour(open, onClose)
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <div className="admin-fade-in absolute inset-0 bg-slate-950/35 dark:bg-black/55" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        data-admin-dialog
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="admin-slide-in absolute inset-y-0 right-0 flex w-full max-w-[min(100vw,54rem)] flex-col border-l border-slate-200 bg-stone-50 shadow-2xl outline-none dark:border-white/10 dark:bg-slate-950"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
