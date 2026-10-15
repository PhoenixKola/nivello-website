import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Path,
  PlaneGeometry,
  RepeatWrapping,
  RingGeometry,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3
} from 'three'
import type { SceneCopy } from './i18n'
import { CYLINDER, PLAZA } from './layout'
import { clamp, lerp } from './noise'
import { createSign } from './signs'
import { glowTexture, shaftTexture } from './textures'

export type GalleryProject = { shot: string; appShot?: string; color: string; title: string }

const SCREEN_ASPECT = 16 / 9
const R = CYLINDER.radius
const H = CYLINDER.height
const WALL = 1.2
const ENTRY_HALF = 5.8
const EXIT_HALF = 9
const HOLO_Y = 12.2
const EYE = 7.2
const DEG = Math.PI / 180

/**
 * Where the holograms hang. Angles are measured from the exit axis (-z) toward +x, like a compass pointing at the
 * corridor. Two arcs lie between the entry and the exit; more projects simply pack the arcs tighter.
 */
export function hologramLayout(count: number) {
  const min = 38 * DEG
  const max = 142 * DEG
  const right = Math.ceil(count / 2)
  const left = count - right
  const spread = (n: number, sign: 1 | -1) =>
    Array.from({ length: n }, (_, k) => sign * (n === 1 ? (min + max) / 2 : min + (k * (max - min)) / (n - 1)))
  const angles = [...spread(right, 1), ...spread(left, -1).reverse()]
  const per = Math.max(right, left)
  const spacing = per > 1 ? (max - min) / (per - 1) : max - min
  const width = Math.min(14.5, 2 * (R - 0.9) * Math.sin(spacing / 2) * 0.86)
  return { angles, width, height: width / SCREEN_ASPECT }
}

const fitCover = (texture: Texture, aspect: number) => {
  const image = texture.image as { width: number; height: number } | undefined
  if (!image?.width) return
  const imgAspect = image.width / image.height
  if (imgAspect < aspect) {
    texture.repeat.set(1, imgAspect / aspect)
    texture.offset.set(0, 1 - imgAspect / aspect)
  } else {
    texture.repeat.set(aspect / imgAspect, 1)
    texture.offset.set((1 - aspect / imgAspect) / 2, 0)
  }
}

/** Dark slate wall: vertical seams, a faint cove of light near the ceiling and a darker plinth. */
function wallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#34405c')
  g.addColorStop(0.5, '#222b43')
  g.addColorStop(1, '#151b2d')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'
  ctx.lineWidth = 2
  for (let x = 0; x <= 512; x += 128) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 512)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(217,178,94,0.22)'
  ;[40, 470].forEach(y => {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  })
  ctx.fillStyle = 'rgba(255,255,255,0.045)'
  for (let x = 0; x < 512; x += 128) ctx.fillRect(x + 8, 60, 112, 380)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  texture.anisotropy = 4
  return texture
}

function scanTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, 4, 64)
  ctx.fillStyle = '#fff'
  for (let y = 0; y < 64; y += 4) ctx.fillRect(0, y, 4, 1)
  const texture = new CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}

export type GalleryOpen = { turn: number; hatch: number; exit: number }

export type Gallery = {
  group: Group
  count: number
  hologramCenter(index: number, out: Vector3): void
  /** Where the hotspot for a project sits: on the lower part of its own hologram. */
  hotspotAnchor(index: number, out: Vector3): void
  /** Compass angle of a project (from -z toward +x). */
  angle(index: number): number
  /** Camera pose for studying the project that hangs at a compass angle, close up. */
  detailPose(psi: number, out: { px: number; py: number; pz: number; lx: number; ly: number; lz: number }, phone?: boolean): void
  hologramWidth: number
  update(time: number, state: { focus: number; appMix: number; open: GalleryOpen; awake: number }): void
  /** Repaint the signs (after the locale changed). */
  setCopy(copy: SceneCopy): void
  /** Far from the camera (the summit look-back): hide the interior, which cannot be seen from outside. */
  setFar(far: boolean): void
  dispose(): void
}

/**
 * The project chamber: a dark bronze cylinder standing on the road. It starts sealed; a ship-style hatch with a lock
 * wheel turns, its bolts draw back and the door swings open. Inside, a dark slate room is lit by warm cove light and
 * the projects float on the wall as luminous holograms, each with its hotspot on the panel. An arched portal on the
 * far side opens straight onto the review corridor, which begins at the cylinder wall.
 */
export function createGallery(projects: GalleryProject[], maxAnisotropy: number, copy: SceneCopy, low = false): Gallery {
  const group = new Group()
  const interior = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }
  const count = projects.length
  const layout = hologramLayout(count)
  const cx = PLAZA.x
  const cz = PLAZA.z
  const FLOOR = 0.2
  group.add(interior)

  const loader = new TextureLoader()
  const loadMap = (url: string) => {
    const texture = loader.load(url, t => fitCover(t, SCREEN_ASPECT))
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = Math.min(8, maxAnisotropy)
    return track(texture)
  }

  const wallMap = track(wallTexture())
  wallMap.repeat.set(10, 1.6)
  const glow = track(glowTexture())
  const shaft = track(shaftTexture())

  // Materials carry their own glow, so phones (no environment map, no point lights) look the same as desktops.
  const bronze = track(new MeshStandardMaterial({ color: 0x4a5368, metalness: 0.42, roughness: 0.38, emissive: 0x242c40, emissiveIntensity: 0.8, envMapIntensity: 1 }))
  const bronzeDark = track(new MeshStandardMaterial({ color: 0x2c3447, metalness: 0.5, roughness: 0.4, emissive: 0x151b2b, emissiveIntensity: 0.8, envMapIntensity: 1 }))
  const brass = track(new MeshStandardMaterial({ color: 0xdcb665, metalness: 0.6, roughness: 0.3, emissive: 0x5a3f12, emissiveIntensity: 0.8, envMapIntensity: 1 }))
  const outerWall = track(new MeshStandardMaterial({ map: wallMap, emissiveMap: wallMap, color: 0x8693ad, metalness: 0.3, roughness: 0.5, emissive: 0x8a97b3, emissiveIntensity: 0.38 }))
  const innerWall = track(new MeshStandardMaterial({ map: wallMap, emissiveMap: wallMap, color: 0xaebbd6, emissive: 0xffffff, emissiveIntensity: 0.62, roughness: 0.7, side: DoubleSide }))
  const floorMaterial = track(new MeshStandardMaterial({ color: 0x1b2336, metalness: 0.55, roughness: 0.28, emissive: 0x2a3956, emissiveIntensity: 0.7, envMapIntensity: 0.8 }))
  const lightLine = (color: number, opacity = 0.9) => track(new MeshBasicMaterial({ color, transparent: true, opacity, toneMapped: false }))
  const warmLine = track(new MeshBasicMaterial({ color: 0xffe0a8, toneMapped: false }))

  // ── Floor, inlaid rings and the central mark.
  const floor = new Mesh(track(new CircleGeometry(R, 96)), floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(cx, FLOOR, cz)
  interior.add(floor)
  ;[6.5, 13, 20, 27].forEach((radius, i) => {
    const ring = new Mesh(track(new RingGeometry(radius - 0.08, radius + 0.08, 128)), lightLine(i % 2 ? 0x6fcbff : 0xdcb665, 0.75))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(cx, FLOOR + 0.02, cz)
    interior.add(ring)
  })
  const dais = new Mesh(track(new CylinderGeometry(4.2, 4.5, 0.3, 64)), bronze)
  dais.position.set(cx, FLOOR + 0.15, cz)
  const daisRim = new Mesh(track(new TorusGeometry(4.25, 0.07, 6, 96)), lightLine(0xdcb665))
  daisRim.rotation.x = Math.PI / 2
  daisRim.position.set(cx, FLOOR + 0.32, cz)
  interior.add(dais, daisRim)

  // ── Walls: two arcs between the entry (+z) and exit (-z) bulkheads, an outer skin and a dark inner skin.
  const aEntry = Math.asin(ENTRY_HALF / (R + WALL / 2))
  const aExit = Math.asin(EXIT_HALF / (R + WALL / 2))
  const arc = (start: number, length: number) => {
    const outer = new Mesh(track(new CylinderGeometry(R + WALL, R + WALL, H, 72, 1, true, start, length)), outerWall)
    const inner = new Mesh(track(new CylinderGeometry(R, R, H, 72, 1, true, start, length)), innerWall)
    outer.position.set(cx, FLOOR + H / 2, cz)
    inner.position.set(cx, FLOOR + H / 2, cz)
    group.add(outer)
    interior.add(inner)
  }
  arc(aEntry, Math.PI - aExit - aEntry)
  arc(Math.PI + aExit, Math.PI - aExit - aEntry)

  // Roof, ceiling with a warm oculus glow, and a beacon.
  const roof = new Mesh(track(new CylinderGeometry(R + WALL + 0.4, R + WALL + 0.4, 1.4, 72)), bronze)
  roof.position.set(cx, FLOOR + H + 0.7, cz)
  const roofCap = new Mesh(track(new CylinderGeometry(R * 0.7, R * 0.78, 1.4, 64)), bronzeDark)
  roofCap.position.set(cx, FLOOR + H + 2.1, cz)
  const ceiling = new Mesh(track(new CircleGeometry(R, 72)), track(new MeshBasicMaterial({ color: 0x151c2e, toneMapped: false, side: DoubleSide })))
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.set(cx, FLOOR + H - 0.05, cz)
  const oculus = new Mesh(track(new RingGeometry(5.5, 6.4, 64)), lightLine(0xdcb665, 0.95))
  oculus.rotation.x = Math.PI / 2
  oculus.position.set(cx, FLOOR + H - 0.12, cz)
  const ceilingGlow = new Mesh(track(new PlaneGeometry(R * 1.6, R * 1.6)), track(new MeshBasicMaterial({ map: glow, color: 0xffd9a0, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide })))
  ceilingGlow.rotation.x = Math.PI / 2
  ceilingGlow.position.set(cx, FLOOR + H - 0.5, cz)
  const beacon = new Mesh(track(new CylinderGeometry(0.25, 0.35, 9, 10)), bronze)
  beacon.position.set(cx, FLOOR + H + 7.2, cz)
  const beaconTip = new Mesh(track(new SphereGeometry(0.7, 14, 10)), lightLine(0xffd27a, 1))
  beaconTip.position.set(cx, FLOOR + H + 12, cz)
  group.add(roof, roofCap, beacon, beaconTip)
  interior.add(ceiling, oculus, ceilingGlow)

  // Cove lights: warm near the ceiling, cool at the floor, so the holograms read against a deliberate glow.
  ;[
    { y: H - 2.4, color: 0xffd9a0, tube: 0.16 },
    { y: 2.6, color: 0x7fcfff, tube: 0.1 }
  ].forEach(({ y, color, tube }) => {
    const cove = new Mesh(track(new TorusGeometry(R - 0.3, tube, 6, 160)), track(new MeshBasicMaterial({ color, toneMapped: false })))
    cove.rotation.x = Math.PI / 2
    cove.position.set(cx, FLOOR + y, cz)
    interior.add(cove)
  })

  // Exterior: brass bands, slim bronze fins and a row of warm window slits.
  // Bands run along the two wall arcs only, so nothing crosses the hatch or the exit portal.
  ;[2.2, 14, 23].forEach((y, i) => {
    const arcLength = Math.PI - aExit - aEntry - 0.3
    ;[aEntry + 0.15, Math.PI + aExit + 0.15].forEach(start => {
      const band = new Mesh(track(new CylinderGeometry(R + WALL + 0.16, R + WALL + 0.16, i === 1 ? 0.5 : 0.3, 64, 1, true, start, arcLength)), i === 1 ? brass : lightLine(0xdcb665, 0.85))
      band.position.set(cx, FLOOR + y, cz)
      group.add(band)
    })
  })
  const finCount = 28
  const fins = new InstancedMesh(track(new BoxGeometry(0.55, H - 1, 1.0)), bronzeDark, finCount)
  const slits = new InstancedMesh(track(new BoxGeometry(0.28, 4.4, 0.18)), warmLine, finCount * 2)
  const m4 = new Matrix4()
  const helper = new Object3D()
  let finIndex = 0
  let slitIndex = 0
  for (let i = 0; i < finCount; i += 1) {
    const theta = (i / finCount) * Math.PI * 2
    const fromEntry = Math.abs(Math.atan2(Math.sin(theta), Math.cos(theta)))
    const fromExit = Math.PI - fromEntry
    if (fromEntry < aEntry + 0.14 || fromExit < aExit + 0.14) continue
    helper.position.set(cx + Math.sin(theta) * (R + WALL + 0.32), FLOOR + H / 2, cz + Math.cos(theta) * (R + WALL + 0.32))
    helper.rotation.set(0, theta, 0)
    helper.updateMatrix()
    fins.setMatrixAt(finIndex, m4.copy(helper.matrix))
    finIndex += 1
    // slits sit between this fin and the next one
    const mid = theta + Math.PI / finCount
    const fromEntryMid = Math.abs(Math.atan2(Math.sin(mid), Math.cos(mid)))
    if (fromEntryMid > aEntry + 0.16 && Math.PI - fromEntryMid > aExit + 0.16) {
      ;[9.5, 18.5].forEach(y => {
        helper.position.set(cx + Math.sin(mid) * (R + WALL + 0.1), FLOOR + y, cz + Math.cos(mid) * (R + WALL + 0.1))
        helper.rotation.set(0, mid, 0)
        helper.updateMatrix()
        slits.setMatrixAt(slitIndex, m4.copy(helper.matrix))
        slitIndex += 1
      })
    }
  }
  fins.count = finIndex
  slits.count = slitIndex
  group.add(fins, slits)

  // ── Entry bulkhead (a plate with a round hatch opening) and the hatch itself.
  const HATCH_R = 4.6
  const HATCH_Y = FLOOR + 5.4
  const entryZ = cz + R + WALL / 2
  const plateShape = new Shape()
  plateShape.moveTo(-ENTRY_HALF - 0.9, 0)
  plateShape.lineTo(ENTRY_HALF + 0.9, 0)
  plateShape.lineTo(ENTRY_HALF + 0.9, H)
  plateShape.lineTo(-ENTRY_HALF - 0.9, H)
  plateShape.closePath()
  const hole = new Path()
  hole.absarc(0, HATCH_Y - FLOOR, HATCH_R + 0.4, 0, Math.PI * 2, true)
  plateShape.holes.push(hole)
  const entryPlate = new Mesh(track(new ExtrudeGeometry(plateShape, { depth: 1.7, bevelEnabled: false, curveSegments: 40 })), bronzeDark)
  entryPlate.position.set(cx, FLOOR, entryZ - 0.2)
  group.add(entryPlate)
  const collar = new Mesh(track(new TorusGeometry(HATCH_R + 0.55, 0.44, 10, 64)), brass)
  collar.position.set(cx, HATCH_Y, entryZ + 1.5)
  const gasket = new Mesh(track(new TorusGeometry(HATCH_R + 0.1, 0.24, 8, 64)), track(new MeshStandardMaterial({ color: 0x0b0e16, roughness: 0.7, emissive: 0x05070c, emissiveIntensity: 0.5 })))
  gasket.position.set(cx, HATCH_Y, entryZ + 1.2)
  group.add(collar, gasket)
  const rivets = new InstancedMesh(track(new SphereGeometry(0.17, 8, 6)), brass, 28)
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2
    helper.position.set(cx + Math.cos(a) * (HATCH_R + 1.2), HATCH_Y + Math.sin(a) * (HATCH_R + 1.2), entryZ + 1.55)
    helper.rotation.set(0, 0, 0)
    helper.updateMatrix()
    rivets.setMatrixAt(i, m4.copy(helper.matrix))
  }
  group.add(rivets)
  // status lights beside the hatch: closed amber, open green
  const statusMaterial = track(new MeshBasicMaterial({ color: 0xffb347, toneMapped: false }))
  ;[-1, 1].forEach(side => {
    const lamp = new Mesh(track(new SphereGeometry(0.34, 12, 10)), statusMaterial)
    lamp.position.set(cx + side * (HATCH_R + 1.7), HATCH_Y, entryZ + 1.9)
    group.add(lamp)
  })
  // sign above the hatch
  const entrySign = createSign(5.2)
  track(entrySign)
  entrySign.repaint(copy.signs.projects)
  const entrySignMesh = new Mesh(track(new PlaneGeometry(6.6, 6.6 / 5.2)), track(new MeshBasicMaterial({ map: entrySign.texture, transparent: true, toneMapped: false })))
  entrySignMesh.position.set(cx, HATCH_Y + HATCH_R + 2.1, entryZ + 1.58)
  group.add(entrySignMesh)

  // Hatch door: hinged on its left edge, swings outward. Local origin at the hinge.
  const hinge = new Group()
  hinge.position.set(cx - HATCH_R - 0.2, HATCH_Y, entryZ + 0.9)
  group.add(hinge)
  const door = new Group()
  door.position.x = HATCH_R + 0.2
  hinge.add(door)
  const doorProfile = [
    new Vector2(0, 0.5),
    new Vector2(1.2, 0.5),
    new Vector2(1.35, 0.66),
    new Vector2(HATCH_R - 1.5, 0.66),
    new Vector2(HATCH_R - 1.35, 0.48),
    new Vector2(HATCH_R - 0.35, 0.46),
    new Vector2(HATCH_R, 0.28),
    new Vector2(HATCH_R, -0.4),
    new Vector2(0, -0.4)
  ]
  const disc = new Mesh(track(new LatheGeometry(doorProfile, 64)), bronze)
  disc.rotation.x = Math.PI / 2
  const rim = new Mesh(track(new TorusGeometry(HATCH_R - 0.18, 0.28, 10, 72)), brass)
  rim.position.z = 0.4
  const rib = new Mesh(track(new TorusGeometry(HATCH_R - 1.75, 0.09, 8, 72)), brass)
  rib.position.z = 0.7
  door.add(disc, rim, rib)
  const boltGeometry = track(new CylinderGeometry(0.28, 0.28, 1.2, 10))
  const boltTip = track(new CylinderGeometry(0.34, 0.34, 0.25, 10))
  const bolts: Mesh[] = []
  const BOLTS = 10
  for (let i = 0; i < BOLTS; i += 1) {
    const a = (i / BOLTS) * Math.PI * 2
    const bolt = new Mesh(boltGeometry, brass)
    bolt.rotation.z = a - Math.PI / 2
    const tip = new Mesh(boltTip, brass)
    tip.position.y = 0.6
    bolt.add(tip)
    door.add(bolt)
    ;(bolt.userData as { a: number }).a = a
    bolts.push(bolt)
  }
  // the lock wheel
  const wheel = new Group()
  wheel.position.z = 0.98
  door.add(wheel)
  const wheelRim = new Mesh(track(new TorusGeometry(2.1, 0.17, 10, 56)), brass)
  const hub = new Mesh(track(new CylinderGeometry(0.75, 0.95, 0.7, 24)), bronzeDark)
  hub.rotation.x = Math.PI / 2
  const hubCap = new Mesh(track(new CylinderGeometry(0.42, 0.42, 0.2, 18)), brass)
  hubCap.rotation.x = Math.PI / 2
  hubCap.position.z = 0.38
  wheel.add(wheelRim, hub, hubCap)
  const spokeGeometry = track(new CylinderGeometry(0.1, 0.16, 4.9, 8))
  const knobGeometry = track(new SphereGeometry(0.3, 12, 10))
  for (let i = 0; i < 4; i += 1) {
    const spoke = new Mesh(spokeGeometry, bronzeDark)
    spoke.rotation.z = (i * Math.PI) / 4 + Math.PI / 2
    wheel.add(spoke)
    ;[-1, 1].forEach(side => {
      const knob = new Mesh(knobGeometry, brass)
      knob.position.set(Math.cos((i * Math.PI) / 4) * 2.45 * side, Math.sin((i * Math.PI) / 4) * 2.45 * side, 0)
      wheel.add(knob)
    })
  }

  // ── Exit portal: an arched opening that the corridor starts in, outlined in brass and closed by two sliding doors.
  const exitZ = cz - R - WALL / 2
  const EX_H = 10.2
  const openW = EXIT_HALF - 1.6
  const exitShape = new Shape()
  exitShape.moveTo(-EXIT_HALF - 1, 0)
  exitShape.lineTo(EXIT_HALF + 1, 0)
  exitShape.lineTo(EXIT_HALF + 1, H)
  exitShape.lineTo(-EXIT_HALF - 1, H)
  exitShape.closePath()
  const exitHole = new Path()
  exitHole.moveTo(-openW, 0.2)
  exitHole.lineTo(openW, 0.2)
  exitHole.lineTo(openW, EX_H - 3.4)
  exitHole.absarc(openW - 3.4, EX_H - 3.4, 3.4, 0, Math.PI / 2, false)
  exitHole.lineTo(-openW + 3.4, EX_H)
  exitHole.absarc(-openW + 3.4, EX_H - 3.4, 3.4, Math.PI / 2, Math.PI, false)
  exitHole.closePath()
  exitShape.holes.push(exitHole)
  const exitPlate = new Mesh(track(new ExtrudeGeometry(exitShape, { depth: 1.7, bevelEnabled: false, curveSegments: 24 })), bronzeDark)
  exitPlate.position.set(cx, FLOOR, exitZ - 1.5)
  group.add(exitPlate)
  // brass outline that follows the opening exactly (a tube along the same path), both faces
  const outlinePoints = exitHole.getPoints(14).map(p => new Vector3(p.x, p.y, 0))
  const outline = new CatmullRomCurve3([...outlinePoints, outlinePoints[0].clone()], true, 'catmullrom', 0.05)
  ;[0.22, -1.55].forEach(dz => {
    const tube = new Mesh(track(new TubeGeometry(outline, 160, 0.2, 8, true)), brass)
    tube.position.set(cx, FLOOR, exitZ + dz)
    group.add(tube)
  })
  const slabMaterial = track(new MeshStandardMaterial({ color: 0x59627a, metalness: 0.45, roughness: 0.38, emissive: 0x2b3550, emissiveIntensity: 0.7 }))
  const slabGeometry = track(new BoxGeometry(openW + 0.2, EX_H, 0.5))
  const slabs = [-1, 1].map(side => {
    const slab = new Mesh(slabGeometry, slabMaterial)
    const home = side * ((openW + 0.2) / 2)
    slab.position.set(cx + home, FLOOR + EX_H / 2, exitZ + 0.3)
    const seam = new Mesh(track(new BoxGeometry(0.16, EX_H - 0.6, 0.12)), lightLine(0xdcb665))
    seam.position.set(-side * ((openW + 0.2) / 2 - 0.1), 0, 0.3)
    const inlay = new Mesh(track(new BoxGeometry(openW - 1.6, 0.1, 0.1)), lightLine(0x7fcfff, 0.7))
    inlay.position.set(0, 1.5, 0.3)
    slab.add(seam, inlay)
    group.add(slab)
    return { slab, home, side }
  })
  const exitSign = createSign(6)
  track(exitSign)
  exitSign.repaint(copy.signs.exit)
  const exitSignMesh = new Mesh(track(new PlaneGeometry(7.4, 7.4 / 6)), track(new MeshBasicMaterial({ map: exitSign.texture, transparent: true, toneMapped: false })))
  exitSignMesh.position.set(cx, FLOOR + EX_H + 1.7, exitZ + 0.3)
  group.add(exitSignMesh)

  // ── Holograms on the inner wall: bright panels with a light frame, a projector cone and a soft halo.
  const geometry = track(new PlaneGeometry(layout.width, layout.height))
  const haloGeometry = track(new PlaneGeometry(layout.width * 1.55, layout.height * 1.7))
  const barH = track(new BoxGeometry(layout.width + 0.4, 0.1, 0.06))
  const barV = track(new BoxGeometry(0.1, layout.height + 0.4, 0.06))
  const coneHeight = HOLO_Y - layout.height / 2 - 0.6
  const coneGeometry = track(new PlaneGeometry(layout.width * 0.55, coneHeight))
  const frameLight = track(new MeshBasicMaterial({ color: 0x8fdcff, toneMapped: false }))
  const scan = track(scanTexture())
  scan.repeat.set(1, layout.height * 2)

  const holos = projects.map((project, index) => {
    const psi = layout.angles[index]
    const dirX = Math.sin(psi)
    const dirZ = -Math.cos(psi)
    const radius = R - 0.9
    const holder = new Group()
    holder.position.set(cx + dirX * radius, FLOOR + HOLO_Y, cz + dirZ * radius)
    holder.rotation.y = Math.atan2(-dirX, -dirZ)
    interior.add(holder)

    const makeFace = (url: string) => {
      const map = loadMap(url)
      const material = track(new MeshBasicMaterial({ map, toneMapped: false, transparent: true }))
      const mesh = new Mesh(geometry, material)
      holder.add(mesh)
      // an additive twin makes the image luminous (a hologram), not a printed poster
      const lightMaterial = track(new MeshBasicMaterial({ map, toneMapped: false, transparent: true, opacity: 0.32, blending: AdditiveBlending, depthWrite: false }))
      const light = new Mesh(geometry, lightMaterial)
      light.position.z = 0.02
      if (!low) holder.add(light)
      return { mesh, material, lightMaterial }
    }
    const site = makeFace(project.shot)
    const app = project.appShot ? makeFace(project.appShot) : undefined
    if (app) {
      app.material.opacity = 0
      app.lightMaterial.opacity = 0
    }
    const halo = new Mesh(haloGeometry, track(new MeshBasicMaterial({ map: glow, color: 0x7fcfff, transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false, toneMapped: false })))
    halo.position.z = -0.25
    const scanMaterial = track(new MeshBasicMaterial({ map: scan, color: 0xcfeaff, transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false, toneMapped: false }))
    const scanMesh = new Mesh(geometry, scanMaterial)
    scanMesh.position.z = 0.04
    holder.add(halo)
    if (!low) holder.add(scanMesh)
    // light frame: four slim bars (no corner pieces)
    ;[1, -1].forEach(side => {
      const h = new Mesh(barH, frameLight)
      h.position.set(0, side * (layout.height / 2 + 0.2), 0.03)
      const v = new Mesh(barV, frameLight)
      v.position.set(side * (layout.width / 2 + 0.2), 0, 0.03)
      holder.add(h, v)
    })
    // projector: a small emitter on the floor and a cone of light up to the panel
    const emitter = new Mesh(track(new CylinderGeometry(0.9, 1.2, 0.5, 20)), bronze)
    emitter.position.set(0, -HOLO_Y + 0.3, -0.2)
    holder.add(emitter)
    const coneMaterial = track(new MeshBasicMaterial({ map: shaft, color: 0x7fcfff, transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
    if (!low) {
      ;[0, Math.PI / 2].forEach(rotation => {
        const cone = new Mesh(coneGeometry, coneMaterial)
        cone.position.set(0, -layout.height / 2 - coneHeight / 2, -0.15)
        cone.rotation.y = rotation
        holder.add(cone)
      })
    }
    return { holder, site, app, scanMaterial, psi, dir: new Vector3(dirX, 0, dirZ) }
  })

  const slide = (open: number) => {
    slabs.forEach(({ slab, home, side }) => {
      slab.position.x = cx + home + side * open * (openW + 0.2) * 0.96
    })
  }

  const centerAt = (index: number, out: Vector3) => {
    const h = holos[index]
    out.set(cx + h.dir.x * (R - 0.9), FLOOR + HOLO_Y, cz + h.dir.z * (R - 0.9))
  }

  return {
    group,
    count,
    angle: index => holos[index].psi,
    hologramCenter: centerAt,
    hotspotAnchor(index, out) {
      // on the panel itself, in its lower third, nudged toward the viewer so it never sits inside the image plane
      centerAt(index, out)
      out.x -= holos[index].dir.x * 0.35
      out.z -= holos[index].dir.z * 0.35
      out.y -= layout.height * 0.27
    },
    hologramWidth: layout.width,
    detailPose(psi, out, phone = false) {
      const dx = Math.sin(psi)
      const dz = -Math.cos(psi)
      const standoff = phone ? R * 0.1 : R * 0.34
      out.px = cx + dx * standoff
      out.pz = cz + dz * standoff
      out.py = FLOOR + EYE + 1.1
      out.lx = cx + dx * (R - 0.9)
      out.lz = cz + dz * (R - 0.9)
      out.ly = FLOOR + HOLO_Y - 0.6
    },
    setCopy(next) {
      entrySign.repaint(next.signs.projects)
      exitSign.repaint(next.signs.exit)
    },
    setFar(far) {
      interior.visible = !far
    },
    update(time, { focus, appMix, open, awake }) {
      const turn = open.turn
      wheel.rotation.z = -turn * Math.PI * 2.4
      bolts.forEach(bolt => {
        const a = (bolt.userData as { a: number }).a
        const reach = HATCH_R + 0.1 - turn * 0.7
        bolt.position.set(Math.cos(a) * reach, Math.sin(a) * reach, 0)
      })
      hinge.rotation.y = -open.hatch * 1.85
      statusMaterial.color.setHex(open.hatch > 0.5 ? 0x5eead4 : 0xffb347)
      slide(open.exit)
      beaconTip.scale.setScalar(1 + 0.12 * Math.sin(time * 2.4))
      scan.offset.y = -time * 0.05
      holos.forEach((holo, index) => {
        const dim = focus >= 0 ? (index === focus ? 1 : 0.6) : 1
        const mix = holo.app ? appMix : 0
        const show = index === focus ? 1 : 0
        const brightness = clamp(0.25 + 0.75 * awake) * dim * 1.08
        holo.site.material.color.setScalar(brightness)
        holo.site.material.opacity = 1 - mix * show
        holo.site.lightMaterial.opacity = 0.32 * (1 - mix * show) * dim
        if (holo.app) {
          holo.app.material.color.setScalar(brightness)
          holo.app.material.opacity = mix * show
          holo.app.lightMaterial.opacity = 0.32 * mix * show * dim
        }
        holo.scanMaterial.opacity = 0.08 + 0.04 * Math.sin(time * 1.4 + index)
        holo.holder.position.y = FLOOR + HOLO_Y + Math.sin(time * 0.7 + index * 1.7) * 0.1
      })
      frameLight.color.setHex(0x8fdcff).multiplyScalar(lerp(0.7, 1, focus >= 0 ? 1 : 0.8))
    },
    dispose() {
      disposables.forEach(item => item.dispose())
      fins.dispose()
      slits.dispose()
      rivets.dispose()
    }
  }
}
