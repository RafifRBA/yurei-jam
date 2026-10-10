'use client'
import { useEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  CanvasTexture,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { createRng, nextFloat } from '@/sim/rng'

const BUILDINGS = 84

/** Random lit windows on a dark canvas, used as the emissive map of every building. */
function windowTexture(): CanvasTexture {
  const w = 128
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#05070f'
  ctx.fillRect(0, 0, w, h)
  const rng = createRng(11)
  for (let y = 6; y < h - 6; y += 12) {
    for (let x = 6; x < w - 6; x += 12) {
      const r = nextFloat(rng)
      if (r < 0.34) {
        ctx.fillStyle = r < 0.07 ? '#cfe0ff' : r < 0.22 ? '#ffcf8a' : '#c98b4a'
        ctx.fillRect(x, y, 6, 7)
      }
    }
  }
  return new CanvasTexture(canvas)
}

/** Generic skyline: random boxes in a ring outside the track. Not a real city. */
export function Skyline() {
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: '#0f1530',
        roughness: 0.9,
        emissive: '#ffffff',
        emissiveMap: windowTexture(),
        emissiveIntensity: 0.75,
      }),
    []
  )

  useEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const rng = createRng(7)
    const dummy = new Object3D()
    for (let i = 0; i < BUILDINGS; i++) {
      const theta =
        (2 * Math.PI * i) / BUILDINGS + (nextFloat(rng) - 0.5) * 0.04
      const radius = 56 + nextFloat(rng) * 26
      const width = 3.5 + nextFloat(rng) * 5
      const depth = 3.5 + nextFloat(rng) * 5
      const height = 6 + Math.pow(nextFloat(rng), 1.6) * 30
      dummy.position.set(
        radius * Math.cos(theta),
        height / 2 - 0.03,
        radius * Math.sin(theta)
      )
      dummy.rotation.set(0, -theta, 0)
      dummy.scale.set(width, height, depth)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, BUILDINGS]}
      frustumCulled={false}
    />
  )
}
