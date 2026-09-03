/** Office-only lines — mill fixes, tape skips, one-line mill caption. Never duplicates Floor or Trades. */

import { isPostEpochEholeMeasuring } from "./board-reset.ts";
import { inventWhatHappened, millHuntCaption } from "./boards.ts";
import { EMPTY } from "./desk.ts";
import {
  collapseEholeTwinSkins,
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
  recipeDisplayHoleKey,
} from "./mill-display.ts";
import type { Recipe } from "./stamp.ts";
import { fieldSprayFillIds, fillsOnDay, type Fill } from "./trades.ts";

const TWIN_HUNTERS = new Set(["geo", "card"]);

export type OfficeFixLine = { id: string; problem: string; hint: string };

function twinHiddenCount(recipes: readonly Recipe[]): number {
  const sansSpray = recipes.filter((r) => !isSprayClassInPlayEholeFirstBook(r));
  return sansSpray.length - collapseEholeTwinSkins(sansSpray).length;
}

function isTwinExtraSkin(recipe: Recipe, recipes: readonly Recipe[]): boolean {
  const hunter = (recipe.hunterName ?? "").trim().toLowerCase();
  if (!TWIN_HUNTERS.has(hunter)) return false;
  if (!isPostEpochEholeMeasuring(recipe)) return false;
  const holeKey = recipeDisplayHoleKey(recipe);
  if (!holeKey) return false;
  const group = recipes.filter(
    (r) =>
      isPostEpochEholeMeasuring(r) &&
      TWIN_HUNTERS.has((r.hunterName ?? "").trim().toLowerCase()) &&
      recipeDisplayHoleKey(r) === holeKey &&
      (r.hunterName ?? "").trim().toLowerCase() === hunter,
  );
  if (group.length <= 1) return false;
  const kept = collapseEholeTwinSkins(group);
  return kept[0]?.id !== recipe.id;
}

/** Mill junk — measuring ehole rows hidden from display, not in-play spray or twin skins. */
export function officeMillJunkCount(recipes: readonly Recipe[]): number {
  const displayIds = new Set(millDisplayRecipes(recipes).map((r) => r.id));
  let n = 0;
  for (const r of recipes) {
    if (!isPostEpochEholeMeasuring(r)) continue;
    if (isSprayClassInPlayEholeFirstBook(r)) continue;
    if (isTwinExtraSkin(r, recipes)) continue;
    if (!displayIds.has(r.id)) n++;
  }
  return n;
}

/** Things to fix on Office — mill clutter only; stamp issues are separate. */
export function officeMillFixLines(
  recipes: readonly Recipe[],
  trades: readonly Fill[],
  day: string,
): OfficeFixLine[] {
  const lines: OfficeFixLine[] = [];
  const inPlay = recipes.filter(isSprayClassInPlayEholeFirstBook);
  if (inPlay.length > 0) {
    lines.push({
      id: "in-play-first-books",
      problem: `${inPlay.length} in-play first book${inPlay.length === 1 ? "" : "s"} on the mill`,
      hint: "Spray-class leftovers — not factory recipes",
    });
  }
  const twins = twinHiddenCount(recipes);
  if (twins > 0) {
    lines.push({
      id: "twin-skins",
      problem: `${twins} Geo/Card twin skin${twins === 1 ? "" : "s"} on one hole`,
      hint: "Earliest run only until the book holds",
    });
  }
  const junk = officeMillJunkCount(recipes);
  if (junk > 0) {
    lines.push({
      id: "mill-junk",
      problem: `${junk} mill junk row${junk === 1 ? "" : "s"} off the tape`,
      hint: "Measuring ehole clutter — not on Trades",
    });
  }
  const dayFills = fillsOnDay(trades, day);
  const sprays = fieldSprayFillIds(dayFills);
  const openSprays = dayFills.filter((f) => f.result === "waiting" && sprays.has(f.id));
  if (openSprays.length > 0) {
    lines.push({
      id: "leftover-sprays",
      problem: `${openSprays.length} leftover spray${openSprays.length === 1 ? "" : "s"} on the tape`,
      hint: "Same-second field dumps — off Trades",
    });
  }
  return lines;
}

/** What Office skips — off Trades tape and sparse in-play by design. */
export function officeTapeSkips(
  recipes: readonly Recipe[],
  trades: readonly Fill[],
  day: string,
): string[] {
  const lines: string[] = [];
  const inPlay = recipes.filter(isSprayClassInPlayEholeFirstBook);
  if (inPlay.length > 0) {
    lines.push(
      `${inPlay.length} in-play first book${inPlay.length === 1 ? "" : "s"} off Trades — spray-class, sparse on purpose`,
    );
  }
  const twins = twinHiddenCount(recipes);
  if (twins > 0) {
    lines.push(
      `${twins} Geo/Card twin skin${twins === 1 ? "" : "s"} off Trades — earliest run per hole`,
    );
  }
  const dayFills = fillsOnDay(trades, day);
  const sprays = fieldSprayFillIds(dayFills);
  const openSprays = dayFills.filter((f) => f.result === "waiting" && sprays.has(f.id));
  if (openSprays.length > 0) {
    lines.push(`${openSprays.length} leftover spray${openSprays.length === 1 ? "" : "s"} off the tape`);
  }
  const junk = officeMillJunkCount(recipes);
  if (junk > 0) {
    lines.push(`${junk} mill junk row${junk === 1 ? "" : "s"} off Trades Waiting`);
  }
  if (inPlay.length > 0) {
    lines.push("In-play stays sparse on the square — not a first-book window");
  }
  return lines;
}

/** One invent/mill line — fast-arm vs parked, fuse off when law. */
export function officeMillCaption(stamp: {
  fuse_on: boolean;
  office: {
    invent: boolean;
    inventWhy: string;
    rejects?: readonly string[];
  };
  pipe: { pitched: number };
  hunters: readonly { id: string; note: string }[];
  mill_mode?: string;
  mill_n_armed?: number;
  n_armed?: number;
}): string {
  const hunt = millHuntCaption(stamp.office.inventWhy?.trim() ?? "", {
    mill_mode: stamp.mill_mode,
    mill_n_armed: stamp.mill_n_armed,
    n_armed: stamp.n_armed,
  });
  const emptyHoleHunt = /empty-hole hunt|invent_empty/i.test(hunt);

  if (emptyHoleHunt) {
    const base = hunt || (stamp.office.invent ? "empty-hole fast-arm hunt on" : EMPTY);
    if (base === EMPTY) return stamp.fuse_on ? EMPTY : "fuse off";
    return stamp.fuse_on ? base : `${base} · fuse off`;
  }

  const line = inventWhatHappened({
    invent: stamp.office.invent,
    inventWhy: stamp.office.inventWhy,
    pitched: stamp.pipe.pitched,
    hunters: stamp.hunters,
    rejects: stamp.office.rejects,
    mill_mode: stamp.mill_mode,
    mill_n_armed: stamp.mill_n_armed,
    n_armed: stamp.n_armed,
  });
  if (line === EMPTY) return stamp.fuse_on ? EMPTY : "fuse off";
  if (!stamp.fuse_on && !/fuse off/i.test(line)) return `${line} · fuse off`;
  return line;
}
