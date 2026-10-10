import { MODEL, type World } from './types'

export interface Stats {
  densityVehKm: number
  meanSpeedMs: number
  flowVehH: number
  minSpeedMs: number
}

/** density = N/L, flow = density · mean speed, as in TECH_SPEC §3.8. */
export function computeStats(world: World): Stats {
  const { n, vMs } = world
  let sum = 0
  let min = Infinity
  for (let i = 0; i < n; i++) {
    const v = vMs[i]!
    sum += v
    if (v < min) min = v
  }
  const meanSpeedMs = n > 0 ? sum / n : 0
  return {
    densityVehKm: (n / MODEL.ringLengthM) * 1000,
    meanSpeedMs,
    flowVehH: (n / MODEL.ringLengthM) * meanSpeedMs * 3600,
    minSpeedMs: n > 0 ? min : 0,
  }
}

/** Plain-language summary for the live region and the canvas label. */
export function summarize(world: World, stats: Stats): string {
  const jam = stats.minSpeedMs < 0.2 * world.params.v0Ms
  const kmhMean = Math.round(stats.meanSpeedMs * 3.6)
  return `${world.n} cars, mean speed ${kmhMean} km/h, ${
    jam ? 'jam detected' : 'traffic flowing'
  }`
}
