// Pure simulation types. No React, no Three.js, no DOM in src/sim.
// Units are written in names or comments: m, s, m/s, m/s².

/** Fixed model constants (TECH_SPEC §3.2). */
export const MODEL = {
  ringLengthM: 1000,
  carLengthM: 4.5,
  minGapM: 2, // s0, IDM minimum gap
  maxAccelMs2: 1.0, // a
  comfortDecelMs2: 1.5, // b
  delta: 4, // acceleration exponent
  dtS: 0.05,
  noiseIntervalS: 0.5,
  accelMinMs2: -9,
  accelMaxMs2: 2,
  collisionGapM: 0.1,
  brakeAccelMs2: -4,
  brakeDurationS: 2,
  // Random slowdowns: a driver suddenly eases off or brakes for a moment.
  slowdownMinDurationS: 0.5,
  slowdownMaxDurationS: 1.5,
  slowdownMinDecelMs2: 2,
  slowdownMaxDecelMs2: 4,
  // Hard brakes: a rare anomaly. A driver brakes hard down to about 10 km/h, holds it for
  // 1 to 3 s, then drives on.
  hardBrakeTargetMs: 10 / 3.6,
  hardBrakeDecelMs2: -7,
  hardHoldMinS: 1,
  hardHoldMaxS: 3,
} as const

export const MAX_CARS = 100
export const MIN_CARS = 5

/** Parameters the user can change. */
export interface Params {
  n: number // cars on the ring
  v0Ms: number // desired speed, m/s
  headwayS: number // T, time headway, s
  sigmaMs2: number // driver noise, std of acceleration perturbation, m/s²
  slowdownsPerMin: number // sudden random slowdowns per car per minute
  hardBrakesPerMin: number // rare hard brakes per car per minute
}

export const DEFAULT_PARAMS: Params = {
  n: 30,
  v0Ms: 30,
  headwayS: 1.5,
  sigmaMs2: 0.1,
  slowdownsPerMin: 0.5,
  hardBrakesPerMin: 0.01,
}

/** Slider ranges (TECH_SPEC §3.2). */
export const PARAM_LIMITS = {
  n: { min: 5, max: MAX_CARS, step: 1 },
  v0Ms: { min: 10, max: 35, step: 1 },
  headwayS: { min: 0.8, max: 2.5, step: 0.1 },
  sigmaMs2: { min: 0, max: 0.5, step: 0.05 },
  slowdownsPerMin: { min: 0, max: 3, step: 0.1 },
  hardBrakesPerMin: { min: 0, max: 1, step: 0.01 },
} as const

export interface Rng {
  state: number
  spare: number | null // cached second Gaussian sample from Box–Muller
}

export interface World {
  params: Params
  seed: number
  timeS: number
  n: number
  xM: Float64Array // position along the ring, [0, L)
  vMs: Float64Array // speed, >= 0
  accelMs2: Float64Array // acceleration applied in the last step
  etaMs2: Float64Array // held noise per car
  slowLeftS: Float64Array // time left in a random slowdown, 0 when none
  slowDecelMs2: Float64Array // acceleration used while slowing down (negative)
  hardState: Float64Array // 0 none, 1 braking down to the target, 2 holding it
  hardLeftS: Float64Array // time left in the hold
  nextNoiseAtS: number
  brakeCar: number // -1 when nobody is forced to brake
  brakeRemainingS: number
  rng: Rng
}

export const kmh = (speedMs: number): number => speedMs * 3.6
export const msFromKmh = (speedKmh: number): number => speedKmh / 3.6
