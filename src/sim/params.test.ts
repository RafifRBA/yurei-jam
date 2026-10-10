import { describe, expect, it } from 'vitest'
import { clampParams } from './params'
import { DEFAULT_PARAMS } from './types'

describe('clampParams', () => {
  it('keeps valid values', () => {
    const p = {
      n: 30,
      v0Ms: 25,
      headwayS: 1.2,
      sigmaMs2: 0.2,
      slowdownsPerMin: 1.5,
      hardBrakesPerMin: 0.2,
    }
    expect(clampParams(p)).toEqual(p)
  })

  it('clamps out-of-range values', () => {
    const p = clampParams({
      n: 9999,
      v0Ms: 1,
      headwayS: 99,
      sigmaMs2: -3,
      slowdownsPerMin: 50,
      hardBrakesPerMin: 9,
    })
    expect(p).toEqual({
      n: 100,
      v0Ms: 10,
      headwayS: 2.5,
      sigmaMs2: 0,
      slowdownsPerMin: 3,
      hardBrakesPerMin: 1,
    })
  })

  it('falls back on NaN, Infinity and missing values without throwing', () => {
    const p = clampParams({ n: NaN, v0Ms: Infinity })
    expect(p.n).toBe(DEFAULT_PARAMS.n)
    expect(p.v0Ms).toBe(DEFAULT_PARAMS.v0Ms) // Infinity is not a usable value
    expect(p.headwayS).toBe(DEFAULT_PARAMS.headwayS)
  })
})
