# Design: Yurei Jam

A ring expressway at night, seen from above with a control board beside it. Recorded from the built
interface (tokens in `src/app/globals.css`, scene constants in `src/three/layout.ts`).

## World

- Scene: indigo night, dark asphalt ring, off-white lane paint, sodium-orange lamps as the only warm
  light, a generic skyline of lit boxes. Car colour is the one saturated thing in the scene.
- UI: guide-sign panels (deep green, white text, thin white inset line) next to quiet night surfaces.
- Mode: Experience (the simulation) with Operate controls.

## Colour

| Token | Value | Use |
|---|---|---|
| `--night` | `#0b1026` | page and scene background |
| `--night-2` | `#121936` | raised surfaces (insight cards, accordion) |
| `--night-line` | `#2c3566` | hairlines on night |
| `--asphalt` | `#1a1d2b` | road, text on lamp-orange |
| `--lane` | `#e8e6df` | lane paint, speed line in the chart |
| `--lamp` | `#ff9f43` | lamps, the primary action (Brake), focus ring, flow line |
| `--sign` / `--sign-deep` | `#0f5b3f` / `#0a4430` | control panel, selected states |
| `--ink` / `--ink-muted` | `#eceffa` / `#aeb6d4` | text on night |
| Speed ramp | `#e5484d` to `#f5a524` to `#3dd68c` | cars, legend, space-time diagram only |
| Safe ramp | `#6c2b91` to `#21908c` to `#fde725` | colour-blind option |

Speed colour uses a gamma of 0.6 so cruising and jammed traffic stay distinguishable. Decoration never
uses saturated red or green.

## Type

Barlow (UI, 400 to 700) and JetBrains Mono (numeric readouts, 400 and 500), both through `next/font`.
Numerals are tabular. Title 30 px bold, section titles 24 px semibold, body 16 px.

## Components

- **Sign panel**: 10 px radius, inset 1.5 px white line, soft drop shadow. One per surface region.
- **Brake**: the single primary action, lamp-orange fill, dark text, 48 px high.
- **Segmented controls**: sign-deep track, white selected segment, 44 px targets.
- **Sliders**: 4 px track filled with lamp-orange, 22 px white thumb, 44 px touch height.
- **Insight card**: night-2 surface, one hairline, evidence lines labelled by source.
- **Focus**: 2 px lamp-orange outline, 2 px offset, on every interactive element.

## Motion

Only the simulation moves. Reduced motion starts the simulation paused and makes camera changes
instant. Brake gives a brief highlight ring on the car; no decorative animation.

## Constraints

No Japanese text, no third-party models or fonts fetched at runtime, no logos or signage of real
operators. Cars are drawn at twice their real size; gaps are to scale.
