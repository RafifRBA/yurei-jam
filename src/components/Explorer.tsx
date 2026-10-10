'use client'
import { useEffect } from 'react'
import { prefersReducedMotion } from '@/lib/webgl'
import { parseUrlState, serializeUrlState } from '@/lib/url'
import { currentParams, useParamsStore } from '@/store/params.store'
import { useRunStore } from '@/store/run.store'
import { publishStats } from '@/three/simRuntime'
import { ControlPanel } from './ControlPanel'
import { SimulationView } from './SimulationView'

/** The scene and its controls, plus the start-up rules that need the browser. */
export function Explorer() {
  useEffect(() => {
    // S4: parameters from the URL, clamped, never throwing.
    const fromUrl = parseUrlState(window.location.search)
    if (Object.keys(fromUrl.params).length > 0) {
      useParamsStore.getState().set(fromUrl.params)
    }
    if (fromUrl.seed !== undefined) {
      useParamsStore.setState({ seed: fromUrl.seed })
    }
    // FR-CTL-5: reduced motion starts paused.
    useRunStore.getState().setPlaying(!prefersReducedMotion())
    publishStats(true)

    // Keep the URL shareable (debounced).
    let timer: number | undefined
    const unsubscribe = useParamsStore.subscribe(() => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        const { seed } = useParamsStore.getState()
        window.history.replaceState(
          null,
          '',
          serializeUrlState(currentParams(), seed)
        )
      }, 400)
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  return (
    <div
      id="simulation"
      className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
    >
      <SimulationView />
      <ControlPanel />
    </div>
  )
}
