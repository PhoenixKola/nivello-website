import { CanvasTexture, SRGBColorSpace } from 'three'
import { recordLabel } from './i18n'

export type Sign = { texture: CanvasTexture; repaint(text: string): void; dispose(): void }

/** A brass-edged dark plaque with letter-spaced capitals, used for the signs on the cylinder and the corridor. */
export function createSign(aspect = 5): Sign {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = Math.round(1024 / aspect)
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const repaint = (text: string) => {
    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, '#1b2438')
    g.addColorStop(1, '#0b101d')
    ctx.fillStyle = g
    const r = h * 0.18
    ctx.beginPath()
    ctx.moveTo(r, 4)
    ctx.arcTo(w - 4, 4, w - 4, h - 4, r)
    ctx.arcTo(w - 4, h - 4, 4, h - 4, r)
    ctx.arcTo(4, h - 4, 4, 4, r)
    ctx.arcTo(4, 4, w - 4, 4, r)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#d9b25e'
    ctx.lineWidth = 6
    ctx.stroke()
    ctx.fillStyle = '#f3dba0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // shrink to fit, then space the letters out a little
    let size = Math.round(h * 0.46)
    const family = 'Inter, system-ui, sans-serif'
    const spaced = text.split('').join(' ')
    ctx.font = `700 ${size}px ${family}`
    while (size > 12 && ctx.measureText(spaced).width > w * 0.86) {
      size -= 2
      ctx.font = `700 ${size}px ${family}`
    }
    recordLabel(text)
    ctx.fillText(spaced, w / 2, h / 2 + 3)
    texture.needsUpdate = true
  }
  repaint('')
  return { texture, repaint, dispose: () => texture.dispose() }
}
