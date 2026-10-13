import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3
} from 'three'
import { LAKE, groundHeight, routeX } from './layout'
import { clamp, fbm } from './noise'
import { glowTexture, mistTexture, shaftTexture } from './textures'

const waterVertex = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
  }
`

const waterFragment = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  uniform float uTime;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uFog;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uFogDensity;
  uniform float uSunPower;
  uniform vec3 uDeep;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  vec3 sky(vec3 d) {
    float h = max(d.y, 0.0);
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.32, h));
    col = mix(col, uTop, smoothstep(0.22, 0.85, h));
    float s = max(dot(d, uSunDir), 0.0);
    col += uSun * (pow(s, 900.0) * 14.0 + pow(s, 40.0) * 0.8 + pow(s, 7.0) * 0.28) * uSunPower;
    return col;
  }

  void main() {
    vec2 q = vPos.xz;
    vec2 w1 = vec2(vnoise(q * 0.35 + uTime * 0.12), vnoise(q * 0.35 - uTime * 0.1 + 9.0)) - 0.5;
    vec2 w2 = vec2(vnoise(q * 1.7 - uTime * 0.2), vnoise(q * 1.7 + uTime * 0.17 + 4.0)) - 0.5;
    vec3 n = normalize(vec3(w1.x * 0.12 + w2.x * 0.05, 1.0, w1.y * 0.12 + w2.y * 0.05));
    vec3 toCam = cameraPosition - vPos;
    float dist = length(toCam);
    vec3 V = toCam / dist;
    vec3 R = reflect(-V, n);
    R.y = abs(R.y);
    vec3 refl = sky(normalize(R));
    float fres = 0.04 + 0.96 * pow(1.0 - max(dot(V, n), 0.0), 4.0);
    vec3 col = mix(uDeep, refl, clamp(fres + 0.25, 0.0, 1.0));
    float fog = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    col = mix(col, uFog, fog);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function rayTexture() {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(size, size)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x / size - 0.5
      const dy = y / size - 0.5
      const r = Math.hypot(dx, dy) * 2
      const a = Math.atan2(dy, dx)
      const streak = 0.35 + 0.65 * Math.pow(Math.max(0, fbm(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + 5, 3) * 1.4 + 0.5), 2)
      const falloff = Math.pow(Math.max(0, 1 - r), 1.8)
      const core = Math.exp(-r * r * 40)
      const v = Math.min(1, falloff * streak * 0.9 + core)
      const i = (y * size + x) * 4
      image.data[i] = image.data[i + 1] = image.data[i + 2] = 255
      image.data[i + 3] = v * 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export type Vista = {
  group: Group
  waterUniforms: ShaderMaterial['uniforms']
  rays: Sprite
  update(time: number, focus: number, weight: number, camera: Vector3, sunDir: Vector3): void
  pillarAt(index: number): { x: number; y: number; z: number }
  dispose(): void
}

export function createVista(colors: string[]): Vista {
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }

  const waterUniforms: ShaderMaterial['uniforms'] = {
    uTime: { value: 0 },
    uTop: { value: new Color() },
    uMid: { value: new Color() },
    uHorizon: { value: new Color() },
    uFog: { value: new Color() },
    uSun: { value: new Color() },
    uSunDir: { value: new Vector3(0, 1, 0) },
    uFogDensity: { value: 0.003 },
    uSunPower: { value: 1 },
    uDeep: { value: new Color(0x03101c) }
  }
  const water = new Mesh(track(new PlaneGeometry(LAKE.rx * 2.6, LAKE.rz * 3.2)), track(new ShaderMaterial({ vertexShader: waterVertex, fragmentShader: waterFragment, uniforms: waterUniforms })))
  water.rotation.x = -Math.PI / 2
  water.position.set(LAKE.x, LAKE.level, LAKE.z)
  group.add(water)

  // Client pillars along the causeway.
  const baseMaterial = track(new MeshStandardMaterial({ color: 0x151f33, metalness: 0.6, roughness: 0.35 }))
  const pillars = colors.map((hex, index) => {
    const z = -428 - index * 14
    const side = index % 2 ? 1 : -1
    const x = routeX(z) + side * 10
    const y = groundHeight(x, z)
    const color = new Color(hex)
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)
    if (hsl.l < 0.36) color.setHSL(hsl.h, Math.max(hsl.s, 0.4), 0.55)

    const root = new Group()
    root.position.set(x, Math.max(y, LAKE.level) , z)
    group.add(root)
    const shaft = new Mesh(track(new CylinderGeometry(0.55, 0.9, 11, 6)), baseMaterial)
    shaft.position.y = 5.5
    const lampMaterial = track(new MeshBasicMaterial({ color, toneMapped: false }))
    const lamp = new Mesh(track(new CylinderGeometry(0.75, 0.55, 1.4, 6)), lampMaterial)
    lamp.position.y = 11.7
    const halo = new Mesh(track(new PlaneGeometry(12, 12)), track(new MeshBasicMaterial({ map: glowTexture(), color, transparent: true, opacity: 0.3, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide })))
    halo.position.y = 11.7
    root.add(shaft, lamp, halo)

    const ring = new Mesh(track(new RingGeometry(0.96, 1, 64)), track(new MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false })))
    ring.rotation.x = -Math.PI / 2
    ring.position.y = LAKE.level - root.position.y + 0.12
    root.add(ring)
    return { root, halo, haloMaterial: halo.material as MeshBasicMaterial, lamp: lampMaterial, ring }
  })

  const mistMaterial = track(new MeshBasicMaterial({ map: track(mistTexture(3)), color: 0xffd9aa, transparent: true, opacity: 0.22, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  const mists: Mesh[] = []
  for (let i = 0; i < 9; i += 1) {
    const plane = new Mesh(track(new PlaneGeometry(90, 34)), mistMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.position.set(LAKE.x + (i - 4) * 28 + Math.sin(i * 2.3) * 12, LAKE.level + 0.8 + (i % 3) * 0.7, LAKE.z + Math.cos(i * 1.7) * 36)
    group.add(plane)
    mists.push(plane)
  }

  const rayMaterial = track(new SpriteMaterial({ map: track(rayTexture()), color: 0xffd9a0, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, depthTest: false, toneMapped: false }))
  const rays = new Sprite(rayMaterial)
  rays.scale.setScalar(1400)
  rays.renderOrder = -5
  group.add(rays)

  const shaftMaterial = track(new MeshBasicMaterial({ map: track(shaftTexture()), color: 0xffcf90, transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  for (let i = 0; i < 5; i += 1) {
    const plane = new Mesh(track(new PlaneGeometry(26, 120)), shaftMaterial)
    plane.position.set(-50 + i * 24, 50, -520 - i * 6)
    plane.rotation.z = 0.5
    plane.rotation.y = 0.2
    group.add(plane)
  }

  const light = new PointLight(0xffc680, 0, 60, 1.6)
  group.add(light)

  return {
    group,
    waterUniforms,
    rays,
    pillarAt(index) {
      const p = pillars[clamp(Math.round(index), 0, pillars.length - 1)]
      return { x: p.root.position.x, y: p.root.position.y + 11, z: p.root.position.z }
    },
    update(time, focus, weight, camera, sunDir) {
      waterUniforms.uTime.value = time
      pillars.forEach((pillar, index) => {
        const e = clamp(1 - Math.abs(focus - index))
        pillar.haloMaterial.opacity = 0.12 + 0.38 * e
        pillar.halo.scale.setScalar(0.8 + e * 1.4)
        const phase = (time * 0.45 + index * 0.2) % 1
        const ringMaterial = pillar.ring.material as MeshBasicMaterial
        ringMaterial.opacity = e * (1 - phase) * 0.9
        pillar.ring.scale.setScalar(2 + phase * 14)
      })
      const active = pillars[clamp(Math.round(focus), 0, pillars.length - 1)]
      light.position.set(active.root.position.x, active.root.position.y + 12, active.root.position.z + 3)
      light.color.copy(active.lamp.color)
      light.intensity = 600 * weight
      mistMaterial.opacity = 0.1 + 0.16 * weight
      mists.forEach((mist, i) => {
        mist.position.x += Math.sin(time * 0.05 + i) * 0.01
      })
      rays.position.copy(camera).addScaledVector(sunDir, 900)
      ;(rays.material as SpriteMaterial).opacity = 0.36 * weight
      shaftMaterial.opacity = 0.14 * weight
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
