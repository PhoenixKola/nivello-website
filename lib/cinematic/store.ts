'use client'

import { useSyncExternalStore } from 'react'

/**
 * Tiny shared state between the WebGL world and the HTML overlays.
 * The world writes derived values (chapter, process stage); overlays write the
 * visitor's selections (project, client, brief) which the world reacts to.
 */
export type CinematicState = {
  mode: 'pending' | 'live' | 'static'
  chapter: number
  processStage: number
  workIndex: number
  workApp: boolean
  proofIndex: number
  /** Review under close inspection in the tunnel, or -1 while travelling. */
  reviewFocus: number
  /** True while a single project is open inside the cylinder (scrolling is locked until Back). */
  workDetail: boolean
  /** The camera is inside the cylinder (hotspots and look-around are live). */
  inChamber: boolean
  /** Closing footer folded away so the summit view is unobstructed. */
  footerHidden: boolean
  briefBuild: string | null
  briefStage: string | null
  introActive: boolean
}

const state: CinematicState = {
  mode: 'pending',
  chapter: 0,
  processStage: 0,
  workIndex: 0,
  workApp: false,
  proofIndex: 0,
  reviewFocus: -1,
  workDetail: false,
  inChamber: false,
  footerHidden: true,
  briefBuild: null,
  briefStage: null,
  introActive: false
}

const listeners = new Set<() => void>()

export const cinematic = {
  get: () => state,
  set(patch: Partial<CinematicState>) {
    let changed = false
    for (const key of Object.keys(patch) as (keyof CinematicState)[]) {
      if (state[key] !== patch[key]) {
        ;(state as Record<string, unknown>)[key] = patch[key]
        changed = true
      }
    }
    if (changed) listeners.forEach(listener => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}

/** The visitor is inside a project or a review: the rail holds still until they go Back. */
export const isLocked = () => state.workDetail || state.reviewFocus >= 0

export function useCinematic<T extends string | number | boolean | null>(selector: (state: CinematicState) => T, serverValue: T): T {
  return useSyncExternalStore(cinematic.subscribe, () => selector(state), () => serverValue)
}

export * from './chapters'
