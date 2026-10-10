import { describe, expect, it } from 'vitest'
import {
  addCar,
  applyBrake,
  createWorld,
  gapM,
  removeCar,
  setLiveParams,
  step,
} from './world'
import { computeStats, summarize } from './stats'
import { DEFAULT_PARAMS, MODEL, type Params, type World } from './types'

function run(world: World, steps: number): void {
  for (let i = 0; i < steps; i++) step(world)
}

function minGap(world: World): number {
  let min = Infinity
  for (let i = 0; i < world.n; i++) min = Math.min(min, gapM(world, i))
  return min
}

function assertSane(world: World): void {
  for (let i = 0; i < world.n; i++) {
    const x = world.xM[i]!
    const v = world.vMs[i]!
    expect(Number.isFinite(x)).toBe(true)
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(MODEL.ringLengthM)
  }
}

describe('createWorld', () => {
  it('places cars evenly with tiny offsets', () => {
    const world = createWorld({ ...DEFAULT_PARAMS, n: 20 }, 1)
    expect(world.n).toBe(20)
    for (let i = 0; i < 20; i++) {
      const expected = i * 50
      const diff = Math.abs(world.xM[i]! - expected)
      expect(Math.min(diff, 1000 - diff)).toBeLessThanOrEqual(0.5)
    }
  })

  it('starts below equilibrium speed when the ring is crowded', () => {
    const world = createWorld({ ...DEFAULT_PARAMS, n: 100 }, 1)
    expect(world.vMs[0]!).toBeLessThan(DEFAULT_PARAMS.v0Ms)
  })
})

describe('step', () => {
  it('keeps speeds >= 0, positions in range and no NaN over 10 000 steps', () => {
    const world = createWorld({ ...DEFAULT_PARAMS, n: 50 }, 3)
    for (let block = 0; block < 100; block++) {
      run(world, 100)
      assertSane(world)
    }
  })

  it('is deterministic: same seed and parameters give identical arrays', () => {
    const a = createWorld({ ...DEFAULT_PARAMS, n: 40 }, 99)
    const b = createWorld({ ...DEFAULT_PARAMS, n: 40 }, 99)
    applyBrake(a, 5)
    applyBrake(b, 5)
    run(a, 2000)
    run(b, 2000)
    expect(Array.from(a.xM)).toEqual(Array.from(b.xM))
    expect(Array.from(a.vMs)).toEqual(Array.from(b.vMs))
  })

  it('gives a different trajectory for a different seed', () => {
    const a = createWorld(DEFAULT_PARAMS, 1)
    const b = createWorld(DEFAULT_PARAMS, 2)
    run(a, 1000)
    run(b, 1000)
    expect(Array.from(a.vMs)).not.toEqual(Array.from(b.vMs))
  })

  it('keeps every gap above zero under extreme parameters and repeated brakes', () => {
    const extreme: Params = {
      n: 80,
      v0Ms: 35,
      headwayS: 0.8,
      sigmaMs2: 0.5,
      slowdownsPerMin: 3, // the maximum
      hardBrakesPerMin: 1, // the maximum
    }
    for (const seed of [1, 2, 3]) {
      const world = createWorld(extreme, seed)
      for (let block = 0; block < 60; block++) {
        applyBrake(world)
        run(world, 100)
        expect(minGap(world)).toBeGreaterThan(0)
        assertSane(world)
      }
    }
  })

  it('applies v0, T and sigma live without recreating the world', () => {
    const world = createWorld(DEFAULT_PARAMS, 1)
    run(world, 100)
    const positions = Array.from(world.xM)
    setLiveParams(world, {
      v0Ms: 20,
      headwayS: 2,
      sigmaMs2: 0,
      slowdownsPerMin: 0,
      hardBrakesPerMin: 0,
    })
    expect(world.params.v0Ms).toBe(20)
    expect(Array.from(world.xM)).toEqual(positions)
  })
})

describe('applyBrake', () => {
  it('slows the targeted car for about 2 s, then it recovers', () => {
    const world = createWorld(
      {
        n: 20,
        v0Ms: 30,
        headwayS: 1.5,
        sigmaMs2: 0,
        slowdownsPerMin: 0,
        hardBrakesPerMin: 0,
      },
      1
    )
    run(world, 200) // settle
    const before = world.vMs[7]!
    expect(applyBrake(world, 7)).toBe(7)
    run(world, 40) // 2 s
    const during = world.vMs[7]!
    expect(during).toBeLessThan(before - 5)
    expect(world.brakeCar).toBe(-1)
    run(world, 600) // 30 s
    expect(world.vMs[7]!).toBeGreaterThan(during + 3)
  })

  it('picks a seeded random car when none is given', () => {
    const a = createWorld(DEFAULT_PARAMS, 5)
    const b = createWorld(DEFAULT_PARAMS, 5)
    expect(applyBrake(a)).toBe(applyBrake(b))
  })
})

describe('computeStats', () => {
  it('matches hand-computed values', () => {
    const world = createWorld(
      {
        n: 4,
        v0Ms: 30,
        headwayS: 1.5,
        sigmaMs2: 0,
        slowdownsPerMin: 0,
        hardBrakesPerMin: 0,
      },
      1
    )
    world.vMs.set([10, 20, 30, 0])
    const stats = computeStats(world)
    expect(stats.densityVehKm).toBeCloseTo(4, 10) // 4 cars on 1 km
    expect(stats.meanSpeedMs).toBeCloseTo(15, 10)
    expect(stats.flowVehH).toBeCloseTo(0.004 * 15 * 3600, 6) // 216 veh/h
    expect(stats.minSpeedMs).toBe(0)
  })

  it('describes the traffic in plain language', () => {
    const world = createWorld(
      {
        n: 4,
        v0Ms: 30,
        headwayS: 1.5,
        sigmaMs2: 0,
        slowdownsPerMin: 0,
        hardBrakesPerMin: 0,
      },
      1
    )
    world.vMs.set([10, 20, 30, 0])
    expect(summarize(world, computeStats(world))).toBe(
      '4 cars, mean speed 54 km/h, jam detected'
    )
  })
})

describe('addCar and removeCar', () => {
  const calm: Params = {
    ...DEFAULT_PARAMS,
    n: 20,
    sigmaMs2: 0,
    slowdownsPerMin: 0,
  }

  it('adds a car in the widest gap, in ring order, with sane values', () => {
    const world = createWorld(calm, 1)
    run(world, 200)
    const index = addCar(world)
    expect(index).toBeGreaterThanOrEqual(0)
    expect(world.n).toBe(21)
    expect(world.params.n).toBe(21)
    for (const arr of [world.xM, world.vMs, world.accelMs2, world.etaMs2]) {
      expect(arr.length).toBe(21)
    }
    assertSane(world)
    expect(minGap(world)).toBeGreaterThan(1)
    // ring order is preserved: positions increase around the ring from car 0 on
    let wraps = 0
    for (let i = 0; i < world.n; i++) {
      if (world.xM[(i + 1) % world.n]! < world.xM[i]!) wraps++
    }
    expect(wraps).toBe(1)
  })

  it('stays stable when cars are added and removed while it runs', () => {
    const world = createWorld({ ...DEFAULT_PARAMS, n: 30 }, 4)
    for (let block = 0; block < 40; block++) {
      run(world, 50)
      if (block % 2 === 0) addCar(world)
      else removeCar(world)
      assertSane(world)
      expect(minGap(world)).toBeGreaterThan(0)
    }
  })

  it('refuses to add when the ring is full and to remove at the minimum', () => {
    const world = createWorld({ ...calm, n: 20 }, 2)
    let guard = 0
    while (addCar(world) >= 0 && guard++ < 200) {
      run(world, 5)
    }
    expect(world.n).toBeLessThanOrEqual(100)
    expect(addCar(world)).toBe(-1)

    const small = createWorld({ ...calm, n: 5 }, 2)
    expect(removeCar(small)).toBe(-1)
    expect(small.n).toBe(5)
  })

  it('keeps the braking car pointing at the same driver', () => {
    const world = createWorld(calm, 1)
    applyBrake(world, 10)
    const before = world.xM[10]!
    const at = addCar(world)
    const after = world.xM[world.brakeCar]!
    expect(after).toBeCloseTo(before, 6)
    expect(at).toBeGreaterThanOrEqual(0)
  })
})

describe('random slowdowns', () => {
  it('start for some drivers, last about a second, and then end', () => {
    const world = createWorld(
      { ...DEFAULT_PARAMS, n: 40, slowdownsPerMin: 3, sigmaMs2: 0 },
      9
    )
    let everSlowing = 0
    let maxLeft = 0
    for (let s = 0; s < 1200; s++) {
      step(world)
      for (let i = 0; i < world.n; i++) {
        if (world.slowLeftS[i]! > 0) everSlowing++
        maxLeft = Math.max(maxLeft, world.slowLeftS[i]!)
      }
    }
    expect(everSlowing).toBeGreaterThan(0)
    expect(maxLeft).toBeLessThanOrEqual(1.5)
  })

  it('never start when the rate is 0', () => {
    const world = createWorld(
      { ...DEFAULT_PARAMS, n: 40, slowdownsPerMin: 0 },
      9
    )
    run(world, 1200)
    expect(Array.from(world.slowLeftS).every((t) => t === 0)).toBe(true)
  })
})

describe('hard brakes', () => {
  it('drop a driver to about 10 km/h, hold it, then release', () => {
    const params = {
      ...DEFAULT_PARAMS,
      n: 20,
      sigmaMs2: 0,
      slowdownsPerMin: 0,
      hardBrakesPerMin: 1, // the maximum: frequent enough to observe
    }
    const world = createWorld(params, 5)
    let sawBraking = 0
    let sawHolding = 0
    let lowestInHold = Infinity
    let highestInHold = 0
    for (let s = 0; s < 6000; s++) {
      step(world)
      for (let i = 0; i < world.n; i++) {
        if (world.hardState[i] === 1) sawBraking++
        if (world.hardState[i] === 2) {
          sawHolding++
          lowestInHold = Math.min(lowestInHold, world.vMs[i]!)
          highestInHold = Math.max(highestInHold, world.vMs[i]!)
        }
      }
      assertSane(world)
    }
    expect(sawBraking).toBeGreaterThan(0)
    expect(sawHolding).toBeGreaterThan(0)
    // while holding, the speed stays near 10 km/h (2.8 m/s), unless the IDM asks for less
    expect(highestInHold).toBeLessThan(5) // m/s
    expect(lowestInHold).toBeGreaterThanOrEqual(0)
  })

  it('never start when the rate is 0', () => {
    const world = createWorld(
      { ...DEFAULT_PARAMS, n: 30, slowdownsPerMin: 0, hardBrakesPerMin: 0 },
      5
    )
    run(world, 1200)
    expect(Array.from(world.hardState).every((s) => s === 0)).toBe(true)
  })
})
