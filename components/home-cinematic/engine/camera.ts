import { stageCenter } from '@/lib/cinematic/store'
import { MILESTONES, MONUMENT, PLAZA, groundHeight, routeX } from './layout'
import { clamp, smoothstep } from './noise'

/**
 * Directed camera: explicit keyframes on the global timeline u (chapter + local progress).
 * Each key carries a position, a look target, FOV, screen-space shift (to leave room for type) and bank.
 * Heights are authored as ground clearance so the camera always flies at the intended distance from the land.
 */
type Frame = {
  u: number
  px: number
  py: number
  pz: number
  lx: number
  ly: number
  lz: number
  fov: number
  sx: number
  roll: number
  hold: boolean
}

type Spec = {
  u: number
  at: [number, number] // x, z
  h: number // clearance above ground, or absolute when abs
  look: [number, number, number] // x, y (absolute), z
  fov?: number
  sx?: number
  roll?: number
  hold?: boolean
  abs?: boolean
}

const spec = (s: Spec): Frame => {
  const ground = groundHeight(s.at[0], s.at[1])
  return {
    u: s.u,
    px: s.at[0],
    py: s.abs ? s.h : ground + s.h,
    pz: s.at[1],
    lx: s.look[0],
    ly: s.look[1],
    lz: s.look[2],
    fov: s.fov ?? 40,
    sx: s.sx ?? 0.12,
    roll: s.roll ?? 0,
    hold: s.hold ?? false
  }
}

const r = routeX
const M = MILESTONES
const mono = [MONUMENT.x - 22, 27, MONUMENT.z] as [number, number, number]

const stageKeys: Spec[] = M.flatMap((m, k) => {
  const u = 1 + stageCenter(k)
  const out: Spec[] = [
    {
      u,
      at: [m.x - m.side * (m.r + 15), m.z + 13],
      h: 9,
      look: [m.x - m.side * 1.5, groundHeight(m.x, m.z) + 8, m.z],
      fov: 38,
      sx: 0.17,
      roll: -m.side * 0.03,
      hold: true
    }
  ]
  const next = M[k + 1]
  if (next) {
    const mid = (m.z + next.z) / 2
    out.push({
      u: u + (stageCenter(k + 1) - stageCenter(k)) / 2,
      at: [r(mid), mid + 8],
      h: 4.5,
      look: [r(mid - 26), groundHeight(r(mid - 26), mid - 26) + 9, mid - 26],
      fov: 46,
      sx: 0.1,
      roll: m.side * 0.05
    })
  }
  return out
})

const specs: Spec[] = [
  { u: 0, at: [4, 38], h: 12, look: [2, 20, -80], fov: 42, sx: 0.14 },
  { u: 0.17, at: [r(10), 12], h: 13, look: [r(-28), 14, -28], fov: 42, sx: 0.14, roll: 0.03 },
  { u: 0.37, at: [r(-14), -14], h: 14, look: [r(-52), 24, -52], fov: 42, sx: 0.13, roll: -0.03 },
  { u: 0.56, at: [r(-38), -38], h: 15, look: [r(-74), 38, -76], fov: 42, sx: 0.15, roll: 0.02 },
  { u: 0.71, at: [r(-58), -58], h: 14, look: [r(-96) + 6, 40, -104], fov: 40, sx: 0.16 },
  { u: 0.82, at: [r(-77), -77], h: 9, look: mono, fov: 38, sx: 0.2, hold: true },
  { u: 0.92, at: [r(-98), -98], h: 16, look: mono, fov: 40, sx: 0.2 },
  { u: 1.0, at: [r(-128) - 8, -128], h: 22, look: [MONUMENT.x - 14, 20, MONUMENT.z], fov: 40, sx: 0.15 },
  { u: 1.05, at: [r(-168) - 6, -166], h: 14, look: [M[0].x, 6, M[0].z], fov: 40, sx: 0.16 },
  ...stageKeys,
  { u: 2.0, at: [r(-324) - 2, -324], h: 9, look: [0, 7, -378], fov: 42, sx: 0.1 },
  { u: 2.12, at: [0, -332], h: 14, look: [0, 8, PLAZA.z - 22], fov: 42, sx: 0.16 },
  { u: 2.5, at: [0, -334], h: 10, look: [0, 8, PLAZA.z - 24], fov: 38, sx: 0.2, hold: true },
  { u: 2.9, at: [0, -366], h: 13, look: [0, 10, -430], fov: 40, sx: 0.12 },
  { u: 3.0, at: [r(-396), -396], h: 10, look: [0, 7, -452], fov: 42, sx: 0.08 },
  { u: 3.2, at: [r(-420) + 4, -420], h: 6.5, look: [0, 8, -510], fov: 42, sx: 0.1 },
  { u: 3.36, at: [r(-444), -444], h: 3.4, look: [-6, 9, -545], fov: 40, sx: 0.12, hold: true },
  { u: 3.7, at: [r(-462), -462], h: 3.8, look: [4, 9, -562], fov: 40, sx: 0.12, hold: true },
  { u: 4.0, at: [r(-488), -488], h: 7, look: [0, 12, -565], fov: 42, sx: 0.12 },
  { u: 4.25, at: [-16, -512], h: 26, abs: true, look: [0, 16, -430], fov: 42, sx: 0.12, roll: 0.07 },
  { u: 4.6, at: [-32, -452], h: 62, abs: true, look: [-18, 24, -250], fov: 44, sx: 0.12, roll: -0.04 },
  { u: 5.0, at: [-26, -404], h: 98, abs: true, look: [-22, 34, -190], fov: 48, sx: 0.12 },
  { u: 5.5, at: [-6, -372], h: 78, abs: true, look: [34, 0, -180], fov: 46, sx: 0.1 },
  { u: 6.0, at: [26, -352], h: 70, abs: true, look: [64, -10, -172], fov: 46, sx: 0.08, hold: true }
]

const frames = specs.map(spec).sort((a, b) => a.u - b.u)

export type Pose = { px: number; py: number; pz: number; lx: number; ly: number; lz: number; fov: number; sx: number; roll: number }

const FIELDS = ['px', 'py', 'pz', 'lx', 'ly', 'lz', 'fov', 'sx', 'roll'] as const

/** C1 Hermite through the keys; keys flagged `hold` have zero velocity so the camera settles on them. */
export function sampleCamera(u: number, out: Pose) {
  const uc = clamp(u, frames[0].u, frames[frames.length - 1].u)
  let i = 0
  while (i < frames.length - 2 && uc > frames[i + 1].u) i += 1
  const a = frames[i]
  const b = frames[i + 1]
  const p0 = frames[Math.max(0, i - 1)]
  const p3 = frames[Math.min(frames.length - 1, i + 2)]
  const dt = b.u - a.u
  const t = clamp((uc - a.u) / dt)
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  for (const field of FIELDS) {
    const ma = a.hold ? 0 : (b[field] - p0[field]) / Math.max(1e-4, b.u - p0.u)
    const mb = b.hold ? 0 : (p3[field] - a[field]) / Math.max(1e-4, p3.u - a.u)
    out[field] = h00 * a[field] + h10 * dt * ma + h01 * b[field] + h11 * dt * mb
  }
}

export const galleryWeight = (u: number) => smoothstep(2.1, 2.3, u) * (1 - smoothstep(2.8, 2.92, u))
