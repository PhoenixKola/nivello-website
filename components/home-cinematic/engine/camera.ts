import { FINAL, MILESTONES, MONUMENT, PLAZA, groundHeight, routeX } from './layout'
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

/** Milestone camera stations: design owns 0-2, development owns 3-4. u is the global timeline. */
const stationU = (k: number) => (k < 3 ? 2 + (k + 0.5) / 3 : 3 + (k - 3 + 0.5) / 2)

const stageKeys: Spec[] = M.flatMap((m, k) => {
  const u = stationU(k)
  const out: Spec[] = [
    {
      u,
      at: [m.x - m.side * (m.r + (k === 3 ? 28 : 15)), m.z + (k === 3 ? 22 : 13)],
      h: k === 3 ? 12 : 9,
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
      u: (u + stationU(k + 1)) / 2,
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

export const FINAL_LOGO_Y = 30

const specs: Spec[] = [
  // 00 arrival: the mountain approach
  { u: 0, at: [4, 38], h: 12, look: [2, 20, -80], fov: 42, sx: 0.14 },
  { u: 0.28, at: [r(10), 12], h: 13, look: [r(-28), 14, -28], fov: 42, sx: 0.14, roll: 0.03 },
  { u: 0.55, at: [r(-14), -14], h: 14, look: [r(-52), 24, -52], fov: 42, sx: 0.13, roll: -0.03 },
  { u: 0.82, at: [r(-38), -38], h: 15, look: [r(-74), 38, -76], fov: 42, sx: 0.15, roll: 0.02 },
  // 01 logo: ridge crest, the mark reveals and holds
  { u: 1.2, at: [r(-58), -58], h: 14, look: [r(-96) + 6, 40, -104], fov: 40, sx: 0.16 },
  { u: 1.55, at: [r(-77), -77], h: 9, look: mono, fov: 38, sx: 0.2, hold: true },
  { u: 1.85, at: [r(-98), -98], h: 16, look: mono, fov: 40, sx: 0.2 },
  // 02-03 design and development stations
  { u: 1.97, at: [r(-140) - 8, -140], h: 20, look: [MONUMENT.x - 14, 14, MONUMENT.z - 20], fov: 40, sx: 0.15 },
  { u: 2.05, at: [r(-176) - 6, -176], h: 14, look: [M[0].x, 6, M[0].z], fov: 40, sx: 0.16 },
  ...stageKeys,
  // 04 projects: approach the dome door
  { u: 3.9, at: [r(-324) - 2, -324], h: 9, look: [0, 7, PLAZA.z], fov: 42, sx: 0.1 },
  { u: 4.12, at: [0, -338], h: 8, look: [0, 8, PLAZA.z - 22], fov: 42, sx: 0.12 },
  { u: 4.3, at: [0, -366], h: 6, look: [0, 8, PLAZA.z - 24], fov: 40, sx: 0.14 },
  { u: 4.85, at: [0, -392], h: 6, look: [r(-440), 8, -440], fov: 42, sx: 0.12 },
  // 05 reviews: the canyon (driven procedurally by reviewsWeight)
  { u: 5.0, at: [r(-412), -412], h: 6, look: [r(-450), 7, -450], fov: 42, sx: 0.1 },
  { u: 5.5, at: [r(-470), -470], h: 5.5, look: [r(-500), 7, -500], fov: 42, sx: 0.1 },
  { u: 5.95, at: [r(-533), -533], h: 6, look: [r(-570), 8, -580], fov: 42, sx: 0.1 },
  // 06 finale: the closing mark, then the overhead reveal
  { u: 6.05, at: [0, -503], h: 14, look: [FINAL.x, FINAL_LOGO_Y - 2, FINAL.z], fov: 42, sx: 0.16, hold: true },
  { u: 6.3, at: [-18, -516], h: 34, abs: true, look: [0, 22, -578], fov: 44, sx: 0.14 },
  { u: 6.6, at: [-6, -470], h: 150, abs: true, look: [0, 8, -545], fov: 46, sx: 0.08 },
  { u: 7.0, at: [0, -476], h: 330, abs: true, look: [0, 0, -507], fov: 50, sx: 0, hold: true }
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

export const galleryWeight = (u: number) => smoothstep(4.12, 4.32, u) * (1 - smoothstep(4.82, 4.96, u))
export const reviewsWeight = (u: number) => smoothstep(5.0, 5.18, u) * (1 - smoothstep(5.86, 5.97, u))
