'use client'
import { useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
} from 'three'
import { ROAD_WIDTH, SCENE_RADIUS } from '../layout'

const LAMPS = 28
const POLE_RADIUS = SCENE_RADIUS + ROAD_WIDTH / 2 + 1.0

function glowTexture(): CanvasTexture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  )
  g.addColorStop(0, 'rgba(255,159,67,0.85)')
  g.addColorStop(0.45, 'rgba(255,159,67,0.28)')
  g.addColorStop(1, 'rgba(255,159,67,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  return new CanvasTexture(canvas)
}

/**
 * Sodium-orange lamps along the ring. Three instanced meshes (poles, heads, light pools);
 * no real light per lamp, the glow is an additive texture on the road.
 */
export function StreetLamps() {
  const poles = useRef<InstancedMesh>(null)
  const heads = useRef<InstancedMesh>(null)
  const pools = useRef<InstancedMesh>(null)

  const assets = useMemo(
    () => ({
      poleGeo: new BoxGeometry(0.14, 3, 0.14),
      poleMat: new MeshStandardMaterial({ color: '#242a4a', roughness: 0.8 }),
      headGeo: new SphereGeometry(0.26, 12, 8),
      headMat: new MeshBasicMaterial({ color: '#ffb066' }),
      poolGeo: new CircleGeometry(3.4, 24),
      poolMat: new MeshBasicMaterial({
        map: glowTexture(),
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    }),
    []
  )

  useEffect(() => {
    const dummy = new Object3D()
    for (let i = 0; i < LAMPS; i++) {
      const theta = (2 * Math.PI * i) / LAMPS
      const cx = Math.cos(theta)
      const cz = Math.sin(theta)
      dummy.rotation.set(0, 0, 0)
      dummy.position.set(POLE_RADIUS * cx, 1.5, POLE_RADIUS * cz)
      dummy.updateMatrix()
      poles.current?.setMatrixAt(i, dummy.matrix)

      dummy.position.set(
        (POLE_RADIUS - 0.5) * cx,
        3.05,
        (POLE_RADIUS - 0.5) * cz
      )
      dummy.updateMatrix()
      heads.current?.setMatrixAt(i, dummy.matrix)

      dummy.rotation.set(-Math.PI / 2, 0, 0)
      dummy.position.set(
        (SCENE_RADIUS + 0.4) * cx,
        0.035,
        (SCENE_RADIUS + 0.4) * cz
      )
      dummy.updateMatrix()
      pools.current?.setMatrixAt(i, dummy.matrix)
    }
    for (const ref of [poles, heads, pools]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true
    }
  }, [])

  return (
    <group>
      <instancedMesh
        ref={poles}
        args={[assets.poleGeo, assets.poleMat, LAMPS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={heads}
        args={[assets.headGeo, assets.headMat, LAMPS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={pools}
        args={[assets.poolGeo, assets.poolMat, LAMPS]}
        frustumCulled={false}
      />
    </group>
  )
}
