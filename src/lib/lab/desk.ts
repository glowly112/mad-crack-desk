/** Display grouping for the desk. Never sums cells or invents a score. */

import type { Move, Recipe } from "./stamp.ts";

export const EMPTY = "Empty";
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

const HOP_TO = new Set(["Certified", "Solid", "Research keep", "Dead", "Parked"]);

/** State hops only — not proving ticks. */
export function hopMoves(moves: readonly Move[]): Move[] {
  return moves.filter((m) => HOP_TO.has(m.to) && m.from !== m.to);
}

export function productionDomain(
  values: readonly (number | null | undefined)[],
  aim: number,
): [number, number] {
  const present = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const lo = present.length ? Math.min(0, ...present) : Math.min(0, aim);
  const hi = Math.max(aim, 0, ...present);
  if (lo === hi) return [lo - 1, hi + 1];
  return [lo, hi];
}

export function productionTicks(domain: [number, number], aim: number): number[] {
  const ticks = [Math.floor(domain[0]), 0, aim];
  return [...new Set(ticks)].sort((a, b) => a - b);
}

export function floorSeats<T extends { id: string }>(seats: readonly T[]): T[] {
  const order = ["clerk", "foreman", "igor"];
  return order
    .map((id) => seats.find((s) => s.id === id))
    .filter((s): s is T => Boolean(s));
}

export function prettyTitle(title: string): string {
  const t = title.replace(/_/g, " ").trim();
  const lower = t.toLowerCase();
  if (/gb\b/.test(lower) && /win/.test(lower) && /near\s*off/.test(lower)) return "GB win near-off";
  if (/\bnz\b/.test(lower) && /morning/.test(lower) && /win/.test(lower)) return "NZ morning win";
  if (/\bau\b/.test(lower) && /place/.test(lower) && /near\s*off/.test(lower)) return "AU place near-off";
  if (/\bau\b/.test(lower) && /late\s*pre/.test(lower) && /win/.test(lower)) return "AU late-pre win midfield";
  if (/\bus\b/.test(lower) && /in\s*play/.test(lower) && /place/.test(lower)) return "US in-play place small field";
  if (/\bza\b/.test(lower) && /near\s*off/.test(lower) && /place/.test(lower)) return "ZA near-off place small field";
  if (/\bfr\b/.test(lower) && /near\s*off/.test(lower) && /place/.test(lower)) return "FR near-off place";
  return t.replace(/\bbanked\b/i, "").replace(/\bsize ok\b/i, "").replace(/\s+/g, " ").trim();
}
