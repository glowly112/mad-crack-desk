import { createFileRoute } from "@tanstack/react-router";
import { OfficeBooksTable, OfficeCounts } from "@/components/office-board";
import { OracleStampLine } from "@/components/oracle-stamp-line";
import { usePlantSource, useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const live = plant.source === "oracle";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">
          Strategies — wide hole skins and spice nuggets in one list. Paper P&L since armed or first seen.
        </p>
        <div className="mt-3">
          <OracleStampLine
            generated={stamp.generated}
            live={live}
            detail={plant.detail}
            tone={live ? "ok" : "warn"}
          />
        </div>
      </header>
      <OfficeCounts />
      <OfficeBooksTable />
    </div>
  );
}
