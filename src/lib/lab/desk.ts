/** Display grouping for the desk. Never sums cells or invents a score. */

import type { Move, Recipe, TrendPoint } from "./stamp.ts";
import { BOARD_RESET_DAY } from "./board-reset.ts";
import { deskSettledTapeRollup } from "./trades.ts";

export const EMPTY = "Empty";
/** Open or armed but not finished — not the same as unused. */
export const WAITING = "Waiting";
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

/** Clerk slang → one English line on Floor. Fuse stays off. */
export function floorNextLine(stamp: {
  fuse_on: boolean;
  topBlocker?: NextAction | null;
}): string | null {
  if (stamp.fuse_on) return null;
  const b = stamp.topBlocker;
  if (!b) return null;
  const blob = `${b.id} ${b.title} ${b.action}`.toLowerCase();
  if (/keep-hold|keep on hold|fuse off|live_candidate/.test(blob)) {
    return "Today's certified pick cannot go live yet. The fuse stays off.";
  }
  return null;
}

/** @deprecated use floorNextLine */
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

export type FloorFactId = "paper" | "production" | "live";

export type FloorFact = {
  id: FloorFactId;
  label: string;
  hint: string;
  value: number | null;
  kind: "u" | "count";
  /** Win · lose line from settled first-book tape (paper tile only). */
  countsLine?: string | null;
};

export type FloorStamp = {
  day: string;
  n_solid: number;
  fuse_on: boolean;
  hero: { day_u: number | null };
  recipes: readonly Recipe[];
  trades?: readonly import("./trades.ts").Fill[];
  wait_open?: readonly { id: string }[];
  trends: readonly TrendPoint[];
  researchKeepGbp: number;
  moves: readonly Move[];
};

/** Solids on today's tape. Parked wait_open is not the tape. Zero is Empty. */
export function floorTapeWaiting(stamp: {
  recipes: readonly Recipe[];
  n_solid: number;
}): number {
  return solidRows(stamp.recipes, stamp.n_solid).filter(
    (r) => r.chip === "Waiting for races" || r.chip === "On tape today" || r.chip === "Booking",
  ).length;
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
  if (id === "production") return point.factory_day_pnl_u;
  return null;
}

/** Paper u for one day — post-reset from tape roll-up only, never hero or mill stamp. */
export function floorPaperForDay(
  stamp: Pick<FloorStamp, "trades" | "recipes" | "trends">,
  day: string,
): number | null {
  if (day >= BOARD_RESET_DAY) {
    return deskSettledTapeRollup(stamp.trades ?? [], day, stamp.recipes).u;
  }
  const trend = stamp.trends.find((t) => t.day === day);
  return trend?.paper_live_day_u ?? null;
}

export function floorFactDayValue(
  stamp: FloorStamp,
  fact: FloorFactId,
  day: string,
): number | null {
  if (fact === "paper") return floorPaperForDay(stamp, day);
  const point = stamp.trends.find((t) => t.day === day);
  return floorDayValue(fact, point);
}

/** Production score on Trends — only when later-race KEEP proved a Solid. Measuring paper ≠ production. */
export function trendProductionScore(point: TrendPoint): number | null {
  if (point.n_solid <= 0) return null;
  return point.paper_live_day_u;
}

/** Post-reset trend rows — paper from tape roll-up; mill factory_day_pnl never paints Floor. */
export function scrubPostResetTrendPaper(
  trends: readonly TrendPoint[],
  trades: readonly import("./trades.ts").Fill[],
  recipes: readonly Recipe[],
): TrendPoint[] {
  return trends.map((t) => {
    if (t.day < BOARD_RESET_DAY) {
      return { ...t, paper_live_day_u: trendProductionScore(t) };
    }
    const rollup = deskSettledTapeRollup(trades, t.day, recipes).u;
    const scored = { ...t, paper_live_day_u: rollup, factory_day_pnl_u: null as number | null };
    return { ...scored, paper_live_day_u: trendProductionScore(scored) };
  });
}

/** Keep every post-reset day on the chart when the tape has settled rows (cheap roll-up per day). */
export function ensurePostResetTrendDays(
  trends: readonly TrendPoint[],
  trades: readonly import("./trades.ts").Fill[],
  recipes: readonly Recipe[],
  deskDay: string,
): TrendPoint[] {
  const byDay = new Map(trends.map((t) => [t.day, t]));
  const days = new Set<string>([deskDay]);
  for (const f of trades) {
    if (f.day >= BOARD_RESET_DAY) days.add(f.day);
  }
  for (const d of days) {
    if (!byDay.has(d)) {
      byDay.set(d, {
        day: d,
        paper_live_day_u: null,
        factory_day_pnl_u: null,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
      });
    }
  }
  const merged = [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  return scrubPostResetTrendPaper(merged, trades, recipes);
}

/** Independent Floor facts. No aim, mill, or quota language. */
export function floorFacts(
  stamp: FloorStamp,
  scope: { day: string; lookingBack: boolean },
): FloorFact[] {
  const trend = stamp.trends.find((t) => t.day === scope.day);
  const rollup =
    scope.day >= BOARD_RESET_DAY
      ? deskSettledTapeRollup(stamp.trades ?? [], scope.day, stamp.recipes)
      : null;
  const tapePaper = rollup?.u ?? null;
  const paperCountsLine =
    rollup?.counts != null ? rollup.countsLine : null;
  const dayHint = axisDay(scope.day);
  const nKeep = trend?.n_keep ?? 0;

  let paper: number | null;
  let paperHint: string;
  if (scope.lookingBack) {
    paper = floorPaperForDay(stamp, scope.day);
    paperHint = paper != null ? `${dayHint} · paper` : dayHint;
  } else if (tapePaper != null) {
    paper = tapePaper;
    paperHint = `${dayHint} · paper settles · not KEEP`;
  } else {
    paper = null;
    paperHint = `${dayHint} · paper`;
  }

  const production = null;
  const productionHint =
    nKeep <= 0 ? "KEEP 0 · no later-race score" : `${dayHint} · later-race KEEP`;

  return [
    {
      id: "paper",
      label: "Paper",
      hint: paperHint,
      value: paper,
      kind: "u",
      countsLine: paperCountsLine,
    },
    { id: "production", label: "Production", hint: productionHint, value: production, kind: "u" },
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
  const order = ["invent", "holdout", "night"];
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

/** Run tag on post-epoch ehole ids — not a horse, not invented. */
export function eholeRunSuffix(id: string): string | null {
  const m = /^H-ehole-[a-z]{2}-[a-z]+-(?:win|place|lay)-([A-Za-z0-9]+)$/i.exec(id.trim());
  return m?.[1] ?? null;
}

/** Hole title only: country · window · place|winner — no recipe bits. */
export function isHoleOnlyMark(mark: string): boolean {
  if (!mark || mark === EMPTY) return false;
  const segs = mark.split(" · ");
  if (segs.length !== 3) return false;
  const m = segs[2].toLowerCase();
  return m === "place" || m === "winner" || m === "lay";
}

export type BookNameParts = {
  title?: string;
  id?: string;
  horse?: string | null;
  odds?: number | null;
  side?: string | null;
  hunterName?: string | null;
  /** Open ticket waiting for result — append odds + side when no horse. */
  openTicket?: boolean;
};

/** Book / trade / tape name: recipe bits + horse, else hunter + run + odds + side. Never hole alone. */
export function bookDisplayName(parts: BookNameParts): string {
  const mark = strategyMark(parts.title ?? "", parts.id ?? "");
  if (parts.horse && parts.horse !== EMPTY) return `${mark} · ${parts.horse}`;

  const tail: string[] = [];
  const hunter = parts.hunterName?.trim();
  if (hunter && !mark.toLowerCase().includes(hunter.toLowerCase())) tail.push(hunter);

  const id = parts.id ?? "";
  if (/^H-ehole-/i.test(id)) {
    const run = eholeRunSuffix(id);
    if (run && !mark.includes(run)) tail.push(run);
  } else if (isHoleOnlyMark(mark) && id && !mark.includes(id)) {
    const short = /H-[A-Za-z0-9-]+/.exec(id)?.[0];
    if (short && short !== id) {
      const run = eholeRunSuffix(short) ?? short.replace(/^H-/, "");
      if (run && !mark.includes(run)) tail.push(run);
    }
  }

  const ticket: string[] = [];
  if (parts.openTicket) {
    if (parts.odds != null && Number.isFinite(parts.odds)) {
      ticket.push(Number.isInteger(parts.odds) ? String(parts.odds) : String(parts.odds));
    }
    if (parts.side && parts.side !== EMPTY) ticket.push(parts.side);
  }

  const bits: string[] = [];
  if (tail.length) bits.push(tail.join(" · "));
  if (ticket.length) bits.push(ticket.join(" "));
  if (bits.length) return `${mark} · ${bits.join(" · ")}`;
  return mark;
}

export function recipeBookName(recipe: Pick<Recipe, "id" | "title" | "hunterName">): string {
  return bookDisplayName({
    title: recipe.title,
    id: recipe.id,
    hunterName: recipe.hunterName,
  });
}

/** @deprecated use cellName — kept for existing imports */
export function prettyTitle(title: string): string {
  return cellName(title);
}

/** One board: Time · Name · Market · Side · Odds · Stake · Book · Result · P&L */
export const DESK_HEADERS = [
  "Time",
  "Name",
  "Market",
  "Side",
  "Odds",
  "Stake",
  "Book",
  "Result",
  "P&L",
] as const;

export type DeskRow = {
  id: string;
  time: string;
  name: string;
  /** H-ehole skin id — secondary under strategy on Trades tape. */
  nameSub?: string;
  market: string;
  side: string;
  odds: string;
  stake: string;
  book: string;
  result: string;
  pnl: number | null;
  /** Muted ehole run tag beside strategy name on Trades. */
  nameTag?: string | null;
  /** Plant book course — under name on Trades when stamped. */
  course?: string | null;
  /** Muted plant book context (going, field size, etc.). */
  spiceLine?: string | null;
  holdingId?: string;
  selected?: boolean;
  onPick?: () => void;
};

/** Desk Market column — WIN or PLACE only. LAY lives in Side. */
export function deskMarketFromParts(...parts: string[]): string {
  const id = parts[0] ?? "";
  const blob = parts.join(" ");
  const ehole = /^H-ehole-[a-z]{2}-[a-z]+-(win|place|lay)/i.exec(id.trim());
  if (ehole) {
    const seg = (ehole[1] ?? "").toLowerCase();
    if (seg === "place") return "PLACE";
    return "WIN";
  }
  const upper = blob.toUpperCase().replace(/_/g, " ");
  if (/\bPLACE\b/.test(upper)) return "PLACE";
  if (/\bWIN\b/.test(upper)) return "WIN";
  return EMPTY;
}

/** Stamped side on a recipe row — BACK/LAY from id, not market type. */
export function deskStampedSide(...parts: string[]): string {
  const id = parts[0] ?? "";
  const ehole = /^H-ehole-[a-z]{2}-[a-z]+-(win|place|lay)/i.exec(id.trim());
  if (ehole?.[1]?.toLowerCase() === "lay") return "LAY";
  const blob = parts.join(" ").toUpperCase().replace(/_/g, " ");
  if (/(?:^|[^A-Z])LAY(?:[^A-Z]|$)/.test(blob) && /-lay-/i.test(id)) return "LAY";
  if (/\bBACK\b/.test(blob) && /\bBACK\b/.test(id)) return "BACK";
  return EMPTY;
}

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

/** Recipe as a board row. Open-but-not-finished uses Waiting; unused stays Empty. */
export function recipeDeskRow(recipe: Recipe): DeskRow {
  const open =
    recipe.chip === "Waiting for races" ||
    recipe.status === "MEASURING" ||
    recipe.badge === "Research";
  const market = deskMarketFromParts(recipe.id, recipe.title, recipe.region);
  const stamped = deskStampedSide(recipe.id, recipe.title);
  return {
    id: recipe.id,
    time: open ? WAITING : EMPTY,
    name: recipeBookName(recipe),
    market: market !== EMPTY ? market : open ? WAITING : EMPTY,
    side: stamped !== EMPTY ? stamped : EMPTY,
    odds: open ? WAITING : EMPTY,
    stake: open ? WAITING : EMPTY,
    book: open ? "paper" : EMPTY,
    result: recipeResult(recipe),
    pnl: null,
    holdingId: recipe.id,
  };
}


/** Last `size` days ending at `selected`. Oracle today may run ahead of the trends tail. */
export function dayWindow(days: readonly string[], selected: string, size = 8): string[] {
  const i = days.indexOf(selected);
  if (i >= 0) {
    const start = Math.max(0, i + 1 - size);
    return days.slice(start, i + 1);
  }
  if (!days.length) return selected ? [selected] : [];
  const last = days[days.length - 1]!;
  if (selected > last) {
    const tail = days.slice(Math.max(0, days.length - (size - 1)));
    return [...tail, selected];
  }
  const end = days.length;
  return days.slice(Math.max(0, end - size), end);
}

/** Window ending at `selected`. Stretch back only when trailing has production — else anchor on selected. */
export function seriesWindow(
  days: readonly string[],
  selected: string,
  valueOf: (day: string) => number | null | undefined,
  size = 8,
  max = 15,
): string[] {
  const trailing = dayWindow(days, selected, size);
  if (trailing.some((d) => valueOf(d) != null)) {
    return ensureWindowEndsOn(selected, trailing, size);
  }
  const lastDay = days[days.length - 1];
  if (lastDay && selected > lastDay) return ensureWindowEndsOn(selected, trailing, size);
  let lastProd = -1;
  const end = days.indexOf(selected);
  const endI = end < 0 ? days.length - 1 : end;
  for (let i = endI; i >= 0; i--) {
    if (valueOf(days[i] ?? "") != null) {
      lastProd = i;
      break;
    }
  }
  if (lastProd < 0) return ensureWindowEndsOn(selected, trailing, size);
  const start = Math.max(0, Math.min(lastProd - (size - 1), endI + 1 - max));
  return ensureWindowEndsOn(selected, days.slice(start, endI + 1), size);
}

/** Rightmost chart slot is always the oracle / selected day. */
export function ensureWindowEndsOn(selected: string, win: readonly string[], size = 8): string[] {
  if (!selected) return [...win];
  const base = win.includes(selected) ? [...win] : [...win, selected].sort();
  const anchored =
    base.at(-1) === selected ? base : [...base.filter((d) => d !== selected), selected];
  return anchored.slice(-size);
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
