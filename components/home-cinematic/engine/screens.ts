import { CanvasTexture, SRGBColorSpace } from 'three'
import { recordLabel, type SceneCopy } from './i18n'

/**
 * Canvas screens for the open-air scenes. Live ones repaint a complete frame at a modest rate (a single canvas upload
 * is atomic, so there is no tearing), only while their scene is on stage. All artwork is original and illustrative.
 *
 * Every word comes from the scene dictionary (i18n.ts) through a `CopyRef`, so a locale change repaints the same
 * textures in place instead of rebuilding the world. Language syntax, file names and brand names stay as they are.
 */
export type CopyRef = { copy: SceneCopy }

export type LiveScreen = {
  texture: CanvasTexture
  /** `state` is a scene value in 0..1 (or beat-dependent) that the painter may use. */
  update(time: number, state?: number): void
  /** Repaint now (after the locale changed). */
  invalidate(): void
  dispose(): void
}

const SANS = 'Inter, system-ui, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const W = 640
const H = 400

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw a label, shrinking the font if the translation is longer than the room it has. */
function say(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth?: number, weightSize?: string) {
  recordLabel(text)
  if (maxWidth && weightSize) {
    const match = /^(\d+) (\d+)px (.+)$/.exec(weightSize)
    if (match) {
      let size = Number(match[2])
      ctx.font = weightSize
      while (size > 9 && ctx.measureText(text).width > maxWidth) {
        size -= 1
        ctx.font = `${match[1]} ${size}px ${match[3]}`
      }
    }
  }
  ctx.fillText(text, x, y)
}

function live(paint: (ctx: CanvasRenderingContext2D, t: number, s: number) => void, fps = 10): LiveScreen {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  let last = -1
  let lastTime = 0
  let lastState = 0
  paint(ctx, 0, 0)
  texture.needsUpdate = true
  return {
    texture,
    update(time, state = 0) {
      lastTime = time
      lastState = state
      if (last >= 0 && time - last < 1 / fps) return
      last = time
      paint(ctx, time, state)
      texture.needsUpdate = true
    },
    invalidate() {
      paint(ctx, lastTime, lastState)
      texture.needsUpdate = true
    },
    dispose() {
      texture.dispose()
    }
  }
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3)

/* ── Planning: a client video call ───────────────────────────────────────── */

const TILE_STYLE = [
  { a: '#3a2a52', b: '#1d1a36', skin: '#e8c4a0' },
  { a: '#173a52', b: '#0e2036', skin: '#c99a76' },
  { a: '#4a3414', b: '#241a0c', skin: '#f0d2b4' },
  { a: '#1a4a46', b: '#0c2428', skin: '#b98660' }
]

export function callScreen(ref: CopyRef): LiveScreen {
  return live((ctx, t) => {
    const copy = ref.copy.call
    ctx.fillStyle = '#080e1b'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#101a2e'
    ctx.fillRect(0, 0, W, 38)
    ctx.fillStyle = '#34d399'
    ctx.beginPath()
    ctx.arc(22, 19, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#dbe7ff'
    ctx.font = `700 17px ${SANS}`
    say(ctx, copy.title, 38, 25, 380, `700 17px ${SANS}`)
    const sec = Math.floor(t) + 754
    const clock = `${String(Math.floor(sec / 60) % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
    ctx.fillStyle = 'rgba(200,218,250,0.75)'
    ctx.font = `600 15px ${MONO}`
    ctx.textAlign = 'right'
    ctx.fillText(clock, W - 18, 25)
    ctx.textAlign = 'left'

    const speaker = Math.floor(t / 3.4) % 4
    const gx = 16
    const gy = 50
    const tw = (W - 32 - 12) / 2
    const th = (H - 50 - 70 - 12) / 2
    TILE_STYLE.forEach((tile, i) => {
      const name = copy.participants[i]
      const x = gx + (i % 2) * (tw + 12)
      const y = gy + Math.floor(i / 2) * (th + 12)
      const g = ctx.createLinearGradient(x, y, x + tw, y + th)
      g.addColorStop(0, tile.a)
      g.addColorStop(1, tile.b)
      ctx.fillStyle = g
      rr(ctx, x, y, tw, th, 14)
      ctx.fill()
      const sway = Math.sin(t * 0.8 + i * 1.7) * 3
      const cx = x + tw / 2 + sway
      const cy = y + th * 0.52
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + th * 0.46, tw * 0.3, th * 0.3, 0, Math.PI, 0)
      ctx.fill()
      ctx.fillStyle = tile.skin
      ctx.beginPath()
      ctx.arc(cx, cy - 6, th * 0.19, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(20,16,30,0.78)'
      ctx.beginPath()
      ctx.arc(cx, cy - 12, th * 0.19, Math.PI * 1.02, Math.PI * 1.98)
      ctx.fill()
      const talking = i === speaker
      const mouth = talking ? 2 + Math.abs(Math.sin(t * 9 + i)) * 4 : 1.5
      ctx.fillStyle = 'rgba(60,20,24,0.8)'
      ctx.beginPath()
      ctx.ellipse(cx, cy + 6, 6, mouth, 0, 0, Math.PI * 2)
      ctx.fill()
      // name tag sized from the real text (the Italian roles are longer)
      ctx.font = `600 13px ${SANS}`
      const tagWidth = Math.min(tw - 20, ctx.measureText(name).width + 28)
      ctx.fillStyle = 'rgba(5,10,22,0.7)'
      rr(ctx, x + 10, y + th - 30, tagWidth, 22, 11)
      ctx.fill()
      ctx.fillStyle = '#e8f0ff'
      say(ctx, name, x + 22, y + th - 14, tagWidth - 24, `600 13px ${SANS}`)
      if (talking) {
        ctx.strokeStyle = '#ffbf43'
        ctx.lineWidth = 4
        rr(ctx, x + 2, y + 2, tw - 4, th - 4, 13)
        ctx.stroke()
        for (let b = 0; b < 4; b += 1) {
          const h = 6 + Math.abs(Math.sin(t * 7 + b * 1.3)) * 14
          ctx.fillStyle = '#ffbf43'
          ctx.fillRect(x + tw - 40 + b * 8, y + th - 16 - h, 5, h)
        }
      }
    })
    const by = H - 52
    const items = ['#2b3a5c', '#2b3a5c', '#2b3a5c', '#2b3a5c', '#d64545']
    items.forEach((color, i) => {
      const x = W / 2 - 112 + i * 56
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, by + 20, 19, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#eaf2ff'
      if (i === 0) rr(ctx, x - 4, by + 9, 8, 14, 4)
      if (i === 1) rr(ctx, x - 9, by + 12, 13, 16, 3)
      if (i === 2) rr(ctx, x - 10, by + 11, 20, 14, 3)
      if (i === 3) rr(ctx, x - 9, by + 10, 18, 14, 5)
      if (i === 4) rr(ctx, x - 10, by + 17, 20, 6, 3)
      ctx.fill()
    })
  })
}

/* ── Planning: the plan and design being made ────────────────────────────── */

const NODE_POS = [
  { x: 0.5, y: 0.2, parent: -1 },
  { x: 0.2, y: 0.5, parent: 0 },
  { x: 0.5, y: 0.5, parent: 0 },
  { x: 0.8, y: 0.5, parent: 0 },
  { x: 0.35, y: 0.82, parent: 2 },
  { x: 0.68, y: 0.82, parent: 2 }
]

export function planScreen(ref: CopyRef): LiveScreen {
  return live((ctx, t, s) => {
    const copy = ref.copy.plan
    ctx.fillStyle = '#0b1322'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#121d33'
    ctx.fillRect(0, 0, W, 34)
    ;['#e04b4b', '#ffbf43', '#34d399'].forEach((c, i) => {
      ctx.fillStyle = c
      ctx.beginPath()
      ctx.arc(18 + i * 18, 17, 5, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = '#dbe7ff'
    ctx.font = `700 15px ${SANS}`
    const version = 1 + Math.min(2, Math.floor(s * 2.99))
    say(ctx, copy.title(version), 84, 22, 360, `700 15px ${SANS}`)

    ctx.fillStyle = '#0f192d'
    ctx.fillRect(0, 34, 150, H - 34)
    ctx.fillStyle = '#ffbf43'
    ctx.font = `800 12px ${SANS}`
    say(ctx, copy.goalsHeading, 16, 62)
    copy.goals.forEach((goal, i) => {
      const on = easeOut(s * 3 - i * 0.35)
      ctx.globalAlpha = 0.25 + 0.75 * on
      ctx.fillStyle = 'rgba(21,155,255,0.18)'
      rr(ctx, 12, 74 + i * 42, 126, 32, 9)
      ctx.fill()
      ctx.fillStyle = '#34d399'
      ctx.beginPath()
      ctx.arc(28, 90 + i * 42, 6 * on, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#eaf2ff'
      ctx.font = `600 13px ${SANS}`
      say(ctx, goal, 42, 95 + i * 42, 90, `600 13px ${SANS}`)
      ctx.globalAlpha = 1
    })
    ctx.fillStyle = 'rgba(190,210,245,0.6)'
    ctx.font = `700 11px ${SANS}`
    say(ctx, copy.audienceHeading, 16, 236)
    copy.audience.forEach((a, i) => {
      ctx.fillStyle = 'rgba(255,191,67,0.16)'
      rr(ctx, 12, 246 + i * 34, 126, 26, 13)
      ctx.fill()
      ctx.fillStyle = '#ffe3a6'
      ctx.font = `600 12px ${SANS}`
      say(ctx, a, 24, 264 + i * 34, 104, `600 12px ${SANS}`)
    })

    const ax = 164
    const ay = 46
    const aw = W - ax - 14
    const ah = H - ay - 14
    ctx.fillStyle = '#e9eff9'
    rr(ctx, ax, ay, aw, ah, 12)
    ctx.fill()
    ctx.strokeStyle = 'rgba(40,80,150,0.1)'
    ctx.lineWidth = 1
    for (let x = ax; x < ax + aw; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, ay)
      ctx.lineTo(x, ay + ah)
      ctx.stroke()
    }
    for (let y = ay; y < ay + ah; y += 24) {
      ctx.beginPath()
      ctx.moveTo(ax, y)
      ctx.lineTo(ax + aw, y)
      ctx.stroke()
    }
    const pos = (n: { x: number; y: number }) => [ax + n.x * aw, ay + 28 + n.y * (ah - 72)] as const
    const reveal = (i: number) => easeOut((s * 1.15 - 0.12) * 6.5 - i * 0.85)
    NODE_POS.forEach((n, i) => {
      if (n.parent < 0) return
      const a = pos(NODE_POS[n.parent])
      const b = pos(n)
      const p = reveal(i)
      ctx.strokeStyle = '#159bff'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(a[0], a[1] + 16)
      ctx.lineTo(a[0] + (b[0] - a[0]) * p, a[1] + 16 + (b[1] - 16 - a[1]) * p)
      ctx.stroke()
    })
    NODE_POS.forEach((n, i) => {
      const p = i === 0 ? easeOut(s * 6 + 0.3) : reveal(i)
      if (p <= 0.01) return
      const [x, y] = pos(n)
      const w = 100 * p
      ctx.fillStyle = i === 0 ? '#ffbf43' : '#ffffff'
      rr(ctx, x - w / 2, y - 16, w, 32, 9)
      ctx.fill()
      ctx.strokeStyle = i === 0 ? '#b97d0c' : '#159bff'
      ctx.lineWidth = 2
      ctx.stroke()
      if (p > 0.7) {
        ctx.fillStyle = i === 0 ? '#2a1c04' : '#0d2a52'
        ctx.font = `700 13px ${SANS}`
        ctx.textAlign = 'center'
        say(ctx, copy.nodes[i], x, y + 5, 88, `700 13px ${SANS}`)
        ctx.textAlign = 'left'
      }
    })
    const notes = [
      { text: copy.notes[0], node: 3, c: '#ffe08a' },
      { text: copy.notes[1], node: 1, c: '#9fd8ff' }
    ]
    notes.forEach((note, i) => {
      const on = easeOut(s * 3 - 1.85 - i * 0.28)
      if (on <= 0.02) return
      const [x, y] = pos(NODE_POS[note.node])
      ctx.save()
      ctx.translate(x + 30, y - 34 - (1 - on) * 14)
      ctx.rotate(0.05 - i * 0.1)
      ctx.globalAlpha = on
      ctx.fillStyle = note.c
      rr(ctx, 0, 0, 124, 34, 6)
      ctx.fill()
      ctx.fillStyle = '#2a2008'
      ctx.font = `700 12px ${SANS}`
      say(ctx, note.text, 8, 21, 108, `700 12px ${SANS}`)
      ctx.restore()
    })
    const target = Math.min(NODE_POS.length - 1, Math.floor(s * 6.2))
    const [cx, cy] = pos(NODE_POS[target])
    const wob = Math.sin(t * 2.2) * 6
    ctx.fillStyle = '#0b1322'
    ctx.beginPath()
    ctx.moveTo(cx + 22 + wob, cy + 14)
    ctx.lineTo(cx + 22 + wob, cy + 38)
    ctx.lineTo(cx + 28 + wob, cy + 32)
    ctx.lineTo(cx + 36 + wob, cy + 34)
    ctx.closePath()
    ctx.fill()
  })
}

/* ── Design: a page coming together ─────────────────────────────────────── */

export type DesignLayer = { texture: CanvasTexture; repaint(): void; dispose(): void }

/** layer 0 = wireframe, 1 = layout blocks, 2 = finished visual design. Painted once; repainted when the locale changes. */
export function designLayer(kind: 0 | 1 | 2, ref: CopyRef): DesignLayer {
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 500
  const ctx = canvas.getContext('2d')!
  const w = canvas.width
  const h = canvas.height
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4

  const paint = () => {
    const copy = ref.copy.design
    ctx.clearRect(0, 0, w, h)
    ctx.textAlign = 'left'
    const line = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
    if (kind === 0) {
      ctx.strokeStyle = 'rgba(120,205,255,0.95)'
      ctx.lineWidth = 3
      rr(ctx, 6, 6, w - 12, h - 12, 18)
      ctx.stroke()
      line(6, 64, w - 6, 64)
      ctx.strokeRect(34, 22, 90, 22)
      ;[0, 1, 2, 3].forEach(i => ctx.strokeRect(w - 360 + i * 82, 26, 62, 14))
      ctx.strokeRect(46, 96, 380, 44)
      ctx.strokeRect(46, 158, 320, 18)
      ctx.strokeRect(46, 186, 270, 18)
      ctx.strokeRect(46, 232, 150, 44)
      ctx.beginPath()
      ctx.moveTo(w - 330, 96)
      ctx.lineTo(w - 46, 96)
      ctx.lineTo(w - 46, 280)
      ctx.lineTo(w - 330, 280)
      ctx.closePath()
      ctx.stroke()
      line(w - 330, 96, w - 46, 280)
      line(w - 46, 96, w - 330, 280)
      ;[0, 1, 2].forEach(i => {
        ctx.strokeRect(46 + i * 246, 320, 226, 150)
        line(46 + i * 246, 320, 46 + i * 246 + 226, 470)
        line(46 + i * 246 + 226, 320, 46 + i * 246, 470)
      })
    } else if (kind === 1) {
      ctx.fillStyle = 'rgba(30,64,120,0.92)'
      rr(ctx, 6, 6, w - 12, h - 12, 18)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.14)'
      ctx.fillRect(6, 6, w - 12, 58)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      rr(ctx, 34, 22, 90, 22, 6)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      rr(ctx, 46, 96, 380, 44, 8)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.45)'
      rr(ctx, 46, 158, 320, 18, 6)
      ctx.fill()
      rr(ctx, 46, 186, 270, 18, 6)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,191,67,0.9)'
      rr(ctx, 46, 232, 150, 44, 22)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.32)'
      rr(ctx, w - 330, 96, 284, 184, 14)
      ctx.fill()
      ;[0, 1, 2].forEach(i => {
        ctx.fillStyle = 'rgba(255,255,255,0.22)'
        rr(ctx, 46 + i * 246, 320, 226, 150, 12)
        ctx.fill()
      })
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h)
      g.addColorStop(0, '#f8fbff')
      g.addColorStop(1, '#e4edfb')
      ctx.fillStyle = g
      rr(ctx, 6, 6, w - 12, h - 12, 18)
      ctx.fill()
      ctx.fillStyle = '#0f1d38'
      ctx.fillRect(6, 6, w - 12, 58)
      ctx.fillStyle = '#ffbf43'
      rr(ctx, 34, 22, 90, 22, 8)
      ctx.fill()
      ctx.fillStyle = 'rgba(220,232,255,0.9)'
      ;[0, 1, 2, 3].forEach(i => rr(ctx, w - 360 + i * 82, 28, 62, 12, 6))
      ctx.fill()
      ctx.fillStyle = '#0f1d38'
      ctx.font = `800 40px ${SANS}`
      say(ctx, copy.heroLine1, 46, 124, 400, `800 40px ${SANS}`)
      ctx.fillStyle = '#159bff'
      ctx.font = `800 40px ${SANS}`
      say(ctx, copy.heroLine2, 46, 168, 400, `800 40px ${SANS}`)
      ctx.fillStyle = '#546a8c'
      ctx.font = `500 17px ${SANS}`
      say(ctx, copy.heroBody, 46, 204, 400, `500 17px ${SANS}`)
      ctx.fillStyle = '#ffbf43'
      rr(ctx, 46, 232, 150, 44, 22)
      ctx.fill()
      ctx.fillStyle = '#2a1c04'
      ctx.font = `800 16px ${SANS}`
      ctx.textAlign = 'center'
      say(ctx, copy.cta, 121, 260, 126, `800 16px ${SANS}`)
      ctx.textAlign = 'left'
      const hero = ctx.createLinearGradient(w - 330, 96, w - 46, 280)
      hero.addColorStop(0, '#159bff')
      hero.addColorStop(1, '#7c3aed')
      ctx.fillStyle = hero
      rr(ctx, w - 330, 96, 284, 184, 16)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.28)'
      ctx.beginPath()
      ctx.arc(w - 200, 188, 52, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffbf43'
      ctx.beginPath()
      ctx.arc(w - 120, 226, 24, 0, Math.PI * 2)
      ctx.fill()
      ;['#159bff', '#ffbf43', '#7c3aed'].forEach((c, i) => {
        ctx.fillStyle = '#ffffff'
        rr(ctx, 46 + i * 246, 320, 226, 150, 14)
        ctx.fill()
        ctx.fillStyle = c
        rr(ctx, 64 + i * 246, 338, 44, 44, 12)
        ctx.fill()
        ctx.fillStyle = '#0f1d38'
        ctx.font = `800 21px ${SANS}`
        say(ctx, copy.cards[i], 64 + i * 246, 414, 180, `800 21px ${SANS}`)
        ctx.fillStyle = '#9db0cf'
        rr(ctx, 64 + i * 246, 430, 150, 8, 4)
        ctx.fill()
        rr(ctx, 64 + i * 246, 446, 110, 8, 4)
        ctx.fill()
      })
    }
    texture.needsUpdate = true
  }
  paint()
  return {
    texture,
    repaint: paint,
    dispose() {
      texture.dispose()
    }
  }
}

/** The "Aa" type specimen plate (its caption is localized). */
export function specimenPlate(ref: CopyRef): DesignLayer {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const paint = () => {
    const g = ctx.createLinearGradient(0, 0, 256, 256)
    g.addColorStop(0, '#12213f')
    g.addColorStop(1, '#0a1428')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = '#ffbf43'
    ctx.font = '700 118px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('Aa', 128, 146)
    ctx.fillStyle = 'rgba(210,225,255,0.85)'
    say(ctx, ref.copy.design.specimen.caption, 128, 196, 220, '600 20px Inter, system-ui, sans-serif')
    ctx.fillStyle = 'rgba(120,200,255,0.7)'
    ctx.fillRect(48, 214, 160, 3)
    texture.needsUpdate = true
  }
  paint()
  return { texture, repaint: paint, dispose: () => texture.dispose() }
}

/* ── Development: different programs ────────────────────────────────────── */

const CODE = [
  ['kw:export ', 'kw:async function ', 'fn:getProjects', 'tx:() {'],
  ['tx:  ', 'kw:const ', 'tx:rows = ', 'kw:await ', 'tx:db.projects.', 'fn:list', 'tx:()'],
  ['tx:  ', 'kw:return ', 'tx:rows.', 'fn:map', 'tx:(toCard)'],
  ['tx:}'],
  ['tx:'],
  ['kw:export default function ', 'fn:Page', 'tx:() {'],
  ['tx:  ', 'kw:const ', 'tx:projects = ', 'fn:use', 'tx:(getProjects())'],
  ['tx:  ', 'kw:return ', 'tx:<', 'tg:Grid ', 'tx:items={projects} />'],
  ['tx:}'],
  ['tx:'],
  ['cm:{comment}'],
  ['kw:const ', 'fn:toCard ', 'tx:= (p) => ({'],
  ['tx:  slug: p.slug, title: p.title,'],
  ['tx:  accent: p.brandColor,'],
  ['tx:})']
]
const COLORS: Record<string, string> = { kw: '#7cc4ff', fn: '#ffd27a', tx: '#cfe0ff', tg: '#7ee0b5', cm: '#6c82ad' }

export type DevScreenKind = 'editor' | 'flow' | 'preview'

export function devScreen(kind: DevScreenKind, ref: CopyRef): LiveScreen {
  const bar = (ctx: CanvasRenderingContext2D, title: string, color: string) => {
    ctx.fillStyle = '#101a2e'
    ctx.fillRect(0, 0, W, 34)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(18, 17, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(205,222,252,0.8)'
    say(ctx, title, 34, 22, W - 60, `600 14px ${SANS}`)
  }
  if (kind === 'editor') {
    return live((ctx, t) => {
      const copy = ref.copy.dev
      ctx.fillStyle = '#070d1b'
      ctx.fillRect(0, 0, W, H)
      bar(ctx, copy.editorTitle, '#7cc4ff')
      ctx.fillStyle = '#0c1527'
      ctx.fillRect(0, 34, 44, H - 34)
      const lh = 26
      const total = CODE.length
      const scroll = (t * 14) % (lh * total)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 34, W, H - 34)
      ctx.clip()
      for (let rep = 0; rep < 3; rep += 1) {
        CODE.forEach((tokens, i) => {
          const y = 66 + (rep * total + i) * lh - scroll
          if (y < 30 || y > H + 20) return
          ctx.font = `600 15px ${MONO}`
          ctx.fillStyle = 'rgba(108,130,170,0.5)'
          ctx.fillText(String(i + 1).padStart(2, ' '), 10, y)
          let x = 58
          tokens.forEach(token => {
            const tag = token.slice(0, 2)
            const text = token.slice(3).replace('{comment}', copy.editorComment)
            ctx.fillStyle = COLORS[tag] ?? '#cfe0ff'
            if (tag === 'cm') recordLabel(text)
            ctx.fillText(text, x, y)
            x += ctx.measureText(text).width
          })
        })
      }
      ctx.restore()
      if (Math.floor(t * 2) % 2 === 0) {
        ctx.fillStyle = '#ffbf43'
        ctx.fillRect(58 + ((Math.floor(t * 3) * 9) % 220), 198, 2, 20)
      }
    })
  }
  if (kind === 'flow') {
    const links: [number, number][] = [[0, 1], [1, 2], [2, 3], [2, 4]]
    return live((ctx, t) => {
      const copy = ref.copy.dev
      const boxes = [
        { label: copy.flow.browser, x: 70, y: 200, c: '#159bff' },
        { label: copy.flow.edge, x: 220, y: 110, c: '#7c3aed' },
        { label: copy.flow.api, x: 370, y: 200, c: '#ffbf43' },
        { label: copy.flow.database, x: 520, y: 110, c: '#34d399' },
        { label: copy.flow.queue, x: 520, y: 290, c: '#f472b6' }
      ]
      ctx.fillStyle = '#080e1d'
      ctx.fillRect(0, 0, W, H)
      bar(ctx, copy.flowTitle, '#a78bfa')
      ctx.strokeStyle = 'rgba(120,200,255,0.07)'
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath()
        ctx.moveTo(x, 34)
        ctx.lineTo(x, H)
        ctx.stroke()
      }
      links.forEach(([a, b], i) => {
        const p = boxes[a]
        const q = boxes[b]
        ctx.strokeStyle = 'rgba(160,200,255,0.55)'
        ctx.setLineDash([8, 7])
        ctx.lineDashOffset = -t * 18
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(p.x + 40, p.y)
        ctx.lineTo(q.x - 40, q.y)
        ctx.stroke()
        ctx.setLineDash([])
        const f = (t * 0.4 + i * 0.27) % 1
        ctx.fillStyle = '#fff3c9'
        ctx.beginPath()
        ctx.arc(p.x + 40 + (q.x - 40 - p.x - 40) * f, p.y + (q.y - p.y) * f, 6, 0, Math.PI * 2)
        ctx.fill()
      })
      boxes.forEach(box => {
        ctx.fillStyle = '#0f1b34'
        rr(ctx, box.x - 52, box.y - 30, 104, 60, 12)
        ctx.fill()
        ctx.strokeStyle = box.c
        ctx.lineWidth = 3
        ctx.stroke()
        ctx.fillStyle = '#eaf2ff'
        ctx.textAlign = 'center'
        say(ctx, box.label, box.x, box.y + 5, 92, `700 15px ${SANS}`)
        ctx.textAlign = 'left'
      })
    })
  }
  if (kind === 'preview') {
    return live((ctx, t) => {
      const copy = ref.copy.dev
      ctx.fillStyle = '#e9eff8'
      ctx.fillRect(0, 0, W, H)
      bar(ctx, copy.previewTitle, '#e04b4b')
      const scroll = Math.max(0, Math.sin(t * 0.45) * 0.5 + 0.5) * 90
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 34, W, H - 34)
      ctx.clip()
      ctx.translate(0, -scroll)
      ctx.fillStyle = '#0f1d38'
      ctx.fillRect(0, 34, W, 44)
      ctx.fillStyle = '#ffbf43'
      rr(ctx, 22, 46, 70, 20, 7)
      ctx.fill()
      ctx.fillStyle = '#0f1d38'
      ctx.font = `800 26px ${SANS}`
      say(ctx, copy.previewHero[0], 40, 124, 340, `800 26px ${SANS}`)
      ctx.fillStyle = '#159bff'
      say(ctx, copy.previewHero[1], 40, 154, 340, `800 26px ${SANS}`)
      ctx.fillStyle = '#c8d4ea'
      rr(ctx, 40, 172, 330, 11, 5)
      ctx.fill()
      rr(ctx, 40, 192, 280, 11, 5)
      ctx.fill()
      for (let i = 0; i < 3; i += 1) {
        const hover = Math.floor(t / 1.8) % 3 === i
        ctx.fillStyle = hover ? '#ffe2a8' : '#ffffff'
        rr(ctx, 40 + i * 196, 232 - (hover ? 4 : 0), 178, 124, 12)
        ctx.fill()
        ctx.fillStyle = i === 1 ? '#159bff' : i === 2 ? '#7c3aed' : '#ffbf43'
        rr(ctx, 54 + i * 196, 246 - (hover ? 4 : 0), 40, 40, 10)
        ctx.fill()
        ctx.fillStyle = '#0f1d38'
        ctx.font = `800 18px ${SANS}`
        say(ctx, copy.previewCards[i], 54 + i * 196, 312 - (hover ? 4 : 0), 140, `800 18px ${SANS}`)
        ctx.fillStyle = '#c8d4ea'
        rr(ctx, 54 + i * 196, 324 - (hover ? 4 : 0), 130, 9, 4)
        ctx.fill()
      }
      ctx.restore()
    })
  }
  throw new Error(`Unknown screen kind: ${kind}`)
}

/** A slim role plaque for the back of a character: dark glass, a brass edge and a small light. */
export type Plaque = { texture: CanvasTexture; repaint(label: string): void; dispose(): void }

export function rolePlaque(accent = '#ffbf43'): Plaque {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  const repaint = (label: string) => {
    ctx.clearRect(0, 0, 512, 128)
    const g = ctx.createLinearGradient(0, 0, 0, 128)
    g.addColorStop(0, 'rgba(18,28,50,0.96)')
    g.addColorStop(1, 'rgba(8,14,28,0.96)')
    ctx.fillStyle = g
    rr(ctx, 6, 6, 500, 116, 58)
    ctx.fill()
    ctx.strokeStyle = 'rgba(224,186,96,0.9)'
    ctx.lineWidth = 3
    rr(ctx, 7, 7, 498, 114, 57)
    ctx.stroke()
    ctx.fillStyle = accent
    ctx.beginPath()
    ctx.arc(66, 64, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#f4f7ff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    say(ctx, label.toUpperCase(), 292, 66, 330, `700 50px ${SANS}`)
    texture.needsUpdate = true
  }
  repaint('')
  return { texture, repaint, dispose: () => texture.dispose() }
}
