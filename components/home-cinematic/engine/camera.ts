import { FINAL, PLAZA, STATIONS, SUMMIT, TUNNEL, groundHeight, routeX } from './layout'
import { clamp, smoothstep } from './noise'

/**
 * Directed camera: explicit keyframes on the global timeline u (chapter + local progress).
 * Each key carries a position, a look target, FOV, screen-space shift (to leave room for type) and bank.
 * Heights are authored as ground clearance so the camera always flies at the intended distance from the land.
 *
 * The journey is a rail: `hold` keys settle the camera so each beat reads as a stop, and the keys between them slide
 * the camera off the road to inspect a scene and back onto it. The stop positions (the same u values) live in
 * chapters.ts, where the scroll guide snaps to them.
 */
type Frame = { u: number; px: number; py: number; pz: number; lx: number; ly: number; lz: number; fov: number; sx: number; roll: number; hold: boolean }

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

export type Pose = { px: number; py: number; pz: number; lx: number; ly: number; lz: number; fov: number; sx: number; roll: number }

const FIELDS = ['px', 'py', 'pz', 'lx', 'ly', 'lz', 'fov', 'sx', 'roll'] as const

const toFrame = (s: Spec): Frame => {
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
    sx: s.sx ?? 0.1,
    roll: s.roll ?? 0,
    hold: s.hold ?? false
  }
}

export const FINAL_LOGO_Y = 34

/** Builds the keyed camera track. Call after configureWorld, because the finale depends on the number of reviews. */
export function createCameraTrack() {
  /** Arrival keys follow the winding road: a point on it at z, with a look target further down it. */
  const road = (u: number, z: number, h: number, ahead: number, lookY: number, bias = 0, extra: Partial<Spec> = {}): Spec => ({
    u,
    at: [routeX(z), z],
    h,
    look: [routeX(z - ahead) + bias, lookY, z - ahead],
    ...extra
  })

  const P = STATIONS.planning
  const D = STATIONS.design
  const V = STATIONS.dev
  const B = STATIONS.building
  const logo: [number, number, number] = [40, 30, -176]
  const summitY = SUMMIT.height * 0.98
  const finalBase = groundHeight(FINAL.x, FINAL.z)
  const z1 = TUNNEL.z1

  const specs: Spec[] = [
    // 00 arrival: down the winding valley; the mark glints over the pass on the right
    road(0, 46, 12, 70, 20, 0, { fov: 42 }),
    road(0.35, 14, 12.5, 66, 20, 3, { fov: 42 }),
    road(0.65, -24, 13, 70, 24, 7, { fov: 42 }),
    road(0.9, -64, 14, 80, 30, 14, { fov: 41 }),
    // 01 identity: the mark stands beside the road; the road stays in frame
    { u: 1.2, at: [-4, -108], h: 14, look: [24, 30, -176], fov: 40 },
    { u: 1.55, at: [-6, -140], h: 13, look: logo, fov: 38, sx: 0.12, hold: true },
    { u: 1.85, at: [-2, -168], h: 16, look: [28, 24, -204], fov: 40 },
    // 02 planning: the camera slides off the road to the pad on the right, holds, and returns
    { u: 2.0, at: [0, -178], h: 16, look: [30, 10, -236], fov: 42 },
    { u: 2.17, at: [P.x - 22, P.z + 21], h: 8.5, look: [P.x - 2, 8.5, P.z], fov: 42, sx: 0.12, hold: true },
    { u: 2.5, at: [P.x - 19, P.z + 17], h: 8.5, look: [P.x + 1, 9, P.z - 1], fov: 41, sx: 0.12, hold: true },
    { u: 2.83, at: [P.x - 22, P.z + 19], h: 9, look: [P.x - 1, 9, P.z], fov: 42, sx: 0.12, hold: true },
    { u: 3.0, at: [0, -250], h: 20, look: [D.x + 8, 8, D.z], fov: 42 },
    // 03 design: the pad on the left
    { u: 3.25, at: [D.x + 23, D.z + 22], h: 9, look: [D.x + 2, 9, D.z], fov: 42, sx: 0.12, hold: true },
    { u: 3.75, at: [D.x + 19, D.z + 18], h: 9, look: [D.x - 1, 10, D.z - 1], fov: 41, sx: 0.12, hold: true },
    { u: 4.0, at: [0, -322], h: 20, look: [V.x - 8, 8, V.z], fov: 42 },
    // 04 development: the team on the right, seen from behind with their screens ahead
    { u: 4.25, at: [V.x - 24, V.z + 26], h: 11, look: [V.x - 1, 8.6, V.z - 5], fov: 44, sx: 0.12, hold: true },
    { u: 4.75, at: [V.x - 20, V.z + 21], h: 10.5, look: [V.x, 8.8, V.z - 5], fov: 43, sx: 0.12, hold: true },
    { u: 5.0, at: [0, -392], h: 18, look: [B.x + 6, 12, B.z], fov: 43 },
    // 05 building: skeleton, then the finished pyramid, on the left
    { u: 5.22, at: [B.x + 36, B.z + 40], h: 15, look: [B.x + 2, 15, B.z], fov: 43, sx: 0.12, hold: true },
    { u: 5.62, at: [B.x + 40, B.z + 42], h: 19, look: [B.x, 17, B.z], fov: 43, sx: 0.12, hold: true },
    { u: 5.9, at: [0, B.z - 16], h: 12, look: [0, 8, PLAZA.z + 40], fov: 42 },
    // 06 projects: in front of the sealed cylinder, then through the hatch to its centre
    { u: 6.0, at: [0, PLAZA.z + 74], h: 9, look: [0, 6, PLAZA.z + 30], fov: 42 },
    { u: 6.3, at: [0, PLAZA.z + 52], h: 6.5, look: [0, 5.6, PLAZA.z + 31], fov: 40, sx: 0.06, hold: true },
    { u: 6.46, at: [0, PLAZA.z + 40], h: 6.5, look: [0, 6, PLAZA.z + 10], fov: 40, sx: 0.06 },
    { u: 6.62, at: [0, PLAZA.z], h: 7.4, abs: true, look: [0, 9, PLAZA.z - 30], fov: 46, sx: 0, hold: true },
    { u: 6.8, at: [0, PLAZA.z - 12], h: 6.6, abs: true, look: [0, 5.6, TUNNEL.z0 - 10], fov: 44, sx: 0.03 },
    { u: 6.94, at: [0, PLAZA.z - 31], h: 5.4, abs: true, look: [0, 5.2, TUNNEL.z0 - 30], fov: 44, sx: 0.05 },
    // 07 review corridor (travel is procedural; these keys bracket it)
    { u: 7.0, at: [0, TUNNEL.z0 - 1], h: 4.4, look: [0, 5, TUNNEL.z0 - 40], fov: 44, sx: 0.06 },
    { u: 7.98, at: [0, z1 + 6], h: 4.4, look: [0, 5.5, z1 - 50], fov: 44, sx: 0.06 },
    // 08 finale: out of the corridor, up the mountain, then a look back over the whole journey
    { u: 8.08, at: [0, z1 - 14], h: 7, look: [0, 12, z1 - 80], fov: 44, sx: 0.06 },
    { u: 8.3, at: [8, FINAL.z + 82], h: 15, look: [FINAL.x + 4, finalBase + 22, FINAL.z], fov: 44, sx: 0.12, hold: true },
    { u: 8.55, at: [26, FINAL.z + 14], h: 14, look: [FINAL.x + 6, finalBase + FINAL_LOGO_Y - 6, FINAL.z], fov: 46, sx: 0.1 },
    { u: 8.78, at: [FINAL.x + 46, FINAL.z - 66], h: summitY + 20, abs: true, look: [FINAL.x + 34, summitY - 26, FINAL.z + 180], fov: 58, sx: 0.08, hold: true },
    { u: 9.0, at: [FINAL.x + 48, FINAL.z - 70], h: summitY + 26, abs: true, look: [FINAL.x + 36, summitY - 34, FINAL.z + 200], fov: 60, sx: 0.06, hold: true }
  ]

  const frames = specs.map(toFrame).sort((a, b) => a.u - b.u)

  /** C1 Hermite through the keys; keys flagged `hold` have zero velocity so the camera settles on them. */
  function sample(u: number, out: Pose) {
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

  return { sample }
}

/** Inside the cylinder the camera stays at the centre and only turns. */
export const galleryWeight = (u: number) => smoothstep(6.5, 6.6, u) * (1 - smoothstep(6.7, 6.86, u))
/** Hatch sequence on the cylinder: the wheel turns, the bolts draw back, the door swings open; closes behind. */
export const hatchTurn = (u: number) => smoothstep(6.32, 6.42, u)
export const hatchOpen = (u: number) => smoothstep(6.42, 6.56, u) * (1 - smoothstep(6.68, 6.76, u))
/** The exit door of the cylinder opens as the visitor leaves toward the corridor, and closes behind them. */
export const exitOpen = (u: number) => smoothstep(6.68, 6.84, u) * (1 - smoothstep(7.0, 7.1, u))
/** Inside the corridor the camera travels straight down it, driven by the scroll stops. */
export const reviewsWeight = (u: number) => smoothstep(6.92, 7.0, u) * (1 - smoothstep(7.94, 8.0, u))
