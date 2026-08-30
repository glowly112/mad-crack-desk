/** Display grouping for the desk. Never sums cells or invents a score. */

import type { Recipe } from "./stamp.ts";

export const EMPTY = "Empty";
export const SOLID_EMPTY = "No solid recipes on the day tape.";

export function moveTone(to: string): "bad" | "mute" {
  if (to === "Dead" || to === "Stuck") return "bad";
  return "mute";
}

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

export function issueLanes<T extends { id: string }>(issues: readonly T[], topId: string) {
  return {
    needsYou: issues.filter((i) => i.id === topId),
    watching: issues.filter((i) => i.id !== topId),
  };
}

export function healthLine(input: {
  plantHealth: string;
  plantLine: string;
  kpis: readonly { label: string; status: string }[];
}): string {
  const red = input.kpis.filter((k) => k.status === "RED").map((k) => k.label);
  if (red.length) return `Needs ${red.join(" · ")}`;
  if (input.plantHealth === "GREEN") return "Plant healthy";
  const amber = input.kpis.filter((k) => k.status === "AMBER").map((k) => k.label);
  if (amber.length) return `Needs ${amber.join(" · ")}`;
  return input.plantLine || "Plant healthy";
}

/** Y range for the production chart. Aim is a point on the axis — never autoscale to ~8. */
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
