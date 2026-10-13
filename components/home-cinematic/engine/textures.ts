import { CanvasTexture, ClampToEdgeWrapping, LinearMipmapLinearFilter, RepeatWrapping, SRGBColorSpace } from 'three'
import { fbm, mulberry32 } from './noise'

/** Original procedural surface art (no third-party assets): weathered stone, lit facades, blueprint sheets and light sprites. */

const make = (w: number, h: number) => {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d')! }
}

const finish = (canvas: HTMLCanvasElement, repeat = true, srgb = true) => {
  const texture = new CanvasTexture(canvas)
  if (srgb) texture.colorSpace = SRGBColorSpace
  texture.wrapS = repeat ? RepeatWrapping : ClampToEdgeWrapping
  texture.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.anisotropy = 4
  return texture
}

/** Panelled, weathered stone. Light enough to catch coloured light, dark enough to stay moody. */
export function stoneTexture(seed = 3, tint: [number, number, number] = [120, 138, 160]) {
  const size = 512
  const { canvas, ctx } = make(size, size)
  const image = ctx.createImageData(size, size)
  const rand = mulberry32(seed)
  const offset = rand() * 50
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const n = fbm((x / size) * 6 + offset, (y / size) * 6 + offset, 5) * 0.5 + 0.5
      const grain = (rand() - 0.5) * 0.12
      const streak = fbm((x / size) * 2 + offset, (y / size) * 22 + offset, 3) * 0.12
      const v = 0.52 + (n - 0.5) * 0.7 + grain + streak
      const i = (y * size + x) * 4
      image.data[i] = tint[0] * v
      image.data[i + 1] = tint[1] * v
      image.data[i + 2] = tint[2] * v
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  // panel seams
  ctx.strokeStyle = 'rgba(8,14,24,0.55)'
  ctx.lineWidth = 3
  for (let i = 0; i <= 4; i += 1) {
    ctx.beginPath()
    ctx.moveTo(0, (i * size) / 4)
    ctx.lineTo(size, (i * size) / 4)
    ctx.stroke()
  }
  for (let row = 0; row < 4; row += 1) {
    for (let k = 0; k <= 2; k += 1) {
      const x = ((k + (row % 2) * 0.5) * size) / 2
      ctx.beginPath()
      ctx.moveTo(x, (row * size) / 4)
      ctx.lineTo(x, ((row + 1) * size) / 4)
      ctx.stroke()
    }
  }
  const stain = ctx.createLinearGradient(0, 0, 0, size)
  stain.addColorStop(0, 'rgba(0,0,0,0)')
  stain.addColorStop(1, 'rgba(4,8,16,0.35)')
  ctx.fillStyle = stain
  ctx.fillRect(0, 0, size, size)
  return finish(canvas)
}

/** A tower facade: dark glass bays with a scatter of warm and cool lit windows. Returns the albedo and the matching emissive map. */
export function facadeTextures(seed = 11) {
  const w = 256
  const h = 512
  const albedo = make(w, h)
  const glow = make(w, h)
  const rand = mulberry32(seed)
  albedo.ctx.fillStyle = '#0d1624'
  albedo.ctx.fillRect(0, 0, w, h)
  glow.ctx.fillStyle = '#000'
  glow.ctx.fillRect(0, 0, w, h)
  const cols = 8
  const rows = 22
  const cw = w / cols
  const ch = h / rows
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = c * cw + 3
      const y = r * ch + 3
      albedo.ctx.fillStyle = '#17263d'
      albedo.ctx.fillRect(x, y, cw - 6, ch - 6)
      const roll = rand()
      if (roll < 0.34) {
        const warm = rand() < 0.62
        const colour = warm ? '#ffbf43' : '#6cc6ff'
        const alpha = 0.55 + rand() * 0.45
        glow.ctx.globalAlpha = alpha
        glow.ctx.fillStyle = colour
        glow.ctx.fillRect(x, y, cw - 6, ch - 6)
        glow.ctx.globalAlpha = 1
        albedo.ctx.fillStyle = warm ? '#6b5a30' : '#2c5a78'
        albedo.ctx.fillRect(x, y, cw - 6, ch - 6)
      }
    }
  }
  albedo.ctx.fillStyle = 'rgba(160,190,230,0.10)'
  for (let c = 0; c <= cols; c += 1) albedo.ctx.fillRect(c * cw - 1, 0, 2, h)
  return { map: finish(albedo.canvas), emissive: finish(glow.canvas) }
}

/** Architectural drawing: grid, plan outline, dimension ticks. Used as an emissive sheet in the Scope stage. */
export function blueprintTexture() {
  const size = 1024
  const { canvas, ctx } = make(size, size)
  ctx.fillStyle = '#04122a'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(21,155,255,0.35)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(120,200,255,0.75)'
  ctx.lineWidth = 2
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(255,191,67,0.95)'
  ctx.lineWidth = 4
  const rooms: [number, number, number, number][] = [
    [128, 160, 420, 300],
    [548, 160, 340, 190],
    [548, 350, 340, 250],
    [128, 460, 420, 300],
    [128, 760, 760, 120]
  ]
  rooms.forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h))
  ctx.lineWidth = 2
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath()
  ctx.arc(338, 310, 70, 0, Math.PI / 2)
  ctx.moveTo(718, 350)
  ctx.arc(718, 350, 56, Math.PI / 2, Math.PI)
  ctx.stroke()
  return finish(canvas, false)
}

export function glowTexture(stops: [number, string][] = [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]) {
  const { canvas, ctx } = make(128, 128)
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  stops.forEach(([at, colour]) => gradient.addColorStop(at, colour))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  return finish(canvas, false)
}

/** Vertical light shaft: soft sides, long fade, faint dust streaks. */
export function shaftTexture() {
  const w = 128
  const h = 512
  const { canvas, ctx } = make(w, h)
  const image = ctx.createImageData(w, h)
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const fx = x / (w - 1) - 0.5
      const side = Math.pow(Math.max(0, 1 - Math.abs(fx) * 2), 1.6)
      const along = Math.pow(1 - y / h, 0.8)
      const streak = 0.7 + 0.3 * fbm(x * 0.11, y * 0.012, 3)
      const a = side * along * streak
      const i = (y * w + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
      image.data[i + 3] = Math.min(255, a * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  return finish(canvas, false)
}

/** Soft cloud/mist card. */
export function mistTexture(seed = 5) {
  const size = 256
  const { canvas, ctx } = make(size, size)
  const image = ctx.createImageData(size, size)
  const offset = seed * 7.3
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x / size - 0.5
      const dy = y / size - 0.5
      const edge = Math.max(0, 1 - Math.hypot(dx * 2, dy * 2.4))
      const n = fbm((x / size) * 3 + offset, (y / size) * 3 + offset, 5) * 0.5 + 0.5
      const a = Math.pow(edge, 1.2) * Math.pow(n, 1.4)
      const i = (y * size + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
      image.data[i + 3] = Math.min(255, a * 300)
    }
  }
  ctx.putImageData(image, 0, 0)
  return finish(canvas, false)
}

/** Brushed dark metal for frames. */
export function metalTexture() {
  const { canvas, ctx } = make(256, 256)
  const image = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const v = 0.45 + 0.25 * fbm(x * 0.02, y * 0.9, 3) + (Math.sin(x * 0.7) * 0.03)
      const i = (y * 256 + x) * 4
      image.data[i] = 70 * v * 1.6
      image.data[i + 1] = 84 * v * 1.6
      image.data[i + 2] = 104 * v * 1.6
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return finish(canvas)
}
