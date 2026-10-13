import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  PointLight,
  Shape,
  TorusGeometry
} from 'three'
import { MILESTONES, groundHeight } from './layout'
import { smoothstep } from './noise'
import { blueprintTexture, facadeTextures, glowTexture, shaftTexture, stoneTexture } from './textures'

type Uniforms = { uBuild: { value: number }; uBase: { value: number }; uHeight: { value: number }; uEdge: { value: Color } }

/** Adds a world-height cut to a material: solid below the build line, a glowing seam at it, nothing above. Blueprint lines do the inverse. */
function constructible<T extends Material>(material: T, uniforms: Uniforms, kind: 'solid' | 'line') {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vBY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vBY = (modelMatrix * vec4(transformed, 1.0)).y;')
    const cut = `
      float cutY = uBase + uBuild * uHeight;
      ${kind === 'solid' ? 'if (vBY > cutY) discard;' : 'if (uBuild > 0.995 || vBY < cutY - 0.2) discard;'}
    `
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vBY;\nuniform float uBuild;\nuniform float uBase;\nuniform float uHeight;\nuniform vec3 uEdge;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${cut}`)
    if (kind === 'solid') {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uEdge * smoothstep(0.9, 0.0, cutY - vBY) * step(uBuild, 0.995) * 1.6;'
      )
    }
  }
  material.customProgramCacheKey = () => `construct-${kind}`
  return material
}

function scaleUV(geometry: BufferGeometry, su: number, sv: number) {
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv)
  return geometry
}

export type Construction = {
  group: Group
  /** s: 0..5 stage progress. */
  update(s: number, time: number, awake: number): void
  glows: { x: number; y: number; z: number; r: number; build: () => number }[]
  dispose(): void
}

export function createConstruction(): Construction {
  const root = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }

  const stone = track(stoneTexture(7, [176, 192, 214]))
  const facade = facadeTextures(5)
  disposables.push(facade.map, facade.emissive)
  const blueprint = track(blueprintTexture())
  const softGlow = track(glowTexture())
  const shaft = track(shaftTexture())

  const gold = new Color(0xffbf43)
  const blue = new Color(0x159bff)
  const purple = new Color(0x7c3aed)

  type Stage = {
    group: Group
    uniforms: Uniforms
    arcs?: Mesh[]
    beam?: MeshBasicMaterial
    spin?: Group
    height: number
    topLight: number
    emissive: MeshStandardMaterial[]
    lines: LineBasicMaterial[]
    markers: Mesh[]
  }
  const stages: Stage[] = []

  const begin = (index: number, height: number) => {
    const m = MILESTONES[index]
    const group = new Group()
    const base = groundHeight(m.x, m.z)
    group.position.set(m.x, base, m.z)
    group.rotation.y = -m.side * 0.85
    root.add(group)
    const uniforms: Uniforms = { uBuild: { value: 0 }, uBase: { value: base }, uHeight: { value: height }, uEdge: { value: gold } }
    const stage: Stage = { group, uniforms, height, topLight: height, emissive: [], lines: [], markers: [] }
    stages.push(stage)
    return stage
  }

  const solid = (stage: Stage, geometry: BufferGeometry, material: Material, x = 0, y = 0, z = 0, lines = true) => {
    track(geometry)
    const mesh = new Mesh(geometry, constructible(material, stage.uniforms, 'solid'))
    mesh.position.set(x, y, z)
    stage.group.add(mesh)
    if (lines) {
      const edges = track(new EdgesGeometry(geometry, 28))
      const lineMaterial = track(constructible(new LineBasicMaterial({ color: 0x4db4ff, transparent: true, opacity: 0.9, toneMapped: false }), stage.uniforms, 'line'))
      const line = new LineSegments(edges, lineMaterial)
      line.position.copy(mesh.position)
      stage.group.add(line)
      stage.lines.push(lineMaterial)
    }
    return mesh
  }

  const matStone = track(new MeshStandardMaterial({ map: stone, color: 0xe4ecfa, metalness: 0.12, roughness: 0.62, emissive: 0x15233b, emissiveIntensity: 0.35 }))
  const matDark = track(new MeshStandardMaterial({ color: 0x0f1a2c, metalness: 0.8, roughness: 0.24, envMapIntensity: 1.2 }))
  const emissiveBlue = track(new MeshStandardMaterial({ color: 0x0b2a55, emissive: blue, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.3 }))
  const emissiveGold = track(new MeshStandardMaterial({ color: 0x4a3410, emissive: gold, emissiveIntensity: 2.2, metalness: 0.3, roughness: 0.3 }))
  const emissivePurple = track(new MeshStandardMaterial({ color: 0x241048, emissive: purple, emissiveIntensity: 1.6, metalness: 0.3, roughness: 0.3 }))

  const shadowBlob = (stage: Stage, radius: number) => {
    const blob = new Mesh(
      track(new CircleGeometry(radius, 32)),
      track(new MeshBasicMaterial({ map: softGlow, color: 0x000000, transparent: true, opacity: 0.55, depthWrite: false }))
    )
    blob.rotation.x = -Math.PI / 2
    blob.position.y = 0.12
    stage.group.add(blob)
  }

  // ── 01 Intro: a signal mast that calls the project into being ────────────
  {
    const s = begin(0, 17)
    shadowBlob(s, 12)
    solid(s, new CylinderGeometry(6.2, 7, 1.3, 8), matStone, 0, 0.65)
    solid(s, new CylinderGeometry(4.2, 5, 0.9, 8), matDark, 0, 1.75)
    solid(s, new CylinderGeometry(0.55, 1.5, 13, 10), matStone, 0, 8.2)
    solid(s, new TorusGeometry(3.1, 0.28, 8, 40), emissiveBlue, 0, 9.5, 0, false).rotation.x = Math.PI / 2
    solid(s, new TorusGeometry(2.1, 0.22, 8, 40), emissiveBlue, 0, 12.2, 0, false).rotation.x = Math.PI / 2
    const emitter = solid(s, new OctahedronGeometry(1.15, 0), emissiveGold, 0, 15.6, 0, false)
    s.markers.push(emitter)
    s.arcs = []
    for (let i = 0; i < 3; i += 1) {
      const arcMaterial = track(new MeshBasicMaterial({ color: i === 1 ? gold : 0x6cc6ff, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
      const arc = new Mesh(track(new TorusGeometry(3.4 + i * 2.1, 0.07, 6, 48, Math.PI * 0.8)), arcMaterial)
      arc.position.y = 15.6
      arc.rotation.set(0, -Math.PI / 2 + 0.3, 0)
      arc.rotation.z = Math.PI / 2 - Math.PI * 0.4
      s.group.add(arc)
      s.arcs.push(arc)
    }
    s.emissive.push(emissiveBlue, emissiveGold)
  }

  // ── 02 Scope: the survey sheet, outlines rising into foundations ─────────
  {
    const s = begin(1, 6)
    shadowBlob(s, 17)
    solid(s, new BoxGeometry(26, 0.8, 19), matDark, 0, 0.4)
    const sheetMaterial = track(new MeshBasicMaterial({ map: blueprint, toneMapped: false, color: 0xaad4ff }))
    const sheet = new Mesh(track(new PlaneGeometry(24, 17)), constructible(sheetMaterial, s.uniforms, 'solid'))
    sheet.rotation.x = -Math.PI / 2
    sheet.position.y = 0.82
    s.group.add(sheet)
    const rooms: [number, number, number, number][] = [
      [-7, -3, 9, 6], [3.5, -3.5, 7, 4], [3.5, 1.5, 7, 5], [-7, 4, 9, 6], [0, 6.6, 15, 2]
    ]
    rooms.forEach(([cx, cz, w, d], i) => {
      const height = 2.2 + (i % 3) * 1.1
      const t = 0.45
      solid(s, new BoxGeometry(w, height, t), matStone, cx, 0.8 + height / 2, cz - d / 2)
      solid(s, new BoxGeometry(w, height, t), matStone, cx, 0.8 + height / 2, cz + d / 2)
      solid(s, new BoxGeometry(t, height, d), matStone, cx - w / 2, 0.8 + height / 2, cz)
      solid(s, new BoxGeometry(t, height, d), matStone, cx + w / 2, 0.8 + height / 2, cz)
    })
    ;[[-12, -9], [12, -9], [-12, 9], [12, 9]].forEach(([x, z], i) => {
      solid(s, new CylinderGeometry(0.13, 0.13, 5, 6), matDark, x, 3.3, z, false)
      solid(s, new BoxGeometry(1.5, 0.9, 0.05), i % 2 ? emissiveGold : emissiveBlue, x + 0.75, 5.4, z, false)
    })
    s.emissive.push(emissiveBlue, emissiveGold)
  }

  // ── 03 Design: a vaulted gallery of arches and colour fields ─────────────
  {
    const s = begin(2, 11)
    shadowBlob(s, 18)
    solid(s, new BoxGeometry(24, 0.7, 11), matDark, 0, 0.35)
    const archShape = new Shape()
    archShape.moveTo(-2.6, 0)
    archShape.lineTo(-2.6, 5.6)
    archShape.absarc(0, 5.6, 2.6, Math.PI, 0, true)
    archShape.lineTo(2.6, 0)
    archShape.lineTo(1.7, 0)
    archShape.lineTo(1.7, 5.6)
    archShape.absarc(0, 5.6, 1.7, 0, Math.PI, false)
    archShape.lineTo(-1.7, 0)
    archShape.lineTo(-2.6, 0)
    for (let i = 0; i < 5; i += 1) {
      const geometry = new ExtrudeGeometry(archShape, { depth: 0.9, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2, curveSegments: 14 })
      solid(s, geometry, matStone, -9.6 + i * 4.8, 0.7, -1.2)
    }
    const swatches = [emissiveBlue, emissiveGold, emissivePurple, emissiveBlue, emissiveGold]
    swatches.forEach((material, i) => {
      solid(s, new BoxGeometry(3.1, 6.4 + (i % 3) * 1.2, 0.25), material, -9.6 + i * 4.8, 0.7 + (6.4 + (i % 3) * 1.2) / 2, 2.6, false)
    })
    s.emissive.push(emissiveBlue, emissiveGold, emissivePurple)
  }

  // ── 04 Build: the working site — towers, scaffold, a crane ───────────────
  {
    const s = begin(3, 30)
    shadowBlob(s, 20)
    const towers: [number, number, number, number, number][] = [
      [-5, -2, 7, 22, 7], [3.5, 1, 6.5, 30, 6], [-1.5, 6.5, 6, 15, 6], [8.5, -5.5, 5.5, 19, 5.5], [-9.5, 5, 5, 11, 5]
    ]
    towers.forEach(([x, z, w, h, d], i) => {
      const material = track(new MeshStandardMaterial({ map: facade.map, emissiveMap: facade.emissive, emissive: 0xffffff, emissiveIntensity: 1.6, color: 0xb9c8e0, metalness: 0.7, roughness: 0.2 }))
      solid(s, scaleUV(new BoxGeometry(w, h, d), Math.max(1, w / 5), Math.max(1, h / 9)), material, x, h / 2, z)
      solid(s, new BoxGeometry(w * 1.04, 0.5, d * 1.04), matDark, x, h + 0.25, z, false)
      if (i === 1) solid(s, new CylinderGeometry(0.1, 0.1, 6, 6), matDark, x, h + 3.5, z, false)
      s.emissive.push(material)
    })
    // scaffold cage on the tallest tower
    const cageGeometry = track(new EdgesGeometry(new BoxGeometry(7.6, 30.6, 7.4), 1))
    const cageMaterial = track(constructible(new LineBasicMaterial({ color: 0xffbf43, transparent: true, opacity: 0.8, toneMapped: false }), s.uniforms, 'line'))
    const cage = new LineSegments(cageGeometry, cageMaterial)
    cage.position.set(3.5, 15.3, 1)
    s.group.add(cage)
    s.lines.push(cageMaterial)
    // tower crane
    const crane = new Group()
    crane.position.set(-12, 0, -4)
    s.spin = crane
    s.group.add(crane)
    const craneMat = track(constructible(new MeshStandardMaterial({ color: 0xffbf43, metalness: 0.4, roughness: 0.5, emissive: 0x6b4300, emissiveIntensity: 0.6 }), s.uniforms, 'solid'))
    const mast = new Mesh(track(new BoxGeometry(0.7, 28, 0.7)), craneMat)
    mast.position.y = 14
    const jib = new Mesh(track(new BoxGeometry(18, 0.55, 0.55)), craneMat)
    jib.position.set(4.5, 28.2, 0)
    const counter = new Mesh(track(new BoxGeometry(3, 1.4, 1.2)), craneMat)
    counter.position.set(-3.8, 27.4, 0)
    crane.add(mast, jib, counter)
    s.emissive.push(emissiveGold)
  }

  // ── 05 Launch: the finished spire, beam on ───────────────────────────────
  {
    const s = begin(4, 34)
    shadowBlob(s, 20)
    const tierMaterial = () => track(new MeshStandardMaterial({ map: facade.map, emissiveMap: facade.emissive, emissive: 0xffffff, emissiveIntensity: 1.7, color: 0xc7d6ee, metalness: 0.7, roughness: 0.2 }))
    const tiers: [number, number, number][] = [[8, 6.4, 7], [6.2, 4.8, 7], [4.4, 3.2, 7]]
    let y = 0
    tiers.forEach(([rb, rt, h]) => {
      const material = tierMaterial()
      solid(s, scaleUV(new CylinderGeometry(rt, rb, h, 14, 1), 4, h / 8), material, 0, y + h / 2)
      const ring = solid(s, new TorusGeometry(rt + 0.2, 0.22, 8, 48), emissiveGold, 0, y + h, 0, false)
      ring.rotation.x = Math.PI / 2
      y += h
      s.emissive.push(material)
    })
    solid(s, new CylinderGeometry(0.35, 2.4, 11, 12), matStone, 0, y + 5.5)
    solid(s, new OctahedronGeometry(1.3, 0), emissiveGold, 0, y + 12.4, 0, false)
    s.topLight = y + 12.4
    s.markers.push(s.group.children[s.group.children.length - 1] as Mesh)
    const beamMaterial = track(new MeshBasicMaterial({ map: shaft, color: 0xffd08a, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false }))
    for (let i = 0; i < 2; i += 1) {
      const plane = new Mesh(track(new PlaneGeometry(10, 300)), beamMaterial)
      plane.position.y = y + 12 + 150
      plane.rotation.y = (i * Math.PI) / 2
      s.group.add(plane)
    }
    s.beam = beamMaterial
    s.emissive.push(emissiveGold)
  }

  const light = new PointLight(0xffbf43, 0, 70, 1.6)
  root.add(light)

  const glows = stages.map((stage, index) => ({
    x: MILESTONES[index].x,
    y: stage.group.position.y + stage.height * 0.6,
    z: MILESTONES[index].z,
    r: 16 + index * 2,
    build: () => stage.uniforms.uBuild.value as number
  }))

  return {
    group: root,
    glows,
    update(s, time, awake) {
      stages.forEach((stage, index) => {
        const build = smoothstep(index + 0.08, index + 0.88, s)
        stage.uniforms.uBuild.value = build
        const done = build > 0.995
        stage.lines.forEach(material => {
          material.opacity = 0.9 * (1 - smoothstep(0.9, 1, build))
        })
        stage.emissive.forEach(material => {
          const base = material.emissiveMap ? 0.95 : material === emissiveBlue ? 1.0 : material === emissivePurple ? 0.9 : 1.2
          material.emissiveIntensity = base * (0.35 + 0.65 * awake)
        })
        stage.arcs?.forEach((arc, i) => {
          const phase = (time * 0.9 + i * 0.33) % 1
          ;(arc.material as MeshBasicMaterial).opacity = build * (1 - phase) * 0.9
          arc.scale.setScalar(0.7 + phase * 0.9)
        })
        stage.markers.forEach(marker => {
          marker.rotation.y = time * 0.8
        })
        if (stage.spin) stage.spin.rotation.y = time * 0.08 + (done ? 0 : 0.6 * (1 - build))
        if (stage.beam) stage.beam.opacity = smoothstep(0.82, 1, build) * 0.28 * (0.85 + 0.15 * Math.sin(time * 2))
        stage.group.visible = true
      })
      const active = Math.min(4, Math.max(0, Math.floor(s)))
      const m = MILESTONES[active]
      light.position.set(m.x - m.side * 6, stages[active].group.position.y + stages[active].height * 0.65, m.z + 8)
      light.intensity = 380 * awake
    },
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
