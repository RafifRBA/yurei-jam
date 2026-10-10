import { idmAcceleration } from './idm'
import { createRng, nextFloat, nextGaussian } from './rng'
import { MAX_CARS, MIN_CARS, MODEL, type Params, type World } from './types'

const { ringLengthM: L, carLengthM } = MODEL

export function positiveMod(value: number, modulus: number): number {
  const r = value % modulus
  return r < 0 ? r + modulus : r
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Bumper-to-bumper gap from car i to its leader (i + 1). */
export function gapM(world: World, i: number): number {
  const lead = (i + 1) % world.n
  if (world.n < 2) return L - carLengthM
  return positiveMod(world.xM[lead]! - world.xM[i]!, L) - carLengthM
}

/**
 * Cars evenly spaced with tiny random offsets, equilibrium-ish initial speed.
 * Deterministic for a given (params, seed).
 */
export function createWorld(params: Params, seed: number): World {
  const n = clamp(Math.round(params.n), 2, MAX_CARS)
  const rng = createRng(seed)
  const spacingM = L / n
  const equilibriumGuessMs =
    (spacingM - carLengthM - MODEL.minGapM) / params.headwayS
  const initialSpeedMs = clamp(
    Math.min(params.v0Ms, equilibriumGuessMs),
    0,
    params.v0Ms
  )
  const xM = new Float64Array(n)
  const vMs = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const offsetM = (nextFloat(rng) * 2 - 1) * 0.5
    xM[i] = positiveMod(i * spacingM + offsetM, L)
    vMs[i] = initialSpeedMs
  }
  return {
    params: { ...params, n },
    seed,
    timeS: 0,
    n,
    xM,
    vMs,
    accelMs2: new Float64Array(n),
    etaMs2: new Float64Array(n),
    slowLeftS: new Float64Array(n),
    slowDecelMs2: new Float64Array(n),
    hardState: new Float64Array(n),
    hardLeftS: new Float64Array(n),
    nextNoiseAtS: 0,
    brakeCar: -1,
    brakeRemainingS: 0,
    rng,
  }
}

/** v0, T and sigma can change live; changing n needs a new world. */
export function setLiveParams(
  world: World,
  live: Pick<
    Params,
    'v0Ms' | 'headwayS' | 'sigmaMs2' | 'slowdownsPerMin' | 'hardBrakesPerMin'
  >
): void {
  world.params.v0Ms = live.v0Ms
  world.params.headwayS = live.headwayS
  world.params.sigmaMs2 = live.sigmaMs2
  world.params.slowdownsPerMin = live.slowdownsPerMin
  world.params.hardBrakesPerMin = live.hardBrakesPerMin
}

/** Copy of an array with one value inserted at index. */
function inserted(source: Float64Array, index: number, value: number) {
  const out = new Float64Array(source.length + 1)
  out.set(source.subarray(0, index), 0)
  out[index] = value
  out.set(source.subarray(index), index + 1)
  return out
}

/** Copy of an array without the value at index. */
function removed(source: Float64Array, index: number) {
  const out = new Float64Array(source.length - 1)
  out.set(source.subarray(0, index), 0)
  out.set(source.subarray(index + 1), index)
  return out
}

/** Smallest bumper gap on each side of a car added in the middle of a gap. */
const MIN_GAP_AFTER_ADD_M = 1.5

/**
 * A new car joins the ring in the middle of the largest gap, at the average speed of its
 * neighbours, and then drives by itself. Returns the index of the new car, or -1 when the
 * ring is full (no gap is big enough, or the car limit is reached).
 */
export function addCar(world: World): number {
  if (world.n >= MAX_CARS) return -1
  let behind = 0
  let widest = -Infinity
  for (let i = 0; i < world.n; i++) {
    const g = gapM(world, i)
    if (g > widest) {
      widest = g
      behind = i
    }
  }
  if (widest < carLengthM + 2 * MIN_GAP_AFTER_ADD_M) return -1

  const ahead = (behind + 1) % world.n
  const centreDistanceM = widest + carLengthM
  const x = positiveMod(world.xM[behind]! + centreDistanceM / 2, L)
  const v = (world.vMs[behind]! + world.vMs[ahead]!) / 2
  const at = behind + 1 // keeps array order equal to ring order, also across the wrap

  world.xM = inserted(world.xM, at, x)
  world.vMs = inserted(world.vMs, at, v)
  world.accelMs2 = inserted(world.accelMs2, at, 0)
  world.etaMs2 = inserted(world.etaMs2, at, 0)
  world.slowLeftS = inserted(world.slowLeftS, at, 0)
  world.slowDecelMs2 = inserted(world.slowDecelMs2, at, 0)
  world.hardState = inserted(world.hardState, at, 0)
  world.hardLeftS = inserted(world.hardLeftS, at, 0)
  if (world.brakeCar >= at) world.brakeCar += 1
  world.n += 1
  world.params.n = world.n
  return at
}

/** A seeded random car leaves the ring. Returns its old index, or -1 at the minimum. */
export function removeCar(world: World): number {
  if (world.n <= MIN_CARS) return -1
  const at = Math.min(world.n - 1, Math.floor(nextFloat(world.rng) * world.n))
  world.xM = removed(world.xM, at)
  world.vMs = removed(world.vMs, at)
  world.accelMs2 = removed(world.accelMs2, at)
  world.etaMs2 = removed(world.etaMs2, at)
  world.slowLeftS = removed(world.slowLeftS, at)
  world.slowDecelMs2 = removed(world.slowDecelMs2, at)
  world.hardState = removed(world.hardState, at)
  world.hardLeftS = removed(world.hardLeftS, at)
  if (world.brakeCar === at) {
    world.brakeCar = -1
    world.brakeRemainingS = 0
  } else if (world.brakeCar > at) {
    world.brakeCar -= 1
  }
  world.n -= 1
  world.params.n = world.n
  return at
}

/** Force one car to brake hard for 2 s of simulation time. Returns the car index. */
export function applyBrake(world: World, carIndex?: number): number {
  const index =
    carIndex !== undefined && carIndex >= 0 && carIndex < world.n
      ? Math.floor(carIndex)
      : Math.min(world.n - 1, Math.floor(nextFloat(world.rng) * world.n))
  world.brakeCar = index
  world.brakeRemainingS = MODEL.brakeDurationS
  return index
}

/** Advance the world by dt seconds. All cars are updated from the previous state. */
export function step(world: World, dtS: number = MODEL.dtS): void {
  const {
    n,
    xM,
    vMs,
    accelMs2,
    etaMs2,
    slowLeftS,
    slowDecelMs2,
    hardState,
    hardLeftS,
  } = world
  const { v0Ms, headwayS, sigmaMs2 } = world.params

  // Held noise: a fresh perturbation every 0.5 s of simulation time.
  if (world.timeS >= world.nextNoiseAtS) {
    for (let i = 0; i < n; i++) etaMs2[i] = nextGaussian(world.rng) * sigmaMs2
    world.nextNoiseAtS += MODEL.noiseIntervalS
  }

  // Random slowdowns: a driver suddenly eases off or brakes for about a second.
  const startChance = (world.params.slowdownsPerMin * dtS) / 60
  for (let i = 0; i < n; i++) {
    if (slowLeftS[i]! > 0) {
      slowLeftS[i] = Math.max(0, slowLeftS[i]! - dtS)
    } else if (startChance > 0 && nextFloat(world.rng) < startChance) {
      slowLeftS[i] =
        MODEL.slowdownMinDurationS +
        nextFloat(world.rng) *
          (MODEL.slowdownMaxDurationS - MODEL.slowdownMinDurationS)
      slowDecelMs2[i] = -(
        MODEL.slowdownMinDecelMs2 +
        nextFloat(world.rng) *
          (MODEL.slowdownMaxDecelMs2 - MODEL.slowdownMinDecelMs2)
      )
    }
  }

  // Hard brakes: rare. A driver brakes down to about 10 km/h, holds it 1 to 3 s, then drives on.
  const hardChance = (world.params.hardBrakesPerMin * dtS) / 60
  for (let i = 0; i < n; i++) {
    const state = hardState[i]!
    if (state === 0) {
      if (hardChance > 0 && nextFloat(world.rng) < hardChance) hardState[i] = 1
    } else if (state === 1) {
      if (vMs[i]! <= MODEL.hardBrakeTargetMs + 0.1) {
        hardState[i] = 2
        hardLeftS[i] =
          MODEL.hardHoldMinS +
          nextFloat(world.rng) * (MODEL.hardHoldMaxS - MODEL.hardHoldMinS)
      }
    } else {
      hardLeftS[i] = hardLeftS[i]! - dtS
      if (hardLeftS[i]! <= 0) hardState[i] = 0
    }
  }

  // 1) accelerations from the previous state
  for (let i = 0; i < n; i++) {
    const lead = (i + 1) % n
    const gap = positiveMod(xM[lead]! - xM[i]!, L) - carLengthM
    const closing = vMs[i]! - vMs[lead]!
    let a: number
    if (i === world.brakeCar && world.brakeRemainingS > 0) {
      a = MODEL.brakeAccelMs2
    } else {
      a = idmAcceleration(vMs[i]!, closing, gap, v0Ms, headwayS) + etaMs2[i]!
      if (slowLeftS[i]! > 0) a = Math.min(a, slowDecelMs2[i]!)
      if (hardState[i]! === 1) {
        a = Math.min(a, MODEL.hardBrakeDecelMs2)
      } else if (hardState[i]! === 2) {
        // hold about 10 km/h: gentle correction, never less braking than the IDM asks for
        const hold = (MODEL.hardBrakeTargetMs - vMs[i]!) / 0.5
        a = Math.min(a, Math.max(-3, Math.min(1, hold)))
      }
    }
    accelMs2[i] = clamp(a, MODEL.accelMinMs2, MODEL.accelMaxMs2)
  }

  // 2) ballistic update (cars never reverse)
  for (let i = 0; i < n; i++) {
    const v = vMs[i]!
    const a = accelMs2[i]!
    const vNext = v + a * dtS
    let dx: number
    if (vNext < 0) {
      dx = a < 0 ? (v * v) / (2 * -a) : 0 // stops within the step
      vMs[i] = 0
    } else {
      dx = v * dtS + 0.5 * a * dtS * dtS
      vMs[i] = vNext
    }
    xM[i] = positiveMod(xM[i]! + dx, L)
  }

  // 3) collision guard: never let a gap fall below 0.1 m
  for (let pass = 0; pass < n; pass++) {
    let changed = false
    for (let i = 0; i < n; i++) {
      const lead = (i + 1) % n
      const gap = positiveMod(xM[lead]! - xM[i]!, L) - carLengthM
      if (gap < MODEL.collisionGapM) {
        vMs[i] = Math.min(vMs[i]!, vMs[lead]!)
        xM[i] = positiveMod(xM[lead]! - carLengthM - MODEL.collisionGapM, L)
        changed = true
      }
    }
    if (!changed) break
  }

  // 4) bookkeeping
  if (world.brakeRemainingS > 0) {
    world.brakeRemainingS = Math.max(0, world.brakeRemainingS - dtS)
    if (world.brakeRemainingS === 0) world.brakeCar = -1
  }
  world.timeS += dtS
}
