'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'
import { useRunStore } from '@/store/run.store'
import { getWorld } from './simRuntime'
import { SCENE_RADIUS, angleOf } from './layout'

/** A ring on the road under the selected car, or under the car that is braking. */
export function CarMarker() {
  const ref = useRef<Mesh>(null)

  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const world = getWorld()
    const selected = useRunStore.getState().selectedCar
    const index = world.brakeCar >= 0 ? world.brakeCar : selected
    if (index === null || index >= world.n) {
      mesh.visible = false
      return
    }
    const theta = angleOf(world.xM[index]!)
    mesh.visible = true
    mesh.position.set(
      SCENE_RADIUS * Math.cos(theta),
      0.04,
      SCENE_RADIUS * Math.sin(theta)
    )
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[1.1, 1.35, 40]} />
      <meshBasicMaterial color="#ff9f43" transparent opacity={0.95} />
    </mesh>
  )
}
