import {
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SRGBColorSpace
} from 'three'
import { FINAL, MONUMENT, PLAZA, STATIONS, TUNNEL, WORLD, groundHeight, routeX } from './layout'

/**
 * Overhead map layer: when the camera lifts for the finale, each chapter's place on the ground lights up with a ring
 * and its chapter number, joined by one bright route line. It makes the whole journey legible from above.
 */
function numberTexture(label: string) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffe6b0'
  ctx.font = '800 76px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 64, 68)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export type Overview = {
  group: Group
  update(amount: number): void
  dispose(): void
}

export function createOverview(): Overview {
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }
  const materials: MeshBasicMaterial[] = []
  const base: number[] = []
  const material = (params: ConstructorParameters<typeof MeshBasicMaterial>[0], opacity: number) => {
    const m = track(new MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0, ...params }))
    materials.push(m)
    base.push(opacity)
    return m
  }

  // The route: one clear ribbon from the valley to the summit, following the real road (winding in the arrival).
  const length = WORLD.zMax - FINAL.z
  const segments = Math.ceil(length / 5)
  const ribbon = track(new PlaneGeometry(3.4, length, 1, segments))
  const pos = ribbon.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    const z = FINAL.z + length / 2 - pos.getY(i)
    const x = routeX(z) + pos.getX(i)
    pos.setXYZ(i, x, groundHeight(x, z) + 1.4, z)
  }
  pos.needsUpdate = true
  const line = new Mesh(ribbon, material({ color: 0xffbf43, blending: AdditiveBlending, side: DoubleSide }, 0.7))
  group.add(line)

  const marks: { label: string; x: number; z: number; r: number }[] = [
    { label: '02', x: MONUMENT.x, z: MONUMENT.z, r: 15 },
    { label: '03', ...STATIONS.planning },
    { label: '04', ...STATIONS.design },
    { label: '05', ...STATIONS.dev },
    { label: '06', ...STATIONS.building },
    { label: '07', x: PLAZA.x, z: PLAZA.z, r: PLAZA.r },
    { label: '08', x: 0, z: (TUNNEL.z0 + TUNNEL.z1) / 2 - 2, r: 16 }
  ]
  marks.forEach(mark => {
    const y = groundHeight(mark.x, mark.z) + 1.5
    const plate = new Mesh(track(new CircleGeometry(mark.r, 48)), material({ color: 0x050a16 }, 0.5))
    plate.rotation.x = -Math.PI / 2
    plate.position.set(mark.x, y, mark.z)
    const ring = new Mesh(track(new RingGeometry(mark.r - 1.1, mark.r, 64)), material({ color: 0xffbf43, blending: AdditiveBlending }, 0.9))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(mark.x, y + 0.05, mark.z)
    const size = mark.r * 1.25
    const number = new Mesh(track(new PlaneGeometry(size, size)), material({ map: track(numberTexture(mark.label)) }, 1))
    number.rotation.x = -Math.PI / 2
    number.position.set(mark.x, y + 0.1, mark.z)
    group.add(plate, ring, number)
  })
  // closing logo ring (the emblem itself belongs to the final monument)
  const closing = new Mesh(track(new RingGeometry(FINAL.size * 0.62, FINAL.size * 0.66, 64)), material({ color: 0xffbf43, blending: AdditiveBlending }, 0.0))
  closing.visible = false
  group.add(closing)

  return {
    group,
    update(amount) {
      group.visible = amount > 0.01
      materials.forEach((m, i) => {
        m.opacity = base[i] * amount
      })
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
