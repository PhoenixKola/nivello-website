import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  Mesh,
  RedFormat,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4
} from 'three'
import { SUN_DIR, WORLD, groundHeight, routeSamples } from './layout'
import { clamp } from './noise'

export const GLOW_SLOTS = 8

const vertexShader = /* glsl */ `
  attribute vec2 aBake;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vBake;
  void main() {
    vPos = position;
    vNormal = normal;
    vBake = aBake;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec2 vBake;

  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform vec3 uAmbSky;
  uniform vec3 uAmbGround;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFront;
  uniform float uTopo;
  uniform float uWarm;
  uniform float uDay;
  uniform vec3 uShock;
  uniform float uShockAmp;
  uniform sampler2D uRoute;
  uniform vec2 uRouteRange;
  uniform vec3 uBlue;
  uniform vec3 uGold;
  uniform vec4 uGlow[${GLOW_SLOTS}];
  uniform vec3 uGlowColor[${GLOW_SLOTS}];

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float vnoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
                   mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
                   mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) {
    float a = 0.5; float s = 0.0;
    for (int i = 0; i < 4; i++) { s += vnoise(p) * a; p = p * 2.03 + 11.7; a *= 0.5; }
    return s;
  }

  void main() {
    vec3 P = vPos;
    vec3 Ng = normalize(vNormal);
    vec3 toCam = cameraPosition - P;
    float dist = length(toCam);
    vec3 V = toCam / dist;

    // Material: slate rock with warm sedimentary bands, teal growth on flats, dust on sunlit ledges.
    float slope = 1.0 - Ng.y;
    float n1 = fbm3(P * vec3(0.012, 0.02, 0.012));
    float n2 = fbm3(P * vec3(0.05, 0.7, 0.05));
    float n3 = vnoise(P * 1.6);
    float band = sin(P.y * 0.36 + n1 * 4.0 + n2 * 0.9) * 0.5 + 0.5;

    vec3 slateDark = vec3(0.045, 0.072, 0.115);
    vec3 slateMid = vec3(0.14, 0.20, 0.28);
    vec3 sand = vec3(0.42, 0.31, 0.22);
    vec3 oxide = vec3(0.30, 0.16, 0.11);
    vec3 teal = vec3(0.05, 0.15, 0.14);
    vec3 albedo = mix(slateDark, slateMid, smoothstep(0.2, 0.8, n1 + n2 * 0.35));
    albedo = mix(albedo, oxide, smoothstep(0.6, 0.9, band) * smoothstep(0.15, 0.55, slope) * 0.6);
    albedo = mix(albedo, sand, smoothstep(0.82, 1.0, band) * smoothstep(0.1, 0.5, slope) * 0.5);
    albedo = mix(albedo, teal, (1.0 - smoothstep(0.04, 0.2, slope)) * smoothstep(0.35, 0.7, n1) * 0.7);
    albedo *= 0.88 + 0.24 * n3 + 0.2 * (n2 - 0.5);

    // Micro relief perturbs the lit normal so faces never read as flat polygons.
    vec3 jitter = vec3(vnoise(P * 1.9), vnoise(P * 1.9 + 7.1), vnoise(P * 1.9 + 3.3)) - 0.5;
    jitter += (vec3(vnoise(P * 5.1), vnoise(P * 5.1 + 2.0), vnoise(P * 5.1 + 9.0)) - 0.5) * 0.18;
    vec3 N = normalize(Ng + jitter * (0.35 + slope * 0.6));

    // The world wakes up as the signal passes: dormant ahead of the front, lit behind it.
    float awake = smoothstep(-14.0, 12.0, P.z - uFront);
    float wave = exp(-pow((P.z - uFront) / 9.0, 2.0));
    float light = mix(0.07, 1.0, awake);

    float ndl = max(dot(N, uSunDir), 0.0);
    vec3 direct = uSunColor * ndl * vBake.x;
    vec3 ambient = mix(uAmbGround, uAmbSky, N.y * 0.5 + 0.5) * vBake.y;
    float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    vec3 col = albedo * (direct + ambient) * light;
    col += uAmbSky * rim * 0.1 * vBake.y * light * (0.4 + 0.6 * ndl);

    // Local pool lights from the architecture.
    for (int i = 0; i < ${GLOW_SLOTS}; i++) {
      vec4 g = uGlow[i];
      if (g.w > 0.0) {
        vec3 d = g.xyz - P;
        float dl = length(d);
        float fall = 1.0 / pow(1.0 + dl / g.w, 2.0);
        float wrap = 0.35 + 0.65 * max(dot(N, d / dl), 0.0);
        col += albedo * uGlowColor[i] * fall * wrap * 2.2;
      }
    }

    // Signal route: a blue-to-gold ribbon of light carved into the canyon floor.
    float rc = clamp((uRouteRange.x - P.z) / (uRouteRange.x - uRouteRange.y), 0.0, 1.0);
    float rx = texture2D(uRoute, vec2(rc, 0.5)).r;
    float rd = abs(P.x - rx);
    float width = 0.42 + dist * 0.0016;
    float core = exp(-pow(rd / width, 2.0));
    float halo = exp(-rd / (2.6 + dist * 0.004));
    float pulse = 0.65 + 0.9 * pow(0.5 + 0.5 * sin(P.z * 0.11 - uTime * 2.4), 5.0);
    vec3 routeColor = mix(uBlue, uGold, smoothstep(0.02, 0.55, rc));
    float lit = smoothstep(-6.0, 6.0, P.z - uFront - 6.0);
    col += routeColor * (core * 2.0 * pulse + halo * 0.26) * lit;
    col += vec3(1.0, 0.82, 0.5) * core * core * 0.55 * lit;
    col += routeColor * exp(-pow(rd / 14.0, 2.0)) * 0.16 * lit;

    // Topography: contour lines read as the dormant land's blueprint, strongest at the wave front and in the process chapter.
    float cy = P.y * 0.22;
    float cw = fwidth(cy) * 1.4 + 0.004;
    float contour = 1.0 - smoothstep(0.0, cw, abs(fract(cy) - 0.5) * 2.0);
    float major = 1.0 - smoothstep(0.0, fwidth(cy * 0.2) * 1.8 + 0.003, abs(fract(cy * 0.2) - 0.5) * 2.0);
    float topoAmt = wave * 0.9 + uTopo * 0.55;
    col += mix(uBlue, vec3(1.0), 0.25) * (contour * 0.5 + major * 0.9) * topoAmt * smoothstep(0.2, 0.6, awake + wave) * 0.55 * clamp(1.0 - dist * 0.004, 0.0, 1.0);
    col += uGold * wave * 0.28 * (0.4 + albedo.r * 2.0) * exp(-rd / 40.0);

    // Ignition shock-wave expanding from the first pulse.
    float sd = length(P.xz - uShock.xy);
    float shock = exp(-pow((sd - uShock.z) / 4.5, 2.0)) * uShockAmp;
    col += mix(uGold, uBlue, smoothstep(0.0, 160.0, sd)) * shock * 0.8;

    // Warm accent that grows as projects launch.
    col += uGold * uWarm * 0.025 * (n1 + 0.2);

    // Atmosphere: exponential distance fog, valley mist, light scatter toward the sun.
    vec3 vdir = -V;
    float fog = 1.0 - exp(-pow(dist * uFogDensity, 2.0));
    float mist = smoothstep(12.0, -3.0, P.y) * (1.0 - exp(-dist * 0.006)) * 0.5;
    float scatter = pow(max(dot(vdir, uSunDir), 0.0), 4.0);
    vec3 fogColor = mix(uFogColor, uSunColor * 0.8 + uFogColor * 0.4, scatter * 0.55);
    col = mix(col, fogColor, clamp(fog + mist, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export type Terrain = {
  mesh: Mesh
  material: ShaderMaterial
  uniforms: ShaderMaterial['uniforms']
  dispose(): void
}

export function createTerrain(step = 1.6, low = false): Terrain {
  const nx = Math.round((WORLD.xMax - WORLD.xMin) / step)
  const nz = Math.round((WORLD.zMax - WORLD.zMin) / step)
  const cols = nx + 1
  const rows = nz + 1
  const count = cols * rows

  const positions = new Float32Array(count * 3)
  const heights = new Float32Array(count)
  for (let iz = 0; iz < rows; iz += 1) {
    const z = WORLD.zMax - iz * step
    for (let ix = 0; ix < cols; ix += 1) {
      const x = WORLD.xMin + ix * step
      const h = groundHeight(x, z)
      const index = iz * cols + ix
      heights[index] = h
      positions[index * 3] = x
      positions[index * 3 + 1] = h
      positions[index * 3 + 2] = z
    }
  }

  const sample = (x: number, z: number) => {
    const fx = clamp((x - WORLD.xMin) / step, 0, cols - 1.001)
    const fz = clamp((WORLD.zMax - z) / step, 0, rows - 1.001)
    const ix = Math.floor(fx)
    const iz = Math.floor(fz)
    const tx = fx - ix
    const tz = fz - iz
    const i = iz * cols + ix
    return (
      (heights[i] * (1 - tx) + heights[i + 1] * tx) * (1 - tz) +
      (heights[i + cols] * (1 - tx) + heights[i + cols + 1] * tx) * tz
    )
  }

  // Bake: soft cast shadows from the key light + a cavity term, so valleys feel deep without runtime shadow maps.
  const bake = new Float32Array(count * 2)
  const lx = SUN_DIR[0]
  const lz = SUN_DIR[2]
  const horiz = Math.hypot(lx, lz)
  const slope = SUN_DIR[1] / horiz
  const dx = lx / horiz
  const dz = lz / horiz

  const blur = new Float32Array(count)
  const tmp = new Float32Array(count)
  const radius = 7
  for (let iz = 0; iz < rows; iz += 1) {
    let sum = 0
    for (let k = -radius; k <= radius; k += 1) sum += heights[iz * cols + clamp(k, 0, cols - 1)]
    for (let ix = 0; ix < cols; ix += 1) {
      tmp[iz * cols + ix] = sum / (radius * 2 + 1)
      sum += heights[iz * cols + Math.min(cols - 1, ix + radius + 1)] - heights[iz * cols + Math.max(0, ix - radius)]
    }
  }
  for (let ix = 0; ix < cols; ix += 1) {
    let sum = 0
    for (let k = -radius; k <= radius; k += 1) sum += tmp[clamp(k, 0, rows - 1) * cols + ix]
    for (let iz = 0; iz < rows; iz += 1) {
      blur[iz * cols + ix] = sum / (radius * 2 + 1)
      sum += tmp[Math.min(rows - 1, iz + radius + 1) * cols + ix] - tmp[Math.max(0, iz - radius) * cols + ix]
    }
  }

  for (let iz = 0; iz < rows; iz += 1) {
    const z = WORLD.zMax - iz * step
    for (let ix = 0; ix < cols; ix += 1) {
      const x = WORLD.xMin + ix * step
      const index = iz * cols + ix
      const h = heights[index]
      let minVis = 2
      for (let s = 3; s < 150; s += s < 30 ? 3 : 6) {
        const ray = h + slope * s
        const terrain = sample(x + dx * s, z + dz * s)
        const vis = (ray - terrain) / (0.1 * s + 1.5)
        if (vis < minVis) minVis = vis
        if (vis < -4) break
      }
      const shadow = clamp((minVis + 0.15) / 1.1)
      const cavity = clamp(1 + (h - blur[index]) * 0.055, 0.28, 1.12)
      bake[index * 2] = shadow * shadow * (3 - 2 * shadow)
      bake[index * 2 + 1] = cavity
    }
  }

  const indices = new Uint32Array(nx * nz * 6)
  let w = 0
  for (let iz = 0; iz < nz; iz += 1) {
    for (let ix = 0; ix < nx; ix += 1) {
      const a = iz * cols + ix
      const b = a + 1
      const c = a + cols
      const d = c + 1
      indices[w++] = a
      indices[w++] = b
      indices[w++] = c
      indices[w++] = b
      indices[w++] = d
      indices[w++] = c
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('aBake', new BufferAttribute(bake, 2))
  geometry.setIndex(new BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()

  const routeData = routeSamples(1024)
  const routeHalf = new Uint16Array(routeData.length)
  routeData.forEach((value, index) => {
    routeHalf[index] = DataUtils.toHalfFloat(value)
  })
  const routeTexture = new DataTexture(routeHalf, 1024, 1, RedFormat, HalfFloatType)
  routeTexture.minFilter = LinearFilter
  routeTexture.magFilter = LinearFilter
  routeTexture.needsUpdate = true

  const sunDir = new Vector3(...SUN_DIR).normalize()
  const uniforms: ShaderMaterial['uniforms'] = {
    uTime: { value: 0 },
    uSunDir: { value: sunDir },
    uSunColor: { value: new Color(1, 0.8, 0.55) },
    uAmbSky: { value: new Color(0.2, 0.3, 0.5) },
    uAmbGround: { value: new Color(0.05, 0.07, 0.1) },
    uFogColor: { value: new Color(0.1, 0.2, 0.35) },
    uFogDensity: { value: 0.004 },
    uFront: { value: 40 },
    uTopo: { value: 0 },
    uWarm: { value: 0 },
    uDay: { value: 0 },
    uShock: { value: new Vector3(0, 10, 0) },
    uShockAmp: { value: 0 },
    uRoute: { value: routeTexture },
    uRouteRange: { value: new Vector2(WORLD.zMax, WORLD.zMin) },
    uBlue: { value: new Color(0x159bff) },
    uGold: { value: new Color(0xffbf43) },
    uGlow: { value: Array.from({ length: GLOW_SLOTS }, () => new Vector4(0, 0, 0, 0)) },
    uGlowColor: { value: Array.from({ length: GLOW_SLOTS }, () => new Color(0, 0, 0)) }
  }

  // Phones and weak GPUs: fewer noise octaves and no micro-relief jitter keep the ground shader cheap.
  const lowFragment = fragmentShader
    .replace('for (int i = 0; i < 4; i++)', 'for (int i = 0; i < 2; i++)')
    .replace(/vec3 jitter = [\s\S]*?vec3 N = normalize\(Ng \+ jitter \* \(0\.35 \+ slope \* 0\.6\)\);/, 'vec3 N = Ng;')
  const material = new ShaderMaterial({ vertexShader, fragmentShader: low ? lowFragment : fragmentShader, uniforms })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false

  return {
    mesh,
    material,
    uniforms,
    dispose() {
      geometry.dispose()
      material.dispose()
      routeTexture.dispose()
    }
  }
}
