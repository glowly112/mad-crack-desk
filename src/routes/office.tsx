import { createFileRoute } from "@tanstack/react-router";
import { LookLink } from "@/components/look-link";
import { ViewHeader } from "@/components/looks/view-header";
import { StatusPill } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  const stamp = useStamp();
  const look = useLook();
  const regions = stamp.coverage.map((c) => c.region).join(" · ");

  return (
    <div className={cn("space-y-10", `look-${look}`)}>
      <ViewHeader
        title="Office"
        lede={`Invent ${stamp.office.invent ? "on" : "off"} · ${stamp.office.inventWhy}`}
      />
      <p className="font-mono text-xs text-muted">
        Hunter {stamp.office.activeHunter} · Pareto {stamp.office.pareto}
      </p>

      <section className={look === "ledger" ? "ledger-card" : undefined}>
        <h2 className="mb-3 text-sm font-medium text-muted">Hunters</h2>
        <ul className={look === "tape" ? "tape-table" : "divide-y divide-border border-y border-border"}>
          {stamp.hunters.map((h) => {
            const Icon = HUNTER_MARKS[h.id as keyof typeof HUNTER_MARKS];
            const off = h.state !== "FLOWING";
            return (
              <li key={h.id}>
                <LookLink
                  to="/hunters/$id"
                  params={{ id: h.id }}
                  className={cn(
                    "flex items-center gap-4 py-3 transition-transform duration-150 ease-out active:scale-[0.96]",
                    look === "tape" && "tape-row",
                    look === "field" && "field-row",
                  )}
                >
                  {Icon ? <Icon className="size-8 shrink-0 text-muted" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="capitalize">{h.id}</p>
                      {look === "field" || look === "tape" ? (
                        <StatusPill kind={off ? "stuck" : "solid"}>{h.state}</StatusPill>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <LiveDot tone={off ? "warn" : "ok"} />
                          <span className="text-muted">{h.state}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-subtle">{h.note}</p>
                  </div>
                </LookLink>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={look === "ledger" ? "ledger-card" : undefined}>
        <h2 className="mb-1 text-sm font-medium text-muted">Coverage</h2>
        <p className="mb-3 font-mono text-xs text-subtle">{regions}</p>
        <ul className="divide-y divide-border border-y border-border">
          {stamp.coverage.map((c) => (
            <li key={c.region} className="flex items-baseline justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-sm">{c.region}</p>
                <p className="text-xs text-subtle">{c.note}</p>
              </div>
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                keep {c.keep} · proving {c.measuring}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
