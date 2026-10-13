import {
  AdditiveBlending,
  BufferAttribute,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  Shape,
  SRGBColorSpace,
  Texture,
  Vector2
} from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { MONUMENT, groundHeight } from './layout'
import { ease, smoothstep } from './noise'
import { glowTexture, shaftTexture } from './textures'

/**
 * The landmark is the real Nivello mark: the 256px logo's alpha channel is traced into vector contours
 * (marching squares with sub-pixel interpolation), smoothed, and extruded with a bevel. Its colour comes
 * from the logo itself, dilated so extruded sides carry the gradient.
 */

type Point = [number, number]

function traceContours(alpha: Uint8Array, size: number, threshold = 128) {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= size || y >= size ? 0 : alpha[y * size + x])
  const hId = (x: number, y: number) => (y + 1) * (size + 3) + (x + 1)
  const vId = (x: number, y: number) => 1_000_000 + (y + 1) * (size + 3) + (x + 1)
  const pointOf = new Map<number, Point>()

  const hPoint = (x: number, y: number) => {
    const id = hId(x, y)
    if (!pointOf.has(id)) {
      const a = at(x, y)
      const b = at(x + 1, y)
      pointOf.set(id, [x + (threshold - a) / (b - a || 1), y])
    }
    return id
  }
  const vPoint = (x: number, y: number) => {
    const id = vId(x, y)
    if (!pointOf.has(id)) {
      const a = at(x, y)
      const b = at(x, y + 1)
      pointOf.set(id, [x, y + (threshold - a) / (b - a || 1)])
    }
    return id
  }

  const segments: [number, number][] = []
  for (let y = -1; y < size; y += 1) {
    for (let x = -1; x < size; x += 1) {
      const tl = at(x, y) >= threshold ? 1 : 0
      const tr = at(x + 1, y) >= threshold ? 1 : 0
      const br = at(x + 1, y + 1) >= threshold ? 1 : 0
      const bl = at(x, y + 1) >= threshold ? 1 : 0
      const code = tl * 8 + tr * 4 + br * 2 + bl
      if (code === 0 || code === 15) continue
      const top = () => hPoint(x, y)
      const bottom = () => hPoint(x, y + 1)
      const left = () => vPoint(x, y)
      const right = () => vPoint(x + 1, y)
      const center = (at(x, y) + at(x + 1, y) + at(x, y + 1) + at(x + 1, y + 1)) / 4 >= threshold
      switch (code) {
        case 1: case 14: segments.push([left(), bottom()]); break
        case 2: case 13: segments.push([bottom(), right()]); break
        case 3: case 12: segments.push([left(), right()]); break
        case 4: case 11: segments.push([top(), right()]); break
        case 6: case 9: segments.push([top(), bottom()]); break
        case 7: case 8: segments.push([top(), left()]); break
        case 5:
          if (center) segments.push([top(), left()], [bottom(), right()])
          else segments.push([top(), right()], [left(), bottom()])
          break
        case 10:
          if (center) segments.push([top(), right()], [left(), bottom()])
          else segments.push([top(), left()], [bottom(), right()])
          break
      }
    }
  }

  const incident = new Map<number, number[]>()
  segments.forEach(([a, b], index) => {
    ;(incident.get(a) ?? incident.set(a, []).get(a)!).push(index)
    ;(incident.get(b) ?? incident.set(b, []).get(b)!).push(index)
  })
  const used = new Uint8Array(segments.length)
  const loops: Point[][] = []
  for (let start = 0; start < segments.length; start += 1) {
    if (used[start]) continue
    const ids: number[] = []
    let seg = start
    let current = segments[start][0]
    while (!used[seg]) {
      used[seg] = 1
      const [a, b] = segments[seg]
      const next = a === current ? b : a
      ids.push(current)
      current = next
      const options = incident.get(current) ?? []
      const following = options.find(candidate => !used[candidate])
      if (following === undefined) break
      seg = following
    }
    if (ids.length > 8) loops.push(ids.map(id => pointOf.get(id)!))
  }
  return loops
}

function chaikin(points: Point[], rounds = 1) {
  let out = points
  for (let r = 0; r < rounds; r += 1) {
    const next: Point[] = []
    for (let i = 0; i < out.length; i += 1) {
      const a = out[i]
      const b = out[(i + 1) % out.length]
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    out = next
  }
  return out
}

function simplify(points: Point[], epsilon: number) {
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [s, e] = stack.pop()!
    let max = 0
    let index = -1
    const [ax, ay] = points[s]
    const [bx, by] = points[e]
    const len = Math.hypot(bx - ax, by - ay) || 1
    for (let i = s + 1; i < e; i += 1) {
      const d = Math.abs((by - ay) * points[i][0] - (bx - ax) * points[i][1] + bx * ay - by * ax) / len
      if (d > max) {
        max = d
        index = i
      }
    }
    if (max > epsilon && index > 0) {
      keep[index] = 1
      stack.push([s, index], [index, e])
    }
  }
  return points.filter((_, i) => keep[i])
}

const area = (loop: Point[]) => loop.reduce((sum, p, i) => {
  const q = loop[(i + 1) % loop.length]
  return sum + (p[0] * q[1] - q[0] * p[1])
}, 0) / 2

function contains(loop: Point[], [x, y]: Point) {
  let inside = false
  for (let i = 0, j = loop.length - 1; i < loop.length; j = i, i += 1) {
    const [xi, yi] = loop[i]
    const [xj, yj] = loop[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

export type Monument = {
  group: Group
  material: MeshPhysicalMaterial
  top: number
  update(u: number, time: number, finale: number, teaser?: number): void
  dispose(): void
}

export async function createMonument(): Promise<Monument> {
  const SIZE = 256
  const image = await loadImage('/nivello-icon.png')
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, SIZE, SIZE)
  const data = ctx.getImageData(0, 0, SIZE, SIZE)
  const alpha = new Uint8Array(SIZE * SIZE)
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = data.data[i * 4 + 3]
  const soft = new Float32Array(alpha)
  for (let pass = 0; pass < 2; pass += 1) {
    const prev = soft.slice()
    for (let y = 1; y < SIZE - 1; y += 1) {
      for (let x = 1; x < SIZE - 1; x += 1) {
        const i = y * SIZE + x
        soft[i] = (prev[i] * 4 + prev[i - 1] * 2 + prev[i + 1] * 2 + prev[i - SIZE] * 2 + prev[i + SIZE] * 2 + prev[i - SIZE - 1] + prev[i - SIZE + 1] + prev[i + SIZE - 1] + prev[i + SIZE + 1]) / 16
      }
    }
  }
  const smoothAlpha = new Uint8Array(soft)

  // Dilate colour into transparent texels so bevels and side walls keep the gradient.
  const rgb = new Uint8ClampedArray(data.data)
  const solid = new Uint8Array(alpha.map(a => (a > 200 ? 1 : 0)))
  for (let pass = 0; pass < 14; pass += 1) {
    const nextSolid = solid.slice()
    const nextRgb = rgb.slice()
    for (let y = 1; y < SIZE - 1; y += 1) {
      for (let x = 1; x < SIZE - 1; x += 1) {
        const i = y * SIZE + x
        if (solid[i]) continue
        let r = 0, g = 0, b = 0, n = 0
        for (const o of [-1, 1, -SIZE, SIZE]) {
          if (solid[i + o]) {
            r += rgb[(i + o) * 4]
            g += rgb[(i + o) * 4 + 1]
            b += rgb[(i + o) * 4 + 2]
            n += 1
          }
        }
        if (n) {
          nextRgb[i * 4] = r / n
          nextRgb[i * 4 + 1] = g / n
          nextRgb[i * 4 + 2] = b / n
          nextSolid[i] = 1
        }
      }
    }
    solid.set(nextSolid)
    rgb.set(nextRgb)
  }
  for (let i = 0; i < alpha.length; i += 1) rgb[i * 4 + 3] = 255
  ctx.putImageData(new ImageData(rgb, SIZE, SIZE), 0, 0)
  const colorMap: Texture = new CanvasTexture(canvas)
  colorMap.colorSpace = SRGBColorSpace
  colorMap.anisotropy = 4

  const loops = traceContours(smoothAlpha, SIZE).map(loop => simplify(chaikin(loop, 2), 0.08))
  const withMeta = loops.map((loop, index) => ({
    loop,
    area: Math.abs(area(loop)),
    depth: loops.filter((other, o) => o !== index && contains(other, loop[0])).length
  }))
  const outers = withMeta.filter(l => l.depth % 2 === 0)
  const holes = withMeta.filter(l => l.depth % 2 === 1)

  const scale = MONUMENT.size / SIZE
  const toVec = ([x, y]: Point) => [(x - SIZE / 2) * scale, -(y - SIZE / 2) * scale] as Point
  const shapes = outers.map(outer => {
    const shape = new Shape(outer.loop.map(toVec).map(([x, y]) => new Vector2(x, y)))
    holes
      .filter(hole => contains(outer.loop, hole.loop[0]))
      .forEach(hole => {
        const path = new Shape(hole.loop.map(toVec).map(([x, y]) => new Vector2(x, y)))
        shape.holes.push(path)
      })
    return shape
  })

  const depth = MONUMENT.size * 0.1
  const raw = new ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: MONUMENT.size * 0.022,
    bevelSize: MONUMENT.size * 0.012,
    bevelSegments: 7,
    curveSegments: 10
  })
  raw.translate(0, 0, -depth / 2)
  const geometry = raw
  const pos = geometry.attributes.position
  const nor = geometry.attributes.normal
  const uv = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i += 1) {
    let u = pos.getX(i) / MONUMENT.size + 0.5
    const v = pos.getY(i) / MONUMENT.size + 0.5
    if (nor.getZ(i) < -0.5) u = 1 - u
    uv[i * 2] = u
    uv[i * 2 + 1] = v
  }
  geometry.setAttribute('uv', new BufferAttribute(uv, 2))
  geometry.deleteAttribute('normal')
  const smoothGeometry = mergeVertices(geometry, 1e-3)
  smoothGeometry.computeVertexNormals()
  geometry.dispose()

  const material = new MeshPhysicalMaterial({
    map: colorMap,
    emissiveMap: colorMap,
    emissive: new Color(0xffffff),
    emissiveIntensity: 0.2,
    metalness: 0.22,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.55
  })
  const mark = new Mesh(smoothGeometry, material)

  const group = new Group()
  const baseY = groundHeight(MONUMENT.x, MONUMENT.z)
  const plinthHeight = 3.4
  const stone = new MeshStandardMaterial({ color: 0x1b2638, metalness: 0.7, roughness: 0.3, envMapIntensity: 1.2 })
  const plinthTop = new MeshStandardMaterial({ color: 0x0a101c, metalness: 0.9, roughness: 0.16, emissive: 0x0c2a55, emissiveIntensity: 0.6 })
  const steps = [
    new Mesh(new CylinderGeometry(MONUMENT.size * 0.36, MONUMENT.size * 0.42, 1.4, 8), stone),
    new Mesh(new CylinderGeometry(MONUMENT.size * 0.3, MONUMENT.size * 0.35, 1.2, 8), stone),
    new Mesh(new CylinderGeometry(MONUMENT.size * 0.22, MONUMENT.size * 0.26, 0.8, 8), plinthTop)
  ]
  let y = 0
  steps.forEach(step => {
    const h = (step.geometry as CylinderGeometry).parameters.height
    step.position.y = y + h / 2
    y += h
    group.add(step)
  })

  mark.position.y = plinthHeight + MONUMENT.size / 2 + 1.2
  group.add(mark)
  group.position.set(MONUMENT.x, baseY - 1.2, MONUMENT.z)
  group.rotation.y = -0.23

  // Ground halo + beam (beam is the finale's "light structure" seen from far away).
  const haloMaterial = new MeshBasicMaterial({ map: glowTexture(), color: 0xffbf43, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0.4 })
  const halo = new Mesh(new PlaneGeometry(MONUMENT.size * 2.4, MONUMENT.size * 2.4), haloMaterial)
  halo.rotation.x = -Math.PI / 2
  halo.position.y = 2.4
  group.add(halo)

  const ringMaterial = new MeshBasicMaterial({ color: 0x159bff, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0, side: DoubleSide })
  const ring = new Mesh(new RingGeometry(0.96, 1, 96), ringMaterial)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 2.6
  group.add(ring)

  const shaft = shaftTexture()
  const beamMaterial = new MeshBasicMaterial({ map: shaft, color: 0xffcf80, transparent: true, blending: AdditiveBlending, depthWrite: false, opacity: 0, side: DoubleSide })
  const beams = new Group()
  for (let i = 0; i < 2; i += 1) {
    const plane = new Mesh(new PlaneGeometry(MONUMENT.size * 0.9, 760), beamMaterial)
    plane.position.y = 380
    plane.rotation.y = (i * Math.PI) / 2
    beams.add(plane)
  }
  group.add(beams)

  const light = new PointLight(0x7fb8ff, 0, MONUMENT.size * 3.2, 1.6)
  light.position.set(0, plinthHeight + MONUMENT.size * 0.5, MONUMENT.size * 0.5)
  group.add(light)

  const goldLight = new PointLight(0xffbf43, 0, MONUMENT.size * 2.5, 1.8)
  goldLight.position.set(-MONUMENT.size * 0.3, plinthHeight + 2, MONUMENT.size * 0.3)
  group.add(goldLight)

  const glow = glowTexture()
  const disposables: { dispose(): void }[] = [smoothGeometry, material, colorMap, stone, plinthTop, haloMaterial, ringMaterial, beamMaterial, shaft, glow, ...steps.map(s => s.geometry), halo.geometry, ring.geometry]
  beams.children.forEach(child => disposables.push((child as Mesh).geometry))

  return {
    group,
    material,
    top: baseY + plinthHeight + MONUMENT.size,
    update(u, time, finale, teaser = 0) {
      const emerge = ease.inOut(smoothstep(0.35, 0.86, u))
      const settle = ease.out(smoothstep(0.2, 1.0, u))
      mark.position.y = plinthHeight + MONUMENT.size / 2 + 1.2 - (1 - emerge) * 10
      mark.rotation.y = Math.sin(time * 0.2) * 0.03 + (1 - settle) * 0.25
      const pulse = 0.88 + 0.12 * Math.sin(time * 1.6)
      material.emissiveIntensity = (0.16 + 0.7 * emerge) * pulse + finale * 0.25
      haloMaterial.opacity = 0.06 + 0.14 * emerge + finale * 0.12
      light.intensity = (40 + 900 * emerge) * (1 + finale * 0.4)
      goldLight.intensity = (30 + 650 * emerge) * (1 + finale * 0.4)
      const beam = Math.max(0.3 - 0.18 * emerge + teaser, finale)
      beamMaterial.opacity = Math.min(0.6, beam * 0.5)
      beams.scale.x = beams.scale.z = 0.6 + beam * 1.6
      beams.rotation.y = time * 0.05
      const pulseT = (time * 0.28) % 1
      ring.scale.setScalar(MONUMENT.size * (0.55 + pulseT * 2.6))
      ringMaterial.opacity = finale * (1 - pulseT) * 0.7
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
