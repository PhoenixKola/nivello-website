// Deterministic 2D gradient noise + helpers shared by terrain, textures and layout.

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smooth = (t: number) => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}
export const smoothstep = (a: number, b: number, v: number) => smooth((v - a) / (b - a))
export const ease = {
  inOut: (t: number) => smooth(t),
  out: (t: number) => 1 - Math.pow(1 - clamp(t), 3),
  in: (t: number) => Math.pow(clamp(t), 3)
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const perm = new Uint8Array(512)
const grad = new Float32Array(512 * 2)
{
  const rand = mulberry32(1337)
  const p = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < 512; i += 1) {
    perm[i] = p[i & 255]
    const angle = (perm[i] / 256) * Math.PI * 2
    grad[i * 2] = Math.cos(angle)
    grad[i * 2 + 1] = Math.sin(angle)
  }
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** Perlin gradient noise, range roughly [-1, 1]. */
export function noise2(x: number, y: number) {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const x0 = xi & 255
  const y0 = yi & 255
  const dot = (ix: number, iy: number, dx: number, dy: number) => {
    const h = perm[perm[ix & 255] + (iy & 255)]
    return grad[h * 2] * dx + grad[h * 2 + 1] * dy
  }
  const n00 = dot(x0, y0, xf, yf)
  const n10 = dot(x0 + 1, y0, xf - 1, yf)
  const n01 = dot(x0, y0 + 1, xf, yf - 1)
  const n11 = dot(x0 + 1, y0 + 1, xf - 1, yf - 1)
  const u = fade(xf)
  const v = fade(yf)
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v) * 1.4
}

export function fbm(x: number, y: number, octaves = 5, lacunarity = 2, gain = 0.5) {
  let amp = 0.5
  let freq = 1
  let sum = 0
  for (let i = 0; i < octaves; i += 1) {
    sum += noise2(x * freq, y * freq) * amp
    freq *= lacunarity
    amp *= gain
  }
  return sum
}

/** Ridged multifractal: sharp crests, the backbone of the mountain silhouettes. */
export function ridged(x: number, y: number, octaves = 5) {
  let amp = 0.55
  let freq = 1
  let sum = 0
  let weight = 1
  for (let i = 0; i < octaves; i += 1) {
    let n = 1 - Math.abs(noise2(x * freq, y * freq))
    n *= n
    n *= weight
    weight = clamp(n * 1.6)
    sum += n * amp
    freq *= 2.03
    amp *= 0.5
  }
  return sum
}
