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

const REGIONS = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;

const WINDOWS: [RegExp, string][] = [
  [/near\s*-?off|nearoff/, "near-off"],
  [/late\s*-?pre|latepre/, "late-pre"],
  [/in\s*-?play|inplay/, "in-play"],
  [/morning/, "morning"],
];

/** Country · window · market · pick/odds hint. Never a raw H-fast id. */
export function cellName(...parts: string[]): string {
  const raw = parts
    .map((p) => p.split("|")[0] ?? "")
    .join(" ")
    .replace(/_/g, " ")
    .replace(/^H-/i, "")
    .replace(/\d{8}T\d{6}Z-?/g, "")
    .replace(/\bfast-?/gi, "")
    .replace(/\bautopsy-?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const lower = raw.toLowerCase();
  const region = REGIONS.find((r) => new RegExp(`\\b${r}\\b`, "i").test(raw)) ?? "";
  const market = /place/.test(lower) ? "PLACE" : /win/.test(lower) ? "WIN" : "";
  const window = WINDOWS.find(([re]) => re.test(lower))?.[1] ?? "";
  const hints: string[] = [];
  if (/one[\s-]?pick/.test(lower)) hints.push("one-pick");
  if (/midfield/.test(lower)) hints.push("midfield");
  if (/small\s*field/.test(lower)) hints.push("small field");
  if (/large\s*field/.test(lower)) hints.push("large field");
  const dotted = /band[\s-]+(\d+)-(\d+)-(\d+)-(\d+)/.exec(lower);
  if (dotted) {
    hints.push(`${dotted[1]}.${dotted[2]}–${dotted[3]}.${dotted[4]}`);
  } else {
    const band = /band[\s-]*(\d+(?:\.\d+)?)[\s-]+(\d+(?:\.\d+)?)/.exec(lower);
    if (band) hints.push(`${band[1]}–${band[2]}`);
    const span = /(\d+(?:\.\d+)?)to(\d+(?:\.\d+)?)/.exec(lower);
    if (!band && span) hints.push(`${span[1]}–${span[2]}`);
  }
  const head = [region, window, market].filter(Boolean).join(" ");
  if (!head) {
    const cleaned = raw
      .replace(/\bbanked\b/i, "")
      .replace(/\bsize ok\b/i, "")
      .replace(/[A-Z0-9]{5,}$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned || "Empty";
  }
  return hints.length ? `${head} · ${hints.join(" ")}` : head;
}

/** @deprecated use cellName — kept for existing imports */
export function prettyTitle(title: string): string {
  return cellName(title);
}

/** Last `size` days ending at `selected`. */
export function dayWindow(days: readonly string[], selected: string, size = 8): string[] {
  const i = days.indexOf(selected);
  const end = i < 0 ? days.length : i + 1;
  const start = Math.max(0, end - size);
  return days.slice(start, end);
}

/**
 * Daily chart window ending at `selected`. If the trailing days are all Empty,
 * stretch back so the last production day is still on screen (cap `max`).
 */
export function chartWindow(
  series: readonly { day: string; paper_live_day_u: number | null }[],
  selected: string,
  size = 8,
  max = 15,
): string[] {
  const days = series.map((p) => p.day);
  const trailing = dayWindow(days, selected, size);
  const valueOf = (d: string) => series.find((p) => p.day === d)?.paper_live_day_u;
  if (trailing.some((d) => valueOf(d) != null)) return trailing;
  let lastProd = -1;
  const end = days.indexOf(selected);
  const endI = end < 0 ? days.length - 1 : end;
  for (let i = endI; i >= 0; i--) {
    if (series[i]?.paper_live_day_u != null) {
      lastProd = i;
      break;
    }
  }
  if (lastProd < 0) return trailing;
  const start = Math.max(0, Math.min(lastProd - (size - 1), endI + 1 - max));
  return days.slice(start, endI + 1);
}

/** Scale includes aim 100u when there is production. All-Empty is [0, aim] — do not draw that dummy. */
export function dailyDomain(
  values: readonly (number | null | undefined)[],
  aim = 100,
): [number, number] {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!present.length) return [0, aim];
  const lo = Math.min(0, ...present);
  const hi = Math.max(aim, ...present);
  return [lo, hi];
}
