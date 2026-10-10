import { describe, expect, it } from 'vitest'
import { parseUrlState, serializeUrlState } from './url'
import { DEFAULT_PARAMS } from '@/sim/types'

describe('url state', () => {
  it('parses a full query string', () => {
    expect(
      parseUrlState('?n=40&v0=30&t=1.5&noise=0.2&slow=0.8&hard=0.05&seed=42')
    ).toEqual({
      params: {
        n: 40,
        v0Ms: 30,
        headwayS: 1.5,
        sigmaMs2: 0.2,
        slowdownsPerMin: 0.8,
        hardBrakesPerMin: 0.05,
      },
      seed: 42,
    })
  })

  it('clamps values and ignores garbage without throwing', () => {
    const state = parseUrlState('?n=9999&v0=abc&t=-4&noise=&seed=x')
    expect(state.params).toEqual({ n: 100, headwayS: 0.8 })
    expect(state.seed).toBeUndefined()
  })

  it('round-trips', () => {
    const search = serializeUrlState({ ...DEFAULT_PARAMS, n: 55 }, 7)
    const back = parseUrlState(search)
    expect(back.params.n).toBe(55)
    expect(back.seed).toBe(7)
  })

  it('returns an empty state for an empty query', () => {
    expect(parseUrlState('')).toEqual({ params: {}, seed: undefined })
  })
})
