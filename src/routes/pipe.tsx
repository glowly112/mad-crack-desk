import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";
import { pipeBoard } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipe")({ component: Pipe });

export function Pipe() {
  const stamp = useStamp();
  const board = pipeBoard(stamp.pipe, stamp.fuse_on);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Pipe</h1>
        <p className="mt-1 text-sm text-muted">The factory line.</p>
      </header>

      <section>
        <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-medium">Stuck</h2>
          <p className="text-xs text-subtle">The bottleneck</p>
        </header>
        {board.stuck === EMPTY ? (
          <EmptyState copy={EMPTY} />
        ) : (
          <p className="inline-flex items-start gap-2 text-sm text-warn">
            <LiveDot tone="warn" />
            <span>{board.stuck}</span>
          </p>
        )}
      </section>

      <section>
        <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-medium">Line</h2>
          <p className="text-xs text-subtle">New ideas to live</p>
        </header>
        <ol>
          {board.stages.map((s, i) => (
            <li
              key={s.key}
              className="log-in flex items-baseline gap-4 border-b border-border py-3"
              style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
            >
              <p className="w-6 shrink-0 font-mono text-xs text-subtle">{i + 1}</p>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", s.stuck && "text-warn")}>{s.label}</p>
                {s.stuck || s.hint ? (
                  <p className="mt-0.5 text-xs text-subtle">{s.stuck ? "Stuck here" : s.hint}</p>
                ) : null}
              </div>
              <p
                className={cn(
                  "font-mono text-4xl leading-none tracking-tight tabular-nums",
                  s.stuck ? "text-warn" : "text-fg",
                )}
              >
                {s.count}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
