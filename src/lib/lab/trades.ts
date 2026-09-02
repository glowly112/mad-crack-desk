/** Display mapping for the clerk book. Never invents tickets or sums P&L. */

import { prettyTitle } from "./desk.ts";

export type FillBook = "paper" | "production" | "live";
export type FillResult = "won" | "lost" | "void" | "waiting";

export type Fill = {
  id: string;
  ts: string;
  t: string;
  recipe: string;
  recipeId: string;
  market: string;
  book: FillBook;
  odds: number | null;
  stake: number | null;
  result: FillResult;
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
  if (status === "OPEN" || status === "PENDING" || status === "WAITING") return "waiting";
  if (row.placed_result === true) return "won";
  if (row.placed_result === false) return "lost";
  if (status === "SETTLED") return "void";
  return "waiting";
}

export function fillFromRow(raw: unknown): Fill | null {
  const row = rec(raw);
  if (!row) return null;
  const id = String(row.pick_id || row.id || "").trim();
  const ts = String(row.ts || row.settled_ts || "");
  const cell = String(row.cell_id || row.recipeId || "");
  if (!id && !ts && !cell) return null;
  const title = prettyTitle(String(row.title || cell || id));
  const odds = num(row.odds);
  const pnl = num(row.paper_pnl_gbp) ?? num(row.pnl_gbp) ?? num(row.pnl);
  return {
    id: id || `${cell}:${ts}`,
    ts,
    t: clock(ts),
    recipe: title || cell || "Empty",
    recipeId: cell,
    market: marketOf(title || cell, odds),
    book: bookOf(row),
    odds,
    stake: num(row.stake_gbp) ?? num(row.paper_stake_gbp),
    result: resultOf(row),
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

/** Live P&L is 0 while the fuse is off. Paper P&L is never income. */
export function tapePnl(fill: Fill, fuseOn: boolean): { pnl: number | null; caption: string | null } {
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
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
