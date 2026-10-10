# Existing work (T-003)

Reviewed on 2026-10-10 from `~/phantom-traffic-simulator` (Vite + Canvas 2D, live at
https://phantom-traffic-simulator.vercel.app/) and the article
`Artikel_Notion_Phantom_Traffic_Jam_Sang_Hantu_Jalan_Tol.pdf` in the same folder.

## What the existing model does

An agent-based, single-lane ring, one car looks only at the car in front of it.

| Aspect | Existing 2D version |
|---|---|
| Track | 200 m ring, position stored as an angle |
| Step | 10 ms |
| Perception | The car sees the leader's position as it was `Reaction Delay` ms ago (default 750 ms, a delay line of frames) |
| Decision | If perceived gap < `Brake Distance` (6 m): `speed -= Brake Force`; else `speed += Acceleration` |
| Limits | Speed clamped to `[small min, Max speed]`; if the actual gap <= 2 car lengths the car stops |
| Randomness | Start speed `vmax · U(0.9, 1.0)`; each frame with p = 0.003 the car's speed is multiplied by `U(0.7, 0.9)` |
| Parameters (UI) | Cars 5 to 20 (12), Max speed 10 to 50 m/s (40), Acceleration 1 to 10 (5), Brake force 1 to 15 (12), Brake distance 0 to 20 m (6), Reaction delay 1 to 1000 ms (750) |
| Outputs | Average speed as % of max speed, number of slow cars (< 40% of max) |

## Findings in the article (owner's content)

1. A jam is an emergent property, not caused by a bottleneck.
2. Density lowers the mean speed gradually, not suddenly.
3. Reaction time is the root cause (delay >= 750 ms with >= 15 cars gave a phantom jam with mean speed <= 40%).
4. Small perturbations are amplified.
5. Raising the maximum speed does not raise the average speed beyond about 20 to 30 m/s at the tested density.

Sensitivity table in the article: ideal (5 to 8 cars, ~150 ms: stable), critical (12 to 15 cars, ~300 to 500 ms: saturation), realistic (>= 15 cars, >= 750 ms: phantom jam, shock wave moving backward).

## Differences from this project's spec

| Topic | Existing 2D | Spec (TECH_SPEC §3) |
|---|---|---|
| Car-following | Delayed gap, brake or accelerate rule | Intelligent Driver Model, no delay |
| Reaction time | Explicit parameter | None. Time headway `T` is related but not the same |
| Noise | Rare random slowdowns, 0.3% per frame | Gaussian acceleration noise, held 0.5 s |
| Scale | 200 m, 5 to 20 cars | 1000 m, 5 to 100 cars |
| Units | Mixed, scaled to radians | SI, metres per second |
| Collisions | Stop on contact | Guard keeps gap >= 0.1 m |

## Decision (owner, 2026-10-10)

Use the **pure IDM** from the spec. Consequence: finding 3 cannot be demonstrated here and is shown in
Insights as a result of the original experiment, with a link to the original simulator. Findings 1, 2, 4
and 5 were checked against the new model by `npm run calibrate` (see `docs/CALIBRATION.md`) and carry a
"Try it" button.

## Reused

- The five findings and their wording (translated to English), only with the numbers written in the article.
- The ring-road idea and the Sugiyama et al. (2008) reference.
- The parameter vocabulary (cars, desired speed, brake).

**Added later (owner, 2026-10-10):** the first 3D build used only a tiny held Gaussian noise, which moves
a speed by under 0.5 km/h and never started a jam, so "free flow" stayed free. The original model cut
speed by 10 to 30% about every 3 seconds per car. The 3D version therefore has **random slowdowns**
(a driver slows for 0.5 to 1.5 s at 2 to 4 m/s², on average once per car every two minutes). With
them, jams start by themselves, as in the article. The owner also chose to remove the parameter
sliders and keep only Add car and Remove car, so every driver is an independent agent.

No code was copied: the model is different.
