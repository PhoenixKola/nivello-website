'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/analytics'

/** Page views on every route change, plus CTA clicks on any element marked data-track-cta="label". */
export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    track('page_view')
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.('[data-track-cta]')
      const label = target?.getAttribute('data-track-cta')
      if (label) track('cta_click', label)
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  return null
}
