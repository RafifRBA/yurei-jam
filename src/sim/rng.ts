import type { Rng } from './types'

/** Seeded RNG: mulberry32 for uniform numbers, Box–Muller for Gaussian ones. */
export function createRng(seed: number): Rng {
  return { state: seed | 0, spare: null }
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: Rng): number {
  rng.state = (rng.state + 0x6d2b79f5) | 0
  let t = rng.state
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Standard normal sample (mean 0, std 1). */
export function nextGaussian(rng: Rng): number {
  if (rng.spare !== null) {
    const value = rng.spare
    rng.spare = null
    return value
  }
  let u = 0
  while (u === 0) u = nextFloat(rng) // avoid log(0)
  const v = nextFloat(rng)
  const radius = Math.sqrt(-2 * Math.log(u))
  const angle = 2 * Math.PI * v
  rng.spare = radius * Math.sin(angle)
  return radius * Math.cos(angle)
}
