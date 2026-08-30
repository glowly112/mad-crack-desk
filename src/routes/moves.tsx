import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { ViewHeader } from "@/components/looks/view-header";
import { StatusPill } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { moveTone } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/moves")({ component: Moves });

export function Moves() {
  const stamp = useStamp();
  const look = useLook();
  return (
    <div className={cn("space-y-6", `look-${look}`)}>
      <ViewHeader
        title="Moves"
        lede="Keep is not measure. Every hop needs a why — Virchow class, Hyde hold, or a certify."
      />
      {stamp.moves.length === 0 ? (
        <EmptyState />
      ) : look === "tape" ? (
        <ul className="tape-table">
          {stamp.moves.map((m) => {
            const tone = moveTone(m.to);
            return (
              <li key={m.at + m.recipe} className="tape-row log-in">
                <div className="min-w-0 flex-1">
                  <div className="tape-row-title">
                    <p>{m.recipe}</p>
                    <StatusPill kind={tone === "bad" ? (m.to === "Dead" ? "dead" : "stuck") : "mute"}>
                      {m.to}
                    </StatusPill>
                  </div>
                  <p className="tape-row-why">
                    {m.from} → {m.to} · {m.why}
                  </p>
                </div>
                <p className="tape-row-meta">{m.at}</p>
              </li>
            );
          })}
        </ul>
      ) : look === "field" ? (
        <ul className="field-lane">
          {stamp.moves.map((m) => {
            const tone = moveTone(m.to);
            return (
              <li key={m.at + m.recipe} className="field-row log-in">
                <div className="min-w-0 flex-1">
                  <div className="field-row-top">
                    <p>{m.recipe}</p>
                    <StatusPill kind={tone === "bad" ? (m.to === "Dead" ? "dead" : "stuck") : "keep"}>
                      {m.to}
                    </StatusPill>
                  </div>
                  <p className="field-row-why">
                    {m.from} → {m.to} · {m.why}
                  </p>
                </div>
                <p className="field-row-meta">{m.at}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <ol className={look === "ledger" ? "ledger-move-list" : "space-y-5"}>
          {stamp.moves.map((m) => {
            const tone = moveTone(m.to);
            return (
              <li key={m.at + m.recipe} className={cn("log-in", look === "ledger" && "ledger-card ledger-move")}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-sm">{m.recipe}</p>
                  <p className="font-mono text-xs text-subtle">{m.at}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate rounded-sm bg-elev px-3 py-2 font-mono text-xs text-muted">
                    {m.from}
                  </span>
                  <span className="shrink-0 text-subtle" aria-hidden="true">
                    →
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate rounded-sm bg-elev px-3 py-2 font-mono text-xs",
                      tone === "bad" ? "text-bad" : "text-fg",
                    )}
                  >
                    {m.to}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{m.why}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
