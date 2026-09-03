import { Link } from "@tanstack/react-router";
import { CountryPack } from "@/components/country-pack";
import { DeskTable } from "@/components/desk-table";
import { EmptyState } from "@/components/empty-state";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { ownerId, Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import {
  factorySquares,
  floorRacingSquare,
  inventWhatHappened,
  officeIssuesForBoard,
  officeWorkers,
  isEmptyHoleHuntBoard,
  pipeBoard,
  SQUARE_HOLE_COUNT,
  waffleCols,
} from "@/lib/lab/boards";
import { millDisplayRecipes } from "@/lib/lab/mill-display.ts";
import { EMPTY, recipeDeskRow, recipePack } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";
import { cn } from "@/lib/utils";

/** Next action first. */
export function ThingsToFix() {
  const stamp = useStamp();
  const rows = officeIssuesForBoard(stamp.issues, stamp);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Things to fix</h2>
        <p className="text-xs text-subtle">Problem · who · next</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ol>
          {rows.map((iss) => {
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
        </ol>
      )}
    </section>
  );
}

const STAGE_SQ: Record<string, string> = {
  pitched: "bg-muted",
  proving: "bg-warn",
  closed: "bg-subtle",
  certified: "bg-fg",
  live: "bg-up",
  empty: "bg-elev ring-1 ring-inset ring-border-strong",
  armed: "bg-warn",
};

/** Factory line: stuck sentence + a pile of unit squares. Numbers stay quiet. */
export function FactoryLine() {
  const stamp = useStamp();
  const holes = floorRacingSquare({ namedHoles: stamp.holes });
  const holeTotal = holes.length > 0 ? holes.length : SQUARE_HOLE_COUNT;
  const authOccupied = (stamp as { square_occupied_n?: number }).square_occupied_n;
  const paintedOccupied = holes.filter((h) => h.tone !== "empty").length;
  const occupiedN =
    authOccupied != null && authOccupied > paintedOccupied ? authOccupied : paintedOccupied;
  const emptyN = holeTotal - occupiedN;
  const armed = (stamp as { mill_n_armed?: number; n_armed?: number }).mill_n_armed ??
    (stamp as { n_armed?: number }).n_armed ?? 0;
  const board = pipeBoard(stamp.pipe, stamp.fuse_on, {
    inventWhy: stamp.office.inventWhy,
    square: { armed, empty: emptyN, solid: stamp.n_solid },
  });
  const squares = factorySquares(board.stages);
  const hunt = isEmptyHoleHuntBoard(stamp.office.inventWhy);
  const glance = board.stages
    .map((s) => `${s.label} ${s.count === 0 ? EMPTY : s.count}`)
    .join(". ");

  return (
    <section className="space-y-5">
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Factory line</h2>
        <p className="text-xs text-subtle">
          {hunt ? "Armed and empty on the square" : "New ideas to live"}
        </p>
      </header>
      {board.stuck === EMPTY ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <p className="inline-flex items-start gap-2 text-sm text-warn">
          <LiveDot tone="warn" />
          <span>{board.stuck}</span>
        </p>
      )}
      {squares.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div
            className="grid gap-[3px]"
            role="img"
            aria-label={glance}
            style={{
              gridTemplateColumns: `repeat(${Math.max(waffleCols(squares.length), 8)}, 1rem)`,
            }}
          >
            {squares.map((sq, i) => (
              <span
                key={sq.id}
                className={cn("log-in size-4 rounded-[2px]", STAGE_SQ[sq.key] ?? "bg-muted")}
                style={{ animationDelay: `${Math.min(i, 20) * 12}ms` }}
                title={sq.label}
              />
            ))}
          </div>
          <ol className="flex flex-col gap-1.5">
            {board.stages.map((s) => (
              <li key={s.key} className="flex items-baseline gap-1.5 text-xs">
                <span
                  className={cn(
                    "inline-block size-2 translate-y-px rounded-[1px]",
                    STAGE_SQ[s.key] ?? "bg-muted",
                  )}
                  aria-hidden
                />
                <span className="text-muted">{s.label}</span>
                <span className="font-mono text-subtle">{s.count === 0 ? EMPTY : s.count}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/** Invent queue and reject — Office, not Floor. */
export function InventHappened() {
  const stamp = useStamp();
  const line = inventWhatHappened({
    invent: stamp.office.invent,
    inventWhy: stamp.office.inventWhy,
    pitched: stamp.pipe.pitched,
    hunters: stamp.hunters,
    rejects: stamp.office.rejects,
    mill_mode: (stamp as { mill_mode?: string }).mill_mode,
    mill_n_armed: (stamp as { mill_n_armed?: number }).mill_n_armed,
    n_armed: (stamp as { n_armed?: number }).n_armed,
  });

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Invent</h2>
        <p className="text-xs text-subtle">What happened</p>
      </header>
      {line === EMPTY ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <p className="text-sm text-muted">{line}</p>
      )}
    </section>
  );
}

/** Parked vs still being tested, by country, then who’s working. */
export function RecipesNotEarning() {
  const stamp = useStamp();
  const pack = recipePack(millDisplayRecipes(stamp.recipes));
  const workers = officeWorkers(stamp.hunters, stamp.office.activeHunter, stamp.office.inventWhy);

  return (
    <div className="space-y-8">
      <CountryPack />

      <RecipeGroup title="Parked" hint="Not income" rows={pack.keeps} />
      <RecipeGroup title="Still being tested" hint="Not the score" rows={pack.proving} />

      <section>
        <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-medium text-muted">Who's working</h2>
          <p className="text-xs text-subtle">Gaps, not a wall</p>
        </header>
        {workers.length === 0 ? (
          <EmptyState copy={EMPTY} />
        ) : (
          <ul>
            {workers.map((w) => {
              const Icon = HUNTER_MARKS[w.id as keyof typeof HUNTER_MARKS];
              return (
                <li key={w.id} className="border-b border-border">
                  <Link
                    to="/hunters/$id"
                    params={{ id: w.id }}
                    className="flex items-baseline gap-3 py-2.5 transition-transform duration-150 ease-out active:scale-[0.96]"
                  >
                    {Icon ? <Icon className="size-3.5 shrink-0 text-subtle" /> : null}
                    <p className="w-24 shrink-0 text-sm">{w.name}</p>
                    <p className="min-w-0 text-sm text-muted">{w.work}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function RecipeGroup({ title, hint, rows }: { title: string; hint: string; rows: Recipe[] }) {
  return (
    <section className="min-w-0">
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-muted">{title}</h2>
          <span className="font-mono text-xs text-subtle">{rows.length}</span>
        </div>
        <p className="text-xs text-subtle">{hint}</p>
      </header>
      <DeskTable groups={[{ id: title, rows: rows.map(recipeDeskRow) }]} empty={EMPTY} />
    </section>
  );
}
