/**
 * The scroll rail. From the identity chapter on, the journey is a list of stops. One gesture moves exactly one stop:
 * the wheel (and touch) cannot carry the visitor past the neighbouring stop, and when the gesture ends the page
 * settles smoothly onto a stop (the next one if the gesture went far enough, otherwise the one it left).
 * While a project or review is open the rail is locked: wheel, touch and keys do nothing until they go Back.
 *
 * It is a pure DOM-scroll controller: the world still reads window.scrollY, so keyboard focus, anchors and the
 * no-WebGL page keep working exactly as before.
 */
export type GuideOptions = {
  stops: number[]
  /** Below this u the arrival scrolls freely (but cannot pass the first stop). */
  freeUntil: number
  uToY(u: number): number
  yToU(y: number): number
  isLocked(): boolean
  enabled(): boolean
}

export type Guide = {
  /** Smoothly travel to a position on the timeline (used by contents, rails and the keyboard). */
  go(u: number): void
  /** Call every frame (cheap): notices lock changes. */
  sync(): void
  dispose(): void
}

// The site sets scroll-behavior: smooth globally; the guide positions the page exactly, frame by frame.
const jump = (y: number) => window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const INTERACTIVE = 'input, textarea, select, button, a[href], [role="tab"], [role="slider"], [contenteditable="true"], summary'

export function createGuide(options: GuideOptions): Guide {
  const { stops, freeUntil } = options
  let tween: { from: number; to: number; start: number; duration: number } | null = null
  let bounds: { lo: number; hi: number; prev: number | null; next: number | null; anchor: number | null } | null = null
  let idleTimer = 0
  let touching = false
  let lastY = window.scrollY
  let direction = 1
  let lastWheelAt = 0
  let needQuiet = false
  let wasLocked = false
  let lockY = 0
  let raf = 0

  const maxY = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

  const neighbours = (u: number) => {
    let prev: number | null = null
    let next: number | null = null
    for (const stop of stops) {
      if (stop < u - 0.004) prev = stop
      else if (stop > u + 0.004) {
        next = stop
        break
      }
    }
    if (prev === null && u > freeUntil + 0.004) prev = freeUntil
    return { prev, next }
  }

  const startGesture = (y: number) => {
    const u = options.yToU(y)
    const anchor = stops.find(stop => Math.abs(stop - u) <= 0.004) ?? (Math.abs(freeUntil - u) <= 0.004 ? freeUntil : null)
    const { prev, next } = neighbours(u)
    bounds = {
      lo: prev === null ? 0 : options.uToY(prev),
      hi: next === null ? maxY() : options.uToY(next),
      prev,
      next,
      anchor
    }
  }

  const stopTween = () => {
    if (tween) {
      tween = null
      cancelAnimationFrame(raf)
    }
  }

  const run = () => {
    if (!tween) return
    const t = Math.min(1, (performance.now() - tween.start) / tween.duration)
    jump(tween.from + (tween.to - tween.from) * easeInOut(t))
    lastY = window.scrollY
    if (t >= 1) {
      tween = null
      bounds = null
      return
    }
    raf = requestAnimationFrame(run)
  }

  const travel = (toY: number, minDuration = 950) => {
    const y = window.scrollY
    const distance = Math.abs(toY - y)
    if (distance < 2) {
      bounds = null
      return
    }
    stopTween()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    tween = { from: y, to: toY, start: performance.now(), duration: reduced ? 1 : Math.min(3000, Math.max(minDuration, 760 + distance * 0.52)) }
    raf = requestAnimationFrame(run)
  }

  const settle = () => {
    idleTimer = 0
    if (options.isLocked() || !options.enabled() || tween || !bounds) return
    const y = window.scrollY
    const u = options.yToU(y)
    const { prev, next, anchor } = bounds
    bounds = null
    if (prev === null && anchor === null && u < freeUntil) return
    let target: number | null
    if (anchor !== null) {
      // Started on a stop: a gesture that goes a little way commits to the neighbour, otherwise it falls back.
      if (u > anchor) target = next !== null && (u - anchor) / Math.max(0.0001, next - anchor) > 0.12 ? next : anchor
      else target = prev !== null && (anchor - u) / Math.max(0.0001, anchor - prev) > 0.12 ? prev : anchor
    } else {
      const lowU = prev ?? freeUntil
      const highU = next ?? 9
      const progress = (u - lowU) / Math.max(0.0001, highU - lowU)
      target = direction >= 0 ? (progress > 0.12 && next !== null ? next : lowU) : progress < 0.88 || next === null ? lowU : next
    }
    if (target === null) return
    if (prev === null && target === freeUntil && u < freeUntil + 0.05) return
    needQuiet = true
    travel(options.uToY(target))
  }

  const schedule = () => {
    window.clearTimeout(idleTimer)
    if (touching) return
    idleTimer = window.setTimeout(settle, 110)
  }

  const clampToBounds = (y: number) => {
    if (!bounds) return y
    return Math.min(bounds.hi, Math.max(bounds.lo, y))
  }

  const onScroll = () => {
    if (tween || !options.enabled()) {
      lastY = window.scrollY
      return
    }
    const y = window.scrollY
    if (options.isLocked()) {
      if (Math.abs(y - lockY) > 1) jump(lockY)
      return
    }
    if (!bounds) startGesture(lastY)
    direction = y >= lastY ? 1 : -1
    const clamped = clampToBounds(y)
    if (Math.abs(clamped - y) > 0.5) {
      jump(clamped)
    }
    lastY = window.scrollY
    schedule()
  }

  const wheelDelta = (event: WheelEvent) => {
    const unit = event.deltaMode === 1 ? 32 : event.deltaMode === 2 ? window.innerHeight : 1
    return event.deltaY * unit
  }

  const onWheel = (event: WheelEvent) => {
    if (!options.enabled()) return
    const target = event.target as Element | null
    if (target?.closest('[data-scroll-ok]')) return
    if (event.ctrlKey) return
    const now = performance.now()
    const gap = now - lastWheelAt
    lastWheelAt = now
    if (options.isLocked()) {
      event.preventDefault()
      return
    }
    // After a step, the tail of the same fling (trackpad inertia) must not start another one: wait for a quiet moment.
    if (needQuiet) {
      if (gap > 160 && !tween) needQuiet = false
      else {
        event.preventDefault()
        return
      }
    }
    if (tween) {
      event.preventDefault()
      return
    }
    // The wheel drives the page itself so a gesture can never run past its neighbouring stop.
    event.preventDefault()
    const dy = wheelDelta(event)
    if (!dy) return
    if (!bounds) startGesture(window.scrollY)
    direction = dy > 0 ? 1 : -1
    jump(clampToBounds(window.scrollY + dy))
    lastY = window.scrollY
    schedule()
  }

  const onTouchStart = () => {
    touching = true
    if (tween) {
      stopTween()
      bounds = null
    }
    lastY = window.scrollY
  }
  const onTouchEnd = () => {
    touching = false
    schedule()
  }
  const onTouchMove = (event: TouchEvent) => {
    if (!options.isLocked()) return
    if ((event.target as Element | null)?.closest('[data-scroll-ok]')) return
    if (event.cancelable) event.preventDefault()
  }

  const step = (delta: 1 | -1) => {
    const base = tween ? options.yToU(tween.to) : options.yToU(window.scrollY)
    const { prev, next } = neighbours(base)
    const target = delta > 0 ? next : prev ?? (base > freeUntil ? freeUntil : null)
    if (target === null) return
    bounds = null
    travel(options.uToY(target))
  }

  const onKey = (event: KeyboardEvent) => {
    if (!options.enabled() || event.defaultPrevented) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const target = event.target as Element | null
    if (target?.closest(INTERACTIVE) || target?.closest('[data-scroll-ok]')) return
    const keys: Record<string, 1 | -1 | undefined> = {
      ArrowDown: 1,
      PageDown: 1,
      ' ': event.shiftKey ? -1 : 1,
      ArrowUp: -1,
      PageUp: -1
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (options.isLocked()) {
        event.preventDefault()
        return
      }
      event.preventDefault()
      travel(options.uToY(event.key === 'Home' ? 0 : 9), 1400)
      return
    }
    const delta = keys[event.key]
    if (!delta) return
    event.preventDefault()
    if (options.isLocked()) return
    step(delta)
  }

  const onResize = () => {
    bounds = null
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)

  return {
    go(u) {
      if (options.isLocked()) return
      bounds = null
      travel(options.uToY(u), 1200)
    },
    sync() {
      const locked = options.isLocked()
      if (locked === wasLocked) return
      wasLocked = locked
      if (locked) {
        lockY = window.scrollY
        stopTween()
        bounds = null
        window.addEventListener('touchmove', onTouchMove, { passive: false })
      } else {
        window.removeEventListener('touchmove', onTouchMove)
        lastY = window.scrollY
        bounds = null
      }
    },
    dispose() {
      stopTween()
      window.clearTimeout(idleTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }
}
