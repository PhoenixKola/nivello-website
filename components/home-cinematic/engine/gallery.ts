import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
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
  SRGBColorSpace,
  Texture,
  TextureLoader,
  TorusGeometry
} from 'three'
import { PLAZA, groundHeight } from './layout'
import { clamp, lerp } from './noise'
import { glowTexture, metalTexture, shaftTexture, stoneTexture } from './textures'

export type GalleryProject = { shot: string; appShot?: string; color: string }

export const PORTAL_RADIUS = 39
const SCREEN_W = 9.6
const SCREEN_H = 5.4
const CENTER_Y = 4.4
const ARC = (70 * Math.PI) / 180

export const portalAngle = (f: number, count: number) => lerp(-ARC, ARC, count > 1 ? f / (count - 1) : 0.5)

type Portal = {
  group: Group
  site: Mesh
  app?: Mesh
  glow: MeshBasicMaterial
  reflection: MeshBasicMaterial[]
  frameLight: MeshStandardMaterial
  color: Color
  base: { x: number; z: number; rot: number }
}

const fitCover = (texture: Texture, aspect = SCREEN_W / SCREEN_H) => {
  const image = texture.image as { width: number; height: number } | undefined
  if (!image?.width) return
  const imgAspect = image.width / image.height
  if (imgAspect < aspect) {
    texture.repeat.set(1, imgAspect / aspect)
    texture.offset.set(0, 1 - imgAspect / aspect)
  } else {
    texture.repeat.set(aspect / imgAspect, 1)
    texture.offset.set((1 - aspect / imgAspect) / 2, 0)
  }
}

function fadeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 4
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 128)
  gradient.addColorStop(0, '#000')
  gradient.addColorStop(1, '#bbb')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 4, 128)
  return new CanvasTexture(canvas)
}

export type Gallery = {
  group: Group
  count: number
  update(time: number, focus: number, appMix: number, awake: number): void
  /** Accent colour of the project under focus (blended). */
  accent: Color
  light: PointLight
  portalAt(f: number, out: { x: number; y: number; z: number; rotY: number; right: [number, number]; inward: [number, number] }): void
  dispose(): void
}

export function createGallery(projects: GalleryProject[], maxAnisotropy: number): Gallery {
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }
  const loader = new TextureLoader()
  const loadMap = (url: string, onLoad?: (t: Texture) => void) => {
    const texture = loader.load(url, t => {
      fitCover(t)
      onLoad?.(t)
    })
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = Math.min(8, maxAnisotropy)
    return track(texture)
  }

  const stone = track(stoneTexture(21, [96, 110, 134]))
  stone.repeat.set(4, 6)
  const metal = track(metalTexture())
  const glow = track(glowTexture())
  const shaft = track(shaftTexture())
  const fade = track(fadeTexture())

  const floorGroup = new Group()
  group.add(floorGroup)
  const floor = new Mesh(
    track(new CircleGeometry(PLAZA.r - 2, 96)),
    track(new MeshStandardMaterial({ color: 0x070d18, metalness: 0.95, roughness: 0.12, emissive: 0x050c1c, emissiveIntensity: 0.6 }))
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.set(PLAZA.x, 0.2, PLAZA.z)
  floorGroup.add(floor)

  const ringMaterial = (color: number, opacity: number) =>
    track(new MeshBasicMaterial({ color, transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  const rings: Mesh[] = []
  ;[10, 17, 24, PLAZA.r - 2.4].forEach((radius, i) => {
    const ring = new Mesh(track(new RingGeometry(radius - 0.12, radius + 0.12, 128)), ringMaterial(i % 2 ? 0x159bff : 0xffbf43, 0.65))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(PLAZA.x, 0.24, PLAZA.z)
    floorGroup.add(ring)
    rings.push(ring)
  })

  // Colonnade framing the space, open toward the entrance and the exit.
  const pillarMaterial = track(new MeshStandardMaterial({ map: stone, color: 0x9fb2d0, metalness: 0.2, roughness: 0.7 }))
  const capMaterial = track(new MeshStandardMaterial({ color: 0x0b1424, emissive: 0x159bff, emissiveIntensity: 1.1 }))
  const pillarGeometry = track(new BoxGeometry(1.4, 26, 1.4))
  const capGeometry = track(new BoxGeometry(1.7, 0.3, 1.7))
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    if (Math.abs(sx) < 0.22) continue
    const radius = PLAZA.r + 12 + (i % 2) * 3
    const x = PLAZA.x + sx * radius
    const z = PLAZA.z + cz * radius
    const pillar = new Mesh(pillarGeometry, pillarMaterial)
    pillar.position.set(x, groundHeight(x, z) + 13, z)
    pillar.rotation.y = a
    const cap = new Mesh(capGeometry, capMaterial)
    cap.position.set(x, groundHeight(x, z) + 26.1, z)
    group.add(pillar, cap)
  }

  // Oculus: a luminous ring far above, throwing shafts down into the hall.
  const oculus = new Mesh(track(new TorusGeometry(24, 0.38, 10, 128)), track(new MeshBasicMaterial({ color: 0x8fd0ff, toneMapped: false })))
  oculus.rotation.x = Math.PI / 2
  oculus.position.set(PLAZA.x, 30, PLAZA.z - 6)
  group.add(oculus)
  const shaftMaterial = track(new MeshBasicMaterial({ map: shaft, color: 0x8fb8ff, transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
  for (let i = 0; i < 5; i += 1) {
    const plane = new Mesh(track(new PlaneGeometry(9, 34)), shaftMaterial)
    const a = (i / 5) * Math.PI * 2
    plane.position.set(PLAZA.x + Math.sin(a) * 12, 16, PLAZA.z - 6 + Math.cos(a) * 12)
    plane.rotation.y = a
    plane.rotation.z = Math.sin(a) * 0.1
    group.add(plane)
  }

  // Path of light that leads from the entrance to the project under focus.
  const pathMaterial = ringMaterial(0xffbf43, 0.75)
  const path = new Mesh(track(new PlaneGeometry(0.7, 1)), pathMaterial)
  path.rotation.x = -Math.PI / 2
  const pathPivot = new Group()
  pathPivot.add(path)
  group.add(pathPivot)

  const frameGeometry = {
    horizontal: track(new BoxGeometry(SCREEN_W + 1.6, 0.8, 1.1)),
    vertical: track(new BoxGeometry(0.8, SCREEN_H + 0.8, 1.1)),
    pylon: track(new BoxGeometry(0.9, 11, 0.9)),
    plinth: track(new CylinderGeometry(4.4, 5.2, 0.7, 6))
  }
  const frameMaterial = track(new MeshStandardMaterial({ map: metal, color: 0xb4c2dc, metalness: 0.95, roughness: 0.22, envMapIntensity: 1.3 }))
  const plinthMaterial = track(new MeshStandardMaterial({ color: 0x0a1220, metalness: 0.8, roughness: 0.25 }))
  const screenGeometry = track(new PlaneGeometry(SCREEN_W, SCREEN_H))
  const glowGeometry = track(new PlaneGeometry(SCREEN_W * 1.9, SCREEN_H * 2.2))

  const portals: Portal[] = projects.map((project, index) => {
    const theta = portalAngle(index, projects.length)
    const x = PLAZA.x + Math.sin(theta) * PORTAL_RADIUS
    const z = PLAZA.z - Math.cos(theta) * PORTAL_RADIUS
    const root = new Group()
    root.position.set(x, 0.3, z)
    root.rotation.y = -theta
    group.add(root)

    const color = new Color(project.color)
    // very dark brand colours need a lifted stand-in for the light
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)
    if (hsl.l < 0.32) color.setHSL(hsl.h, Math.max(hsl.s, 0.45), 0.5)

    const frameLight = track(new MeshStandardMaterial({ color: 0x0b1424, emissive: color, emissiveIntensity: 1.2 }))
    const plinth = new Mesh(frameGeometry.plinth, plinthMaterial)
    plinth.position.y = 0.35
    root.add(plinth)

    const body = new Group()
    body.position.y = CENTER_Y
    root.add(body)
    const top = new Mesh(frameGeometry.horizontal, frameMaterial)
    top.position.y = SCREEN_H / 2 + 0.4
    const bottom = new Mesh(frameGeometry.horizontal, frameMaterial)
    bottom.position.y = -SCREEN_H / 2 - 0.4
    const left = new Mesh(frameGeometry.vertical, frameMaterial)
    left.position.x = -SCREEN_W / 2 - 0.4
    const right = new Mesh(frameGeometry.vertical, frameMaterial)
    right.position.x = SCREEN_W / 2 + 0.4
    const inner = new Mesh(track(new PlaneGeometry(SCREEN_W + 0.5, 0.12)), frameLight)
    inner.position.set(0, -SCREEN_H / 2 - 0.02, 0.58)
    body.add(top, bottom, left, right, inner)
    ;[-1, 1].forEach(side => {
      const pylon = new Mesh(frameGeometry.pylon, frameMaterial)
      pylon.position.set(side * (SCREEN_W / 2 + 1.7), 0.4, -0.2)
      const lamp = new Mesh(track(new BoxGeometry(0.5, 0.5, 0.5)), frameLight)
      lamp.position.set(side * (SCREEN_W / 2 + 1.7), 6.1, -0.2)
      body.add(pylon, lamp)
    })

    const makeScreen = (url: string) => {
      const material = track(new MeshBasicMaterial({ map: loadMap(url), toneMapped: false, transparent: true, color: 0x555555 }))
      const mesh = new Mesh(screenGeometry, material)
      mesh.position.z = 0.1
      body.add(mesh)
      const reflectionMaterial = track(new MeshBasicMaterial({ map: material.map, alphaMap: fade, transparent: true, opacity: 0.22, toneMapped: false, depthWrite: false, side: DoubleSide }))
      const mirror = new Mesh(screenGeometry, reflectionMaterial)
      mirror.scale.y = -1
      mirror.position.set(0, -(CENTER_Y) * 2 + 0.1, 0.1)
      body.add(mirror)
      return { mesh, material, reflectionMaterial }
    }

    const site = makeScreen(project.shot)
    const app = project.appShot ? makeScreen(project.appShot) : undefined
    if (app) app.material.opacity = 0

    const glowMaterial = track(new MeshBasicMaterial({ map: glow, color, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }))
    const halo = new Mesh(glowGeometry, glowMaterial)
    halo.position.z = -0.6
    body.add(halo)

    return {
      group: root,
      site: site.mesh,
      app: app?.mesh,
      glow: glowMaterial,
      reflection: [site.reflectionMaterial, ...(app ? [app.reflectionMaterial] : [])],
      frameLight,
      color,
      base: { x, z, rot: -theta }
    }
  })

  const light = new PointLight(0xffffff, 0, 46, 1.5)
  group.add(light)
  const accent = new Color(0xffffff)

  const tint = new Color()
  const white = new Color(0xffffff)
  const siteMaterials = portals.map(p => p.site.material as MeshBasicMaterial)
  const appMaterials = portals.map(p => (p.app ? (p.app.material as MeshBasicMaterial) : null))

  return {
    group,
    count: projects.length,
    accent,
    light,
    update(time, focus, appMix, awake) {
      let total = 0
      accent.setRGB(0, 0, 0)
      portals.forEach((portal, index) => {
        const w = clamp(1 - Math.abs(focus - index))
        const e = w * w * (3 - 2 * w)
        const dim = 0.22 + 0.78 * e
        const mix = appMaterials[index] ? appMix : 0
        siteMaterials[index].color.setScalar(dim * 0.82 * awake + 0.06)
        siteMaterials[index].opacity = 1 - mix * e
        const appMat = appMaterials[index]
        if (appMat) {
          appMat.color.setScalar(dim * 0.82 * awake + 0.06)
          appMat.opacity = mix * e
        }
        portal.glow.opacity = e * 0.22
        portal.frameLight.emissiveIntensity = 0.3 + 1.3 * e
        portal.reflection.forEach(m => {
          m.opacity = 0.05 + 0.2 * e
        })
        const push = e * 2.6
        portal.group.position.x = portal.base.x - Math.sin(-portal.base.rot) * push
        portal.group.position.z = portal.base.z + Math.cos(-portal.base.rot) * push
        portal.group.position.y = 0.3 + Math.sin(time * 0.7 + index * 1.7) * 0.12 * e
        portal.group.scale.setScalar(0.9 + 0.1 * e)
        tint.copy(portal.color).multiplyScalar(e)
        accent.add(tint)
        total += e
      })
      if (total > 0) accent.multiplyScalar(1 / total)
      light.color.copy(accent).lerp(white, 0.25)
      light.intensity = 700 * awake

      // light path to the focused portal
      const f = clamp(focus, 0, projects.length - 1)
      const theta = portalAngle(f, projects.length)
      const px = PLAZA.x + Math.sin(theta) * (PORTAL_RADIUS - 3)
      const pz = PLAZA.z - Math.cos(theta) * (PORTAL_RADIUS - 3)
      const sx = PLAZA.x
      const sz = PLAZA.z + PLAZA.r - 6
      pathPivot.position.set((px + sx) / 2, 0.27, (pz + sz) / 2)
      pathPivot.rotation.y = Math.atan2(-(px - sx), -(pz - sz))
      path.scale.y = Math.hypot(px - sx, pz - sz)
      light.position.set(lerp(sx, px, 0.55), 11, lerp(sz, pz, 0.55))
      rings.forEach((ring, i) => {
        ;(ring.material as MeshBasicMaterial).opacity = 0.35 + 0.3 * Math.sin(time * 1.2 + i)
      })
    },
    portalAt(f, out) {
      const theta = portalAngle(clamp(f, 0, projects.length - 1), projects.length)
      out.x = PLAZA.x + Math.sin(theta) * PORTAL_RADIUS
      out.z = PLAZA.z - Math.cos(theta) * PORTAL_RADIUS
      out.y = 0.3 + CENTER_Y
      out.rotY = -theta
      out.right = [Math.cos(theta), Math.sin(theta)]
      out.inward = [-Math.sin(theta), Math.cos(theta)]
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
