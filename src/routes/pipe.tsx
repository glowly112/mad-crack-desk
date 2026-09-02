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
          <p className="text-xs text-subtle">Where the pile sits</p>
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
          <h2 className="text-sm font-medium">Stages</h2>
          <p className="text-xs text-subtle">New ideas to live</p>
        </header>
        <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {board.stages.map((s) => (
            <li key={s.key} className="log-in min-w-0">
              <p className="text-sm text-muted">{s.label}</p>
              <p
                className={cn(
                  "mt-1 font-mono text-5xl leading-none tracking-tight",
                  s.stuck ? "text-warn" : "text-fg",
                )}
              >
                {s.count}
              </p>
              {s.hint ? <p className="mt-2 text-xs text-subtle">{s.hint}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
