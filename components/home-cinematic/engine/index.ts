import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Color,
  DirectionalLight,
  FogExp2,
  HalfFloatType,
  HemisphereLight,
  PMREMGenerator,
  PointLight,
  PerspectiveCamera,
  Raycaster,
  Object3D,
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
import { BEATS, CHAPTER_IDS, FREE_UNTIL, cinematic, guideStops, isLocked, rail, reviewStops } from '@/lib/cinematic/store'
import { loadCharacters } from './astronaut'
import { sceneCopy, type SceneLocale } from './i18n'
import { createCameraTrack, exitOpen, galleryWeight, hatchOpen, hatchTurn, reviewsWeight, type Pose } from './camera'
import { createDesign } from './design'
import { createMotes, createMist } from './fx'
import { createGallery, type GalleryProject } from './gallery'
import { createGuide } from './guide'
import { FINAL, MONUMENT, PLAZA, STATIONS, SUMMIT, SUN_DIR, TUNNEL, configureWorld, groundHeight, routeX } from './layout'
import { createMonument } from './monument'
import { createOverview } from './overview'
import { createPlanning } from './planning'
import { createPyramid } from './pyramid'
import { createReviews, reviewLayout, type ReviewData } from './reviews'
import { createScatter } from './scatter'
import { clamp, ease, lerp, smooth, smoothstep } from './noise'
import { createAtmosphere, evaluateAtmosphere } from './palette'
import { createSky } from './sky'
import { createTeam } from './team'
import { GLOW_SLOTS, createTerrain } from './terrain'
import { glowTexture } from './textures'

export type EngineOptions = {
  canvas: HTMLCanvasElement
  root: HTMLElement
  projects: GalleryProject[]
  reviews: ReviewData[]
  lowPower: boolean
  /** The page's locale (the route decides it). Every word painted into the world comes from it. */
  locale: SceneLocale
}

export type Engine = {
  dispose(): void
  /** Switch language without rebuilding the world: textures with words are repainted in place. */
  setLocale(locale: SceneLocale, data: { reviews: ReviewData[] }): void
}

const SUN_ELEVATION: [number, number][] = [[0, 0.12], [0.9, 0.17], [1.6, 0.34], [3.6, 0.34], [5.3, 0.3], [5.95, 0.5], [6.97, 0.5], [7.1, 0.3], [7.9, 0.2], [8.3, 0.18], [9, 0.3]]

function sunElevation(u: number) {
  if (u <= 0) return SUN_ELEVATION[0][1]
  for (let i = 0; i < SUN_ELEVATION.length - 1; i += 1) {
    const [u0, v0] = SUN_ELEVATION[i]
    const [u1, v1] = SUN_ELEVATION[i + 1]
    if (u <= u1) return lerp(v0, v1, smooth((u - u0) / (u1 - u0)))
  }
  return SUN_ELEVATION[SUN_ELEVATION.length - 1][1]
}

const wrapPi = (a: number) => {
  let v = a % (Math.PI * 2)
  if (v > Math.PI) v -= Math.PI * 2
  if (v < -Math.PI) v += Math.PI * 2
  return v
}

export async function createEngine(options: EngineOptions): Promise<Engine> {
  const { canvas, root, projects, reviews: reviewData } = options
  const copyRef = { copy: sceneCopy[options.locale] }
  // ?cin=snap renders the exact scroll position without easing, the intro or the scroll rail (used for visual checks on
  // software GL). Add &guide=1 to keep the rail on.
  const params = new URLSearchParams(window.location.search)
  const snap = params.get('cin') === 'snap'
  const keepGuide = params.get('guide') === '1'
  // In snap mode every label painted into the world is recorded, so tests can assert what each locale really drew.
  if (snap) (window as unknown as { __cinLabels: Set<string> }).__cinLabels = new Set<string>()
  let lowPower = options.lowPower || snap
  const automated = typeof navigator !== 'undefined' && navigator.webdriver

  // The corridor and the summit depend on the number of reviews, so fix the world before anything is built.
  configureWorld(reviewData.length)

  const renderer = new WebGLRenderer({ canvas, antialias: lowPower, alpha: false, powerPreference: 'high-performance' })
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()

  const scene = new Scene()
  scene.fog = new FogExp2(0x112233, 0.004)
  // Soft studio reflections give metals and clearcoats believable highlights without extra lights.
  const pmrem = new PMREMGenerator(renderer)
  const envTarget = pmrem.fromScene(new RoomEnvironment(), 0.04)
  if (!lowPower) {
    scene.environment = envTarget.texture
    scene.environmentIntensity = 0.3
  }
  pmrem.dispose()
  const camera = new PerspectiveCamera(40, 1, 0.5, 2600)
  const cameraTrack = createCameraTrack()

  const characters = await loadCharacters()

  const sky = createSky(lowPower)
  scene.add(sky.group)
  const terrain = createTerrain(lowPower ? 3 : 1.6, lowPower)
  scene.add(terrain.mesh)
  const planning = createPlanning(characters, copyRef)
  scene.add(planning.group)
  const design = createDesign(copyRef)
  scene.add(design.group)
  const team = createTeam(characters, copyRef)
  scene.add(team.group)
  const pyramid = createPyramid()
  scene.add(pyramid.group)
  const gallery = createGallery(projects, maxAnisotropy, copyRef.copy, lowPower)
  scene.add(gallery.group)
  const reviews = createReviews(reviewData, copyRef.copy, lowPower)
  scene.add(reviews.group)
  const motes = createMotes(lowPower ? 200 : 1100)
  scene.add(motes.points)
  const mist = createMist(lowPower)
  scene.add(mist.group)
  const scatter = createScatter(lowPower ? 240 : 1100)
  scene.add(scatter.group)
  const overview = createOverview()
  scene.add(overview.group)
  const monument = await createMonument()
  scene.add(monument.group)
  const finalMark = await createMonument({ x: FINAL.x, z: FINAL.z, size: FINAL.size, final: true })
  scene.add(finalMark.group)

  // Phones: no dynamic lights at all (every light multiplies the cost of each lit surface). Emissive materials carry the glow.
  if (lowPower) {
    const lights: PointLight[] = []
    scene.traverse(object => {
      if ((object as PointLight).isPointLight) lights.push(object as PointLight)
    })
    lights.forEach(light => light.removeFromParent())
  }

  // Three.js compiles a new shader program whenever the number of visible lights changes, which showed up as a hitch and a
  // brightness step each time a chapter group toggled. The corridor's light moves to the scene root (it is authored in world
  // space) so the count stays constant; its intensity is zeroed while its group is hidden.
  const rigLights: { light: PointLight; group: Object3D }[] = []
  if (!lowPower) {
    const found: PointLight[] = []
    reviews.group.traverse(object => {
      if ((object as PointLight).isPointLight) found.push(object as PointLight)
    })
    found.forEach(light => {
      scene.attach(light)
      rigLights.push({ light, group: reviews.group })
    })
  }

  const applyLocale = (next: SceneLocale, data: { reviews: ReviewData[] }) => {
    copyRef.copy = sceneCopy[next]
    planning.repaintText()
    design.repaintText()
    team.repaintText()
    gallery.setCopy(copyRef.copy)
    reviews.setLocale(copyRef.copy, data.reviews)
  }

  // Visual-check hooks (only with ?cin=snap): hide layers or take over the camera.
  const debug: { override?: Pose; hide: string[] } = { hide: [] }
  if (snap) {
    ;(window as unknown as { __cin: unknown }).__cin = {
      debug,
      setLocale: applyLocale,
      groups: { overview: overview.group, planning: planning.group, design: design.group, team: team.group, pyramid: pyramid.group, scatter: scatter.group, mist: mist.group, sky: sky.group, terrain: terrain.mesh, gallery: gallery.group, reviews: reviews.group, monument: monument.group, finalMark: finalMark.group, motes: motes.points }
    }
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
    const target = new WebGLRenderTarget(size.x, size.y, { type: HalfFloatType, samples: 2 })
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
      // The pinned stage is 100svh tall regardless of the URL bar, so use its real height. The final chapter is also
      // capped by the real scroll range, so the last pose is always reachable even when the toolbar collapses.
      const pinHeight = root.querySelector<HTMLElement>('.cin-pin')?.offsetHeight ?? window.innerHeight
      const reach = document.documentElement.scrollHeight - window.innerHeight - tops[index]
      lengths.push(Math.max(1, isLast ? Math.min(el.offsetHeight - pinHeight, reach) : el.offsetHeight))
    })
  }
  const yToU = (y: number) => {
    if (!tops.length) return 0
    let c = 0
    while (c < tops.length - 1 && y >= tops[c + 1]) c += 1
    return c + clamp((y - tops[c]) / lengths[c])
  }
  const uToY = (value: number) => {
    if (!tops.length) return 0
    const c = clamp(Math.floor(value), 0, tops.length - 1)
    return tops[c] + lengths[c] * clamp(value - c, 0, 1)
  }

  const overlays = Array.from(root.querySelectorAll<HTMLElement>('[data-cin-overlay]'))
  const hotspots = Array.from(root.querySelectorAll<HTMLElement>('[data-cin-hotspot]')).map(el => ({
    el,
    kind: el.dataset.cinHotspot as 'work' | 'review',
    index: Number(el.dataset.index ?? 0),
    cache: ''
  }))
  const worldStyle = (canvas.parentElement ?? root).style
  const overlayCache = new WeakMap<HTMLElement, string>()
  const varCache = new Map<string, string>()
  const setVar = (name: string, value: string) => {
    if (varCache.get(name) === value) return
    varCache.set(name, value)
    worldStyle.setProperty(name, value)
  }

  let width = 1
  let height = 1
  // Dynamic resolution: steps the render scale down when frames run long, so the page never stutters.
  const scaleMax = lowPower ? 0.75 : 1
  const scaleMin = lowPower ? 0.5 : 0.6
  const slowFrame = lowPower ? 0.043 : 0.024
  const fastFrame = lowPower ? 0.03 : 0.0125
  // Phones render at 30 fps: steadier than chasing 60 and about half the GPU work.
  const minFrame = lowPower ? 30 : 0
  const scaleCooldown = 4
  let renderScale = scaleMax
  let frameSum = 0
  let frameCount = 0
  let sinceScaleChange = 0
  let appliedKey = ''
  // The stage is the 100svh pin, whose size does not change when a mobile URL bar collapses mid-scroll. Sizing from it
  // (not window.innerHeight) stops the canvas from being rebuilt and the camera from re-framing while the page scrolls.
  const applySize = (force = false) => {
    const nextWidth = Math.max(1, canvas.clientWidth || window.innerWidth)
    const nextHeight = Math.max(1, canvas.clientHeight || window.innerHeight)
    const dpr = Math.round(Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.35) * renderScale * 100) / 100
    const key = `${nextWidth}x${nextHeight}@${dpr}`
    if (!force && key === appliedKey) return false
    appliedKey = key
    width = nextWidth
    height = nextHeight
    renderer.setPixelRatio(dpr)
    renderer.setSize(width, height, false)
    composer?.setPixelRatio(dpr)
    composer?.setSize(width, height)
    bloom?.setSize(width * dpr * 0.5, height * dpr * 0.5)
    camera.aspect = width / height
    return true
  }
  const resize = () => {
    if (applySize()) measure()
  }

  // Input
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
  const onPointer = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2
    pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2
  }

  // Looking around inside the cylinder: drag (or the look buttons / arrow keys) turns the view; it never leaves the centre.
  // The view opens between the first two projects, so the chamber is full of work rather than a blank door.
  const startYaw = gallery.count > 1 && window.innerWidth >= 720 ? (gallery.angle(0) + gallery.angle(1)) / 2 : gallery.angle(0)
  let yaw = 0
  let yawTarget = startYaw
  let drag: { x: number; yaw0: number; moved: boolean } | null = null
  const lookable = () => cinematic.get().inChamber && !cinematic.get().workDetail
  const INTERACTIVE = 'a, button, input, textarea, select, [role="tab"], [data-scroll-ok]'
  const onDown = (event: PointerEvent) => {
    if (!lookable() || (event.target as Element | null)?.closest(INTERACTIVE)) return
    drag = { x: event.clientX, yaw0: yawTarget, moved: false }
  }
  const onMove = (event: PointerEvent) => {
    if (!drag) return
    const dx = event.clientX - drag.x
    if (Math.abs(dx) > 4) drag.moved = true
    yawTarget = drag.yaw0 - (dx / Math.max(320, width)) * 1.9
  }
  const onUp = () => {
    drag = null
  }
  // Look buttons centre the neighbouring project, so a tap always lands on something worth looking at.
  const onLook = (event: Event) => {
    if (!lookable()) return
    const direction = ((event as CustomEvent<number>).detail ?? 1) >= 0 ? 1 : -1
    let best = -1
    let bestGap = Infinity
    for (let i = 0; i < gallery.count; i += 1) {
      const gap = wrapPi(gallery.angle(i) - yawTarget)
      // the nearest project strictly in the requested direction (turning right means a larger angle)
      if (gap * direction > 0.12 && Math.abs(gap) < bestGap) {
        best = i
        bestGap = Math.abs(gap)
      }
    }
    // Past the last project in that direction the ring wraps: take the first one beyond it.
    yawTarget += best >= 0 ? wrapPi(gallery.angle(best) - yawTarget) : direction * 0.9
  }
  const onLookKey = (event: KeyboardEvent) => {
    if (!lookable()) return
    if ((event.target as Element | null)?.closest('input, textarea, select, [role="tab"]')) return
    if (event.key === 'ArrowLeft') yawTarget -= 0.6
    if (event.key === 'ArrowRight') yawTarget += 0.6
  }

  // Tapping a painting in the corridor opens that review (the overlay buttons stay the accessible route).
  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const onTap = (event: MouseEvent) => {
    const store = cinematic.get()
    if (store.chapter !== 7 || store.reviewFocus >= 0 || !reviews.group.visible) return
    if ((event.target as Element | null)?.closest('a, button, input, textarea, select, [role="tab"], .cin-review, [data-cin-hotspot]')) return
    const rect = canvas.getBoundingClientRect()
    ndc.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.setFromCamera(ndc, camera)
    const hit = reviews.pick(raycaster)
    if (hit >= 0) cinematic.set({ reviewFocus: hit })
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
  let appMix = cinematic.get().workApp ? 1 : 0
  let detailAmount = 0
  let proofFocus = 0
  let reviewFocusAmount = 0
  let time = 0
  let last = performance.now()
  let frame = 0
  let disposed = false
  let inView = true
  let slowFrames = 0
  let sampled = 0
  let contextLost = false
  let farMode = false

  const updateScroll = () => {
    if (!tops.length) return
    const y = window.scrollY
    targetU = yToU(y)
    const bottom = tops[tops.length - 1] + lengths[tops.length - 1] + window.innerHeight
    inView = y < bottom + window.innerHeight * 0.2
    if (cinematic.get().introActive && y > 24) cinematic.set({ introActive: false })
    const offstage = y >= tops[tops.length - 1] + lengths[tops.length - 1] + 40
    if (offstage !== (root.dataset.offstage === 'true')) {
      if (offstage) root.dataset.offstage = 'true'
      else delete root.dataset.offstage
    }
  }

  // Hidden groups also stop updating their matrices, which is a real per-frame saving with hundreds of objects.
  const setGroup = (object: Object3D, on: boolean) => {
    if (object.visible === on) return
    object.visible = on
    object.matrixWorldAutoUpdate = on
    if (on) object.updateMatrixWorld(true)
  }

  // Review corridor: the camera rests at the middle of each section (the scroll stops) and glides between them.
  const tunnel = reviewLayout(reviewData.length)
  const stopsU = reviewStops()
  // One walk: rest at the mouth, where the first paintings already face the visitor, then glide to the far end.
  const travelKeys: { u: number; z: number }[] = [
    { u: 7.0, z: TUNNEL.z0 - 1 },
    { u: stopsU[0], z: TUNNEL.z0 - 3 },
    { u: stopsU[stopsU.length - 1], z: tunnel.zEnd + 6 },
    { u: 7.98, z: tunnel.zEnd + 6 }
  ]
  const travelAt = (value: number) => {
    if (value <= travelKeys[0].u) return travelKeys[0].z
    for (let i = 0; i < travelKeys.length - 1; i += 1) {
      const a = travelKeys[i]
      const b = travelKeys[i + 1]
      if (value <= b.u) {
        // a steady walk: mostly linear, softened only at the start and the end
        const t = clamp((value - a.u) / (b.u - a.u))
        return lerp(a.z, b.z, lerp(t, ease.inOut(t), 0.3))
      }
    }
    return travelKeys[travelKeys.length - 1].z
  }

  const hotspotVector = new Vector3()
  const detail = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0 }
  const chamber = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0 }

  const render = (now: number) => {
    if (disposed) return
    frame = window.requestAnimationFrame(render)
    if (document.visibilityState !== 'visible' || contextLost) {
      last = now
      return
    }
    if (minFrame && now - last < minFrame - 2) return
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000))
    last = now
    if (!inView) return
    time += dt
    const store = cinematic.get()
    guide?.sync()

    if (!snap && !automated) {
      frameSum += dt
      frameCount += 1
      sinceScaleChange += dt
      if (frameCount >= 40) {
        const average = frameSum / frameCount
        frameSum = 0
        frameCount = 0
        // A change needs a cooldown, and each step is quantised, so the resolution settles instead of oscillating.
        if (sinceScaleChange > scaleCooldown) {
          if (average > slowFrame && renderScale > scaleMin) {
            renderScale = Math.max(scaleMin, Math.round(renderScale * 0.9 * 20) / 20)
            sinceScaleChange = 0
            applySize()
          } else if (average < fastFrame && renderScale < scaleMax) {
            renderScale = Math.min(scaleMax, Math.round(renderScale * 1.1 * 20) / 20)
            sinceScaleChange = 0
            applySize()
          }
        }
      }
    }

    // adaptive quality: drop post-processing once if the device clearly cannot keep up
    if (!automated && composer && sampled < 120) {
      sampled += 1
      if (sampled > 20 && dt > 0.042) slowFrames += 1
      if (sampled === 120 && slowFrames > 60) {
        composer.dispose()
        composer = undefined
        bloom = undefined
        lowPower = true
        applySize(true)
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
    // A gentle follow (about a third of a second behind the scroll) makes every move read as walking, not cutting.
    u += (targetU - u) * (snap ? 1 : 1 - Math.exp(-dt * 3.4))
    if (Math.abs(targetU - u) < 0.0004) u = targetU

    // atmosphere
    const dayTarget = document.documentElement.classList.contains('dark') ? 0 : 1
    day += (dayTarget - day) * (1 - Math.exp(-dt * 5))
    evaluateAtmosphere(u, day, atmosphere)
    const elevation = sunElevation(u)
    sunDir.set(SUN_DIR[0], elevation * Math.hypot(SUN_DIR[0], SUN_DIR[2]) / 0.94, SUN_DIR[2]).normalize()

    appMix += ((store.workApp ? 1 : 0) - appMix) * (1 - Math.exp(-dt * 7))
    const phone = width < 720

    // Review corridor: where the camera is, and which painting is nearest (or open).
    const focusedReview = store.reviewFocus
    const travelZ = travelAt(u)
    let nearest = 0
    for (let k = 1; k < reviewData.length; k += 1) {
      if (Math.abs(tunnel.frame(k).z - travelZ) < Math.abs(tunnel.frame(nearest).z - travelZ)) nearest = k
    }
    const reviewTarget = focusedReview >= 0 ? focusedReview : nearest
    proofFocus += (reviewTarget - proofFocus) * (1 - Math.exp(-dt * 5))
    reviewFocusAmount += ((focusedReview >= 0 ? 1 : 0) - reviewFocusAmount) * (1 - Math.exp(-dt * (snap ? 60 : 1.9)))

    // camera
    cameraTrack.sample(u, pose)
    const gw = galleryWeight(u)
    const rw = reviewsWeight(u)
    const inChamber = gw > 0.6
    if (gw > 0.001) {
      // Inside the cylinder the visitor stays at the centre; only the view turns (by drag, buttons or the open project).
      const wasDetail = store.workDetail
      detailAmount += ((wasDetail ? 1 : 0) - detailAmount) * (1 - Math.exp(-dt * (snap ? 60 : 2.0)))
      const goal = wasDetail ? gallery.angle(Math.min(store.workIndex, gallery.count - 1)) : inChamber ? yawTarget : startYaw
      yaw += wrapPi(goal - yaw) * (snap ? 1 : 1 - Math.exp(-dt * 2.6))
      if (!wasDetail && inChamber) yawTarget = yaw + wrapPi(yawTarget - yaw)
      const sway = Math.sin(time * 0.25) * 0.02
      chamber.px = PLAZA.x
      chamber.py = 0.2 + 7.2
      chamber.pz = PLAZA.z
      chamber.lx = PLAZA.x + Math.sin(yaw + sway) * 28
      chamber.lz = PLAZA.z - Math.cos(yaw + sway) * 28
      chamber.ly = 0.2 + 10.4
      gallery.detailPose(yaw, detail, phone)
      const d = detailAmount
      const px = lerp(chamber.px, detail.px, d)
      const py = lerp(chamber.py, detail.py, d)
      const pz = lerp(chamber.pz, detail.pz, d)
      const lx = lerp(chamber.lx, detail.lx, d)
      const ly = lerp(chamber.ly, detail.ly, d)
      const lz = lerp(chamber.lz, detail.lz, d)
      pose.px = lerp(pose.px, px, gw)
      pose.py = lerp(pose.py, py, gw)
      pose.pz = lerp(pose.pz, pz, gw)
      pose.lx = lerp(pose.lx, lx, gw)
      pose.ly = lerp(pose.ly, ly, gw)
      pose.lz = lerp(pose.lz, lz, gw)
      pose.fov = lerp(pose.fov, lerp(48, phone ? 58 : 40, d), gw)
      pose.sx = lerp(pose.sx, 0.17 * d, gw)
      pose.roll = lerp(pose.roll, 0, gw)
    } else {
      detailAmount = 0
      yaw = 0
      yawTarget = startYaw
    }
    if (rw > 0.001) {
      // Down the corridor on the centre line: scroll (one stop per gesture) is the only thing that moves the camera forward.
      const eyeY = groundHeight(0, travelZ) + 4.6
      let px = 0
      let pz = travelZ
      let lx = 0
      let lz = travelZ - 40
      let ly = eyeY + 0.4
      let fov = phone ? 56 : 46
      if (reviewFocusAmount > 0.001 && focusedReview >= 0 && focusedReview < reviewData.length) {
        // Opening one review: step toward its wall and face it, a little back along its normal. Only this moves sideways.
        const frame = tunnel.frame(focusedReview)
        const standoff = phone ? 11 : 8.5
        const nx = Math.sin(frame.yaw)
        const nz = Math.cos(frame.yaw)
        px = lerp(px, frame.x + nx * standoff, reviewFocusAmount)
        pz = lerp(pz, frame.z + nz * standoff, reviewFocusAmount)
        lx = lerp(lx, frame.x, reviewFocusAmount)
        lz = lerp(lz, frame.z, reviewFocusAmount)
        ly = lerp(ly, groundHeight(0, frame.z) + frame.y + 0.8, reviewFocusAmount)
        fov = lerp(fov, phone ? 54 : 42, reviewFocusAmount)
      }
      pose.px = lerp(pose.px, px, rw)
      pose.py = lerp(pose.py, eyeY, rw)
      pose.pz = lerp(pose.pz, pz, rw)
      pose.lx = lerp(pose.lx, lx, rw)
      pose.ly = lerp(pose.ly, ly, rw)
      pose.lz = lerp(pose.lz, lz, rw)
      pose.fov = lerp(pose.fov, fov, rw)
      pose.sx = lerp(pose.sx, 0.06 + 0.06 * reviewFocusAmount, rw)
      pose.roll = lerp(pose.roll, 0, rw)
    }
    if (phone) {
      // Summit on a phone: stand nearer the road and further back so the road, the stations and the logo share a narrow frame.
      const w = smoothstep(8.45, 8.78, u)
      if (w > 0.001) {
        const topY = SUMMIT.height * 0.98
        pose.px = lerp(pose.px, FINAL.x + 26, w)
        pose.py = lerp(pose.py, topY + 26, w)
        pose.pz = lerp(pose.pz, FINAL.z - 104, w)
        pose.lx = lerp(pose.lx, FINAL.x + 15, w)
        pose.ly = lerp(pose.ly, topY - 22, w)
        pose.lz = lerp(pose.lz, FINAL.z + 150, w)
        pose.fov = lerp(pose.fov, 56, w)
      }
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
    if (phone) {
      // The three-person team is wider than a portrait frame: stand further back from it on phones.
      const back = 0.5 * smoothstep(3.9, 4.1, u) * (1 - smoothstep(4.9, 5.0, u))
      if (back > 0.001) {
        pose.px = pose.lx + (pose.px - pose.lx) * (1 + back)
        pose.pz = pose.lz + (pose.pz - pose.lz) * (1 + back)
      }
    }
    camPos.set(pose.px, pose.py, pose.pz)
    lookAt.set(pose.lx, pose.ly, pose.lz)
    forward.subVectors(lookAt, camPos).normalize()
    right.crossVectors(forward, upVec).normalize()
    // A small pointer parallax gives the world depth; it fades out while the rail is held on a project or review.
    const parallax = (phone ? 0.25 : 1) * (1 - 0.85 * Math.max(detailAmount, reviewFocusAmount)) * (1 - 0.6 * gw) * (1 - 0.9 * rw * (1 - reviewFocusAmount))
    camPos.addScaledVector(right, pointer.x * 0.9 * parallax).addScaledVector(upVec, -pointer.y * 0.5 * parallax)
    lookAt.addScaledVector(right, pointer.x * 0.5 * parallax)
    const clearance = groundHeight(camPos.x, camPos.z) + 2.4
    if (camPos.y < clearance) camPos.y = clearance
    camera.position.copy(camPos)
    camera.lookAt(lookAt)
    camera.rotateZ(pose.roll)
    // Phones are narrow and tall: widen the lens over the open-air scenes so the whole subject stays in frame.
    const stationZone = smoothstep(1.9, 2.05, u) * (1 - smoothstep(5.85, 5.98, u))
    // The identity mark and the three-person team need extra room in a portrait frame.
    const logoZone = smoothstep(1.0, 1.3, u) * (1 - smoothstep(1.75, 1.95, u))
    const teamZone = smoothstep(3.9, 4.1, u) * (1 - smoothstep(4.9, 5.0, u))
    const hatchZone = smoothstep(5.85, 6.0, u) * (1 - smoothstep(6.45, 6.55, u))
    const finaleZone = smoothstep(8.2, 8.6, u)
    camera.fov = pose.fov * (phone ? lerp(1.2, 1.5, stationZone) + 0.3 * logoZone + 0.22 * teamZone + 0.55 * hatchZone + 0.12 * finaleZone : 1)
    const sx = width < 900 ? 0 : pose.sx
    const sy = width < 900 ? 0.09 + 0.06 * gw + 0.1 * smoothstep(8.45, 8.78, u) : 0
    camera.setViewOffset(width, height, -sx * width, sy * height, width, height)
    camera.updateMatrixWorld()

    // ignition: the front of the signal that wakes the landscape
    const frontBase = lerp(-150, -330, smoothstep(0.2, 1.0, u))
    const front = lerp(8, frontBase, introE)
    const frontLerped = lerp(front, -900, smoothstep(1.0, 1.5, u))

    // scene progress, each 0..1 inside its own chapter
    const chapterProgress = (index: number) => clamp(u - index)
    const awake = smoothstep(0.6, 1.0, u)
    const beatPlanning = clamp((u - 2) * 3, 0, 2.999)
    // From the summit every station is far away: no live screens, no animation, no matrix updates for what cannot be read.
    const lookBack = u > 8.2
    if (!lookBack) {
      if (planning.group.visible) planning.update(beatPlanning, time, awake, dt)
      if (design.group.visible) design.update(chapterProgress(3), time, awake)
      if (team.group.visible) team.update(chapterProgress(4), time, awake, dt)
      if (pyramid.group.visible) pyramid.update(chapterProgress(5), time, awake, smoothstep(5.8, 6.15, u))
    }
    if (lookBack !== farMode) {
      farMode = lookBack
      team.setFar(lookBack)
      gallery.setFar(lookBack)
      ;[planning.group, design.group, team.group, pyramid.group, gallery.group, reviews.group].forEach(g => {
        g.matrixWorldAutoUpdate = !lookBack
      })
    }
    const open = { turn: hatchTurn(u), hatch: hatchOpen(u), exit: exitOpen(u) }
    if (gallery.group.visible && !lookBack) gallery.update(time, { focus: store.workDetail ? store.workIndex : -1, appMix, open, awake: 0.4 + 0.6 * gw + 0.2 * (1 - gw) })
    const logoBeat = smoothstep(1.0, 1.5, u) * (1 - smoothstep(1.9, 2.3, u))
    monument.update(u, time, logoBeat * 0.6, 0.45 * smoothstep(0.55, 1, introE) * (1 - smoothstep(0.85, 1.25, u)))
    finalMark.update(u, time, smoothstep(8.2, 8.6, u) * 0.4, 0)
    if (!lookBack) reviews.update(time, reviewFocusAmount > 0.01 && focusedReview >= 0 ? focusedReview : nearest, reviewFocusAmount, smoothstep(6.9, 7.05, u))
    if (u > 6.95 && u < 8.05) cinematic.set({ proofIndex: nearest })

    // atmosphere -> materials
    tint.setRGB(0.08, 0.6, 1)
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
    tu.uTopo.value = smoothstep(1.8, 2.1, u) * (1 - smoothstep(4.0, 4.8, u)) * 0.6
    tu.uWarm.value = smoothstep(1.2, 2.0, u)
    tu.uShock.value.set(0, 10, introE * 240)
    tu.uShockAmp.value = Math.pow(1 - introE, 0.6) * (1 - smoothstep(0.1, 0.3, u))

    const glow = tu.uGlow.value as Vector4[]
    const glowColor = tu.uGlowColor.value as Color[]
    for (let i = 0; i < GLOW_SLOTS; i += 1) glow[i].set(0, 0, 0, 0)
    const emerge = smoothstep(0.8, 1.5, u)
    glow[0].set(MONUMENT.x, monument.top * 0.6, MONUMENT.z + 14, 46)
    glowColor[0].copy(blue).lerp(gold, 0.45).multiplyScalar(0.3 * emerge + 0.05)
    const pad = STATIONS.planning
    glow[1].set(pad.x, groundHeight(pad.x, pad.z) + 6, pad.z, 24)
    glowColor[1].copy(blue).multiplyScalar(0.34 * awake * smoothstep(1.7, 2.2, u))
    ;[design.glow, team.glow, pyramid.glow].forEach((g, i) => {
      glow[2 + i].set(g.x, g.y, g.z, g.r)
      glowColor[2 + i].copy(i % 2 ? blue : gold).multiplyScalar(0.38 * g.amount())
    })
    glow[6].set(PLAZA.x, 6, PLAZA.z + 30, 30)
    glowColor[6].setRGB(0.5, 0.65, 0.9).multiplyScalar(0.2 * smoothstep(5.8, 6.3, u))
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

    const fog = scene.fog as FogExp2
    fog.color.copy(a.fog)
    fog.density = a.fogDensity
    hemisphere.color.copy(a.ambientSky)
    hemisphere.groundColor.copy(a.ambientGround)
    hemisphere.intensity = (1.2 + day * 0.5) * (1 - 0.15 * gw)
    sunLight.color.copy(a.sun)
    sunLight.intensity = a.sunIntensity * 0.85
    sunLight.position.copy(camera.position).addScaledVector(sunDir, 120)
    sunLight.target.position.copy(camera.position)
    // soft key from the camera side keeps the faces we are looking at readable
    fill.position.copy(camera.position).addScaledVector(upVec, 18).addScaledVector(right, -10)
    fill.target.position.copy(lookAt)
    fill.intensity = (0.7 + 0.4 * day) * (1 - 0.5 * gw)

    renderer.toneMappingExposure = a.exposure * (lowPower ? 0.9 : 0.8)
    if (bloom) bloom.strength = a.bloom * 0.24 * (1 - 0.55 * gw) + 0.015 + 0.3 * (1 - introE) * (1 - smoothstep(0.1, 0.3, u))

    motes.update(camera.position, time, tint, 0.55 + 0.25 * (1 - day))
    mist.update(a.fog, a.sun, time, (1 - 0.8 * gw) * (0.1 + 0.9 * smoothstep(0.45, 1, introE)))
    const all = Boolean(debug.override)
    // Open-air stations are only on stage around their own chapter, and again in the finale's look back.
    setGroup(planning.group, (u > 1.5 && u < 3.5) || lookBack || all)
    setGroup(design.group, (u > 2.6 && u < 4.4) || lookBack || all)
    setGroup(team.group, (u > 3.6 && u < 5.4) || lookBack || all)
    setGroup(pyramid.group, (u > 4.6 && u < 6.4) || lookBack || all)
    setGroup(gallery.group, (u > 5.4 && u < 7.3) || lookBack || all)
    setGroup(reviews.group, (u > 6.6 && u < 8.4) || lookBack || all)
    setGroup(finalMark.group, u > 7.4 || all)
    rigLights.forEach(item => {
      if (!item.group.visible) item.light.intensity = 0
    })
    overview.update(smoothstep(8.5, 8.8, u))
    monument.group.visible = true
    if (snap) {
      const groups = (window as unknown as { __cin: { groups: Record<string, { visible: boolean }> } }).__cin.groups
      debug.hide.forEach(name => {
        if (groups[name]) groups[name].visible = false
      })
    }

    // chapter + DOM overlays
    const chapter = Math.min(CHAPTER_IDS.length - 1, Math.floor(u + 0.0001))
    const beatCount = BEATS[chapter] ?? 0
    const beat = beatCount ? Math.min(beatCount - 1, Math.floor((u - chapter) * beatCount)) : 0
    cinematic.set({ chapter, processStage: beat, inChamber })
    const lastChapter = CHAPTER_IDS.length - 1
    overlays.forEach(el => {
      const index = Number(el.dataset.cinOverlay)
      const from = Number(el.dataset.cinFrom ?? 0)
      const to = Number(el.dataset.cinTo ?? 1)
      const local = u - index
      const fadeIn = from <= 0 && index === 0 ? 1 : smoothstep(from, from + 0.06, local)
      const fadeOut = to >= 1 ? (index === lastChapter ? 1 : 1 - smoothstep(0.94, 1, local)) : 1 - smoothstep(to - 0.07, to, local)
      const o = local < from - 0.001 || local > to + 0.001 ? 0 : fadeIn * fadeOut
      const travel = index === lastChapter ? 0 : (1 - fadeIn) * 26 - (1 - fadeOut) * 16
      const next = `${o.toFixed(2)}|${o > 0.01 ? 1 : 0}|${o > 0.55 ? 1 : 0}|${o > 0.5 ? 1 : 0}|${travel.toFixed(0)}`
      if (overlayCache.get(el) === next) return
      overlayCache.set(el, next)
      el.style.opacity = o.toFixed(2)
      el.style.visibility = o > 0.01 ? 'visible' : 'hidden'
      el.style.pointerEvents = o > 0.55 ? 'auto' : 'none'
      el.dataset.active = o > 0.5 ? 'true' : 'false'
      el.style.transform = `translate3d(0, ${travel.toFixed(0)}px, 0)`
    })

    // Hotspots: DOM buttons pinned to 3D anchors (under each hologram, on each painting).
    if (hotspots.length) {
      const workOn = gw > 0.9 && !store.workDetail
      const reviewOn = rw > 0.9 && focusedReview < 0
      hotspots.forEach(spot => {
        let show = spot.kind === 'work' ? workOn : reviewOn
        let x = 0
        let y = 0
        if (show) {
          if (spot.kind === 'work') gallery.hotspotAnchor(Math.min(spot.index, gallery.count - 1), hotspotVector)
          else reviews.hotspotAnchor(Math.min(spot.index, reviewData.length - 1), hotspotVector)
          const dist = camera.position.distanceTo(hotspotVector)
          hotspotVector.project(camera)
          show = hotspotVector.z < 1 && Math.abs(hotspotVector.x) < 1.05 && Math.abs(hotspotVector.y) < 1.05 && (spot.kind === 'work' || dist < 26)
          x = (hotspotVector.x * 0.5 + 0.5) * width
          y = (-hotspotVector.y * 0.5 + 0.5) * height
        }
        const side = x > width * 0.58 ? 'left' : 'right'
        const key = show ? `1|${x.toFixed(0)}|${y.toFixed(0)}|${side}` : '0'
        if (spot.cache === key) return
        spot.cache = key
        if (show) {
          spot.el.style.transform = `translate3d(${x.toFixed(0)}px, ${y.toFixed(0)}px, 0) translate(-50%, -50%)`
          spot.el.dataset.side = side
        }
        spot.el.dataset.show = show ? 'true' : 'false'
      })
    }

    let wipe = -1
    for (let boundary = 1; boundary < CHAPTER_IDS.length; boundary += 1) {
      const q = u - boundary
      if (Math.abs(q) < 0.07) wipe = (q + 0.07) / 0.14
    }
    setVar('--cin-wipe', wipe.toFixed(2))
    setVar('--cin-wipe-o', wipe < 0 ? '0' : Math.sin(wipe * Math.PI).toFixed(2))
    setVar('--cin-fade', '0')
    setVar('--cin-grade', `#${a.grade.getHexString()}`)
    setVar('--cin-accent', '#159bff')
    setVar('--cin-grade-amount', a.gradeAmount.toFixed(3))

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

  const guide =
    !snap || keepGuide
      ? createGuide({
          stops: guideStops(),
          freeUntil: FREE_UNTIL,
          uToY,
          yToU,
          isLocked,
          enabled: () => !contextLost && cinematic.get().mode !== 'static'
        })
      : undefined
  if (guide) rail.go = value => guide.go(value)

  window.addEventListener('resize', resize)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointer, { passive: true })
  root.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  window.addEventListener('nivello:look', onLook)
  window.addEventListener('keydown', onLookKey)
  root.addEventListener('click', onTap)
  canvas.addEventListener('webglcontextlost', onLost)
  const layoutObserver = new ResizeObserver(measure)
  layoutObserver.observe(root)
  frame = window.requestAnimationFrame(render)

  return {
    setLocale: applyLocale,
    dispose() {
      disposed = true
      window.cancelAnimationFrame(frame)
      guide?.dispose()
      rail.go = undefined
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointer)
      root.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('nivello:look', onLook)
      window.removeEventListener('keydown', onLookKey)
      root.removeEventListener('click', onTap)
      canvas.removeEventListener('webglcontextlost', onLost)
      layoutObserver.disconnect()
      sky.dispose()
      terrain.dispose()
      planning.dispose()
      design.dispose()
      team.dispose()
      pyramid.dispose()
      gallery.dispose()
      reviews.dispose()
      overview.dispose()
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
      hotspots.forEach(spot => {
        spot.el.style.transform = ''
        delete spot.el.dataset.show
      })
    }
  }
}

