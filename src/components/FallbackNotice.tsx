import { Icon } from './Icon'

/** FR-ROB-1: shown when WebGL is missing or the scene crashes. Charts and text still work. */
export function FallbackNotice({ reason }: { reason: 'no-webgl' | 'error' }) {
  return (
    <div
      role="status"
      className="flex h-full min-h-72 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <span className="text-lamp">
        <Icon name="warn" size={32} />
      </span>
      <h2 className="text-lg font-semibold">The 3D view is not available</h2>
      <p className="max-w-md text-ink-muted">
        {reason === 'no-webgl'
          ? 'Your browser or device does not provide WebGL, which the 3D scene needs.'
          : 'The 3D scene stopped unexpectedly.'}{' '}
        The simulation controls, statistics and charts below still work: pick a
        preset and press Brake to see the jam in the numbers and the diagrams.
      </p>
    </div>
  )
}
