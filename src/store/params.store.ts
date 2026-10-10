import { create } from 'zustand'
import { clampParams } from '@/sim/params'
import { DEFAULT_PARAMS, type Params } from '@/sim/types'

export const DEFAULT_SEED = 42

interface ParamsState extends Params {
  seed: number
  /** Sets one or more parameters (clamped). */
  set: (patch: Partial<Params>) => void
}

export const useParamsStore = create<ParamsState>((set, get) => ({
  ...DEFAULT_PARAMS,
  seed: DEFAULT_SEED,
  set: (patch) => {
    const { n, v0Ms, headwayS, sigmaMs2, slowdownsPerMin, hardBrakesPerMin } =
      get()
    set(
      clampParams(patch, {
        n,
        v0Ms,
        headwayS,
        sigmaMs2,
        slowdownsPerMin,
        hardBrakesPerMin,
      })
    )
  },
}))

export function currentParams(): Params {
  const { n, v0Ms, headwayS, sigmaMs2, slowdownsPerMin, hardBrakesPerMin } =
    useParamsStore.getState()
  return { n, v0Ms, headwayS, sigmaMs2, slowdownsPerMin, hardBrakesPerMin }
}
