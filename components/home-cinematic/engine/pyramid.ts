import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Quaternion,
  Vector3
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { constructible, type CutUniforms } from './construct'
import { STATIONS, facing, groundHeight } from './layout'
import { clamp, smoothstep } from './noise'
import { PAD_TOP, createPad, makeTracker } from './pads'
import { facadeTextures, shaftTexture } from './textures'

export type Pyramid = {
  group: Group
  /** progress 0..1 through the chapter: skeleton, then skin, then the lit finish */
  update(progress: number, time: number, awake: number, leave?: number): void
  glow: { x: number; y: number; z: number; r: number; amount: () => number }
  dispose(): void
}

const TIERS = [
  { half: 15, top: 12.6, h: 7 },
  { half: 12.6, top: 10, h: 6.6 },
  { half: 10, top: 7.4, h: 6.2 },
  { half: 7.4, top: 4.8, h: 5.8 },
  { half: 4.8, top: 2.2, h: 5.4 }
]

/** A thin strut between two points, as a low-poly cylinder oriented along the segment. */
function strut(a: Vector3, b: Vector3, radius: number) {
  const length = a.distanceTo(b)
  const geometry = new CylinderGeometry(radius, radius, length, 6, 1)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize())
  geometry.applyQuaternion(q)
  geometry.translate(mid.x, mid.y, mid.z)
  return geometry
}

/**
 * Chapter 06: a stepped pyramid beside the road. First it appears as a skeleton, a steel frame with braces rising tier
 * by tier; then glass and stone skin closes over it and the whole structure lights up, topped with a crystal.
 */
export function createPyramid(): Pyramid {
  const { track, dispose } = makeTracker()
  const S = STATIONS.building
  const base = groundHeight(S.x, S.z)
  const root = new Group()
  root.position.set(S.x, base, S.z)
  root.rotation.y = facing(S, { x: S.x + 34, z: S.z + 34 })

  const total = TIERS.reduce((sum, tier) => sum + tier.h, 0)
  const pad = createPad(S.r - 2, 0xffbf43, track)
  root.add(pad.group)

  const gold = new Color(0xffbf43)
  const frame: CutUniforms = { uBuild: { value: 0 }, uBase: { value: base + PAD_TOP }, uHeight: { value: total + 4 }, uEdge: { value: gold } }
  const skin: CutUniforms = { uBuild: { value: 0 }, uBase: { value: base + PAD_TOP }, uHeight: { value: total + 4 }, uEdge: { value: gold } }

  // Skeleton: posts, ring beams and X braces for every tier, merged into one mesh.
  const members: BufferGeometry[] = []
  let y = PAD_TOP
  TIERS.forEach(tier => {
    const lower = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new Vector3(sx * tier.half, y, sz * tier.half))
    const upper = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new Vector3(sx * tier.top, y + tier.h, sz * tier.top))
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4
      members.push(strut(lower[i], upper[i], 0.2))
      members.push(strut(lower[i], lower[j], 0.15))
      members.push(strut(upper[i], upper[j], 0.15))
      members.push(strut(lower[i], upper[j], 0.09))
      members.push(strut(lower[j], upper[i], 0.09))
      const mid = lower[i].clone().lerp(lower[j], 0.5)
      const midTop = upper[i].clone().lerp(upper[j], 0.5)
      members.push(strut(mid, midTop, 0.08))
    }
    y += tier.h
  })
  const frameGeometry = track(mergeGeometries(members, false)!)
  members.forEach(member => member.dispose())
  const frameMaterial = track(
    constructible(new MeshStandardMaterial({ color: 0x24324f, metalness: 0.85, roughness: 0.3, emissive: 0x159bff, emissiveIntensity: 0.55, envMapIntensity: 1 }), frame, 'solid')
  )
  root.add(new Mesh(frameGeometry, frameMaterial))

  // Skin: glass-and-stone tiers with a lit window grid, closing over the frame.
  const facade = facadeTextures(5)
  track(facade.map)
  track(facade.emissive)
  const skinMaterials: MeshStandardMaterial[] = []
  y = PAD_TOP
  TIERS.forEach(tier => {
    const material = track(
      constructible(
        new MeshStandardMaterial({ map: facade.map, emissiveMap: facade.emissive, emissive: 0xffffff, emissiveIntensity: 0.2, color: 0xcfdcf2, metalness: 0.55, roughness: 0.25, envMapIntensity: 0.9 }),
        skin,
        'solid'
      )
    )
    skinMaterials.push(material)
    const geometry = track(new CylinderGeometry(tier.top * Math.SQRT2 - 0.05, tier.half * Math.SQRT2, tier.h, 4, 1))
    const uv = geometry.attributes.uv
    for (let k = 0; k < uv.count; k += 1) uv.setXY(k, uv.getX(k) * 4, uv.getY(k) * (tier.h / 5))
    const mesh = new Mesh(geometry, material)
    mesh.rotation.y = Math.PI / 4
    mesh.position.y = y + tier.h / 2
    root.add(mesh)
    // gold terrace ledge at the top of each tier
    const ledge = new Mesh(
      track(new CylinderGeometry(tier.top * Math.SQRT2 + 0.3, tier.top * Math.SQRT2 + 0.3, 0.34, 4, 1)),
      constructible(track(new MeshStandardMaterial({ color: 0x4a3410, emissive: gold, emissiveIntensity: 1.2, metalness: 0.3, roughness: 0.3 })), skin, 'solid')
    )
    ledge.rotation.y = Math.PI / 4
    ledge.position.y = y + tier.h
    root.add(ledge)
    y += tier.h
  })

  // Crystal capstone and a soft beam once it is finished.
  const crystalMaterial = track(new MeshStandardMaterial({ color: 0x2a1c06, emissive: gold, emissiveIntensity: 0.2, metalness: 0.4, roughness: 0.2 }))
  const crystal = new Mesh(track(new OctahedronGeometry(2.1, 0)), crystalMaterial)
  crystal.position.y = total + PAD_TOP + 3.2
  crystal.scale.y = 1.5
  root.add(crystal)
  const beamMaterial = track(new MeshBasicMaterial({ map: track(shaftTexture()), color: 0xffd08a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  for (let i = 0; i < 2; i += 1) {
    const plane = new Mesh(track(new PlaneGeometry(9, 170)), beamMaterial)
    plane.position.y = total + PAD_TOP + 80
    plane.rotation.y = (i * Math.PI) / 2
    root.add(plane)
  }

  let amount = 0
  return {
    group: root,
    glow: { x: S.x, y: base + 12, z: S.z, r: 30, amount: () => amount },
    update(progress, time, awake, leave = 0) {
      const p = clamp(progress)
      const a = clamp(awake)
      frame.uBuild.value = smoothstep(0.0, 0.2, p)
      skin.uBuild.value = smoothstep(0.3, 0.58, p)
      const finish = smoothstep(0.55, 0.88, p)
      amount = a * (0.3 + 0.7 * smoothstep(0, 0.6, p))
      frameMaterial.emissiveIntensity = 0.55 * (1 - 0.6 * smoothstep(0.5, 0.75, p)) + 0.2
      skinMaterials.forEach(m => {
        m.emissiveIntensity = (0.15 + 0.95 * finish) * (0.5 + 0.5 * a)
      })
      crystalMaterial.emissiveIntensity = 0.2 + 1.6 * finish
      crystal.rotation.y = time * 0.8
      crystal.visible = skin.uBuild.value > 0.9
      // the beam is part of the finished moment; it fades once the visitor has moved on
      beamMaterial.opacity = smoothstep(0.7, 1, p) * 0.26 * (0.85 + 0.15 * Math.sin(time * 2)) * (1 - clamp(leave))
      pad.rim.emissiveIntensity = 0.7 + 0.8 * finish
    },
    dispose
  }
}
