// The simulation world lives HERE, outside React (architecture rule 2).
// React state only holds UI parameters and throttled statistics.
import { computeStats, summarize } from '@/sim/stats'
import {
  addCar,
  createWorld,
  removeCar,
  setLiveParams,
  step,
} from '@/sim/world'
import { MODEL, kmh, type Params, type World } from '@/sim/types'
import { DEFAULT_PARAMS } from '@/sim/types'
import { useParamsStore } from '@/store/params.store'
import { useRunStore } from '@/store/run.store'
import { useStatsStore, type Sample } from '@/store/stats.store'

const SERIES_LENGTH = 120 // one sample per simulated second
export const COLUMN_EVERY_S = 0.25

export interface ColumnEvent {
  world: World
}

type ColumnListener = (event: ColumnEvent) => void

interface Runtime {
  world: World
  accumulatorS: number
  series: Sample[]
  nextSampleAtS: number
  nextColumnAtS: number
  listeners: Set<ColumnListener>
  lastPublishMs: number
}

const runtime: Runtime = {
  world: createWorld(DEFAULT_PARAMS, 42),
  accumulatorS: 0,
  series: [],
  nextSampleAtS: 1,
  nextColumnAtS: COLUMN_EVERY_S,
  listeners: new Set(),
  lastPublishMs: 0,
}

export function getWorld(): World {
  return runtime.world
}

export function recreateWorld(params: Params, seed: number): void {
  runtime.world = createWorld(params, seed)
  runtime.accumulatorS = 0
  runtime.series = []
  runtime.nextSampleAtS = 1
  runtime.nextColumnAtS = COLUMN_EVERY_S
  // Tell listeners (the space-time diagram) to start a fresh picture.
  for (const listener of runtime.listeners) {
    listener({ world: runtime.world })
  }
  publishStats(true)
}

export function syncLiveParams(params: Params): void {
  setLiveParams(runtime.world, params)
}

export function subscribeColumns(listener: ColumnListener): () => void {
  runtime.listeners.add(listener)
  return () => {
    runtime.listeners.delete(listener)
  }
}

/** Resets the accumulator, used after the tab was hidden so no time is "caught up". */
export function resetAccumulator(): void {
  runtime.accumulatorS = 0
}

/**
 * Fixed timestep with an accumulator. The render frame delta is clamped so a slow
 * frame can never trigger a spiral of death. Returns the number of steps taken.
 */
export function advance(frameDeltaS: number, speedMul: number): number {
  const delta = Math.min(Math.max(frameDeltaS, 0), 0.1)
  runtime.accumulatorS += delta * speedMul
  let steps = 0
  while (runtime.accumulatorS >= MODEL.dtS && steps < 40) {
    step(runtime.world, MODEL.dtS)
    runtime.accumulatorS -= MODEL.dtS
    steps++
    afterStep()
  }
  if (steps === 40) runtime.accumulatorS = 0
  return steps
}

function afterStep(): void {
  const { world } = runtime
  if (world.timeS >= runtime.nextSampleAtS) {
    const stats = computeStats(world)
    runtime.series.push({
      t: Math.round(world.timeS),
      meanSpeedKmh: kmh(stats.meanSpeedMs),
      flowVehH: stats.flowVehH,
    })
    if (runtime.series.length > SERIES_LENGTH) runtime.series.shift()
    runtime.nextSampleAtS += 1
  }
  if (world.timeS >= runtime.nextColumnAtS) {
    const event: ColumnEvent = { world }
    for (const listener of runtime.listeners) listener(event)
    runtime.nextColumnAtS += COLUMN_EVERY_S
  }
}

/** Adds one car live; the rest of the traffic reacts on its own. False when the ring is full. */
export function addCarNow(): boolean {
  const index = addCar(runtime.world)
  if (index < 0) return false
  const run = useRunStore.getState()
  if (run.selectedCar !== null && run.selectedCar >= index) {
    run.selectCar(run.selectedCar + 1)
  }
  useParamsStore.setState({ n: runtime.world.n })
  publishStats(true)
  return true
}

/** Removes one seeded random car live. False at the minimum. */
export function removeCarNow(): boolean {
  const index = removeCar(runtime.world)
  if (index < 0) return false
  const run = useRunStore.getState()
  if (run.selectedCar === index) run.selectCar(null)
  else if (run.selectedCar !== null && run.selectedCar > index) {
    run.selectCar(run.selectedCar - 1)
  }
  useParamsStore.setState({ n: runtime.world.n })
  publishStats(true)
  return true
}

/** Pushes statistics to the UI store, at most about 4 times per second. */
export function publishStats(force = false): void {
  const now = performance.now()
  if (!force && now - runtime.lastPublishMs < 250) return
  runtime.lastPublishMs = now
  const { world } = runtime
  const stats = computeStats(world)
  useStatsStore.getState().publish({
    densityVehKm: stats.densityVehKm,
    meanSpeedKmh: kmh(stats.meanSpeedMs),
    flowVehH: stats.flowVehH,
    minSpeedKmh: kmh(stats.minSpeedMs),
    jam: stats.minSpeedMs < 0.2 * world.params.v0Ms,
    simTimeS: world.timeS,
    series: runtime.series.slice(),
    summary: summarize(world, stats),
  })
}
