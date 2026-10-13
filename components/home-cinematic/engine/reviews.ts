import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace
} from 'three'
import { groundHeight, routeX } from './layout'
import { clamp } from './noise'
import { glowTexture } from './textures'

export type ReviewData = { name: string; role: string; quote: string; color: string }

const PANEL_W = 7.4
const PANEL_H = 10.6
export const reviewZ = (k: number) => -456 - 16 * k
export const reviewSide = (k: number) => (k % 2 ? 1 : -1)
export const reviewPos = (k: number) => {
  const z = reviewZ(k)
  return { x: routeX(z) + reviewSide(k) * 12.5, z }
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

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 ? r * 0.42 : r
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
  }
  ctx.closePath()
  ctx.fill()
}

/** One testimonial monolith face: monogram avatar, stars, quote, attribution. */
function panelTexture(review: ReviewData, color: Color) {
  const W = 512
  const H = Math.round((W * PANEL_H) / PANEL_W)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const accent = `#${color.getHexString()}`
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#0e1930')
  bg.addColorStop(1, '#070d1c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, W, 8)
  ctx.strokeStyle = 'rgba(160,190,235,0.18)'
  ctx.lineWidth = 2
  ctx.strokeRect(14, 14, W - 28, H - 28)

  ctx.beginPath()
  ctx.arc(86, 100, 46, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.globalAlpha = 0.22
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.lineWidth = 3
  ctx.strokeStyle = accent
  ctx.stroke()
  ctx.fillStyle = '#f4f7fd'
  ctx.font = '600 50px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(review.name.replace(/^(The|I)\s/i, '').charAt(0).toUpperCase(), 86, 104)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#ffbf43'
  for (let i = 0; i < 5; i += 1) star(ctx, 168 + i * 34, 82, 14)
  ctx.fillStyle = '#e8eefb'
  ctx.font = '700 28px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(review.name, 160, 132)

  ctx.fillStyle = accent
  ctx.font = '700 120px Georgia, serif'
  ctx.globalAlpha = 0.5
  ctx.fillText('“', 36, 270)
  ctx.globalAlpha = 1
  ctx.fillStyle = '#f1f5fd'
  ctx.font = 'italic 34px Georgia, serif'
  const lines = wrap(ctx, review.quote, W - 90)
  const shown = lines.slice(0, 9)
  if (lines.length > 9) shown[8] = `${shown[8].replace(/[ ,.;]+$/, '')}…`
  shown.forEach((line, i) => ctx.fillText(line, 46, 318 + i * 46))

  ctx.fillStyle = 'rgba(190,205,235,0.75)'
  ctx.font = '600 22px Inter, system-ui, sans-serif'
  ctx.fillText(review.role.toUpperCase(), 46, H - 52)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

export type Reviews = {
  group: Group
  update(time: number, focus: number, weight: number): void
  dispose(): void
}

/** Testimonial monoliths line both walls of the canyon; the active one rises toward the route and lights up. */
export function createReviews(reviews: ReviewData[]): Reviews {
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }
  const glow = track(glowTexture())
  const frameGeometry = track(new BoxGeometry(PANEL_W + 0.8, PANEL_H + 0.8, 0.9))
  const panelGeometry = track(new PlaneGeometry(PANEL_W, PANEL_H))
  const haloGeometry = track(new PlaneGeometry(PANEL_W * 2.4, PANEL_H * 1.9))
  const baseGeometry = track(new BoxGeometry(2.6, 3, 2.2))
  const stripGeometry = track(new BoxGeometry(PANEL_W + 0.9, 0.18, 0.2))
  const frameMaterial = track(new MeshStandardMaterial({ color: 0x0b1424, metalness: 0.9, roughness: 0.28, envMapIntensity: 1.2 }))

  const items = reviews.map((review, k) => {
    const color = new Color(review.color)
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)
    if (hsl.l < 0.4) color.setHSL(hsl.h, Math.max(hsl.s, 0.4), 0.58)
    const { x, z } = reviewPos(k)
    const side = reviewSide(k)
    const root = new Group()
    root.position.set(x, groundHeight(x, z), z)
    root.rotation.y = -side * 0.45
    group.add(root)

    const plinth = new Mesh(baseGeometry, frameMaterial)
    plinth.position.y = 1.5
    const body = new Group()
    body.position.y = 3 + PANEL_H / 2 + 0.4
    const frame = new Mesh(frameGeometry, frameMaterial)
    const faceMaterial = track(new MeshBasicMaterial({ map: track(panelTexture(review, color)), toneMapped: false, color: 0x777777 }))
    const face = new Mesh(panelGeometry, faceMaterial)
    face.position.z = 0.47
    const edge = track(new MeshBasicMaterial({ color, toneMapped: false }))
    const strip = new Mesh(stripGeometry, edge)
    strip.position.set(0, -(PANEL_H / 2 + 0.5), 0.5)
    const haloMaterial = track(new MeshBasicMaterial({ map: glow, color, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }))
    const halo = new Mesh(haloGeometry, haloMaterial)
    halo.position.z = -0.8
    body.add(frame, face, strip, halo)
    root.add(plinth, body)
    return { root, body, faceMaterial, haloMaterial, color }
  })

  const light = new PointLight(0xffffff, 0, 46, 1.6)
  group.add(light)
  const white = new Color(0xffffff)

  return {
    group,
    update(time, focus, weight) {
      items.forEach((item, k) => {
        const e = clamp(1 - Math.abs(focus - k) * 0.9)
        const lift = e * e * (3 - 2 * e)
        item.faceMaterial.color.setScalar((0.5 + 0.4 * lift) * (0.4 + 0.6 * weight))
        item.haloMaterial.opacity = 0.05 + 0.2 * lift
        item.body.position.y = 3 + PANEL_H / 2 + 0.4 + Math.sin(time * 0.6 + k) * 0.08
      })
      const active = clamp(Math.round(focus), 0, items.length - 1)
      const p = reviewPos(active)
      light.color.copy(items[active].color).lerp(white, 0.3)
      light.position.set(p.x - reviewSide(active) * 7, groundHeight(p.x, p.z) + 9, p.z + 9)
      light.intensity = 420 * weight
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
