/** Display mapping for the clerk book. Never invents tickets or sums P&L. */

import {
  isPostEpochEholeMeasuring,
  isPostEpochEholeRecipe,
} from "./board-reset.ts";
import {
  eholeChipRunOrder,
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
  recipeDisplayHoleKey,
} from "./mill-display.ts";
import { millHuntCaption } from "./boards.ts";
import {
  bookDisplayName,
  deskMarketFromParts,
  deskStampedSide,
  EMPTY,
  cellName,
  hopMoves,
  recipeBookName,
  strategyMark,
  WAITING,
  type DeskRow,
} from "./desk.ts";
import { junkFillIds } from "./junk-fills.ts";
import { hopVoice } from "./staff-voice.ts";
import { ukClock, ukHopAt } from "./uk-time.ts";
import type { Move, Recipe } from "./stamp.ts";

export type FillBook = "paper" | "production" | "live";
export type FillResult = "won" | "lost" | "void" | "waiting";
export type Flight = "waiting result" | "unmatched" | "in-play" | "waiting for races";

/** Hero stake on the tape. Envelope stake_gbp / paper_stake is not the unit. */
export const HERO_U = 1;

export type WaitOpen = {
  id: string;
  title: string;
  why: string | null;
};

export type Fill = {
  id: string;
  ts: string;
  t: string;
  day: string;
  recipe: string;
  recipeId: string;
  market: string;
  book: FillBook;
  side: string | null;
  odds: number | null;
  stake: number | null;
  result: FillResult;
  flight: Flight | null;
  /** Available-to-bet size. Liquidity — never unmatched. */
  liquidity: number | null;
  pnl: number | null;
  /** Runner if the stamp names one. Empty is Empty — never invented. */
  horse: string | null;
};

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && v !== "—") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** A real UK wall clock. Never Empty. */
export function bookedClock(...raws: Array<string | null | undefined>): string {
  return ukClock(...raws);
}

function clock(ts: string): string {
  return ukClock(ts);
}

function marketOf(title: string, odds: number | null): string {
  const lower = title.toLowerCase();
  const kind = /place/.test(lower) ? "PLACE" : /win/.test(lower) ? "WIN" : "MKT";
  return odds == null ? kind : `${kind} ${odds}`;
}

function bookOf(row: Record<string, unknown>): FillBook {
  const mode = String(row.mode || "").toLowerCase();
  const certified = row.certified_keep === true || row.certified === true;
  if (mode === "live" && certified) return "production";
  if (mode === "live") return "live";
  if (mode === "paper_live" || (certified && mode !== "auto_dry")) return "production";
  return "paper";
}

function resultOf(row: Record<string, unknown>): FillResult {
  const status = String(row.status || "").toUpperCase();
  if (status === "VOID") return "void";
  if (status === "OPEN" || status === "PENDING" || status === "WAITING" || status === "UNMATCHED") {
    return "waiting";
  }
  if (row.placed_result === true) return "won";
  if (row.placed_result === false) return "lost";
  if (status === "SETTLED") return "void";
  return "waiting";
}

function flightOf(row: Record<string, unknown>): Flight | null {
  const status = String(row.status || "").toUpperCase();
  if (status === "SETTLED" || status === "VOID") return null;
  // OPEN is booked intent waiting freeze result — not unmatched-at-exchange.
  // atb_size is liquidity, never a fill status.
  if (status === "UNMATCHED") return "unmatched";
  if (row.in_play === true || /in.?play/i.test(String(row.phase ?? ""))) return "in-play";
  if (status === "OPEN" || status === "PENDING" || status === "WAITING" || row.placed_result == null) {
    return "waiting result";
  }
  return null;
}

function heroStake(row: Record<string, unknown>): number | null {
  const envelope = num(row.stake_gbp) ?? num(row.paper_stake_gbp);
  if (envelope == null) return null;
  return HERO_U;
}

/** Paper P&L in hero u — envelope stake_gbp is not the displayed unit. */
function pnlInU(row: Record<string, unknown>): number | null {
  const raw = num(row.paper_pnl_gbp) ?? num(row.pnl_gbp) ?? num(row.pnl);
  if (raw == null) return null;
  const envelope = num(row.stake_gbp) ?? num(row.paper_stake_gbp);
  if (envelope == null || envelope <= 0) return raw;
  return raw * (HERO_U / envelope);
}

function horseOf(row: Record<string, unknown>): string | null {
  const keys = ["horse", "runner", "horse_name", "runner_name", "selection_name", "sel_name"];
  for (const k of keys) {
    const v = row[k];
    if (typeof v !== "string") continue;
    const raw = v.trim();
    if (!raw || raw === EMPTY) continue;
    if (/^H-[a-z0-9-]+$/i.test(raw)) continue;
    if (/^\d+$/.test(raw)) continue;
    return raw;
  }
  return null;
}

export function fillFromRow(raw: unknown): Fill | null {
  const row = rec(raw);
  if (!row) return null;
  const id = String(row.pick_id || row.id || "").trim();
  const ts = String(row.ts || row.settled_ts || row.off_ts || "");
  const offTime = typeof row.off_time === "string" ? row.off_time : "";
  const cell = String(row.cell_id || row.recipeId || "").split("|")[0] ?? "";
  if (!id && !ts && !cell) return null;
  const title = cellName(cell, String(row.title || ""), id);
  const odds = num(row.odds);
  const pnl = pnlInU(row);
  const day =
    (typeof row.date === "string" && row.date) ||
    (/^\d{4}-\d{2}-\d{2}/.exec(ts)?.[0] ?? "");
  return {
    id: id || `${cell}:${ts}`,
    ts,
    t: clock(ts) || clock(offTime),
    day,
    recipe: title || "Empty",
    recipeId: cell,
    market: marketOf(title || cell, odds),
    book: bookOf(row),
    side: typeof row.side === "string" && row.side ? String(row.side).toUpperCase() : null,
    odds,
    stake: heroStake(row),
    result: resultOf(row),
    flight: flightOf(row),
    liquidity: num(row.atb_size_gbp),
    pnl,
    horse: horseOf(row),
  };
}

/** Name on the board. Open tickets: horse, else recipe bits + odds + side. */
export function tradeName(fill: Fill, recipe?: Pick<Recipe, "id" | "title" | "hunterName"> | null): string {
  return bookDisplayName({
    title: fill.recipe,
    id: fill.recipeId,
    horse: fill.horse,
    odds: fill.odds,
    side: fill.side,
    hunterName: recipe?.hunterName,
    openTicket: fill.result === "waiting",
  });
}

/** @deprecated odds live in the Odds column — use tradeName */
export function tradeMark(fill: Fill): string {
  return tradeName(fill);
}

/** Book column is paper or live. Production is still paper. */
export function bookWord(book: FillBook): "paper" | "live" {
  return book === "live" ? "live" : "paper";
}

export function fillResultWord(fill: Fill): string {
  if (fill.result === "waiting") return "Open";
  if (fill.result === "won") return "Won";
  if (fill.result === "lost") return "Lost";
  if (fill.result === "void") return "Void";
  return EMPTY;
}

/** Ticket as a board row. Open P&L is Empty until settled. */
export function fillDeskRow(fill: Fill, fuseOn: boolean): DeskRow {
  const tape = tapePnl(fill, fuseOn);
  const isOpen = fill.result === "waiting";
  const time = bookedClock(fill.ts, fill.t);
  const oddsStr = fmtOdds(fill.odds);
  const stakeStr = fmtStake(fill.stake);
  const market = deskMarketFromParts(fill.recipeId, fill.recipe);
  const rawSide = (fill.side ?? "").toUpperCase();
  const sideStr =
    rawSide === "BACK" || rawSide === "LAY" ? rawSide : deskStampedSide(fill.recipeId, fill.recipe);
  const pending = (value: string) => (value && value !== EMPTY ? value : isOpen ? WAITING : EMPTY);
  return {
    id: fill.id,
    time: pending(time),
    name: tradeName(fill),
    market: market !== EMPTY ? market : isOpen ? WAITING : EMPTY,
    side: sideStr !== EMPTY ? sideStr : EMPTY,
    odds: pending(oddsStr === EMPTY ? "" : oddsStr),
    stake: pending(stakeStr === EMPTY ? "" : stakeStr),
    book: bookWord(fill.book),
    result: fillResultWord(fill),
    pnl: isOpen ? null : tape.pnl,
  };
}

/** Recipe armed with no fill. Market from hole; Side only when stamped (LAY recipe, etc.). */
export function waitDeskRow(chip: WaitOpen): DeskRow {
  const market = deskMarketFromParts(chip.id, chip.title);
  const stamped = deskStampedSide(chip.id, chip.title);
  return {
    id: chip.id,
    time: WAITING,
    name: strategyMark(chip.title, chip.id),
    market: market !== EMPTY ? market : WAITING,
    side: stamped !== EMPTY ? stamped : EMPTY,
    odds: WAITING,
    stake: WAITING,
    book: "paper",
    result: "Waiting for races",
    pnl: null,
  };
}

export function parseFills(raw: unknown): Fill[] {
  if (!Array.isArray(raw)) return [];
  const out: Fill[] = [];
  for (const row of raw) {
    const fill = fillFromRow(row);
    if (fill) out.push(fill);
  }
  return out.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
}

export function tradeCounts(fills: readonly Fill[]) {
  return {
    paper: fills.filter((f) => f.book === "paper").length,
    production: fills.filter((f) => f.book === "production").length,
    live: fills.filter((f) => f.book === "live").length,
  };
}

/** Live P&L is 0 while the fuse is off. Paper P&L is never income. Open has no P&L yet. */
export function tapePnl(fill: Fill, fuseOn: boolean): { pnl: number | null; caption: string | null } {
  if (fill.result === "waiting") {
    return { pnl: null, caption: fill.flight };
  }
  if (fill.book === "live" && !fuseOn) {
    return { pnl: 0, caption: "fuse off" };
  }
  if (fill.book === "paper") {
    return { pnl: fill.pnl, caption: "not income" };
  }
  return { pnl: fill.pnl, caption: null };
}

export function fmtStake(n: number | null): string {
  if (n == null) return "Empty";
  return Number.isInteger(n) ? `${n}u` : `${n.toFixed(2)}u`;
}

export function fmtOdds(n: number | null): string {
  if (n == null) return "Empty";
  return Number.isInteger(n) ? String(n) : String(n);
}

export function bookBadge(book: FillBook): string | null {
  if (book === "paper" || book === "live") return "No money";
  return null;
}

export function parseWaitOpen(raw: unknown): WaitOpen[] {
  if (!Array.isArray(raw)) return [];
  const out: WaitOpen[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const recs = rec(row);
    if (!recs) continue;
    const blob = `${recs.mode ?? ""} ${recs.chip ?? ""} ${recs.live_gate ?? ""}`.toLowerCase();
    if (!blob.includes("wait_open")) continue;
    const id = String(recs.cell_id || recs.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const reasons = Array.isArray(recs.reasons) ? recs.reasons.map((x) => String(x)) : [];
    let why: string | null = null;
    if (reasons.includes("no_open_size_ok_candidates")) why = "no size_ok candidates";
    else if (reasons[0]) why = reasons[0].replace(/_/g, " ");
    out.push({ id, title: cellName(id, String(recs.title || "")), why });
  }
  return out;
}

/** Recipe armed with no fill. Never a ticket. Hide recipes that already have an OPEN row. */
export function waitOpenChips(waitOpen: readonly WaitOpen[], open: readonly Fill[]): WaitOpen[] {
  const ids = new Set(open.map((f) => f.recipeId));
  return waitOpen.filter((w) => !ids.has(w.id));
}

function coveredRecipeIds(open: readonly Fill[], chips: readonly WaitOpen[]): Set<string> {
  const ids = new Set<string>();
  for (const f of open) ids.add(f.recipeId);
  for (const w of chips) ids.add(w.id);
  return ids;
}

/** Post-epoch H-ehole measuring/hunting — not legacy KEEP / Hyde / steam-fade wait_open. */
export function measuringEholeWaitChips(
  recipes: readonly Recipe[],
  open: readonly Fill[],
  existing: readonly WaitOpen[],
): WaitOpen[] {
  const covered = coveredRecipeIds(open, existing);
  const out: WaitOpen[] = [];
  for (const r of recipes) {
    if (!isPostEpochEholeMeasuring(r)) continue;
    if (covered.has(r.id)) continue;
    covered.add(r.id);
    out.push({ id: r.id, title: r.title, why: null });
  }
  return out;
}

/** Trades wait rows: post-epoch ehole on the mill — no spray-class in-play first books or twin skins. */
export function tradesWaitChips(
  recipes: readonly Recipe[],
  waitOpen: readonly WaitOpen[],
  open: readonly Fill[],
): WaitOpen[] {
  const display = millDisplayRecipes(recipes);
  const postEholeWait = waitOpen.filter(
    (w) =>
      isPostEpochEholeRecipe({ id: w.id, title: w.title }) &&
      !isSprayClassInPlayEholeFirstBook({ id: w.id, title: w.title }),
  );
  const fromWait = waitOpenChips(postEholeWait, open);
  const fromRecipes = measuringEholeWaitChips(display, open, fromWait);
  return dedupeWaitChipsByHole([...fromWait, ...fromRecipes]);
}

function waitChipHoleKey(chip: WaitOpen): string {
  return recipeDisplayHoleKey(chip) ?? chip.id;
}

/** One Trades row per hole — earliest ehole skin when Geo/Card twins share a hole. */
export function dedupeWaitChipsByHole(chips: readonly WaitOpen[]): WaitOpen[] {
  const byHole = new Map<string, WaitOpen>();
  for (const c of chips) {
    const key = waitChipHoleKey(c);
    const prev = byHole.get(key);
    if (!prev) {
      byHole.set(key, c);
      continue;
    }
    if (eholeChipRunOrder(c.id) < eholeChipRunOrder(prev.id)) byHole.set(key, c);
  }
  return [...byHole.values()];
}

export type MillTapeRow = { at: string; text: string };

/** State hops when present; else live hunt arms or open tickets on the mill. */
export function millTapeRows(stamp: {
  day?: string;
  moves?: readonly Move[];
  recipes: readonly Recipe[];
  wait_open?: readonly WaitOpen[];
  trades?: readonly Fill[];
  mill_n_armed?: number;
  n_armed?: number;
  mill_mode?: string;
  office?: { inventWhy?: string };
}): MillTapeRow[] {
  const hops = hopMoves(stamp.moves ?? []);
  if (hops.length) {
    return hops.map((m) => ({
      at: ukHopAt(m.at) || m.at,
      text: hopVoice(m) || bookDisplayName({ id: m.recipe, title: m.recipe }),
    }));
  }

  const day = stamp.day ?? "";
  const act = millActivity({ day, trades: stamp.trades ?? [], recipes: stamp.recipes ?? [] });
  const recipes = stamp.recipes ?? [];
  const rows: MillTapeRow[] = [];
  const rawWhy = stamp.office?.inventWhy?.trim() ?? "";

  if (act.lastSettled) {
    const name = fillTradeName(act.lastSettled, recipes);
    const pnl = act.lastSettled.pnl;
    const word =
      act.lastSettled.result === "won"
        ? "won"
        : act.lastSettled.result === "lost"
          ? "lost"
          : "settled";
    const pnlBit = pnl != null ? ` ${pnl >= 0 ? "+" : "−"}${Math.abs(pnl).toFixed(2)}u` : "";
    rows.push({
      at: act.lastSettled.t || bookedClock(act.lastSettled.ts),
      text: `Settled ${name} · ${word}${pnlBit} · paper`,
    });
  }

  if (act.lastOpen) {
    rows.push({
      at: act.lastOpen.t || bookedClock(act.lastOpen.ts),
      text: `Booked ${fillTradeName(act.lastOpen, recipes)} · paper`,
    });
  }

  if (act.openCount > 0) {
    rows.push({
      at: "",
      text: `${act.openCount} open on the mill · paper only · fuse off`,
    });
    if (act.paperDayU != null) {
      rows.push({
        at: "",
        text: `Today's settled paper ${act.paperDayU >= 0 ? "+" : "−"}${Math.abs(act.paperDayU).toFixed(2)}u`,
      });
    }
    return rows;
  }

  const chips = tradesWaitChips(stamp.recipes, stamp.wait_open ?? [], act.open);
  const armed = stamp.mill_n_armed ?? stamp.n_armed ?? 0;
  if (armed <= 0 && chips.length === 0) return rows;

  const huntWhy = millHuntCaption(rawWhy, {
    mill_mode: stamp.mill_mode,
    mill_n_armed: armed,
    n_armed: stamp.n_armed,
  });
  if (/empty-hole hunt|invent_empty/i.test(huntWhy)) {
    rows.push({ at: "", text: huntWhy });
  }
  const n = armed > 0 ? armed : chips.length;
  rows.push({
    at: "",
    text: `${n} armed on the mill · waiting for races.`,
  });
  return rows;
}

export function fillsOnDay(fills: readonly Fill[], day: string): Fill[] {
  return fills.filter((f) => f.day === day);
}

export function openFills(fills: readonly Fill[]): Fill[] {
  return fills.filter((f) => f.result === "waiting");
}

export function settledFills(fills: readonly Fill[]): Fill[] {
  return fills.filter((f) => f.result !== "waiting");
}

export {
  fieldSprayFillIds,
  fillHoleKey,
  fillTickSecond,
} from "./junk-fills.ts";

/** Open tickets on today's tape — junk packs hidden; occupancy uses raw openFills. */
export function honestOpenFills(fills: readonly Fill[], recipes: readonly Recipe[] = []): Fill[] {
  const junk = junkFillIds(fills, recipes);
  return openFills(fills).filter((f) => !junk.has(f.id));
}

/** Settled rows on today's tape — junk and mill-void leftovers excluded from paper u. */
export function honestSettledFills(fills: readonly Fill[], recipes: readonly Recipe[] = []): Fill[] {
  const junk = junkFillIds(fills, recipes);
  return settledFills(fills).filter((f) => !junk.has(f.id));
}

/** Paper settles that contribute to the day u total. */
export function paperSettledFills(fills: readonly Fill[], recipes: readonly Recipe[] = []): Fill[] {
  return honestSettledFills(fills, recipes).filter((f) => f.book === "paper" && f.result !== "void");
}

export type MillActivity = {
  open: Fill[];
  settledToday: Fill[];
  lastOpen: Fill | null;
  lastSettled: Fill | null;
  paperDayU: number | null;
  openCount: number;
};

/** Live mill tape from today's fills — same book as Trades. */
export function millActivity(stamp: {
  day: string;
  trades?: readonly Fill[];
  recipes?: readonly Recipe[];
}): MillActivity {
  const dayFills = fillsOnDay(stamp.trades ?? [], stamp.day);
  const recipes = stamp.recipes ?? [];
  const open = honestOpenFills(dayFills, recipes);
  const settled = honestSettledFills(dayFills, recipes);
  const paperSettled = paperSettledFills(dayFills, recipes);
  const paperDayU = paperSettled.length
    ? paperSettled.reduce((acc, f) => acc + (f.pnl ?? 0), 0)
    : null;
  return {
    open,
    settledToday: settled,
    lastOpen: open[0] ?? null,
    lastSettled: settled[0] ?? null,
    paperDayU,
    openCount: open.length,
  };
}

/** Settled paper u for one day — Floor tile matches Trades headline. */
export function settledPaperDayU(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): number | null {
  const paper = paperSettledFills(fillsOnDay(trades, day), recipes);
  if (!paper.length) return null;
  return paper.reduce((acc, f) => acc + (f.pnl ?? 0), 0);
}

export function recipeForFill(recipes: readonly Recipe[], fill: Fill): Recipe | undefined {
  return recipes.find((r) => r.id === fill.recipeId);
}

export function fillTradeName(fill: Fill, recipes: readonly Recipe[] = []): string {
  return tradeName(fill, recipeForFill(recipes, fill));
}

/** Day's tape totals. Paper/production Empty when that book has no fills. Live is 0 while fuse off. */
export function dayTapePnl(fills: readonly Fill[], fuseOn: boolean) {
  const paper = fills.filter((f) => f.book === "paper");
  const production = fills.filter((f) => f.book === "production");
  const live = fills.filter((f) => f.book === "live");
  const sum = (rows: Fill[]) =>
    rows.length ? rows.reduce((acc, f) => acc + (f.pnl ?? 0), 0) : null;
  return {
    paper: sum(paper),
    production: sum(production),
    live: fuseOn ? sum(live) : 0,
  };
}
