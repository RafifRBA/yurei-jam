'use client'
import { Canvas } from '@react-three/fiber'
import { useRunStore } from '@/store/run.store'
import { CameraRig } from './CameraRig'
import { CarMarker } from './CarMarker'
import { Cars } from './Cars'
import { NIGHT } from './layout'
import { RingTrack } from './RingTrack'
import { SimLoop } from './SimLoop'
import { SlowdownRings } from './SlowdownRings'
import { Skyline } from './theme/Skyline'
import { StreetLamps } from './theme/StreetLamps'

/** The 3D scene. Client only: imported with next/dynamic (ssr: false). */
export default function Scene() {
  const playing = useRunStore((s) => s.playing)
  const quality = useRunStore((s) => s.quality)
  const high = quality === 'high'

  return (
    <Canvas
      frameloop={playing ? 'always' : 'demand'}
      dpr={high ? [1, 1.75] : 1}
      gl={{ antialias: high, powerPreference: 'high-performance' }}
      camera={{ fov: 35, near: 0.5, far: 700, position: [0, 120, 0] }}
    >
      <color attach="background" args={[NIGHT]} />
      {high && <fog attach="fog" args={[NIGHT, 150, 330]} />}
      <ambientLight intensity={1.15} color="#b9c6ff" />
      <directionalLight
        position={[25, 70, 35]}
        intensity={1.7}
        color="#e3e9ff"
      />

      <SimLoop />
      <RingTrack />
      <Cars />
      <CarMarker />
      <SlowdownRings />
      {high && <StreetLamps />}
      {high && <Skyline />}
      <CameraRig />
    </Canvas>
  )
}
