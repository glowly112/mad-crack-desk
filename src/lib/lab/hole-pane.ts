/** Floor hole pane — stamp facts for one country × window × market cell. */

import { plantInventQueue, holeName, bookPeriods, type HoleCell } from "./boards.ts";
import { EMPTY, eholeRunSuffix, strategyMark } from "./desk.ts";
import { recipeDisplayHoleKey, millDisplayRecipes, millPaperRecipeIds } from "./mill-display.ts";
import { isPostEpochEholeRecipe } from "./board-reset.ts";
import type { Recipe } from "./stamp.ts";
import type { Fill } from "./trades.ts";
import {
  fmtWinLoseCounts,
  settledTradeCountsFromFills,
  tradesSettledTapeFills,
} from "./trades.ts";
import { fmtU } from "../utils.ts";

export type HolePaneDetail = {
  holeId: string;
  name: string;
  occupied: boolean;
  statusLine: string;
  settledLine: string;
  inventLine: string;
  preferLine: string;
  distrustLine: string;
  holdoutLine: string;
  skinId: string | null;
};

function recipesForHole(holeId: string, recipes: readonly Recipe[]): Recipe[] {
  const display = millDisplayRecipes(recipes);
  return display.filter((r) => recipeDisplayHoleKey(r) === holeId);
}

function skinRecipe(holeId: string, recipes: readonly Recipe[]): Recipe | null {
  const matches = recipesForHole(holeId, recipes);
  if (!matches.length) return null;
  const ehole = matches.find((r) => isPostEpochEholeRecipe(r));
  return ehole ?? matches[0];
}

function fillsForSkin(
  holeId: string,
  skin: Recipe | null,
  recipes: readonly Recipe[],
  trades: readonly Fill[],
  day: string,
): Fill[] {
  if (!skin) return [];
  const ids = millPaperRecipeIds(skin, recipes);
  const settled = tradesSettledTapeFills(
    trades.filter((f) => f.day === day),
    recipes,
  );
  return settled.filter((f) => ids.has(f.recipeId.split("|")[0] ?? f.recipeId));
}

function inventLineForHole(
  holeId: string,
  inventWhy: string,
  seatNow: string,
  hunters: readonly { note: string }[],
): string {
  const queue = plantInventQueue(seatNow, inventWhy, hunters);
  const named = holeName(holeId.replace(/\|/g, " "));
  if (queue !== EMPTY && (queue === named || holeName(holeId) === queue)) {
    return "Invent queued";
  }
  if (queue !== EMPTY && named !== EMPTY && queue.includes(named.split(" · ")[0] ?? "")) {
    return "Invent queued";
  }
  return EMPTY;
}

function preferLine(recipe: Recipe | null): string {
  const hunter = recipe?.hunterName?.trim();
  if (hunter) return `Prefer ${hunter}`;
  return EMPTY;
}

function distrustLine(recipe: Recipe | null, rejects: readonly string[]): string {
  if (!recipe) return EMPTY;
  const blob = `${recipe.why} ${recipe.id} ${rejects.join(" ")}`.toLowerCase();
  if (/distrust|reject|gate sent|too broad|holdout_n_too_small/.test(blob)) {
    if (/holdout_n_too_small/.test(blob)) return "Distrust holdout n";
    if (/too broad/.test(blob)) return "Distrust too broad";
    return "Distrust gate";
  }
  return EMPTY;
}

function holdoutLine(recipe: Recipe | null): string {
  if (!recipe) return EMPTY;
  const periods = bookPeriods(recipe);
  if (periods.holdoutN == null || periods.holdoutNeed == null) return EMPTY;
  return `Holdout ${periods.holdoutN}/${periods.holdoutNeed}`;
}

function statusFromCell(cell: HoleCell | undefined): string {
  if (!cell) return EMPTY;
  const back = cell.backTone ?? (cell.tone !== "empty" ? cell.tone : "empty");
  const lay = cell.layTone ?? "empty";
  if (back === "empty" && lay === "empty") return EMPTY;
  const labels: string[] = [];
  if (back !== "empty") labels.push(`BACK ${toneWord(back)}`);
  if (lay !== "empty") labels.push(`LAY ${toneWord(lay)}`);
  return labels.join(" · ");
}

function toneWord(tone: string): string {
  if (tone === "hunt") return "looking";
  if (tone === "idea") return "measuring";
  if (tone === "win") return "solid";
  if (tone === "loss") return "killed";
  if (tone === "parked") return "parked";
  return tone;
}

/** Short mark on the board for an occupied cell — W–L · u or status. */
export function holeCellMark(
  holeId: string,
  cell: HoleCell | undefined,
  ctx: HolePaneContext,
): string {
  const skin = skinRecipe(holeId, ctx.recipes);
  const fills = fillsForSkin(holeId, skin, ctx.recipes, ctx.trades, ctx.day);
  const counts = settledTradeCountsFromFills(fills);
  if (counts) {
    const u = fills.reduce((acc, f) => acc + (f.pnl ?? 0), 0);
    return `${counts.wins}–${counts.losses} · ${fmtU(u)}`;
  }
  const status = statusFromCell(cell);
  if (status) return status.split(" · ")[0] ?? status;
  const invent = inventLineForHole(holeId, ctx.inventWhy, ctx.seatNow ?? "", ctx.hunters);
  if (invent !== EMPTY) return invent;
  return EMPTY;
}

export type HolePaneContext = {
  day: string;
  recipes: readonly Recipe[];
  trades: readonly Fill[];
  inventWhy: string;
  seatNow?: string;
  hunters: readonly { note: string }[];
  rejects?: readonly string[];
};

export function holePaneDetail(
  holeId: string,
  cell: HoleCell | undefined,
  ctx: HolePaneContext,
): HolePaneDetail {
  const name = holeName(holeId.replace(/\|/g, " "));
  const skin = skinRecipe(holeId, ctx.recipes);
  const fills = fillsForSkin(holeId, skin, ctx.recipes, ctx.trades, ctx.day);
  const counts = settledTradeCountsFromFills(fills);
  const u = fills.length ? fills.reduce((acc, f) => acc + (f.pnl ?? 0), 0) : null;
  const occupied = Boolean(cell && (cell.backTone !== "empty" || cell.layTone !== "empty" || cell.tone !== "empty"));
  const statusLine = statusFromCell(cell);
  let settledLine = EMPTY;
  if (counts && u != null) {
    settledLine = `${counts.wins}W–${counts.losses}L · ${fmtU(u)}`;
  } else if (counts) {
    settledLine = fmtWinLoseCounts(counts).replace(/ win/g, "W").replace(/ lose/g, "L");
  }

  const skinId =
    skin && /^H-ehole-/i.test(skin.id)
      ? eholeRunSuffix(skin.id) ?? skin.id.replace(/^H-ehole-/, "")
      : skin?.id ?? null;

  return {
    holeId,
    name: name !== EMPTY ? name : strategyMark(holeId),
    occupied,
    statusLine: statusLine || (occupied ? "Occupied" : EMPTY),
    settledLine,
    inventLine: inventLineForHole(holeId, ctx.inventWhy, ctx.seatNow ?? "", ctx.hunters),
    preferLine: preferLine(skin),
    distrustLine: distrustLine(skin, ctx.rejects ?? []),
    holdoutLine: holdoutLine(skin),
    skinId,
  };
}
