import { createFileRoute } from "@tanstack/react-router";
import { LookLink } from "@/components/look-link";
import { ViewHeader } from "@/components/looks/view-header";
import { StatusPill } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/")({ component: StaffIndex });

function StaffIndex() {
  const stamp = useStamp();
  const look = useLook();
  return (
    <div className={cn("space-y-6", `look-${look}`)}>
      <ViewHeader title="Staff" lede="Watching line is the row." />
      <ul
        className={cn(
          look === "ledger" ? "ledger-staff" : "divide-y divide-border border-y border-border",
          look === "tape" && "tape-table",
        )}
      >
        {stamp.seats.map((s) => (
          <li key={s.id} className={look === "ledger" ? "ledger-card" : undefined}>
            <LookLink
              to="/staff/$id"
              params={{ id: s.id }}
              className={cn(
                "flex items-center gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]",
                look === "tape" && "tape-row",
                look === "field" && "field-row",
                look === "ledger" && "px-1",
              )}
            >
              <Portrait id={s.id} name={s.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p>{s.name}</p>
                  {look === "field" || look === "tape" ? (
                    <StatusPill
                      kind={s.status === "RED" ? "dead" : s.status === "AMBER" ? "keep" : "solid"}
                    >
                      {s.status}
                    </StatusPill>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm">{s.now}</p>
                <p className="mt-1 text-xs text-subtle">
                  {s.role} · {s.status} · {s.cadence}
                </p>
              </div>
            </LookLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
