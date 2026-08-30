import { LookLink } from "@/components/look-link";
import { useStamp } from "@/components/plant-context";
import { EMPTY, SOLID_EMPTY, recipePack, solidRows } from "@/lib/lab/desk";
import { productionScore } from "@/lib/lab/hero";
import type { Recipe } from "@/lib/lab/stamp";
import { cn, fmtGbp, fmtU } from "@/lib/utils";

export function LedgerFloor() {
  const stamp = useStamp();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const pack = recipePack(stamp.recipes);
  const solids = solidRows(stamp.recipes, stamp.n_solid);

  return (
    <div className="ledger-floor" data-glare="ledger-desk">
      <header className="ledger-welcome">
        <h1>Welcome back</h1>
        <p>
          {stamp.n_solid} solid · real betting {stamp.fuse_on ? "on" : "off"}
          {stamp.fuse_on ? "" : " · paper only"}
        </p>
      </header>

      <div className="ledger-actions">
        <LookLink to="/issues/$id" params={{ id: stamp.topBlocker.id }} className="ledger-send">
          {stamp.topBlocker.action}
        </LookLink>
        <LookLink to="/issues" className="ledger-ghost">
          Issues
        </LookLink>
        <LookLink to="/pipe" className="ledger-ghost">
          Pipe
        </LookLink>
      </div>

      <div className="ledger-split">
        <article className="ledger-card ledger-in">
          <p className="ledger-card-kicker">Production · solid pack</p>
          <p className={cn("ledger-figure", u != null && u >= 0 && "is-in")}>{fmtU(u)}</p>
          <p className="ledger-card-meta">
            Aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs} · {stamp.n_solid} solid
          </p>
          {solids.length === 0 ? (
            <p className="ledger-empty">{SOLID_EMPTY}</p>
          ) : (
            <LedgerRows rows={solids} income />
          )}
        </article>

        <article className="ledger-card ledger-out">
          <p className="ledger-card-kicker">Research · not income</p>
          <p className="ledger-figure is-out">{fmtGbp(stamp.researchKeepGbp)}</p>
          <p className="ledger-card-meta">
            {stamp.counts.keep} keep · {stamp.counts.measuring} proving · not the score
          </p>
          {pack.keeps.length === 0 ? (
            <p className="ledger-empty">{EMPTY}</p>
          ) : (
            <LedgerRows rows={pack.keeps} />
          )}
        </article>
      </div>

      <section className="ledger-card">
        <p className="ledger-card-kicker">Proving</p>
        <p className="ledger-card-meta">{stamp.counts.measuring} in the pile · quiet</p>
        {pack.proving.length === 0 ? (
          <p className="ledger-empty">{EMPTY}</p>
        ) : (
          <LedgerRows rows={pack.proving} />
        )}
      </section>
    </div>
  );
}

function LedgerRows({ rows, income }: { rows: Recipe[]; income?: boolean }) {
  return (
    <ul className="ledger-rows">
      {rows.map((r) => (
        <li key={r.id}>
          <LookLink to="/holdings/$id" params={{ id: r.id }} className="ledger-row">
            <div className="min-w-0">
              <p>{r.title}</p>
              <p className="ledger-row-why">{r.why}</p>
            </div>
            <p className={cn("ledger-row-val", income && r.roi >= 0 && "is-in")}>
              {r.region} · n={r.n}
            </p>
          </LookLink>
        </li>
      ))}
    </ul>
  );
}
