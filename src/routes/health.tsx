import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { OracleStampLine } from "@/components/oracle-stamp-line";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { healthBoard, type HealthRow } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { ukStampLine } from "@/lib/lab/uk-time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({ component: Health });

export function Health() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const live = plant.source === "oracle";
  const board = healthBoard(stamp.kpis, {
    hunters: stamp.hunters,
    inventWhy: stamp.office.inventWhy,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Health</h1>
        <p className="mt-1 text-sm text-muted">Is the plant okay.</p>
        <p className="mt-2 text-sm text-subtle">{board.glance}</p>
        <div className="mt-3">
          <OracleStampLine
            generated={stamp.generated}
            live={live}
            detail={ukStampLine(stamp.generated)}
            tone={live ? "ok" : "warn"}
          />
        </div>
      </header>

      <Group title="Broken" items={board.broken} tone="bad" />
      <Group title="Watching" items={board.watching} tone="warn" />
      <Group title="Fine" items={board.fine} tone="ok" />
    </div>
  );
}

function Group({
  title,
  items,
  tone,
}: {
  title: string;
  items: HealthRow[];
  tone: "ok" | "warn" | "bad";
}) {
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-xs",
            tone === "ok" && "text-up",
            tone === "warn" && "text-warn",
            tone === "bad" && "text-bad",
          )}
        >
          <LiveDot tone={tone} />
          {items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ul>
          {items.map((k, i) => (
            <li
              key={k.id}
              className="log-in flex items-start gap-3 border-b border-border py-3"
              style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
            >
              <LiveDot tone={tone} />
              <div className="min-w-0">
                <p className="text-sm">{k.sentence}</p>
                <p className="mt-0.5 text-xs text-subtle">{k.why}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
