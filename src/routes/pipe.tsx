import { createFileRoute } from "@tanstack/react-router";
import { PlantPlan } from "@/components/plant-plan";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipe")({ component: Pipe });

const STAGES = [
  { key: "pitched", label: "Pitched", hint: "Invent cells" },
  { key: "proving", label: "Proving", hint: "Measuring pile" },
  { key: "closed", label: "Closed", hint: "Out of window" },
  { key: "certified", label: "Certified", hint: "Solid · the score" },
  { key: "scaling", label: "Scaling", hint: "Live ⊆ paper" },
] as const;

export function Pipe() {
  const stamp = useStamp();
  const values = STAGES.map((s) => stamp.pipe[s.key]);
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Pipe</h1>
        <p className="mt-1 text-sm text-muted">{stamp.oneSystem}</p>
      </header>

      <ol className="space-y-4">
        {STAGES.map((s) => {
          const n = stamp.pipe[s.key];
          const stalled = s.key === "certified" && n === 0;
          const filled = Math.round((n / max) * 12) || (n > 0 ? 1 : 0);
          return (
            <li key={s.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm capitalize">{s.label}</p>
                  <p className="text-xs text-subtle">{s.hint}</p>
                </div>
                <p
                  className={cn(
                    "inline-flex items-center gap-1.5 font-mono text-sm tabular-nums",
                    stalled && "text-warn",
                  )}
                >
                  {stalled ? <LiveDot tone="warn" /> : null}
                  {n}
                </p>
              </div>
              <div className="flex h-3 gap-px">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={s.key + i}
                    className={cn(
                      "flex-1",
                      i < filled ? (stalled ? "bg-warn" : "bg-fg") : "bg-elev",
                    )}
                  />
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      <PlantPlan />
    </div>
  );
}
