import {
  BackSide,
  CanvasTexture,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  RepeatWrapping,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3
} from 'three'
import { SUN_DIR } from './layout'
import { fbm, mulberry32 } from './noise'

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = clip.xyww;
  }
`

const skyFragment = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uHorizon;
  uniform vec3 uFog;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  uniform float uSunPower;
  uniform float uStars;
  uniform float uClouds;
  uniform float uTime;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 5; i++) { s += vnoise(p) * a; p = p * 2.07 + 5.3; a *= 0.5; } return s; }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.32, h));
    col = mix(col, uTop, smoothstep(0.22, 0.85, h));
    col += uHorizon * 0.45 * exp(-abs(h) * 9.0);
    col = mix(col, uFog, smoothstep(0.0, -0.18, h));

    float s = max(dot(d, uSunDir), 0.0);
    col += uSun * (pow(s, 900.0) * 14.0 + pow(s, 40.0) * 0.8 + pow(s, 7.0) * 0.28) * uSunPower;

    // Stars
    if (h > 0.02 && uStars > 0.01) {
      vec2 sp = d.xz / (h + 0.4) * 160.0;
      vec2 cell = floor(sp);
      float r = hash(cell);
      vec2 f = fract(sp) - 0.5;
      float star = smoothstep(0.12, 0.0, length(f)) * step(0.9935, r);
      star *= 0.6 + 0.4 * sin(uTime * 2.0 + r * 60.0);
      col += vec3(0.8, 0.9, 1.0) * star * uStars * smoothstep(0.05, 0.4, h) * 1.5;
    }

    // Clouds: two drifting layers, lit from the sun side.
    if (h > 0.015) {
      vec2 cp = d.xz / (h + 0.16);
      float c1 = fbm(cp * 0.55 + vec2(uTime * 0.004, 3.0));
      float c2 = fbm(cp * 1.4 - vec2(uTime * 0.006, 1.0));
      float cloud = smoothstep(0.46, 0.78, c1 * 0.75 + c2 * 0.4) * smoothstep(0.015, 0.2, h) * uClouds;
      vec3 cloudCol = mix(uMid * 1.25 + uHorizon * 0.2, uSun * 1.1 + uHorizon * 0.4, pow(s, 2.5));
      cloudCol *= 0.55 + 0.6 * (1.0 - c2 * 0.6);
      col = mix(col, cloudCol, cloud * 0.7);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export type Sky = {
  group: Group
  update(camera: Vector3, time: number): void
  uniforms: ShaderMaterial['uniforms']
  ridgeMaterials: MeshBasicMaterial[]
  dispose(): void
}

function ridgeTexture(seed: number, base: number, amp: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const rand = mulberry32(seed)
  const offset = rand() * 100
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(1, 'rgba(255,255,255,1)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(0, canvas.height)
  for (let x = 0; x <= canvas.width; x += 4) {
    const t = x / canvas.width
    // Wraps seamlessly: sample noise on a circle.
    const angle = t * Math.PI * 2
    const nx = Math.cos(angle) * 2.2 + offset
    const ny = Math.sin(angle) * 2.2 + offset
    const ridge = 1 - Math.abs(fbm(nx * 1.3, ny * 1.3, 5))
    const y = canvas.height - (base + amp * (ridge * ridge * 1.15 + fbm(nx * 4, ny * 4, 3) * 0.25))
    ctx.lineTo(x, y)
  }
  ctx.lineTo(canvas.width, canvas.height)
  ctx.closePath()
  ctx.fill()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  return texture
}

export function createSky(low = false): Sky {
  const group = new Group()
  const uniforms: ShaderMaterial['uniforms'] = {
    uTop: { value: new Color() },
    uMid: { value: new Color() },
    uHorizon: { value: new Color() },
    uFog: { value: new Color() },
    uSun: { value: new Color() },
    uSunDir: { value: new Vector3(...SUN_DIR).normalize() },
    uSunPower: { value: 1 },
    uStars: { value: 0 },
    uClouds: { value: 0.6 },
    uTime: { value: 0 }
  }
  const dome = new Mesh(
    new SphereGeometry(900, 32, 24),
    new ShaderMaterial({ vertexShader: skyVertex, fragmentShader: low ? skyFragment.replace('i < 5', 'i < 3').replace('float c2 = fbm(cp * 1.4 - vec2(uTime * 0.006, 1.0));', 'float c2 = c1;') : skyFragment, uniforms, side: BackSide, depthWrite: false, fog: false })
  )
  dome.renderOrder = -10
  dome.frustumCulled = false
  group.add(dome)

  // Matte-painted ridge layers: depth that costs nothing, tinted toward the fog so distance reads as air.
  const ridgeMaterials: MeshBasicMaterial[] = []
  const textures: CanvasTexture[] = []
  const layers = [
    { r: 820, h: 120, y: -10, seed: 4, base: 30, amp: 150, mix: 0.72 },
    { r: 700, h: 120, y: -8, seed: 9, base: 26, amp: 130, mix: 0.52 },
    { r: 590, h: 110, y: -6, seed: 21, base: 22, amp: 110, mix: 0.34 }
  ]
  layers.forEach((layer, index) => {
    const texture = ridgeTexture(layer.seed, layer.base, layer.amp)
    textures.push(texture)
    const material = new MeshBasicMaterial({ map: texture, transparent: true, side: BackSide, depthWrite: false, fog: false, toneMapped: true })
    material.userData.mix = layer.mix
    ridgeMaterials.push(material)
    const mesh = new Mesh(new CylinderGeometry(layer.r, layer.r, layer.h, 96, 1, true), material)
    mesh.position.y = layer.y + layer.h * 0.5 - 4
    mesh.renderOrder = -9 + index
    mesh.frustumCulled = false
    group.add(mesh)
  })

  return {
    group,
    uniforms,
    ridgeMaterials,
    update(camera, time) {
      group.position.set(camera.x, 0, camera.z)
      dome.position.y = camera.y
      uniforms.uTime.value = time
    },
    dispose() {
      dome.geometry.dispose()
      ;(dome.material as ShaderMaterial).dispose()
      group.children.forEach(child => {
        if (child !== dome) (child as Mesh).geometry.dispose()
      })
      ridgeMaterials.forEach(material => material.dispose())
      textures.forEach(texture => texture.dispose())
    }
  }
}
