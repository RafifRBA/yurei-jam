import { create } from 'zustand'
import type { RampId } from '@/lib/color'

export type CameraMode = 'top' | 'orbit' | 'follow'
export type SpeedMultiplier = 0.5 | 1 | 2 | 4
export type Quality = 'high' | 'low'
export type WebglStatus = 'unknown' | 'ok' | 'missing'

interface RunState {
  playing: boolean
  speedMul: SpeedMultiplier
  camera: CameraMode
  selectedCar: number | null
  quality: Quality
  ramp: RampId
  webgl: WebglStatus
  /** Increment to recreate the world with the current parameters. */
  resetToken: number
  /** Set by the performance guard (frame time stays above 40 ms). */
  perfSuggestion: boolean
  onboardingDismissed: boolean

  setPlaying: (playing: boolean) => void
  setSpeedMul: (m: SpeedMultiplier) => void
  setCamera: (mode: CameraMode) => void
  selectCar: (index: number | null) => void
  setQuality: (q: Quality) => void
  setRamp: (r: RampId) => void
  setWebgl: (s: WebglStatus) => void
  reset: () => void
  setPerfSuggestion: (v: boolean) => void
  dismissOnboarding: () => void
}

export const useRunStore = create<RunState>((set) => ({
  playing: false, // decided after mount (reduced motion starts paused)
  speedMul: 1,
  camera: 'top',
  selectedCar: null,
  quality: 'high',
  ramp: 'default',
  webgl: 'unknown',
  resetToken: 0,
  perfSuggestion: false,
  onboardingDismissed: false,

  setPlaying: (playing) => set({ playing }),
  setSpeedMul: (speedMul) => set({ speedMul }),
  setCamera: (camera) => set({ camera }),
  selectCar: (selectedCar) => set({ selectedCar }),
  setQuality: (quality) => set({ quality, perfSuggestion: false }),
  setRamp: (ramp) => set({ ramp }),
  setWebgl: (webgl) => set({ webgl }),
  reset: () =>
    set((s) => ({ resetToken: s.resetToken + 1, selectedCar: s.selectedCar })),
  setPerfSuggestion: (perfSuggestion) => set({ perfSuggestion }),
  dismissOnboarding: () => set({ onboardingDismissed: true }),
}))
