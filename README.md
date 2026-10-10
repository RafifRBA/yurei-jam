# Yurei Jam

An interactive 3D simulation of **phantom traffic jams**. Cars follow each other on a ring road with the
Intelligent Driver Model. With no accident and no bottleneck, one slowdown can grow into a wave of braking
that travels backward through the traffic.

**Live demo:** TODO(owner): add the Vercel URL after the first deploy.
**Preview GIF:** TODO(owner): record a short GIF of a jam forming.

## Try it

1. Open the page. Thirty cars drive around the ring by themselves.
2. Now and then a driver brakes suddenly. That driver gets a **white ring**: thin for a quick slowdown,
   thick for the rare hard brake down to about 10 km/h.
3. Press **Add car** until the ring gets crowded. Around 35 cars one small brake grows into a jam that
   travels backward; cars further back stop completely.

There is nothing else to tune: every car follows the same rule on its own and nobody controls the
traffic. You can also pause, reset, change the playback speed (0.5x to 4x), pick a camera (top, orbit,
follow) and click a car to follow it. The charts and the space-time diagram below the scene show the same
jam in numbers.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` / `build` | Dev server / production build |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run test` | Unit tests (simulation, presets, URL parsing) |
| `npm run test:e2e` | Playwright smoke test and axe check (starts the dev server on port 3100) |
| `npm run calibrate` | Re-measures the presets, writes `docs/CALIBRATION.md` |
| `npm run bench` | Cost of one simulation step at N = 100 |

## How it is built

```
src/sim/     PURE TypeScript: IDM, world, stats, presets. No React, no Three.js, no DOM. Seeded, tested.
src/three/   Render loop (fixed timestep), instanced cars, track, cameras, night theme.
src/store/   UI parameters and throttled statistics (Zustand).
src/components/  Controls, charts, insights, about.
```

```
sim (world, step) --> useSimLoop (fixed dt, accumulator) --> Cars (one InstancedMesh)
                                  \--> stats (<= 4 Hz) --> Zustand --> chart, readouts
```

- The simulation state lives outside React. Rendering reads it; React re-renders only for throttled UI.
- One `InstancedMesh` draws every car in one draw call.
- Same seed and parameters give the same trajectory (tested).

## The model

Each car follows the one ahead with the Intelligent Driver Model (Treiber, Hennecke, Helbing, 2000):

```
s*  = s0 + max(0, v·T + v·Δv / (2·sqrt(a·b)))
acc = a · [ 1 − (v / v0)^4 − (s* / s)² ]
```

Fixed: ring 1000 m, car 4.5 m, s0 2 m, a 1.0 m/s², b 1.5 m/s², v0 108 km/h, T 1.5 s, step 0.05 s. The
only thing you change is the number of cars. Every driver also gets a tiny random push every half
second, and two kinds of sudden braking anomalies start phantom jams:

- a quick slowdown, on average once per driver every two minutes, for about a second (thin white ring);
- a rare hard brake, on average once per driver every hundred minutes, down to about 10 km/h for
  one to three seconds (thick white ring).

Starting points come from measurement, not guesses: see [`docs/CALIBRATION.md`](docs/CALIBRATION.md).
See the calibration file for how quickly a jam forms at each density.

## Limitations

- One lane, no overtaking, no junctions, identical cars and drivers.
- Cars are drawn at twice their real size. Gaps are to scale.
- The IDM has no explicit reaction delay, so the original finding "reaction time is the root cause"
  cannot be reproduced here. That version is the original 2D simulator.
- Thresholds apply to these parameters. They are not claims about real roads.
- Not yet measured: frame rate on a real phone, Lighthouse scores.

## Credits

Intelligent Driver Model: Treiber, Hennecke, Helbing (2000). Ring-road experiment: Sugiyama et al.,
*Traffic jams without bottlenecks*, New Journal of Physics 10 (2008). No third-party models, textures or
remote assets; all geometry is procedural. No tracking.
