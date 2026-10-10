'use client'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { currentParams, useParamsStore } from '@/store/params.store'
import { useRunStore } from '@/store/run.store'
import {
  advance,
  getWorld,
  publishStats,
  recreateWorld,
  resetAccumulator,
  syncLiveParams,
} from './simRuntime'

/**
 * Steps the simulation inside the render loop. No React state changes per frame:
 * the world is mutated in place and only throttled statistics reach the stores.
 */
export function useSimLoop(): void {
  const invalidate = useThree((s) => s.invalidate)
  const lastResetToken = useRef(useRunStore.getState().resetToken)
  const slowForS = useRef(0)

  // n, seed or a reset recreate the world; v0, T and sigma are applied live.
  const sync = useRef(() => {
    const run = useRunStore.getState()
    const p = useParamsStore.getState()
    const world = getWorld()
    if (
      world.n !== p.n ||
      world.seed !== p.seed ||
      run.resetToken !== lastResetToken.current
    ) {
      lastResetToken.current = run.resetToken
      recreateWorld(currentParams(), p.seed)
    } else {
      syncLiveParams(currentParams())
    }
  })

  // While paused the loop does not run, so react to UI changes explicitly.
  useEffect(() => {
    const onChange = () => {
      sync.current()
      invalidate()
    }
    const unsubParams = useParamsStore.subscribe(onChange)
    const unsubRun = useRunStore.subscribe((state, prev) => {
      if (
        state.resetToken !== prev.resetToken ||
        state.ramp !== prev.ramp ||
        state.selectedCar !== prev.selectedCar ||
        state.camera !== prev.camera ||
        state.playing !== prev.playing
      ) {
        onChange()
      }
    })
    const onVisibility = () => {
      if (document.hidden) resetAccumulator()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      unsubParams()
      unsubRun()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [invalidate])

  useFrame((_, delta) => {
    const run = useRunStore.getState()
    sync.current()
    if (!run.playing || document.hidden) {
      slowForS.current = 0
      return
    }
    advance(delta, run.speedMul)
    publishStats()

    // Performance guard: frame time above 40 ms for 2 s suggests low quality.
    if (delta > 0.04) {
      slowForS.current += delta
      if (
        slowForS.current > 2 &&
        !run.perfSuggestion &&
        run.quality === 'high'
      ) {
        run.setPerfSuggestion(true)
      }
    } else {
      slowForS.current = 0
    }
  })
}
