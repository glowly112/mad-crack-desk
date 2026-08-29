import type { LiveStamp } from "./from-digest.ts";
import type { Badge, Chip, Recipe } from "./stamp.ts";

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
  return Boolean(raw.truth || raw.cells || raw.firm_cells || raw.summary || raw.liveMoney || raw.boardUx);
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
    if (t.includes(r)) return r;
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
    const title = String(c.title || id);
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
  return [...keep, ...measuring].slice(0, RECIPE_CAP);
}

/**
 * Overlay a live oracle snapshot (Linear / local_api / firm scoreboard) onto a
 * digest-applied stamp. Never treats KEEP paper (pnlTotal) as the production score.
 */
export function applySnapshot(raw: unknown, base: LiveStamp): LiveStamp {
  const snap = rec(raw);
  if (!snap || !isPlantSnap(snap)) return base;

  const truth = rec(snap.truth) ?? {};
  const summary = rec(snap.summary) ?? snap;
  const by = rec(summary.by_status) ?? {};
  const liveMoney = rec(snap.liveMoney) ?? rec(snap.live_fast);
  const boardUx = rec(snap.boardUx) ?? rec(snap.board_ux);
  const paperLive = rec(snap.paperLive) ?? rec(snap.paper_live);

  const keep = int(truth.keep) ?? int(by.KEEP) ?? base.counts.keep;
  const measuring = int(truth.measuring) ?? int(by.MEASURING) ?? base.counts.measuring;
  const hunting = int(truth.gathering) ?? int(by.HUNTING) ?? base.counts.hunting;
  const kill = int(truth.dropped) ?? int(by.KILL) ?? base.counts.kill;

  const nSolidExplicit = int(boardUx?.n_solid) ?? int(snap.n_solid);
  const n_solid = nSolidExplicit ?? base.n_solid;

  const day_u = num(paperLive?.day_u) ?? num(boardUx?.hero_u) ?? base.hero.day_u;

  let fuse_on = base.fuse_on;
  if (liveMoney) {
    fuse_on = Boolean(liveMoney.live_on) && Boolean(liveMoney.place_on ?? liveMoney.place_orders);
  } else if (typeof boardUx?.fuse === "string") {
    fuse_on = /real betting:\s*on/i.test(boardUx.fuse) || boardUx.fuse.toUpperCase() === "ON";
  }

  const researchKeepGbp =
    num(snap.pnlTotal) ?? num(summary.keep_pnl_gbp) ?? num(summary.keep_pnl_now_gbp) ?? base.researchKeepGbp;

  const recipes = recipesFromCells(cellsOf(snap));
  const solids = recipes.filter((r) => r.badge === "Solid");

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
      measuring,
      hunting,
      kill,
      cells: keep + measuring + hunting + kill,
    },
    recipes: recipes.length ? recipes : base.recipes,
    solids: recipes.length ? solids : base.solids,
    trends,
  };
}
