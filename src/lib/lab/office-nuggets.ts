/** Office nuggets — spice slices from settled first-book tape, grouped by hole + axes on tape. */

import {
  countryName,
  SQUARE_WINDOW_LABEL,
  type SquareWindow,
} from "./boards.ts";
import { EMPTY } from "./desk.ts";
import { recipeDisplayHoleKey } from "./mill-display.ts";
import type { OfficeBookInput, OfficeBookRow, OfficeBookState, OfficePnlTone, OfficeStrategyType } from "./office-display.ts";
import { filterOfficeRows, officeBookRows, officeCardSlice, officeCompactHoleFromKey, officePaperScale, officeWlNColumn } from "./office-display.ts";
import type { Fill } from "./trades.ts";
import {
  fmtSettledWlN,
  officeCumulativeTapeFills,
  settledTradeCountsFromFills,
} from "./trades.ts";

export type NuggetSlice = {
  oddsBand?: string;
  course?: string;
  raceType?: string;
  going?: string;
};

export type OfficeNuggetGroup = {
  id: string;
  holeKey: string;
  holeLabel: string;
  label: string;
  slice: NuggetSlice;
  fills: Fill[];
  u: number;
  counts: { wins: number; losses: number } | null;
  representativeRecipeId: string;
};

/** Plant-style odds bands for tape spice slices. */
export function nuggetOddsBand(odds: number | null | undefined): string | null {
  if (odds == null || !Number.isFinite(odds) || odds <= 0) return null;
  if (odds < 2) return "under 2";
  if (odds < 2.5) return "2.0–2.49";
  if (odds < 4.5) return "2.5–4.49";
  if (odds < 8) return "4.5–7.99";
  if (odds < 13) return "8.0–12.99";
  return "13+";
}

/** Short odds band for a narrow table column. */
export function nuggetOddsBandShort(band: string | undefined): string {
  if (!band) return EMPTY;
  const map: Record<string, string> = {
    "under 2": "<2",
    "2.0–2.49": "2–2.5",
    "2.5–4.49": "2.5–4.5",
    "4.5–7.99": "4.5–8",
    "8.0–12.99": "8–13",
    "13+": "13+",
  };
  return map[band] ?? band;
}

function holeLabelFromKey(holeKey: string): string {
  const [region, window, market] = holeKey.split("|");
  if (!region || !window || !market) return holeKey;
  const wlabel = SQUARE_WINDOW_LABEL[window as SquareWindow] ?? window;
  const mlabel = market === "WIN" ? "winner" : market === "PLACE" ? "place" : market.toLowerCase();
  return `${countryName(region)} · ${wlabel} · ${mlabel}`;
}

function sliceFromFill(fill: Fill): NuggetSlice {
  const slice: NuggetSlice = {};
  const oddsBand = nuggetOddsBand(fill.odds);
  if (oddsBand) slice.oddsBand = oddsBand;
  const spice = fill.spice;
  if (spice?.course?.trim()) slice.course = spice.course.trim();
  if (spice?.race_type?.trim()) slice.raceType = spice.race_type.trim();
  if (spice?.going?.trim()) slice.going = spice.going.trim();
  return slice;
}

/** Stable key — hole plus whichever spice axes exist on this fill. */
export function nuggetKeyFromFill(fill: Fill): string {
  const holeKey =
    recipeDisplayHoleKey({ id: fill.recipeId, title: fill.recipe, region: "" }) ?? fill.recipeId;
  const slice = sliceFromFill(fill);
  const parts = [holeKey];
  if (slice.oddsBand) parts.push(`odds:${slice.oddsBand}`);
  if (slice.course) parts.push(`course:${slice.course}`);
  if (slice.raceType) parts.push(`rt:${slice.raceType}`);
  if (slice.going) parts.push(`going:${slice.going}`);
  return parts.join("¦");
}

export function nuggetLabel(holeKey: string, slice: NuggetSlice): string {
  const hole = holeLabelFromKey(holeKey);
  const extras: string[] = [];
  if (slice.oddsBand) extras.push(slice.oddsBand);
  if (slice.course) extras.push(slice.course);
  if (slice.raceType) extras.push(slice.raceType);
  if (slice.going) extras.push(slice.going);
  return extras.length ? `${hole} · ${extras.join(" · ")}` : hole;
}

function scoreTone(v: number): OfficePnlTone {
  return v >= 0 ? "up" : "down";
}

function fmtPnlU(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}u`;
}

/** Group settled first-book tape into nugget rows — one per hole × spice slice on tape. */
export function officeNuggetGroups(input: OfficeBookInput, minN = 1): OfficeNuggetGroup[] {
  const fills = officeCumulativeTapeFills(input.trades ?? [], input.recipes);
  const buckets = new Map<string, { holeKey: string; slice: NuggetSlice; fills: Fill[] }>();

  for (const fill of fills) {
    const holeKey =
      recipeDisplayHoleKey({ id: fill.recipeId, title: fill.recipe, region: "" }) ?? fill.recipeId;
    const slice = sliceFromFill(fill);
    const key = nuggetKeyFromFill(fill);
    const bucket = buckets.get(key) ?? { holeKey, slice, fills: [] };
    bucket.fills.push(fill);
    buckets.set(key, bucket);
  }

  const groups: OfficeNuggetGroup[] = [];
  for (const [id, bucket] of buckets) {
    const counts = settledTradeCountsFromFills(bucket.fills);
    const n = counts ? counts.wins + counts.losses : 0;
    if (n < minN) continue;
    const u = bucket.fills.reduce((acc, f) => acc + (f.pnl ?? 0), 0);
    groups.push({
      id,
      holeKey: bucket.holeKey,
      holeLabel: holeLabelFromKey(bucket.holeKey),
      label: nuggetLabel(bucket.holeKey, bucket.slice),
      slice: bucket.slice,
      fills: bucket.fills,
      u,
      counts,
      representativeRecipeId: bucket.fills[0]?.recipeId ?? id,
    });
  }

  return groups.sort((a, b) => {
    const au = Math.abs(a.u);
    const bu = Math.abs(b.u);
    if (bu !== au) return bu - au;
    const an = a.counts ? a.counts.wins + a.counts.losses : 0;
    const bn = b.counts ? b.counts.wins + b.counts.losses : 0;
    if (bn !== an) return bn - an;
    return a.label.localeCompare(b.label);
  });
}

function nuggetState(_group: OfficeNuggetGroup, recipes: readonly import("./stamp.ts").Recipe[]): {
  state: OfficeBookState;
  stateLabel: string;
} {
  const recipeIds = new Set(_group.fills.map((f) => f.recipeId));
  for (const r of recipes) {
    if (!recipeIds.has(r.id)) continue;
    if (r.status === "KEEP" && r.badge === "Solid") {
      return { state: "production", stateLabel: "Doing well" };
    }
    if (r.status === "KEEP") return { state: "KEEP", stateLabel: "KEEP" };
    if (r.status === "KILL" || r.badge === "Dead") {
      return { state: "killed", stateLabel: "Killed" };
    }
  }
  return { state: "measuring", stateLabel: "Measuring" };
}

/** Nugget rows for Office — tape slices, not armed skins. */
export function officeNuggetRows(input: OfficeBookInput, minN = 1): OfficeBookRow[] {
  const groups = officeNuggetGroups(input, minN);
  return groups.map((group) => {
    const { state, stateLabel } = nuggetState(group, input.recipes);
    const counts = group.counts;
    const hasPnl = group.fills.length > 0 && counts != null;
    const scale = officePaperScale(hasPnl ? group.u : null, counts);
    const slice = group.slice;
    const course = slice.course?.trim() ?? "";
    const courseSlice =
      course.length > 12 ? `${course.slice(0, 11)}…` : course || EMPTY;
    return {
      id: group.id,
      strategyType: "nugget",
      paperU: hasPnl ? group.u : null,
      hole: officeCompactHoleFromKey(group.holeKey),
      strategy: group.label,
      side: EMPTY,
      market: EMPTY,
      oddsSlice: nuggetOddsBandShort(slice.oddsBand),
      courseSlice,
      cardSlice: officeCardSlice(slice.raceType, slice.going),
      state,
      stateLabel,
      paperPnl: hasPnl ? fmtPnlU(group.u) : EMPTY,
      paperPnlTone: hasPnl ? scoreTone(group.u) : "empty",
      paperCounts: counts ? "since first seen" : EMPTY,
      paperTodayCounts: EMPTY,
      ...scale,
      wlN: officeWlNColumn(scale.paperN, counts),
      spices: undefined,
      productionPnl: EMPTY,
      productionPnlTone: "empty",
      productionCounts: EMPTY,
      laterRacePnl: EMPTY,
      laterRacePnlTone: "empty",
      holdingId: group.representativeRecipeId,
    };
  });
}

export function filterOfficeNuggetRows(
  rows: readonly OfficeBookRow[],
  filter: import("./office-display.ts").OfficeFilter,
): OfficeBookRow[] {
  return filterOfficeRows(rows, filter);
}

/** Wide armed skins + Nuggets spice slices — one list, sorted by |paper u| then type then name. */
export function officeStrategyRows(input: OfficeBookInput): OfficeBookRow[] {
  const wide = officeBookRows(input);
  const nuggets = officeNuggetRows(input);
  const typeOrder: Record<OfficeStrategyType, number> = { wide: 0, nugget: 1 };
  return [...wide, ...nuggets].sort((a, b) => {
    const au = Math.abs(a.paperU ?? 0);
    const bu = Math.abs(b.paperU ?? 0);
    if (bu !== au) return bu - au;
    const ta = typeOrder[a.strategyType];
    const tb = typeOrder[b.strategyType];
    if (ta !== tb) return ta - tb;
    return a.hole.localeCompare(b.hole);
  });
}
