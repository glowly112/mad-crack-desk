import { FloorLog } from "@/components/floor-log";
import { LookLink } from "@/components/look-link";
import { StatusPill, packKind } from "@/components/looks/status-pill";
import { MiniSpark, TapeSpark } from "@/components/looks/spark";
import { useStamp } from "@/components/plant-context";
import { EMPTY, SOLID_EMPTY, recipePack, solidRows } from "@/lib/lab/desk";
import { productionScore } from "@/lib/lab/hero";
import type { Recipe } from "@/lib/lab/stamp";
import { tapeScoreClass } from "@/lib/look";
import { cn, fmtU } from "@/lib/utils";

export function TapeFloor() {
  const stamp = useStamp();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const scoreClass = tapeScoreClass(u);
  const pack = recipePack(stamp.recipes);
  const solids = solidRows(stamp.recipes, stamp.n_solid);
  const sparkVals = stamp.trends.map((p) => p.paper_live_day_u);

  return (
    <div className="tape-floor">
      <div className="tape-main">
        <section className="tape-hero" data-glare="tape-score">
          <p className="tape-kicker">{stamp.hero.label}</p>
          <div className="tape-hero-row">
            <p className={cn("tape-score", scoreClass)}>{fmtU(u)}</p>
            <span className={cn("tape-chip", scoreClass === "tape-score-up" ? "is-up" : "is-bad")}>
              {u == null ? "▼ Empty" : u >= 0 ? "▲ Up" : "▼ Down"}
            </span>
          </div>
          <p className="tape-aim">
            Aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs} · {stamp.n_solid} solid
          </p>
          <TapeSpark className={cn("tape-hero-spark", scoreClass)} />
        </section>

        <section className="tape-movers" aria-label="Packs">
          <Mover
            label="Solid"
            count={stamp.n_solid}
            hint={stamp.n_solid === 0 ? "Empty" : "Score"}
            tone={stamp.n_solid === 0 ? "bad" : "up"}
            values={sparkVals}
          />
          <Mover
            label="Keep"
            count={stamp.counts.keep}
            hint="Research · not the score"
            tone="mute"
            values={stamp.trends.map((p) => p.n_keep)}
          />
          <Mover
            label="Proving"
            count={stamp.counts.measuring}
            hint="Quiet pile"
            tone="mute"
            values={stamp.trends.map((p) => p.n_measuring)}
          />
        </section>

        <aside className="tape-next">
          <div>
            <p className="tape-next-action">{stamp.topBlocker.action}</p>
            <p className="tape-next-meta">
              {stamp.topBlocker.owner} · {stamp.topBlocker.title}
            </p>
          </div>
          <LookLink to="/issues/$id" params={{ id: stamp.topBlocker.id }} className="tape-next-link">
            Issues
          </LookLink>
        </aside>

        <TapeTable label="Solid" empty={SOLID_EMPTY} rows={solids} />
        <TapeTable label="Research keep" empty={EMPTY} rows={pack.keeps} quiet />
        <TapeTable label="Proving" empty={EMPTY} rows={pack.proving} quiet />
      </div>

      <aside className="tape-rail">
        <section className="tape-rail-card">
          <p className="tape-kicker">Production</p>
          <TapeSpark className={cn("tape-rail-spark", scoreClass)} />
          <p className="tape-aim">Aim £{stamp.hero.aim_u} on the axis</p>
        </section>
        <FloorLog />
      </aside>
    </div>
  );
}

function Mover({
  label,
  count,
  hint,
  tone,
  values,
}: {
  label: string;
  count: number;
  hint: string;
  tone: "up" | "bad" | "mute";
  values: readonly (number | null)[];
}) {
  return (
    <article className="tape-mover">
      <div className="tape-mover-top">
        <p className="tape-mover-label">{label}</p>
        <span className={cn("tape-chip", tone === "up" && "is-up", tone === "bad" && "is-bad")}>
          {tone === "bad" ? "▼" : tone === "up" ? "▲" : "·"} {count}
        </span>
      </div>
      <MiniSpark values={values} tone={tone} />
      <p className="tape-mover-hint">{hint}</p>
    </article>
  );
}

function TapeTable({
  label,
  empty,
  rows,
  quiet,
}: {
  label: string;
  empty: string;
  rows: Recipe[];
  quiet?: boolean;
}) {
  const kind = packKind(label);
  return (
    <section className={cn("tape-table", quiet && "is-quiet")}>
      <header className="tape-table-head">
        <h2>{label}</h2>
        <span>{rows.length}</span>
      </header>
      {rows.length === 0 ? (
        <p className="tape-empty">{empty}</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id}>
              <LookLink to="/holdings/$id" params={{ id: r.id }} className="tape-row">
                <div className="min-w-0 flex-1">
                  <div className="tape-row-title">
                    <p>{r.title}</p>
                    <StatusPill kind={kind}>{label}</StatusPill>
                  </div>
                  <p className="tape-row-why">{r.why}</p>
                </div>
                <p className="tape-row-meta">{r.region}</p>
                <p className="tape-row-meta">n={r.n}</p>
                <p className={cn("tape-row-roi", !quiet && r.roi >= 0 ? "is-up" : !quiet && r.roi < 0 ? "is-bad" : "")}>
                  {r.roi >= 0 ? "+" : ""}
                  {r.roi.toFixed(1)}%
                </p>
              </LookLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
