import { MarkIssues, MarkKeep } from "@/components/marks";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { EMPTY, hopMoves } from "@/lib/lab/desk";
import { millTapeRows } from "@/lib/lab/trades";
import { hopVoice } from "@/lib/lab/staff-voice";

export function FloorLog() {
  const stamp = useStamp();
  const hops = hopMoves(stamp.moves);
  const tape = millTapeRows(stamp);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">State hops</h2>
        <p className="text-xs text-subtle">Mill tape</p>
      </header>
      {tape.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : hops.length > 0 ? (
        <ol className="space-y-3">
          {hops.map((row, i) => {
            const Icon = row.to === "Dead" ? MarkIssues : MarkKeep;
            const line = hopVoice(row);
            return (
              <li
                key={row.at + row.recipe}
                className="log-in flex items-start gap-2"
                style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
              >
                <Icon className="mt-0.5 size-3.5 shrink-0 text-subtle" />
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-mono text-xs text-subtle">{row.at}</span>
                    {line ? ` · ${line}` : ` · ${row.recipe}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="space-y-3">
          {tape.map((row, i) => (
            <li
              key={`${row.at}-${row.text}-${i}`}
              className="log-in flex items-start gap-2"
              style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
            >
              <MarkKeep className="mt-0.5 size-3.5 shrink-0 text-subtle" />
              <div className="min-w-0">
                <p className="text-sm">
                  {row.at ? <span className="font-mono text-xs text-subtle">{row.at} · </span> : null}
                  {row.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
