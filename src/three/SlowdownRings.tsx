'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, MeshBasicMaterial, Object3D, RingGeometry } from 'three'
import { MAX_CARS } from '@/sim/types'
import { getWorld } from './simRuntime'
import { SCENE_RADIUS, angleOf } from './layout'

const SHOW_MS = 1600 // how long a ring stays after the driver starts braking (real time)
const HARD_SHOW_MS = 3200 // a hard brake is rarer and lasts longer, so it stays longer
const MAX_RINGS = 24

/**
 * White rings on the road around cars whose driver has just braked suddenly:
 * a thin ring for a quick slowdown, a thick and larger ring for a rare hard brake.
 * Two InstancedMeshes. Lifetime is in real time, so rings are visible at 4x speed too.
 */
export function SlowdownRings() {
  const softRef = useRef<InstancedMesh>(null)
  const hardRef = useRef<InstancedMesh>(null)
  const softGeometry = useMemo(() => new RingGeometry(0.95, 1.2, 40), [])
  const hardGeometry = useMemo(() => new RingGeometry(1.5, 2.1, 48), [])
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      }),
    []
  )
  const dummy = useMemo(() => new Object3D(), [])
  // Mutable per-car expiry times and the car count they were recorded for (render-loop state).
  const softExpire = useRef(new Float64Array(MAX_CARS))
  const hardExpire = useRef(new Float64Array(MAX_CARS))
  const lastN = useRef(0)

  useFrame(() => {
    const soft = softRef.current
    const hard = hardRef.current
    if (!soft || !hard) return
    const world = getWorld()
    const now = performance.now()
    // Car indices shift when cars are added or removed: start clean.
    if (world.n !== lastN.current) {
      softExpire.current.fill(0)
      hardExpire.current.fill(0)
      lastN.current = world.n
    }
    const softAt = softExpire.current
    const hardAt = hardExpire.current
    let softCount = 0
    let hardCount = 0
    for (let i = 0; i < world.n; i++) {
      if (world.slowLeftS[i]! > 0) {
        softAt[i] = Math.max(softAt[i]!, now + SHOW_MS)
      }
      if (world.hardState[i]! > 0) {
        hardAt[i] = Math.max(hardAt[i]!, now + HARD_SHOW_MS)
      }
      const theta = angleOf(world.xM[i]!)
      const x = SCENE_RADIUS * Math.cos(theta)
      const z = SCENE_RADIUS * Math.sin(theta)

      const hardLeft = hardAt[i]! - now
      if (hardLeft > 0 && hardCount < MAX_RINGS) {
        const s = 1 + 0.5 * (hardLeft / HARD_SHOW_MS)
        dummy.position.set(x, 0.06, z)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.scale.set(s, s, 1)
        dummy.updateMatrix()
        hard.setMatrixAt(hardCount++, dummy.matrix)
      }
      const softLeft = softAt[i]! - now
      if (softLeft > 0 && hardLeft <= 0 && softCount < MAX_RINGS) {
        const s = 1 + 0.7 * (softLeft / SHOW_MS)
        dummy.position.set(x, 0.05, z)
        dummy.rotation.set(-Math.PI / 2, 0, 0)
        dummy.scale.set(s, s, 1)
        dummy.updateMatrix()
        soft.setMatrixAt(softCount++, dummy.matrix)
      }
    }
    soft.count = softCount
    hard.count = hardCount
    soft.instanceMatrix.needsUpdate = true
    hard.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={softRef}
        args={[softGeometry, material, MAX_RINGS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={hardRef}
        args={[hardGeometry, material, MAX_RINGS]}
        frustumCulled={false}
      />
    </group>
  )
}
