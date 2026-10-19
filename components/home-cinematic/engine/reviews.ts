import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Raycaster,
  RingGeometry,
  SRGBColorSpace,
  Vector3
} from 'three'
import type { SceneCopy } from './i18n'
import { REVIEW_SPACING, TUNNEL, groundHeight } from './layout'
import { createSign } from './signs'
import { clamp } from './noise'
import { glowTexture } from './textures'

export type ReviewData = { slug: string; name: string; role: string; quote: string; color: string; title: string }

/** Logos for the review cards. `invert` flips a white logo so it reads on the light card. */
const LOGOS: Record<string, { src: string; invert?: boolean }> = {
  'rombo-nord': { src: '/client-logos/rombo-nord.webp' },
  'le-camelie': { src: '/client-logos/le-camelie.webp' },
  'gjergj-jozef-kola': { src: '/client-logos/gjergj-jozef-kola.png' },
  consteam: { src: '/client-logos/consteam.webp', invert: true },
  'your-assist-in-italy': { src: '/client-logos/your-assist-in-italy.svg' },
  progreen: { src: '/client-logos/progreen.webp' }
}

const FRAME_W = 5.2
const FRAME_H = 6.6
const EYE_Y = 4.9
// Paintings follow each other along both walls with only a narrow brass pier between them.
const PAIR_SPACING = REVIEW_SPACING
const FIRST_OFFSET = 12
const END_MARGIN = 14

/** Corridor geometry derived from the number of reviews: two per section, one on each wall, so more reviews just lengthen it. */
export function reviewLayout(count: number) {
  const pairs = Math.max(1, Math.ceil(count / 2))
  const length = FIRST_OFFSET + (pairs - 1) * PAIR_SPACING + END_MARGIN
  const zEnd = TUNNEL.z0 - length
  const frame = (k: number) => {
    const side = k % 2 ? 1 : -1
    return { side, x: side * (TUNNEL.halfWidth - 0.3), y: EYE_Y, z: TUNNEL.z0 - FIRST_OFFSET - Math.floor(k / 2) * PAIR_SPACING }
  }
  return { pairs, length, zEnd, frame }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

const CARD_W = 780
const CARD_H = 990

function paintCard(canvas: HTMLCanvasElement, review: ReviewData, accent: string, logo: HTMLImageElement | null) {
  const ctx = canvas.getContext('2d')!
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H)
  bg.addColorStop(0, '#1b2438')
  bg.addColorStop(1, '#0d1220')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, CARD_W, 14)

  // logo plate
  const boxX = 70
  const boxY = 70
  const boxW = CARD_W - 140
  const boxH = 230
  ctx.fillStyle = '#f7f1e3'
  plate(ctx, boxX, boxY, boxW, boxH, 26)
  ctx.fill()
  ctx.strokeStyle = 'rgba(217,178,94,0.9)'
  ctx.lineWidth = 4
  ctx.stroke()
  if (logo && logo.naturalWidth) {
    const scale = Math.min((boxW - 60) / logo.naturalWidth, (boxH - 50) / logo.naturalHeight)
    const w = logo.naturalWidth * scale
    const h = logo.naturalHeight * scale
    const x = boxX + (boxW - w) / 2
    const y = boxY + (boxH - h) / 2
    const info = LOGOS[review.slug]
    if (info?.invert) {
      const buffer = document.createElement('canvas')
      buffer.width = Math.max(1, Math.round(w))
      buffer.height = Math.max(1, Math.round(h))
      const bctx = buffer.getContext('2d')!
      bctx.drawImage(logo, 0, 0, buffer.width, buffer.height)
      const data = bctx.getImageData(0, 0, buffer.width, buffer.height)
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255 - data.data[i]
        data.data[i + 1] = 255 - data.data[i + 1]
        data.data[i + 2] = 255 - data.data[i + 2]
      }
      bctx.putImageData(data, 0, 0)
      ctx.drawImage(buffer, x, y, w, h)
    } else {
      ctx.drawImage(logo, x, y, w, h)
    }
  } else {
    ctx.fillStyle = '#2a3550'
    ctx.font = '800 54px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(review.title, CARD_W / 2, boxY + boxH / 2 + 18)
    ctx.textAlign = 'left'
  }

  // ornament (reviews carry no rating data, so no stars)
  ctx.strokeStyle = 'rgba(217,178,94,0.6)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(CARD_W / 2 - 150, 360)
  ctx.lineTo(CARD_W / 2 - 24, 360)
  ctx.moveTo(CARD_W / 2 + 24, 360)
  ctx.lineTo(CARD_W / 2 + 150, 360)
  ctx.stroke()
  ctx.fillStyle = '#d9b25e'
  ctx.beginPath()
  ctx.moveTo(CARD_W / 2, 342)
  ctx.lineTo(CARD_W / 2 + 14, 360)
  ctx.lineTo(CARD_W / 2, 378)
  ctx.lineTo(CARD_W / 2 - 14, 360)
  ctx.closePath()
  ctx.fill()

  // opening line
  ctx.fillStyle = '#f3e9d2'
  ctx.font = 'italic 46px Georgia, "Times New Roman", serif'
  const first = review.quote.split(/(?<=[.!?])\s/)[0]
  const preview = first.length > 120 ? `${first.slice(0, 114).replace(/\s+\S*$/, '').replace(/[ ,;]+$/, '')}…` : first
  wrap(ctx, `“${preview}”`, CARD_W - 130)
    .slice(0, 6)
    .forEach((line, i) => ctx.fillText(line, 66, 468 + i * 64))

  // who
  ctx.fillStyle = accent
  ctx.fillRect(66, CARD_H - 190, 72, 5)
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 42px Inter, system-ui, sans-serif'
  ctx.fillText(review.name, 66, CARD_H - 128)
  ctx.fillStyle = '#d9b25e'
  ctx.font = '600 27px Inter, system-ui, sans-serif'
  ctx.fillText(review.role.toUpperCase(), 66, CARD_H - 80, CARD_W - 240)

  // affordance: a ring with a plus, meaning "open this review"
  ctx.strokeStyle = '#d9b25e'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(CARD_W - 100, CARD_H - 112, 40, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(CARD_W - 120, CARD_H - 112)
  ctx.lineTo(CARD_W - 80, CARD_H - 112)
  ctx.moveTo(CARD_W - 100, CARD_H - 132)
  ctx.lineTo(CARD_W - 100, CARD_H - 92)
  ctx.stroke()
}

export type Reviews = {
  group: Group
  pick(raycaster: Raycaster): number
  hotspotAnchor(index: number, out: Vector3): void
  update(time: number, active: number, focusAmount: number, weight: number): void
  /** The corridor sign and every painting's text, repainted in place when the locale changes. */
  setLocale(copy: SceneCopy, reviews: ReviewData[]): void
  dispose(): void
}

/**
 * The review corridor: a warm museum gallery that starts right at the cylinder's exit bulkhead. Each section holds a
 * pair of framed paintings, one on each wall, and ends in a doorway of light that opens onto the climb.
 */
export function createReviews(initial: ReviewData[], copy: SceneCopy, low = false): Reviews {
  let reviews = initial
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }
  const layout = reviewLayout(reviews.length)
  const L = layout.length
  const zMid = TUNNEL.z0 - L / 2
  const baseY = groundHeight(0, zMid)
  const W2 = TUNNEL.halfWidth
  const H = TUNNEL.height

  // Warm, bright materials that read without environment reflections (phones have none).
  const plaster = track(new MeshStandardMaterial({ color: 0xe7ddc8, roughness: 0.75, metalness: 0.05, emissive: 0x6d5a3c, emissiveIntensity: 0.38 }))
  const wainscot = track(new MeshStandardMaterial({ color: 0x8a6a46, roughness: 0.55, metalness: 0.1, emissive: 0x2c1e0e, emissiveIntensity: 0.55 }))
  const floorMaterial = track(new MeshStandardMaterial({ color: 0x4a3f36, roughness: 0.38, metalness: 0.25, emissive: 0x2a2018, emissiveIntensity: 0.55, envMapIntensity: 0.7 }))
  const runner = track(new MeshStandardMaterial({ color: 0xc89a46, roughness: 0.5, metalness: 0.2, emissive: 0x6b4a14, emissiveIntensity: 0.55 }))
  const brass = track(new MeshStandardMaterial({ color: 0xd9b25e, metalness: 0.55, roughness: 0.32, emissive: 0x4a3410, emissiveIntensity: 0.7, envMapIntensity: 0.9 }))
  const ribMaterial = track(new MeshStandardMaterial({ color: 0xb59a68, roughness: 0.5, metalness: 0.3, emissive: 0x4a3a1c, emissiveIntensity: 0.5 }))
  const ceilingLight = track(new MeshBasicMaterial({ color: 0xfff1d6, toneMapped: false }))
  const ceilingMaterial = track(new MeshStandardMaterial({ color: 0xf0e8d6, roughness: 0.8, emissive: 0x8a7650, emissiveIntensity: 0.55 }))

  const add = (geometry: { dispose(): void }, material: MeshStandardMaterial | MeshBasicMaterial, x: number, y: number, z: number) => {
    const mesh = new Mesh(track(geometry) as never, material)
    mesh.position.set(x, baseY + y, z)
    group.add(mesh)
    return mesh
  }

  // Shell: floor, runner, walls, wainscot, ceiling.
  add(new BoxGeometry(W2 * 2 + 1.6, 0.5, L), floorMaterial, 0, 0.25, zMid)
  add(new BoxGeometry(5.2, 0.12, L - 1), runner, 0, 0.56, zMid)
  ;[-1, 1].forEach(side => {
    add(new BoxGeometry(0.7, H, L), plaster, side * (W2 + 0.35), H / 2, zMid)
    add(new BoxGeometry(0.28, 1.4, L), wainscot, side * (W2 - 0.1), 0.95, zMid)
    add(new BoxGeometry(0.24, 0.12, L), brass, side * (W2 - 0.12), 1.68, zMid)
  })
  add(new BoxGeometry(W2 * 2 + 1.6, 0.6, L), ceilingMaterial, 0, H + 0.3, zMid)

  // Slim brass piers sit between the paintings (never behind one), each with a warm light panel above and a sconce.
  const sconce = track(new BoxGeometry(0.3, 0.9, 0.2))
  const sconceLight = track(new MeshBasicMaterial({ color: 0xffe3b0, toneMapped: false }))
  for (let k = 0; k <= layout.pairs; k += 1) {
    const z = TUNNEL.z0 - FIRST_OFFSET + PAIR_SPACING / 2 - k * PAIR_SPACING
    if (z > TUNNEL.z0 - 0.5 || z < layout.zEnd + 0.5) continue
    add(new BoxGeometry(W2 * 2 + 1.4, 0.5, 0.6), ribMaterial, 0, H - 0.1, z)
    add(new BoxGeometry(2.6, 0.08, 0.6), ceilingLight, -3.4, H - 0.42, z)
    add(new BoxGeometry(2.6, 0.08, 0.6), ceilingLight, 3.4, H - 0.42, z)
    ;[-1, 1].forEach(side => {
      add(new BoxGeometry(0.5, H, 0.5), ribMaterial, side * (W2 + 0.02), H / 2, z)
      const lamp = new Mesh(sconce, sconceLight)
      lamp.position.set(side * (W2 - 0.35), baseY + 7.4, z)
      group.add(lamp)
    })
  }
  add(new BoxGeometry(2.4, 0.07, L - 2), ceilingLight, 0, H - 0.42, zMid)

  // The corridor sign, just inside the mouth, readable as the visitor walks in from the cylinder.
  const sign = createSign(6)
  track(sign)
  sign.repaint(copy.tunnel.sign)
  const signMesh = new Mesh(track(new PlaneGeometry(7.6, 7.6 / 6)), track(new MeshBasicMaterial({ map: sign.texture, transparent: true, toneMapped: false })))
  signMesh.position.set(0, baseY + H - 1.55, TUNNEL.z0 - 1.2)
  signMesh.rotation.y = 0
  group.add(signMesh)

  // Exit: a framed doorway of light at the far end, opening onto the climb.
  const exitZ = TUNNEL.z0 - L
  add(new BoxGeometry(0.9, H, 0.9), brass, -W2 + 0.2, H / 2, exitZ)
  add(new BoxGeometry(0.9, H, 0.9), brass, W2 - 0.2, H / 2, exitZ)
  add(new BoxGeometry(W2 * 2, 0.9, 0.9), brass, 0, H - 0.2, exitZ)
  const glow = track(glowTexture())
  add(new PlaneGeometry(W2 * 2 - 1, H - 1.2), track(new MeshBasicMaterial({ map: glow, color: 0xffe2b0, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.9 })), 0, H / 2, exitZ + 0.5)

  // Paintings.
  const outerGeometry = track(new BoxGeometry(FRAME_W + 0.95, FRAME_H + 0.95, 0.5))
  const matGeometry = track(new BoxGeometry(FRAME_W + 0.25, FRAME_H + 0.25, 0.4))
  const faceGeometry = track(new PlaneGeometry(FRAME_W, FRAME_H))
  const matMaterial = track(new MeshStandardMaterial({ color: 0xf6f0e3, roughness: 0.8, emissive: 0x6a5e48, emissiveIntensity: 0.45 }))
  const haloGeometry = track(new PlaneGeometry(FRAME_W * 2.3, FRAME_H * 1.8))
  const spotGeometry = track(new PlaneGeometry(FRAME_W * 1.7, 5.6))
  const lampGeometry = track(new BoxGeometry(FRAME_W * 0.55, 0.14, 0.42))
  const ringGeometry = track(new RingGeometry(0.34, 0.4, 40))
  const items = reviews.map((review, k) => {
    const accent = review.color
    const pose = layout.frame(k)
    const root = new Group()
    root.position.set(pose.x, baseY + pose.y + 0.4, pose.z)
    root.rotation.y = pose.side < 0 ? Math.PI / 2 : -Math.PI / 2
    group.add(root)
    const frame = new Mesh(outerGeometry, brass)
    frame.position.z = -0.1
    const mat = new Mesh(matGeometry, matMaterial)
    mat.position.z = 0.02
    const canvas = document.createElement('canvas')
    canvas.width = CARD_W
    canvas.height = CARD_H
    let logoImage: HTMLImageElement | null = null
    paintCard(canvas, review, accent, null)
    const texture = track(new CanvasTexture(canvas))
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 6
    const logoInfo = LOGOS[review.slug]
    if (logoInfo) {
      const image = new Image()
      image.onload = () => {
        logoImage = image
        paintCard(canvas, reviews[k], accent, image)
        texture.needsUpdate = true
      }
      image.src = logoInfo.src
    }
    const faceMaterial = track(new MeshBasicMaterial({ map: texture, toneMapped: false, color: 0xffffff }))
    const face = new Mesh(faceGeometry, faceMaterial)
    face.position.z = 0.27
    const lamp = new Mesh(lampGeometry, brass)
    lamp.position.set(0, FRAME_H / 2 + 0.95, 0.4)
    const spotMaterial = track(new MeshBasicMaterial({ map: glow, color: 0xfff0d0, transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }))
    const spot = new Mesh(spotGeometry, spotMaterial)
    spot.position.set(0, FRAME_H / 2 - 1.4, 0.45)
    const haloMaterial = track(new MeshBasicMaterial({ map: glow, color: 0xffe9bd, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }))
    const halo = new Mesh(haloGeometry, haloMaterial)
    halo.position.z = 0.55
    const ringMaterial = track(new MeshBasicMaterial({ color: 0xffbf43, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false }))
    const ring = new Mesh(ringGeometry, ringMaterial)
    ring.position.set(FRAME_W / 2 - 1.2, -FRAME_H / 2 + 1.4, 0.34)
    root.add(frame, mat, face, lamp, spot, halo, ring)
    return {
      root,
      face,
      faceMaterial,
      haloMaterial,
      spotMaterial,
      ringMaterial,
      ring,
      repaint: () => {
        paintCard(canvas, reviews[k], accent, logoImage)
        texture.needsUpdate = true
      }
    }
  })

  const light = new PointLight(0xfff0d8, 0, 34, 1.5)
  group.add(light)
  const warm = new Vector3()

  return {
    group,
    pick(raycaster) {
      const hit = raycaster.intersectObjects(items.map(item => item.face), false)[0]
      return hit ? items.findIndex(item => item.face === hit.object) : -1
    },
    hotspotAnchor(index, out) {
      const pose = layout.frame(index)
      out.set(pose.x - pose.side * 0.6, baseY + pose.y + 0.4 - FRAME_H / 2 + 1.1, pose.z)
    },
    setLocale(next, data) {
      sign.repaint(next.tunnel.sign)
      if (data.length === reviews.length) reviews = data
      items.forEach(item => item.repaint())
    },
    update(time, active, focusAmount, weight) {
      items.forEach((item, k) => {
        const selected = k === active ? 1 : 0
        // The open painting stays fully lit; the others recede only slightly so they remain readable.
        const emphasis = focusAmount > 0.01 ? (selected ? 1 : 1 - 0.28 * focusAmount) : 1
        item.faceMaterial.color.setScalar((0.72 + 0.28 * emphasis) * (0.5 + 0.5 * weight))
        item.haloMaterial.opacity = (0.05 + 0.2 * selected * focusAmount) * weight
        item.spotMaterial.opacity = 0.16 * weight * (0.7 + 0.3 * emphasis)
        const pulse = 1 + 0.18 * Math.sin(time * 2.4 + k)
        item.ring.scale.setScalar(pulse * (1 - 0.6 * focusAmount))
        item.ringMaterial.opacity = (0.85 - 0.5 * Math.sin(time * 2.4 + k) * 0.3) * (1 - focusAmount) * weight
      })
      const pose = layout.frame(clamp(Math.round(active), 0, items.length - 1))
      warm.set(-pose.side * 2, baseY + 6.5, pose.z + 4)
      light.position.copy(warm)
      light.intensity = low ? 0 : 160 * weight
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}



