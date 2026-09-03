/** Office / Trades / Staff recipe lists — hide spray-class first books; collapse twin skins. */

import { parseHole, parseWindow } from "./boards.ts";
import { isPostEpochEholeRecipe } from "./board-reset.ts";
import { eholeRunSuffix } from "./desk.ts";
import type { Recipe } from "./stamp.ts";

const TWIN_HUNTER_SKINS = new Set(["geo", "card"]);

/** Country × window × market for ehole ids and titled recipes. */
export function recipeDisplayHoleKey(
  parts: Pick<Recipe, "id" | "title" | "region"> | { id: string; title: string; region?: string },
): string | null {
  const region = "region" in parts && parts.region ? parts.region : "";
  const hole = parseHole(`${region} ${parts.title} ${parts.id}`);
  if (hole) return `${hole.region}|${hole.window}|${hole.market}`;
  const ehole = /^H-ehole-([a-z]{2})-([a-z]+)-(win|place|lay)/i.exec(parts.id);
  if (ehole) {
    const r = ehole[1].toUpperCase();
    const window = parseWindow(ehole[2]);
    const market = ehole[3].toUpperCase();
    if (window) return `${r}|${window}|${market}`;
  }
  return null;
}

function isInPlayWindow(parts: { id: string; title: string }): boolean {
  const hole = parseHole(`${parts.title} ${parts.id}`);
  if (hole?.window === "in_play") return true;
  return /in[\s_-]*play|inplay/i.test(`${parts.id} ${parts.title}`);
}

/**
 * In-play empty-hole ehole first books — mill spray-class leftovers, not factory recipes.
 * Office / Trades chips / Staff trial lines hide these; occupancy and armed counts stay raw.
 */
export function isSprayClassInPlayEholeFirstBook(
  parts: Pick<Recipe, "id" | "title"> & { status?: Recipe["status"]; region?: string },
): boolean {
  if (!isPostEpochEholeRecipe(parts as Recipe)) return false;
  if (!isInPlayWindow(parts)) return false;
  const st = String(parts.status ?? "").toUpperCase();
  if (st && st !== "MEASURING" && st !== "HUNTING") return false;
  return true;
}

function eholeRunOrder(id: string): string {
  const run = eholeRunSuffix(id);
  if (!run) return id;
  const num = /^(\d+)/.exec(run)?.[1];
  if (num) return num.padStart(8, "0") + run.slice(num.length);
  return run;
}

/** Geo / Card twin skins in one hole → earliest run suffix only until the book holds. */
export function collapseEholeTwinSkins(recipes: readonly Recipe[]): Recipe[] {
  const groups = new Map<string, Recipe[]>();
  for (const r of recipes) {
    if (!isPostEpochEholeRecipe(r)) continue;
    const hunter = (r.hunterName ?? "").trim().toLowerCase();
    if (!TWIN_HUNTER_SKINS.has(hunter)) continue;
    const holeKey = recipeDisplayHoleKey(r);
    if (!holeKey) continue;
    const key = `${holeKey}|${hunter}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const drop = new Set<string>();
  for (const group of groups.values()) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => eholeRunOrder(a.id).localeCompare(eholeRunOrder(b.id)));
    for (const r of sorted.slice(1)) drop.add(r.id);
  }
  return recipes.filter((r) => !drop.has(r.id));
}

/** Recipes for Office still-being-tested, Trades wait chips, and Staff trial facts. */
export function millDisplayRecipes(recipes: readonly Recipe[]): Recipe[] {
  const sansSpray = recipes.filter((r) => !isSprayClassInPlayEholeFirstBook(r));
  return collapseEholeTwinSkins(sansSpray);
}

export function eholeChipRunOrder(id: string): string {
  return eholeRunOrder(id);
}
