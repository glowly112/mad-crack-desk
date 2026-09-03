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
import { settledPaperUForRecipeIds } from "./trades.ts";
import type { Fill } from "./trades.ts";
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
  productionPnl: string;
  productionPnlTone: OfficePnlTone;
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
};

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
  "paperPnl" | "paperPnlTone" | "productionPnl" | "productionPnlTone" | "laterRacePnl" | "laterRacePnlTone"
> {
  return {
    paperPnl: EMPTY,
    paperPnlTone: "empty",
    productionPnl: EMPTY,
    productionPnlTone: "empty",
    laterRacePnl: EMPTY,
    laterRacePnlTone: "empty",
  };
}

function scoreTone(v: number): OfficePnlTone {
  return v >= 0 ? "up" : "down";
}

function paperPnlCell(
  recipe: Recipe,
  input: OfficeBookInput,
): Pick<OfficeBookRow, "paperPnl" | "paperPnlTone"> {
  const trades = input.trades ?? [];
  const ids = millPaperRecipeIds(recipe, input.recipes);
  const u = settledPaperUForRecipeIds(trades, input.day, ids, input.recipes);
  if (u == null) return { paperPnl: EMPTY, paperPnlTone: "empty" };
  return { paperPnl: fmtPnlU(u), paperPnlTone: scoreTone(u) };
}

function officePnlCells(
  recipe: Recipe,
  state: OfficeBookState,
  input: OfficeBookInput,
): Pick<
  OfficeBookRow,
  "paperPnl" | "paperPnlTone" | "productionPnl" | "productionPnlTone" | "laterRacePnl" | "laterRacePnlTone"
> {
  const paper = paperPnlCell(recipe, input);
  const nKeep = input.n_keep ?? 0;
  const periods = bookPeriods(recipe);
  const freeze = Number.isFinite(recipe.freezePnl) ? recipe.freezePnl : null;
  const hasLaterRace = state === "KEEP" && periods.sameBook && periods.holdoutN != null;

  let productionPnl = EMPTY;
  let productionPnlTone: OfficePnlTone = "empty";
  if (state === "production" && nKeep > 0 && freeze != null) {
    productionPnl = fmtPnlU(freeze);
    productionPnlTone = scoreTone(freeze);
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
  return officeBookRecipes(recipes).map((recipe) => {
    const state = officeBookState(recipe)!;
    const pnl = officePnlCells(recipe, state, input);
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
