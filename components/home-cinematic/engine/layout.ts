import { clamp, fbm, lerp, ridged, smooth, smoothstep } from './noise'

/** Everything that defines where things live in the Nivello world. Shared by terrain, props, shaders and camera. */

export const WORLD = { xMin: -210, xMax: 210, zMax: 70, zMin: -600 }

// Signal route: x as a function of z, as a monotone Hermite through hand-placed control points.
const ROUTE: [number, number][] = [
  [70, 0], [40, -1], [20, -3], [-5, 9], [-30, -8], [-55, -17], [-75, -4], [-100, 9], [-125, -2], [-150, -14],
  [-175, -2], [-195, -14], [-215, 8], [-235, -8], [-255, 8], [-285, 0], [-315, 0], [-335, 0], [-360, 0],
  [-390, -10], [-420, 10], [-455, -6], [-490, 8], [-530, -2], [-600, 0]
]

const routeSlopes = ROUTE.map((point, index) => {
  const prev = ROUTE[Math.max(0, index - 1)]
  const next = ROUTE[Math.min(ROUTE.length - 1, index + 1)]
  return (next[1] - prev[1]) / (next[0] - prev[0])
})

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

export const MONUMENT = { x: 20, z: -170, size: 44 }
export const PLATEAU = { x: 20, z: -168, r: 46 }

export const MILESTONES = [
  { z: -206, side: 1, r: 12 },
  { z: -228, side: -1, r: 13 },
  { z: -250, side: 1, r: 14 },
  { z: -272, side: -1, r: 15 },
  { z: -296, side: 1, r: 14 }
].map(m => ({ ...m, x: routeX(m.z) + m.side * 19 }))

export const PLAZA = { x: 0, z: -378, r: 36 }
export const LAKE = { x: 0, z: -490, rx: 30, rz: 62, level: -2.4 }
export const FINAL = { x: 0, z: -585, size: 30 }
export const SUN_DIR: [number, number, number] = [-0.42, 0.34, -0.84]

const WIDTH_KEYS: [number, number][] = [
  [70, 26], [20, 22], [-40, 24], [-70, 24], [-95, 50], [-150, 90], [-180, 70], [-300, 58], [-340, 54], [-378, 48], [-420, 38],
  [-480, 34], [-540, 36], [-600, 46]
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

  const hump = 33 * Math.exp(-Math.pow((z + 74) / 21, 2))
  let floor = hump + fbm(x * 0.03, z * 0.03, 3) * 2.2
  floor -= 4 * smoothstep(-110, -150, z) * smoothstep(-210, -170, z)

  const wallT = smoothstep(width * 0.55, width * 1.35 + 36, lateral)
  const big = ridged(x * 0.0095 + 11, z * 0.0095 - 4, 4)
  const detail = fbm(x * 0.045, z * 0.045, 4)
  const crest = 14 + 74 * big + 10 * detail
  const far = 1 + smoothstep(80, 200, lateral) * 0.75
  const passBoost = 1 + 0.55 * Math.exp(-Math.pow((z + 74) / 38, 2))
  const wallRaw = crest * far * passBoost * Math.pow(wallT, 1.35)
  // Sedimentary ledges: soft terracing gives the walls readable strata and hard light/shadow edges.
  const stepHeight = 7.5
  const tt = wallRaw / stepHeight
  const ledge = (Math.floor(tt) + smoothstep(0.28, 0.72, tt - Math.floor(tt))) * stepHeight
  const wall = lerp(wallRaw, ledge, 0.5 * smoothstep(0.04, 0.35, wallT))
  const crags = (fbm(x * 0.07 + 3, z * 0.07 + 8, 3)) * 5 * smoothstep(0.1, 0.5, wallT)
  let h = floor + wall + crags

  // Landmark plateau, terraced.
  const dp = Math.hypot(x - PLATEAU.x, z - PLATEAU.z)
  const plateau = smoothstep(PLATEAU.r + 22, PLATEAU.r - 8, dp)
  const terrace = 7 + Math.floor(smoothstep(PLATEAU.r, 8, dp) * 3) * 1.4
  h = lerp(h, terrace, plateau)

  // Milestone pads.
  for (const m of MILESTONES) {
    const d = Math.hypot(x - m.x, z - m.z)
    h = lerp(h, 0.2, smoothstep(m.r + 9, m.r - 2, d))
  }

  // Gallery plaza: a calm circular floor ringed by low steps.
  const dg = Math.hypot(x - PLAZA.x, z - PLAZA.z)
  h = lerp(h, 0, smoothstep(PLAZA.r + 14, PLAZA.r - 4, dg))
  h += smoothstep(PLAZA.r + 4, PLAZA.r + 5.5, dg) * smoothstep(PLAZA.r + 10, PLAZA.r + 8, dg) * 1.4

  // Pad for the closing logo at the end of the canyon.
  h = lerp(h, 0.6, smoothstep(FINAL.size * 0.9 + 8, FINAL.size * 0.5, Math.hypot(x - FINAL.x, z - FINAL.z)))

  // Lake with a causeway that carries the route.
  const dl = Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz)
  const lake = smoothstep(1.12, 0.55, dl)
  h = lerp(h, LAKE.level - 5 - fbm(x * 0.05, z * 0.05, 2) * 2, lake)
  const lane = smoothstep(7, 3.5, lateral) * smoothstep(1.2, 0.8, dl)
  h = lerp(h, 0.55, lane)

  return h
}
