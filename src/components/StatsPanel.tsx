'use client'
import { useStatsStore } from '@/store/stats.store'

function Readout({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="num text-2xl font-medium leading-none text-ink">
        {value} <span className="text-sm text-ink-muted">{unit}</span>
      </dd>
    </div>
  )
}

/** FR-CHART-3: density, mean speed, flow and slowest car, updated about 4 times a second. */
export function StatsPanel() {
  const s = useStatsStore()
  return (
    <section aria-labelledby="stats-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="stats-title" className="text-lg font-semibold">
          Live statistics
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            s.jam ? 'bg-lamp text-asphalt' : 'bg-night-line text-ink'
          }`}
        >
          {s.jam ? 'Jam detected' : 'Traffic flowing'}
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Readout
          label="Density"
          value={s.densityVehKm.toFixed(0)}
          unit="veh/km"
        />
        <Readout
          label="Mean speed"
          value={s.meanSpeedKmh.toFixed(0)}
          unit="km/h"
        />
        <Readout label="Flow" value={s.flowVehH.toFixed(0)} unit="veh/h" />
        <Readout
          label="Slowest car"
          value={s.minSpeedKmh.toFixed(0)}
          unit="km/h"
        />
      </dl>
    </section>
  )
}
