import { Group } from 'three'
import type { CharacterFactory } from './astronaut'
import { STATIONS, facing, groundHeight } from './layout'
import { clamp, smoothstep } from './noise'
import { PAD_TOP, createPad, makeTracker, screenPanel } from './pads'
import { callScreen, planScreen, type CopyRef } from './screens'

export type Planning = {
  group: Group
  /** beat: 0..3 as a continuous value (listen, plan, revise). */
  update(beat: number, time: number, awake: number, dt: number): void
  repaintText(): void
  dispose(): void
}

/**
 * Chapter 03, in the open: a stone pad beside the road, one astronaut standing between two screens. The left screen
 * is a client video call, the right one is the plan and design being drawn. Beats: listen, plan, revise.
 */
export function createPlanning(characters: CharacterFactory, ref: CopyRef): Planning {
  const { track, dispose } = makeTracker()
  const S = STATIONS.planning
  const root = new Group()
  root.position.set(S.x, groundHeight(S.x, S.z), S.z)
  // The scene faces the spot on the road where the camera holds, so the camera sees it three-quarters on.
  root.rotation.y = facing(S, { x: S.x - 27, z: S.z + 25 })

  const pad = createPad(S.r - 7, 0x159bff, track)
  root.add(pad.group)

  const call = callScreen(ref)
  const plan = planScreen(ref)
  const callPanel = screenPanel({ width: 10.6, height: 6.6, texture: call.texture, post: 2.1, accent: 0x34d399, track })
  const planPanel = screenPanel({ width: 10.6, height: 6.6, texture: plan.texture, post: 2.1, accent: 0xffbf43, track })
  callPanel.group.position.set(-8.4, PAD_TOP, -3.2)
  callPanel.group.rotation.y = 0.55
  planPanel.group.position.set(8.4, PAD_TOP, -3.2)
  planPanel.group.rotation.y = -0.55
  root.add(callPanel.group, planPanel.group)

  const astronaut = characters({ height: 6.4 })
  astronaut.group.position.set(0, PAD_TOP + 0.06, 1.2)
  // The astronaut works with the screens: it faces the call while listening, then the plan, never the camera by accident.
  const FACE_CALL = -2.55
  const FACE_PLAN = 2.55
  let yaw = FACE_CALL
  astronaut.group.rotation.y = yaw
  root.add(astronaut.group)

  let lastBeat = 0
  let nextGesture = 3

  return {
    group: root,
    update(beat, time, awake, dt) {
      const a = clamp(awake)
      const b = clamp(beat / 3)
      call.update(time)
      plan.update(time, b)
      astronaut.update(dt)
      const wantYaw = beat < 0.95 ? FACE_CALL : beat < 1.7 ? FACE_PLAN : FACE_PLAN + 0.18
      // turn the short way round, which is always through the back (never swinging the face toward the camera)
      const diff = ((((wantYaw - yaw) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      yaw += diff * (1 - Math.exp(-dt * 1.7))
      astronaut.group.rotation.y = yaw
      // The screen that matters in this beat glows; the other stays fully readable.
      const listen = 1 - smoothstep(0.7, 1.3, beat)
      const revise = smoothstep(1.7, 2.3, beat)
      callPanel.material.color.setScalar(0.88 + 0.12 * listen)
      planPanel.material.color.setScalar(0.88 + 0.12 * (1 - listen))
      callPanel.led.emissiveIntensity = 0.5 + 1.1 * listen
      planPanel.led.emissiveIntensity = 0.5 + 1.1 * (1 - listen)
      pad.rim.emissiveIntensity = (0.9 + 0.5 * revise) * (0.5 + 0.5 * a)
      // A friendly nod while listening, a wave when the revised plan lands.
      const whole = Math.floor(beat)
      if (whole !== lastBeat) {
        lastBeat = whole
        if (whole >= 1) astronaut.gesture('Yes')
        nextGesture = time + 4
      }
      if (time > nextGesture && a > 0.6) {
        astronaut.gesture('Yes')
        nextGesture = time + 6 + Math.random() * 3
      }
    },
    repaintText() {
      call.invalidate()
      plan.invalidate()
    },
    dispose() {
      call.dispose()
      plan.dispose()
      astronaut.dispose()
      dispose()
    }
  }
}
