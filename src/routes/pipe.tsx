import { createFileRoute } from "@tanstack/react-router";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipe")({ component: Pipe });

const STAGES = [
  { key: "pitched", label: "Pitched", hint: "Invent cells" },
  { key: "proving", label: "Proving", hint: "Measuring pile" },
  { key: "closed", label: "Closed", hint: "Out of window" },
  { key: "certified", label: "Certified", hint: "The production door" },
  { key: "scaling", label: "Scaling", hint: "Live ⊆ paper" },
] as const;

export function Pipe() {
  const stamp = useStamp();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Pipe</h1>
        <p className="mt-1 text-sm text-muted">{stamp.oneSystem}</p>
      </header>

      <ol className="-mx-4 flex gap-px overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {STAGES.map((s) => {
          const n = stamp.pipe[s.key];
          const stalled = s.key === "certified" && n === 0;
          return (
            <li
              key={s.key}
              className="min-w-[8.5rem] flex-1 border border-border bg-surface px-3 py-4 md:min-w-0"
            >
              <p className="text-sm">{s.label}</p>
              <p className="mt-0.5 text-xs text-subtle">{s.hint}</p>
              <p
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 font-mono text-3xl tabular-nums tracking-tight",
                  stalled && "text-warn",
                )}
              >
                {stalled ? <LiveDot tone="warn" /> : null}
                {n}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
