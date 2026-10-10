# DECISIONS: Yurei Jam

What was done, why, alternatives, trade-offs. Plain language.

## Owner decisions (2026-10-10)

- **Model: pure IDM** (as in TECH_SPEC), not the reaction-delay model of the earlier 2D version.
  *Why:* it is the spec, it is smooth, and its parameters are well known. *Trade-off:* the article's
  finding "reaction time is the root cause" cannot be demonstrated here. It is shown as a result of the
  original experiment with a link to the original simulator. See `docs/EXISTING_WORK.md`.
- **No Japanese text anywhere.** *Why:* the owner is not a native speaker and unreviewed Japanese must
  not ship. *Consequence:* `ja.ts`, S6 and T-052 are dropped; the title stays "Yurei Jam". The night
  highway theme (visual only) stays.
- **Scope: MVP and the night theme together**, because the UI uses the theme tokens from the first line.

## T-001/T-002 Setup and tooling

- Next.js 16.4 App Router, TypeScript strict plus `noUncheckedIndexedAccess`, Tailwind 4, Prettier (pinned
  to the Mechammerce style), ESLint with `eslint-config-prettier`, Vitest (node environment, sim only),
  Playwright (chromium + Pixel 7) with an axe check.
- `create-next-app` added `cacheComponents` and `partialPrefetching`. I removed both: this is a
  client-side 3D app with no data fetching, and they change rendering rules for no benefit here.
  React Compiler is not enabled: the render loop mutates objects on purpose and I do not want a
  compiler reasoning about that.
- Vitest 5 wants `@types/node` 22 or 24+; raised `@types/node` to 24 instead of `--force`.
- Playwright runs on port 3100 so it cannot collide with another project on 3000. Headless Chromium
  needs software GL flags (`swiftshader`) to render the scene.
- `agentRules: false` stops Next from regenerating an `AGENTS.md` in this repo.

## T-010 to T-014, T-016 Simulation core (`src/sim`)

- Pure TypeScript, no React/Three/DOM. State is plain typed arrays inside a `World` object that the
  renderer reads and never owns.
- IDM exactly as TECH_SPEC §3.2; noise as a held Gaussian acceleration redrawn every 0.5 s; ballistic
  update (cars never reverse); accelerations are computed for all cars from the previous state, then applied.
- Collision guard keeps every gap >= 0.1 m. Tests run extreme parameters (T 0.8 s, sigma 0.5, 80 cars,
  repeated brakes) and assert the gap stays positive.
- Determinism: mulberry32 + Box–Muller; two runs with the same seed give identical arrays (tested).
- Brake: forced -4 m/s² for 2 s on the chosen car, or a seeded random one.
- `clampParams` makes every input (sliders, URL) valid and never throws.

## Owner decision, later on 2026-10-10: a pure ABM

- **Insights and About removed.** The page now ends with the live statistics and the two charts. The
  owner's findings stay in `docs/EXISTING_WORK.md`, the article and the README.
- **Presets and the manual Brake removed.** Jams come from the agents: random sudden braking is part of
  the model, not a button. Every sudden brake is shown with a **white ring** on the car (an instanced
  mesh; the ring lives 1.6 s of real time so it is still visible at 4x speed).
- **Add car / Remove car is the only traffic control**, plus play, reset, playback speed, camera, quality
  and colours. The app starts at 30 cars, where nothing forms within ten minutes; the visitor crowds the
  ring and a jam appears from about 35 cars.
- **Hard brake anomaly (owner request).** A rare second event, 0.01 per car per minute (about one
  somewhere on a 30-car ring every three to four minutes): the driver brakes at 7 m/s² down to about
  10 km/h, holds it for 1 to 3 s, then drives on. It has its own thicker ring. The owner chose "about
  10 km/h, not a full stop" and "rare, an anomaly". A first try at 0.02 made jams appear by themselves
  already at 30 cars within about 2.5 minutes, which was too frequent, so it was halved.
- A wave now has to last 30 s to count as a jam in the calibration, otherwise one hard brake that
  recovers quickly would count as a jam.
- `applyBrake` stays in `src/sim` as an experiment tool: calibration uses it to measure one clean
  disturbance, and tests use it. It is no longer reachable from the UI.

## T-015 Calibration and presets (revised)

- `npm run calibrate` writes `docs/CALIBRATION.md`. It reports, for the default parameters: the mean
  speed and speed swing without a brake (section 1), how fast a jam forms by itself for different
  slowdown rates (section 2), the effect of one clean brake (section 3), the speed-limit experiment
  (section 4) and the three presets (section 5).
- **Reference densities:** light 15 cars, busy 35, crowded 65. Verified by headless tests (`behaviour.test.ts`).
- **What went wrong first, and the fix.** The first build only had the spec's driver noise (sigma 0.1
  m/s², held 0.5 s). That moves a speed by under 0.5 km/h: free flow stayed free and no jam ever
  appeared by itself. The owner noticed ("no car ever suddenly brakes"). The original 2D model cut speed
  by 10 to 30% about every 3 seconds per car. I added **random slowdowns**: a driver slows for 0.5 to
  1.5 s at 2 to 4 m/s², default 0.5 per car per minute. With them, jams start by themselves (about 3 min
  at 35 cars, about 1 min at 65) and cars stop completely, as in the article.
- The single-disturbance experiment (one brake) is run with random slowdowns **off**, so it measures
  one clean disturbance. That is the source of the "fades up to about 30 cars, stays from about 34 cars"
  numbers.
- Corrections along the way, all from data: a wave does not die out at 40 cars; my first "min speed"
  metric included the force-braked car and overstated depth; the density thresholds moved once random
  slowdowns existed. The spec's initial guesses 15/35/55 were only partly right (35 is Critical).

## T-017 Benchmark

`npm run bench`: **0.0038 ms per step at N = 100** (target < 1 ms), measured on the owner's laptop
under Node 24. The step is not a bottleneck.

## T-020 to T-024 3D scene (`src/three`)

- **Cars:** one `InstancedMesh`, one draw call, reused `Object3D`/`Color`, no per-frame allocation.
  Cars are drawn at twice their real size; gaps are true to scale.
- **Loop:** fixed timestep 0.05 s with an accumulator, frame delta clamped to 0.1 s, at most 40 steps per
  frame. The world lives in a module-level runtime (`simRuntime.ts`); React state only holds UI
  parameters and statistics published at most 4 times per second.
- **Colour:** speed ramp with a gamma of 0.6. Plain `speed / v0` made cruising traffic at a third of the
  desired speed look almost as red as a jam, so waves were hard to see. The legend is drawn with the same
  mapping so it stays honest.
- **Cameras:** top-down (fits the ring to the narrower screen side), orbit (damping off under reduced
  motion), follow (smoothed, instant under reduced motion). Switching keeps the simulation.
- `frameloop="demand"` while paused; stores trigger `invalidate()` so UI changes still draw.
- WebGL missing or a scene error shows a notice; controls, statistics and charts keep working.
- Performance guard: if frames stay above 40 ms for 2 s, a notice offers low quality.

## T-030 to T-037 Controls, charts, insights

- **No parameter sliders (owner decision).** Desired speed, time headway and noise are fixed at the
  calibrated values; the only traffic control is **Add car / Remove car**, applied live: a new car joins
  in the middle of the widest gap at the average speed of its neighbours, and a seeded random car leaves.
  So every driver is an independent agent and the user only changes the crowding. Presets are starting
  points (they set the number of cars and restart). Brake is still the one primary action.
- `addCar` / `removeCar` live in `src/sim/world.ts` and are tested (ring order kept, gaps positive,
  stable while adding and removing, refuses when full or at 5 cars). The braking car keeps pointing at
  the same driver; the selected car index shifts with the insertion.
- Reset also restores the default parameters, because the Insights buttons can change the desired speed
  and there is no slider to put it back.
- Mobile: the control panel is a bottom sheet; presets, Brake, Play and Reset are always visible, the
  rest folds into "More". Desktop: sticky side panel.
- Chart: Recharts with animations off, a 120-sample ring buffer at 1 Hz of simulation time. Flow and speed
  use two axes.
- Space-time diagram: plain canvas, one column per 0.25 s, scrolled with a self `drawImage`; an orange tick
  marks a brake.
- Click a car to select it (instance picking); Brake then targets it. URL parameters
  (`?n=&v0=&t=&noise=&seed=`) are parsed with clamping and kept in sync with `replaceState`.
- (Insights were built and then removed by the owner; see the decision above.)

## T-050/T-051 Night theme

- Lamps, light pools, skyline: instanced meshes, an additive glow texture, and a canvas-generated window
  texture. No real light per lamp, no post-processing. Low quality removes lamps, skyline and fog.
- Palette as in TECH_SPEC §13.1. Fonts: Barlow and JetBrains Mono through `next/font`.
- Decoration avoids saturated red and green so the speed ramp keeps priority.

## Verification status (what was and was not checked)

- **Checked:** lint, typecheck, 36 unit tests, e2e smoke on desktop and mobile viewport (presets change the
  density, Add car adds one live, Brake pulls the slowest car down, no console errors), axe (no serious or critical violations), no horizontal
  overflow at 390 and 1440 px, screenshots of top, orbit and mobile views.
- **Not checked yet:** frame rate on a real phone and on an integrated GPU, Lighthouse scores, a React
  Profiler run for per-frame re-renders (the design avoids them, but it was not profiled), a keyboard-only
  run by a person, screen-reader behaviour, the "first-time visitor creates a jam in 10 s" usability check.
- `npm audit` reports findings in dev tooling only; production dependencies were not audited separately.
