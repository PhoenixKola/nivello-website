import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Color,
  DirectionalLight,
  FogExp2,
  HalfFloatType,
  HemisphereLight,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer
} from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { CHAPTER_IDS, REVIEW_FROM, REVIEW_SPAN, cinematic, reviewCenter } from '@/lib/cinematic/store'
import { galleryWeight, reviewsWeight, sampleCamera, type Pose } from './camera'
import { createConstruction } from './construction'
import { createMist, createMotes } from './fx'
import { createGallery, type GalleryProject } from './gallery'
import { FINAL, MILESTONES, MONUMENT, PLAZA, SUN_DIR, groundHeight, routeX } from './layout'
import { createMonument } from './monument'
import { createReviews, reviewPos, reviewZ, type ReviewData } from './reviews'
import { createScatter } from './scatter'
import { clamp, ease, lerp, smooth, smoothstep } from './noise'
import { createAtmosphere, evaluateAtmosphere } from './palette'
import { createSky } from './sky'
import { GLOW_SLOTS, createTerrain } from './terrain'
import { glowTexture } from './textures'
import { createVista } from './vista'

export type EngineOptions = {
  canvas: HTMLCanvasElement
  root: HTMLElement
  projects: GalleryProject[]
  reviews: ReviewData[]
  lowPower: boolean
}

export type Engine = { dispose(): void }

const SUN_ELEVATION: [number, number][] = [[0, 0.12], [0.9, 0.17], [1.6, 0.34], [2.6, 0.34], [3.7, 0.3], [4.0, 0.5], [4.92, 0.5], [5.1, 0.1], [5.9, 0.08], [6.3, 0.12], [7, 0.4]]

function sunElevation(u: number) {
  if (u <= 0) return SUN_ELEVATION[0][1]
  for (let i = 0; i < SUN_ELEVATION.length - 1; i += 1) {
    const [u0, v0] = SUN_ELEVATION[i]
    const [u1, v1] = SUN_ELEVATION[i + 1]
    if (u <= u1) return lerp(v0, v1, smooth((u - u0) / (u1 - u0)))
  }
  return SUN_ELEVATION[SUN_ELEVATION.length - 1][1]
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const { canvas, root, projects, reviews: reviewData } = options
  // ?cin=snap renders the exact scroll position without easing or the intro (used for visual checks on software GL).
  const snap = new URLSearchParams(window.location.search).get('cin') === 'snap'
  let lowPower = options.lowPower || snap
  const automated = typeof navigator !== 'undefined' && navigator.webdriver

  const renderer = new WebGLRenderer({ canvas, antialias: lowPower, alpha: false, powerPreference: 'high-performance' })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

  const scene = new Scene()
  scene.fog = new FogExp2(0x112233, 0.004)
  // Soft studio reflections give metals and clearcoats believable highlights without extra lights.
  const pmrem = new PMREMGenerator(renderer)
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04)
  scene.environment = envTarget.texture
  scene.environmentIntensity = 0.3
  pmrem.dispose()
  const camera = new PerspectiveCamera(40, 1, 0.5, 2600)

  const sky = createSky()
  scene.add(sky.group)
  const terrain = createTerrain(lowPower ? 2.4 : 1.6)
  scene.add(terrain.mesh)
  const construction = createConstruction()
  scene.add(construction.group)
  const gallery = createGallery(projects, maxAnisotropy)
  scene.add(gallery.group)
  const vista = createVista()
  scene.add(vista.group)
  const reviews = createReviews(reviewData)
  scene.add(reviews.group)
  const motes = createMotes(lowPower ? 450 : 1100)
  scene.add(motes.points)
  const mist = createMist()
  scene.add(mist.group)
  const scatter = createScatter(lowPower ? 600 : 1100)
  scene.add(scatter.group)
  const monument = await createMonument()
  scene.add(monument.group)
  const finalMark = await createMonument({ x: FINAL.x, z: FINAL.z, size: FINAL.size, final: true })
  scene.add(finalMark.group)

  // Visual-check hooks (only with ?cin=snap): hide layers or take over the camera.
  const debug: { override?: Pose; hide: string[] } = { hide: [] }
  if (snap) {
    ;(window as unknown as { __cin: unknown }).__cin = { debug, layout: { MILESTONES, MONUMENT, PLAZA, ground: groundHeight }, groups: { scatter: scatter.group, mist: mist.group, sky: sky.group, terrain: terrain.mesh, construction: construction.group, gallery: gallery.group, vista: vista.group, reviews: reviews.group, monument: monument.group, finalMark: finalMark.group, motes: motes.points } }
  }

  const hemisphere = new HemisphereLight(0x6a8ac8, 0x10141e, 1.4)
  const fill = new DirectionalLight(0x8fb4ff, 0.9)
  const sunLight = new DirectionalLight(0xffc880, 2)
  scene.add(hemisphere, sunLight, sunLight.target, fill, fill.target)

  const pulseMaterial = new SpriteMaterial({ map: glowTexture(), color: 0xffbf43, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false })
  const pulse = new Sprite(pulseMaterial)
  scene.add(pulse)

  // Post: HDR bloom only where light is real. Skipped on weaker devices.
  let composer: EffectComposer | undefined
  let bloom: UnrealBloomPass | undefined
  const buildComposer = () => {
    const size = renderer.getDrawingBufferSize(new Vector2())
    const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 4 })
    composer = new EffectComposer(renderer, target)
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.4, 0.5, 1.15)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
  }
  if (!lowPower) buildComposer()

  const atmosphere = createAtmosphere()
  const pose: Pose = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0, fov: 40, sx: 0, roll: 0 }
  const introPose = { px: 2, pz: 17, lx: 0, lz: -6 }
  const sunDir = new Vector3()
  const camPos = new Vector3()
  const lookAt = new Vector3()
  const forward = new Vector3()
  const right = new Vector3()
  const upVec = new Vector3(0, 1, 0)
  const tint = new Color()
  const portal = { x: 0, y: 0, z: 0, rotY: 0, right: [1, 0] as [number, number], inward: [0, 1] as [number, number] }
  const blue = new Color(0x159bff)
  const gold = new Color(0xffbf43)

  // Scroll metrics
  let tops: number[] = []
  let lengths: number[] = []
  const measure = () => {
    const spacers = root.querySelector<HTMLElement>('[data-cin-spacers]')
    if (!spacers) return
    tops = []
    lengths = []
    Array.from(spacers.children).forEach((child, index) => {
      const el = child as HTMLElement
      tops.push(window.scrollY + el.getBoundingClientRect().top)
      const isLast = index === spacers.children.length - 1
      lengths.push(Math.max(1, isLast ? el.offsetHeight - window.innerHeight : el.offsetHeight))
    })
  }

  const overlays = Array.from(root.querySelectorAll<HTMLElement>('[data-cin-overlay]'))
  const rootStyle = root.style

  let width = 1
  let height = 1
  const resize = () => {
    width = window.innerWidth
    height = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.35)
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    composer?.setPixelRatio(dpr)
    composer?.setSize(width, height)
    bloom?.setSize(width * dpr * 0.5, height * dpr * 0.5)
    camera.aspect = width / height
    measure()
  }

  // Input
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const onPointer = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
  }

  // Intro
  const introDuration = window.innerWidth < 760 ? 3 : 4.8
  let introT = snap ? 1 : 0
  cinematic.set({ introActive: !snap })
  root.dataset.intro = snap ? 'done' : 'playing'

  // State
  let u = 0
  let targetU = 0
  let day = document.documentElement.classList.contains('dark') ? 0 : 1
  let focus = cinematic.get().workIndex
  let focusVel = 0
  let lastWork = focus
  let focusTarget = focus
  let appMix = cinematic.get().workApp ? 1 : 0
  let proofFocus = cinematic.get().proofIndex
  let time = 0
  let last = performance.now()
  let frame = 0
  let disposed = false
  let inView = true
  let slowFrames = 0
  let sampled = 0
  let contextLost = false

  const updateScroll = () => {
    if (!tops.length) return
    const y = window.scrollY
    let c = 0
    while (c < tops.length - 1 && y >= tops[c + 1]) c += 1
    const local = clamp((y - tops[c]) / lengths[c])
    targetU = c + local
    const bottom = tops[tops.length - 1] + lengths[tops.length - 1] + window.innerHeight
    inView = y < bottom + window.innerHeight * 0.2
    if (cinematic.get().introActive && y > 24) cinematic.set({ introActive: false })
    const offstage = y >= tops[tops.length - 1] + lengths[tops.length - 1] + 40
    if (offstage !== (root.dataset.offstage === 'true')) {
      if (offstage) root.dataset.offstage = 'true'
      else delete root.dataset.offstage
    }
  }

  const render = (now: number) => {
    if (disposed) return
    frame = window.requestAnimationFrame(render)
    if (document.visibilityState !== 'visible' || contextLost) {
      last = now
      return
    }
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
    last = now
    if (!inView) return
    time += dt
    const store = cinematic.get()

    // adaptive quality: drop post-processing once if the device clearly cannot keep up
    if (!automated && composer && sampled < 120) {
      sampled += 1
      if (sampled > 20 && dt > 0.042) slowFrames += 1
      if (sampled === 120 && slowFrames > 60) {
        composer.dispose()
        composer = undefined
        bloom = undefined
        lowPower = true
        resize()
      }
    }

    // intro
    if (introT < 1) {
      const speed = store.introActive ? 1 / introDuration : 2.2
      introT = Math.min(1, introT + dt * speed)
      if (introT >= 1) {
        cinematic.set({ introActive: false })
        root.dataset.intro = 'done'
      }
    }
    const introE = ease.inOut(introT)
    if (introT > 0.36 && root.dataset.intro === 'playing') root.dataset.intro = 'text'

    updateScroll()
    u += (targetU - u) * (snap ? 1 : 1 - Math.exp(-dt * 6.5))
    if (Math.abs(targetU - u) < 0.0004) u = targetU

    // atmosphere
    const dayTarget = document.documentElement.classList.contains('dark') ? 0 : 1
    day += (dayTarget - day) * (1 - Math.exp(-dt * 5))
    evaluateAtmosphere(u, day, atmosphere)
    const elevation = sunElevation(u)
    sunDir.set(SUN_DIR[0], elevation * Math.hypot(SUN_DIR[0], SUN_DIR[2]) / 0.94, SUN_DIR[2]).normalize()

    // gallery focus (critically damped so the camera glides between portals)
    const k = 22
    const c = 2 * Math.sqrt(k)
    if (store.workIndex !== lastWork) {
      const n = projects.length
      let d = (((store.workIndex - lastWork) % n) + n) % n
      if (d > n / 2) d -= n
      focusTarget += d
      lastWork = store.workIndex
    }
    focusVel += ((focusTarget - focus) * k - focusVel * c) * dt
    focus += focusVel * dt
    if (snap) {
      focus = focusTarget
      focusVel = 0
    }
    appMix += ((store.workApp ? 1 : 0) - appMix) * (1 - Math.exp(-dt * 7))
    proofFocus += (store.proofIndex - proofFocus) * (1 - Math.exp(-dt * 5))

    // camera
    sampleCamera(u, pose)
    const gw = galleryWeight(u)
    if (gw > 0.001) {
      gallery.portalAt(focus, portal)
      const mobile = width < 900
      // Inside the chamber: the camera orbits near the centre and turns to face the chosen exhibit.
      const dirX = portal.x - PLAZA.x
      const dirZ = portal.z - PLAZA.z
      const len = Math.hypot(dirX, dirZ) || 1
      const orbit = mobile ? 0 : 9.5 - clamp(Math.abs(focusVel) * 1.2, 0, 4)
      const sway = Math.sin(time * 0.25) * 0.8
      const gx = PLAZA.x + (dirX / len) * orbit
      const gz = PLAZA.z + (dirZ / len) * orbit
      pose.px = lerp(pose.px, gx, gw)
      pose.py = lerp(pose.py, 5.9 + Math.sin(time * 0.31) * 0.2, gw)
      pose.pz = lerp(pose.pz, gz, gw)
      pose.lx = lerp(pose.lx, portal.x + portal.right[0] * sway, gw)
      pose.ly = lerp(pose.ly, portal.y - 0.1, gw)
      pose.lz = lerp(pose.lz, portal.z + portal.right[1] * sway, gw)
      pose.fov = lerp(pose.fov, 38 + clamp(Math.abs(focusVel) * 1.4, 0, 5), gw)
      pose.sx = lerp(pose.sx, 0.14, gw)
      pose.roll = lerp(pose.roll, 0, gw)
    }
    const rw = reviewsWeight(u)
    if (rw > 0.001) {
      // Through the canyon: forward motion is scroll; the active monolith draws the gaze.
      const local = clamp(u - 5)
      const l0 = reviewCenter(0)
      const l5 = reviewCenter(reviewData.length - 1)
      const slope = (reviewZ(reviewData.length - 1) - reviewZ(0)) / (l5 - l0)
      const z = reviewZ(0) + 26 + (local - l0) * slope
      const x = routeX(z) + Math.sin(time * 0.3) * 0.6
      const target = reviewPos(clamp(Math.round(proofFocus), 0, reviewData.length - 1))
      const ahead = z - 34
      pose.px = lerp(pose.px, x, rw)
      pose.py = lerp(pose.py, groundHeight(x, z) + 5.6, rw)
      pose.pz = lerp(pose.pz, z, rw)
      pose.lx = lerp(pose.lx, lerp(routeX(ahead), target.x, 0.42), rw)
      pose.ly = lerp(pose.ly, 8, rw)
      pose.lz = lerp(pose.lz, lerp(ahead, target.z, 0.42), rw)
      pose.fov = lerp(pose.fov, 42, rw)
      pose.sx = lerp(pose.sx, 0.12, rw)
      pose.roll = lerp(pose.roll, 0, rw)
    }
    if (width < 900) {
      // portrait screens have no side room for type: centre the mark instead of offsetting it
      const lw = smoothstep(1.25, 1.5, u) * (1 - smoothstep(1.85, 2.0, u))
      pose.lx = lerp(pose.lx, MONUMENT.x, lw * 0.92)
    }
    if (debug.override) Object.assign(pose, debug.override)
    const intro = (1 - introE) * (1 - smoothstep(0.02, 0.14, u))
    if (intro > 0.001) {
      const g = groundHeight(introPose.px, introPose.pz)
      pose.px = lerp(pose.px, introPose.px, intro)
      pose.py = lerp(pose.py, g + 0.8, intro)
      pose.pz = lerp(pose.pz, introPose.pz, intro)
      pose.lx = lerp(pose.lx, introPose.lx, intro)
      pose.ly = lerp(pose.ly, g + 0.1, intro)
      pose.lz = lerp(pose.lz, introPose.lz, intro)
      pose.fov = lerp(pose.fov, 56, intro)
      pose.roll = lerp(pose.roll, 0.08, intro)
    }

    pointer.x += (pointer.tx - pointer.x) * (1 - Math.exp(-dt * 3))
    pointer.y += (pointer.ty - pointer.y) * (1 - Math.exp(-dt * 3))
    camPos.set(pose.px, pose.py, pose.pz)
    lookAt.set(pose.lx, pose.ly, pose.lz)
    forward.subVectors(lookAt, camPos).normalize()
    right.crossVectors(forward, upVec).normalize()
    const parallax = width < 720 ? 0.25 : 1
    camPos.addScaledVector(right, pointer.x * 0.9 * parallax).addScaledVector(upVec, -pointer.y * 0.5 * parallax)
    lookAt.addScaledVector(right, pointer.x * 0.5 * parallax)
    const clearance = groundHeight(camPos.x, camPos.z) + 2.4
    if (camPos.y < clearance) camPos.y = clearance
    camera.position.copy(camPos)
    camera.lookAt(lookAt)
    camera.rotateZ(pose.roll)
    camera.fov = pose.fov * (width < 720 ? 1.25 : 1)
    const sx = width < 900 ? 0 : pose.sx
    const over = smoothstep(6.4, 6.9, u)
    const sy = (width < 900 ? 0.09 + 0.08 * gw : 0) + over * (width < 900 ? 0.14 : 0.2)
    camera.setViewOffset(width, height, -sx * width, sy * height, width, height)
    camera.updateMatrixWorld()

    // ignition: the front of the signal that wakes the landscape
    const frontBase = lerp(-150, -330, smoothstep(0.2, 1.0, u))
    const front = lerp(8, frontBase, introE)
    const frontLerped = lerp(front, -900, smoothstep(1.0, 1.5, u))

    // build progress 0..5: design (chapter 2) raises stages 0-2, development (chapter 3) raises stages 3-4
    const s = u < 2 ? 0 : u < 3 ? (u - 2) * 3 : u < 4 ? 3 + (u - 3) * 2 : 5
    const awake = smoothstep(0.6, 1.0, u)
    construction.update(s, time, awake)
    gallery.update(time, focus, appMix, 0.25 + 0.75 * gw)
    const logoBeat = smoothstep(1.0, 1.5, u) * (1 - smoothstep(1.9, 2.3, u))
    monument.update(u, time, logoBeat * 0.6, 0.28 * smoothstep(0.55, 1, introE) * (1 - smoothstep(0.7, 1.0, u)))
    finalMark.update(u, time, smoothstep(5.95, 6.4, u), 0)
    const proofWeight = smoothstep(5.0, 5.2, u) * (1 - smoothstep(6.0, 6.3, u))
    vista.update(time, proofFocus, proofWeight, camera.position, sunDir)
    reviews.update(time, proofFocus, smoothstep(4.9, 5.15, u) * (1 - 0.7 * smoothstep(5.95, 6.25, u)))
    if (u > 4.95 && u < 6.05) {
      const idx = clamp(Math.floor(((u - 5 - REVIEW_FROM) / REVIEW_SPAN) * reviewData.length), 0, reviewData.length - 1)
      cinematic.set({ proofIndex: idx })
    }

    // accent colour of the focused project tints the hall
    const accentMix = gw
    tint.copy(gallery.accent)

    // atmosphere -> materials
    const a = atmosphere
    const sunColor = a.sun.clone().multiplyScalar(a.sunIntensity)
    const tu = terrain.uniforms
    tu.uTime.value = time
    tu.uSunDir.value.copy(sunDir)
    tu.uSunColor.value.copy(sunColor)
    tu.uAmbSky.value.copy(a.ambientSky)
    tu.uAmbGround.value.copy(a.ambientGround)
    tu.uFogColor.value.copy(a.fog)
    tu.uFogDensity.value = a.fogDensity
    tu.uFront.value = frontLerped
    tu.uTopo.value = smoothstep(1.8, 2.1, u) * (1 - smoothstep(3.0, 3.9, u)) + 0.25 * gw
    tu.uWarm.value = smoothstep(1.2, 2.0, u)
    tu.uShock.value.set(0, 10, introE * 240)
    tu.uShockAmp.value = Math.pow(1 - introE, 0.6) * (1 - smoothstep(0.1, 0.3, u))

    const glow = tu.uGlow.value as Vector4[]
    const glowColor = tu.uGlowColor.value as Color[]
    for (let i = 0; i < GLOW_SLOTS; i += 1) glow[i].set(0, 0, 0, 0)
    const emerge = smoothstep(0.8, 1.5, u)
    glow[0].set(MONUMENT.x, monument.top * 0.6, MONUMENT.z + 14, 46)
    glowColor[0].copy(blue).lerp(gold, 0.45).multiplyScalar(0.3 * emerge + 0.05)
    construction.glows.forEach((g, i) => {
      const build = g.build()
      glow[1 + i].set(g.x, g.y, g.z, g.r)
      glowColor[1 + i].copy(i % 2 ? blue : gold).multiplyScalar(0.38 * build)
    })
    glow[6].set(PLAZA.x, 6, PLAZA.z - 16, 34)
    glowColor[6].copy(tint).multiplyScalar(0.4 * accentMix)
    const pulseZ = clamp(front + 6, -330, 40)
    glow[7].set(routeX(pulseZ), groundHeight(routeX(pulseZ), pulseZ) + 2, pulseZ, 16)
    glowColor[7].copy(gold).multiplyScalar(0.8 * (1 - smoothstep(0.25, 0.9, u)))
    pulse.position.set(routeX(pulseZ), groundHeight(routeX(pulseZ), pulseZ) + 1.2, pulseZ)
    pulse.scale.setScalar((2.2 + 2.8 * introE) + Math.sin(time * 5) * 0.5)
    pulseMaterial.opacity = 0.75 * (1 - smoothstep(0.25, 0.9, u)) * (introT < 0.02 ? 0.5 + introT * 25 : 1)

    sky.update(camera.position, time)
    const su = sky.uniforms
    su.uTop.value.copy(a.skyTop)
    su.uMid.value.copy(a.skyMid)
    su.uHorizon.value.copy(a.skyHorizon)
    su.uFog.value.copy(a.fog)
    su.uSun.value.copy(a.sun)
    su.uSunDir.value.copy(sunDir)
    su.uSunPower.value = clamp(a.sunIntensity * 0.45, 0.2, 1.5)
    su.uStars.value = a.stars + (1 - introE) * 0.6
    su.uClouds.value = a.clouds
    sky.ridgeMaterials.forEach(material => {
      const mixAmount = material.userData.mix as number
      material.color.copy(a.fog).lerp(a.skyHorizon, 0.35).multiplyScalar(0.55 + 0.5 * mixAmount)
    })

    const wu = vista.waterUniforms
    wu.uTop.value.copy(a.skyTop)
    wu.uMid.value.copy(a.skyMid)
    wu.uHorizon.value.copy(a.skyHorizon)
    wu.uFog.value.copy(a.fog)
    wu.uSun.value.copy(a.sun)
    wu.uSunDir.value.copy(sunDir)
    wu.uFogDensity.value = a.fogDensity
    wu.uSunPower.value = su.uSunPower.value

    const fog = scene.fog as FogExp2
    fog.color.copy(a.fog)
    fog.density = a.fogDensity
    hemisphere.color.copy(a.ambientSky)
    hemisphere.groundColor.copy(a.ambientGround)
    hemisphere.intensity = 1.2 + day * 0.5
    sunLight.color.copy(a.sun)
    sunLight.intensity = a.sunIntensity * 0.85
    sunLight.position.copy(camera.position).addScaledVector(sunDir, 120)
    sunLight.target.position.copy(camera.position)
    // soft key from the camera side keeps the faces we are looking at readable
    fill.position.copy(camera.position).addScaledVector(upVec, 18).addScaledVector(right, -10)
    fill.target.position.copy(lookAt)
    fill.intensity = (0.85 + 0.4 * day) * (1 - 0.45 * gw)

    renderer.toneMappingExposure = a.exposure
    if (bloom) bloom.strength = a.bloom * 0.34 + 0.03 + 0.3 * (1 - introE) * (1 - smoothstep(0.1, 0.3, u))

    motes.update(camera.position, time, tint, 0.55 + 0.25 * (1 - day))
    mist.update(a.fog, a.sun, time, (1 - 0.5 * gw) * (0.1 + 0.9 * smoothstep(0.45, 1, introE)))
    construction.group.visible = u > 1.7 || Boolean(debug.override)
    gallery.group.visible = u > 3.7 || Boolean(debug.override)
    vista.group.visible = u > 4.7 || Boolean(debug.override)
    reviews.group.visible = u > 4.7 || Boolean(debug.override)
    finalMark.group.visible = u > 4.9 || Boolean(debug.override)
    monument.group.visible = true
    if (snap) {
      const groups = (window as unknown as { __cin: { groups: Record<string, { visible: boolean }> } }).__cin.groups
      debug.hide.forEach(name => {
        if (groups[name]) groups[name].visible = false
      })
    }

    // chapter + DOM overlays
    const chapter = Math.min(CHAPTER_IDS.length - 1, Math.floor(u + 0.0001))
    const beat = chapter === 2 ? Math.min(2, Math.floor((u - 2) * 3)) : chapter === 3 ? Math.min(1, Math.floor((u - 3) * 2)) : 0
    cinematic.set({ chapter, processStage: beat })
    const lastChapter = CHAPTER_IDS.length - 1
    overlays.forEach(el => {
      const index = Number(el.dataset.cinOverlay)
      const from = Number(el.dataset.cinFrom ?? 0)
      const to = Number(el.dataset.cinTo ?? 1)
      const local = u - index
      const fadeIn = from <= 0 && index === 0 ? 1 : smoothstep(from, from + 0.06, local)
      const fadeOut = to >= 1 ? (index === lastChapter ? 1 : 1 - smoothstep(0.94, 1, local)) : 1 - smoothstep(to - 0.07, to, local)
      const o = local < from - 0.001 || local > to + 0.001 ? 0 : fadeIn * fadeOut
      el.style.opacity = o.toFixed(3)
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden'
      el.style.pointerEvents = o > 0.55 ? 'auto' : 'none'
      el.dataset.active = o > 0.5 ? 'true' : 'false'
      const travel = index === lastChapter ? 0 : (1 - fadeIn) * 26 - (1 - fadeOut) * 16
      el.style.transform = `translate3d(0, ${travel.toFixed(1)}px, 0)`
    })
    let wipe = -1
    for (let boundary = 1; boundary < CHAPTER_IDS.length; boundary += 1) {
      const q = u - boundary
      if (Math.abs(q) < 0.07) wipe = (q + 0.07) / 0.14
    }
    rootStyle.setProperty('--cin-wipe', wipe.toFixed(3))
    rootStyle.setProperty('--cin-wipe-o', wipe < 0 ? '0' : String(Math.sin(wipe * Math.PI)))
    rootStyle.setProperty('--cin-fade', '0')
    rootStyle.setProperty('--cin-u', u.toFixed(3))
    rootStyle.setProperty('--cin-grade', `#${a.grade.clone().lerp(tint, accentMix * 0.7).getHexString()}`)
    rootStyle.setProperty('--cin-accent', `#${tint.getHexString()}`)
    rootStyle.setProperty('--cin-grade-amount', String(a.gradeAmount + 0.1 * accentMix))

    if (composer) composer.render(dt)
    else renderer.render(scene, camera)
  }

  const onLost = (event: Event) => {
    event.preventDefault()
    contextLost = true
    cinematic.set({ mode: 'static' })
  }
  const onScroll = () => updateScroll()

  resize()
  updateScroll()
  u = targetU
  window.addEventListener('resize', resize)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  canvas.addEventListener('webglcontextlost', onLost)
  const layoutObserver = new ResizeObserver(measure)
  layoutObserver.observe(root)
  frame = window.requestAnimationFrame(render)

  return {
    dispose() {
      disposed = true
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      canvas.removeEventListener('webglcontextlost', onLost)
      layoutObserver.disconnect()
      sky.dispose()
      terrain.dispose()
      construction.dispose()
      gallery.dispose()
      vista.dispose()
      reviews.dispose()
      finalMark.dispose()
      motes.dispose()
      mist.dispose()
      scatter.dispose()
      monument.dispose()
      pulseMaterial.dispose()
      composer?.dispose()
      envTarget.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      overlays.forEach(el => {
        el.style.opacity = ''
        el.style.visibility = ''
        el.style.pointerEvents = ''
        el.style.transform = ''
      })
    }
  }
}
