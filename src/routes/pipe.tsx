import { createFileRoute } from "@tanstack/react-router";
import { ViewHeader } from "@/components/looks/view-header";
import { useLook } from "@/components/look-provider";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipe")({ component: Pipe });

const STAGES = [
  { key: "pitched", label: "Pitched", hint: "Invent cells", lane: "keep" },
  { key: "proving", label: "Proving", hint: "Measuring pile", lane: "proving" },
  { key: "closed", label: "Closed", hint: "Out of window", lane: "mute" },
  { key: "certified", label: "Certified", hint: "The production door", lane: "solid" },
  { key: "scaling", label: "Scaling", hint: "Live ⊆ paper", lane: "solid" },
] as const;

export function Pipe() {
  const stamp = useStamp();
  const look = useLook();

  return (
    <div className={cn("space-y-8", `look-${look}`)}>
      <ViewHeader title="Pipe" lede={stamp.oneSystem} />

      {look === "field" ? (
        <ol className="field-sev field-pipe" aria-label="Pipe stages">
          {STAGES.map((s) => {
            const n = stamp.pipe[s.key];
            const stalled = s.key === "certified" && n === 0;
            return (
              <li key={s.key} className={cn("field-sev-tab", `is-${s.lane}`, stalled && "is-stuck")}>
                <span className="field-sev-label">{s.label}</span>
                <span className="field-sev-count">
                  {n} {s.hint}
                </span>
              </li>
            );
          })}
        </ol>
      ) : look === "tape" ? (
        <ol className="tape-pipe">
          {STAGES.map((s) => {
            const n = stamp.pipe[s.key];
            const stalled = s.key === "certified" && n === 0;
            return (
              <li key={s.key} className="tape-mover">
                <div className="tape-mover-top">
                  <p className="tape-mover-label">{s.label}</p>
                  <span className={cn("tape-chip", stalled ? "is-bad" : n > 0 ? "is-up" : "")}>
                    {stalled ? "▼" : n > 0 ? "▲" : "·"} {n}
                  </span>
                </div>
                <p className="tape-mover-hint">{s.hint}</p>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol
          className={cn(
            look === "ledger"
              ? "ledger-pipe"
              : "-mx-4 flex gap-px overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0",
          )}
        >
          {STAGES.map((s) => {
            const n = stamp.pipe[s.key];
            const stalled = s.key === "certified" && n === 0;
            return (
              <li
                key={s.key}
                className={cn(
                  look === "ledger"
                    ? "ledger-card ledger-pipe-cell"
                    : "min-w-[8.5rem] flex-1 border border-border bg-surface px-3 py-4 md:min-w-0",
                )}
              >
                <p className="text-sm">{s.label}</p>
                <p className="mt-0.5 text-xs text-subtle">{s.hint}</p>
                <p
                  className={cn(
                    "mt-4 inline-flex items-center gap-1.5 font-mono text-3xl tabular-nums tracking-tight",
                    stalled && "text-warn",
                    look === "ledger" && s.key === "certified" && n > 0 && "is-in",
                  )}
                >
                  {stalled ? <LiveDot tone="warn" /> : null}
                  {n}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
