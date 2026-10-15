import {
  BoxGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TubeGeometry,
  Vector3
} from 'three'
import type { CharacterFactory } from './astronaut'
import { STATIONS, facing, groundHeight } from './layout'
import { clamp, smoothstep } from './noise'
import { PAD_TOP, createPad, makeTracker, screenPanel } from './pads'
import { devScreen, rolePlaque, type CopyRef, type DevScreenKind } from './screens'

export type Team = {
  group: Group
  /** progress 0..1 through the chapter */
  update(progress: number, time: number, awake: number, dt: number): void
  glow: { x: number; y: number; z: number; r: number; amount: () => number }
  /** Repaint every word on the monitors and role plaques (after the locale changed). */
  repaintText(): void
  /** Far from the camera (the summit look-back): stop painting screens and animating people. */
  setFar(far: boolean): void
  dispose(): void
}

/**
 * Chapter 05, in the open: three astronauts stand at desks, each facing their own monitor. Slim plaques on their backs name the roles. Black cables drop from the desks to a junction box and a
 * bundled trunk (a thin data line with travelling pulses) runs across the road to the building site.
 */
export function createTeam(characters: CharacterFactory, ref: CopyRef): Team {
  const { track, dispose } = makeTracker()
  const S = STATIONS.dev
  const B = STATIONS.building
  const base = groundHeight(S.x, S.z)
  const wrapper = new Group()
  const root = new Group()
  root.position.set(S.x, base, S.z)
  root.rotation.y = facing(S, { x: S.x - 26, z: S.z + 27 })
  wrapper.add(root)

  const pad = createPad(S.r - 4, 0xffbf43, track)
  root.add(pad.group)

  const graphite = track(new MeshStandardMaterial({ color: 0x1b2438, roughness: 0.34, metalness: 0.6, envMapIntensity: 0.9, emissive: 0x0a1020, emissiveIntensity: 0.45 }))
  const desktop = track(new MeshStandardMaterial({ color: 0xb9c4d8, roughness: 0.4, metalness: 0.25, emissive: 0x4a5a78, emissiveIntensity: 0.4 }))
  const rubber = track(new MeshStandardMaterial({ color: 0x0f131c, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.5, emissive: 0x05070c, emissiveIntensity: 0.3 }))
  const goldLight = track(new MeshStandardMaterial({ color: 0x1b1408, emissive: 0xffbf43, emissiveIntensity: 1.4 }))

  // Monitors: one big screen for each person, with clear room between them so every one is fully readable.
  const layout: { kind: DevScreenKind; x: number; z: number; yaw: number; w: number; h: number; post: number; accent: number }[] = [
    { kind: 'preview', x: -11.5, z: -9.2, yaw: 0.2, w: 9, h: 5.6, post: 2.6, accent: 0xe04b4b },
    { kind: 'editor', x: 0, z: -10, yaw: 0, w: 9.6, h: 6, post: 2.6, accent: 0x7cc4ff },
    { kind: 'flow', x: 11.5, z: -9.2, yaw: -0.2, w: 9, h: 5.6, post: 2.6, accent: 0xa78bfa }
  ]
  const screens = layout.map(item => {
    const screen = devScreen(item.kind, ref)
    const panel = screenPanel({ width: item.w, height: item.h, texture: screen.texture, post: item.post, accent: item.accent, track })
    panel.group.position.set(item.x, PAD_TOP, item.z)
    panel.group.rotation.y = item.yaw
    root.add(panel.group)
    return { screen, panel, item }
  })

  // Desks and the three people. Each person faces their own monitor.
  const roles = [
    { key: 'design' as const, x: -11.5, accent: '#f472b6' },
    { key: 'frontend' as const, x: 0, accent: '#7cc4ff' },
    { key: 'backend' as const, x: 11.5, accent: '#a78bfa' }
  ]
  const plaques: ReturnType<typeof rolePlaque>[] = []
  const people = roles.map((role, i) => {
    const person = characters({ height: 6.2, phase: i * 0.9 })
    person.group.position.set(role.x, PAD_TOP + 0.06, 2.6)
    person.group.rotation.y = Math.PI + (i - 1) * -0.1
    root.add(person.group)

    // slim plaque on the back (the person faces the screens, so the plaque faces the camera)
    const plaque = rolePlaque(role.accent)
    track(plaque)
    plaque.repaint(ref.copy.roles[role.key])
    plaques.push(plaque)
    const tag = new Mesh(track(new PlaneGeometry(2.7, 0.675)), track(new MeshBasicMaterial({ map: plaque.texture, transparent: true, toneMapped: false, side: DoubleSide })))
    tag.position.copy(person.back.position)
    tag.position.y += 0.35
    tag.rotation.y = Math.PI
    tag.position.z -= 0.2
    person.group.add(tag)

    // standing desk: a pale top over a slim graphite body, a light strip, keyboard and a monitor arm
    const top = new Mesh(track(new BoxGeometry(5.4, 0.16, 2.3)), desktop)
    top.position.set(role.x, PAD_TOP + 3.05, 0.4)
    const body = new Mesh(track(new BoxGeometry(5.0, 0.7, 1.9)), graphite)
    body.position.set(role.x, PAD_TOP + 2.6, 0.4)
    const strip = new Mesh(track(new BoxGeometry(4.2, 0.05, 0.05)), goldLight)
    strip.position.set(role.x, PAD_TOP + 2.28, 1.36)
    const leg = track(new BoxGeometry(0.2, 2.6, 0.2))
    ;[-2.3, 2.3].forEach(dx => {
      const l = new Mesh(leg, graphite)
      l.position.set(role.x + dx, PAD_TOP + 1.3, 0.4)
      root.add(l)
    })
    const keys = new Mesh(track(new BoxGeometry(2.3, 0.07, 0.75)), graphite)
    keys.position.set(role.x, PAD_TOP + 3.17, 0.85)
    const keyLight = new Mesh(track(new BoxGeometry(2.1, 0.02, 0.06)), goldLight)
    keyLight.position.set(role.x, PAD_TOP + 3.22, 0.6)
    root.add(top, body, strip, keys, keyLight)
    return person
  })

  // Cables: desks and screens drop to the floor and meet at a junction box behind the team.
  const junction = new Vector3(0, PAD_TOP, -4.6)
  const box = new Mesh(track(new BoxGeometry(3.4, 0.7, 2)), graphite)
  box.position.set(junction.x, PAD_TOP + 0.35, junction.z)
  const boxLed = new Mesh(track(new BoxGeometry(2.4, 0.06, 0.1)), goldLight)
  boxLed.position.set(junction.x, PAD_TOP + 0.72, junction.z + 0.95)
  root.add(box, boxLed)
  const tube = (points: Vector3[], radius: number, material = rubber, segments = 40) => {
    const geometry = track(new TubeGeometry(new CatmullRomCurve3(points, false, 'catmullrom', 0.4), segments, radius, 8, false))
    const mesh = new Mesh(geometry, material)
    root.add(mesh)
    return mesh
  }
  roles.forEach(role => {
    tube([new Vector3(role.x, PAD_TOP + 2.4, -0.3), new Vector3(role.x + 0.2, PAD_TOP + 1.3, -0.7), new Vector3(role.x * 0.8, PAD_TOP + 0.2, -1.4), new Vector3(role.x * 0.4, PAD_TOP + 0.14, -3), new Vector3(junction.x + role.x * 0.08, PAD_TOP + 0.4, junction.z + 0.7)], 0.1)
  })
  screens.forEach(({ item }) => {
    tube([new Vector3(item.x, PAD_TOP + 1.2, item.z - 0.4), new Vector3(item.x, PAD_TOP + 0.15, item.z - 1.2), new Vector3(item.x * 0.6, PAD_TOP + 0.12, (item.z + junction.z) / 2 - 1), new Vector3(item.x * 0.15, PAD_TOP + 0.15, junction.z - 0.4)], 0.09)
  })

  // The trunk to the building: world-space tubes laid on the ground, a bundle of three black cables + a thin data line.
  const trunkGroup = new Group()
  wrapper.add(trunkGroup)
  const y = (x: number, z: number) => groundHeight(x, z) + 0.32
  const jw = new Vector3(junction.x, 0, junction.z).applyAxisAngle(new Vector3(0, 1, 0), root.rotation.y).add(new Vector3(S.x, 0, S.z))
  const trunkPoints = (offset: number, lift: number) => {
    const pts: [number, number][] = [
      [jw.x, jw.z],
      [S.x - 16, S.z + 4],
      [S.x - 30, S.z + 6],
      [-8 + offset, S.z + 4],
      [-2 + offset, S.z - 14],
      [offset, S.z - 40],
      [offset, (S.z + B.z) / 2],
      [B.x + 36 + offset * 0.5, B.z + 36],
      [B.x + 20, B.z + 14]
    ]
    return pts.map(([x, z]) => new Vector3(x, y(x, z) + lift, z))
  }
  const dataMaterial = track(new MeshBasicMaterial({ color: 0xffbf43, toneMapped: false }))
  const trunkMeshes: { geometry: TubeGeometry; count: number }[] = []
  ;[-0.55, 0, 0.55].forEach((offset, i) => {
    const curve = new CatmullRomCurve3(trunkPoints(offset, i === 1 ? 0.18 : 0), false, 'catmullrom', 0.35)
    const geometry = track(new TubeGeometry(curve, 260, 0.26, 8, false))
    trunkGroup.add(new Mesh(geometry, rubber))
    trunkMeshes.push({ geometry, count: geometry.index ? geometry.index.count : 0 })
  })
  const dataCurve = new CatmullRomCurve3(trunkPoints(0, 0.55), false, 'catmullrom', 0.35)
  const dataGeometry = track(new TubeGeometry(dataCurve, 260, 0.1, 6, false))
  trunkGroup.add(new Mesh(dataGeometry, dataMaterial))
  const dataCount = dataGeometry.index ? dataGeometry.index.count : 0
  const packetGeometry = track(new SphereGeometry(0.36, 10, 8))
  const packetMaterial = track(new MeshBasicMaterial({ color: 0xfff1c9, toneMapped: false }))
  const packets = Array.from({ length: 7 }, (_, i) => {
    const mesh = new Mesh(packetGeometry, packetMaterial)
    trunkGroup.add(mesh)
    return { mesh, offset: i / 7 }
  })

  let power = 0
  let nextGesture = 5
  let far = false
  return {
    group: wrapper,
    glow: { x: S.x, y: base + 7, z: S.z, r: 26, amount: () => power },
    setFar(value) {
      far = value
      people.forEach(person => {
        person.group.visible = !value
      })
    },
    repaintText() {
      roles.forEach((role, i) => plaques[i].repaint(ref.copy.roles[role.key]))
      screens.forEach(({ screen }) => screen.invalidate())
    },
    update(progress, time, awake, dt) {
      const p = clamp(progress)
      const a = clamp(awake)
      power = a
      const bright = 0.78 + 0.22 * smoothstep(0.02, 0.4, p)
      screens.forEach(({ screen, panel }) => {
        if (!far) screen.update(time, p)
        panel.material.color.setScalar(bright)
      })
      if (!far) {
        people.forEach(person => person.update(dt))
        if (time > nextGesture && a > 0.6) {
          people[Math.floor(Math.random() * people.length)].gesture('Yes')
          nextGesture = time + 5 + Math.random() * 4
        }
      }
      const fill = smoothstep(0.3, 0.95, p)
      trunkMeshes.forEach(({ geometry, count }) => geometry.setDrawRange(0, Math.max(0, Math.floor((count * fill) / 6) * 6)))
      dataGeometry.setDrawRange(0, Math.max(0, Math.floor((dataCount * fill) / 6) * 6))
      packets.forEach(item => {
        const t = (((time * 0.1 + item.offset) % 1) + 1) % 1
        item.mesh.visible = !far && fill > 0.05 && t < fill
        if (item.mesh.visible) item.mesh.position.copy(dataCurve.getPointAt(t))
      })
      goldLight.emissiveIntensity = 0.8 + 0.8 * a
      pad.rim.emissiveIntensity = 0.7 + 0.6 * a
    },
    dispose() {
      screens.forEach(({ screen }) => screen.dispose())
      people.forEach(person => person.dispose())
      dispose()
    }
  }
}
