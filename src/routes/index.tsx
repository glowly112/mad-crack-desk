import { createFileRoute, Link } from "@tanstack/react-router";
import { BettingStrip } from "@/components/betting-strip";
import { FloorLog } from "@/components/floor-log";
import { HeroStrip, ScoreChart } from "@/components/hero-strip";
import { PackList } from "@/components/pack-list";
import { Portrait } from "@/components/portrait";
import { StaffStrip } from "@/components/staff-strip";
import { useStamp } from "@/components/plant-context";
import { parkedCount } from "@/lib/lab/desk";
import { fmtU } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Floor });

function Floor() {
  const stamp = useStamp();
  return (
    <div className="floor-desk grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7 lg:row-start-1">
        <HeroStrip />
        <BettingStrip loud />
        <p className="font-mono text-xs text-subtle">
          Keep {stamp.counts.keep} · parked {parkedCount(stamp.counts.keep, stamp.n_solid)} · proving{" "}
          {stamp.counts.measuring} · freeze {fmtU(stamp.researchKeepGbp)} · not income
        </p>
      </div>

      <div className="floor-rail gap-8 lg:col-span-5 lg:row-span-2 lg:row-start-1">
        <ScoreChart />
        <FloorLog />
      </div>

      <div className="space-y-8 lg:col-span-7 lg:row-start-2">
        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-warn/30 bg-elev px-4 py-3">
          <Link
            to="/issues/$id"
            params={{ id: stamp.topBlocker.id }}
            className="flex min-w-0 items-start gap-3 transition-transform duration-150 ease-out active:scale-[0.96]"
          >
            <Portrait id="clerk" name="Clerk" size="sm" />
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

        <StaffStrip />
        <PackList />
      </div>
    </div>
  );
}
