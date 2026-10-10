# CLAUDE.md — Yurei Jam

## What this project is
Yurei Jam is an interactive **3D simulation of phantom traffic jams** on a circular road: cars follow each other with the Intelligent Driver Model (IDM); small perturbations grow into stop-and-go waves that travel backward. It is a portfolio piece (Three.js, performance, data visualization, ability to explain a model) for a job interview in early November 2026.
It is a port/upgrade of an existing Vite + Canvas 2D simulation by the same author (path to be provided in task T-003). Reuse the author's ideas and verified findings; do not invent results.

**Before any task, read:** `docs/PRD.md`, `docs/TECH_SPEC.md`, `docs/TASKS.md`.

## Stack
Next.js (latest stable, App Router) · TypeScript (strict) · Tailwind CSS · three + @react-three/fiber + @react-three/drei · Zustand · Recharts · Vitest · Playwright (one smoke test) · ESLint + Prettier · Vercel.
English UI only. No backend.

## Commands
```
npm run dev | build | lint | typecheck | test | test:e2e
npm run calibrate     # headless script to calibrate presets (created in T-015)
```

## Architecture rules (important)
1. **Simulation is pure TypeScript** in `src/sim/**`: no React, no Three.js, no DOM. Deterministic given a seed. Fully unit-tested.
2. **Rendering reads simulation state; it never owns it.** Simulation state lives in a mutable object/ref (not React state). React state holds only UI parameters and throttled statistics.
3. **No per-frame React re-renders.** Use `useFrame` to step the simulation and update instance matrices/colors directly on the `InstancedMesh`.
4. Fixed timestep with accumulator (`dt = 0.05 s`); render rate may vary. Clamp frame delta to avoid spiral of death.
5. Charts update at low frequency (≤ 4 Hz) from sampled stats.

## Conventions
- TypeScript `strict`, no `any`, no unexplained `eslint-disable`.
- Name physical quantities with units in comments or names (`speedMs`, `gapM`).
- Small modules, named exports, tests next to logic (`*.test.ts`).
- Conventional Commits; one logical change per commit.
- Accessibility: keyboard-operable controls, labels, `prefers-reduced-motion` → start paused.

## Workflow rules
1. One task ID at a time from `docs/TASKS.md`; announce which.
2. After each task: lint, typecheck, test; tick the checkbox; add a plain-language entry to `docs/DECISIONS.md` (what, why, alternatives, trade-offs).
3. Ambiguity: choose the simplest option consistent with PRD, record it, continue.
4. No new dependencies beyond TECH_SPEC without noting why.
5. Cut scope rather than slip (PRD §5 priorities; roadmap cut-lines).
6. Never invent "findings" for the Insights section: use only content the owner provides; otherwise leave `TODO(owner)` placeholders.
7. When asked, explain the code and the model to the owner in simple terms.

## Theme and Japanese content rules

> **Owner decision (2026-10-10): no Japanese text anywhere.** The Japanese strings, `src/content/ja.ts`, S6, T-051's Japanese parts and T-052 are dropped. The product name stays Latin (Yurei Jam, Phantom Traffic Simulator). The night-highway visual theme stays.
> **Model decision (2026-10-10): pure IDM** (no reaction-delay parameter), plus random slowdowns so jams start by themselves. See `docs/EXISTING_WORK.md`.
> **Controls decision (2026-10-10): no parameter sliders.** The user only adds or removes cars; presets, Brake, play/pause, reset and speed remain.
- Theme (Japanese night highway) is a **Should**; build it only after the MVP milestones are done (see TASKS M5).
- All Japanese text lives in `src/content/ja.ts`. Do not hard-code Japanese anywhere else, and do not add new Japanese strings without the owner's approval. The owner is not a native speaker: unverified Japanese must not ship (see T-052).
- Japanese is an accent next to English, never a replacement. Name: **Yurei Jam** · 幽霊渋滞 (*Yūrei Jūtai*). The established term for jams without a clear cause is 自然渋滞 (*shizen jūtai*).
- Never use logos, signage designs, typefaces, or vehicle brands of real expressway operators, railways, or car makers. Original design only.
- Speed colors must stay legible; decoration must not compete with them.

## Hard don'ts
- No third-party 3D models or textures; procedural geometry only (simple boxes/rounded boxes are fine).
- No remote HDRIs/fonts that can fail offline.
- No backend, analytics, or tracking.
- No secrets or `.env` files in git.

## Definition of done (per task)
- AC met and verified manually (desktop + mid-range phone if the task affects rendering/perf).
- `lint`, `typecheck`, `test` pass; `build` passes for milestone tasks.
- No console errors; no React warnings.
- `DECISIONS.md` entry added; checkbox ticked.
