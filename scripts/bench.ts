// Benchmark: average cost of one simulation step at N = 100 (target < 1 ms).
import { createWorld, step } from '../src/sim/world'
import { DEFAULT_PARAMS } from '../src/sim/types'

const world = createWorld({ ...DEFAULT_PARAMS, n: 100 }, 1)
for (let i = 0; i < 2000; i++) step(world) // warm-up for the JIT

const STEPS = 20_000
const start = performance.now()
for (let i = 0; i < STEPS; i++) step(world)
const elapsedMs = performance.now() - start
console.log(
  `N=100: ${(elapsedMs / STEPS).toFixed(4)} ms per step (${STEPS} steps)`
)
