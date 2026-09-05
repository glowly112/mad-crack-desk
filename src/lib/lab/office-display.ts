/** Office books — strategies, KEEP, production score. Never duplicates Floor, Trades, or Staff. */

import {
  bookPeriods,
  countryName,
  squareHoleKeyAndSide,
  SQUARE_WINDOW_LABEL,
  type SquareWindow,
} from "./boards.ts";
import { EMPTY, deskMarketFromParts, deskStampedSide, recipeBookName } from "./desk.ts";
import {
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
  millPaperRecipeIds,
} from "./mill-display.ts";
import type { Fill, SettledTradeCounts } from "./trades.ts";
import {
  fmtSettledWlN,
  officeCumulativeTapeFills,
  tradesSettledTapeFills,
  fillsOnDay,
  settledTradeCountsFromFills,
} from "./trades.ts";
import type { Recipe } from "./stamp.ts";

export type OfficeBookState = "measuring" | "KEEP" | "production" | "killed";

export type OfficePnlTone = "empty" | "neutral" | "up" | "down";

export type OfficeBookRow = {
  id: string;
  hole: string;
  strategy: string;
  side: string;
  market: string;
  state: OfficeBookState;
  paperPnl: string;
  paperPnlTone: OfficePnlTone;
  paperCounts: string;
  paperTodayCounts: string;
  productionPnl: string;
  productionPnlTone: OfficePnlTone;
  productionCounts: string;
  laterRacePnl: string;
  laterRacePnlTone: OfficePnlTone;
  holdingId: string;
};

export type OfficeBookCounts = {
  strategies: number;
  keep: number;
  production: number;
  live: string;
};

export type OfficeBookInput = {
  recipes: readonly Recipe[];
  day: string;
  trades?: readonly Fill[];
  n_keep?: number;
  paperTotals?: ReadonlyMap<string, number>;
  paperCounts?: ReadonlyMap<string, SettledTradeCounts | null>;
  paperTodayCounts?: ReadonlyMap<string, SettledTradeCounts | null>;
  productionCounts?: ReadonlyMap<string, SettledTradeCounts | null>;
};

/** Recipe id → Office row id for paper/production roll-up (twin skins). */
function officeRowByRecipeId(recipes: readonly Recipe[]): Map<string, string> {
  const rows = officeBookRecipes(recipes);
  const out = new Map<string, string>();
  for (const row of rows) {
    for (const id of millPaperRecipeIds(row, recipes)) out.set(id, row.id);
  }
  return out;
}

function officeBookState(recipe: Recipe): OfficeBookState | null {
  if (recipe.status === "KILL" || recipe.badge === "Dead") return "killed";
  if (recipe.badge === "Solid") return "production";
  if (recipe.status === "KEEP") return "KEEP";
  if (recipe.status === "MEASURING" || recipe.status === "HUNTING" || recipe.badge === "Research") {
    return "measuring";
  }
  return null;
}

function officeHoleLabel(recipe: Recipe): string {
  const parsed = squareHoleKeyAndSide(recipe.id, recipe.title, recipe.region);
  if (!parsed) return EMPTY;
  const [region, window] = parsed.id.split("|");
  const wlabel = SQUARE_WINDOW_LABEL[window as SquareWindow] ?? window;
  return `${countryName(region)} · ${wlabel} · ${parsed.market}`;
}

function officeSide(recipe: Recipe): string {
  const stamped = deskStampedSide(recipe.id, recipe.title);
  if (stamped !== EMPTY) return stamped;
  const parsed = squareHoleKeyAndSide(recipe.id, recipe.title, recipe.region);
  return parsed?.side ?? EMPTY;
}

function officeMarket(recipe: Recipe): string {
  const m = deskMarketFromParts(recipe.id, recipe.title, recipe.region);
  return m !== EMPTY ? m : EMPTY;
}

function fmtPnlU(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}u`;
}

function emptyPnl(): Pick<
  OfficeBookRow,
  | "paperPnl"
  | "paperPnlTone"
  | "paperCounts"
  | "paperTodayCounts"
  | "productionPnl"
  | "productionPnlTone"
  | "productionCounts"
  | "laterRacePnl"
  | "laterRacePnlTone"
> {
  return {
    paperPnl: EMPTY,
    paperPnlTone: "empty",
    paperCounts: EMPTY,
    paperTodayCounts: EMPTY,
    productionPnl: EMPTY,
    productionPnlTone: "empty",
    productionCounts: EMPTY,
    laterRacePnl: EMPTY,
    laterRacePnlTone: "empty",
  };
}

function scoreTone(v: number): OfficePnlTone {
  return v >= 0 ? "up" : "down";
}

function paperPnlCell(
  recipe: Recipe,
  totals: ReadonlyMap<string, number>,
  counts: ReadonlyMap<string, SettledTradeCounts | null>,
  todayCounts: ReadonlyMap<string, SettledTradeCounts | null>,
): Pick<OfficeBookRow, "paperPnl" | "paperPnlTone" | "paperCounts" | "paperTodayCounts"> {
  const u = totals.get(recipe.id);
  if (u == null) {
    return {
      paperPnl: EMPTY,
      paperPnlTone: "empty",
      paperCounts: EMPTY,
      paperTodayCounts: EMPTY,
    };
  }
  const cumulative = counts.get(recipe.id) ?? null;
  const today = todayCounts.get(recipe.id) ?? null;
  const todayLine = today ? `today ${fmtSettledWlN(today)}` : EMPTY;
  return {
    paperPnl: fmtPnlU(u),
    paperPnlTone: scoreTone(u),
    paperCounts: cumulative ? `${fmtSettledWlN(cumulative)} · since armed` : EMPTY,
    paperTodayCounts: todayLine,
  };
}

function rollFillsToOfficeRows(
  fills: readonly Fill[],
  rowByRecipe: ReadonlyMap<string, string>,
): { totals: Map<string, number>; counts: Map<string, SettledTradeCounts | null> } {
  const totals = new Map<string, number>();
  const buckets = new Map<string, Fill[]>();
  const seen = new Set<string>();
  for (const fill of fills) {
    if (seen.has(fill.id)) continue;
    const rowId = rowByRecipe.get(fill.recipeId);
    if (!rowId) continue;
    seen.add(fill.id);
    totals.set(rowId, (totals.get(rowId) ?? 0) + (fill.pnl ?? 0));
    const list = buckets.get(rowId) ?? [];
    list.push(fill);
    buckets.set(rowId, list);
  }
  const counts = new Map<string, SettledTradeCounts | null>();
  for (const [rowId, list] of buckets) counts.set(rowId, settledTradeCountsFromFills(list));
  return { totals, counts };
}

/** Every signed Trades › Settled row that rolls onto an Office book — cumulative since armed. */
function officePaperRollupFills(input: OfficeBookInput): Fill[] {
  return officeCumulativeTapeFills(input.trades ?? [], input.recipes);
}

/** Today's settled first-book rows — optional muted secondary line on Office. */
function officePaperTodayRollupFills(input: OfficeBookInput): Fill[] {
  return tradesSettledTapeFills(fillsOnDay(input.trades ?? [], input.day), input.recipes);
}

/** One fill → one Office row; twins roll to the displayed skin. */
export function officePaperTotals(input: OfficeBookInput): Map<string, number> {
  const rowByRecipe = officeRowByRecipeId(input.recipes);
  return rollFillsToOfficeRows(officePaperRollupFills(input), rowByRecipe).totals;
}

/** One fill → one Office row; twins roll to the displayed skin. */
export function officePaperCounts(input: OfficeBookInput): Map<string, SettledTradeCounts | null> {
  const rowByRecipe = officeRowByRecipeId(input.recipes);
  return rollFillsToOfficeRows(officePaperRollupFills(input), rowByRecipe).counts;
}

/** Today's W–L · n per Office row — muted secondary line only. */
export function officePaperTodayCounts(input: OfficeBookInput): Map<string, SettledTradeCounts | null> {
  const rowByRecipe = officeRowByRecipeId(input.recipes);
  return rollFillsToOfficeRows(officePaperTodayRollupFills(input), rowByRecipe).counts;
}

function officeProductionCounts(input: OfficeBookInput): Map<string, SettledTradeCounts | null> {
  const fills = tradesSettledTapeFills(fillsOnDay(input.trades ?? [], input.day), input.recipes).filter(
    (f) => f.book === "production",
  );
  return rollFillsToOfficeRows(fills, officeRowByRecipeId(input.recipes)).counts;
}

function officePnlCells(
  recipe: Recipe,
  state: OfficeBookState,
  input: OfficeBookInput,
): Pick<
  OfficeBookRow,
  | "paperPnl"
  | "paperPnlTone"
  | "paperCounts"
  | "paperTodayCounts"
  | "productionPnl"
  | "productionPnlTone"
  | "productionCounts"
  | "laterRacePnl"
  | "laterRacePnlTone"
> {
  const paperTotals = input.paperTotals ?? officePaperTotals(input);
  const paperCountMap = input.paperCounts ?? officePaperCounts(input);
  const todayCountMap = input.paperTodayCounts ?? officePaperTodayCounts(input);
  const productionCountMap = input.productionCounts ?? officeProductionCounts(input);
  const paper = paperPnlCell(recipe, paperTotals, paperCountMap, todayCountMap);
  const prodCountRaw = productionCountMap.get(recipe.id) ?? null;
  const nKeep = input.n_keep ?? 0;
  const periods = bookPeriods(recipe);
  const freeze = Number.isFinite(recipe.freezePnl) ? recipe.freezePnl : null;
  const hasLaterRace = state === "KEEP" && periods.sameBook && periods.holdoutN != null;

  let productionPnl = EMPTY;
  let productionPnlTone: OfficePnlTone = "empty";
  let productionCounts = EMPTY;
  if (state === "production" && nKeep > 0 && freeze != null) {
    productionPnl = fmtPnlU(freeze);
    productionPnlTone = scoreTone(freeze);
  }
  if (prodCountRaw != null && nKeep > 0) {
    productionCounts = fmtSettledWlN(prodCountRaw);
  }

  let laterRacePnl = EMPTY;
  let laterRacePnlTone: OfficePnlTone = "empty";
  if (hasLaterRace && freeze != null) {
    laterRacePnl = fmtPnlU(freeze);
    laterRacePnlTone = "neutral";
  }

  return {
    ...paper,
    productionPnl,
    productionPnlTone,
    productionCounts,
    laterRacePnl,
    laterRacePnlTone,
  };
}

/** Recipes that belong on Office — one row per first-book skin, not every ticket. */
export function officeBookRecipes(recipes: readonly Recipe[]): Recipe[] {
  const measuringDisplay = millDisplayRecipes(
    recipes.filter((r) => r.status === "MEASURING" || r.status === "HUNTING"),
  );
  const measuringIds = new Set(measuringDisplay.map((r) => r.id));
  const out: Recipe[] = [];
  const seen = new Set<string>();

  for (const r of recipes) {
    const state = officeBookState(r);
    if (!state) continue;
    if (state === "measuring") {
      if (isSprayClassInPlayEholeFirstBook(r)) continue;
      if (!measuringIds.has(r.id)) continue;
    }
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }

  return out.sort((a, b) => {
    const ah = officeHoleLabel(a);
    const bh = officeHoleLabel(b);
    if (ah !== bh) return ah.localeCompare(bh);
    const order: Record<OfficeBookState, number> = { production: 0, KEEP: 1, measuring: 2, killed: 3 };
    const sa = officeBookState(a)!;
    const sb = officeBookState(b)!;
    return order[sa] - order[sb];
  });
}

export function officeBookRows(input: OfficeBookInput): OfficeBookRow[] {
  const recipes = input.recipes;
  const rowByRecipe = officeRowByRecipeId(recipes);
  const dayFills = fillsOnDay(input.trades ?? [], input.day);
  const paperRollup = rollFillsToOfficeRows(officePaperRollupFills(input), rowByRecipe);
  const paperTotals = input.paperTotals ?? paperRollup.totals;
  const paperCounts = input.paperCounts ?? paperRollup.counts;
  const todayCounts = officePaperTodayCounts(input);
  const productionCounts =
    input.productionCounts ??
    rollFillsToOfficeRows(
      tradesSettledTapeFills(dayFills, recipes).filter((f) => f.book === "production"),
      rowByRecipe,
    ).counts;
  const withRollups: OfficeBookInput = {
    ...input,
    paperTotals,
    paperCounts,
    paperTodayCounts: todayCounts,
    productionCounts,
  };
  return officeBookRecipes(recipes).map((recipe) => {
    const state = officeBookState(recipe)!;
    const pnl = officePnlCells(recipe, state, withRollups);
    return {
      id: recipe.id,
      hole: officeHoleLabel(recipe),
      strategy: recipeBookName(recipe),
      side: officeSide(recipe),
      market: officeMarket(recipe),
      state,
      ...pnl,
      holdingId: recipe.id,
    };
  });
}

export function officeProductionHeroValue(keep: number, production: number): string {
  return keep === 0 ? EMPTY : String(production);
}

export function officeBookCounts(
  rows: readonly OfficeBookRow[],
  fuse_on: boolean,
  live_n?: number,
): OfficeBookCounts {
  return {
    strategies: rows.filter((r) => r.state === "measuring").length,
    keep: rows.filter((r) => r.state === "KEEP").length,
    production: rows.filter((r) => r.state === "production").length,
    live: fuse_on ? String(live_n ?? 0) : EMPTY,
  };
}
