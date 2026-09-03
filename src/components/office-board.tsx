import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { Portrait, ownerId } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { officeIssuesForBoard } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import {
  officeMillCaption,
  officeMillFixLines,
  officeTapeSkips,
} from "@/lib/lab/office-display";

/** Next action first — stamp issues plus mill clutter to clear. */
export function ThingsToFix() {
  const stamp = useStamp();
  const issues = officeIssuesForBoard(stamp.issues, stamp);
  const mill = officeMillFixLines(stamp.recipes, stamp.trades, stamp.day);
  const hasAnything = issues.length > 0 || mill.length > 0;

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Things to fix</h2>
        <p className="text-xs text-subtle">Problem · who · next</p>
      </header>
      {!hasAnything ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ol>
          {issues.map((iss) => {
            const id = ownerId(iss.owner);
            return (
              <li key={iss.id} className="border-b border-border">
                <Link
                  to="/issues/$id"
                  params={{ id: iss.id }}
                  className="flex gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {id ? <Portrait id={id} name={iss.owner} size="sm" /> : null}
                  <div className="min-w-0">
                    <p className="text-sm">{iss.problem}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {iss.owner} · {iss.next}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
          {mill.map((row) => (
            <li key={row.id} className="border-b border-border py-3">
              <p className="text-sm">{row.problem}</p>
              <p className="mt-1 text-xs text-subtle">{row.hint}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** One invent/mill line — not a second square. */
export function MillCaption() {
  const stamp = useStamp();
  const line = officeMillCaption({
    fuse_on: stamp.fuse_on,
    office: stamp.office,
    pipe: stamp.pipe,
    hunters: stamp.hunters,
    mill_mode: (stamp as { mill_mode?: string }).mill_mode,
    mill_n_armed: (stamp as { mill_n_armed?: number }).mill_n_armed,
    n_armed: (stamp as { n_armed?: number }).n_armed,
  });

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Mill</h2>
        <p className="text-xs text-subtle">Invent caption</p>
      </header>
      {line === EMPTY ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <p className="text-sm text-muted">{line}</p>
      )}
    </section>
  );
}

/** Off Trades tape — sparse in-play by design, not a first-book window. */
export function SkippedOffTape() {
  const stamp = useStamp();
  const lines = officeTapeSkips(stamp.recipes, stamp.trades, stamp.day);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Skipped / off tape</h2>
        <p className="text-xs text-subtle">Not on Trades Waiting</p>
      </header>
      {lines.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ul className="space-y-2">
          {lines.map((line) => (
            <li key={line} className="text-sm text-muted">{line}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
