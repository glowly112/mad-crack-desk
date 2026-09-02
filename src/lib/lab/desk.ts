/** Display grouping for the desk. Never sums cells or invents a score. */

import type { Move, Recipe, TrendPoint } from "./stamp.ts";
import { productionScore } from "./hero.ts";

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

export type NextAction = {
  id: string;
  title: string;
  owner: string;
  action: string;
};

/** Clerk line on Floor only when KEEP is on hold and the fuse is off. Never a fake card. */
export function floorNextAction(stamp: {
  fuse_on: boolean;
  topBlocker?: NextAction | null;
}): NextAction | null {
  if (stamp.fuse_on) return null;
  const b = stamp.topBlocker;
  if (!b) return null;
  const blob = `${b.id} ${b.title} ${b.action}`.toLowerCase();
  if (/keep-hold|keep on hold|fuse off/.test(blob)) return b;
  return null;
}

const HOP_TO = new Set(["Certified", "Solid", "Research keep", "Dead", "Parked"]);

/** State hops only — not proving ticks. */
export function hopMoves(moves: readonly Move[]): Move[] {
  return moves.filter((m) => HOP_TO.has(m.to) && m.from !== m.to);
}

export function productionDomain(
  values: readonly (number | null | undefined)[],
): [number, number] {
  return dailyDomain(values);
}

export function productionTicks(domain: [number, number]): number[] {
  return dailyTicks(domain);
}

export type FloorFactId = "paper" | "solids" | "tape" | "production" | "live";

export type FloorFact = {
  id: FloorFactId;
  label: string;
  hint: string;
  value: number | null;
  kind: "u" | "count";
};

export type FloorStamp = {
  n_solid: number;
  fuse_on: boolean;
  hero: { day_u: number | null };
  recipes: readonly Recipe[];
  wait_open?: readonly { id: string }[];
  trends: readonly TrendPoint[];
  researchKeepGbp: number;
  moves: readonly Move[];
};

/** Recipes waiting on today's tape. Zero is Empty. */
export function floorTapeWaiting(stamp: {
  recipes: readonly Recipe[];
  n_solid: number;
  wait_open?: readonly { id: string }[];
}): number {
  const onTape = solidRows(stamp.recipes, stamp.n_solid).filter(
    (r) => r.chip === "Waiting for races" || r.chip === "On tape today" || r.chip === "Booking",
  ).length;
  return onTape + (stamp.wait_open?.length ?? 0);
}

export function hopTally(moves: readonly Move[]): { label: string; n: number }[] {
  const names: Record<string, string> = {
    Certified: "Certified",
    Solid: "Solid",
    "Research keep": "parked",
    Dead: "Dead",
    Parked: "parked",
  };
  const counts = new Map<string, number>();
  for (const hop of hopMoves(moves)) {
    const label = names[hop.to] ?? hop.to;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, n]) => ({ label, n }));
}

export function floorDayValue(id: FloorFactId, point: TrendPoint | undefined): number | null {
  if (!point) return null;
  if (id === "paper") return point.paper_live_day_u;
  if (id === "solids" || id === "tape") return point.n_solid;
  if (id === "production") return point.factory_day_pnl_u;
  return null;
}

/** Independent Floor facts. No aim, behind, or remaining. */
export function floorFacts(
  stamp: FloorStamp,
  scope: { day: string; lookingBack: boolean },
): FloorFact[] {
  const trend = stamp.trends.find((t) => t.day === scope.day);
  const paper = scope.lookingBack
    ? (trend?.paper_live_day_u ?? null)
    : productionScore({
        n_solid: stamp.n_solid,
        day_u: stamp.hero.day_u,
        researchKeepGbp: stamp.researchKeepGbp,
      });
  const solids = scope.lookingBack ? (trend?.n_solid ?? 0) : stamp.n_solid;
  const tape = scope.lookingBack ? (trend?.n_solid ?? 0) : floorTapeWaiting(stamp);
  const production = trend?.factory_day_pnl_u ?? null;
  const dayHint = scope.lookingBack ? axisDay(scope.day) : "today";
  return [
    { id: "paper", label: "Paper", hint: dayHint, value: paper, kind: "u" },
    {
      id: "solids",
      label: "Solids",
      hint: "certified",
      value: solids > 0 ? solids : null,
      kind: "count",
    },
    {
      id: "tape",
      label: "Tape",
      hint: scope.lookingBack ? "on tape" : "waiting",
      value: tape > 0 ? tape : null,
      kind: "count",
    },
    { id: "production", label: "Production", hint: dayHint, value: production, kind: "u" },
    {
      id: "live",
      label: "Live",
      hint: stamp.fuse_on ? dayHint : "fuse off",
      value: null,
      kind: "u",
    },
  ];
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

const LAND: Record<string, string> = {
  AU: "Australia",
  GB: "Britain",
  IE: "Ireland",
  US: "United States",
  NZ: "New Zealand",
  ZA: "South Africa",
  HK: "Hong Kong",
  FR: "France",
};

/** Short strategy mark: Britain · near-off · winner · one-pick. Never a paragraph or H-fast id. */
export function strategyMark(...parts: string[]): string {
  const blob = parts.filter(Boolean).join(" ").replace(/\|/g, " ");
  if (!blob.trim()) return EMPTY;
  const lower = blob.toLowerCase().replace(/_/g, " ");
  const region =
    REGIONS.find((r) => new RegExp(`\\b${r}\\b`, "i").test(blob)) ??
    (Object.entries(LAND).find(([, name]) => lower.includes(name.toLowerCase()))?.[0] ?? "");
  const window = WINDOWS.find(([re]) => re.test(lower))?.[1] ?? "";
  const place = /\bplace\b/.test(lower);
  const win = /\bwin(?:ner)?\b/.test(lower) && !place;
  const market = place ? "place" : win ? "winner" : "";
  const axis: string[] = [];
  const onePick = /one[\s-]?pick/.test(lower);
  const dotted = /band[\s-]+(\d+)-(\d+)-(\d+)-(\d+)/.exec(lower);
  const band = /band[\s-]*(\d+(?:\.\d+)?)[\s-]+(\d+(?:\.\d+)?)/.exec(lower);
  const span = /(\d+(?:\.\d+)?)to(\d+(?:\.\d+)?)/.exec(lower);
  const already = /(\d+(?:\.\d+)?)[–-](\d+(?:\.\d+)?)/.exec(lower);
  let range = "";
  if (dotted) range = `${dotted[1]}.${dotted[2]}–${dotted[3]}.${dotted[4]}`;
  else if (band) range = `${band[1]}–${band[2]}`;
  else if (span) range = `${span[1]}–${span[2]}`;
  else if (already && (onePick || /band/.test(lower))) range = `${already[1]}–${already[2]}`;
  if (onePick) axis.push(range ? `one-pick ${range}` : "one-pick");
  else if (range) axis.push(range);
  if (/\bmidfield\b/.test(lower)) axis.push("midfield");
  if (/small\s*field/.test(lower)) axis.push("small field");
  if (/large\s*field/.test(lower)) axis.push("large field");
  if (/steam|fade/.test(lower) && !axis.some((a) => /steam|fade/.test(a))) axis.push("steam fade");
  const bits = [region ? LAND[region] : "", window, market, ...axis].filter(Boolean);
  if (bits.length) return bits.join(" · ");
  const fallback = cellName(...parts);
  return fallback && fallback !== EMPTY ? fallback : EMPTY;
}

/** @deprecated use cellName — kept for existing imports */
export function prettyTitle(title: string): string {
  return cellName(title);
}

/** One board: Time · Name · Side · Odds · Stake · Book · Result · P&L */
export const DESK_HEADERS = ["Time", "Name", "Side", "Odds", "Stake", "Book", "Result", "P&L"] as const;

export type DeskRow = {
  id: string;
  time: string;
  name: string;
  side: string;
  odds: string;
  stake: string;
  book: string;
  result: string;
  pnl: number | null;
  holdingId?: string;
  selected?: boolean;
  onPick?: () => void;
};

export type DeskGroup = {
  id: string;
  label?: string;
  hint?: string;
  rows: DeskRow[];
};

/** Result word on a recipe row. Sentences stay on the holding. */
export function recipeResult(recipe: Recipe): string {
  if (recipe.chip) return recipe.chip;
  if (recipe.status === "MEASURING" || recipe.badge === "Research") return "Still being tested";
  if (recipe.badge === "Parked" || (recipe.status === "KEEP" && recipe.badge !== "Solid")) return "Parked";
  if (recipe.badge === "Solid") return "On tape today";
  return EMPTY;
}

/** Recipe as a board row. Missing ticket facts stay Empty. Never freeze P&L as income. */
export function recipeDeskRow(recipe: Recipe): DeskRow {
  return {
    id: recipe.id,
    time: EMPTY,
    name: strategyMark(recipe.title, recipe.id),
    side: EMPTY,
    odds: EMPTY,
    stake: EMPTY,
    book: EMPTY,
    result: recipeResult(recipe),
    pnl: null,
    holdingId: recipe.id,
  };
}


/** Last `size` days ending at `selected`. */
export function dayWindow(days: readonly string[], selected: string, size = 8): string[] {
  const i = days.indexOf(selected);
  const end = i < 0 ? days.length : i + 1;
  const start = Math.max(0, end - size);
  return days.slice(start, end);
}

/** Window ending at `selected`. Stretch back only when the trailing days are Empty. */
export function seriesWindow(
  days: readonly string[],
  selected: string,
  valueOf: (day: string) => number | null | undefined,
  size = 8,
  max = 15,
): string[] {
  const trailing = dayWindow(days, selected, size);
  if (trailing.some((d) => valueOf(d) != null)) return trailing;
  let lastProd = -1;
  const end = days.indexOf(selected);
  const endI = end < 0 ? days.length - 1 : end;
  for (let i = endI; i >= 0; i--) {
    if (valueOf(days[i] ?? "") != null) {
      lastProd = i;
      break;
    }
  }
  if (lastProd < 0) return trailing;
  const start = Math.max(0, Math.min(lastProd - (size - 1), endI + 1 - max));
  return days.slice(start, endI + 1);
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
  return seriesWindow(
    series.map((p) => p.day),
    selected,
    (d) => series.find((p) => p.day === d)?.paper_live_day_u,
    size,
    max,
  );
}

/** Scale from the bars only. Never pad to a target. All-Empty is a dummy — do not draw it. */
export function dailyDomain(
  values: readonly (number | null | undefined)[],
): [number, number] {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!present.length) return [0, 1];
  const lo = Math.min(0, ...present);
  const hi = Math.max(0, ...present);
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

export function dailyTicks(domain: [number, number]): number[] {
  const [lo, hi] = domain;
  return [...new Set([lo, 0, hi].filter((v) => Number.isFinite(v)))].sort((a, b) => a - b);
}
