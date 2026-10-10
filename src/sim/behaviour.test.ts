import { describe, expect, it } from 'vitest'
import { measureSwing, runScenario, timeToFirstWave } from './analysis'
import { DEFAULT_PARAMS } from './types'

const SEEDS = [1, 2, 3]

// Densities used in docs/CALIBRATION.md: light 15, busy 35, crowded 65 cars.
const at = (n: number) => ({ ...DEFAULT_PARAMS, n })
// Only the one disturbance a test applies: no random slowdowns, no hard brakes.
const clean = (n: number) => ({
  ...at(n),
  slowdownsPerMin: 0,
  hardBrakesPerMin: 0,
})

describe('behaviour at three densities (headless runs)', () => {
  it('light traffic: blips and rare hard brakes recover, no jam stays', () => {
    for (const seed of SEEDS) {
      const m = runScenario(at(15), seed, { durationS: 600, warmupS: 120 })
      expect(m.slowFraction).toBeLessThan(0.15) // a hard brake is slow for a few seconds
      expect(m.meanSpeedMs).toBeGreaterThan(0.7 * DEFAULT_PARAMS.v0Ms)
      expect(timeToFirstWave(at(15), seed, 600)).toBeNull()
    }
  })

  it('busy traffic is calm when nothing disturbs it', () => {
    for (const seed of SEEDS) {
      const m = measureSwing(clean(35), seed, {
        brakeAtS: null,
        fromS: 40,
        toS: 300,
      })
      expect(m.swingMs).toBeLessThan(2) // m/s
    }
  })

  it('busy traffic: one brake leaves a clear wave', () => {
    for (const seed of SEEDS) {
      const m = measureSwing(clean(35), seed, {
        brakeAtS: 2,
        fromS: 40,
        toS: 300,
      })
      expect(m.swingMs).toBeGreaterThan(4) // m/s
    }
  })

  it('busy traffic: a jam forms by itself from the random slowdowns', () => {
    for (const seed of SEEDS) {
      expect(timeToFirstWave(at(35), seed, 900)).not.toBeNull()
    }
  })

  it('crowded traffic is slow and a jam forms within five minutes', () => {
    for (const seed of SEEDS) {
      const m = runScenario(at(65), seed, { durationS: 600, warmupS: 120 })
      expect(m.meanSpeedMs).toBeLessThan(0.3 * DEFAULT_PARAMS.v0Ms)
      expect(timeToFirstWave(at(65), seed, 300)).not.toBeNull()
    }
  })
})
