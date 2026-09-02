/** Display mapping for the clerk book. Never invents tickets or sums P&L. */

import { cellName } from "./desk.ts";

export type FillBook = "paper" | "production" | "live";
export type FillResult = "won" | "lost" | "void" | "waiting";
export type Flight = "waiting result" | "unmatched" | "in-play" | "waiting for races";

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
  unmatched: number | null;
  off: string | null;
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

function clock(ts: string): string {
  const m = /T(\d{2}:\d{2}:\d{2})/.exec(ts);
  if (m) return m[1];
  if (/^\d{2}:\d{2}/.test(ts)) return ts.slice(0, 8);
  return ts;
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
  if (num(row.unmatched) || num(row.unmatched_size)) return "unmatched";
  if (row.in_play === true || /in.?play/i.test(String(row.phase ?? ""))) return "in-play";
  if (/wait_open|waiting for races/i.test(`${row.gate_verdict ?? ""} ${row.chip ?? ""}`)) {
    return "waiting for races";
  }
  if (status === "UNMATCHED") return "unmatched";
  if (status === "OPEN" || status === "PENDING" || status === "WAITING" || row.placed_result == null) {
    return "waiting result";
  }
  return null;
}

export function fillFromRow(raw: unknown): Fill | null {
  const row = rec(raw);
  if (!row) return null;
  const id = String(row.pick_id || row.id || "").trim();
  const ts = String(row.ts || row.settled_ts || "");
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
    t: clock(ts),
    day,
    recipe: title || "Empty",
    recipeId: cell,
    market: marketOf(title || cell, odds),
    book: bookOf(row),
    side: typeof row.side === "string" && row.side ? String(row.side).toUpperCase() : null,
    odds,
    stake: num(row.stake_gbp) ?? num(row.paper_stake_gbp),
    result: resultOf(row),
    flight: flightOf(row),
    unmatched: num(row.unmatched) ?? num(row.unmatched_size),
    off: clock(String(row.off_ts || row.off_time || "")) || null,
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
