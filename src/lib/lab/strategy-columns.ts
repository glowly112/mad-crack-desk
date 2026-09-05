/** Shared compact strategy / spice columns — Office, Trades, Holdings. */

import { SQUARE_WINDOW_LABEL, squareHoleKeyAndSide, type SquareWindow } from "./boards.ts";
import { EMPTY } from "./desk.ts";
import { recipeDisplayHoleKey } from "./mill-display.ts";
import type { Recipe } from "./stamp.ts";
import type { FillSpice } from "./trades.ts";

const GOING_SHORT: Record<string, string> = {
  Good: "Gd",
  Soft: "Sf",
  Heavy: "Hy",
  Firm: "Fm",
  Yielding: "Yld",
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
export function oddsBandShort(band: string | undefined | null): string {
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

function marketShort(market: string): string {
  if (market === "WIN") return "win";
  if (market === "PLACE") return "plc";
  return market.toLowerCase();
}

/** Compact hole from a matrix key — GB|morning|WIN → GB · morning · win. */
export function compactHoleFromKey(holeKey: string): string {
  const [region, window, market] = holeKey.split("|");
  if (!region || !window || !market) return holeKey;
  const wlabel = SQUARE_WINDOW_LABEL[window as SquareWindow] ?? window;
  return `${region} · ${wlabel} · ${marketShort(market)}`;
}

/** Tight hole label for desk tables — region code · window · win/plc. */
export function compactHoleLabel(recipe: Pick<Recipe, "id" | "title" | "region">): string {
  const parsed = squareHoleKeyAndSide(recipe.id, recipe.title, recipe.region);
  if (!parsed) return EMPTY;
  const [region, window] = parsed.id.split("|");
  const wlabel = SQUARE_WINDOW_LABEL[window as SquareWindow] ?? window;
  return `${region} · ${wlabel} · ${marketShort(parsed.market)}`;
}

/** Compact hole from a fill or recipe id + title. */
export function compactHoleFromParts(
  id: string,
  title: string,
  region?: string,
): string {
  const parsed = squareHoleKeyAndSide(id, title, region);
  if (parsed) return compactHoleFromKey(parsed.id);
  const key = recipeDisplayHoleKey({ id, title, region: region ?? "" });
  if (key) return compactHoleFromKey(key);
  return EMPTY;
}

/** Course name — truncated for narrow columns. */
export function truncateCourse(course: string | null | undefined, max = 12): string {
  const c = course?.trim();
  if (!c) return EMPTY;
  return c.length > max ? `${c.slice(0, max - 1)}…` : c;
}

/** Abbreviated race type / going for a narrow Card column. */
export function cardSlice(raceType?: string | null, going?: string | null): string {
  const parts: string[] = [];
  if (raceType?.trim()) {
    const rt = raceType.trim();
    parts.push(rt.length > 8 ? `${rt.slice(0, 7)}…` : rt);
  }
  if (going?.trim()) {
    const g = going.trim();
    parts.push(GOING_SHORT[g] ?? (g.length > 4 ? g.slice(0, 3) : g));
  }
  return parts.length ? parts.join(" · ") : EMPTY;
}

/** Card column from plant book spice. */
export function cardSliceFromSpice(spice: FillSpice | null | undefined): string {
  if (!spice) return EMPTY;
  return cardSlice(spice.race_type, spice.going);
}

/** Horse name for the Trades tape — never recipe ids or runner numbers. */
export function deskHorseName(horse: string | null | undefined): string {
  if (!horse || horse === EMPTY) return EMPTY;
  const h = horse.trim();
  if (!h || /^H-ehole-|^H-fast-|^ehole_/i.test(h)) return EMPTY;
  if (/^\d{5,}$/.test(h)) return EMPTY;
  return h.length > 18 ? `${h.slice(0, 17)}…` : h;
}
