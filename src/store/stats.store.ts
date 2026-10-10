import { create } from 'zustand'

export interface Sample {
  t: number // simulation time, s
  meanSpeedKmh: number
  flowVehH: number
}

interface StatsState {
  densityVehKm: number
  meanSpeedKmh: number
  flowVehH: number
  minSpeedKmh: number
  jam: boolean
  simTimeS: number
  series: Sample[]
  summary: string
  publish: (patch: Partial<Omit<StatsState, 'publish'>>) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  densityVehKm: 0,
  meanSpeedKmh: 0,
  flowVehH: 0,
  minSpeedKmh: 0,
  jam: false,
  simTimeS: 0,
  series: [],
  summary: '',
  publish: (patch) => set(patch),
}))
