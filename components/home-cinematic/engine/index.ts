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
import { CHAPTER_IDS, PROCESS_SPAN, PROCESS_START, cinematic } from '@/lib/cinematic/store'
import { galleryWeight, sampleCamera, type Pose } from './camera'
import { createConstruction } from './construction'
import { createMist, createMotes } from './fx'
import { createGallery, type GalleryProject } from './gallery'
import { MILESTONES, MONUMENT, PLAZA, SUN_DIR, groundHeight, routeX } from './layout'
import { createMonument } from './monument'
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
  clientColors: string[]
  lowPower: boolean
}

export type Engine = { dispose(): void }

const INTRO_KEY = 'nivello-cinematic-intro-v2'
const SUN_ELEVATION: [number, number][] = [[0, 0.12], [0.75, 0.17], [1.1, 0.34], [1.9, 0.3], [2.1, 0.5], [3.0, 0.5], [3.2, 0.1], [3.95, 0.08], [4.35, 0.12], [5, 0.55], [6, 0.2]]

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
  const { canvas, root, projects, clientColors } = options
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
  scene.environmentIntensity = 0.42
  pmrem.dispose()
  const camera = new PerspectiveCamera(40, 1, 0.5, 2600)

  const sky = createSky()
  scene.add(sky.group)
  const terrain = createTerrain()
  scene.add(terrain.mesh)
  const construction = createConstruction()
  scene.add(construction.group)
  const gallery = createGallery(projects, maxAnisotropy)
  scene.add(gallery.group)
  const vista = createVista(clientColors)
  scene.add(vista.group)
  const motes = createMotes(lowPower ? 450 : 1100)
  scene.add(motes.points)
  const mist = createMist()
  scene.add(mist.group)
  const scatter = createScatter(lowPower ? 600 : 1100)
  scene.add(scatter.group)
  const monument = await createMonument()
  scene.add(monument.group)

  // Visual-check hooks (only with ?cin=snap): hide layers or take over the camera.
  const debug: { override?: Pose; hide: string[] } = { hide: [] }
  if (snap) {
    ;(window as unknown as { __cin: unknown }).__cin = { debug, layout: { MILESTONES, MONUMENT, PLAZA, ground: groundHeight }, groups: { scatter: scatter.group, mist: mist.group, sky: sky.group, terrain: terrain.mesh, construction: construction.group, gallery: gallery.group, vista: vista.group, monument: monument.group, motes: motes.points } }
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
    bloom = new UnrealBloomPass(new Vector2(size.x / 2, size.y / 2), 0.7, 0.62, 1.0)
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
  let seen = false
  try {
    seen = window.sessionStorage.getItem(INTRO_KEY) === '1'
  } catch {
    seen = false
  }
  const introDuration = seen ? 0.9 : 4.8
  let introT = snap ? 1 : 0
  cinematic.set({ introActive: !snap })
  root.dataset.intro = snap ? 'done' : 'playing'

  // State
  let u = 0
  let targetU = 0
  let day = document.documentElement.classList.contains('dark') ? 0 : 1
  let focus = cinematic.get().workIndex
  let focusVel = 0
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
    const dt = Math.min(0.05, (now - last) / 1000)
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
        try {
          window.sessionStorage.setItem(INTRO_KEY, '1')
        } catch {
          // storage unavailable; the intro simply replays next visit
        }
      }
    }
    const introE = ease.inOut(introT)
    if (introT > 0.38 && root.dataset.intro === 'playing') root.dataset.intro = 'text'

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
    focusVel += ((store.workIndex - focus) * k - focusVel * c) * dt
    focus += focusVel * dt
    if (snap) {
      focus = store.workIndex
      focusVel = 0
    }
    appMix += ((store.workApp ? 1 : 0) - appMix) * (1 - Math.exp(-dt * 7))
    proofFocus += (store.proofIndex - proofFocus) * (1 - Math.exp(-dt * 5))

    // camera
    sampleCamera(u, pose)
    const gw = galleryWeight(u)
    if (gw > 0.001) {
      gallery.portalAt(focus, portal)
      const dolly = clamp(Math.abs(focusVel) * 1.1, 0, 7)
      const d = (18.2 + dolly) * (width < 900 ? 1.55 : 1)
      const gx = portal.x + portal.inward[0] * d - portal.right[0] * (width < 900 ? 0 : 3.4) + portal.right[0] * Math.sin(time * 0.25) * 0.5
      const gz = portal.z + portal.inward[1] * d - portal.right[1] * (width < 900 ? 0 : 3.4) + portal.right[1] * Math.sin(time * 0.25) * 0.5
      const gy = portal.y + 1.6 + Math.sin(time * 0.31) * 0.25
      pose.px = lerp(pose.px, gx, gw)
      pose.py = lerp(pose.py, gy, gw)
      pose.pz = lerp(pose.pz, gz, gw)
      pose.lx = lerp(pose.lx, portal.x, gw)
      pose.ly = lerp(pose.ly, portal.y - 0.2, gw)
      pose.lz = lerp(pose.lz, portal.z, gw)
      pose.fov = lerp(pose.fov, 38 + clamp(Math.abs(focusVel) * 1.4, 0, 5), gw)
      pose.sx = lerp(pose.sx, 0.22, gw)
    }
    const proofW = smoothstep(3.1, 3.4, u) * (1 - smoothstep(3.8, 4.0, u))
    if (proofW > 0.001) {
      const p = vista.pillarAt(proofFocus)
      pose.lx += (p.x - pose.lx) * 0.18 * proofW
      pose.px += Math.sin(proofFocus * 0.9) * 1.4 * proofW
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
    const sy = width < 900 ? 0.09 : 0
    camera.setViewOffset(width, height, -sx * width, sy * height, width, height)
    camera.updateMatrixWorld()

    // ignition: the front of the signal that wakes the landscape
    const frontBase = lerp(-150, -330, smoothstep(0.2, 1.0, u))
    const front = lerp(8, frontBase, introE)
    const frontLerped = lerp(front, -900, smoothstep(1.0, 1.5, u))

    // process stage 0..5
    const s = u < 1 ? 0 : u > 2 ? 5 : clamp((u - 1 - PROCESS_START) / PROCESS_SPAN) * 5
    const awake = smoothstep(0.6, 1.0, u)
    construction.update(s, time, awake)
    gallery.update(time, focus, appMix, 1)
    monument.update(u, time, smoothstep(4.35, 4.95, u), 0.28 * smoothstep(0.55, 1, introE) * (1 - smoothstep(0.3, 0.6, u)))
    const proofWeight = smoothstep(3.0, 3.25, u) * (1 - smoothstep(4.1, 4.4, u))
    vista.update(time, proofFocus, proofWeight, camera.position, sunDir)

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
    tu.uTopo.value = smoothstep(0.9, 1.15, u) * (1 - smoothstep(1.35, 2.05, u)) + 0.25 * gw
    tu.uWarm.value = smoothstep(1.2, 2.0, u)
    tu.uShock.value.set(0, 10, introE * 240)
    tu.uShockAmp.value = Math.pow(1 - introE, 0.6) * (1 - smoothstep(0.1, 0.3, u))

    const glow = tu.uGlow.value as Vector4[]
    const glowColor = tu.uGlowColor.value as Color[]
    for (let i = 0; i < GLOW_SLOTS; i += 1) glow[i].set(0, 0, 0, 0)
    const emerge = smoothstep(0.35, 0.86, u)
    glow[0].set(MONUMENT.x, monument.top * 0.6, MONUMENT.z + 14, 46)
    glowColor[0].copy(blue).lerp(gold, 0.45).multiplyScalar(0.55 * emerge + 0.1)
    construction.glows.forEach((g, i) => {
      const build = g.build()
      glow[1 + i].set(g.x, g.y, g.z, g.r)
      glowColor[1 + i].copy(i % 2 ? blue : gold).multiplyScalar(0.7 * build)
    })
    glow[6].set(PLAZA.x, 6, PLAZA.z - 16, 34)
    glowColor[6].copy(tint).multiplyScalar(0.8 * accentMix)
    const pulseZ = clamp(front + 6, -330, 40)
    glow[7].set(routeX(pulseZ), groundHeight(routeX(pulseZ), pulseZ) + 2, pulseZ, 16)
    glowColor[7].copy(gold).multiplyScalar(1.2 * (1 - smoothstep(0.25, 0.9, u)))
    pulse.position.set(routeX(pulseZ), groundHeight(routeX(pulseZ), pulseZ) + 1.2, pulseZ)
    pulse.scale.setScalar(5 + Math.sin(time * 5) * 0.8)
    pulseMaterial.opacity = (1 - smoothstep(0.25, 0.9, u)) * (introT < 0.02 ? 0.5 + introT * 25 : 1)

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
    sunLight.intensity = a.sunIntensity * 1.1
    sunLight.position.copy(camera.position).addScaledVector(sunDir, 120)
    sunLight.target.position.copy(camera.position)
    // soft key from the camera side keeps the faces we are looking at readable
    fill.position.copy(camera.position).addScaledVector(upVec, 18).addScaledVector(right, -10)
    fill.target.position.copy(lookAt)
    fill.intensity = (0.85 + 0.4 * day) * (1 - 0.45 * gw)

    renderer.toneMappingExposure = a.exposure
    if (bloom) bloom.strength = a.bloom * 0.62 + 0.06 + 0.55 * (1 - introE) * (1 - smoothstep(0.1, 0.3, u))

    motes.update(camera.position, time, tint, 0.55 + 0.25 * (1 - day))
    mist.update(a.fog, a.sun, time, 1 - 0.5 * gw)
    construction.group.visible = u > 0.45 || Boolean(debug.override)
    gallery.group.visible = (u > 1.7 && u < 3.3) || Boolean(debug.override)
    vista.group.visible = u > 2.5 || Boolean(debug.override)
    monument.group.visible = true
    if (snap) {
      const groups = (window as unknown as { __cin: { groups: Record<string, { visible: boolean }> } }).__cin.groups
      debug.hide.forEach(name => {
        if (groups[name]) groups[name].visible = false
      })
    }

    // chapter + DOM overlays
    const chapter = Math.min(CHAPTER_IDS.length - 1, Math.floor(u + 0.0001))
    cinematic.set({ chapter, processStage: Math.min(4, Math.floor(s)) })
    overlays.forEach(el => {
      const index = Number(el.dataset.cinOverlay)
      const local = u - index
      const fadeIn = index === 0 ? 1 : smoothstep(0, 0.06, local)
      const fadeOut = index === 0 ? 1 - smoothstep(0.2, 0.38, local) : index === CHAPTER_IDS.length - 1 ? 1 : 1 - smoothstep(0.94, 1, local)
      const o = local < -0.001 || local > 1.001 ? 0 : fadeIn * fadeOut
      el.style.opacity = o.toFixed(3)
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden'
      el.style.pointerEvents = o > 0.55 ? 'auto' : 'none'
      el.dataset.active = o > 0.5 ? 'true' : 'false'
      el.style.transform = `translate3d(0, ${((1 - fadeIn) * 26 - (1 - fadeOut) * 16).toFixed(1)}px, 0)`
    })
    let wipe = -1
    for (let boundary = 1; boundary < CHAPTER_IDS.length; boundary += 1) {
      const q = u - boundary
      if (Math.abs(q) < 0.07) wipe = (q + 0.07) / 0.14
    }
    rootStyle.setProperty('--cin-wipe', wipe.toFixed(3))
    rootStyle.setProperty('--cin-wipe-o', wipe < 0 ? '0' : String(Math.sin(wipe * Math.PI)))
    rootStyle.setProperty('--cin-fade', String(clamp(1 - time * 2.2)))
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
