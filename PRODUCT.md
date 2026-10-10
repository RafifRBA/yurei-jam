# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Fixed by the owner's TECH_SPEC: Next.js (App Router), TypeScript strict, Tailwind CSS, three + @react-three/fiber + drei, Zustand, Recharts, Vitest, Playwright, Vercel. English UI only. No backend.

## Users

- **Reviewer** (recruiter or engineer) who opens the live link for one to three minutes and must understand within about 15 seconds what it shows, then skims the repo for engineering quality.
- **Curious learner** who plays with the parameters and reads a short, honest explanation of the model.

## Product Purpose

An interactive 3D simulation of phantom traffic jams on a circular road. Cars follow each other with the Intelligent Driver Model; with no accident and no bottleneck, small perturbations grow into stop-and-go waves that travel backward. It is a portfolio piece for a job interview in early November 2026. Success: the phenomenon is understood visually at once, interaction is smooth, and the engineering (tested pure simulation separated from rendering) is evident.

## Positioning

Not a traffic engineering tool and not a game: a small, honest explainer where the jam is something you can trigger in under ten seconds and watch travel backward in 3D, in a chart, and in a space-time diagram. It comes from the author's own earlier 2D experiment and article.

## Operating Context

Single page. Sticky control panel (side on desktop, bottom sheet on mobile), the 3D scene as the hero, charts, an Insights section, and a short "About the model". Runs entirely in the browser. Must hold 60 fps at 80 cars on an integrated GPU and 30 fps on a mid-range phone.

## Capabilities and Constraints

- Single lane ring road, 1000 m, no overtaking, no junctions. Cars drawn at exaggerated size for visibility.
- Model: pure IDM (owner decision, 2026-10-10). The earlier 2D version used a reaction-delay rule model, so the "reaction time" finding cannot be demonstrated here and is presented as a result of the original experiment.
- No third-party 3D models, textures, HDRIs, remote fonts, analytics, or backend.
- No Japanese text anywhere (owner decision, 2026-10-10). The product name stays Latin: Yurei Jam, subtitle Phantom Traffic Simulator.
- No logos, signage designs, typefaces, or vehicle brands of real expressway operators or car makers.

## Brand Commitments

Name: **Yurei Jam**, subtitle **Phantom Traffic Simulator**. Mood: a ring expressway at night, calm and slightly eerie ("the ghost in the traffic"), never kitschy. The visual world is pinned by PRD §8A and TECH_SPEC §13 (Japanese night highway: indigo night, dark asphalt, sodium-orange lamps, deep-green signage-style panels), minus any Japanese text.

## Evidence on Hand

- The author's article (Indonesian): `~/phantom-traffic-simulator/Artikel_Notion_Phantom_Traffic_Jam_Sang_Hantu_Jalan_Tol.pdf`, with five findings and a sensitivity table. Numbers may be quoted only as written there.
- The original 2D simulator (Vite + Canvas): `~/phantom-traffic-simulator`, live at https://phantom-traffic-simulator.vercel.app/.
- Reference: Sugiyama et al. (2008), Traffic jams without bottlenecks, New Journal of Physics 10(3), 033001.
- No usability-test results, performance measurements, or calibration data exist yet; do not invent them.

## Product Principles

1. The scene is the hero; the interface stays quiet and labelled.
2. Color encodes speed and nothing else; decoration never competes with the speed ramp.
3. Never present a number the simulation or the owner's article did not produce.
4. Simulation first: pure, tested, deterministic; rendering only reads it.
5. Calm, explicit motion: reduced-motion starts paused.

## Accessibility & Inclusion

WCAG 2.1 AA for controls and text. Color is never the only cue: legend plus numeric speed readout. Keyboard-operable controls with units; the canvas has an accessible name and a throttled plain-language live summary.
