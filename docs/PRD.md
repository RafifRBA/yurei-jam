# PRD — Yurei Jam

Version 1.0 · Owner: student developer · Target: live demo + repo by 25 Oct 2026 (polish until 30 Oct)

## 1. Overview
Yurei Jam is an interactive 3D visualization of **phantom traffic jams**: on a ring road with no obstacles, cars following each other with human-like behavior can spontaneously form stop-and-go waves that travel backward through the traffic. Users change density, speed, and driver noise, trigger a perturbation by braking a car, and watch the wave emerge in 3D, in a speed chart, and in a space-time diagram.

It upgrades the author's existing 2D (Vite + Canvas) simulation and its verified experimental findings into a polished 3D web experience.

## 2. Goals and non-goals

### Goals
- G1: Make the phenomenon instantly understandable visually (color = speed, wave visible).
- G2: Demonstrate Three.js/R3F skill with strong performance (instanced rendering, fixed timestep, no per-frame React renders).
- G3: Show clear separation of concerns: tested pure simulation vs. rendering vs. UI.
- G4: Present real findings from the author's earlier experiments (Insights section).

### Non-goals
- Realistic multi-lane highways, junctions, lane changes, overtaking.
- Calibration to real-world traffic data; predictive accuracy.
- Multiplayer, accounts, persistence, backend.
- Photorealistic graphics or third-party 3D assets.

## 3. Users

| User | Needs |
|------|-------|
| **Reviewer (recruiter/engineer)** | Understand within 15 s what it shows; smooth interaction; evidence of engineering quality (tests, structure, README) |
| **Curious learner** | Play with parameters; read a short, honest explanation of the model |

## 4. Success metrics
- ≥ 60 fps at N = 80 cars on a mid-range laptop (integrated GPU); ≥ 30 fps on a mid-range phone.
- Lighthouse mobile: Performance ≥ 80 (3D page), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90.
- Unit tests for `src/sim` with ≥ 90% coverage; determinism test (same seed → identical trajectory).
- A first-time visitor can trigger a visible jam in under 10 seconds using presets/brake button (usability check with 2–3 people).
- README with GIF, model explanation, architecture, how to run, limitations.

## 5. Scope and priorities

### MUST (MVP)
M1. Simulation core (IDM on a ring, seeded noise, brake perturbation) — pure TS, tested
M2. 3D scene: ring road, N cars as instanced meshes, color by speed (green → red), legend
M3. Controls (**owner decision 2026-10-10: the parameter sliders were dropped; the only traffic control is Add car / Remove car, plus presets, Brake, play/pause, reset, speed**): play/pause, reset, speed multiplier (0.5×/1×/2×/4×), sliders for car count, desired speed, time headway, driver noise; presets (Free flow / Critical / Jam); "Brake" button
M4. Camera modes: top-down, orbit, follow-car
M5. Live stats + chart: mean speed and flow over the last 120 s
M6. ~~Insights section~~ **Dropped (owner, 2026-10-10).** Insights section with the owner's verified findings (content provided by owner)
M7. Responsive layout, keyboard accessibility, reduced-motion handling, WebGL fallback
M8. Deployed on Vercel, README, DECISIONS.md

### SHOULD
S1. Space-time diagram (2D canvas) showing wave propagation
S2. Click/tap a car to select it and brake that specific car (raycast picking on instances)
S3. "About the model" accordion explaining IDM in plain language
S4. Shareable URL for parameters (`?n=40&v0=30&t=1.5&noise=0.2&seed=42`)
S5. **Japanese night-highway theme** (scene + UI styling), see §8A
S6. ~~**Japanese accent strings**~~ **Dropped (owner, 2026-10-10): no Japanese text.**

### COULD
C1. Car labels/speed tooltip on hover
C2. Better car look (rounded box + cabin) or tail lights
C3. Sound/haptics (no)
C4. Compare mode: two rings side by side with different parameters

### OUT OF SCOPE
Multi-lane, junctions, real maps, backend, user accounts, third-party models.

## 6. Functional requirements

### Simulation
- FR-SIM-1: Cars on a ring of circumference L; each follows the car ahead using IDM; positions wrap around; car order never changes (no overtaking).
- FR-SIM-2: Deterministic: same seed + same parameters → same trajectory (verified by test).
- FR-SIM-3: Safety: speeds never negative; gaps never non-positive (collision guard); no NaN.
- FR-SIM-4: Driver noise: each car receives small random acceleration perturbations (see TECH_SPEC) controlled by a slider.
- FR-SIM-5: Brake perturbation: selected (or random) car brakes hard for ~2 s then resumes normal behavior.
- FR-SIM-6: Changing car count resets cars with even spacing + tiny random offsets; changing other parameters applies live without reset.

### 3D scene
- FR-3D-1: Ring track visible with lane markings; ground plane; soft lighting.
- FR-3D-2: Cars rendered with a single `InstancedMesh`; color maps speed relative to desired speed from green (fast) through yellow to red (stopped).
- FR-3D-3: Cars may be drawn at exaggerated size for visibility; relative gaps remain proportional.
- FR-3D-4: Smooth motion at any frame rate (interpolation not required if the fixed timestep is small enough; document the choice).

### Controls and UX
- FR-CTL-1: All controls operable by keyboard and labelled; current values shown numerically; units displayed.
- FR-CTL-2: Presets set parameters in one click and optionally auto-run; their values come from the calibration script (TECH_SPEC §7).
- FR-CTL-3: A short "What am I looking at?" onboarding card visible on first load (dismissible), explaining color and the brake button in ≤ 3 sentences.
- FR-CTL-4: Camera mode buttons; follow-car mode follows a chosen car (default: car 0, or the selected car).
- FR-CTL-5: Reduced motion: if `prefers-reduced-motion`, the simulation starts paused and camera transitions are instant.

### Charts
- FR-CHART-1: Line chart of mean speed (and flow) vs. time for the last 120 s, updated ≤ 4 Hz.
- FR-CHART-2 (Should): Space-time diagram: x-axis time (last ~120 s), y-axis position along the ring, color = speed; backward-moving diagonal bands visible during jams.
- FR-CHART-3: Stats panel: density (veh/km), mean speed (km/h), flow (veh/h), min speed.

### Insights (content provided by owner)
- FR-INS-1: Section below the simulation with up to five findings, each: statement, one supporting number/plot/screenshot, and the preset or parameter set that reproduces it (button "Try it" applies the parameters).
- FR-INS-2: Findings come only from the owner's existing verified experiments; placeholders `TODO(owner)` until provided.

### Robustness
- FR-ROB-1: If WebGL is unavailable, show a message and a static screenshot/GIF; charts and text still render.
- FR-ROB-2: Pause the simulation when the tab is hidden; on resume, do not "catch up" more than 0.25 s of simulation time.
- FR-ROB-3: Performance guard: if frame time stays > 40 ms for 2 s, show a non-intrusive suggestion to reduce the car count or switch to low-quality mode (disable shadows/antialiasing).

## 7. Non-functional requirements
- Performance targets per §4; the simulation step for N = 100 must take < 1 ms on a mid-range laptop (benchmark in tests or a dev script).
- Accessibility: WCAG 2.1 AA targeted for controls and text; the 3D canvas has an accessible name and a text alternative (live summary like "40 cars, mean speed 18 km/h, jam detected").
- Browser support: latest Chrome, Safari, Firefox, Edge; iOS Safari and Android Chrome.
- No tracking/analytics.

## 8. UX/design guidelines
- Single page: sticky control panel (side on desktop, bottom sheet on mobile) + 3D view + charts + Insights.
- Visual style: dark night scene with high-contrast speed colors (see §8A for the Japanese theme); make sure red/green is not the only cue (add a legend and a numeric speed readout; consider a colorblind-friendly palette option as a Could).
- Calm, minimal UI; the scene is the hero.

## 8A. Theme: Japanese night highway (Should — only after MVP is complete)

Identity: **Yurei Jam** · 幽霊渋滞 (*Yūrei Jūtai*, "ghost/phantom traffic jam") · subtitle "Phantom Traffic Simulator".
Mood: a ring expressway at night; calm, slightly eerie ("the ghost in the traffic"), never kitschy.

- FR-THEME-1: Night scene: deep indigo sky/ground, dark asphalt ring, warm sodium-orange street lamps along the ring (instanced, emissive, no real lights per lamp), distant skyline silhouettes (instanced boxes with an emissive window texture generated on a canvas), light fog.
- FR-THEME-2: UI styling inspired by expressway signage *in general* (deep green panels, white text, thin white borders), original design only. No logos, route shields, or typefaces copied from any real expressway operator or brand.
- FR-THEME-3 (**Japanese parts dropped, owner 2026-10-10; Latin title only**): Japanese appears only as small accents next to English: title 幽霊渋滞; term 自然渋滞 (*shizen jūtai*) in the About/Insights section; optional captions 速度 / 密度 / 流量 beside speed / density / flow. All strings live in one file (`src/content/ja.ts`) so they can be reviewed at once.
- FR-THEME-4 (**not applicable: no Japanese strings ship**): Every Japanese string must be reviewed by a native speaker before final deploy; otherwise remove it (romaji or English only).
- FR-THEME-5: Speed colors keep priority: the red–amber–green speed ramp must remain clearly legible against the night background; decor must never use saturated red/green; legend and numeric speed stay visible; offer a colorblind-safe ramp toggle if time permits.
- FR-THEME-6: Theme must not reduce performance below the §4 targets; decoration uses instancing/emissive materials, no post-processing; the Low-quality mode removes skyline and fog.
- FR-THEME-7: About/Insights may mention 渋滞学 (*jūtai-gaku*, "jamology") as background reading on traffic-jam science in Japan, clearly separate from this project's model (IDM); do not imply this simulation implements that research.
- AC: A reviewer sees the theme within 3 seconds of loading; toggling Low-quality removes decor and keeps ≥ 30 fps on the reference phone; no Japanese string appears outside `ja.ts`.

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Presets don't produce visible waves with chosen IDM params | High | Calibration script (T-015) before building UI; tune `N`, `noise`, and `T` empirically; document values |
| Numerical instability/collisions | Medium | Ballistic update, small fixed `dt`, collision guard, tests with extreme params |
| Mobile performance | Medium | InstancedMesh, DPR cap, low-quality mode, fewer default cars on small screens |
| React re-render storms | High | Sim state outside React; throttle stats; verify with React DevTools profiler |
| Time pressure | High | Cut-lines: Space-time diagram → Should; fallback to deploying the existing 2D version |

## 10. Definition of done (project)
- All MUST items done and verified; SHOULD items done or listed under Future work.
- Metrics in §4 met or deviations documented.
- Live URL + public repo + README + DECISIONS.md complete.
