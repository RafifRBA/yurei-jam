import { describe, expect, it } from 'vitest'
import { createRng, nextFloat, nextGaussian } from './rng'

describe('seeded rng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    for (let i = 0; i < 100; i++) expect(nextFloat(a)).toBe(nextFloat(b))
  })

  it('gives a different sequence for a different seed', () => {
    expect(nextFloat(createRng(1))).not.toBe(nextFloat(createRng(2)))
  })

  it('keeps uniform samples in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 10_000; i++) {
      const value = nextFloat(rng)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('has Gaussian mean near 0 and std near 1', () => {
    const rng = createRng(123)
    const count = 50_000
    let sum = 0
    let sumSq = 0
    for (let i = 0; i < count; i++) {
      const g = nextGaussian(rng)
      sum += g
      sumSq += g * g
    }
    const mean = sum / count
    const std = Math.sqrt(sumSq / count - mean * mean)
    expect(Math.abs(mean)).toBeLessThan(0.02)
    expect(std).toBeGreaterThan(0.98)
    expect(std).toBeLessThan(1.02)
  })
})
