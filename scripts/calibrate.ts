// Headless calibration of the presets (TECH_SPEC §7).
//   npm run calibrate            -> prints the report
//   npm run calibrate -- --write -> also writes docs/CALIBRATION.md
import { writeFileSync } from 'node:fs'
import {
  measureSwing,
  runScenario,
  timeToFirstWave,
  type RunMetrics,
} from '../src/sim/analysis'
import { DEFAULT_PARAMS, type Params } from '../src/sim/types'

const SEEDS = [1, 2, 3, 4, 5]
const base = DEFAULT_PARAMS
// A single clean disturbance: no random slowdowns and no hard brakes.
const noSlowdowns: Params = { ...base, slowdownsPerMin: 0, hardBrakesPerMin: 0 }

const kmh = (ms: number) => (ms * 3.6).toFixed(1)
const kmh0 = (ms: number) => (ms * 3.6).toFixed(0)
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

function median(xs: (number | null)[], horizonS: number): string {
  const sorted = xs.map((x) => x ?? Infinity).sort((a, b) => a - b)
  const m = sorted[Math.floor(sorted.length / 2)]!
  return Number.isFinite(m) ? `${m.toFixed(0)} s` : `> ${horizonS} s`
}

function averageRuns(runs: RunMetrics[]): RunMetrics {
  const m = (pick: (r: RunMetrics) => number) => mean(runs.map(pick))
  return {
    meanSpeedMs: m((r) => r.meanSpeedMs),
    cv: m((r) => r.cv),
    slowFraction: m((r) => r.slowFraction),
    minSpeedMs: m((r) => r.minSpeedMs),
    minSpeedRatio: m((r) => r.minSpeedRatio),
  }
}

function measure(
  params: Params,
  options: { durationS: number; warmupS: number; brakeAtS?: number }
): RunMetrics {
  return averageRuns(SEEDS.map((seed) => runScenario(params, seed, options)))
}

function swing(
  params: Params,
  brakeAtS: number | null,
  fromS: number,
  toS: number
) {
  const runs = SEEDS.map((seed) =>
    measureSwing(params, seed, { brakeAtS, fromS, toS })
  )
  return {
    swing: mean(runs.map((r) => r.swingMs)),
    slowest: mean(runs.map((r) => r.slowestMs)),
  }
}

// 1. no manual brake, default random slowdowns
function section1(): string {
  const rows = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 65, 80].map((n) => {
    const p = { ...base, n }
    const m = measure(p, { durationS: 900, warmupS: 300 })
    const w = swing(p, null, 300, 900)
    return `| ${n} | ${kmh(m.meanSpeedMs)} | ${kmh0(w.swing)} | ${kmh0(w.slowest)} |`
  })
  return [
    '| cars (= veh/km) | mean speed (km/h) | speed swing (km/h) | slowest car (km/h) |',
    '|---|---|---|---|',
    ...rows,
  ].join('\n')
}

// 2. how fast does a jam form by itself?
function section2(): string {
  const rates = [0, 0.2, 0.5, 1]
  const ns = [15, 25, 30, 35, 40, 50, 65]
  const horizon = 600
  const header = `| cars | ${rates.map((r) => `${r} per car per min`).join(' | ')} |`
  const rows = ns.map((n) => {
    const cells = rates.map((r) =>
      median(
        SEEDS.map((seed) =>
          timeToFirstWave({ ...base, n, slowdownsPerMin: r }, seed, horizon)
        ),
        horizon
      )
    )
    return `| ${n} | ${cells.join(' | ')} |`
  })
  return [header, `|---|${rates.map(() => '---').join('|')}|`, ...rows].join(
    '\n'
  )
}

// 2b. only the rare hard brakes (random slowdowns off)
function section2b(): string {
  const rates = [0.01, 0.02, 0.05]
  const ns = [15, 20, 25, 30, 35, 40, 50]
  const horizon = 900
  const header = `| cars | ${rates.map((r) => `${r} hard brakes per car per min`).join(' | ')} |`
  const rows = ns.map((n) => {
    const cells = rates.map((r) =>
      median(
        SEEDS.map((seed) =>
          timeToFirstWave(
            { ...base, n, slowdownsPerMin: 0, hardBrakesPerMin: r },
            seed,
            horizon
          )
        ),
        horizon
      )
    )
    return `| ${n} | ${cells.join(' | ')} |`
  })
  return [header, `|---|${rates.map(() => '---').join('|')}|`, ...rows].join(
    '\n'
  )
}

// 3. one brake, random slowdowns OFF: a clean single disturbance
function section3(): string {
  const rows = [15, 20, 25, 30, 32, 34, 36, 38, 40, 45, 50, 55, 65].map((n) => {
    const p = { ...noSlowdowns, n }
    const calm = swing(p, null, 40, 300)
    const early = swing(p, 2, 40, 300)
    const late = swing(p, 2, 300, 600)
    return `| ${n} | ${kmh0(calm.swing)} | ${kmh0(early.swing)} | ${kmh0(late.swing)} | ${kmh0(early.slowest)} |`
  })
  return [
    '| cars | no brake (km/h) | after one brake, 40 to 300 s | after one brake, 300 to 600 s | slowest car after one brake (km/h) |',
    '|---|---|---|---|---|',
    ...rows,
  ].join('\n')
}

// 4. speed limit, default random slowdowns
function section4(): string {
  const lines = [
    '| cars | v0 = 72 km/h | 90 km/h | 108 km/h | 126 km/h |',
    '|---|---|---|---|---|',
  ]
  for (const n of [15, 35, 65]) {
    const cells = [20, 25, 30, 35].map((v0Ms) => {
      const m = measure({ ...base, n, v0Ms }, { durationS: 900, warmupS: 300 })
      return `${kmh(m.meanSpeedMs)} km/h`
    })
    lines.push(`| ${n} | ${cells.join(' | ')} |`)
  }
  return lines.join('\n')
}

// 5. three reference densities
const REFERENCE = [
  { label: 'Light', n: 15 },
  { label: 'Busy', n: 35 },
  { label: 'Crowded', n: 65 },
]

function section5(): string {
  const rows = REFERENCE.map(({ label, n }) => {
    const p = { ...base, n }
    const calm = measure(p, { durationS: 600, warmupS: 120 })
    const w = swing(p, null, 300, 900)
    const first = median(
      SEEDS.map((seed) => timeToFirstWave(p, seed, 600)),
      600
    )
    return `| ${label} | ${n} | ${kmh(calm.meanSpeedMs)} | ${kmh0(w.swing)} | ${kmh0(w.slowest)} | ${first} |`
  })
  return [
    '| Traffic | cars | mean speed (km/h) | speed swing (km/h) | slowest car (km/h) | median time to first wave |',
    '|---|---|---|---|---|---|',
    ...rows,
  ].join('\n')
}

function firstWaveText(n: number): string {
  return median(
    SEEDS.map((seed) => timeToFirstWave({ ...base, n }, seed, 600)),
    600
  )
}

const reading = {
  light: firstWaveText(15).startsWith('>')
    ? 'no sustained wave within 600 s. Slowdowns and rare hard brakes all recover.'
    : `first sustained wave after a median of ${firstWaveText(15)}.`,
  start: `first sustained wave after a median of ${firstWaveText(30)}. Adding cars brings it forward.`,
  busy: `first sustained wave after a median of ${firstWaveText(35)}.`,
  crowded: `first sustained wave after a median of ${firstWaveText(65)}.`,
}

const report = `# Calibration

Generated by \`npm run calibrate\` (scripts/calibrate.ts). Do not edit by hand; edit the script and rerun.

Model: IDM on a ring (TECH_SPEC §3) plus random slowdowns. Fixed: L = 1000 m, car length 4.5 m,
s0 = 2 m, a = 1.0 m/s², b = 1.5 m/s², delta = 4, dt = 0.05 s.
Defaults: v0 = ${base.v0Ms} m/s (108 km/h), T = ${base.headwayS} s, driver noise sigma = ${base.sigmaMs2} m/s²,
random slowdowns = ${base.slowdownsPerMin} per car per minute (each lasts 0.5 to 1.5 s at 2 to 4 m/s² deceleration),
rare hard brakes = ${base.hardBrakesPerMin} per car per minute (down to about 10 km/h, held 1 to 3 s).
Each row is the mean (or median) of ${SEEDS.length} seeds.

Why random slowdowns exist: the driver noise alone moves a car's speed by at most about 0.5 km/h per
draw, which is invisible and never starts a jam. A phantom jam needs small sudden disturbances, as in
the author's original experiment (a random slowdown of 10 to 30% of speed).

Definitions
- **speed swing**: fastest car minus slowest car, averaged over a time window.
- **wave**: speeds differ by more than 30 km/h and some car is slower than 25 km/h. It has to last 30 s.

## 1. Without a manual brake (default random slowdowns), 300 to 900 s

${section1()}

## 2. How fast does a jam form by itself?

Median time (5 seeds) until the first sustained wave appears, with no brake pressed, for different rates of the
random slowdowns. The rare hard brakes stay at their default rate in every column.

${section2()}

## 3. Only the rare hard brakes

A hard brake takes one driver down to about 10 km/h, holds it for 1 to 3 s, then the driver goes on.
Here the random slowdowns are off, so this is what the rare anomaly does on its own. Median time (5 seeds)
until the first sustained wave (a wave must last 30 s).

${section2b()}

## 4. One brake, random slowdowns off

A single clean disturbance: one car brakes for 2 s at t = 2 s. The car that was forced to brake is left
out of the swing. A wave that fades shows a swing that shrinks between the two windows.

${section3()}

## 5. Does a higher speed limit raise the mean speed? (default slowdowns)

${section4()}

## 6. Three reference densities

${section5()}

Reading the numbers:
- Light traffic (15 cars): ${reading.light}
- The app starts at 30 cars: ${reading.start}
- Busy traffic (35 cars): ${reading.busy}
- Crowded traffic (65 cars): ${reading.crowded}
- One clean brake (section 4) fades up to about 30 cars and leaves a wave that stays from about 34 cars.
- Cars come to a full stop inside the waves (section 1), as in the original 2D experiment.

Limitations: one lane, simplified IDM, identical drivers. The thresholds belong to these parameters and
are not claims about real roads.
`

console.log(report)
if (process.argv.includes('--write')) {
  writeFileSync(new URL('../docs/CALIBRATION.md', import.meta.url), report)
  console.log('wrote docs/CALIBRATION.md')
}
