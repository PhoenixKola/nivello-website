import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Points, ShaderMaterial, Vector3 } from 'three'
import { groundHeight, routeX } from './layout'
import { mulberry32 } from './noise'
import { mistTexture } from './textures'

const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSeed;
  uniform vec3 uCam;
  uniform vec3 uBox;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.15 + aSeed * 40.0) * 3.0;
    p.y += sin(uTime * 0.21 + aSeed * 90.0) * 1.8 + uTime * (0.25 + aSeed * 0.5);
    p.z += cos(uTime * 0.13 + aSeed * 70.0) * 3.0;
    vec3 wrapped = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
    vec4 mv = modelViewMatrix * vec4(wrapped + uCam, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = clamp(uScale * (1.2 + aSeed * 2.2) / dist, 1.0, 14.0);
    vColor = aColor;
    float edge = 1.0 - smoothstep(0.35, 0.5, length(wrapped / uBox));
    vAlpha = edge * (0.35 + 0.65 * fract(aSeed * 13.0 + uTime * 0.2));
  }
`

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uOpacity;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * vAlpha * uOpacity);
  }
`

export type Motes = {
  points: Points
  update(camera: Vector3, time: number, tint: Color, opacity: number): void
  dispose(): void
}

/** Drifting light motes that wrap around the camera: embers, dust in light shafts, signal particles. */
export function createMotes(count: number): Motes {
  const rand = mulberry32(99)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const gold = new Color(0xffbf43)
  const blue = new Color(0x4db4ff)
  const white = new Color(0xffffff)
  const box = new Vector3(120, 50, 120)
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rand() - 0.5) * box.x
    positions[i * 3 + 1] = rand() * box.y
    positions[i * 3 + 2] = (rand() - 0.5) * box.z
    const pick = rand()
    const color = pick < 0.55 ? gold : pick < 0.85 ? blue : white
    colors.set([color.r, color.g, color.b], i * 3)
    seeds[i] = rand()
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new BufferAttribute(colors, 3))
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))
  const material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uCam: { value: new Vector3() },
      uBox: { value: box },
      uTime: { value: 0 },
      uScale: { value: 360 },
      uOpacity: { value: 0.8 }
    }
  })
  const points = new Points(geometry, material)
  points.frustumCulled = false
  return {
    points,
    update(camera, time, _tint, opacity) {
      material.uniforms.uCam.value.copy(camera)
      material.uniforms.uTime.value = time
      material.uniforms.uOpacity.value = opacity
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    }
  }
}

/** Layered mist sheets hugging the canyon floor: cheap volumetric depth. */
export function createMist(): { group: Group; update(fog: Color, sun: Color, time: number, amount: number): void; dispose(): void } {
  const group = new Group()
  const texture = mistTexture(8)
  const material = new MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.2, depthWrite: false, side: DoubleSide, toneMapped: false })
  const geometry = new PlaneGeometry(1, 1)
  const rand = mulberry32(7)
  const sheets: { mesh: Mesh; baseX: number; drift: number }[] = []
  const zones: [number, number, number][] = [
    [30, -150, 12],
    [-150, -330, 8],
    [-380, -520, 6]
  ]
  zones.forEach(([from, to, count]) => {
    for (let i = 0; i < count; i += 1) {
      const z = from + ((to - from) * (i + rand() * 0.6)) / count
      const x = routeX(z) + (rand() - 0.5) * 36
      const mesh = new Mesh(geometry, material)
      mesh.rotation.x = -Math.PI / 2
      mesh.rotation.z = rand() * Math.PI
      const size = 46 + rand() * 60
      mesh.scale.set(size, size * (0.5 + rand() * 0.4), 1)
      mesh.position.set(x, Math.max(groundHeight(x, z), -1.5) + 1.6 + rand() * 4, z)
      group.add(mesh)
      sheets.push({ mesh, baseX: x, drift: rand() * 6 })
    }
  })
  return {
    group,
    update(fog, sun, time, amount) {
      material.color.copy(fog).lerp(sun, 0.12)
      material.opacity = 0.16 * amount
      sheets.forEach(sheet => {
        sheet.mesh.position.x = sheet.baseX + Math.sin(time * 0.05 + sheet.drift) * 3
      })
    },
    dispose() {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    }
  }
}
