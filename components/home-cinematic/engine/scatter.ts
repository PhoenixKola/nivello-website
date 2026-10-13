import { Color, ConeGeometry, DynamicDrawUsage, Group, IcosahedronGeometry, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from 'three'
import { LAKE, MILESTONES, MONUMENT, PLAZA, WORLD, groundHeight, routeX } from './layout'
import { mulberry32, noise2 } from './noise'

/** Boulders and slender rock spires scattered along the route: scale, foreground depth and parallax for the camera. */
export function createScatter(count: number) {
  const group = new Group()
  const rand = mulberry32(2024)

  const rockGeometry = new IcosahedronGeometry(1, 1)
  const position = rockGeometry.attributes.position
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const n = 1 + noise2(x * 1.7 + 4, y * 1.7 + z * 1.3) * 0.34 + noise2(z * 3.1, x * 3.1 + y) * 0.12
    position.setXYZ(i, x * n, y * n * 0.82, z * n)
  }
  rockGeometry.computeVertexNormals()
  const spireGeometry = new ConeGeometry(0.55, 7, 6, 3)
  const sp = spireGeometry.attributes.position
  for (let i = 0; i < sp.count; i += 1) sp.setX(i, sp.getX(i) + noise2(sp.getY(i) * 0.8, 3) * 0.18)
  spireGeometry.computeVertexNormals()

  const material = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0.05, flatShading: true, envMapIntensity: 0.25 })
  const rocks = new InstancedMesh(rockGeometry, material, count)
  const spires = new InstancedMesh(spireGeometry, material, Math.floor(count * 0.07))
  rocks.instanceMatrix.setUsage(DynamicDrawUsage)

  const matrix = new Matrix4()
  const quat = new Quaternion()
  const scale = new Vector3()
  const pos = new Vector3()
  const euler = new Vector3()
  const slate = new Color(0x2a3d58)
  const mid = new Color(0x587296)
  const warm = new Color(0x7a5a46)
  const tmp = new Color()

  const place = (mesh: InstancedMesh, index: number, spire: boolean) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const z = WORLD.zMax - 10 - Math.pow(rand(), 1.35) * (WORLD.zMax - WORLD.zMin - 40)
      const lateral = (rand() < 0.5 ? -1 : 1) * (5 + Math.pow(rand(), 1.6) * 75)
      const x = routeX(z) + lateral
      if (z > 10 && Math.abs(lateral) < 14) continue
      if (Math.hypot(x - PLAZA.x, z - PLAZA.z) < PLAZA.r + 8) continue
      if (Math.hypot(x - MONUMENT.x, z - MONUMENT.z) < 30) continue
      if (MILESTONES.some(m => Math.hypot(x - m.x, z - m.z) < m.r + 4)) continue
      const y = groundHeight(x, z)
      if (Math.hypot((x - LAKE.x) / LAKE.rx, (z - LAKE.z) / LAKE.rz) < 1.05 && Math.abs(lateral) < 12) continue
      if (y < LAKE.level + 0.4) continue
      const size = spire ? 0.9 + rand() * 2.4 : 0.5 + Math.pow(rand(), 3) * 4.8 + Math.abs(lateral) * 0.012
      scale.set(size * (0.8 + rand() * 0.5), size * (spire ? 1 + rand() * 1.4 : 0.6 + rand() * 0.7), size * (0.8 + rand() * 0.5))
      euler.set(0, rand() * Math.PI * 2, 0)
      quat.setFromAxisAngle(new Vector3(0, 1, 0), euler.y)
      pos.set(x, y - size * 0.25, z)
      matrix.compose(pos, quat, scale)
      mesh.setMatrixAt(index, matrix)
      const t = rand()
      tmp.copy(slate).lerp(mid, t)
      if (rand() < 0.18) tmp.lerp(warm, 0.5)
      mesh.setColorAt(index, tmp)
      return
    }
    matrix.makeScale(0, 0, 0)
    mesh.setMatrixAt(index, matrix)
    mesh.setColorAt(index, slate)
  }

  for (let i = 0; i < rocks.count; i += 1) place(rocks, i, false)
  for (let i = 0; i < spires.count; i += 1) place(spires, i, true)
  rocks.frustumCulled = false
  spires.frustumCulled = false
  group.add(rocks, spires)

  return {
    group,
    dispose() {
      rockGeometry.dispose()
      spireGeometry.dispose()
      material.dispose()
      rocks.dispose()
      spires.dispose()
    }
  }
}
