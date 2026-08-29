import { createFileRoute } from "@tanstack/react-router";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/moves")({ component: Moves });

function toneFor(to: string) {
  if (to === "Dead" || to === "Stuck") return "bad" as const;
  if (to === "Research keep" || to === "Pass") return "ok" as const;
  return "mute" as const;
}

export function Moves() {
  const stamp = useStamp();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Moves</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Keep is not measure. Every hop needs a why — Virchow class, Hyde hold, or a certify.
        </p>
      </header>
      {stamp.moves.length === 0 ? (
        <p className="text-sm text-subtle">No moves on this stamp.</p>
      ) : (
        <ol className="space-y-5">
          {stamp.moves.map((m) => {
            const tone = toneFor(m.to);
            return (
              <li key={m.at + m.recipe} className="log-in">
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
                      "min-w-0 flex-1 truncate rounded-sm px-3 py-2 font-mono text-xs",
                      tone === "bad" && "bg-elev text-bad",
                      tone === "ok" && "bg-elev text-up",
                      tone === "mute" && "bg-elev text-fg",
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
