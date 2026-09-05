/** Display mapping for the clerk book. Never invents tickets or sums P&L. */

import {
  isPostEpochEholeMeasuring,
  isPostEpochEholeRecipe,
  recipeIsPostEpoch,
  BOARD_RESET_DAY,
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
  eholeRunSuffix,
  hopMoves,
  recipeBookName,
  strategyMark,
  WAITING,
  type DeskRow,
} from "./desk.ts";
import {
  cardSliceFromSpice,
  compactHoleFromParts,
  deskHorseName,
  nuggetOddsBand,
  oddsBandShort,
  truncateCourse,
} from "./strategy-columns.ts";
import { fieldSprayFillIds, junkFillIds } from "./junk-fills.ts";
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

/** Plant book.jsonl race context — optional; null when plant has not stamped yet. */
export type FillSpice = {
  course: string | null;
  race_type: string | null;
  going: string | null;
  surface: string | null;
  distance_m: number | null;
  field_size: number | null;
  card_join: string | null;
  country: string | null;
  window: string | null;
  market_type: string | null;
  race_id: string | null;
};

/** Keys carried from plant book.jsonl into desk ingest (plus core fill keys). */
export const BOOK_SPICE_KEYS = [
  "course",
  "race_type",
  "going",
  "surface",
  "distance_m",
  "field_size",
  "card_join",
  "country",
  "window",
  "market_type",
  "race_id",
  "invent_scale",
] as const;

export const BOOK_CORE_FILL_KEYS = [
  "pick_id",
  "id",
  "ts",
  "settled_ts",
  "cell_id",
  "recipeId",
  "mode",
  "status",
  "odds",
  "stake_gbp",
  "paper_stake_gbp",
  "paper_pnl_gbp",
  "pnl_gbp",
  "pnl",
  "placed_result",
  "certified_keep",
  "certified",
  "gate_verdict",
  "side",
  "lab_status",
  "date",
  "unmatched",
  "unmatched_size",
  "atb_size_gbp",
  "phase",
  "in_play",
  "off_ts",
  "off_time",
  "horse",
  "runner",
  "horse_name",
  "runner_name",
  "selection_name",
  "sel_name",
  "title",
] as const;

export const BOOK_INGEST_KEYS = [...BOOK_CORE_FILL_KEYS, ...BOOK_SPICE_KEYS] as const;

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
  /** Plant book race context — present when ingested from book.jsonl. */
  spice?: FillSpice;
  /** Plant invent scale on this fill — wide | mid | nugget when stamped on book. */
  inventScale?: import("./stamp.ts").InventScale | null;
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
  if (status === "OPEN" || status === "PENDING" || status === "WAITING" || status === "UNMATCHED") {
    return "waiting";
  }
  if (status === "VOID") return "void";
  const signedPnl = pnlInU(row);
  if (signedPnl != null && signedPnl !== 0) {
    if (row.placed_result === true) return "won";
    if (row.placed_result === false) return "lost";
    return signedPnl > 0 ? "won" : "lost";
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

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s || null;
}

function intOrNull(v: unknown): number | null {
  const n = num(v);
  return n == null ? null : Math.trunc(n);
}

function inventScaleOfRow(row: Record<string, unknown>): import("./stamp.ts").InventScale | null {
  const raw = row.invent_scale ?? row.inventScale;
  if (typeof raw !== "string") return null;
  const s = raw.trim().toLowerCase();
  if (s === "wide" || s === "mid" || s === "nugget") return s;
  return null;
}

/** Pull plant book spices from a raw row — never invents; all-null when absent. */
export function spiceFromRow(row: Record<string, unknown>): FillSpice {
  return {
    course: strOrNull(row.course),
    race_type: strOrNull(row.race_type),
    going: strOrNull(row.going),
    surface: strOrNull(row.surface),
    distance_m: intOrNull(row.distance_m),
    field_size: intOrNull(row.field_size),
    card_join: strOrNull(row.card_join),
    country: strOrNull(row.country),
    window: strOrNull(row.window),
    market_type: strOrNull(row.market_type),
    race_id: strOrNull(row.race_id),
  };
}

/** Muted Trades subline — course excluded (shown on its own). */
export function fillSpiceLine(spice: FillSpice): string | null {
  const parts: string[] = [];
  if (spice.race_type) parts.push(spice.race_type);
  if (spice.going) parts.push(spice.going);
  if (spice.surface) parts.push(spice.surface);
  if (spice.distance_m != null) parts.push(`${spice.distance_m}m`);
  if (spice.field_size != null) parts.push(`fld ${spice.field_size}`);
  if (spice.window) parts.push(spice.window);
  if (spice.country) parts.push(spice.country);
  if (spice.market_type) parts.push(spice.market_type);
  return parts.length ? parts.join(" · ") : null;
}

export function slimBookRow(row: Record<string, unknown>): Record<string, unknown> {
  const slim: Record<string, unknown> = {};
  for (const k of BOOK_INGEST_KEYS) {
    if (row[k] !== undefined) slim[k] = row[k];
  }
  return slim;
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
    spice: spiceFromRow(row),
    inventScale: inventScaleOfRow(row),
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
  const pnl = fill.pnl;
  if (pnl != null && pnl !== 0) return pnl > 0 ? "Won" : "Lost";
  if (fill.result === "void" || pnl == null || pnl === 0) return "Void";
  return EMPTY;
}

/** Ticket as a board row. Open P&L is Empty until settled. */
export function fillDeskRow(fill: Fill, fuseOn: boolean, recipes: readonly Recipe[] = []): DeskRow {
  const tape = tapePnl(fill, fuseOn);
  const isOpen = fill.result === "waiting";
  const time = bookedClock(fill.ts, fill.t);
  const oddsStr = fmtOdds(fill.odds);
  const stakeStr = fmtStake(fill.stake);
  const rawSide = (fill.side ?? "").toUpperCase();
  const sideStr =
    rawSide === "BACK" || rawSide === "LAY" ? rawSide : deskStampedSide(fill.recipeId, fill.recipe);
  const pending = (value: string) => (value && value !== EMPTY ? value : isOpen ? WAITING : EMPTY);
  const recipe = recipes.find((r) => r.id === fill.recipeId.split("|")[0]);
  const band = nuggetOddsBand(fill.odds);
  const oddsCell =
    oddsStr !== EMPTY ? oddsStr : band ? oddsBandShort(band) : isOpen ? WAITING : EMPTY;
  return {
    id: fill.id,
    time: pending(time),
    horse: deskHorseName(fill.horse),
    hole: compactHoleFromParts(fill.recipeId, fill.recipe, recipe?.region),
    odds: pending(oddsCell),
    course: truncateCourse(fill.spice?.course),
    card: cardSliceFromSpice(fill.spice),
    side: sideStr !== EMPTY ? sideStr : EMPTY,
    stake: pending(stakeStr === EMPTY ? "" : stakeStr),
    result: fillResultWord(fill),
    pnl: isOpen ? null : tape.pnl,
    holdingId: fill.recipeId.split("|")[0],
  };
}

/** Recipe armed with no fill. Market from hole; Side only when stamped (LAY recipe, etc.). */
export function waitDeskRow(chip: WaitOpen): DeskRow {
  const stamped = deskStampedSide(chip.id, chip.title);
  return {
    id: chip.id,
    time: WAITING,
    horse: EMPTY,
    hole: compactHoleFromParts(chip.id, chip.title),
    odds: WAITING,
    course: EMPTY,
    card: EMPTY,
    side: stamped !== EMPTY ? stamped : EMPTY,
    stake: WAITING,
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

/** Open tickets on today's tape — mill-void packs hidden; occupancy uses raw openFills. */
export function honestOpenFills(fills: readonly Fill[], _recipes: readonly Recipe[] = []): Fill[] {
  const junk = junkFillIds(fills);
  return openFills(fills).filter((f) => !junk.has(f.id));
}

/** Settled rows on today's tape — mill-void packs excluded from paper u. */
export function honestSettledFills(fills: readonly Fill[], _recipes: readonly Recipe[] = []): Fill[] {
  const junk = junkFillIds(fills);
  return settledFills(fills).filter((f) => !junk.has(f.id));
}

/** Today's mill tape row — Hyde/fast legacy and pre-reset days only. No epoch archaeology. */
export function isHydeFastLegacyFill(fill: Fill): boolean {
  return /^H-hyde-/i.test(fill.recipeId) || /^H-fast-/i.test(fill.recipeId);
}

export function isPreResetDayFill(fill: Fill): boolean {
  return fill.day < BOARD_RESET_DAY;
}

/** Mill book row eligible for Trades groups (Open / Settled / Void). */
export function isMillDeskTradeFill(fill: Fill): boolean {
  if (isHydeFastLegacyFill(fill)) return false;
  if (isPreResetDayFill(fill)) return false;
  return true;
}

/** @deprecated use isMillDeskTradeFill */
export function isMillTapeFill(fill: Fill): boolean {
  return isMillDeskTradeFill(fill);
}

/** Trades › Settled / Void candidates — today's first-book tape only. */
export function tradesSettledCandidateFills(
  fills: readonly Fill[],
  _recipes: readonly Recipe[] = [],
): Fill[] {
  return settledFills(fills).filter(isFirstBookTapeFill);
}

/** Trades › Open — first-book OPEN rows on today's tape. */
export function tradesMillOpenFills(
  fills: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): Fill[] {
  return honestOpenFills(fillsOnDay(fills, day), recipes).filter(isFirstBookTapeFill);
}

/** Trades settled — Hyde / fast / legacy morning tape hidden. */
export function honestFirstBookSettledFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledCandidateFills(fills, recipes);
}

/** Signed P&L on Trades › Settled — Floor paper u, win·lose, Office roll-ups. */
export function tradesSettledTapeFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  const spray = fieldSprayFillIds(fills);
  const junk = junkFillIds(fills);
  return tradesSettledCandidateFills(fills, recipes)
    .filter(isCountableSettledFill)
    .filter((f) => !spray.has(f.id) && !junk.has(f.id));
}

/** VOID / 0u on Trades — not wins, losses, or Floor paper. */
export function tradesSettledVoidFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledCandidateFills(fills, recipes).filter((f) => !isCountableSettledFill(f));
}

/** @deprecated Use tradesSettledTapeFills — same tape as Trades › Settled. */
export function countableFirstBookSettledFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledTapeFills(fills, recipes);
}

/** @deprecated Use tradesSettledVoidFills. */
export function voidFirstBookSettledFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledVoidFills(fills, recipes);
}

/** Signed settled row on Trades › Settled — Floor and Office use the same gate. */
export function isCountableSettledFill(fill: Fill): boolean {
  if (fill.result === "void") return false;
  const pnl = fill.pnl;
  if (pnl == null || pnl === 0) return false;
  return true;
}

/** Trades open — today's first-book tape, Hyde/fast off. */
export function honestFirstBookOpenFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return honestOpenFills(fills, recipes).filter(isFirstBookTapeFill);
}

/** Paper settles that contribute to the day u total. */
export function paperSettledFills(fills: readonly Fill[], recipes: readonly Recipe[] = []): Fill[] {
  return honestSettledFills(fills, recipes).filter((f) => f.book === "paper" && f.result !== "void");
}

/** Hyde / fast / legacy tape — not today's post-epoch first-book. */
export function isFirstBookPaperFill(fill: Fill): boolean {
  if (/^H-hyde-/i.test(fill.recipeId) || /^H-fast-/i.test(fill.recipeId)) return false;
  if (isPostEpochEholeRecipe({ id: fill.recipeId, title: fill.recipe })) return true;
  return recipeIsPostEpoch({ id: fill.recipeId, title: fill.recipe } as Recipe);
}

/** Open or settled on today's mill tape — post-epoch ehole first-book only. */
export function isFirstBookTapeFill(fill: Fill): boolean {
  if (/^H-hyde-/i.test(fill.recipeId) || /^H-fast-/i.test(fill.recipeId)) return false;
  if (fill.result === "waiting") {
    return isPostEpochEholeRecipe({ id: fill.recipeId, title: fill.recipe });
  }
  return isFirstBookPaperFill(fill);
}

/** Settled paper from post-epoch ehole first-books only — matches Office strategies. */
export function firstBookPaperSettledFills(fills: readonly Fill[], recipes: readonly Recipe[] = []): Fill[] {
  return paperSettledFills(fills, recipes).filter(isFirstBookPaperFill);
}

/** Win / lose tallies from settled tape — by signed P&L, not exchange labels. */
export type SettledTradeCounts = { wins: number; losses: number };

/** Count settled rows with P&L &gt; 0 as win, &lt; 0 as lose. Skips zero P&amp;L. */
export function settledTradeCountsFromFills(fills: readonly Fill[]): SettledTradeCounts | null {
  if (!fills.length) return null;
  let wins = 0;
  let losses = 0;
  for (const f of fills) {
    const pnl = f.pnl ?? 0;
    if (pnl > 0) wins++;
    else if (pnl < 0) losses++;
  }
  if (wins === 0 && losses === 0) return null;
  return { wins, losses };
}

/** UK copy for win · lose counts — Empty when no settled trades. */
export function fmtWinLoseCounts(counts: SettledTradeCounts | null): string {
  if (!counts) return EMPTY;
  return `${counts.wins} win · ${counts.losses} lose`;
}

/** W–L · n for Office — Empty when no settled trades. */
export function fmtSettledWlN(counts: SettledTradeCounts | null): string {
  if (!counts) return EMPTY;
  const n = counts.wins + counts.losses;
  return `${counts.wins}–${counts.losses} · n=${n}`;
}

/**
 * Archive mill history off the live board — focal day keeps first-book tape rows only.
 * Hyde, occupancy leftovers, and full-day book.jsonl settles stay off Trades/Floor/Office.
 */
export function archiveTradesTape(
  trades: readonly Fill[],
  day: string,
  _recipes: readonly Recipe[] = [],
): Fill[] {
  const spray = fieldSprayFillIds(trades);
  const junk = junkFillIds(trades);
  const out: Fill[] = [];
  for (const f of trades) {
    if (isHydeFastLegacyFill(f) || isPreResetDayFill(f)) continue;
    if (f.day !== day) {
      out.push(f);
      continue;
    }
    if (!isFirstBookTapeFill(f)) continue;
    if (spray.has(f.id) || junk.has(f.id)) continue;
    out.push(f);
  }
  return out.sort((a, b) => b.ts.localeCompare(a.ts));
}

/** Parsed fills through archive gate — ingest boundary for Trades/Floor/Office. */
export function ingestMillFills(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): Fill[] {
  return archiveTradesTape(trades, day, recipes);
}

/**
 * Oracle ingest — when today's desk tape already exists, poll-merge blocks mill stamp
 * settled bloat; otherwise first-book archive only.
 */
export function mergeOracleTape(
  prev: readonly Fill[],
  incoming: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): Fill[] {
  const hasToday = prev.some((f) => f.day === day);
  const merged = hasToday ? mergeMillTradesTape(prev, incoming, day) : incoming;
  return ingestMillFills(merged, day, recipes);
}

/** One roll-up for Trades › Settled, Floor paper tile, Trades header, and Office. */
export type DeskSettledTapeRollup = {
  fills: Fill[];
  u: number | null;
  counts: SettledTradeCounts | null;
  countsLine: string;
};

/** Signed settles on the desk tape — never stamp trends or mill occupancy. */
export function deskSettledTapeRollup(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): DeskSettledTapeRollup {
  const fills = tradesSettledTapeFills(fillsOnDay(trades, day), recipes);
  const counts = settledTradeCountsFromFills(fills);
  const u = fills.length ? fills.reduce((acc, f) => acc + (f.pnl ?? 0), 0) : null;
  return {
    fills,
    u,
    counts,
    countsLine: fmtWinLoseCounts(counts),
  };
}

/** All settled first-book rows on tape — Office cumulative strategy P&L (not calendar day). */
export function officeCumulativeTapeFills(
  trades: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledTapeFills(trades, recipes);
}

/** Floor tile win·lose/u must match Trades › Settled — throws when they diverge. */
export function assertDeskTapeFloorAligns(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[],
  floorU: number | null,
  floorCounts: SettledTradeCounts | null,
): void {
  const rollup = deskSettledTapeRollup(trades, day, recipes);
  const wonOnTape = rollup.fills.filter((f) => (f.pnl ?? 0) > 0).length;
  if (floorU !== rollup.u) {
    throw new Error(`Floor u ${floorU} !== tape ${rollup.u}`);
  }
  if (
    floorCounts?.wins !== rollup.counts?.wins ||
    floorCounts?.losses !== rollup.counts?.losses
  ) {
    throw new Error(
      `Floor ${floorCounts?.wins} win · ${floorCounts?.losses} lose !== tape ${rollup.counts?.wins} win · ${rollup.counts?.losses} lose (${wonOnTape} Won rows)`,
    );
  }
}

function fillTapeCell(fill: Fill): string {
  return fill.recipeId.split("|")[0] ?? fill.recipeId;
}

/** Pick ids and hole cells already on today's desk tape — not full book.jsonl occupancy. */
export function tapeScopeForDay(trades: readonly Fill[], day: string): {
  pickIds: Set<string>;
  cells: Set<string>;
} {
  const pickIds = new Set<string>();
  const cells = new Set<string>();
  for (const f of trades) {
    if (f.day !== day) continue;
    pickIds.add(f.id);
    const cell = fillTapeCell(f);
    if (cell) cells.add(cell);
  }
  return { pickIds, cells };
}

function tapeScopeHit(
  fill: Fill,
  scope: { pickIds: Set<string>; cells: Set<string> },
): boolean {
  return scope.pickIds.has(fill.id) || scope.cells.has(fillTapeCell(fill));
}

/**
 * Patch today's tape from book — refresh rows already on tape only.
 * Never grow today's settled set from full-day book.jsonl.
 */
export function refreshTapeFromBook(
  tapeTrades: readonly Fill[],
  bookFills: readonly Fill[],
  day: string,
): Fill[] {
  const byId = new Map<string, Fill>();
  for (const f of tapeTrades) byId.set(f.id, f);
  for (const f of bookFills) {
    if (f.day !== day || !isFirstBookTapeFill(f)) continue;
    if (byId.has(f.id)) byId.set(f.id, f);
  }
  return [...byId.values()].sort((a, b) => b.ts.localeCompare(a.ts));
}

/**
 * Seed desk tape from book.jsonl across calendar day roll.
 * Prior-day OPEN first-books move to deskDay; prior-day Settled stay on book day for trends.
 */
export function seedTapeFromBook(
  tapeTrades: readonly Fill[],
  bookFills: readonly Fill[],
  deskDay: string,
  _recipes: readonly Recipe[] = [],
): Fill[] {
  const byId = new Map<string, Fill>();

  for (const f of tapeTrades) {
    if (f.day !== deskDay) byId.set(f.id, f);
  }
  for (const f of tapeTrades) {
    if (f.day === deskDay) byId.set(f.id, f);
  }

  for (const f of bookFills) {
    if (!isFirstBookTapeFill(f) || isHydeFastLegacyFill(f) || isPreResetDayFill(f)) continue;

    if (f.day === deskDay) {
      if (f.result === "waiting") {
        byId.set(f.id, f);
        continue;
      }
      if (byId.has(f.id)) {
        byId.set(f.id, f);
        continue;
      }
      if (!isCountableSettledFill(f)) {
        byId.set(f.id, f);
      }
      continue;
    }

    if (f.day < deskDay) {
      if (f.result === "waiting") {
        byId.set(f.id, { ...f, day: deskDay });
      } else {
        byId.set(f.id, f);
      }
    }
  }

  return [...byId.values()].sort((a, b) => b.ts.localeCompare(a.ts));
}

/** @deprecated use refreshTapeFromBook */
export function patchTapeWithBookSettledSigned(
  tapeTrades: readonly Fill[],
  bookFills: readonly Fill[],
  day: string,
): Fill[] {
  return refreshTapeFromBook(tapeTrades, bookFills, day);
}

/** @deprecated use patchTapeWithBookSettledSigned */
export function reconcileTodayTradesWithBook(
  stampTrades: readonly Fill[],
  bookFills: readonly Fill[],
  day: string,
): Fill[] {
  return patchTapeWithBookSettledSigned(stampTrades, bookFills, day);
}

/**
 * Client poll merge — today's tape is canonical. Refresh opens/voids from stamp; keep
 * SETTLED signed rows if a tick drops them; reject bloated mill history not on prev tape.
 */
export function mergeMillTradesTape(
  prev: readonly Fill[],
  next: readonly Fill[],
  day: string,
): Fill[] {
  const prevToday = prev.filter((f) => f.day === day);
  const prevIds = new Set(prevToday.map((f) => f.id));
  const byId = new Map<string, Fill>();

  for (const f of prev) {
    if (f.day !== day) byId.set(f.id, f);
  }
  for (const f of prevToday) byId.set(f.id, f);

  for (const f of next) {
    if (f.day !== day) {
      byId.set(f.id, f);
      continue;
    }
    if (prevIds.has(f.id)) {
      byId.set(f.id, f);
      continue;
    }
    if (f.result === "waiting" && isFirstBookTapeFill(f)) {
      byId.set(f.id, f);
      continue;
    }
    if (!isCountableSettledFill(f) && isFirstBookTapeFill(f)) {
      byId.set(f.id, f);
      continue;
    }
    // Do not grow today's settled tape from poll bloat or archived mill history.
  }

  for (const f of prevToday) {
    if (!isCountableSettledFill(f)) continue;
    const n = next.find((x) => x.day === day && x.id === f.id);
    if (!n || !isCountableSettledFill(n)) byId.set(f.id, f);
  }

  return [...byId.values()].sort((a, b) => b.ts.localeCompare(a.ts));
}

export type MillSettledNeedle = {
  horse?: string;
  cellId?: string;
  pickId?: string;
};

/** Fail closed — missing mill SETTLED signed row throws (not Empty). */
export function assertMillSettledSignedPresent(
  trades: readonly Fill[],
  day: string,
  needles: readonly MillSettledNeedle[],
  recipes: readonly Recipe[] = [],
): void {
  const tape = tradesSettledTapeFills(fillsOnDay(trades, day), recipes);
  for (const needle of needles) {
    const hit = tape.some((f) => {
      if (needle.horse && f.horse?.toLowerCase().includes(needle.horse.toLowerCase())) return true;
      if (needle.cellId && f.recipeId.includes(needle.cellId)) return true;
      if (needle.pickId && f.id.includes(needle.pickId)) return true;
      return false;
    });
    if (!hit) {
      throw new Error(`Missing mill SETTLED signed row on tape: ${JSON.stringify(needle)}`);
    }
  }
}

/** Settled paper u for one day — Floor tile and Office row sum. Same tape as Trades settled. */
export function settledPaperDayU(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): number | null {
  return deskSettledTapeRollup(trades, day, recipes).u;
}

/** Win · lose counts for today's settled first-book — same tape as settledPaperDayU. */
export function settledPaperDayCounts(
  trades: readonly Fill[],
  day: string,
  recipes: readonly Recipe[] = [],
): SettledTradeCounts | null {
  return deskSettledTapeRollup(trades, day, recipes).counts;
}

/** Settled first-book production fills — same tape rules as paper. */
export function firstBookProductionSettledFills(
  fills: readonly Fill[],
  recipes: readonly Recipe[] = [],
): Fill[] {
  return tradesSettledTapeFills(fills, recipes).filter((f) => f.book === "production");
}

/** Today's settled paper u for one strategy/book — null when no settles (Empty). */
export function settledPaperUForRecipeIds(
  trades: readonly Fill[],
  day: string,
  recipeIds: ReadonlySet<string>,
  recipes: readonly Recipe[] = [],
): number | null {
  if (!recipeIds.size) return null;
  const paper = tradesSettledTapeFills(fillsOnDay(trades, day), recipes).filter(
    (f) => f.book === "paper" && recipeIds.has(f.recipeId),
  );
  if (!paper.length) return null;
  return paper.reduce((acc, f) => acc + (f.pnl ?? 0), 0);
}

/** Win · lose counts for one strategy's settled first-book paper fills. */
export function settledPaperCountsForRecipeIds(
  trades: readonly Fill[],
  day: string,
  recipeIds: ReadonlySet<string>,
  recipes: readonly Recipe[] = [],
): SettledTradeCounts | null {
  if (!recipeIds.size) return null;
  const paper = tradesSettledTapeFills(fillsOnDay(trades, day), recipes).filter(
    (f) => f.book === "paper" && recipeIds.has(f.recipeId),
  );
  return settledTradeCountsFromFills(paper);
}

/** Win · lose counts for one strategy's settled first-book production fills. */
export function settledProductionCountsForRecipeIds(
  trades: readonly Fill[],
  day: string,
  recipeIds: ReadonlySet<string>,
  recipes: readonly Recipe[] = [],
): SettledTradeCounts | null {
  if (!recipeIds.size) return null;
  const prod = tradesSettledTapeFills(fillsOnDay(trades, day), recipes).filter(
    (f) => f.book === "production" && recipeIds.has(f.recipeId),
  );
  return settledTradeCountsFromFills(prod);
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
  const paperSettled = tradesSettledTapeFills(dayFills, recipes).filter((f) => f.book === "paper");
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

export function recipeForFill(recipes: readonly Recipe[], fill: Fill): Recipe | undefined {
  return recipes.find((r) => r.id === fill.recipeId);
}

export function fillTradeName(fill: Fill, recipes: readonly Recipe[] = []): string {
  return tradeName(fill, recipeForFill(recipes, fill));
}

/** Day's tape totals from signed settles — paper line is full tape u (all books). */
export function dayTapePnl(fills: readonly Fill[], fuseOn: boolean) {
  const sum = (rows: readonly Fill[]) =>
    rows.length ? rows.reduce((acc, f) => acc + (f.pnl ?? 0), 0) : null;
  const production = fills.filter((f) => f.book === "production");
  const live = fills.filter((f) => f.book === "live");
  return {
    paper: sum(fills),
    production: sum(production),
    live: fuseOn ? sum(live) : 0,
  };
}
