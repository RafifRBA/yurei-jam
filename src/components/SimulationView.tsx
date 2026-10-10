'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { hasWebGL } from '@/lib/webgl'
import { useRunStore } from '@/store/run.store'
import { useStatsStore } from '@/store/stats.store'
import { CameraButtons } from './CameraButtons'
import { FallbackNotice } from './FallbackNotice'
import { Legend } from './Legend'
import { Onboarding } from './Onboarding'
import { SceneBoundary } from './SceneBoundary'

// Three.js stays out of the first bundle: loaded only on the client, only here.
const Scene = dynamic(() => import('@/three/Scene'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center text-sm text-ink-muted"
      role="status"
    >
      Loading the 3D scene…
    </div>
  ),
})

/** Plain-language summary, refreshed at most every 2 s so screen readers are not flooded. */
function useThrottledSummary(): string {
  const [text, setText] = useState('Phantom traffic simulation')
  useEffect(() => {
    const id = window.setInterval(() => {
      const next = useStatsStore.getState().summary
      if (next) setText((prev) => (prev === next ? prev : next))
    }, 2000)
    return () => window.clearInterval(id)
  }, [])
  return text
}

export function SimulationView() {
  const webgl = useRunStore((s) => s.webgl)
  const setWebgl = useRunStore((s) => s.setWebgl)
  const perfSuggestion = useRunStore((s) => s.perfSuggestion)
  const setQuality = useRunStore((s) => s.setQuality)
  const setPerfSuggestion = useRunStore((s) => s.setPerfSuggestion)
  const summary = useThrottledSummary()

  useEffect(() => {
    setWebgl(hasWebGL() ? 'ok' : 'missing')
  }, [setWebgl])

  return (
    <div>
      <div className="relative h-[60dvh] min-h-[22rem] overflow-hidden rounded-xl border border-night-line bg-night lg:h-[calc(100dvh-7.5rem)] lg:max-h-[56rem] lg:min-h-[32rem]">
        <div
          role="img"
          aria-label={`Ring road with cars coloured by speed. ${summary}.`}
          className="absolute inset-0"
        >
          {webgl === 'missing' ? (
            <FallbackNotice reason="no-webgl" />
          ) : webgl === 'ok' ? (
            <SceneBoundary>
              <Scene />
            </SceneBoundary>
          ) : null}
        </div>

        <p className="sr-only" aria-live="polite">
          {summary}
        </p>

        {webgl === 'ok' && (
          <>
            <div className="absolute left-3 top-3 hidden lg:block">
              <Onboarding className="max-w-64" />
            </div>
            <div className="absolute right-3 top-3">
              <CameraButtons />
            </div>
            <div className="absolute bottom-3 left-3">
              <Legend />
            </div>
            {perfSuggestion && (
              <div
                role="status"
                className="sign-panel absolute bottom-3 right-3 flex max-w-64 flex-col gap-2 p-3 text-sm"
              >
                <p>
                  Frames are slow. Lower the car count or switch to low quality.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="min-h-11 flex-1 cursor-pointer rounded-md bg-white px-3 font-medium text-sign-deep"
                    onClick={() => setQuality('low')}
                  >
                    Low quality
                  </button>
                  <button
                    type="button"
                    className="min-h-11 cursor-pointer rounded-md px-3 font-medium ring-1 ring-white/70"
                    onClick={() => setPerfSuggestion(false)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {webgl === 'ok' && (
        <div className="mt-3 lg:hidden">
          <Onboarding />
        </div>
      )}
    </div>
  )
}
