'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CHAPTER_IDS, cinematic, scrollToChapter, useCinematic } from '@/lib/cinematic/store'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    menu: 'Menu',
    openNav: 'Show navigation',
    closeNav: 'Hide navigation',
    home: 'Nivello, homepage',
    chapters: 'Story chapters',
    chapterNames: ['Arrival', 'Process', 'Work', 'Proof', 'Start', 'Contact'],
    skip: 'Skip intro'
  },
  it: {
    menu: 'Menu',
    openNav: 'Mostra la navigazione',
    closeNav: 'Nascondi la navigazione',
    home: 'Nivello, homepage',
    chapters: 'Capitoli',
    chapterNames: ['Arrivo', 'Metodo', 'Lavori', 'Prove', 'Inizia', 'Contatti'],
    skip: 'Salta l’intro'
  }
} satisfies Record<Locale, Record<string, unknown>>

/**
 * Homepage-only chrome: the shared header is tucked away (see homepage-cinematic.css) and this
 * control reveals the real Header on demand. Also hosts the chapter rail and the intro skip.
 */
export default function HomeImmersiveChrome({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const chapter = useCinematic(state => state.chapter, 0)
  const intro = useCinematic(state => state.introActive, false)
  const mode = useCinematic(state => state.mode, 'pending')

  const setNav = useCallback((next: boolean, restoreFocus = false) => {
    const root = document.querySelector<HTMLElement>('[data-cin-root]')
    if (!root) return
    if (next) root.dataset.nav = 'open'
    else delete root.dataset.nav
    setOpen(next)
    window.dispatchEvent(new CustomEvent('nivello:header-menu', { detail: { open: next && window.innerWidth < 768 } }))
    if (next) {
      window.setTimeout(() => document.querySelector<HTMLElement>('[data-site-header] a')?.focus({ preventScroll: true }), 60)
    } else if (restoreFocus) {
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.querySelector('[data-cin-root][data-nav="open"]')) setNav(false, true)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const root = document.querySelector<HTMLElement>('[data-cin-root]')
      if (root) delete root.dataset.nav
    }
  }, [setNav])

  if (mode === 'static') return null

  return (
    <div className="cin-chrome">
      <Link href={locale === 'it' ? '/it/' : '/'} className="cin-chrome__logo" aria-label={t.home} data-hidden={open ? 'true' : 'false'}>
        <Image src="/nivello-icon.png" alt="" width={44} height={44} priority />
      </Link>

      <button
        ref={buttonRef}
        type="button"
        className="cin-chrome__menu"
        aria-expanded={open}
        aria-label={open ? t.closeNav : t.openNav}
        onClick={() => setNav(!open)}
        data-open={open ? 'true' : 'false'}
      >
        <span className="cin-chrome__menu-icon" aria-hidden="true">
          <i />
          <i />
        </span>
        <span className="cin-chrome__menu-label">{t.menu}</span>
      </button>

      <nav className="cin-rail" aria-label={t.chapters}>
        {CHAPTER_IDS.map((id, index) => (
          <button
            key={id}
            type="button"
            className="cin-rail__item"
            aria-current={chapter === index ? 'step' : undefined}
            onClick={() => scrollToChapter(index, index === 0 ? 0 : index === 1 ? 0.06 : index === 5 ? 0.5 : 0.12)}
          >
            <span className="cin-rail__label">{t.chapterNames[index]}</span>
            <span className="cin-rail__num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          </button>
        ))}
      </nav>

      {intro && (
        <button type="button" className="cin-skip" onClick={() => cinematic.set({ introActive: false })}>
          {t.skip}
        </button>
      )}
    </div>
  )
}
