import { clamp, fbm, lerp, ridged, smooth, smoothstep } from './noise'

/** Everything that defines where things live in the Nivello world. Shared by terrain, props, shaders and camera. */

export const WORLD = { xMin: -230, xMax: 230, zMax: 70, zMin: -880 }

// Signal route: x as a function of z, as a monotone Hermite through hand-placed control points.
// The arrival winds through the valley; from the identity chapter on it runs straight, with every scene set beside it.
const ROUTE: [number, number][] = [[70, 0], [44, -15], [14, 13], [-18, -15], [-50, 11], [-84, -7], [-122, 0], [-900, 0]]

const computeSlopes = () =>
  ROUTE.map((point, index) => {
    const prev = ROUTE[Math.max(0, index - 1)]
    const next = ROUTE[Math.min(ROUTE.length - 1, index + 1)]
    return (next[1] - prev[1]) / (next[0] - prev[0])
  })
const routeSlopes: number[] = computeSlopes()

export function routeX(z: number) {
  const zc = clamp(z, WORLD.zMin, WORLD.zMax)
  let i = 0
  while (i < ROUTE.length - 2 && zc < ROUTE[i + 1][0]) i += 1
  const [z0, x0] = ROUTE[i]
  const [z1, x1] = ROUTE[i + 1]
  const h = z1 - z0
  const t = (zc - z0) / h
  const t2 = t * t
  const t3 = t2 * t
  return (
    (2 * t3 - 3 * t2 + 1) * x0 +
    (t3 - 2 * t2 + t) * h * routeSlopes[i] +
    (-2 * t3 + 3 * t2) * x1 +
    (t3 - t2) * h * routeSlopes[i + 1]
  )
}

/** Samples of routeX for the shader (index 0 = zMax). */
export function routeSamples(count: number) {
  const out = new Float32Array(count)
  for (let i = 0; i < count; i += 1) out[i] = routeX(WORLD.zMax + ((WORLD.zMin - WORLD.zMax) * i) / (count - 1))
  return out
}

export const MONUMENT = { x: 40, z: -176, size: 40 }
export const PLATEAU = { x: 38, z: -174, r: 40 }

/**
 * Stations alternate sides of the road. Each is a flat open-air pad; the camera slides off the road to inspect it,
 * then returns. Only the project cylinder sits ON the road, because that is the one place the visitor enters.
 */
export const STATIONS = {
  planning: { x: 38, z: -236, r: 24 },
  design: { x: -38, z: -298, r: 24 },
  dev: { x: 38, z: -362, r: 26 },
  building: { x: -40, z: -428, r: 26 }
}

export const PLAZA = { x: 0, z: -514, r: 44 }
/** Inner radius of the project cylinder (the wall is 1.2 thick). */
export const CYLINDER = { radius: 30, height: 27 }
/** Review corridor: starts at the cylinder's exit hatch. z1 follows the number of reviews (see configureWorld). */
export const TUNNEL = { x: 0, z0: PLAZA.z - CYLINDER.radius - 1.4, z1: PLAZA.z - CYLINDER.radius - 1.4 - 42, halfWidth: 7.6, height: 10.5 }
export const REVIEW_SPACING = 8
export const LAKE = { x: 0, z: -2000, rx: 1, rz: 1, level: -2.4 }
/** The summit with the closing mark. Placed after the corridor; updated by configureWorld. */
// The closing mark stands off to one side. Looking back from the summit (toward +z) negative x is on the viewer's right.
export const FINAL = { x: -30, z: -770, size: 26 }
export const SUMMIT = { z: -800, height: 68 }
export const SUN_DIR: [number, number, number] = [-0.42, 0.34, -0.84]

/** Length of the corridor for a number of reviews: one wall per review, so more reviews simply lengthen it. */
export const tunnelLength = (reviews: number) => 15 + (Math.max(1, reviews) - 1) * REVIEW_SPACING + 14

/** Fix the places that depend on the number of reviews. Call once, before the terrain and the camera track are built. */
export function configureWorld(reviewCount: number) {
  TUNNEL.z1 = TUNNEL.z0 - tunnelLength(reviewCount)
  FINAL.z = TUNNEL.z1 - 118
  SUMMIT.z = FINAL.z - 32
  WORLD.zMin = SUMMIT.z - 86
  ROUTE[ROUTE.length - 1][0] = WORLD.zMin - 20
  routeSlopes.splice(0, routeSlopes.length, ...computeSlopes())
}

// Corridor half-width keyed on z. Narrow and winding in the arrival, wide where the open-air scenes sit beside the road.
const WIDTH_KEYS: [number, number][] = [
  [70, 30], [20, 26], [-40, 28], [-80, 32], [-110, 56], [-150, 96], [-190, 104], [-240, 104], [-300, 104], [-370, 104], [-430, 100],
  [-470, 84], [-520, 70], [-560, 40], [-700, 44], [-800, 90], [-900, 120]
]

function keyed(table: [number, number][], z: number) {
  if (z >= table[0][0]) return table[0][1]
  for (let i = 0; i < table.length - 1; i += 1) {
    const [z0, v0] = table[i]
    const [z1, v1] = table[i + 1]
    if (z <= z0 && z >= z1) return lerp(v0, v1, smooth((z0 - z) / (z0 - z1)))
  }
  return table[table.length - 1][1]
}

/** Terrain height in world space. The corridor floor is calm; the walls become ridged mountains with real silhouettes. */
export function groundHeight(x: number, z: number) {
  const rx = routeX(z)
  const lateral = Math.abs(x - rx)
  const width = keyed(WIDTH_KEYS, z)

  const hump = 24 * Math.exp(-Math.pow((z + 78) / 21, 2))
  let floor = hump + fbm(x * 0.03, z * 0.03, 3) * 2.2
  floor -= 3 * smoothstep(-120, -150, z) * smoothstep(-210, -170, z)

  const wallT = smoothstep(width * 0.55, width * 1.35 + 36, lateral)
  const big = ridged(x * 0.0095 + 11, z * 0.0095 - 4, 4)
  const detail = fbm(x * 0.045, z * 0.045, 4)
  const crest = 14 + 74 * big + 10 * detail
  const far = 1 + smoothstep(80, 200, lateral) * 0.75
  const passBoost = 1 + 0.4 * Math.exp(-Math.pow((z + 78) / 38, 2))
  // The arrival valley is lower and more open so the scene breathes; the walls rise to full height by the identity chapter.
  const arrivalLow = lerp(0.55, 1, smoothstep(-20, -150, z))
  const wallRaw = crest * far * passBoost * arrivalLow * Math.pow(wallT, 1.35)
  // Sedimentary ledges: soft terracing gives the walls readable strata and hard light/shadow edges.
  const stepHeight = 7.5
  const tt = wallRaw / stepHeight
  const ledge = (Math.floor(tt) + smoothstep(0.28, 0.72, tt - Math.floor(tt))) * stepHeight
  const wall = lerp(wallRaw, ledge, 0.5 * smoothstep(0.04, 0.35, wallT))
  const crags = (fbm(x * 0.07 + 3, z * 0.07 + 8, 3)) * 5 * smoothstep(0.1, 0.5, wallT)
  let h = floor + wall + crags

  // The mountain at the end of the road: the corridor floor climbs to the summit that carries the closing mark.
  const climbT = smoothstep(TUNNEL.z1 - 4, SUMMIT.z + 10, z)
  const climb = SUMMIT.height * Math.pow(climbT, 1.25)
  h += climb * (0.35 + 0.65 * Math.exp(-Math.pow(lateral / 120, 2)))
  h -= smoothstep(SUMMIT.z - 18, WORLD.zMin, z) * climb * 0.5

  // Landmark plateau, terraced.
  const dp = Math.hypot(x - PLATEAU.x, z - PLATEAU.z)
  const plateau = smoothstep(PLATEAU.r + 22, PLATEAU.r - 8, dp)
  const terrace = 7 + Math.floor(smoothstep(PLATEAU.r, 8, dp) * 3) * 1.4
  h = lerp(h, terrace, plateau)

  // Station pads: each scene sits on its own level floor.
  for (const station of Object.values(STATIONS)) {
    const d = Math.hypot(x - station.x, z - station.z)
    h = lerp(h, 0.2, smoothstep(station.r + 9, station.r - 2, d))
  }

  // Cylinder plaza: a calm circular floor ringed by low steps.
  const dg = Math.hypot(x - PLAZA.x, z - PLAZA.z)
  h = lerp(h, 0, smoothstep(PLAZA.r + 14, PLAZA.r - 4, dg))
  h += smoothstep(PLAZA.r + 4, PLAZA.r + 5.5, dg) * smoothstep(PLAZA.r + 10, PLAZA.r + 8, dg) * 1.4

  // Summit pad for the closing mark.
  const padTop = SUMMIT.height * 0.98
  h = lerp(h, padTop, smoothstep(FINAL.size * 1.9 + 8, FINAL.size * 0.9, Math.hypot(x - FINAL.x, z - (FINAL.z - 12))))

  // The corridor floor is flat and calm.
  const tunnelBand = smoothstep(TUNNEL.z0 + 14, TUNNEL.z0 + 4, z) * smoothstep(TUNNEL.z1 - 14, TUNNEL.z1 - 4, z)
  h = lerp(h, 0.3, tunnelBand * smoothstep(20, 9, lateral))
  // Central lane carries the route between stations.
  h = lerp(h, 0.45, smoothstep(6, 3.2, lateral) * smoothstep(-130, -190, z) * (1 - smoothstep(TUNNEL.z1 + 4, TUNNEL.z1 - 14, z)))

  return h
}

/** Rotation about y that points a group's local +z from `at` toward `toward` (so a scene faces its camera stop). */
export const facing = (at: { x: number; z: number }, toward: { x: number; z: number }) => Math.atan2(toward.x - at.x, toward.z - at.z)
