import { computeStats } from './stats'
import { applyBrake, createWorld, step } from './world'
import { MODEL, type Params } from './types'

export interface RunOptions {
  durationS: number
  warmupS: number // samples before this time are discarded
  brakeAtS?: number // optional manual brake on a seeded random car
  sampleEveryS?: number // default 1 s
}

export interface RunMetrics {
  meanSpeedMs: number // over samples after warm-up
  cv: number // coefficient of variation of speeds, across cars and time
  slowFraction: number // share of samples where some car is below 0.2·v0
  minSpeedMs: number // slowest car seen after warm-up
  minSpeedRatio: number // minSpeedMs / v0
}

/** Headless run used by the calibration script, the preset tests and the benchmark. */
export function runScenario(
  params: Params,
  seed: number,
  options: RunOptions
): RunMetrics {
  const world = createWorld(params, seed)
  const sampleEveryS = options.sampleEveryS ?? 1
  const totalSteps = Math.round(options.durationS / MODEL.dtS)
  const stepsPerSample = Math.max(1, Math.round(sampleEveryS / MODEL.dtS))
  let braked = false

  let count = 0
  let sum = 0
  let sumSq = 0
  let slowSamples = 0
  let samples = 0
  let minSpeed = Infinity

  for (let s = 1; s <= totalSteps; s++) {
    if (
      !braked &&
      options.brakeAtS !== undefined &&
      world.timeS >= options.brakeAtS
    ) {
      applyBrake(world)
      braked = true
    }
    step(world)
    if (s % stepsPerSample !== 0 || world.timeS < options.warmupS) continue

    const stats = computeStats(world)
    samples++
    if (stats.minSpeedMs < 0.2 * params.v0Ms) slowSamples++
    if (stats.minSpeedMs < minSpeed) minSpeed = stats.minSpeedMs
    for (let i = 0; i < world.n; i++) {
      const v = world.vMs[i]!
      sum += v
      sumSq += v * v
      count++
    }
  }

  const mean = count > 0 ? sum / count : 0
  const variance = count > 0 ? Math.max(0, sumSq / count - mean * mean) : 0
  return {
    meanSpeedMs: mean,
    cv: mean > 0 ? Math.sqrt(variance) / mean : 0,
    slowFraction: samples > 0 ? slowSamples / samples : 0,
    minSpeedMs: Number.isFinite(minSpeed) ? minSpeed : 0,
    minSpeedRatio: Number.isFinite(minSpeed) ? minSpeed / params.v0Ms : 0,
  }
}

export interface SwingMetrics {
  swingMs: number // mean of (fastest - slowest car) between fromS and toS
  slowestMs: number // slowest speed seen in that window
}

/**
 * How much the speeds of the cars swing from one end of a wave to the other.
 * The car that was forced to brake is left out, so this measures the wave, not the brake.
 */
export function measureSwing(
  params: Params,
  seed: number,
  options: { brakeAtS: number | null; fromS: number; toS: number }
): SwingMetrics {
  const world = createWorld(params, seed)
  const totalSteps = Math.round(options.toS / MODEL.dtS)
  let braked = -1
  let swingSum = 0
  let samples = 0
  let slowest = Infinity
  for (let s = 1; s <= totalSteps; s++) {
    if (
      options.brakeAtS !== null &&
      braked < 0 &&
      world.timeS >= options.brakeAtS
    ) {
      braked = applyBrake(world)
    }
    step(world)
    if (world.timeS < options.fromS || s % 10 !== 0) continue
    let min = Infinity
    let max = 0
    for (let i = 0; i < world.n; i++) {
      if (i === braked) continue
      const v = world.vMs[i]!
      if (v < min) min = v
      if (v > max) max = v
    }
    swingSum += max - min
    samples++
    if (min < slowest) slowest = min
  }
  return {
    swingMs: samples > 0 ? swingSum / samples : 0,
    slowestMs: Number.isFinite(slowest) ? slowest : 0,
  }
}

/** A wave is on the ring when speeds differ by more than 30 km/h and someone is under 25 km/h. */
export const WAVE_SWING_MS = 30 / 3.6
export const WAVE_SLOWEST_MS = 25 / 3.6

/** A wave has to last this long, so a hard brake that recovers quickly does not count as a jam. */
export const WAVE_SUSTAINED_S = 30

/**
 * Seconds until the first sustained wave appears with no manual brake, or null if none appears
 * within maxS. Used to describe how fast a jam forms by itself from the random events.
 */
export function timeToFirstWave(
  params: Params,
  seed: number,
  maxS: number
): number | null {
  const world = createWorld(params, seed)
  const totalSteps = Math.round(maxS / MODEL.dtS)
  let since = -1
  for (let s = 1; s <= totalSteps; s++) {
    step(world)
    if (s % 10 !== 0 || world.timeS < 20) continue
    let min = Infinity
    let max = 0
    for (let i = 0; i < world.n; i++) {
      const v = world.vMs[i]!
      if (v < min) min = v
      if (v > max) max = v
    }
    const wave = max - min > WAVE_SWING_MS && min < WAVE_SLOWEST_MS
    if (!wave) {
      since = -1
    } else if (since < 0) {
      since = world.timeS
    } else if (world.timeS - since >= WAVE_SUSTAINED_S) {
      return since
    }
  }
  return null
}
