import { createFileRoute } from "@tanstack/react-router";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import type { LiveStamp } from "@/lib/lab/from-digest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({ component: Health });

export function Health() {
  const stamp = useStamp();
  const red = stamp.kpis.filter((k) => k.status === "RED");
  const amber = stamp.kpis.filter((k) => k.status === "AMBER");
  const green = stamp.kpis.filter((k) => k.status === "GREEN");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Health</h1>
        <p className="mt-1 text-sm text-muted">
          Lab tick vs office. Color is the state. Nothing blinks.
        </p>
      </header>

      <p className="flex flex-wrap gap-4 font-mono text-xs">
        <span className="inline-flex items-center gap-1.5 text-bad">
          <LiveDot tone="bad" />
          {red.length} red
        </span>
        <span className="inline-flex items-center gap-1.5 text-warn">
          <LiveDot tone="warn" />
          {amber.length} amber
        </span>
        <span className="inline-flex items-center gap-1.5 text-up">
          <LiveDot tone="ok" />
          {green.length} green
        </span>
      </p>

      <Group title="Off" items={red} tone="bad" />
      <Group title="Watch" items={amber} tone="warn" />
      <Group title="Holding" items={green} tone="ok" />
    </div>
  );
}

type Kpi = LiveStamp["kpis"][number];

function Group({
  title,
  items,
  tone,
}: {
  title: string;
  items: Kpi[];
  tone: "ok" | "warn" | "bad";
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted">{title}</h2>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((k) => (
          <li key={k.id} className="flex items-start justify-between gap-3 py-3">
            <div>
              <p className="text-sm">{k.label}</p>
              <p className="text-xs text-subtle">{k.detail}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-mono text-xs",
                tone === "ok" && "text-up",
                tone === "warn" && "text-warn",
                tone === "bad" && "text-bad",
              )}
            >
              <LiveDot tone={tone} />
              {k.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
