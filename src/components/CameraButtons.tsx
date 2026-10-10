'use client'
import { useRunStore, type CameraMode } from '@/store/run.store'

const MODES: { id: CameraMode; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'orbit', label: 'Orbit' },
  { id: 'follow', label: 'Follow' },
]

export function CameraButtons() {
  const camera = useRunStore((s) => s.camera)
  const setCamera = useRunStore((s) => s.setCamera)
  return (
    <div
      role="group"
      aria-label="Camera"
      className="flex rounded-lg bg-night/80 p-1"
    >
      {MODES.map((mode) => (
        <button
          key={mode.id}
          type="button"
          aria-pressed={camera === mode.id}
          onClick={() => setCamera(mode.id)}
          className="min-h-11 min-w-14 cursor-pointer rounded-md px-3 text-sm font-medium text-ink-muted transition-colors hover:text-ink aria-pressed:bg-sign aria-pressed:text-sign-text"
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
