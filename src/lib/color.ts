// Speed ramp used by the cars, the legend, the chart and the space-time diagram.
// Colour is never the only cue: the legend and numeric readouts say the same thing.

export type RampId = 'default' | 'colorblind'

type Rgb = readonly [number, number, number]

const RAMPS: Record<RampId, readonly [Rgb, Rgb, Rgb]> = {
  // red -> amber -> green (TECH_SPEC §13.1)
  default: [
    [0xe5, 0x48, 0x4d],
    [0xf5, 0xa5, 0x24],
    [0x3d, 0xd6, 0x8c],
  ],
  // viridis-like: dark purple -> teal -> yellow
  colorblind: [
    [0x6c, 0x2b, 0x91],
    [0x21, 0x90, 0x8c],
    [0xfd, 0xe7, 0x25],
  ],
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Gamma < 1 spreads the slow end of the ramp. Without it, traffic that merely cruises at a
 * third of the desired speed already looks almost as red as a jam, and waves are hard to see.
 */
const GAMMA = 0.6

/** Writes the colour for ratio = speed / desired speed (0..1) into out, as 0..1 floats. */
export function speedRgb(ratio: number, ramp: RampId, out: number[]): void {
  const [low, mid, high] = RAMPS[ramp]
  const c = Math.pow(Math.min(1, Math.max(0, ratio)), GAMMA)
  const from = c < 0.5 ? low : mid
  const to = c < 0.5 ? mid : high
  const k = c < 0.5 ? c * 2 : (c - 0.5) * 2
  out[0] = lerp(from[0], to[0], k) / 255
  out[1] = lerp(from[1], to[1], k) / 255
  out[2] = lerp(from[2], to[2], k) / 255
}

export function speedCss(ratio: number, ramp: RampId): string {
  const rgb = [0, 0, 0]
  speedRgb(ratio, ramp, rgb)
  const [r, g, b] = rgb.map((v) => Math.round(v * 255)) as [
    number,
    number,
    number,
  ]
  return `rgb(${r} ${g} ${b})`
}

/** CSS gradient string for the legend, slow on the left. */
export function rampGradient(ramp: RampId): string {
  const stops = [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1]
  const parts = stops.map((r) => `${speedCss(r, ramp)} ${r * 100}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}
