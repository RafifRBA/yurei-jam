'use client'
import { rampGradient } from '@/lib/color'
import { useParamsStore } from '@/store/params.store'
import { useRunStore } from '@/store/run.store'

/** Colour = speed. The same information is also given as numbers. */
export function Legend() {
  const ramp = useRunStore((s) => s.ramp)
  const v0Ms = useParamsStore((s) => s.v0Ms)
  return (
    <div className="rounded-lg bg-night/80 px-3 py-2 text-xs text-ink">
      <p className="mb-1.5 font-medium">Car colour = speed</p>
      <div
        className="h-2.5 w-44 rounded-full"
        style={{ background: rampGradient(ramp) }}
        aria-hidden="true"
      />
      <div className="num mt-1 flex w-44 justify-between text-ink-muted">
        <span>0 km/h</span>
        <span>{Math.round(v0Ms * 3.6)} km/h</span>
      </div>
      <p className="mt-0.5 flex w-44 justify-between text-ink-muted">
        <span>stopped</span>
        <span>desired speed</span>
      </p>
    </div>
  )
}
