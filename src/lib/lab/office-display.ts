/** Office books — strategies, KEEP, production score. Never duplicates Floor, Trades, or Staff. */

import {
  countryName,
  isSplitBook,
  squareHoleKeyAndSide,
  SQUARE_WINDOW_LABEL,
  type SquareWindow,
} from "./boards.ts";
import { EMPTY, deskMarketFromParts, deskStampedSide, recipeBookName } from "./desk.ts";
import {
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
} from "./mill-display.ts";
import type { Recipe } from "./stamp.ts";

export type OfficeBookState = "measuring" | "KEEP" | "production" | "killed";

export type OfficeBookRow = {
  id: string;
  hole: string;
  strategy: string;
  side: string;
  market: string;
  state: OfficeBookState;
  pnl: string;
  pnlTone: "empty" | "neutral" | "up" | "down";
  holdingId: string;
};

export type OfficeBookCounts = {
  strategies: number;
  keep: number;
  production: number;
  live: string;
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

function isLeftoverKeep(recipe: Recipe): boolean {
  if (recipe.status !== "KEEP" || recipe.badge === "Solid") return false;
  return /^H-hyde-/i.test(recipe.id) || isSplitBook(recipe);
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

function officePnlCell(recipe: Recipe, state: OfficeBookState): { pnl: string; pnlTone: OfficeBookRow["pnlTone"] } {
  if (state === "measuring") return { pnl: EMPTY, pnlTone: "empty" };
  if (!Number.isFinite(recipe.freezePnl)) return { pnl: EMPTY, pnlTone: "empty" };
  const text = fmtPnlU(recipe.freezePnl);
  if (isLeftoverKeep(recipe)) return { pnl: text, pnlTone: "neutral" };
  if (state === "KEEP") return { pnl: text, pnlTone: "neutral" };
  if (state === "production") {
    return { pnl: text, pnlTone: recipe.freezePnl >= 0 ? "up" : "down" };
  }
  if (state === "killed") return { pnl: text, pnlTone: "down" };
  return { pnl: EMPTY, pnlTone: "empty" };
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

export function officeBookRows(recipes: readonly Recipe[]): OfficeBookRow[] {
  return officeBookRecipes(recipes).map((recipe) => {
    const state = officeBookState(recipe)!;
    const { pnl, pnlTone } = officePnlCell(recipe, state);
    return {
      id: recipe.id,
      hole: officeHoleLabel(recipe),
      strategy: recipeBookName(recipe),
      side: officeSide(recipe),
      market: officeMarket(recipe),
      state,
      pnl,
      pnlTone,
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
