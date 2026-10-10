import { MODEL } from '@/sim/types'

// The simulation works in metres; the scene works in scene units.
export const SCENE_RADIUS = 30
/** Scene units per metre: the ring of circumference L gets radius SCENE_RADIUS. */
export const SCALE = SCENE_RADIUS / (MODEL.ringLengthM / (2 * Math.PI))

export const ROAD_WIDTH = 3.0

/** Cars are drawn at twice their real size so they stay visible. Gaps stay proportional. */
export const CAR_EXAGGERATION = 2
export const CAR_LENGTH = MODEL.carLengthM * CAR_EXAGGERATION * SCALE
export const CAR_WIDTH = 0.72
export const CAR_HEIGHT = 0.5

export const NIGHT = '#0b1026'

export function angleOf(positionM: number): number {
  return (2 * Math.PI * positionM) / MODEL.ringLengthM
}
