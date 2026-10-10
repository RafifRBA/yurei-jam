'use client'
import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  BoxGeometry,
  Color,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
} from 'three'
import { speedRgb } from '@/lib/color'
import { MAX_CARS } from '@/sim/types'
import { useRunStore } from '@/store/run.store'
import { getWorld } from './simRuntime'
import {
  CAR_HEIGHT,
  CAR_LENGTH,
  CAR_WIDTH,
  SCENE_RADIUS,
  angleOf,
} from './layout'

const BRAKE_COLOR = new Color('#ffffff')

/** One InstancedMesh for every car: a single draw call. */
export function Cars() {
  const meshRef = useRef<InstancedMesh>(null)
  const geometry = useMemo(
    () => new BoxGeometry(CAR_WIDTH, CAR_HEIGHT, CAR_LENGTH),
    []
  )
  const material = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.4, metalness: 0.15 }),
    []
  )
  // Reused every frame: no per-frame allocations.
  const scratch = useMemo(
    () => ({ dummy: new Object3D(), color: new Color(), rgb: [0, 0, 0] }),
    []
  )

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const world = getWorld()
    const { ramp } = useRunStore.getState()
    const { dummy, color, rgb } = scratch
    mesh.count = world.n
    for (let i = 0; i < world.n; i++) {
      const theta = angleOf(world.xM[i]!)
      const braking = i === world.brakeCar
      dummy.position.set(
        SCENE_RADIUS * Math.cos(theta),
        CAR_HEIGHT / 2 + 0.06,
        SCENE_RADIUS * Math.sin(theta)
      )
      dummy.rotation.set(0, -theta, 0) // car length lies along the tangent
      const s = braking ? 1.35 : 1
      dummy.scale.set(s, s, 1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      if (braking) {
        color.copy(BRAKE_COLOR)
      } else {
        speedRgb(world.vMs[i]! / world.params.v0Ms, ramp, rgb)
        color.setRGB(rgb[0]!, rgb[1]!, rgb[2]!, SRGBColorSpace)
      }
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (event.instanceId !== undefined) {
      useRunStore.getState().selectCar(event.instanceId)
    }
  }

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, MAX_CARS]}
      frustumCulled={false}
      onPointerDown={onPointerDown}
    />
  )
}
