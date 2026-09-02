import { MarkIssues, MarkKeep } from "@/components/marks";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { EMPTY, hopMoves } from "@/lib/lab/desk";

export function FloorLog() {
  const stamp = useStamp();
  const hops = hopMoves(stamp.moves);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted">State hops</h2>
        <p className="text-xs text-subtle">Mill tape</p>
      </header>
      {hops.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ol className="space-y-2 font-mono text-xs">
          {hops.map((row, i) => {
            const Icon = row.to === "Dead" ? MarkIssues : MarkKeep;
            return (
              <li
                key={row.at + row.recipe}
                className="log-in flex items-start gap-2"
                style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
              >
                <Icon className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                <span className="w-10 shrink-0 text-subtle">{row.at}</span>
                <span className="min-w-0 text-muted">
                  {row.recipe} · {row.from} → {row.to}
                  <span className="block text-subtle">{row.why}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
