'use client'

import { useEffect, useRef } from 'react'
import type { Engine } from './engine'
import Image from 'next/image'
import { cinematic } from '@/lib/cinematic/store'
import { proofQuotes } from '@/components/ProofSection'
import { getProjects } from '@/lib/projects'
import type { Locale } from '@/lib/site'

function orderedProjects(locale: Locale) {
  const all = getProjects(locale)
  const proGreen = all.find(item => item.slug === 'progreen')
  return proGreen ? [proGreen, ...all.filter(item => item.slug !== 'progreen')] : all
}

/** Review paintings use each locale's own testimonial text; nothing is machine-translated here. */
function reviewsFor(locale: Locale) {
  const projects = orderedProjects(locale)
  return proofQuotes[locale].flatMap(quote => {
    const project = projects.find(item => item.slug === quote.slug)
    return project ? [{ slug: quote.slug, name: quote.name, role: quote.role, quote: quote.quote, color: project.color, title: project.title }] : []
  })
}

function webglAvailable() {
  try {
    const probe = document.createElement('canvas')
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Persistent WebGL stage. The engine (Three.js world, camera track, post) loads on demand;
 * reduced-motion, data-saver and missing WebGL fall back to a designed static composition.
 */
export default function CinematicWorld({ locale }: { locale: Locale }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const localeRef = useRef(locale)
  localeRef.current = locale

  // The world is built once. A locale change (route switch) repaints the words in place instead of rebuilding it.
  useEffect(() => {
    engineRef.current?.setLocale(locale, { reviews: reviewsFor(locale) })
  }, [locale])

  useEffect(() => {
    const canvas = canvasRef.current
    const root = canvas?.closest<HTMLElement>('[data-cin-root]')
    if (!canvas || !root) return

    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || connection?.saveData || !webglAvailable()) {
      root.dataset.mode = 'static'
      cinematic.set({ mode: 'static', introActive: false })
      return
    }

    let cancelled = false
    let dispose: (() => void) | undefined
    const first = localeRef.current
    const projects = orderedProjects(first)

    const unsubscribe = cinematic.subscribe(() => {
      if (cinematic.get().mode === 'static') root.dataset.mode = 'static'
    })

    import('./engine')
      .then(({ createEngine }) =>
        createEngine({
          canvas,
          root,
          locale: first,
          projects: projects.map(project => ({ shot: project.shot, appShot: project.appShot, color: project.color, title: project.title })),
          reviews: reviewsFor(first),
          lowPower:
            window.innerWidth < 900 ||
            window.matchMedia('(pointer: coarse)').matches ||
            (navigator.hardwareConcurrency ?? 8) <= 4 ||
            ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4
        })
      )
      .then(engine => {
        if (cancelled) {
          engine.dispose()
          return
        }
        engineRef.current = engine
        dispose = engine.dispose
        // the route may have changed language while the engine was loading
        if (localeRef.current !== first) engine.setLocale(localeRef.current, { reviews: reviewsFor(localeRef.current) })
        root.dataset.mode = 'live'
        cinematic.set({ mode: 'live' })
      })
      .catch(error => {
        console.warn('[Nivello cinematic] Falling back to the static composition.', error)
        if (!cancelled) {
          root.dataset.mode = 'static'
          cinematic.set({ mode: 'static', introActive: false })
        }
      })

    return () => {
      cancelled = true
      unsubscribe()
      engineRef.current = null
      dispose?.()
      cinematic.set({ mode: 'pending', chapter: 0, processStage: 0 })
    }
  }, [])

  return (
    <div className="cin-world" aria-hidden="true">
      <canvas ref={canvasRef} className="cin-canvas" />
      <div className="cin-fallback">
        <span className="cin-fallback__ridge cin-fallback__ridge--far" />
        <span className="cin-fallback__ridge cin-fallback__ridge--mid" />
        <span className="cin-fallback__ridge cin-fallback__ridge--near" />
        <span className="cin-fallback__route" />
        <span className="cin-fallback__sun" />
        <span className="cin-fallback__mark">
          <Image src="/nivello-icon.png" alt="" width={320} height={320} loading="eager" />
        </span>
      </div>
      <div className="cin-intro-mark">
        <span className="cin-intro-mark__glow" />
        <Image src="/nivello-icon.png" alt="" width={168} height={168} priority />
        <span className="cin-intro-mark__line" />
      </div>
      <div className="cin-grade" />
      <div className="cin-vignette" />
      <div className="cin-grain" />
      <div className="cin-wipe">
        <span />
        <span />
        <span />
      </div>
      <div className="cin-fade" />
    </div>
  )
}
