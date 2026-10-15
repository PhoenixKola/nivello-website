import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Box3,
  BoxGeometry,
  CylinderGeometry,
  Group,
  LoopOnce,
  LoopRepeat,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector3
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import { createOperator } from './operator'

/**
 * The astronaut: Quaternius "Astronaut" from the Ultimate Space Kit, a rigged low-poly character released under
 * CC0 1.0 (public domain). Provenance and licence notes: docs/third-party-assets.md. The file is loaded once and
 * cloned per character, so a team of three costs one download.
 *
 * Every character exposes the same small surface: a group (feet on y = 0, facing +z, `height` tall), an `update`
 * that advances the animation, and `gesture` for the occasional nod or wave. If the model cannot be loaded the
 * procedural operator is used instead, so the scene never breaks.
 */
export type Character = {
  group: Group
  /** Group whose world matrix follows the back (for role tags). */
  back: Object3D
  update(dt: number): void
  gesture(name: 'Yes' | 'No' | 'Wave'): void
  dispose(): void
}

export type CharacterFactory = (options: { height: number; phase?: number }) => Character

const URL = '/models/astronaut.glb'

export async function loadCharacters(): Promise<CharacterFactory> {
  try {
    const gltf = await new GLTFLoader().loadAsync(URL)
    const source = gltf.scene
    const clips = gltf.animations
    // Measure once at rest: the FBX export is in centimetres, so scale is derived from the bounding box.
    source.updateMatrixWorld(true)
    const box = new Box3().setFromObject(source)
    const size = box.getSize(new Vector3())
    const naturalHeight = Math.max(0.0001, size.y)
    const feet = box.min.y
    const find = (name: string) => AnimationClip.findByName(clips, `CharacterArmature|${name}`)

    return ({ height, phase = 0 }) => {
      const model = clone(source) as Group
      const scale = height / naturalHeight
      model.scale.multiplyScalar(scale)
      model.position.y = -feet * scale
      const group = new Group()
      group.add(model)

      const disposables: { dispose(): void }[] = []
      model.traverse(object => {
        const mesh = object as Mesh
        if (!mesh.isMesh) return
        // The kit's character carries a pistol prop; this is a designer, not a soldier.
        if (mesh.name === 'Pistol') {
          mesh.visible = false
          return
        }
        mesh.frustumCulled = false
        const material = (mesh.material as MeshStandardMaterial).clone()
        // The world is lit softly; a touch of emissive keeps the pearl suit readable in shade and on phones (no point lights there).
        material.emissive = material.color.clone().multiplyScalar(0.5)
        material.emissiveMap = material.map ?? null
        material.emissiveIntensity = 0.28
        material.metalness = Math.min(material.metalness, 0.15)
        material.envMapIntensity = 0.6
        mesh.material = material
        disposables.push(material)
      })

      // The kit's character is an animal in a spacesuit. Keep its suit and rig, fold the neck away and fit a proper
      // astronaut helmet, visor and life-support pack so it reads as a person in a suit.
      const neck = model.getObjectByName('Neck')
      const torso = model.getObjectByName('Torso')
      model.updateMatrixWorld(true)
      if (neck && torso) {
        const neckWorld = neck.getWorldPosition(new Vector3())
        const torsoScale = torso.getWorldScale(new Vector3()).x || 1
        const torsoQuat = torso.getWorldQuaternion(new Quaternion()).invert()
        const unit = height / 6.4
        const rig = new Group()
        rig.quaternion.copy(torsoQuat)
        rig.scale.setScalar(1 / torsoScale)
        const toLocal = (offset: Vector3) => torso.worldToLocal(neckWorld.clone().add(offset.multiplyScalar(unit)))
        rig.position.copy(toLocal(new Vector3(0, 0.62, 0)))
        const shell = new MeshStandardMaterial({ color: 0xeef2fa, roughness: 0.3, metalness: 0.12, emissive: 0x8fa3c4, emissiveIntensity: 0.3 })
        const visorMaterial = new MeshStandardMaterial({ color: 0x070b18, roughness: 0.12, metalness: 0.4, emissive: 0x1c2c58, emissiveIntensity: 0.4 })
        const trim = new MeshStandardMaterial({ color: 0x3a2a10, roughness: 0.4, metalness: 0.5, emissive: 0xffbf43, emissiveIntensity: 0.85 })
        const pack = new MeshStandardMaterial({ color: 0xd5dbe8, roughness: 0.4, metalness: 0.3, emissive: 0x6c7da0, emissiveIntensity: 0.3 })
        disposables.push(shell, visorMaterial, trim, pack)
        const part = (geometry: SphereGeometry | TorusGeometry | BoxGeometry | CylinderGeometry, material: MeshStandardMaterial, x: number, y: number, z: number) => {
          const mesh = new Mesh(geometry, material)
          mesh.position.set(x * unit, y * unit, z * unit)
          rig.add(mesh)
          disposables.push(geometry)
          return mesh
        }
        part(new SphereGeometry(0.78 * unit, 32, 24), shell, 0, 0, 0)
        const visor = part(new SphereGeometry(0.6 * unit, 28, 20), visorMaterial, 0, 0.02, 0.34)
        visor.scale.set(1.12, 0.84, 0.72)
        const rim = part(new TorusGeometry(0.5 * unit, 0.035 * unit, 8, 40), trim, 0, 0.02, 0.62)
        rim.scale.set(1.15, 0.86, 1)
        const collar = part(new TorusGeometry(0.5 * unit, 0.09 * unit, 10, 32), shell, 0, -0.66, 0)
        collar.rotation.x = Math.PI / 2
        // life-support pack on the back, with a light strip
        part(new BoxGeometry(1.5 * unit, 1.8 * unit, 0.62 * unit), pack, 0, -1.55, -0.95)
        part(new BoxGeometry(1.0 * unit, 0.08 * unit, 0.05 * unit), trim, 0, -1.0, -1.28)
        part(new CylinderGeometry(0.16 * unit, 0.16 * unit, 0.5 * unit, 12), shell, -0.45, -2.5, -0.95)
        part(new CylinderGeometry(0.16 * unit, 0.16 * unit, 0.5 * unit, 12), shell, 0.45, -2.5, -0.95)
        torso.add(rig)
      }

      const mixer = new AnimationMixer(model)
      const idleClip = find('Idle')
      const idle: AnimationAction | undefined = idleClip ? mixer.clipAction(idleClip) : undefined
      if (idle) {
        idle.setLoop(LoopRepeat, Infinity)
        idle.time = phase
        idle.play()
      }
      const gestures: Record<string, AnimationAction | undefined> = {}
      ;(['Yes', 'No', 'Wave'] as const).forEach(name => {
        const clip = find(name)
        if (!clip) return
        const action = mixer.clipAction(clip)
        action.setLoop(LoopOnce, 1)
        action.clampWhenFinished = false
        gestures[name] = action
      })

      const back = new Group()
      back.position.set(0, height * 0.7, -height * 0.23)
      group.add(back)

      return {
        group,
        back,
        update(dt) {
          mixer.update(dt)
          neck?.scale.setScalar(0.0001)
        },
        gesture(name) {
          const action = gestures[name]
          if (!action || !idle) return
          action.reset().setEffectiveWeight(1).fadeIn(0.25).play()
          idle.crossFadeTo(action, 0.25, false)
          const done = () => {
            mixer.removeEventListener('finished', done)
            idle.reset().fadeIn(0.3).play()
            action.fadeOut(0.3)
          }
          mixer.addEventListener('finished', done)
        },
        dispose() {
          mixer.stopAllAction()
          disposables.forEach(item => item.dispose())
        }
      }
    }
  } catch (error) {
    console.warn('[Nivello cinematic] Astronaut model unavailable, using the procedural operator.', error)
    return ({ height }) => {
      const operator = createOperator({ suit: 0xe7eefb, accent: 0xffbf43, pose: 'stand' })
      operator.group.scale.setScalar(height / 3.9)
      const group = new Group()
      group.add(operator.group)
      const back = new Group()
      back.position.set(0, height * 0.7, -height * 0.23)
      group.add(back)
      return { group, back, update() {}, gesture() {}, dispose: operator.dispose }
    }
  }
}
