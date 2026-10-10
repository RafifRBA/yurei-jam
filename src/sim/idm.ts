import { MODEL } from './types'

/**
 * Treiber's Intelligent Driver Model.
 *   sStar = s0 + max(0, v·T + v·Δv / (2·sqrt(a·b)))
 *   a_idm = a · [1 − (v/v0)^δ − (sStar/s)²]
 * @param speedMs own speed, m/s
 * @param closingSpeedMs own speed minus leader speed, m/s (positive = approaching)
 * @param gapM bumper-to-bumper gap to the leader, m
 */
export function idmAcceleration(
  speedMs: number,
  closingSpeedMs: number,
  gapM: number,
  v0Ms: number,
  headwayS: number
): number {
  const { minGapM, maxAccelMs2, comfortDecelMs2, delta } = MODEL
  const desiredGapM =
    minGapM +
    Math.max(
      0,
      speedMs * headwayS +
        (speedMs * closingSpeedMs) /
          (2 * Math.sqrt(maxAccelMs2 * comfortDecelMs2))
    )
  const safeGapM = Math.max(gapM, 1e-3) // never divide by zero
  const freeTerm = Math.pow(speedMs / v0Ms, delta)
  const interactionTerm = (desiredGapM / safeGapM) ** 2
  return maxAccelMs2 * (1 - freeTerm - interactionTerm)
}

/** Gap at which a car at speed v with no closing speed has zero acceleration. */
export function equilibriumGapM(
  speedMs: number,
  v0Ms: number,
  headwayS: number
): number {
  const ratio = Math.pow(speedMs / v0Ms, MODEL.delta)
  return (MODEL.minGapM + speedMs * headwayS) / Math.sqrt(1 - ratio)
}
