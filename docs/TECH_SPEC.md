# TECH SPEC — Yurei Jam

Companion to `PRD.md`. If they conflict, PRD wins; record conflicts in `DECISIONS.md`.

## 1. Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | Next.js (latest stable, App Router) | Verify via `npm view next version` |
| Language | TypeScript `strict` | |
| Styling | Tailwind CSS | Dark theme by default |
| 3D | three, @react-three/fiber, @react-three/drei | Client-only (`dynamic`, `ssr: false`) |
| State | Zustand | UI params, run state, throttled stats |
| Charts | Recharts | Mean speed/flow chart |
| Space-time diagram | Plain `<canvas>` 2D | Not Recharts (performance) |
| Tests | Vitest (sim), Playwright (smoke) | |
| Hosting | Vercel | |

## 2. Repository structure

```
/
├── CLAUDE.md
├── docs/ (PRD.md, TECH_SPEC.md, TASKS.md, DECISIONS.md, CALIBRATION.md)
├── scripts/calibrate.ts          # headless preset calibration (run with tsx)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   └── page.tsx              # single page: Explorer + Insights
│   ├── sim/                      # PURE TS — no React/Three/DOM
│   │   ├── types.ts
│   │   ├── rng.ts                # seeded RNG (mulberry32) + gaussian
│   │   ├── idm.ts                # acceleration function
│   │   ├── world.ts              # createWorld, step(world, dt), applyBrake, resize
│   │   ├── stats.ts              # density, mean speed, flow, min speed
│   │   ├── presets.ts            # values from calibration
│   │   └── *.test.ts
│   ├── three/                    # R3F components
│   │   ├── Scene.tsx             # Canvas, lights, camera rig
│   │   ├── RingTrack.tsx
│   │   ├── Cars.tsx              # InstancedMesh + useFrame loop
│   │   ├── CameraRig.tsx         # top-down / orbit / follow
│   │   ├── theme/                # Should: StreetLamps.tsx, Skyline.tsx, Fog/Sky setup
│   │   └── useSimLoop.ts         # fixed-timestep accumulator
│   ├── components/
│   │   ├── ControlPanel.tsx, PresetButtons.tsx, BrakeButton.tsx
│   │   ├── StatsPanel.tsx, SpeedChart.tsx, SpaceTimeDiagram.tsx
│   │   ├── Legend.tsx, Onboarding.tsx, FallbackNotice.tsx
│   │   └── insights/ (InsightCard.tsx, insights.data.ts)
│   ├── store/ (params.store.ts, run.store.ts, stats.store.ts)
│   ├── content/ja.ts             # ALL Japanese strings live here (single review point)
│   └── lib/ (color.ts, webgl.ts, units.ts, url.ts)
└── tests/e2e/smoke.spec.ts
```

## 3. Model: IDM on a ring

### 3.1 Definitions
- Ring circumference `L` (m), `N` cars indexed `0..N-1` in driving direction; car `i`'s leader is `(i+1) mod N`.
- Position `x_i ∈ [0, L)` (m), speed `v_i ≥ 0` (m/s), car length `ℓ` (m).
- Bumper-to-bumper gap: `s_i = ((x_{lead} − x_i) mod L) − ℓ` (use positive modulo). Closing speed: `Δv_i = v_i − v_lead`.

### 3.2 Acceleration (Treiber's IDM)
```
s*_i  = s0 + max(0, v_i·T + (v_i·Δv_i) / (2·sqrt(a·b)))
a_i   = a · [ 1 − (v_i / v0)^δ − (s*_i / s_i)² ]
```
Parameters and defaults:

| Symbol | Meaning | Default | UI |
|--------|---------|---------|----|
| `L` | Ring length | 1000 m | fixed |
| `N` | Cars | preset-dependent (10–80) | slider |
| `ℓ` | Car length | 4.5 m | fixed |
| `v0` | Desired speed | 30 m/s (108 km/h) | slider 10–35 |
| `T` | Time headway | 1.5 s | slider 0.8–2.5 |
| `s0` | Minimum gap | 2 m | fixed |
| `a` | Max acceleration | 1.0 m/s² | fixed |
| `b` | Comfortable deceleration | 1.5 m/s² | fixed |
| `δ` | Acceleration exponent | 4 | fixed |
| `σ` | Driver noise (std of accel perturbation) | 0.1 m/s² | slider 0–0.5 |
| `dt` | Fixed timestep | 0.05 s | fixed |

These defaults are starting points. **Presets are calibrated empirically (see §7); do not assume where the jam threshold is.**

### 3.3 Noise
Each car keeps a held perturbation `η_i`. Every `0.5 s` of simulation time, draw `η_i ~ N(0, σ²)` from the seeded RNG; add `η_i` to `a_i`. Clamp total acceleration to `[−9, +2]` m/s².

### 3.4 Integration (ballistic update, per step)
```
a   = clamp(a_idm + η, −9, 2)
v'  = v + a·dt
if v' < 0:  x += (−v² / (2a))   // stops within the step (a < 0 here)
            v' = 0
else:       x += v·dt + 0.5·a·dt²
x = positive_mod(x, L)
```
Update all cars from the **previous** state (compute all accelerations first, then apply) to avoid order-dependent artifacts.

### 3.5 Safety / collision guard
After the update, if any `s_i < 0.1 m`: set `v_i = min(v_i, v_lead)` and nudge `x_i` back so `s_i = 0.1`. Tests must prove gaps stay `> 0` under extreme parameters (e.g., `T = 0.8`, `σ = 0.5`, `N = 80`, repeated brakes).

### 3.6 Brake perturbation
`applyBrake(world, carIndex)`: for `2 s` of sim time, that car uses forced `a = −4 m/s²` (not below `v = 0`); afterwards it returns to IDM. Default car: random (seeded) if none selected.

### 3.7 Reset / resize
`createWorld(params, seed)`: cars evenly spaced (`L/N`), initial speed = equilibrium-ish (e.g., `min(v0, (L/N − ℓ − s0)/T)` clamped ≥ 0), plus tiny random offsets (±0.5 m). Changing `N` recreates the world. Changing `v0, T, σ` mutates parameters live.

### 3.8 Statistics
```
density_veh_per_km = N / L · 1000
meanSpeed_ms       = mean(v_i)
flow_veh_per_h     = (N / L) · meanSpeed_ms · 3600
minSpeed_ms        = min(v_i)
```
Display speeds in km/h (`× 3.6`).

## 4. Rendering architecture

### 4.1 Data flow
```
useSimLoop (useFrame)
  └─ accumulator += clamp(delta, 0, 0.1) * speedMultiplier
     while accumulator >= dt: step(world, dt); accumulator -= dt; sampleStats()
  └─ Cars.tsx writes instance matrices + colors from world arrays
  └─ stats sampled at ≤ 4 Hz into Zustand (React UI reads from there)
```
Rules:
- `world` is created once per `(N, seed)` and held in a ref/module-level singleton; **not** React state.
- Use typed arrays (`Float32Array`/`Float64Array`) for positions/speeds if profiling shows benefit; otherwise simple arrays are acceptable for N ≤ 100.
- When the tab is hidden (`document.visibilityState`), pause; on resume, reset the accumulator (no catch-up beyond 0.25 s).
- `frameloop="always"` for the simulation scene (continuous motion), but `frameloop="demand"` when paused.

### 4.2 Scene scale and layout
- Work in meters in the sim; scale to scene units with `k = SCENE_RADIUS / (L / 2π)` where `SCENE_RADIUS = 30`.
- Car positions: `θ_i = 2π · x_i / L`; position `(R cos θ, 0.3, R sin θ)` (choose direction so motion looks clockwise from above); heading tangent to the circle.
- Cars may be drawn with exaggerated size (×2 length/width) for visibility; document this in the UI "About" text and in code.
- Track: flat ring (`RingGeometry` or extruded torus-like ribbon) with dashed center line (instanced small boxes or a texture generated with a canvas), plus ground disc and subtle fog.

### 4.3 Instancing
- One `InstancedMesh` with `count = N` (allocate for `MAX_N = 100`; set `mesh.count = N`).
- Geometry: box (or `RoundedBox` geometry from drei used as plain geometry) — a single draw call.
- Per frame: reuse one `Object3D` dummy; `dummy.position.set(...)`, `dummy.rotation.y = -θ - π/2` (verify orientation), `dummy.updateMatrix()`, `mesh.setMatrixAt(i, dummy.matrix)`; `mesh.instanceMatrix.needsUpdate = true`.
- Color: `t = clamp(v / v0, 0, 1)`; interpolate red → yellow → green (or a colorblind-safe ramp); `mesh.setColorAt(i, color)`; `instanceColor.needsUpdate = true`.
- Selection highlight: selected car drawn with outline color or scaled slightly (Should: S2).

### 4.4 Camera modes
- **Top-down:** orthographic-like perspective camera above the center, fixed.
- **Orbit:** `OrbitControls` around the center, limited polar angle, damping.
- **Follow:** camera behind/above the followed car, smoothed with lerp (factor depends on delta; instant if reduced motion).
Switching modes preserves sim state.

### 4.5 Picking (Should)
Use R3F `onPointerDown` on the `InstancedMesh`; `event.instanceId` gives the car index → set `selectedCar` in the run store; Brake button then targets it.

### 4.6 Quality/performance modes
- Default DPR `[1, 1.75]`; antialias on desktop, off on small screens.
- Low-quality mode (auto-suggested by FR-ROB-3): DPR 1, no shadows, no fog, antialias off.
- Avoid shadows by default (use a simple blob/contact shadow plane or none).

## 5. Charts

### 5.1 Speed/flow chart (Recharts)
- Ring buffer of samples at 1 Hz (sim time): `{ t, meanSpeedKmh, flow }`, max 120 entries.
- Push to the stats store at ≤ 4 Hz; chart uses `isAnimationActive={false}` and memoized data.
- Two series with separate Y axes (km/h and veh/h) or two stacked mini charts.

### 5.2 Space-time diagram (Should; plain canvas)
- Canvas width = 600 px (≈ 120 s → 5 px/s), height = 240 px (position 0..L → 0..H).
- Every `0.25 s` of sim time: draw one 1–2 px wide column: for each car, plot a small vertical bar at `y = x_i / L · H` colored by speed. Scroll left by shifting the image (`drawImage` self-copy) or use a circular column index.
- Jams show up as dark/red diagonal bands that slope **backward** (against the direction of travel).
- Provide a text caption and legend; mark the brake event with a small vertical tick.

## 6. UI state (Zustand)

```ts
params: { n: number; v0: number; T: number; sigma: number; seed: number }
run:    { playing: boolean; speedMul: 0.5|1|2|4; camera: 'top'|'orbit'|'follow';
          selectedCar: number | null; quality: 'high'|'low' }
stats:  { densityVehKm; meanSpeedKmh; flowVehH; minSpeedKmh; series: Sample[] }
```
- URL sync (Should S4): `?n=40&v0=30&t=1.5&noise=0.1&seed=42`; parse with clamping; never throw.
- Presets set `params` and optionally call `reset()` + `play()`.

## 7. Calibration (T-015) — required before building the UI around presets

`scripts/calibrate.ts` (run via `tsx`): for each candidate `N` in a sweep (e.g., 10..80 step 5) and for 5 seeds:
1. Simulate 900 s with `σ` default and no manual brake.
2. Discard the first 300 s.
3. Compute coefficient of variation of speeds across cars and over time (`cv`), and the fraction of time with `min speed < 0.2·v0`.
4. Classify: **free flow** (`cv` low, no slow cars), **waves** (`cv` high, recurring minima), **jam** (high density, slow everywhere).
5. Output a table to `docs/CALIBRATION.md` and choose three presets: *Free flow*, *Critical* (waves emerge, ideally triggered by a brake), *Jam*.
Record results honestly; if the defaults don't produce waves, tune `T`, `σ`, `v0`, or `a/b` and document why. (Initial guesses to test: N ≈ 15 / 35 / 55 — these are only starting points.)

## 8. Insights data
`insights.data.ts` holds up to five entries:
```ts
{ id, title, statement, evidence: { type: 'number'|'image'|'chart', content }, tryIt?: Partial<Params> }
```
Content comes from the owner's existing Python experiments/Notion article. Until provided: `TODO(owner)`. Never fabricate numbers.

## 9. Accessibility
- All controls are native inputs/buttons with labels and units; slider values are exposed via `aria-valuetext`.
- The canvas has `role="img"` and an `aria-label` that is updated (throttled to ~1 per 2 s, via a visually hidden `aria-live="polite"` region) with a plain summary: "40 cars, mean speed 18 km/h, jam detected".
- Color is never the only encoding: legend + numeric stats.
- `prefers-reduced-motion`: start paused; instant camera transitions.

## 10. Testing plan

| Test | Assertion |
|------|-----------|
| `rng` | same seed → same sequence; gaussian roughly mean 0 / std 1 over many samples |
| `idm` | free road (huge gap) → `a ≈ a_max·(1 − (v/v0)^δ)`; at equilibrium gap/speed → `a ≈ 0`; closing fast on a stopped leader → strongly negative |
| `world.step` | speeds ≥ 0; positions in `[0, L)`; no NaN across 10 000 steps; **determinism** (two runs with same seed produce identical arrays) |
| collision guard | min gap > 0 across extreme parameters and repeated brakes |
| `applyBrake` | targeted car decelerates for ~2 s then recovers |
| `stats` | density, mean speed, flow formulas with hand-computed cases |
| presets | headless run per preset: *Free flow* → low `cv`; *Critical* + brake → `min speed < 0.3·v0` at some point; *Jam* → slow mean speed |
| benchmark | `step` for N=100 averages < 1 ms (dev script; not a flaky CI test) |
| e2e smoke | page loads; click preset; stats change; Brake button works; no console errors |

## 11. Performance checklist
- React DevTools Profiler: no component re-renders at frame rate (only throttled UI).
- Chrome Performance panel: stable frame time at N=80; no GC spikes (reuse `Object3D`/`Color` instances; no per-frame allocations).
- Test on a real mid-range phone; apply low-quality mode if < 30 fps.

## 12. Deployment & README
- Vercel from GitHub; no environment variables.
- README: GIF of a jam forming, one paragraph on the phenomenon, model summary (IDM equation in plain text), architecture diagram (sim → loop → instanced scene; stats → charts), how to run/test, calibration summary, limitations (single lane, simplified IDM, exaggerated car size), future work.


## 13. Theme: Japanese night highway (Should)

Implements PRD §8A. Build only after the MVP (T-001..T-044) is complete.

### 13.1 Palette (tokens in CSS variables and a `theme.ts` constants file)
| Token | Value (starting point) | Use |
|-------|------------------------|-----|
| `--bg-night` | `#0B1026` | page/scene background |
| `--asphalt` | `#1A1D2B` | road surface |
| `--lane-line` | `#E8E6DF` | lane markings |
| `--lamp` | `#FF9F43` | street lamps (emissive) |
| `--sign-green` | `#0F5B3F` | UI panels (signage-inspired) |
| `--sign-text` | `#FFFFFF` | UI text on panels |
| `--hanko` | `#C23B22` | tiny accent only (e.g., stamp-style badge); never near the speed ramp |
| speed ramp | red `#E5484D` → amber `#F5A524` → green `#3DD68C` | cars; verify contrast vs `--asphalt` |
| optional colorblind ramp | viridis-like (dark purple → teal → yellow) | toggle |

Verify all text/background pairs for WCAG AA contrast.

### 13.2 Scene elements (cheap by design)
- **Street lamps:** one `InstancedMesh` (small emissive spheres/boxes on thin poles, or just emissive heads) evenly spaced along the ring; fake glow with a few additive-blended sprites (instanced) or a radial gradient texture; no per-lamp real lights.
- **Skyline:** one `InstancedMesh` of boxes with random heights placed in a ring outside the track; a single canvas-generated window texture (random lit windows) used as `emissiveMap`; fog hides pop-in.
- **Sky/fog:** `scene.fog` + gradient background (CSS or large inverted sphere with a gradient texture).
- **Road:** ring ribbon with dashed center line; optional subtle wet-asphalt look via `roughness` (no reflections/post-processing).
- **No** bloom or other post-processing. If a glow look is desired, use sprites/emissive only.
- **Low-quality mode:** disables skyline, fog, glow sprites, and lamps beyond a minimal set.

### 13.3 UI styling
- Panels: deep green (`--sign-green`) with white text, 1–2 px white inner border, slightly rounded corners; headings in a clean sans-serif.
- Font: `next/font` with Noto Sans JP (weights 400/700, `preload: false`) or a system stack with Japanese fallbacks (`"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`). Measure the bundle/font impact; if heavy, use the system stack only.
- Title lockup: `幽霊渋滞` large, `Yūrei Jūtai` small, subtitle `Phantom Traffic Simulator`.
- Optional small ghost glyph/icon (original SVG) near the legend to hint at "phantom".

### 13.4 Japanese content file (`src/content/ja.ts`) — DROPPED

> Owner decision (2026-10-10): no Japanese text. This file is not created.
```ts
export const ja = {
  title: '幽霊渋滞',               // Yūrei Jūtai — "phantom/ghost traffic jam" (literal; stylistic title)
  titleRomaji: 'Yūrei Jūtai',
  technicalTerm: '自然渋滞',        // shizen jūtai — the term commonly used for jams with no accident/bottleneck
  technicalTermRomaji: 'shizen jūtai',
  speed: '速度', density: '密度', flow: '流量',   // optional captions
  jamology: '渋滞学',               // jūtai-gaku — background reading only (About/Insights)
} as const;
```
Rules:
- Japanese appears only as accents next to English; never replace English labels.
- Every entry carries a comment with romaji + literal meaning.
- Proofreading task T-052 must be done by a native speaker before the final deploy; remove any string that is not confirmed.
- Do not add new Japanese strings without owner approval.

### 13.5 IP and sensitivity
- No logos, route shields, signage designs, typefaces, or vehicle brands from real expressway operators, railways, or car makers.
- Skyline is generic (random boxes), not a replica of real buildings.

### 13.6 Performance checks
- Re-run the §11 checklist with the theme on; keep ≥ 60 fps at N = 80 on a mid-range laptop and ≥ 30 fps on the reference phone (else lower decor density or enable Low-quality by default on small screens).
