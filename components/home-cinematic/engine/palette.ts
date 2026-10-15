import { Color } from 'three'
import { smooth } from './noise'

/** Lighting beats of the story, keyed on the global timeline u (chapter index + local progress). */
export type Beat = {
  u: number
  skyTop: number
  skyMid: number
  skyHorizon: number
  fog: number
  fogDensity: number
  sun: number
  sunIntensity: number
  ambientSky: number
  ambientGround: number
  exposure: number
  bloom: number
  stars: number
  clouds: number
  grade: number
  gradeAmount: number
}

const beats: Beat[] = [
  { u: 0.0, skyTop: 0x040a1e, skyMid: 0x112a52, skyHorizon: 0xe0955a, fog: 0x1a3356, fogDensity: 0.0046, sun: 0xffa860, sunIntensity: 1.0, ambientSky: 0x2c4c80, ambientGround: 0x0a1424, exposure: 0.95, bloom: 0.85, stars: 0.9, clouds: 0.45, grade: 0x2a6bff, gradeAmount: 0.1 },
  { u: 0.9, skyTop: 0x0a1d48, skyMid: 0x2c58a0, skyHorizon: 0xffae62, fog: 0x3f6296, fogDensity: 0.0034, sun: 0xffc78a, sunIntensity: 1.9, ambientSky: 0x5580b8, ambientGround: 0x182234, exposure: 1.05, bloom: 0.8, stars: 0.15, clouds: 0.7, grade: 0xffb35a, gradeAmount: 0.08 },
  { u: 1.6, skyTop: 0x06173a, skyMid: 0x1c4a8c, skyHorizon: 0x6aa2e6, fog: 0x2c5690, fogDensity: 0.0040, sun: 0xffe8c0, sunIntensity: 1.7, ambientSky: 0x3f6fb0, ambientGround: 0x12203a, exposure: 1.05, bloom: 0.65, stars: 0, clouds: 0.8, grade: 0x159bff, gradeAmount: 0.07 },
  { u: 3.6, skyTop: 0x06173a, skyMid: 0x1c4a8c, skyHorizon: 0x6aa2e6, fog: 0x2c5690, fogDensity: 0.0040, sun: 0xffe8c0, sunIntensity: 1.7, ambientSky: 0x3f6fb0, ambientGround: 0x12203a, exposure: 1.05, bloom: 0.65, stars: 0, clouds: 0.8, grade: 0x159bff, gradeAmount: 0.07 },
  { u: 5.3, skyTop: 0x0c2252, skyMid: 0x3a62a0, skyHorizon: 0xffb870, fog: 0x6a7fa6, fogDensity: 0.0040, sun: 0xffd29a, sunIntensity: 2.0, ambientSky: 0x5a7eb4, ambientGround: 0x201f30, exposure: 1.05, bloom: 0.75, stars: 0, clouds: 0.8, grade: 0xffbf43, gradeAmount: 0.09 },
  { u: 5.95, skyTop: 0x16346e, skyMid: 0x3f6aa8, skyHorizon: 0xf0c79a, fog: 0x6f86ab, fogDensity: 0.0034, sun: 0xffe2b8, sunIntensity: 1.6, ambientSky: 0x5c7cb0, ambientGround: 0x202a40, exposure: 1.0, bloom: 0.6, stars: 0, clouds: 0.75, grade: 0xffc78a, gradeAmount: 0.06 },
  { u: 6.97, skyTop: 0x16346e, skyMid: 0x3f6aa8, skyHorizon: 0xf0c79a, fog: 0x6f86ab, fogDensity: 0.0034, sun: 0xffe2b8, sunIntensity: 1.6, ambientSky: 0x5c7cb0, ambientGround: 0x202a40, exposure: 1.0, bloom: 0.6, stars: 0, clouds: 0.75, grade: 0xffc78a, gradeAmount: 0.06 },
  { u: 7.1, skyTop: 0x1a2f66, skyMid: 0x9a5646, skyHorizon: 0xe89a58, fog: 0x7a5048, fogDensity: 0.0034, sun: 0xffb060, sunIntensity: 1.7, ambientSky: 0x84647a, ambientGround: 0x241a24, exposure: 0.82, bloom: 0.7, stars: 0, clouds: 0.9, grade: 0xffaa3c, gradeAmount: 0.14 },
  { u: 7.9, skyTop: 0x141f50, skyMid: 0x8a4260, skyHorizon: 0xe0804a, fog: 0x6a4a6c, fogDensity: 0.0034, sun: 0xff9a4a, sunIntensity: 1.4, ambientSky: 0x8a6a98, ambientGround: 0x2a2236, exposure: 1.0, bloom: 0.85, stars: 0.1, clouds: 0.85, grade: 0xff7a5a, gradeAmount: 0.12 },
  { u: 8.3, skyTop: 0x090f33, skyMid: 0x3a2a6a, skyHorizon: 0xff7e5a, fog: 0x45386f, fogDensity: 0.0030, sun: 0xff8a50, sunIntensity: 1.1, ambientSky: 0x4a4a90, ambientGround: 0x14142c, exposure: 1.0, bloom: 1.0, stars: 0.5, clouds: 0.7, grade: 0x7c3aed, gradeAmount: 0.12 },
  { u: 9.0, skyTop: 0x0a1646, skyMid: 0x3a4a92, skyHorizon: 0xf2a064, fog: 0x4a4c86, fogDensity: 0.0013, sun: 0xffa060, sunIntensity: 2.1, ambientSky: 0x6a74c0, ambientGround: 0x30386e, exposure: 1.15, bloom: 0.9, stars: 0.4, clouds: 0.6, grade: 0xffa04a, gradeAmount: 0.1 }
]

const scratch = new Color()

export type Atmosphere = {
  skyTop: Color
  skyMid: Color
  skyHorizon: Color
  fog: Color
  fogDensity: number
  sun: Color
  sunIntensity: number
  ambientSky: Color
  ambientGround: Color
  exposure: number
  bloom: number
  stars: number
  clouds: number
  grade: Color
  gradeAmount: number
}

export function createAtmosphere(): Atmosphere {
  return {
    skyTop: new Color(),
    skyMid: new Color(),
    skyHorizon: new Color(),
    fog: new Color(),
    fogDensity: 0,
    sun: new Color(),
    sunIntensity: 0,
    ambientSky: new Color(),
    ambientGround: new Color(),
    exposure: 1,
    bloom: 1,
    stars: 0,
    clouds: 0,
    grade: new Color(),
    gradeAmount: 0
  }
}

const dayTop = new Color(0x6fa8e8)
const dayMid = new Color(0xa9cdf2)
const dayHorizon = new Color(0xfff0d8)
const dayFog = new Color(0xcfe0ee)

/** Blend the beat table at u. `day` (0..1) lifts the whole world toward a bright daylight reading for the light theme. */
export function evaluateAtmosphere(u: number, day: number, out: Atmosphere) {
  let i = 0
  while (i < beats.length - 2 && u > beats[i + 1].u) i += 1
  const a = beats[i]
  const b = beats[i + 1]
  const t = smooth((u - a.u) / (b.u - a.u))
  const mix = (target: Color, ca: number, cb: number) => target.set(ca).lerp(scratch.set(cb), t)
  const num = (x: number, y: number) => x + (y - x) * t

  mix(out.skyTop, a.skyTop, b.skyTop).lerp(dayTop, 0.55 * day)
  mix(out.skyMid, a.skyMid, b.skyMid).lerp(dayMid, 0.5 * day)
  mix(out.skyHorizon, a.skyHorizon, b.skyHorizon).lerp(dayHorizon, 0.45 * day)
  mix(out.fog, a.fog, b.fog).lerp(dayFog, 0.6 * day)
  mix(out.sun, a.sun, b.sun)
  mix(out.ambientSky, a.ambientSky, b.ambientSky)
  mix(out.ambientGround, a.ambientGround, b.ambientGround)
  mix(out.grade, a.grade, b.grade)
  out.fogDensity = num(a.fogDensity, b.fogDensity) * (1 - 0.15 * day) * 0.92
  out.sunIntensity = num(a.sunIntensity, b.sunIntensity) * (1 + 0.15 * day)
  out.ambientSky.multiplyScalar(1 + 0.7 * day)
  out.ambientGround.multiplyScalar(1 + 1.2 * day)
  out.exposure = num(a.exposure, b.exposure) * (1 + 0.1 * day)
  out.bloom = num(a.bloom, b.bloom) * (1 - 0.4 * day)
  out.stars = num(a.stars, b.stars) * (1 - day)
  out.clouds = num(a.clouds, b.clouds)
  out.gradeAmount = num(a.gradeAmount, b.gradeAmount)
}
