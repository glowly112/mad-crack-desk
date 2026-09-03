/** Junk on the tape vs occupancy on the square — mill voids leftovers; never fake-empty the board. */

import { parseHole, parseWindow, squareHoleKeyAndSide } from "./boards.ts";
import {
  isPostEpochEholeRecipe,
} from "./board-reset.ts";
import { eholeRunSuffix } from "./desk.ts";
import {
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
  recipeDisplayHoleKey,
} from "./mill-display.ts";
import type { Recipe } from "./stamp.ts";
import type { Fill } from "./trades.ts";

const TWIN_HUNTER_SKINS = new Set(["geo", "card"]);

/** Unbounded mill dumps — France 7-horse in-play packs, 5–8 runner sprays. */
const FIELD_SPRAY_MIN_RUNNERS = 5;

/** Clock second for grouping fills booked in the same spray tick. */
export function fillTickSecond(fill: Fill): string {
  const t = fill.t?.trim() ?? "";
  const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (hm) {
    const hh = hm[1].padStart(2, "0");
    const ss = hm[3] ?? "00";
    return `${hh}:${hm[2]}:${ss}`;
  }
  const iso = /T(\d{2}):(\d{2}):(\d{2})/.exec(fill.ts);
  return iso ? `${iso[1]}:${iso[2]}:${iso[3]}` : t;
}

/** Country × window × market — same hole, not horse or odds. */
export function fillHoleKey(fill: Fill): string {
  const hole = parseHole(fill.recipeId) ?? parseHole(fill.recipe);
  if (hole) return `${hole.region}|${hole.window}|${hole.market}`;
  const ehole = /^H-ehole-([a-z]{2})-([a-z]+)-(win|place|lay)/i.exec(fill.recipeId);
  if (ehole) {
    const region = ehole[1].toUpperCase();
    const window = parseWindow(ehole[2]) ?? ehole[2];
    const market = ehole[3].toUpperCase();
    return `${region}|${window}|${market}`;
  }
  return fill.recipeId;
}

function fieldSprayGroupKey(fill: Fill): string {
  const side = (fill.side ?? "").toUpperCase();
  return `${fill.day}|${fillTickSecond(fill)}|${fillHoleKey(fill)}|${side}`;
}

function recipePickCap(fill: Fill): number | null {
  const blob = `${fill.recipeId} ${fill.recipe}`.toLowerCase().replace(/_/g, " ");
  if (/two[\s-]?pick/.test(blob)) return 2;
  if (/three[\s-]?pick/.test(blob)) return 3;
  if (/four[\s-]?pick/.test(blob)) return 4;
  const pack = /\bpack[\s-]?(\d+)\b/.exec(blob);
  if (pack) {
    const n = Number.parseInt(pack[1], 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const nPick = /\b(\d+)[\s-]?pick\b/.exec(blob);
  if (nPick) {
    const n = Number.parseInt(nPick[1], 10);
    if (Number.isFinite(n) && n > 1) return n;
  }
  return null;
}

function groupPickCap(group: readonly Fill[]): number | null {
  let cap: number | null = null;
  for (const f of group) {
    const c = recipePickCap(f);
    if (c != null) cap = cap == null ? c : Math.max(cap, c);
  }
  return cap;
}

function countsForTape(fill: Fill): boolean {
  return fill.result === "void" || fill.result === "waiting" || fill.result === "won" || fill.result === "lost";
}

function isFieldSprayGroup(group: readonly Fill[]): boolean {
  if (group.length < FIELD_SPRAY_MIN_RUNNERS) return false;
  const odds = new Set(group.map((f) => f.odds).filter((o) => o != null));
  if (odds.size < 2) return false;
  const cap = groupPickCap(group);
  if (cap != null && group.length <= cap && odds.size <= cap) return false;
  return group.length >= FIELD_SPRAY_MIN_RUNNERS || odds.size >= FIELD_SPRAY_MIN_RUNNERS;
}

/**
 * Same-second same-hole unbounded BACK field spray — not honest recipe-scoped books.
 * Defined two-pick (etc.) at one tick stays visible; 5+ runner dumps without pick-cap hide.
 */
export function fieldSprayFillIds(fills: readonly Fill[]): Set<string> {
  const groups = new Map<string, Fill[]>();
  for (const f of fills) {
    if (!countsForTape(f)) continue;
    if ((f.side ?? "").toUpperCase() !== "BACK") continue;
    const key = fieldSprayGroupKey(f);
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }
  const out = new Set<string>();
  for (const group of groups.values()) {
    if (!isFieldSprayGroup(group)) continue;
    for (const f of group) out.add(f.id);
  }
  return out;
}

/** Run tag on ehole ids — 73508Z, 34829Z, not horse names. */
export function isRawIdRunSuffix(run: string): boolean {
  return /^\d{4,6}Z$/i.test(run.trim());
}

/** Ticket shows raw run suffix with no runner — not Noble Saint one-picks. */
export function fillHasRawIdTicketName(
  fill: Fill,
  recipe?: Pick<Recipe, "id" | "title" | "hunterName"> | null,
): boolean {
  if (fill.horse) return false;
  if (!isPostEpochEholeRecipe({ id: fill.recipeId, title: fill.recipe })) return false;
  const run = eholeRunSuffix(fill.recipeId);
  return run != null && isRawIdRunSuffix(run);
}

export function fillIsInPlayEholeFirstBook(fill: Fill): boolean {
  return isSprayClassInPlayEholeFirstBook({ id: fill.recipeId, title: fill.recipe });
}

function isEholeFirstBookFill(fill: Fill): boolean {
  return isPostEpochEholeRecipe({ id: fill.recipeId, title: fill.recipe });
}

/**
 * Ehole measuring/hunting first books: 2+ BACK selections same hole tick — field spray junk.
 * Defined two-pick (etc.) at one tick stays visible.
 */
export function eholeFirstBookSprayFillIds(fills: readonly Fill[]): Set<string> {
  const groups = new Map<string, Fill[]>();
  for (const f of fills) {
    if (!countsForTape(f)) continue;
    if ((f.side ?? "").toUpperCase() !== "BACK") continue;
    if (!isEholeFirstBookFill(f)) continue;
    const key = fieldSprayGroupKey(f);
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }
  const out = new Set<string>();
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const cap = groupPickCap(group);
    if (cap != null && group.length <= cap) continue;
    const odds = new Set(group.map((f) => f.odds).filter((o) => o != null));
    const horses = new Set(group.map((f) => f.horse).filter((h) => h));
    if (odds.size >= 2 || horses.size >= 2 || group.length >= 2) {
      for (const f of group) out.add(f.id);
    }
  }
  return out;
}

function pseudoRecipeFromFill(fill: Fill, recipe?: Recipe | undefined): Recipe {
  if (recipe) return recipe;
  return {
    id: fill.recipeId,
    title: fill.recipe,
    region: "GB",
    status: "MEASURING",
    badge: "Research",
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "",
    hunterName: null,
  };
}

/** Geo / Card twin skins beyond earliest run — same collapse as mill display. */
export function twinSkinJunkFillIds(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Set<string> {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const ids = new Set<string>();
  for (const f of fills) {
    if (!isPostEpochEholeRecipe({ id: f.recipeId, title: f.recipe })) continue;
    const r = recipeMap.get(f.recipeId);
    const hunter = (r?.hunterName ?? "").trim().toLowerCase();
    if (!TWIN_HUNTER_SKINS.has(hunter)) continue;
    const holeKey = recipeDisplayHoleKey({ id: f.recipeId, title: f.recipe, region: r?.region });
    if (!holeKey) continue;
    ids.add(f.recipeId);
  }
  if (!ids.size) return new Set();

  const pseudo: Recipe[] = [];
  for (const id of ids) {
    const fill = fills.find((f) => f.recipeId === id);
    if (!fill) continue;
    pseudo.push(pseudoRecipeFromFill(fill, recipeMap.get(id)));
  }
  const kept = new Set(millDisplayRecipes(pseudo).map((r) => r.id));
  const out = new Set<string>();
  for (const f of fills) {
    if (!kept.has(f.recipeId) && ids.has(f.recipeId)) out.add(f.id);
  }
  return out;
}

function recipeForFill(recipes: readonly Recipe[], fill: Fill): Recipe | undefined {
  return recipes.find((r) => r.id === fill.recipeId);
}

/** Mill-voided ehole leftovers — ZA 73506Z, GB 34829Z, FR 73339Z spray packs. */
export function isMillVoidLeftover(fill: Fill, recipe?: Pick<Recipe, "id" | "title" | "hunterName"> | null): boolean {
  if (fill.result !== "void") return false;
  if (fillIsInPlayEholeFirstBook(fill)) return true;
  if (fillHasRawIdTicketName(fill, recipe)) return true;
  if (!isPostEpochEholeRecipe({ id: fill.recipeId, title: fill.recipe })) return false;
  const run = eholeRunSuffix(fill.recipeId);
  return run != null && isRawIdRunSuffix(run);
}

export type VoidGoneHole = {
  region: string;
  window: string;
  market: string;
  tone: string;
  side?: string;
};

/** Voided junk paints killed on the square — not a fake empty hole after mill stamp. */
export function voidedJunkSquareHoles(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): VoidGoneHole[] {
  const junk = junkFillIds(fills, recipes);
  const out: VoidGoneHole[] = [];
  const seen = new Set<string>();
  for (const f of fills) {
    if (f.result !== "void") continue;
    if (!junk.has(f.id) && !isMillVoidLeftover(f, recipeForFill(recipes, f))) continue;
    const parsed = squareHoleKeyAndSide(f.recipeId, f.recipe);
    if (!parsed) continue;
    if (seen.has(parsed.id)) continue;
    seen.add(parsed.id);
    const parts = parsed.id.split("|");
    const window = parseWindow(parts[1]) ?? parts[1];
    out.push({
      region: parts[0],
      window,
      market: parsed.market,
      tone: "loss",
      side: parsed.side,
    });
  }
  return out;
}

/** All junk fill ids — Trades lists and paper P&L; not for hiding square occupancy. */
export function junkFillIds(fills: readonly Fill[], recipes: readonly Recipe[] = []): Set<string> {
  const out = new Set<string>();
  for (const id of fieldSprayFillIds(fills)) out.add(id);
  for (const id of eholeFirstBookSprayFillIds(fills)) out.add(id);
  for (const id of twinSkinJunkFillIds(fills, recipes)) out.add(id);
  for (const f of fills) {
    if (fillIsInPlayEholeFirstBook(f)) out.add(f.id);
    if (fillHasRawIdTicketName(f, recipeForFill(recipes, f))) out.add(f.id);
  }
  return out;
}

export function isJunkFill(fill: Fill, fills: readonly Fill[], recipes: readonly Recipe[] = []): boolean {
  return junkFillIds(fills, recipes).has(fill.id);
}
