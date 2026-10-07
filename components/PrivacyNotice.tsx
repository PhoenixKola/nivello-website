'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getRoutePath, type Locale } from '@/lib/site'

/*
 * Informational notice, not a consent banner: the site only uses technical storage and cookieless,
 * first-party aggregate statistics (see the Cookie Policy). If a non-essential tool is ever added,
 * this must become a real opt-in with equal Accept / Reject before that tool runs.
 */
const STORAGE_KEY = 'nv_privacy_notice'

const copy = {
  en: { text: 'We use only necessary technical storage and privacy-friendly, cookieless aggregate statistics.', more: 'Learn more', ok: 'OK', label: 'Privacy notice' },
  it: { text: 'Usiamo solo memorizzazione tecnica necessaria e statistiche aggregate senza cookie, rispettose della privacy.', more: 'Scopri di più', ok: 'OK', label: 'Avviso privacy' }
} satisfies Record<Locale, { text: string; more: string; ok: string; label: string }>

export default function PrivacyNotice({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const t = copy[locale]

  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      // Storage blocked: show the notice; dismissing still hides it for this page view.
    }
    if (seen) return
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (!open) return null

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Remembering the dismissal is a convenience only.
    }
  }

  return (
    <section
      aria-label={t.label}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-[0_18px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur-md sm:left-4 sm:right-auto sm:mx-0 sm:flex-row sm:items-center sm:gap-4 dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-300"
    >
      <p className="leading-relaxed">
        {t.text}{' '}
        <Link href={getRoutePath('cookies', locale)} className="font-semibold text-slate-900 underline underline-offset-2 hover:text-[var(--brand-blue)] dark:text-white dark:hover:text-[var(--brand-gold)]">
          {t.more}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 cursor-pointer self-end rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-blue)] sm:self-auto dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus-visible:outline-[var(--brand-gold)]"
      >
        {t.ok}
      </button>
    </section>
  )
}
