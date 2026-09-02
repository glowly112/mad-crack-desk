import { MarkSolid } from "@/components/marks";
import { DeskTable } from "@/components/desk-table";
import { useStamp } from "@/components/plant-context";
import { SOLID_EMPTY, recipeDeskRow, solidRows } from "@/lib/lab/desk";

/** Floor morning board: solids only. Same columns as Trades. */
export function PackList() {
  const stamp = useStamp();
  const solids = solidRows(stamp.recipes, stamp.n_solid);

  return (
    <div>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <MarkSolid className="size-3.5 text-subtle" />
          <h2 className="text-sm font-medium">Solid</h2>
          <span className="font-mono text-xs text-subtle">{stamp.n_solid}</span>
        </div>
        <p className="text-xs text-subtle">One book</p>
      </header>
      <DeskTable
        groups={[{ id: "solid", rows: solids.map(recipeDeskRow) }]}
        empty={SOLID_EMPTY}
      />
    </div>
  );
}
