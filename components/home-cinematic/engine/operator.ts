import {
  BoxGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2
} from 'three'

/**
 * A smooth, stylised sci-fi operator: pearl suit, lathe-turned torso, tapered limbs, a rounded helmet with a glossy
 * visor and a thin light line. Proportions are slim and calm (about seven and a half heads tall) so it reads as an
 * elegant silhouette rather than a mannequin. The figure faces +z and is about 3.9 units tall standing.
 */
export type OperatorOptions = { suit: number; accent: number; pose: 'stand' | 'sit' }

export function createOperator({ suit, accent, pose }: OperatorOptions) {
  const group = new Group()
  const disposables: { dispose(): void }[] = []
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item)
    return item
  }

  const suitMaterial = track(new MeshStandardMaterial({ color: suit, roughness: 0.34, metalness: 0.12, emissive: suit, emissiveIntensity: 0.32, envMapIntensity: 0.8 }))
  const graphite = track(new MeshStandardMaterial({ color: 0x2b3650, roughness: 0.45, metalness: 0.55, emissive: 0x141c30, emissiveIntensity: 0.5 }))
  const visorMaterial = track(new MeshStandardMaterial({ color: 0x050b1a, roughness: 0.05, metalness: 0.95, emissive: accent, emissiveIntensity: 0.14, envMapIntensity: 1.6 }))
  const lightMaterial = track(new MeshStandardMaterial({ color: 0x151a26, emissive: accent, emissiveIntensity: 1.1 }))

  const put = (geometry: { dispose(): void }, material: MeshStandardMaterial, x: number, y: number, z: number, parent: Group = group) => {
    const mesh = new Mesh(track(geometry) as never, material)
    mesh.position.set(x, y, z)
    parent.add(mesh)
    return mesh
  }

  const sit = pose === 'sit'
  const hip = sit ? 1.18 : 1.72

  // Torso: a turned profile, narrow at the waist, broad at the chest, slightly flattened front to back.
  const profile = [new Vector2(0.0, 0), new Vector2(0.2, 0.02), new Vector2(0.26, 0.3), new Vector2(0.34, 0.62), new Vector2(0.4, 0.92), new Vector2(0.36, 1.12), new Vector2(0.2, 1.24), new Vector2(0, 1.26)]
  const torso = put(new LatheGeometry(profile, 28), suitMaterial, 0, hip, 0)
  torso.scale.set(1, 1, 0.68)
  const belt = put(new TorusGeometry(0.22, 0.03, 8, 28), lightMaterial, 0, hip + 0.08, 0)
  belt.rotation.x = Math.PI / 2
  belt.scale.set(1.2, 1, 0.8)
  put(new BoxGeometry(0.24, 0.03, 0.02), lightMaterial, 0, hip + 0.88, 0.26)
  put(new SphereGeometry(0.27, 20, 14), suitMaterial, 0, hip - 0.02, 0).scale.set(1.05, 0.7, 0.78)

  // Slim back unit.
  put(new BoxGeometry(0.5, 0.72, 0.22), graphite, 0, hip + 0.78, -0.3)
  put(new BoxGeometry(0.3, 0.04, 0.02), lightMaterial, 0, hip + 1.0, -0.42)

  // Neck, helmet, visor.
  put(new CylinderGeometry(0.1, 0.12, 0.14, 14), graphite, 0, hip + 1.28, 0)
  put(new SphereGeometry(0.43, 28, 20), suitMaterial, 0, hip + 1.66, 0.02)
  const visor = put(new SphereGeometry(0.36, 24, 16), visorMaterial, 0, hip + 1.67, 0.19)
  visor.scale.set(1.05, 0.72, 0.6)
  const rim = put(new TorusGeometry(0.3, 0.02, 8, 36), lightMaterial, 0, hip + 1.67, 0.3)
  rim.scale.set(1.08, 0.74, 1)

  const limb = (r: number, length: number) => new CapsuleGeometry(r, length, 6, 12)

  // Arms.
  ;[-1, 1].forEach(side => {
    put(new SphereGeometry(0.17, 14, 12), suitMaterial, side * 0.43, hip + 1.08, 0)
    if (!sit) {
      const upper = put(limb(0.1, 0.5), suitMaterial, side * 0.5, hip + 0.78, 0.05)
      upper.rotation.z = side * 0.1
      upper.rotation.x = -0.12
      const fore = put(limb(0.085, 0.46), suitMaterial, side * 0.53, hip + 0.28, 0.1)
      fore.rotation.x = -0.28
      put(new SphereGeometry(0.09, 12, 10), graphite, side * 0.53, hip - 0.0, 0.2)
    } else {
      const upper = put(limb(0.1, 0.5), suitMaterial, side * 0.5, hip + 0.82, 0.18)
      upper.rotation.x = -0.75
      upper.rotation.z = side * 0.08
      const fore = put(limb(0.085, 0.46), suitMaterial, side * 0.46, hip + 0.55, 0.62)
      fore.rotation.x = -1.35
      put(new SphereGeometry(0.09, 12, 10), graphite, side * 0.42, hip + 0.5, 0.95)
    }
  })

  // Legs.
  ;[-1, 1].forEach(side => {
    if (!sit) {
      put(limb(0.14, 0.62), suitMaterial, side * 0.17, 1.1, 0)
      put(limb(0.115, 0.55), suitMaterial, side * 0.17, 0.42, 0.02)
      put(new CapsuleGeometry(0.13, 0.22, 6, 10), graphite, side * 0.17, 0.1, 0.1).rotation.x = Math.PI / 2
    } else {
      const thigh = put(limb(0.14, 0.62), suitMaterial, side * 0.17, hip - 0.04, 0.4)
      thigh.rotation.x = Math.PI / 2
      put(limb(0.115, 0.55), suitMaterial, side * 0.17, 0.55, 0.78)
      put(new CapsuleGeometry(0.13, 0.22, 6, 10), graphite, side * 0.17, 0.1, 0.9).rotation.x = Math.PI / 2
    }
  })

  if (sit) {
    // A sleek task chair: disc base, column, moulded seat and a tall curved back with a light edge.
    put(new CylinderGeometry(0.5, 0.56, 0.06, 28), graphite, 0, 0.04, 0)
    put(new CylinderGeometry(0.06, 0.07, 0.8, 12), graphite, 0, 0.5, 0)
    put(new CylinderGeometry(0.5, 0.46, 0.12, 28), graphite, 0, 0.95, 0.05)
    const back = put(new BoxGeometry(0.82, 1.3, 0.1), graphite, 0, 1.7, -0.42)
    back.rotation.x = -0.1
    put(new BoxGeometry(0.82, 0.03, 0.04), lightMaterial, 0, 2.36, -0.45)
  }

  return {
    group,
    dispose() {
      disposables.forEach(item => item.dispose())
    }
  }
}
