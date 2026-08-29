import { PLANT_MARKS } from "@/components/marks";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export function PlantPlan() {
  const stamp = useStamp();
  const groups = [
    { id: "solid" as const, label: "Solid", count: stamp.n_solid, mute: false, hint: "Certified · the score" },
    { id: "research" as const, label: "Research keep", count: stamp.counts.keep, mute: true, hint: "Not the score" },
    { id: "measuring" as const, label: "Measuring", count: stamp.counts.measuring, mute: true, hint: "Research pile" },
    { id: "invent" as const, label: "Invent", count: stamp.counts.hunting, mute: false, hint: "Open gaps" },
    { id: "live" as const, label: "Live", count: 0, mute: !stamp.fuse_on, hint: stamp.fuse },
  ];
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Plant</h2>
        <p className="truncate text-xs text-subtle">{stamp.oneSystem}</p>
      </div>
      <ul className="divide-y divide-border rounded-md border border-border">
        {groups.map((g) => {
          const Icon = PLANT_MARKS[g.id];
          return (
            <li
              key={g.id}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5",
                g.mute && "opacity-45",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon className="size-4 shrink-0 text-muted" />
                <div>
                  <p className="text-sm">{g.label}</p>
                  <p className="font-mono text-xs text-subtle">{g.hint}</p>
                </div>
              </div>
              <p className="font-mono text-sm tabular-nums">{g.count}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
