import { createFileRoute } from "@tanstack/react-router";
import { BettingStrip } from "@/components/betting-strip";
import { FloorSquare } from "@/components/country-pack";
import { EmptyState } from "@/components/empty-state";
import { PlantPane } from "@/components/hero-strip";
import { useStamp } from "@/components/plant-context";
import { EMPTY, floorNextLine } from "@/lib/lab/desk";

export const Route = createFileRoute("/")({ component: Floor });

function Floor() {
  const stamp = useStamp();
  const next = floorNextLine(stamp);

  return (
    <div className="floor-desk space-y-8">
      <FloorSquare />
      <PlantPane />
      <BettingStrip loud />
      <NextActionLine line={next} />
    </div>
  );
}

function NextActionLine({ line }: { line: string | null }) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted">Next</h2>
      {line ? (
        <p className="mt-2 text-sm">{line}</p>
      ) : (
        <EmptyState copy={EMPTY} />
      )}
    </section>
  );
}
