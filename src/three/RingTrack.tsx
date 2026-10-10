'use client'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { ROAD_WIDTH, SCENE_RADIUS } from './layout'

const DASHES = 110

/** Ring road: asphalt ribbon, edge lines, and a dashed centre line (instanced). */
export function RingTrack() {
  const dashRef = useRef<InstancedMesh>(null)
  const dashGeometry = useMemo(() => new BoxGeometry(0.1, 0.02, 0.9), [])
  const dashMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#e8e6df', roughness: 0.8 }),
    []
  )

  useEffect(() => {
    const mesh = dashRef.current
    if (!mesh) return
    const dummy = new Object3D()
    for (let i = 0; i < DASHES; i++) {
      const theta = (2 * Math.PI * i) / DASHES
      dummy.position.set(
        SCENE_RADIUS * Math.cos(theta),
        0.025,
        SCENE_RADIUS * Math.sin(theta)
      )
      dummy.rotation.set(0, -theta, 0)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  const half = ROAD_WIDTH / 2
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <circleGeometry args={[130, 64]} />
        <meshStandardMaterial color="#0e1430" roughness={1} />
      </mesh>
      {/* road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SCENE_RADIUS - half, SCENE_RADIUS + half, 160]} />
        <meshStandardMaterial color="#1a1d2b" roughness={0.9} />
      </mesh>
      {/* edge lines */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.015, 0]}
        >
          <ringGeometry
            args={[
              SCENE_RADIUS + side * (half - 0.2) - 0.045,
              SCENE_RADIUS + side * (half - 0.2) + 0.045,
              160,
            ]}
          />
          <meshStandardMaterial color="#e8e6df" roughness={0.8} />
        </mesh>
      ))}
      <instancedMesh
        ref={dashRef}
        args={[dashGeometry, dashMaterial, DASHES]}
        frustumCulled={false}
      />
    </group>
  )
}
