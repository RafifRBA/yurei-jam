import { describe, expect, it } from 'vitest'
import { equilibriumGapM, idmAcceleration } from './idm'
import { MODEL } from './types'

const v0 = 30
const T = 1.5

describe('idmAcceleration', () => {
  it('follows the free-road law when the gap is huge', () => {
    for (const v of [0, 10, 20, 29]) {
      const expected = MODEL.maxAccelMs2 * (1 - Math.pow(v / v0, MODEL.delta))
      expect(idmAcceleration(v, 0, 1e9, v0, T)).toBeCloseTo(expected, 6)
    }
  })

  it('is zero at the equilibrium gap for a given speed', () => {
    for (const v of [5, 15, 25]) {
      const gap = equilibriumGapM(v, v0, T)
      expect(idmAcceleration(v, 0, gap, v0, T)).toBeCloseTo(0, 6)
    }
  })

  it('brakes strongly when closing fast on a stopped leader', () => {
    expect(idmAcceleration(25, 25, 20, v0, T)).toBeLessThan(-5)
  })

  it('accelerates less the closer the leader is', () => {
    const far = idmAcceleration(10, 0, 100, v0, T)
    const near = idmAcceleration(10, 0, 20, v0, T)
    expect(near).toBeLessThan(far)
  })

  it('never returns NaN for a zero gap', () => {
    expect(Number.isNaN(idmAcceleration(10, 5, 0, v0, T))).toBe(false)
  })
})
