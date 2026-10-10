'use client'
import { useState } from 'react'
import { DEFAULT_PARAMS, MAX_CARS, MIN_CARS } from '@/sim/types'
import { useParamsStore } from '@/store/params.store'
import {
  useRunStore,
  type Quality,
  type SpeedMultiplier,
} from '@/store/run.store'
import { addCarNow, removeCarNow } from '@/three/simRuntime'
import { Icon } from './Icon'

const SPEEDS: SpeedMultiplier[] = [0.5, 1, 2, 4]

const segmentBase =
  'min-h-11 cursor-pointer rounded-md px-2 text-sm font-medium transition-colors aria-pressed:bg-white aria-pressed:text-sign-deep'
const quietButton =
  'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ring-1 ring-white/70 transition-colors hover:bg-sign-deep disabled:cursor-not-allowed disabled:opacity-50'

export function ControlPanel() {
  // Mobile: the panel is a bottom sheet; the details fold away. Desktop: always open.
  const [expanded, setExpanded] = useState(false)
  const [notice, setNotice] = useState('')

  const cars = useParamsStore((s) => s.n)
  const setParams = useParamsStore((s) => s.set)
  const playing = useRunStore((s) => s.playing)
  const setPlaying = useRunStore((s) => s.setPlaying)
  const reset = useRunStore((s) => s.reset)
  const speedMul = useRunStore((s) => s.speedMul)
  const setSpeedMul = useRunStore((s) => s.setSpeedMul)
  const quality = useRunStore((s) => s.quality)
  const setQuality = useRunStore((s) => s.setQuality)
  const ramp = useRunStore((s) => s.ramp)
  const setRamp = useRunStore((s) => s.setRamp)

  const add = () => {
    const ok = addCarNow()
    setNotice(
      ok ? '' : 'The ring is full: there is no gap left for another car.'
    )
    if (ok) setPlaying(true)
  }
  const remove = () => {
    const ok = removeCarNow()
    setNotice(ok ? '' : `The ring keeps at least ${MIN_CARS} cars.`)
  }
  const resetAll = () => {
    setParams({ ...DEFAULT_PARAMS })
    reset()
    setNotice('')
  }

  return (
    <aside
      aria-label="Simulation controls"
      className="fixed inset-x-0 bottom-0 z-40 lg:sticky lg:top-4 lg:z-auto lg:self-start"
    >
      <div className="sign-panel m-2 max-h-[80dvh] overflow-y-auto p-4 lg:m-0 lg:max-h-[calc(100dvh-2rem)]">
        <div className="flex items-center justify-between lg:hidden">
          <h2 className="text-base font-semibold">Controls</h2>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="more-controls"
            onClick={() => setExpanded((v) => !v)}
            className="flex min-h-11 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium hover:bg-sign-deep"
          >
            {expanded ? 'Fewer' : 'More'}
            <span
              className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
            >
              <Icon name="chevron" size={18} />
            </span>
          </button>
        </div>
        <h2 className="hidden text-lg font-semibold lg:block">Controls</h2>

        <fieldset className="mt-3">
          <legend className="mb-1.5 flex w-full items-baseline justify-between text-sm font-medium">
            <span>Traffic</span>
            <output aria-live="polite" className="num">
              {cars} cars
            </output>
          </legend>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={add}
              disabled={cars >= MAX_CARS}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-lamp px-4 text-base font-bold text-asphalt transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="plus" />
              Add car
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={cars <= MIN_CARS}
              className={`${quietButton} min-h-12`}
            >
              <Icon name="minus" size={18} />
              Remove
            </button>
          </div>
          <p className="mt-2 min-h-10 text-sm text-white/85" role="status">
            {notice ||
              'Every car drives by itself. Add cars and watch what the others do.'}
          </p>
        </fieldset>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-pressed={playing}
            onClick={() => setPlaying(!playing)}
            className={quietButton}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
            {playing ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={resetAll} className={quietButton}>
            <Icon name="reset" size={18} />
            Reset
          </button>
        </div>

        <div
          id="more-controls"
          className={`${expanded ? 'block' : 'hidden'} lg:block`}
        >
          <fieldset className="mt-4">
            <legend className="mb-1.5 text-sm font-medium">Speed</legend>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-sign-deep p-1">
              {SPEEDS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={speedMul === m}
                  onClick={() => setSpeedMul(m)}
                  className={`${segmentBase} num`}
                >
                  {m}×
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Quality</legend>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-sign-deep p-1">
                {(['high', 'low'] as Quality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    aria-pressed={quality === q}
                    onClick={() => setQuality(q)}
                    className={segmentBase}
                  >
                    {q === 'high' ? 'High' : 'Low'}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Colours</legend>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-sign-deep p-1">
                <button
                  type="button"
                  aria-pressed={ramp === 'default'}
                  onClick={() => setRamp('default')}
                  className={segmentBase}
                >
                  Standard
                </button>
                <button
                  type="button"
                  aria-pressed={ramp === 'colorblind'}
                  onClick={() => setRamp('colorblind')}
                  className={segmentBase}
                  title="Purple to yellow ramp that is safe for colour-blind viewers"
                >
                  Safe
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </aside>
  )
}
