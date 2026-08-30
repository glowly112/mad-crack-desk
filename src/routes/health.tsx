import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/looks/view-header";
import { StatusPill } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { healthLine } from "@/lib/lab/desk";
import type { LiveStamp } from "@/lib/lab/from-digest";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/health")({ component: Health });

export function Health() {
  const stamp = useStamp();
  const look = useLook();
  const red = stamp.kpis.filter((k) => k.status === "RED");
  const amber = stamp.kpis.filter((k) => k.status === "AMBER");
  const green = stamp.kpis.filter((k) => k.status === "GREEN");
  const line = healthLine({
    plantHealth: stamp.plantHealth,
    plantLine: stamp.plantLine,
    kpis: stamp.kpis,
  });

  return (
    <div className={cn("space-y-8", `look-${look}`)}>
      <ViewHeader title="Health" lede={line} />

      {look === "field" ? (
        <div className="field-sev">
          <div className="field-sev-tab is-solid">
            <span className="field-sev-label">Holding</span>
            <span className="field-sev-count">{green.length} green</span>
          </div>
          <div className="field-sev-tab is-keep">
            <span className="field-sev-label">Watch</span>
            <span className="field-sev-count">{amber.length} amber</span>
          </div>
          <div className="field-sev-tab is-stuck">
            <span className="field-sev-label">Off</span>
            <span className="field-sev-count">{red.length} red</span>
          </div>
        </div>
      ) : null}

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
  const look = useLook();
  if (items.length === 0) return null;
  return (
    <section className={look === "ledger" ? "ledger-card" : undefined}>
      <h2 className="mb-2 text-sm font-medium text-muted">{title}</h2>
      <ul className={look === "tape" ? "tape-table" : "divide-y divide-border border-y border-border"}>
        {items.map((k) => (
          <li
            key={k.id}
            className={cn(
              "flex items-start justify-between gap-3 py-3",
              look === "tape" && "tape-row",
              look === "field" && "field-row",
            )}
          >
            <div>
              <p className="text-sm">{k.label}</p>
              <p className="text-xs text-subtle">{k.detail}</p>
            </div>
            {look === "field" || look === "tape" ? (
              <StatusPill kind={tone === "ok" ? "solid" : tone === "warn" ? "keep" : "dead"}>
                {k.status}
              </StatusPill>
            ) : (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 font-mono text-xs",
                  tone === "ok" && "text-subtle",
                  tone === "warn" && "text-warn",
                  tone === "bad" && "text-bad",
                )}
              >
                <LiveDot tone={tone} />
                {k.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
