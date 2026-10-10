'use client'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useStatsStore } from '@/store/stats.store'

const AXIS = { fontSize: 12, fill: '#aeb6d4' }

/** FR-CHART-1: mean speed and flow over the last 120 s. Animations off, updates throttled. */
export function SpeedChart() {
  const series = useStatsStore((s) => s.series)
  const last = series[series.length - 1]
  return (
    <section aria-labelledby="chart-title">
      <h2 id="chart-title" className="text-lg font-semibold">
        Mean speed and flow, last two minutes
      </h2>
      <div
        className="mt-3 h-60"
        role="img"
        aria-label={
          last
            ? `Line chart of mean speed and flow. Latest: ${last.meanSpeedKmh.toFixed(0)} kilometres per hour and ${last.flowVehH.toFixed(0)} vehicles per hour.`
            : 'Line chart of mean speed and flow. No data yet.'
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="#2c3566" strokeDasharray="3 4" />
            <XAxis
              dataKey="t"
              tick={AXIS}
              stroke="#2c3566"
              tickFormatter={(t: number) => `${t}s`}
              minTickGap={32}
            />
            <YAxis
              yAxisId="speed"
              tick={AXIS}
              stroke="#2c3566"
              width={44}
              domain={[0, 'auto']}
              label={{
                value: 'km/h',
                angle: -90,
                position: 'insideLeft',
                fill: '#aeb6d4',
                fontSize: 12,
              }}
            />
            <YAxis
              yAxisId="flow"
              orientation="right"
              tick={AXIS}
              stroke="#2c3566"
              width={52}
              domain={[0, 'auto']}
              label={{
                value: 'veh/h',
                angle: 90,
                position: 'insideRight',
                fill: '#aeb6d4',
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: '#121936',
                border: '1px solid #2c3566',
                borderRadius: 8,
                color: '#eceffa',
              }}
              labelFormatter={(t) => `${t} s`}
              formatter={(v, name) => [Number(v).toFixed(0), name]}
            />
            <Line
              yAxisId="speed"
              name="Mean speed (km/h)"
              dataKey="meanSpeedKmh"
              stroke="#e8e6df"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="flow"
              name="Flow (veh/h)"
              dataKey="flowVehH"
              stroke="#ff9f43"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-5 text-sm text-ink-muted">
        <span>
          <span className="font-medium text-lane">━</span> Mean speed (km/h,
          left axis)
        </span>
        <span>
          <span className="font-medium text-lamp">━</span> Flow (veh/h, right
          axis)
        </span>
      </p>
    </section>
  )
}
