/** Scroll plan: chapter lengths in viewport heights. The last chapter (the finale) carries one extra viewport so the final pose is reachable. */
export const CHAPTER_IDS = ['arrival', 'logo', 'planning', 'design', 'development', 'building', 'projects', 'reviews', 'finale'] as const
export const CHAPTER_LENGTHS = [1.4, 1.5, 2.8, 2.0, 2.0, 2.4, 3.8, 2.6, 3.0] as const

export const CHAPTER = { arrival: 0, logo: 1, planning: 2, design: 3, development: 4, building: 5, projects: 6, reviews: 7, finale: 8 } as const

/** Chapters that carry numbered beats (one caption at a time) and how many. */
export const BEATS: Partial<Record<number, number>> = { 2: 3, 3: 2, 4: 2, 5: 2 }

/** Local progress of each beat's stop, per chapter (the beat rail and the scroll stops agree). */
export const BEAT_STOPS: Record<number, readonly number[]> = { 2: [0.17, 0.5, 0.83], 3: [0.25, 0.75], 4: [0.25, 0.75], 5: [0.22, 0.62] }

/** Where each chapter's rail/contents link lands (local progress): always one of the stops below. */
export const CHAPTER_ANCHORS = [0, 0.55, 0.17, 0.25, 0.25, 0.22, 0.3, 0.12, 0.78] as const

/** The engine's scroll guide registers here so rails and anchors travel the same smooth, clipped route. */
export const rail: { go?: (u: number) => void } = {}

/** Smooth-scroll to a chapter (optionally to a local progress). Used by rails and anchor cues. */
export function scrollToChapter(index: number, local = 0.1) {
  if (rail.go) {
    rail.go(index + local)
    return
  }
  const root = document.querySelector<HTMLElement>('[data-cin-spacers]')
  const spacer = root?.children[index] as HTMLElement | undefined
  if (!root || !spacer) return
  const top = window.scrollY + spacer.getBoundingClientRect().top
  const isLast = index === CHAPTER_IDS.length - 1
  const length = isLast ? Math.max(1, spacer.offsetHeight - window.innerHeight) : spacer.offsetHeight
  window.scrollTo({ top: top + length * local, behavior: 'smooth' })
}

/** In-page anchor handler: on the live scroll-driven page, jump along the timeline; otherwise let the browser follow the hash. */
export function jumpToChapter(event: { preventDefault(): void }, index: number, local?: number) {
  const live = document.querySelector('[data-cin-root]:not([data-mode="static"])')
  if (!live) return
  event.preventDefault()
  scrollToChapter(index, local)
}

/**
 * The scroll rail. Everything from the identity chapter on is a sequence of stops: the camera holds on each, and the
 * scroll guide moves exactly one stop per gesture (settling smoothly). The arrival before FREE_UNTIL scrolls freely.
 */
export const FREE_UNTIL = 0.9
export const FIXED_STOPS = [1.55, 2.17, 2.5, 2.83, 3.25, 3.75, 4.25, 4.75, 5.22, 5.62, 6.3, 6.62] as const
export const FINAL_STOPS = [8.3, 8.78, 9] as const
/**
 * The corridor is one guided walk: a stop at the mouth (paintings already in view on both walls) and a stop at the far
 * end, so a single gesture carries the visitor the whole way. Opening a painting locks the rail until Back.
 */
export const CORRIDOR_STOPS = [7.12, 7.92] as const
export const reviewStops = () => [...CORRIDOR_STOPS]
export const guideStops = () => [...FIXED_STOPS, ...reviewStops(), ...FINAL_STOPS]
