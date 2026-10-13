'use client'

import { useEffect, useRef } from 'react'
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
    const projects = orderedProjects(locale)

    const unsubscribe = cinematic.subscribe(() => {
      if (cinematic.get().mode === 'static') root.dataset.mode = 'static'
    })

    import('./engine')
      .then(({ createEngine }) =>
        createEngine({
          canvas,
          root,
          projects: projects.map(project => ({ shot: project.shot, appShot: project.appShot, color: project.color })),
          reviews: proofQuotes[locale].flatMap(quote => {
            const project = projects.find(item => item.slug === quote.slug)
            return project ? [{ name: quote.name, role: quote.role, quote: quote.quote, color: project.color }] : []
          }),
          lowPower: window.innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4
        })
      )
      .then(engine => {
        if (cancelled) {
          engine.dispose()
          return
        }
        dispose = engine.dispose
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
      dispose?.()
      cinematic.set({ mode: 'pending', chapter: 0, processStage: 0 })
    }
  }, [locale])

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
