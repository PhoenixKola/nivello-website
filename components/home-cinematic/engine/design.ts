import {
  AdditiveBlending,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  TorusGeometry
} from 'three'
import { STATIONS, facing, groundHeight } from './layout'
import { clamp, smoothstep } from './noise'
import { PAD_TOP, createPad, makeTracker } from './pads'
import { designLayer, specimenPlate, type CopyRef } from './screens'
import { shaftTexture } from './textures'

export type Design = {
  group: Group
  /** progress 0..1 through the chapter */
  update(progress: number, time: number, awake: number): void
  glow: { x: number; y: number; z: number; r: number; amount: () => number }
  /** Repaint every word on the layers and the specimen plate (after the locale changed). */
  repaintText(): void
  dispose(): void
}

/**
 * Chapter 04, in the open and beside the planning pad's neighbour: a page is designed in front of you. A projector on a
 * stone pad lifts three layers into the air (wireframe, layout, finished visual design); they start exploded apart,
 * come together as colour and type arrive, and a palette and type specimen stand on the pad.
 */
export function createDesign(ref: CopyRef): Design {
  const { track, dispose } = makeTracker()
  const S = STATIONS.design
  const base = groundHeight(S.x, S.z)
  const root = new Group()
  root.position.set(S.x, base, S.z)
  root.rotation.y = facing(S, { x: S.x + 27, z: S.z + 25 })

  const pad = createPad(S.r - 7, 0xffbf43, track)
  root.add(pad.group)

  const graphite = track(new MeshStandardMaterial({ color: 0x1b2438, roughness: 0.34, metalness: 0.7, envMapIntensity: 0.9, emissive: 0x0a1020, emissiveIntensity: 0.4 }))
  const blueLight = track(new MeshStandardMaterial({ color: 0x0b1424, emissive: 0x159bff, emissiveIntensity: 1.3 }))

  // Projector: a low drum with a glowing ring, and a cone of light rising into the hologram.
  const drum = new Mesh(track(new CylinderGeometry(2.6, 3.2, 1.1, 40)), graphite)
  drum.position.set(0, PAD_TOP + 0.55, -1.5)
  const ring = new Mesh(track(new TorusGeometry(2.3, 0.1, 8, 64)), blueLight)
  ring.rotation.x = Math.PI / 2
  ring.position.set(0, PAD_TOP + 1.15, -1.5)
  root.add(drum, ring)
  const cone = new Mesh(
    track(new PlaneGeometry(6, 9)),
    track(new MeshBasicMaterial({ map: track(shaftTexture()), color: 0x78cdff, transparent: true, opacity: 0.18, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  )
  cone.position.set(0, PAD_TOP + 5.4, -1.5)
  const cone2 = cone.clone()
  cone2.rotation.y = Math.PI / 2
  root.add(cone, cone2)

  // Hologram layers.
  const layerPaints: { repaint(): void }[] = []
  const W = 12.8
  const H = 8
  const hy = PAD_TOP + 10
  const layers = ([0, 1, 2] as const).map(kind => {
    const painted = designLayer(kind, ref)
    track(painted)
    layerPaints.push(painted)
    const map = painted.texture
    const material = track(new MeshBasicMaterial({ map, transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false }))
    const mesh = new Mesh(track(new PlaneGeometry(W, H)), material)
    const edges = new LineSegments(track(new EdgesGeometry(mesh.geometry)), track(new LineBasicMaterial({ color: kind === 2 ? 0xffbf43 : 0x78cdff, transparent: true, toneMapped: false })))
    const holder = new Group()
    holder.add(mesh, edges)
    holder.position.set(0, hy, -1.5)
    root.add(holder)
    return { holder, material, edges: edges.material as LineBasicMaterial }
  })
  const scan = new Mesh(track(new PlaneGeometry(W + 0.6, 0.12)), track(new MeshBasicMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })))
  scan.position.set(0, hy, -1.5)
  root.add(scan)

  // Palette: glossy pucks along the front edge of the pad.
  const swatchColors = [0x159bff, 0xffbf43, 0x7c3aed, 0x34d399, 0xf472b6]
  const swatches = swatchColors.map((color, i) => {
    const mesh = new Mesh(
      track(new CylinderGeometry(0.95, 1.05, 0.55, 28)),
      track(new MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.2, emissive: color, emissiveIntensity: 0.35, envMapIntensity: 0.9 }))
    )
    const x = (i - 2) * 2.6
    mesh.position.set(x, PAD_TOP + 0.3, 6.4 - Math.abs(i - 2) * 0.7)
    root.add(mesh)
    return mesh
  })

  // Type specimen: a slim standing plate to the left of the hologram.
  const plate = new Mesh(track(new BoxGeometry(3.6, 3.6, 0.22)), graphite)
  plate.position.set(-9.6, PAD_TOP + 2.6, 1.4)
  plate.rotation.y = 0.5
  const specimen = specimenPlate(ref)
  track(specimen)
  const plateFace = new Mesh(track(new PlaneGeometry(3.3, 3.3)), track(new MeshBasicMaterial({ map: specimen.texture, toneMapped: false })))
  plateFace.position.set(0, 0, 0.13)
  plate.add(plateFace)
  const plateFoot = new Mesh(track(new CylinderGeometry(0.9, 1.1, 0.8, 24)), graphite)
  plateFoot.position.set(-9.8, PAD_TOP + 0.4, 1.2)
  root.add(plate, plateFoot)

  let amount = 0
  return {
    group: root,
    glow: { x: S.x, y: base + 8, z: S.z, r: 24, amount: () => amount },
    repaintText() {
      layerPaints.forEach(item => item.repaint())
      specimen.repaint()
    },
    update(progress, time, awake) {
      const p = clamp(progress)
      const a = clamp(awake)
      amount = a
      const explode = 1 - smoothstep(0.3, 0.88, p)
      const gap = 0.25 + 3.2 * explode
      const yaw = Math.sin(time * 0.4) * 0.04 + 0.34 * explode
      const wireOp = 0.95 * (1 - 0.92 * smoothstep(0.55, 0.9, p))
      const layoutOp = smoothstep(0.08, 0.38, p) * (1 - smoothstep(0.52, 0.86, p))
      const finalOp = smoothstep(0.42, 0.88, p)
      const ops = [wireOp, layoutOp, finalOp]
      layers.forEach((layer, i) => {
        // front-most layer is the finished design
        layer.holder.position.z = -1.5 + (i - 1) * gap
        layer.holder.rotation.y = yaw
        layer.holder.position.y = hy + Math.sin(time * 0.7 + i) * 0.12
        layer.material.opacity = ops[i] * (0.4 + 0.6 * a)
        layer.edges.opacity = Math.min(1, ops[i] * 1.2) * (i === 2 ? 0.6 : 0.9)
      })
      const sweep = (time * 0.35) % 1
      scan.position.y = hy - H / 2 + sweep * H
      scan.rotation.y = yaw
      ;(scan.material as MeshBasicMaterial).opacity = 0.35 * Math.sin(sweep * Math.PI) * (1 - smoothstep(0.7, 0.95, p))
      swatches.forEach((swatch, i) => {
        const s = smoothstep(0.35 + i * 0.07, 0.6 + i * 0.07, p)
        swatch.scale.set(Math.max(0.001, s), Math.max(0.001, s), Math.max(0.001, s))
        swatch.rotation.y = time * 0.5 + i
      })
      blueLight.emissiveIntensity = 0.9 + 0.6 * a
      pad.rim.emissiveIntensity = 0.7 + 0.6 * a
    },
    dispose
  }
}
