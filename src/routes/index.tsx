import { createFileRoute } from "@tanstack/react-router";
import { BettingStrip } from "@/components/betting-strip";
import { EmptyState } from "@/components/empty-state";
import { HeroStrip, ScoreChart } from "@/components/hero-strip";
import { PackList } from "@/components/pack-list";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { EMPTY, floorNextAction } from "@/lib/lab/desk";

export const Route = createFileRoute("/")({ component: Floor });

function Floor() {
  const stamp = useStamp();
  const next = floorNextAction(stamp);

  return (
    <div className="floor-desk grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="min-w-0 space-y-6 lg:col-span-7">
        <HeroStrip />
        <BettingStrip loud />
        <NextActionLine next={next} />
        <PackList />
      </div>
      <div className="min-w-0 lg:col-span-5">
        <ScoreChart />
      </div>
    </div>
  );
}

function NextActionLine({ next }: { next: ReturnType<typeof floorNextAction> }) {
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Next</h2>
        <p className="text-xs text-subtle">Clerk</p>
      </header>
      {next ? (
        <div className="flex min-w-0 items-start gap-3">
          <Portrait id="clerk" name="Clerk" size="sm" />
          <div>
            <p className="text-sm">{next.title}</p>
            <p className="text-xs text-subtle">
              {next.owner} · {next.action}
            </p>
          </div>
        </div>
      ) : (
        <EmptyState copy={EMPTY} />
      )}
    </section>
  );
}
