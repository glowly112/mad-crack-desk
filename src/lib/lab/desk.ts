/** Display grouping for the desk. Never sums cells or invents a score. */

import type { Move, Recipe } from "./stamp.ts";

export const EMPTY = "Empty";
export const SOLID_EMPTY = "No solid recipes on the day tape.";

export function recipePack(recipes: readonly Recipe[]) {
  return {
    solids: recipes.filter((r) => r.badge === "Solid"),
    keeps: recipes.filter((r) => r.status === "KEEP" && r.badge !== "Solid"),
    proving: recipes.filter((r) => r.status === "MEASURING"),
  };
}

/** Solids 0 → the solid pack is empty, even if a research keep is dressed as a winner. */
export function solidRows(recipes: readonly Recipe[], n_solid: number): Recipe[] {
  if (n_solid <= 0) return [];
  return recipePack(recipes).solids;
}

export function parkedCount(keep: number, n_solid: number): number {
  return Math.max(0, keep - n_solid);
}

const HOP_TO = new Set(["Certified", "Solid", "Research keep", "Dead", "Parked"]);

/** State hops only — not proving ticks. */
export function hopMoves(moves: readonly Move[]): Move[] {
  return moves.filter((m) => HOP_TO.has(m.to) && m.from !== m.to);
}

export function productionDomain(
  values: readonly (number | null | undefined)[],
  aim: number,
): [number, number] {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const lo = present.length ? Math.min(0, ...present) : Math.min(0, aim);
  const hi = Math.max(aim, 0, ...present);
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

export function productionTicks(domain: [number, number], aim: number): number[] {
  const ticks = [Math.floor(domain[0]), 0, aim];
  return [...new Set(ticks)].sort((a, b) => a - b);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Floor chart x-label: `19 Aug`, not a bare `19`. */
export function axisDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const day = Number.parseInt(m[3], 10);
  const mon = MONTHS[Number.parseInt(m[2], 10) - 1];
  return mon ? `${day} ${mon}` : iso;
}

/** First day, last day with production, last day — skip duplicates. */
export function chartDayTicks(series: readonly { day: string; paper_live_day_u: number | null }[]): number[] {
  if (!series.length) return [];
  const last = series.length - 1;
  let lastProd = -1;
  for (let i = last; i >= 0; i--) {
    if (series[i]?.paper_live_day_u != null) {
      lastProd = i;
      break;
    }
  }
  const ticks = [0];
  if (lastProd > 0 && lastProd !== last) ticks.push(lastProd);
  if (last > 0) ticks.push(last);
  return ticks;
}

/** Consecutive production days only. Null days stay a gap — never a fake 0. */
export function productionSegments(
  series: readonly { paper_live_day_u: number | null }[],
): { i: number; v: number }[][] {
  const segs: { i: number; v: number }[][] = [];
  let cur: { i: number; v: number }[] = [];
  series.forEach((p, i) => {
    if (p.paper_live_day_u == null) {
      if (cur.length) segs.push(cur);
      cur = [];
    } else {
      cur.push({ i, v: p.paper_live_day_u });
    }
  });
  if (cur.length) segs.push(cur);
  return segs;
}

export function floorSeats<T extends { id: string }>(seats: readonly T[]): T[] {
  const order = ["clerk", "foreman", "igor"];
  return order
    .map((id) => seats.find((s) => s.id === id))
    .filter((s): s is T => Boolean(s));
}

export function prettyTitle(title: string): string {
  const t = title.replace(/_/g, " ").trim();
  const lower = t.toLowerCase();
  if (/gb\b/.test(lower) && /win/.test(lower) && /near\s*off/.test(lower)) return "GB win near-off";
  if (/\bnz\b/.test(lower) && /morning/.test(lower) && /win/.test(lower)) return "NZ morning win";
  if (/\bau\b/.test(lower) && /place/.test(lower) && /near\s*off/.test(lower)) return "AU place near-off";
  if (/\bau\b/.test(lower) && /late\s*pre/.test(lower) && /win/.test(lower)) return "AU late-pre win midfield";
  if (/\bus\b/.test(lower) && /in\s*play/.test(lower) && /place/.test(lower)) return "US in-play place small field";
  if (/\bza\b/.test(lower) && /near\s*off/.test(lower) && /place/.test(lower)) return "ZA near-off place small field";
  if (/\bfr\b/.test(lower) && /near\s*off/.test(lower) && /place/.test(lower)) return "FR near-off place";
  return t.replace(/\bbanked\b/i, "").replace(/\bsize ok\b/i, "").replace(/\s+/g, " ").trim();
}
