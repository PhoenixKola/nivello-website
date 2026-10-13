/** Scroll plan: chapter lengths in viewport heights. The last chapter (the finale) carries one extra viewport so the final pose is reachable. */
export const CHAPTER_IDS = ['arrival', 'logo', 'design', 'development', 'projects', 'reviews', 'finale'] as const
export const CHAPTER_LENGTHS = [1.5, 1.4, 3.0, 2.4, 3.0, 2.6, 3.0] as const

export const CHAPTER = { arrival: 0, logo: 1, design: 2, development: 3, projects: 4, reviews: 5, finale: 6 } as const

/** Reviews: scroll position within the chapter that centres review k (6 reviews). */
export const REVIEW_FROM = 0.12
export const REVIEW_SPAN = 0.76
export const reviewCenter = (k: number, count = 6) => REVIEW_FROM + (REVIEW_SPAN * (k + 0.5)) / count

/** Smooth-scroll to a chapter (optionally to a local progress). Used by rails and anchor cues. */
export function scrollToChapter(index: number, local = 0.1) {
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
