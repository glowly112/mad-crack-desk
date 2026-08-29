import { createFileRoute, Link } from "@tanstack/react-router";
import { FloorLog } from "@/components/floor-log";
import { HeroStrip, ScoreChart } from "@/components/hero-strip";
import { LiveDot } from "@/components/live-dot";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { cn, fmtGbp } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Floor });

function Floor() {
  const stamp = useStamp();
  return (
    <div className="floor-desk grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="lg:col-span-7 lg:row-start-1">
        <HeroStrip />
      </div>

      <div className="floor-rail gap-8 lg:col-span-5 lg:row-span-2 lg:row-start-1">
        <ScoreChart />
        <FloorLog />
      </div>

      <div className="space-y-8 lg:col-span-7 lg:row-start-2">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden border-y border-border py-2 font-mono text-xs text-muted">
          <span>Solids {stamp.n_solid}</span>
          <span>Keep {stamp.counts.keep}</span>
          <span>Proving {stamp.counts.measuring}</span>
          <span className="text-subtle">Research {fmtGbp(stamp.researchKeepGbp)} · not income</span>
          <span className="inline-flex items-center gap-1.5 text-warn">
            <LiveDot tone="bad" />
            {stamp.plantLine}
          </span>
        </div>

        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warn/30 bg-elev px-4 py-3">
          <Link
            to="/issues/$id"
            params={{ id: stamp.topBlocker.id }}
            className="flex min-w-0 items-start gap-3 transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            <Portrait id="hyde" name="Hyde" size="sm" />
            <div>
              <p className="text-xs text-warn">Action required</p>
              <p className="text-sm">{stamp.topBlocker.title}</p>
              <p className="text-xs text-subtle">
                {stamp.topBlocker.owner} · {stamp.topBlocker.action}
              </p>
            </div>
          </Link>
          <Link
            to="/issues"
            className="rounded-sm border border-border px-3 py-2 text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            Issues
          </Link>
        </aside>

        <section>
          <header className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-muted">Holdings</h2>
            <p className="text-xs text-subtle">Solid first · parked research</p>
          </header>
          {stamp.n_solid === 0 ? (
            <p className="mb-2 text-sm text-subtle">No solid recipes on the day tape.</p>
          ) : null}
          <ul>
            {stamp.recipes.map((r) => (
              <li key={r.id} className="border-b border-border">
                <Link
                  to="/holdings/$id"
                  params={{ id: r.id }}
                  className="grid grid-cols-12 items-center gap-2 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <p className="text-sm">{r.title}</p>
                    <p className="text-xs text-subtle">{r.why}</p>
                  </div>
                  <p className="col-span-4 font-mono text-xs text-muted sm:col-span-2">{r.region}</p>
                  <p className="col-span-4 font-mono text-xs tabular-nums sm:col-span-2">n={r.n}</p>
                  <p
                    className={cn(
                      "col-span-4 text-right font-mono text-xs tabular-nums sm:col-span-2",
                      r.roi >= 0 ? "text-up" : "text-bad",
                    )}
                  >
                    {r.roi >= 0 ? "+" : ""}
                    {r.roi.toFixed(1)}%
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
