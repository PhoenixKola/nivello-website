'use client'

import { useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx, popoverSurface } from './styles'

type PopoverProps = {
  anchorRef: RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
  children: ReactNode
  align?: 'start' | 'end'
  matchWidth?: boolean
  minWidth?: number
  className?: string
  id?: string
  role?: string
  ariaLabel?: string
}

/**
 * Fixed-position popover rendered in a portal, so it is never clipped by scrolling/overflow containers.
 * Flips above the anchor when there is no room below and stays inside the viewport.
 */
export default function Popover({ anchorRef, open, onClose, children, align = 'start', matchWidth, minWidth = 180, className, id, role, ariaLabel }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = anchorRef.current
      const panel = panelRef.current
      if (!anchor || !panel) return
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      const width = Math.min(viewportW - margin * 2, Math.max(matchWidth ? rect.width : 0, minWidth, panel.scrollWidth))
      panel.style.width = matchWidth ? `${Math.max(rect.width, minWidth)}px` : ''
      panel.style.minWidth = `${Math.min(minWidth, viewportW - margin * 2)}px`
      panel.style.maxWidth = `${viewportW - margin * 2}px`
      const spaceBelow = viewportH - rect.bottom - margin
      const spaceAbove = rect.top - margin
      const natural = panel.scrollHeight
      const below = spaceBelow >= Math.min(natural, 280) || spaceBelow >= spaceAbove
      const maxHeight = Math.max(160, (below ? spaceBelow : spaceAbove) - 6)
      panel.style.maxHeight = `${maxHeight}px`
      const height = Math.min(natural, maxHeight)
      let left = align === 'end' ? rect.right - width : rect.left
      left = Math.min(Math.max(margin, left), viewportW - width - margin)
      panel.style.left = `${left}px`
      panel.style.top = `${below ? rect.bottom + 6 : rect.top - height - 6}px`
      panel.style.visibility = 'visible'
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    const observer = new ResizeObserver(place)
    if (panelRef.current) observer.observe(panelRef.current)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      observer.disconnect()
    }
  }, [open, anchorRef, align, matchWidth, minWidth])

  useEffect(() => {
    if (!open) return
    // Nested popovers (e.g. a Select inside a filter panel) live in separate portals:
    // clicks inside a later (nested) popover don't close its parent, and only the topmost reacts to Escape.
    const isTopmost = () => {
      const panels = document.querySelectorAll('[data-admin-popover]')
      return panels[panels.length - 1] === panelRef.current
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return
      const other = target.closest?.('[data-admin-popover]')
      if (other && panelRef.current && panelRef.current.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_FOLLOWING) return
      onCloseRef.current()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isTopmost()) {
        event.stopPropagation()
        onCloseRef.current()
        anchorRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer, true)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, anchorRef])

  if (!open) return null
  return createPortal(
    <div
      ref={panelRef}
      data-admin-popover=""
      id={id}
      role={role}
      aria-label={ariaLabel}
      style={{ position: 'fixed', top: 0, left: 0, visibility: 'hidden', zIndex: 80 }}
      className={cx(popoverSurface, 'overflow-y-auto overscroll-contain p-1.5 [scrollbar-width:thin]', className)}
    >
      {children}
    </div>,
    document.body
  )
}
