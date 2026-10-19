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

/** Logos for the review cards. `invert` flips a white logo so it reads on the light logo plate. */
const LOGOS: Record<string, { src: string; invert?: boolean }> = {
  'rombo-nord': { src: '/client-logos/rombo-nord.webp' },
  'le-camelie': { src: '/client-logos/le-camelie.webp' },
  'gjergj-jozef-kola': { src: '/client-logos/gjergj-jozef-kola.png' },
  consteam: { src: '/client-logos/consteam.webp', invert: true },
  'your-assist-in-italy': { src: '/client-logos/your-assist-in-italy.svg' },
  progreen: { src: '/client-logos/progreen.webp' }
}

// Each review is its own free-standing wall, one face turned toward the visitor, staggered left and right of the path.
// They stand close to the centre line, so a portrait phone sees every one of them straight ahead while walking.
const FRAME_W = 3.5
const FRAME_H = 4.44
const PANEL_W = 4.4
const PANEL_H = 7.2
const PANEL_X = 2.5
const TURN = 0.62
const EYE_Y = 4.5
const FIRST_OFFSET = 15
const END_MARGIN = 14

/** Corridor geometry derived from the number of reviews: one wall per review, so more reviews just lengthen it. */
export function reviewLayout(count: number) {
  const n = Math.max(1, count)
  const length = FIRST_OFFSET + (n - 1) * REVIEW_SPACING + END_MARGIN
  const zEnd = TUNNEL.z0 - length
  const frame = (k: number) => {
    const side = k % 2 ? 1 : -1
    // yaw turns the wall's face toward the path; (sin yaw, cos yaw) is its outward normal
    return { side, x: side * PANEL_X, y: EYE_Y, z: TUNNEL.z0 - FIRST_OFFSET - k * REVIEW_SPACING, yaw: -side * TURN }
  }
  return { stations: n, length, zEnd, frame }
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

function plate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * A review card: a deep slate card with the client's logo on a light plate (so every logo stays legible), the opening
 * line in warm ivory, who said it, and a clear "open" affordance. No ratings are shown (there is no rating data).
 */
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
 * The review corridor: a calm, warm gallery that starts right at the cylinder's exit portal. The long side walls are
 * continuous (no piers or dividers). Each review has its own free-standing wall, staggered left and right just off the
 * centre line and turned toward the visitor, so walking straight ahead shows them one after another.
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

  // Calm, mid-toned materials: warm plaster, dark timber, brass. Nothing here is near white, so the cards read clearly.
  const plaster = track(new MeshStandardMaterial({ color: 0xb9ab92, roughness: 0.78, metalness: 0.05, emissive: 0x4a3d2a, emissiveIntensity: 0.4 }))
  const wainscot = track(new MeshStandardMaterial({ color: 0x5a432c, roughness: 0.55, metalness: 0.1, emissive: 0x24180c, emissiveIntensity: 0.6 }))
  const floorMaterial = track(new MeshStandardMaterial({ color: 0x3a3029, roughness: 0.38, metalness: 0.25, emissive: 0x241a14, emissiveIntensity: 0.6, envMapIntensity: 0.7 }))
  const runner = track(new MeshStandardMaterial({ color: 0x9b7a3c, roughness: 0.5, metalness: 0.2, emissive: 0x4d3510, emissiveIntensity: 0.6 }))
  const brass = track(new MeshStandardMaterial({ color: 0xd9b25e, metalness: 0.55, roughness: 0.32, emissive: 0x4a3410, emissiveIntensity: 0.7, envMapIntensity: 0.9 }))
  const panelMaterial = track(new MeshStandardMaterial({ color: 0x2b2420, roughness: 0.6, metalness: 0.15, emissive: 0x16110d, emissiveIntensity: 0.7 }))
  const ceilingLight = track(new MeshBasicMaterial({ color: 0xe8cf9f, toneMapped: false }))
  const ceilingMaterial = track(new MeshStandardMaterial({ color: 0x8c7b60, roughness: 0.8, emissive: 0x3e3220, emissiveIntensity: 0.6 }))

  const add = (geometry: { dispose(): void }, material: MeshStandardMaterial | MeshBasicMaterial, x: number, y: number, z: number) => {
    const mesh = new Mesh(track(geometry) as never, material)
    mesh.position.set(x, baseY + y, z)
    group.add(mesh)
    return mesh
  }

  // Shell: floor, runner, continuous walls and cornice, ceiling. No ribs, no piers.
  add(new BoxGeometry(W2 * 2 + 1.6, 0.5, L), floorMaterial, 0, 0.25, zMid)
  add(new BoxGeometry(3.2, 0.12, L - 1), runner, 0, 0.56, zMid)
  ;[-1, 1].forEach(side => {
    add(new BoxGeometry(0.7, H, L), plaster, side * (W2 + 0.35), H / 2, zMid)
    add(new BoxGeometry(0.28, 1.4, L), wainscot, side * (W2 - 0.1), 0.95, zMid)
    add(new BoxGeometry(0.24, 0.12, L), brass, side * (W2 - 0.12), 1.68, zMid)
    add(new BoxGeometry(0.3, 0.2, L), brass, side * (W2 - 0.1), H - 0.5, zMid)
  })
  add(new BoxGeometry(W2 * 2 + 1.6, 0.6, L), ceilingMaterial, 0, H + 0.3, zMid)
  // continuous soft light strips overhead
  ;[-4.4, 0, 4.4].forEach(x => add(new BoxGeometry(x === 0 ? 1.6 : 1.1, 0.07, L - 2), ceilingLight, x, H - 0.42, zMid))

  // The corridor sign, just inside the mouth, readable as the visitor walks in from the cylinder.
  const sign = createSign(6)
  track(sign)
  sign.repaint(copy.tunnel.sign)
  const signMesh = new Mesh(track(new PlaneGeometry(7.6, 7.6 / 6)), track(new MeshBasicMaterial({ map: sign.texture, transparent: true, toneMapped: false })))
  signMesh.position.set(0, baseY + H - 1.55, TUNNEL.z0 - 1.2)
  group.add(signMesh)

  // Exit: a framed doorway of light at the far end, opening onto the climb.
  const exitZ = TUNNEL.z0 - L
  add(new BoxGeometry(0.9, H, 0.9), brass, -W2 + 0.2, H / 2, exitZ)
  add(new BoxGeometry(0.9, H, 0.9), brass, W2 - 0.2, H / 2, exitZ)
  add(new BoxGeometry(W2 * 2, 0.9, 0.9), brass, 0, H - 0.2, exitZ)
  const glow = track(glowTexture())
  add(new PlaneGeometry(W2 * 2 - 1, H - 1.2), track(new MeshBasicMaterial({ map: glow, color: 0xffd9a0, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.4 })), 0, H / 2, exitZ + 0.5)

  // Review walls.
  const slabGeometry = track(new BoxGeometry(PANEL_W, PANEL_H, 0.5))
  const edgeH = track(new BoxGeometry(PANEL_W + 0.1, 0.12, 0.62))
  const edgeV = track(new BoxGeometry(0.12, PANEL_H, 0.62))
  const outerGeometry = track(new BoxGeometry(FRAME_W + 0.55, FRAME_H + 0.55, 0.3))
  const faceGeometry = track(new PlaneGeometry(FRAME_W, FRAME_H))
  const haloGeometry = track(new PlaneGeometry(FRAME_W * 1.9, FRAME_H * 1.5))
  const lampGeometry = track(new BoxGeometry(FRAME_W * 0.6, 0.12, 0.34))
  const ringGeometry = track(new RingGeometry(0.28, 0.33, 40))
  const items = reviews.map((review, k) => {
    const accent = review.color
    const pose = layout.frame(k)
    const root = new Group()
    root.position.set(pose.x, baseY + PANEL_H / 2 + 0.5, pose.z)
    root.rotation.y = pose.yaw
    group.add(root)

    const slab = new Mesh(slabGeometry, panelMaterial)
    const top = new Mesh(edgeH, brass)
    top.position.set(0, PANEL_H / 2, 0.02)
    const bottom = new Mesh(edgeH, brass)
    bottom.position.set(0, -PANEL_H / 2, 0.02)
    const left = new Mesh(edgeV, brass)
    left.position.set(-PANEL_W / 2, 0, 0.02)
    const right = new Mesh(edgeV, brass)
    right.position.set(PANEL_W / 2, 0, 0.02)
    const frame = new Mesh(outerGeometry, brass)
    frame.position.set(0, 0.3, 0.33)

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
    face.position.set(0, 0.3, 0.5)
    const lamp = new Mesh(lampGeometry, brass)
    lamp.position.set(0, FRAME_H / 2 + 0.85, 0.5)
    const haloMaterial = track(new MeshBasicMaterial({ map: glow, color: 0xffe3b0, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }))
    const halo = new Mesh(haloGeometry, haloMaterial)
    halo.position.set(0, 0.3, 0.7)
    const ringMaterial = track(new MeshBasicMaterial({ color: 0xffbf43, transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false }))
    const ring = new Mesh(ringGeometry, ringMaterial)
    ring.position.set(FRAME_W / 2 - 0.95, -FRAME_H / 2 + 1.1, 0.53)
    root.add(slab, top, bottom, left, right, frame, face, lamp, ring)
    if (!low) root.add(halo)
    return {
      root,
      face,
      faceMaterial,
      haloMaterial,
      ringMaterial,
      ring,
      repaint: () => {
        paintCard(canvas, reviews[k], accent, logoImage)
        texture.needsUpdate = true
      }
    }
  })

  const light = new PointLight(0xffe9c8, 0, 30, 1.5)
  group.add(light)
  const warm = new Vector3()

  return {
    group,
    pick(raycaster) {
      const hit = raycaster.intersectObjects(items.map(item => item.face), false)[0]
      return hit ? items.findIndex(item => item.face === hit.object) : -1
    },
    hotspotAnchor(index, out) {
      // on the card itself, in its lower third, nudged toward the viewer
      const pose = layout.frame(index)
      const lift = -FRAME_H / 2 + 1.5
      out.set(pose.x + Math.sin(pose.yaw) * 0.6, baseY + PANEL_H / 2 + 0.5 + 0.3 + lift, pose.z + Math.cos(pose.yaw) * 0.6)
    },
    setLocale(next, data) {
      sign.repaint(next.tunnel.sign)
      if (data.length === reviews.length) reviews = data
      items.forEach(item => item.repaint())
    },
    update(time, active, focusAmount, weight) {
      items.forEach((item, k) => {
        const selected = k === active ? 1 : 0
        // The open card stays fully lit; the others recede only slightly so they remain readable.
        const emphasis = focusAmount > 0.01 ? (selected ? 1 : 1 - 0.3 * focusAmount) : 1
        item.faceMaterial.color.setScalar((0.82 + 0.18 * emphasis) * (0.55 + 0.45 * weight))
        item.haloMaterial.opacity = (0.03 + 0.1 * selected * focusAmount) * weight
        const pulse = 1 + 0.16 * Math.sin(time * 2.4 + k)
        item.ring.scale.setScalar(pulse * (1 - 0.6 * focusAmount))
        item.ringMaterial.opacity = (0.85 - 0.5 * Math.sin(time * 2.4 + k) * 0.3) * (1 - focusAmount) * weight
      })
      const pose = layout.frame(clamp(Math.round(active), 0, items.length - 1))
      warm.set(0, baseY + 6.5, pose.z + 5)
      light.position.copy(warm)
      light.intensity = low ? 0 : 110 * weight
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
