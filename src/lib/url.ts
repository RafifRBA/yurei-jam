import { clampParams } from '@/sim/params'
import type { Params } from '@/sim/types'

export interface UrlState {
  params: Partial<Params>
  seed?: number
}

function num(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

/** `?n=40&v0=30&t=1.5&noise=0.2&slow=0.5&seed=42`. Missing or invalid values are skipped; never throws. */
export function parseUrlState(search: string): UrlState {
  try {
    const q = new URLSearchParams(search)
    const raw: Partial<Params> = {}
    const n = num(q.get('n'))
    const v0 = num(q.get('v0'))
    const t = num(q.get('t'))
    const noise = num(q.get('noise'))
    const slow = num(q.get('slow'))
    const hard = num(q.get('hard'))
    if (n !== undefined) raw.n = n
    if (v0 !== undefined) raw.v0Ms = v0
    if (t !== undefined) raw.headwayS = t
    if (noise !== undefined) raw.sigmaMs2 = noise
    if (slow !== undefined) raw.slowdownsPerMin = slow
    if (hard !== undefined) raw.hardBrakesPerMin = hard
    const params: Partial<Params> = {}
    const clamped = clampParams(raw)
    if (raw.n !== undefined) params.n = clamped.n
    if (raw.v0Ms !== undefined) params.v0Ms = clamped.v0Ms
    if (raw.headwayS !== undefined) params.headwayS = clamped.headwayS
    if (raw.sigmaMs2 !== undefined) params.sigmaMs2 = clamped.sigmaMs2
    if (raw.slowdownsPerMin !== undefined)
      params.slowdownsPerMin = clamped.slowdownsPerMin
    if (raw.hardBrakesPerMin !== undefined)
      params.hardBrakesPerMin = clamped.hardBrakesPerMin
    const seed = num(q.get('seed'))
    return { params, seed: seed !== undefined ? Math.trunc(seed) : undefined }
  } catch {
    return { params: {} }
  }
}

export function serializeUrlState(params: Params, seed: number): string {
  const q = new URLSearchParams({
    n: String(params.n),
    v0: String(params.v0Ms),
    t: String(params.headwayS),
    noise: String(params.sigmaMs2),
    slow: String(params.slowdownsPerMin),
    hard: String(params.hardBrakesPerMin),
    seed: String(seed),
  })
  return `?${q.toString()}`
}
