/** Mill-voided packs only — not one-per-market first books on Lab Mill. */

import { parseHole, parseWindow, squareHoleKeyAndSide } from "./boards.ts";
import { eholeRunSuffix } from "./desk.ts";
import type { Fill } from "./trades.ts";

/** Already voided on the mill: ZA 73506Z, GB 34829Z spray, FR 73339Z in-play spray. */
const MILL_VOID_PACKS: readonly { run: string; idPattern: RegExp }[] = [
  { run: "73506Z", idPattern: /^H-ehole-za-/i },
  { run: "34829Z", idPattern: /^H-ehole-gb-/i },
  { run: "73339Z", idPattern: /^H-ehole-fr-inplay-/i },
];

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

function isFieldSprayGroup(group: readonly Fill[]): boolean {
  if (group.length < FIELD_SPRAY_MIN_RUNNERS) return false;
  const odds = new Set(group.map((f) => f.odds).filter((o) => o != null));
  if (odds.size < 2) return false;
  const cap = groupPickCap(group);
  if (cap != null && group.length <= cap && odds.size <= cap) return false;
  return group.length >= FIELD_SPRAY_MIN_RUNNERS || odds.size >= FIELD_SPRAY_MIN_RUNNERS;
}

/**
 * Same-second same-hole unbounded BACK field spray — used by tests; mill void packs
 * are identified by run suffix, not this heuristic alone.
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

/** Run tag on ehole ids — 73506Z, 34829Z, 73339Z packs. */
export function isRawIdRunSuffix(run: string): boolean {
  return /^\d{4,6}Z$/i.test(run.trim());
}

/** Fill belongs to one of the three mill-voided spray packs. */
export function isMillVoidPackFill(fill: Fill): boolean {
  const run = eholeRunSuffix(fill.recipeId);
  if (!run) return false;
  const upper = run.toUpperCase();
  for (const pack of MILL_VOID_PACKS) {
    if (upper === pack.run && pack.idPattern.test(fill.recipeId)) return true;
  }
  return false;
}

/** Voided row from a mill-void pack — square paints killed, paper u ignores. */
export function isMillVoidLeftover(fill: Fill): boolean {
  return fill.result === "void" && isMillVoidPackFill(fill);
}

export type VoidGoneHole = {
  region: string;
  window: string;
  market: string;
  tone: string;
  side?: string;
};

/** Voided mill-void packs paint killed on the square — not a fake empty hole. */
export function voidedJunkSquareHoles(fills: readonly Fill[]): VoidGoneHole[] {
  const out: VoidGoneHole[] = [];
  const seen = new Set<string>();
  for (const f of fills) {
    if (!isMillVoidLeftover(f)) continue;
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

/** Trades tape + paper u — only the three mill-voided packs, not first-book waits. */
export function junkFillIds(fills: readonly Fill[]): Set<string> {
  const out = new Set<string>();
  for (const f of fills) {
    if (isMillVoidPackFill(f)) out.add(f.id);
  }
  return out;
}

export function isJunkFill(fill: Fill, fills: readonly Fill[]): boolean {
  return junkFillIds(fills).has(fill.id);
}
