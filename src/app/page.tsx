import { Explorer } from '@/components/Explorer'
import { SpaceTimeDiagram } from '@/components/SpaceTimeDiagram'
import { SpeedChart } from '@/components/SpeedChart'
import { StatsPanel } from '@/components/StatsPanel'

export default function Home() {
  return (
    <div className="mx-auto max-w-[96rem] px-3 pb-60 sm:px-5 lg:pb-16">
      <a
        href="#simulation"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-lamp focus:px-4 focus:py-2 focus:font-semibold focus:text-asphalt"
      >
        Skip to the simulation
      </a>

      <header className="py-4">
        <h1 className="text-3xl font-bold leading-none tracking-tight">
          Yurei Jam
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Phantom Traffic Simulator</p>
      </header>

      <main>
        <Explorer />

        <div id="data" className="mt-10 scroll-mt-6 space-y-8">
          <StatsPanel />
          <div className="grid gap-8 lg:grid-cols-2">
            <SpeedChart />
            <SpaceTimeDiagram />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-night-line pt-6 text-sm text-ink-muted">
        <p className="max-w-prose">
          Every car follows the Intelligent Driver Model (Treiber, Hennecke and
          Helbing, 2000) and nothing else controls the traffic. Now and then a
          driver brakes suddenly; that driver gets a white ring. Inspired by
          Sugiyama et al., &ldquo;Traffic jams without bottlenecks&rdquo;, New
          Journal of Physics 10 (2008). No data leaves your browser.
        </p>
      </footer>
    </div>
  )
}
