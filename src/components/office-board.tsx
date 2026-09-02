import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { ownerId, Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import {
  issueBoard,
  officeCountries,
  officeWorkers,
  pipeBoard,
  recipeStatus,
} from "@/lib/lab/boards";
import { EMPTY, recipePack } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";
import { cn } from "@/lib/utils";

/** Next action first. */
export function ThingsToFix() {
  const stamp = useStamp();
  const rows = stamp.issues.map(issueBoard);

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

/** Factory line: stuck sentence + five stage counts. */
export function FactoryLine() {
  const stamp = useStamp();
  const board = pipeBoard(stamp.pipe, stamp.fuse_on);

  return (
    <section className="space-y-5">
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Factory line</h2>
        <p className="text-xs text-subtle">New ideas to live</p>
      </header>
      {board.stuck === EMPTY ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <p className="inline-flex items-start gap-2 text-sm text-warn">
          <LiveDot tone="warn" />
          <span>{board.stuck}</span>
        </p>
      )}
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
  );
}

/** Parked vs still being tested, by country, then who’s working. */
export function RecipesNotEarning() {
  const stamp = useStamp();
  const countries = officeCountries(stamp.coverage, stamp.recipes);
  const pack = recipePack(stamp.recipes);
  const workers = officeWorkers(stamp.hunters, stamp.office.activeHunter);

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-medium text-muted">By country</h2>
          <p className="text-xs text-subtle">Parked vs still being tested</p>
        </header>
        <ul>
          {countries.map((c, i) => (
            <li
              key={c.region}
              className="log-in flex items-baseline justify-between gap-3 border-b border-border py-2.5"
              style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
            >
              <p className="text-sm">{c.name}</p>
              <p className="text-right text-sm text-muted">{c.line}</p>
            </li>
          ))}
        </ul>
      </section>

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
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium text-muted">{title}</h2>
          <span className="font-mono text-xs text-subtle">{rows.length}</span>
        </div>
        <p className="text-xs text-subtle">{hint}</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="border-b border-border">
              <Link
                to="/holdings/$id"
                params={{ id: r.id }}
                className="flex items-baseline justify-between gap-3 py-2.5 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="min-w-0">
                  <p className="text-sm">{r.title}</p>
                  <p className="mt-0.5 text-xs text-subtle">{recipeStatus(r)}</p>
                </div>
                <p className="shrink-0 text-xs text-subtle">{r.region}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
