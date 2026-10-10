'use client'
import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { prefersReducedMotion } from '@/lib/webgl'
import { useRunStore } from '@/store/run.store'
import { getWorld } from './simRuntime'
import { SCENE_RADIUS, angleOf } from './layout'

const target = new Vector3()
const lookAt = new Vector3()

/** Top-down (fixed), orbit (user controlled) and follow-car (smoothed) cameras. */
export function CameraRig() {
  const mode = useRunStore((s) => s.camera)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height))

  // Distance at which the whole ring (plus lamps) fits the narrower screen side.
  const halfFov = MathUtils.degToRad(camera.fov / 2)
  const fitDistance =
    (SCENE_RADIUS + 11) / Math.tan(halfFov) / Math.min(1, aspect)

  useEffect(() => {
    if (mode === 'orbit') {
      camera.up.set(0, 1, 0)
      camera.position.set(0, fitDistance * 0.55, fitDistance * 0.7)
      camera.lookAt(0, 0, 0)
    }
    if (mode === 'top') camera.up.set(0, 0, -1)
    if (mode === 'follow') camera.up.set(0, 1, 0)
  }, [mode, camera, fitDistance])

  useFrame((_, delta) => {
    if (mode === 'top') {
      camera.position.set(0, fitDistance, 0)
      camera.lookAt(0, 0, 0)
      return
    }
    if (mode === 'follow') {
      const world = getWorld()
      const selected = useRunStore.getState().selectedCar
      const index = selected !== null && selected < world.n ? selected : 0
      const theta = angleOf(world.xM[index]!)
      const cx = SCENE_RADIUS * Math.cos(theta)
      const cz = SCENE_RADIUS * Math.sin(theta)
      const tx = -Math.sin(theta) // unit tangent, direction of travel
      const tz = Math.cos(theta)
      target.set(cx - tx * 11, 6.5, cz - tz * 11)
      lookAt.set(cx + tx * 14, 0.5, cz + tz * 14)
      const k = prefersReducedMotion() ? 1 : 1 - Math.exp(-6 * delta)
      camera.position.lerp(target, k)
      camera.lookAt(lookAt)
    }
  })

  return mode === 'orbit' ? (
    <OrbitControls
      makeDefault
      enableDamping={!prefersReducedMotion()}
      dampingFactor={0.08}
      target={[0, 0, 0]}
      minDistance={18}
      maxDistance={170}
      maxPolarAngle={Math.PI / 2.05}
      enablePan={false}
    />
  ) : null
}
