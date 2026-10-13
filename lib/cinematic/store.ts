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

export function useCinematic<T extends string | number | boolean | null>(selector: (state: CinematicState) => T, serverValue: T): T {
  return useSyncExternalStore(cinematic.subscribe, () => selector(state), () => serverValue)
}

export * from './chapters'
