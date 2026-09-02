/** Display mapping for the clerk book. Never invents tickets or sums P&L. */

import { cellName } from "./desk.ts";

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

/** A real clock. Never Empty. */
export function bookedClock(...raws: Array<string | null | undefined>): string {
  for (const raw of raws) {
    if (!raw || raw === "Empty") continue;
    const iso = /T(\d{2}:\d{2})(?::(\d{2}))?/.exec(raw);
    if (iso) return iso[2] ? `${iso[1]}:${iso[2]}` : `${iso[1]}:00`;
    const hm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(raw.trim());
    if (hm) {
      const hh = hm[1].padStart(2, "0");
      return hm[3] ? `${hh}:${hm[2]}:${hm[3]}` : `${hh}:${hm[2]}`;
    }
  }
  return "";
}

function clock(ts: string): string {
  return bookedClock(ts);
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
  const pnl = num(row.paper_pnl_gbp) ?? num(row.pnl_gbp) ?? num(row.pnl);
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

export function fillsOnDay(fills: readonly Fill[], day: string): Fill[] {
  return fills.filter((f) => f.day === day);
}

export function openFills(fills: readonly Fill[]): Fill[] {
  return fills.filter((f) => f.result === "waiting");
}

export function settledFills(fills: readonly Fill[]): Fill[] {
  return fills.filter((f) => f.result !== "waiting");
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
