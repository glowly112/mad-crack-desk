import {
  MarkFuse,
  MarkInvent,
  MarkIssues,
  MarkKeep,
  MarkMeasure,
  MarkOffice,
  MarkStaff,
  MarkTrends,
  HUNTER_MARKS,
  PLANT_MARKS,
} from "@/components/marks";
import { useStamp } from "@/components/plant-context";

const LOG_MARK = {
  score: MarkTrends,
  doer: MarkStaff,
  invent: MarkInvent,
  hunter: HUNTER_MARKS.residual,
  fuse: MarkFuse,
  keep: MarkKeep,
  kill: MarkIssues,
  measure: MarkMeasure,
  plant: PLANT_MARKS.live,
  office: MarkOffice,
} as const;

export function FloorLog() {
  const stamp = useStamp();
  return (
    <section className="floor-log-pane flex min-h-0 flex-1 flex-col">
      <h2 className="mb-2 shrink-0 text-sm font-medium text-muted">Floor log</h2>
      <ol className="min-h-0 flex-1 space-y-2 overflow-visible font-mono text-xs lg:overflow-hidden">
        {stamp.floorLog.map((row) => {
          const Icon = LOG_MARK[row.kind as keyof typeof LOG_MARK];
          if (!Icon) return null;
          return (
            <li key={row.t + row.line} className="log-in flex items-start gap-2">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-subtle" />
              <span className="w-10 shrink-0 text-subtle">{row.t}</span>
              <span className="min-w-0 text-muted">{row.line}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
