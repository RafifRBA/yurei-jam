# TASKS — Yurei Jam

Rules: one task at a time, in order within a milestone. Tick when acceptance criteria (AC) are met. After each task add a `docs/DECISIONS.md` entry.
Tags: **[M]** Must · **[S]** Should · **[C]** Could.
Schedule: Mon 19 Oct → Sun 25 Oct (MVP), then polish until 30 Oct.

**Fallback rule:** if by end of Tue 20 Oct the simulation core (T-010..T-016) is not working and tested, deploy the existing Vite + Canvas version as-is, mark 3D as "in progress", and spend remaining time on Mechammerce polish and interview prep.

---

## Milestone M0 — Setup (Mon 19 Oct)

- [V] **T-001 [M] Initialize project.** Next.js (TypeScript, App Router, Tailwind, ESLint, `src/`), `docs/` with the specs.
  AC: dev server and build pass.
- [V] **T-002 [M] Tooling.** Prettier, scripts, Vitest, Playwright (one smoke test placeholder), `tsx` for scripts, strict TS.
  AC: dummy unit + e2e tests pass.
- [V] **T-003 [M] Review the existing 2D simulation.** Owner provides the path/repo of the Vite + Canvas project and the Python experiments/Notion article. Claude Code reads them and writes `docs/EXISTING_WORK.md`: model used, parameters, findings, what can be reused, what differs from this spec.
  AC: summary written; differences from IDM spec listed; owner confirms which model to keep.
- [ ] **T-004 [M] First deploy.** *(owner: needs Vercel and GitHub accounts)* Vercel deploy of the shell page (dark theme, title, placeholder canvas area).
  AC: live URL.

## Milestone M1 — Simulation core (Mon 19 – Tue 20 Oct) — PURE TS, TEST FIRST

- [V] **T-010 [M] Types and parameters.** `sim/types.ts` (World, Params, Car arrays), defaults per TECH_SPEC §3.2, unit helpers (`kmh`).
- [V] **T-011 [M] Seeded RNG.** mulberry32 + Gaussian (Box–Muller) + tests.
  AC: determinism and distribution tests pass.
- [V] **T-012 [M] IDM acceleration + tests.** `idm.ts` per §3.2.
  AC: tests for free road, equilibrium, closing on stopped leader pass.
- [V] **T-013 [M] World step.** `createWorld`, `step` (ballistic update, noise, wrap-around, collision guard), `resize`.
  AC: speeds ≥ 0, positions in range, no NaN over 10 000 steps; determinism test; min gap > 0 under extreme params.
- [V] **T-014 [M] Stats.** density, mean speed, flow, min speed + tests with hand-computed cases.
- [V] **T-015 [M] Calibration script + presets.** `scripts/calibrate.ts` per §7; write `docs/CALIBRATION.md`; fill `sim/presets.ts` (Free flow / Critical / Jam).
  AC: documented table; presets verified by headless tests (TECH_SPEC §10 "presets" row). If waves don't appear, tune parameters and document why.
- [V] **T-016 [M] Brake perturbation + tests.**
  AC: forced deceleration ≈ 2 s then recovery; deterministic.
- [V] **T-017 [M] Benchmark script.** `step` at N=100 averages < 1 ms.
  AC: result recorded in `DECISIONS.md`.

## Milestone M2 — 3D scene (Wed 21 – Thu 22 Oct)

- [V] **T-020 [M] Canvas shell.** Dynamic import (`ssr: false`), R3F `Canvas`, lights, ground, WebGL detection + fallback notice, accessible name.
  AC: FR-ROB-1; no SSR/hydration errors.
- [V] **T-021 [M] Ring track.** Ring road geometry with lane markings; scene scale per TECH_SPEC §4.2.
  AC: ring looks correct from top and orbit views.
- [V] **T-022 [M] Instanced cars.** `Cars.tsx` with `InstancedMesh`, positions/headings from the world, color by speed ramp, legend component.
  AC: N cars visible; orientation correct; colors reflect speed; single draw call for cars.
- [V] **T-023 [M] Simulation loop.** `useSimLoop` with fixed timestep accumulator, delta clamp, speed multiplier, pause/resume, tab-hidden handling; no per-frame React renders.
  AC: motion smooth; React Profiler shows no frame-rate re-renders; FR-ROB-2.
- [V] **T-024 [M] Camera modes.** Top-down, orbit, follow (smoothed).
  AC: FR-CTL-4; switching keeps sim state.

## Milestone M3 — Controls, charts, insights (Fri 23 – Sat 24 Oct)

- [V] **T-030 [M] Control panel.** *(changed by the owner: no parameter sliders, only Add car / Remove car; random slowdowns added to the model)* Play/pause, reset, speed multiplier, sliders (N, v0, T, σ) with labels/units/`aria-valuetext`; N change recreates world, others apply live.
  AC: FR-CTL-1, FR-SIM-6.
- [V] **T-031 [M] Presets + onboarding.** *(presets removed by the owner; onboarding card kept)* Preset buttons, dismissible "What am I looking at?" card, reduced-motion behavior.
  AC: FR-CTL-2, FR-CTL-3, FR-CTL-5; a first-time user can create a visible jam in < 10 s.
- [-] **T-032 [M] Brake button.** *(removed by the owner; sudden brakes are random and get a white ring)* Brakes selected car or a random (seeded) one; visual feedback (brief highlight).
  AC: FR-SIM-5 visible in 3D and in stats.
- [V] **T-033 [M] Stats + speed chart.** Stats panel, Recharts line chart (120 s window, ≤ 4 Hz updates, animations off).
  AC: FR-CHART-1, FR-CHART-3; profiler shows no excess re-renders.
- [V] **T-034 [S] Space-time diagram.** Canvas implementation per §5.2 with legend, caption, brake tick.
  AC: FR-CHART-2; backward-moving bands visible in the Critical preset. *(Cut-line Fri 23 Oct.)*
- [-] **T-035 [M] Insights section.** *(built, then removed by the owner)* `InsightCard` components; content from the owner's verified findings (Python experiments / article); "Try it" buttons apply parameters.
  AC: FR-INS-1/2; no invented numbers; placeholders flagged `TODO(owner)` if content is missing.
- [V] **T-036 [S] Click-to-select car + URL param sync.** (S2, S4)
- [-] **T-037 [S] "About the model" accordion.** *(built, then removed by the owner)* Plain-language IDM explanation.

## Milestone M4 — Polish (Sun 25 Oct, then Week 4 slices)

- [~] **T-040 [M] Responsive + mobile performance.** *(layout checked at 390 and 1440 px; phone fps not measured)* Layout (side panel desktop / bottom sheet mobile), DPR/antialias rules, low-quality mode + FR-ROB-3 suggestion; test on a real phone.
  AC: ≥ 30 fps on mid-range phone at default N; no horizontal scroll at 360 px.
- [V] **T-041 [M] Accessibility pass.** Keyboard-only run, live summary region, labels, contrast, axe check in the smoke test.
- [V] **T-042 [M] E2E smoke test.** Load → preset → stats change → brake → no console errors.
- [~] **T-043 [M] README + GIF.** *(README written; GIF is TODO(owner))* Per TECH_SPEC §12.
- [ ] **T-044 [M] Final deploy + tag `v1.0`.** Verify on clean browser + phone; Lighthouse scores recorded.

## Milestone M5 — Japanese night-highway theme (Mon 26 – Tue 27 Oct) — SHOULD, only if M0–M4 are done

- [V] **T-050 [S] Theme: scene.** Palette tokens, night background + fog, instanced street lamps with fake glow, instanced skyline with generated window texture, road polish; Low-quality mode strips decor.
  AC: FR-THEME-1, FR-THEME-5, FR-THEME-6; speed colors remain clearly readable; fps targets still met.
- [~] **T-051 [S] Theme: UI.** *(done except Japanese: dropped by the owner; signage panels and title lockup are in)* Signage-inspired panels, title lockup, `src/content/ja.ts` with the approved strings, About/Insights term 自然渋滞 and optional 渋滞学 mention, optional colorblind ramp toggle.
  AC: FR-THEME-2, FR-THEME-3, FR-THEME-7; all Japanese strings come only from `ja.ts`; contrast AA verified.
- [-] **T-052 [M if any Japanese is used] Native-speaker proofreading.** *(not needed: no Japanese ships)* Send `ja.ts` (with romaji + intended meaning) to a native speaker; apply corrections or remove unconfirmed strings.
  AC: written confirmation (or removal) recorded in `DECISIONS.md`; no unreviewed Japanese in production.
- [ ] **T-053 [S] Re-run polish checks.** Lighthouse, phone fps, a11y pass with the theme on; update README screenshots/GIF.

## Backlog (post-freeze only)
- [ ] C1 Hover tooltips · [ ] C2 Nicer car model · [ ] C4 Compare mode
