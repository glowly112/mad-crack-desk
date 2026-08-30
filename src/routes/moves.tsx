import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { moveTone } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/moves")({ component: Moves });

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
        <EmptyState />
      ) : (
        <ol className="space-y-5">
          {stamp.moves.map((m) => {
            const tone = moveTone(m.to);
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
