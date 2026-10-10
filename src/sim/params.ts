import { DEFAULT_PARAMS, PARAM_LIMITS, type Params } from './types'

function clampTo(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

/** Always returns valid parameters; unknown or missing values fall back. Never throws. */
export function clampParams(
  input: Partial<Params>,
  base: Params = DEFAULT_PARAMS
): Params {
  const L = PARAM_LIMITS
  return {
    n: Math.round(clampTo(input.n ?? base.n, L.n.min, L.n.max, base.n)),
    v0Ms: Math.round(
      clampTo(input.v0Ms ?? base.v0Ms, L.v0Ms.min, L.v0Ms.max, base.v0Ms)
    ),
    headwayS:
      Math.round(
        clampTo(
          input.headwayS ?? base.headwayS,
          L.headwayS.min,
          L.headwayS.max,
          base.headwayS
        ) * 10
      ) / 10,
    sigmaMs2:
      Math.round(
        clampTo(
          input.sigmaMs2 ?? base.sigmaMs2,
          L.sigmaMs2.min,
          L.sigmaMs2.max,
          base.sigmaMs2
        ) * 100
      ) / 100,
    slowdownsPerMin:
      Math.round(
        clampTo(
          input.slowdownsPerMin ?? base.slowdownsPerMin,
          L.slowdownsPerMin.min,
          L.slowdownsPerMin.max,
          base.slowdownsPerMin
        ) * 10
      ) / 10,
    hardBrakesPerMin:
      Math.round(
        clampTo(
          input.hardBrakesPerMin ?? base.hardBrakesPerMin,
          L.hardBrakesPerMin.min,
          L.hardBrakesPerMin.max,
          base.hardBrakesPerMin
        ) * 100
      ) / 100,
  }
}
