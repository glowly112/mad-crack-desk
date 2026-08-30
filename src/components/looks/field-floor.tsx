import { useState } from "react";
import { LookLink } from "@/components/look-link";
import { StatusPill, packKind } from "@/components/looks/status-pill";
import { useStamp } from "@/components/plant-context";
import { EMPTY, SOLID_EMPTY, recipePack, solidRows } from "@/lib/lab/desk";
import { productionScore } from "@/lib/lab/hero";
import type { Recipe } from "@/lib/lab/stamp";
import { fieldBettingClass } from "@/lib/look";
import { fmtU } from "@/lib/utils";

type Lane = "solid" | "keep" | "proving";

export function FieldFloor() {
  const stamp = useStamp();
  const [lane, setLane] = useState<Lane>("solid");
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const pack = recipePack(stamp.recipes);
  const solids = solidRows(stamp.recipes, stamp.n_solid);
  const on = stamp.fuse_on;
  const fieldClass = fieldBettingClass(on);

  const lanes: { id: Lane; label: string; count: number; hint: string; rows: Recipe[]; empty: string }[] = [
    { id: "solid", label: "Solid", count: stamp.n_solid, hint: "the score", rows: solids, empty: SOLID_EMPTY },
    {
      id: "keep",
      label: "Research keep",
      count: stamp.counts.keep,
      hint: "not income",
      rows: pack.keeps,
      empty: EMPTY,
    },
    {
      id: "proving",
      label: "Proving",
      count: stamp.counts.measuring,
      hint: "quiet pile",
      rows: pack.proving,
      empty: EMPTY,
    },
  ];
  const active = lanes.find((l) => l.id === lane) ?? lanes[0];

  return (
    <div className="field-floor">
      <section className={fieldClass} data-glare="field-betting" role="status">
        <div className="field-band-stat">
          <p className="field-band-num">{on ? "ON" : "OFF"}</p>
          <p className="field-band-label">Real betting</p>
          <p className="field-band-sub">{on ? stamp.fuse : "Paper only · fuse stays off"}</p>
        </div>
        <div className="field-band-copy">
          <p>
            Production {fmtU(u)} · {stamp.n_solid} solid · aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs}
          </p>
          <p className="field-band-next">
            {stamp.topBlocker.action}{" "}
            <LookLink to="/issues/$id" params={{ id: stamp.topBlocker.id }}>
              {stamp.topBlocker.owner}
            </LookLink>
          </p>
        </div>
      </section>

      <div className="field-sev" role="tablist" aria-label="Packs">
        {lanes.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            aria-selected={lane === l.id}
            className={`field-sev-tab is-${l.id} ${lane === l.id ? "is-on" : ""}`}
            onClick={() => setLane(l.id)}
          >
            <span className="field-sev-label">{l.label}</span>
            <span className="field-sev-count">
              {l.count} {l.hint}
            </span>
          </button>
        ))}
      </div>

      <section className="field-lane">
        {active.rows.length === 0 ? (
          <p className="field-empty">{active.empty}</p>
        ) : (
          <ul>
            {active.rows.map((r) => (
              <li key={r.id}>
                <LookLink to="/holdings/$id" params={{ id: r.id }} className="field-row">
                  <div className="min-w-0 flex-1">
                    <div className="field-row-top">
                      <p>{r.title}</p>
                      <StatusPill kind={packKind(active.label)}>{active.label}</StatusPill>
                    </div>
                    <p className="field-row-why">{r.why}</p>
                  </div>
                  <p className="field-row-meta">
                    {r.region} · n={r.n}
                  </p>
                </LookLink>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
