import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { HUNTER_MARKS } from "@/components/marks";
import { useStamp } from "@/components/plant-context";
import {
  officeCountries,
  officeWorkers,
  recipeStatus,
} from "@/lib/lab/boards";
import { EMPTY, recipePack } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  const stamp = useStamp();
  const countries = officeCountries(stamp.coverage, stamp.recipes);
  const pack = recipePack(stamp.recipes);
  const workers = officeWorkers(stamp.hunters, stamp.office.activeHunter);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">Recipes that are not earning yet.</p>
      </header>

      <section>
        <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
          <h2 className="text-sm font-medium">By country</h2>
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
          <h2 className="text-sm font-medium">{title}</h2>
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
