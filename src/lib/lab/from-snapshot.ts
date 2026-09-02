import type { LiveStamp } from "./from-digest.ts";
import { cellName } from "./desk.ts";
import type { Badge, Chip, Recipe } from "./stamp.ts";
import { parseFills, parseWaitOpen } from "./trades.ts";

const REGIONS = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;
const BADGES: Badge[] = ["Solid", "Research", "Parked", "Dead"];
const CHIPS: Chip[] = ["Waiting for races", "Booking", "On tape today"];
const RECIPE_CAP = 8;

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

function int(v: unknown): number | null {
  const n = num(v);
  return n == null ? null : Math.trunc(n);
}

function isPlantSnap(raw: Record<string, unknown>): boolean {
  return Boolean(
    raw.truth ||
      raw.cells ||
      raw.firm_cells ||
      raw.summary ||
      raw.liveMoney ||
      raw.boardUx ||
      raw.snapshot ||
      raw.n_solid != null ||
      raw.paper_live_day_u !== undefined ||
      raw.production_score_u !== undefined,
  );
}

function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = rec(raw.snapshot);
  if (!inner) return raw;
  return {
    ...inner,
    ...raw,
    cells: raw.cells ?? inner.cells,
    truth: raw.truth ?? inner.truth,
    summary: raw.summary ?? inner.summary,
    liveMoney: raw.liveMoney ?? inner.liveMoney ?? inner.money,
    boardUx: raw.boardUx ?? inner.boardUx,
    paperLive: raw.paperLive ?? inner.paperLive,
  };
}

function statusOf(cell: Record<string, unknown>): Recipe["status"] {
  const s = String(cell.status || "").toUpperCase();
  if (s === "KEEP" || s === "KEPT") return "KEEP";
  if (s === "MEASURING") return "MEASURING";
  if (s === "KILL" || s === "DROPPED") return "KILL";
  return "HUNTING";
}

function regionOf(title: string): Recipe["region"] {
  const t = title.toUpperCase();
  for (const r of REGIONS) {
    if (new RegExp(`\\b${r}\\b`).test(t)) return r;
  }
  return "AU";
}

function badgeOf(cell: Record<string, unknown>, status: Recipe["status"]): Badge {
  const b = cell.keep_badge;
  if (typeof b === "string" && (BADGES as string[]).includes(b)) return b as Badge;
  if (status === "KEEP") return "Parked";
  if (status === "KILL") return "Dead";
  return "Research";
}

function chipOf(cell: Record<string, unknown>): Chip {
  const c = cell.status_chip ?? cell.chip;
  if (typeof c === "string" && (CHIPS as string[]).includes(c)) return c as Chip;
  const blob = `${cell.status_chip ?? ""} ${cell.chip ?? ""} ${cell.live_gate ?? ""} ${cell.why ?? ""}`.toLowerCase();
  if (/wait_open|waiting for races/.test(blob)) return "Waiting for races";
  if (/on tape|on_tape/.test(blob)) return "On tape today";
  if (/booking/.test(blob)) return "Booking";
  if (cell.certified === true && cell.live !== true) return "Waiting for races";
  return null;
}

function cellsOf(raw: Record<string, unknown>): Record<string, unknown>[] {
  const list = Array.isArray(raw.cells)
    ? raw.cells
    : Array.isArray(raw.firm_cells)
      ? raw.firm_cells
      : [];
  return list.filter((c): c is Record<string, unknown> => Boolean(rec(c)));
}

function recipesFromCells(cells: Record<string, unknown>[]): Recipe[] {
  const keep: Recipe[] = [];
  const measuring: Recipe[] = [];
  for (const c of cells) {
    const status = statusOf(c);
    if (status !== "KEEP" && status !== "MEASURING") continue;
    const score = rec(c.score) ?? {};
    const stats = rec(c.stats) ?? {};
    const id = String(c.id || c.title || "").trim();
    if (!id) continue;
    const title = cellName(id, String(c.title || ""));
    const n = int(c.n) ?? int(score.n_size_ok) ?? int(c.n_size_ok) ?? 0;
    const roi = num(stats.roi) ?? num(score.roi_size_ok_pct) ?? num(c.roi) ?? 0;
    const pnl = num(c.pnl) ?? num(score.honest_pnl_size_ok) ?? num(c.freezePnl) ?? 0;
    const why =
      typeof c.why === "string" && c.why
        ? c.why
        : status === "KEEP"
          ? "Research keep. Not certified. Not the score."
          : "Still proving. Not the score.";
    const recipe: Recipe = {
      id,
      title,
      region: regionOf(title),
      status,
      badge: badgeOf(c, status),
      chip: chipOf(c),
      n,
      roi,
      freezePnl: pnl,
      why,
    };
    if (status === "KEEP") keep.push(recipe);
    else measuring.push(recipe);
  }
  keep.sort((a, b) => Number(b.badge === "Solid") - Number(a.badge === "Solid"));
  return [...keep, ...measuring].slice(0, RECIPE_CAP);
}

/**
 * Overlay a live oracle snapshot (Linear / local_api / firm scoreboard) onto a
 * digest-applied stamp. Never treats KEEP paper (pnlTotal) as the production score.
 */
function seatKey(name: string): string {
  return name.toLowerCase().replace(/^dr\.?\s*/, "").replace(/\s+/g, "");
}

export function applySnapshot(raw: unknown, base: LiveStamp): LiveStamp {
  const opened = rec(raw);
  if (!opened || !isPlantSnap(opened)) return base;
  const snap = unwrap(opened);

  const truth = rec(snap.truth) ?? {};
  const summary = rec(snap.summary) ?? snap;
  const by = rec(summary.by_status) ?? {};
  const liveMoney = rec(snap.liveMoney) ?? rec(snap.live_fast);
  const boardUx = rec(snap.boardUx) ?? rec(snap.board_ux);
  const paperLive = rec(snap.paperLive) ?? rec(snap.paper_live);
  const scaling = rec(rec(snap.trading_floor)?.scaling_desk) ?? rec(snap.scaling_desk);
  const pipeline = rec(rec(snap.trading_floor)?.pipeline) ?? rec(snap.pipeline);

  const keep =
    int(truth.keep) ?? int(summary.n_keep) ?? int(snap.n_keep) ?? int(by.KEEP) ?? base.counts.keep;
  const measuring =
    int(truth.measuring) ?? int(summary.n_measuring) ?? int(by.MEASURING) ?? base.counts.measuring;
  const hunting = int(truth.gathering) ?? int(by.HUNTING) ?? base.counts.hunting;
  const kill = int(truth.dropped) ?? int(by.KILL) ?? int(snap.n_kill) ?? base.counts.kill;

  const nSolidExplicit =
    int(boardUx?.n_solid) ??
    int(snap.n_solid) ??
    int(summary.n_certified_keep) ??
    int(summary.n_distinct_certified_keep) ??
    int(scaling?.n_certified_keep);

  const day_u =
    num(paperLive?.day_u) ??
    num(snap.paper_live_day_u) ??
    num(snap.production_score_u) ??
    num(boardUx?.hero_u) ??
    num(scaling?.paper_live_day_u) ??
    base.hero.day_u;

  let fuse_on = base.fuse_on;
  if (liveMoney) {
    fuse_on = Boolean(liveMoney.live_on) && Boolean(liveMoney.place_on ?? liveMoney.place_orders);
  } else if (snap.fuse_live === false || snap.live === false) {
    fuse_on = false;
  } else if (typeof boardUx?.fuse === "string") {
    fuse_on = /real betting:\s*on/i.test(boardUx.fuse) || boardUx.fuse.toUpperCase() === "ON";
  }

  const researchKeepGbp =
    num(snap.pnlTotal) ?? num(summary.keep_pnl_gbp) ?? num(summary.keep_pnl_now_gbp) ?? base.researchKeepGbp;

  const recipes = recipesFromCells(cellsOf(snap));
  const solids = recipes.filter((r) => r.badge === "Solid");
  const n_solid = nSolidExplicit ?? (recipes.length ? solids.length : base.n_solid);

  const date =
    typeof snap.date === "string" && snap.date
      ? snap.date
      : typeof snap.day === "string" && snap.day
        ? snap.day
        : base.day;
  const generated =
    (typeof snap.generatedAt === "string" && snap.generatedAt) ||
    (typeof snap.generated_at_utc === "string" && snap.generated_at_utc) ||
    (typeof snap.ts === "string" && snap.ts) ||
    base.generated;

  const trends = base.trends.map((t) => {
    if (t.day !== date) return t;
    return {
      ...t,
      n_keep: keep,
      n_measuring: measuring,
      n_dropped: kill,
      n_solid,
      paper_live_day_u: nSolidExplicit != null ? day_u : t.paper_live_day_u,
    };
  });

  return {
    ...base,
    day: date,
    generated,
    source: "oracle",
    n_solid,
    fuse_on,
    fuse: fuse_on ? "Real betting: ON" : "Real betting: OFF",
    researchKeepGbp,
    hero: {
      ...base.hero,
      day_u,
    },
    counts: {
      ...base.counts,
      keep,
      certified: n_solid,
      measuring,
      hunting,
      kill,
      cells: keep + measuring + hunting + kill,
    },
    pipe: {
      pitched: int(pipeline?.pitched) ?? base.pipe.pitched,
      proving: int(pipeline?.proving) ?? measuring,
      closed: int(pipeline?.closed) ?? base.pipe.closed,
      certified: n_solid,
      scaling: int(pipeline?.scaling) ?? int(scaling?.n_scaling) ?? base.pipe.scaling,
    },
    recipes: recipes.length ? recipes : base.recipes,
    solids: recipes.length ? solids : n_solid > 0 ? base.solids : [],
    seats: overlaySeats(base.seats, snap),
    trends,
    trades: Array.isArray(snap.fills) ? parseFills(snap.fills) : base.trades,
    wait_open: Array.isArray(snap.wait_open) ? parseWaitOpen(snap.wait_open) : (base.wait_open ?? []),
    holes: holesFromSnap(snap) ?? base.holes,
    office: {
      ...base.office,
      rejects: rejectsFromSnap(snap) ?? base.office.rejects,
    },
  };
}

function holesFromSnap(snap: Record<string, unknown>): LiveStamp["holes"] | null {
  const raw = snap.holes ?? snap.matrix ?? snap.occupancy ?? snap.mercator_holes;
  if (!Array.isArray(raw)) return null;
  const out: LiveStamp["holes"] = [];
  for (const row of raw) {
    const r = rec(row);
    if (!r) continue;
    const region = String(r.region ?? r.country ?? "").toUpperCase();
    const window = String(r.window ?? r.phase ?? "");
    const market = String(r.market ?? r.side ?? "").toUpperCase();
    if (!region || !window || !market) continue;
    const tone = typeof r.tone === "string" ? r.tone : typeof r.status === "string" ? r.status : undefined;
    out.push({ region, window, market, tone });
  }
  return out.length ? out : null;
}

function rejectsFromSnap(snap: Record<string, unknown>): string[] | null {
  const invent = rec(snap.invent);
  const raw = snap.rejects ?? snap.invent_rejects ?? invent?.rejects ?? invent?.gate_rejects;
  if (typeof raw === "string" && raw.trim()) return [raw.trim()];
  if (!Array.isArray(raw)) return null;
  const out = raw.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : null;
}

function overlaySeats(base: LiveStamp["seats"], snap: Record<string, unknown>): LiveStamp["seats"] {
  const rows = Array.isArray(snap.seats) ? snap.seats : [];
  if (!rows.length) return base;
  return base.map((seat) => {
    const row = rows.find((s) => {
      const recs = rec(s);
      if (!recs) return false;
      const name = String(recs.name ?? recs.seat ?? "");
      return seatKey(name) === seat.id;
    });
    const r = rec(row);
    if (!r) return seat;
    const status = String(r.status || seat.status);
    const now = typeof r.watching === "string" && r.watching ? r.watching : seat.now;
    return {
      ...seat,
      status: (status as LiveStamp["seats"][number]["status"]) || seat.status,
      now,
    };
  });
}
