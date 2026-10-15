import {
  BoxGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RingGeometry,
  Texture,
  TorusGeometry
} from 'three'
import { glowTexture } from './textures'

/** Shared building blocks for the open-air stations: a clean stone pad and free-standing display panels. */

export type Tracker = <T extends { dispose(): void }>(item: T) => T

export const makeTracker = () => {
  const disposables: { dispose(): void }[] = []
  const track: Tracker = item => {
    disposables.push(item)
    return item
  }
  return { track, dispose: () => disposables.forEach(item => item.dispose()) }
}

/** Top surface of every pad, in group-local y. */
export const PAD_TOP = 0.9

export function createPad(radius: number, accent: number, track: Tracker) {
  const group = new Group()
  const stone = track(new MeshStandardMaterial({ color: 0xa9b6cc, roughness: 0.55, metalness: 0.25, emissive: 0x16233a, emissiveIntensity: 0.55, envMapIntensity: 0.7 }))
  const edge = track(new MeshStandardMaterial({ color: 0x3a465e, roughness: 0.4, metalness: 0.6, emissive: 0x0d1424, emissiveIntensity: 0.5 }))
  const light = track(new MeshStandardMaterial({ color: 0x0b1424, emissive: new Color(accent), emissiveIntensity: 1.3 }))

  const shadow = new Mesh(
    track(new CircleGeometry(radius * 1.35, 48)),
    track(new MeshBasicMaterial({ map: track(glowTexture()), color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false }))
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.1
  group.add(shadow)

  const base = new Mesh(track(new CylinderGeometry(radius, radius + 0.9, PAD_TOP, 64)), edge)
  base.position.y = PAD_TOP / 2
  const top = new Mesh(track(new CylinderGeometry(radius - 0.7, radius - 0.7, 0.12, 64)), stone)
  top.position.y = PAD_TOP + 0.02
  const rim = new Mesh(track(new TorusGeometry(radius - 0.35, 0.12, 8, 96)), light)
  rim.rotation.x = Math.PI / 2
  rim.position.y = PAD_TOP + 0.1
  const inner = new Mesh(track(new RingGeometry(radius * 0.52, radius * 0.52 + 0.1, 96)), track(new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, toneMapped: false })))
  inner.rotation.x = -Math.PI / 2
  inner.position.y = PAD_TOP + 0.1
  group.add(base, top, rim, inner)
  return { group, rim: light }
}

export type Panel = { group: Group; screen: Mesh; material: MeshBasicMaterial; led: MeshStandardMaterial }

/** A free-standing display: slim graphite bezel, a tapered post and a foot plate. Faces +z; origin on the ground. */
export function screenPanel(opts: { width: number; height: number; texture: Texture; post: number; accent: number; track: Tracker }): Panel {
  const { width, height, texture, post, accent, track } = opts
  const group = new Group()
  const graphite = track(new MeshStandardMaterial({ color: 0x1b2438, roughness: 0.34, metalness: 0.7, envMapIntensity: 0.9, emissive: 0x0a1020, emissiveIntensity: 0.4 }))
  const led = track(new MeshStandardMaterial({ color: 0x0b1424, emissive: new Color(accent), emissiveIntensity: 1.1 }))
  const material = track(new MeshBasicMaterial({ map: texture, toneMapped: false }))
  const cy = post + height / 2
  const frame = new Mesh(track(new BoxGeometry(width + 0.5, height + 0.5, 0.34)), graphite)
  frame.position.set(0, cy, 0)
  const screen = new Mesh(track(new PlaneGeometry(width, height)), material)
  screen.position.set(0, cy, 0.19)
  const strip = new Mesh(track(new BoxGeometry(width * 0.5, 0.07, 0.06)), led)
  strip.position.set(0, cy - height / 2 - 0.18, 0.2)
  const neck = new Mesh(track(new CylinderGeometry(0.2, 0.3, post, 12)), graphite)
  neck.position.set(0, post / 2, -0.2)
  const foot = new Mesh(track(new CylinderGeometry(1.4, 1.6, 0.22, 32)), graphite)
  foot.position.set(0, 0.11, -0.2)
  group.add(frame, screen, strip, neck, foot)
  return { group, screen, material, led }
}
