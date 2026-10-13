/** Scroll plan: chapter lengths in viewport heights. The last chapter carries one extra viewport so the final pose is reachable. */
export const CHAPTER_IDS = ['arrival', 'process', 'work', 'trust', 'start'] as const
export const CHAPTER_LENGTHS = [1.5, 4.2, 2.8, 1.9, 1.6] as const

/** Process timeline: local chapter progress -> five stages. */
export const PROCESS_START = 0.05
export const PROCESS_SPAN = 0.9
export const stageCenter = (index: number) => PROCESS_START + (PROCESS_SPAN * (index + 0.5)) / 5

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
