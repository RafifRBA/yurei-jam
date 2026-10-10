'use client'
import { useEffect, useRef } from 'react'
import { speedCss } from '@/lib/color'
import { MODEL } from '@/sim/types'
import { useRunStore } from '@/store/run.store'
import { subscribeColumns } from '@/three/simRuntime'

const WIDTH = 480 // 120 s at 4 columns per second
const HEIGHT = 240
const LEVELS = 64

/**
 * FR-CHART-2: x = time (last 120 s), y = position on the ring, colour = speed.
 * Jams show up as diagonal bands that lean backward. Plain canvas, one column every 0.25 s.
 */
export function SpaceTimeDiagram() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ramp = useRunStore((s) => s.ramp)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const lut = Array.from({ length: LEVELS }, (_, i) =>
      speedCss(i / (LEVELS - 1), ramp)
    )
    const clear = () => {
      ctx.fillStyle = '#0b1026'
      ctx.fillRect(0, 0, WIDTH, HEIGHT)
    }
    clear()

    return subscribeColumns(({ world }) => {
      if (world.timeS === 0) {
        clear()
        return
      }
      ctx.drawImage(canvas, -1, 0) // scroll one column to the left
      ctx.fillStyle = '#0b1026'
      ctx.fillRect(WIDTH - 1, 0, 1, HEIGHT)
      for (let i = 0; i < world.n; i++) {
        const t = Math.min(1, Math.max(0, world.vMs[i]! / world.params.v0Ms))
        ctx.fillStyle = lut[Math.round(t * (LEVELS - 1))]!
        const y = Math.floor((world.xM[i]! / MODEL.ringLengthM) * HEIGHT)
        ctx.fillRect(WIDTH - 1, y, 1, 2)
      }
    })
  }, [ramp])

  return (
    <section aria-labelledby="st-title">
      <h2 id="st-title" className="text-lg font-semibold">
        Space-time diagram
      </h2>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        role="img"
        aria-label="Space-time diagram. Time runs left to right over the last two minutes, position along the ring runs top to bottom, and colour is speed. Slow bands that lean backward are jams."
        className="mt-3 block h-60 w-full rounded-lg border border-night-line bg-night [image-rendering:pixelated]"
      />
      <p className="mt-2 text-sm text-ink-muted">
        Time runs left to right (last two minutes). Position on the ring runs
        top to bottom. Slow, dark-red bands that lean backward are jams moving
        against the direction of travel.
      </p>
    </section>
  )
}
