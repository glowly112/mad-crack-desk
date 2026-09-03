import type { LiveStamp } from "./from-digest.ts";
import { cellName } from "./desk.ts";
import type { Badge, Chip, Recipe } from "./stamp.ts";
import { parseFills, parseWaitOpen } from "./trades.ts";
import { parseHole, parseWindow, parseMarket, regionFromText, type SquareWindow } from "./boards.ts";
import { cellIsPostEpochEhole, cellIsPostEpochParkedKeep } from "./board-reset.ts";
import { matrixKeyFromScoreboardCell } from "./hollow-occupancy.ts";

const REGIONS = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;
const BADGES: Badge[] = ["Solid", "Research", "Parked", "Dead"];
const CHIPS: Chip[] = ["Waiting for races", "Booking", "On tape today"];
const RECIPE_CAP = 64;

const HOLE_TONE_RANK: Record<string, number> = {
  hunt: 3,
  idea: 2,
  loss: 1,
  parked: 0,
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
  const measuring: Recipe[] = [];
  for (const c of cells) {
    if (!cellPaintsSquare(c)) continue;
    const status = statusOf(c);
    if (status !== "MEASURING" && status !== "HUNTING") continue;
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
        : status === "HUNTING"
          ? "Looking for the next book."
          : "Still proving. Not the score.";
    const recipe: Recipe = {
      id,
      title,
      region: (plantRegion(c) ?? regionOf(title)) as Recipe["region"],
      status,
      badge: badgeOf(c, status),
      chip: chipOf(c),
      n,
      roi,
      freezePnl: pnl,
      why,
    };
    measuring.push(recipe);
  }
  return measuring.slice(0, RECIPE_CAP);
}

function plantRegion(c: Record<string, unknown>): string | null {
  const cs = c.country_scope;
  if (Array.isArray(cs) && cs.length) {
    const r = String(cs[0]).toUpperCase();
    if ((REGIONS as readonly string[]).includes(r)) return r;
  }
  return null;
}

function plantMarket(c: Record<string, unknown>): ReturnType<typeof parseMarket> {
  const mt = c.market_type;
  if (typeof mt === "string") {
    const m = parseMarket(mt);
    if (m) return m;
  }
  const side = c.side;
  if (typeof side === "string" && side.toUpperCase() === "LAY") return "LAY";
  return null;
}

function plantWindow(c: Record<string, unknown>): SquareWindow | null {
  const ws = c.window_scope;
  if (Array.isArray(ws) && ws.length) return parseWindow(String(ws[0]));
  return null;
}

function eholeBlob(c: Record<string, unknown>): string {
  const id = String(c.id || "");
  const title = String(c.title || "");
  return `${title} ${id}`
    .replace(/^ehole_/i, "")
    .replace(/^H-ehole-/i, "")
    .replace(/_/g, " ")
    .replace(/-/g, " ");
}

function holeToneFromStatus(status: Recipe["status"]): string {
  if (status === "HUNTING") return "hunt";
  if (status === "KILL") return "loss";
  if (status === "KEEP") return "parked";
  return "idea";
}

function cellBlob(c: Record<string, unknown>): string {
  const id = String(c.id || "");
  const title = String(c.title || "");
  if (cellIsPostEpochEhole(c)) return eholeBlob(c);
  return `${title} ${id}`.replace(/_/g, " ").replace(/-/g, " ");
}

/** Plant window_scope first; also paint parsed title hole when scope disagrees. */
function holePlacementsFromCell(c: Record<string, unknown>): LiveStamp["holes"] {
  const status = statusOf(c);
  if (status !== "MEASURING" && status !== "HUNTING" && status !== "KILL" && status !== "KEEP") return [];
  const blob = cellBlob(c);
  const parsed = parseHole(blob);
  const region = plantRegion(c) ?? parsed?.region ?? regionFromText(blob);
  const market = plantMarket(c) ?? parsed?.market;
  if (!region || !market) return [];
  const tone = holeToneFromStatus(status);
  const plantW = plantWindow(c);
  const parsedW = parsed?.window;
  const windows: SquareWindow[] = [];
  if (plantW) windows.push(plantW);
  if (parsedW && !windows.includes(parsedW)) windows.push(parsedW);
  if (!windows.length && parsedW) windows.push(parsedW);
  if (!windows.length) return [];
  return windows.map((window) => ({ region, window, market, tone }));
}

function holeFromCell(c: Record<string, unknown>): LiveStamp["holes"][number] | null {
  if (!cellPaintsSquare(c)) return null;
  const placements = holePlacementsFromCell(c);
  return placements[0] ?? null;
}

function cellPaintsSquare(c: Record<string, unknown>): boolean {
  return cellIsPostEpochEhole(c) || cellIsPostEpochParkedKeep(c);
}

function holesFromCells(cells: Record<string, unknown>[]): LiveStamp["holes"] {
  const map = new Map<string, LiveStamp["holes"][number]>();
  for (const c of cells) {
    if (!cellPaintsSquare(c)) continue;
    const placements = holePlacementsFromCell(c);
    for (const hole of placements) {
      const key = `${hole.region}|${hole.window}|${hole.market}`;
      const cur = map.get(key);
      const rank = HOLE_TONE_RANK[hole.tone ?? "idea"] ?? 0;
      const curRank = cur ? (HOLE_TONE_RANK[cur.tone ?? "idea"] ?? 0) : -1;
      if (!cur || rank > curRank) map.set(key, hole);
    }
  }
  return [...map.values()];
}

function countEholeArms(cells: Record<string, unknown>[]): number {
  const alive = new Set<string>();
  for (const c of cells) {
    if (!cellPaintsSquare(c)) continue;
    const status = statusOf(c);
    if (status !== "MEASURING" && status !== "HUNTING") continue;
    const hole = holeFromCell(c);
    if (!hole) continue;
    alive.add(`${hole.region}|${hole.window}|${hole.market}`);
  }
  return alive.size;
}

/** Post-epoch occupancy from factory empty-hole hunt — not every MEASURING cell on the board. */
function supplementOccupiedKeys(
  keys: Set<string>,
  cells: Record<string, unknown>[],
  targetN: number,
): void {
  if (targetN <= 0 || keys.size >= targetN) return;
  for (const c of cells) {
    if (!cellIsPostEpochEhole(c)) continue;
    const st = statusOf(c);
    if (st !== "MEASURING" && st !== "HUNTING" && st !== "KEEP") continue;
    const fromCell = matrixKeyFromScoreboardCell(c);
    if (fromCell) keys.add(fromCell);
    for (const h of holePlacementsFromCell(c)) {
      keys.add(`${h.region}|${h.window}|${h.market}`);
    }
    if (keys.size >= targetN) return;
  }
}

function holesFromOccupancyPostEpoch(
  snap: Record<string, unknown>,
  cells: Record<string, unknown>[],
): LiveStamp["holes"] | null {
  const occRec =
    rec(snap.occupancy_post_epoch) ??
    rec(rec(snap.empty_hole_hunt)?.occupancy_post_epoch) ??
    rec(rec(snap.factory_empty_hole_hunt)?.occupancy_post_epoch);
  const list = occRec?.occupied_cells;
  const nOccupied = int(occRec?.n_occupied_cells);
  if (!Array.isArray(list) || !list.length) return null;

  const keySet = new Set<string>();
  for (const key of list) keySet.add(String(key));
  if (nOccupied != null && nOccupied > 0 && keySet.size < nOccupied) {
    supplementOccupiedKeys(keySet, cells, nOccupied);
  }
  let keysToPaint = [...keySet];
  if (nOccupied != null && nOccupied > 0 && keysToPaint.length > nOccupied) {
    keysToPaint = keysToPaint.slice(0, nOccupied);
  }

  const map = new Map<string, LiveStamp["holes"][number]>();
  const cellByHole = new Map<string, Record<string, unknown>>();
  for (const c of cells) {
    if (!cellPaintsSquare(c)) continue;
    for (const h of holePlacementsFromCell(c)) {
      cellByHole.set(`${h.region}|${h.window}|${h.market}`, c);
    }
  }

  for (const key of keysToPaint) {
    const parts = String(key).split("|");
    if (parts.length !== 3) continue;
    const region = parts[0].toUpperCase();
    if (!(REGIONS as readonly string[]).includes(region)) continue;
    const window = parseWindow(parts[1]) ?? parseWindow(parts[1].replace(/_/g, " "));
    const market = parseMarket(parts[2]);
    if (!window || !market) continue;
    const holeKey = `${region}|${window}|${market}`;
    const cell = cellByHole.get(String(key)) ?? cellByHole.get(holeKey);
    const status = cell ? statusOf(cell) : "MEASURING";
    map.set(holeKey, {
      region,
      window,
      market,
      tone: holeToneFromStatus(status),
    });
  }

  for (const c of cells) {
    if (!cellIsPostEpochEhole(c)) continue;
    if (statusOf(c) !== "KILL") continue;
    for (const h of holePlacementsFromCell(c)) {
      const key = `${h.region}|${h.window}|${h.market}`;
      map.set(key, h);
    }
  }

  return map.size ? [...map.values()] : null;
}

function armedFromSnap(
  snap: Record<string, unknown>,
  plantOracle: boolean,
  millParked: boolean,
  eholeArms: number,
): { mill_n_armed?: number; n_armed?: number } {
  const snapArmed = int(snap.n_armed) ?? int(snap.mill_n_armed);
  if (millParked && snapArmed != null && snapArmed > 0) {
    const mill = int(snap.mill_n_armed);
    return {
      mill_n_armed: mill != null && mill > 0 ? mill : snapArmed,
      n_armed: snapArmed,
    };
  }
  if (plantOracle && eholeArms > 0) {
    return { mill_n_armed: eholeArms, n_armed: eholeArms };
  }
  return {
    mill_n_armed: int(snap.mill_n_armed) ?? undefined,
    n_armed: int(snap.n_armed) ?? undefined,
  };
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
  const cliff = rec(summary.settled_total_cliff);
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
  const cellList = cellsOf(snap);
  const occupancyHoles = isPlantSnap(opened) ? holesFromOccupancyPostEpoch(snap, cellList) : null;
  const namedHolesFromCells = holesFromCells(cellList);
  const eholeArms = countEholeArms(cellList);

  const date =
    typeof snap.date === "string" && snap.date
      ? snap.date
      : typeof snap.day === "string" && snap.day
        ? snap.day
        : base.day;
  const generated =
    (typeof snap.generatedAt === "string" && snap.generatedAt) ||
    (typeof snap.generated_at_utc === "string" && snap.generated_at_utc) ||
    (typeof cliff?.new_ts === "string" && cliff.new_ts) ||
    (typeof snap.ts === "string" && snap.ts) ||
    base.generated;

  const plantOracle = isPlantSnap(opened);
  const inventCaption = plantOracle ? inventCaptionFromSnap(snap) : null;
  const inventWhy = inventCaption ?? base.office.inventWhy;
  const inventOn = inventCaption ? inventIsOn(inventCaption) : base.office.invent;
  const millParked = plantOracle && isMillParked(snap, inventCaption);
  const armed = armedFromSnap(snap, plantOracle, millParked, eholeArms);
  const occRec =
    rec(snap.occupancy_post_epoch) ??
    rec(rec(snap.empty_hole_hunt)?.occupancy_post_epoch) ??
    rec(rec(snap.factory_empty_hole_hunt)?.occupancy_post_epoch);
  const square_occupied_n = int(occRec?.n_occupied_cells);

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
    mill_n_armed: armed.mill_n_armed,
    n_armed: armed.n_armed,
    square_occupied_n: square_occupied_n != null && square_occupied_n > 0 ? square_occupied_n : undefined,
    n_solid,
    fuse_on,
    fuse: fuse_on ? "Real betting: ON" : "Real betting: OFF",
    plantHealth: plantOracle ? plantHealthFromSnap(snap, base) : base.plantHealth,
    plantLine: inventCaption ? plantLineFromInvent(inventCaption) : base.plantLine,
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
    recipes: plantOracle ? recipes : recipes.length ? recipes : base.recipes,
    solids: plantOracle ? solids : recipes.length ? solids : n_solid > 0 ? base.solids : [],
    seats: overlaySeats(base.seats, snap, inventCaption),
    kpis: overlayKpis(base.kpis, inventCaption, inventOn),
    trends,
    trades: Array.isArray(snap.fills) ? parseFills(snap.fills) : base.trades,
    wait_open: Array.isArray(snap.wait_open) ? parseWaitOpen(snap.wait_open) : (base.wait_open ?? []),
    holes: plantOracle
      ? (occupancyHoles ?? namedHolesFromCells).length
        ? occupancyHoles ?? namedHolesFromCells
        : holesFromSnap(snap) ?? []
      : holesFromSnap(snap) ?? (namedHolesFromCells.length ? namedHolesFromCells : base.holes),
    office: {
      ...base.office,
      invent: inventOn,
      inventWhy,
      rejects: rejectsFromSnap(snap) ?? base.office.rejects,
    },
  } as LiveStamp;
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

const INVENT_SEAT_IDS = new Set(["bauron", "mercator", "foreman"]);

function overlaySeats(
  base: LiveStamp["seats"],
  snap: Record<string, unknown>,
  inventCaption: string | null,
): LiveStamp["seats"] {
  const seatRows = Array.isArray(snap.seats) ? snap.seats : [];
  const staffRows = Array.isArray(snap.staff) ? snap.staff : [];
  const rows = seatRows.length ? seatRows : staffRows;
  if (!rows.length) {
    if (!inventCaption) return base;
    return base.map((seat) =>
      INVENT_SEAT_IDS.has(seat.id)
        ? { ...seat, now: overlaySeatNow(seat.id, seat.now, inventCaption) }
        : seat,
    );
  }
  return base.map((seat) => {
    const row = rows.find((s) => {
      const recs = rec(s);
      if (!recs) return false;
      const name = String(recs.name ?? recs.seat ?? "");
      return seatKey(name) === seat.id;
    });
    const r = rec(row);
    if (!r) {
      return INVENT_SEAT_IDS.has(seat.id) && inventCaption
        ? { ...seat, now: overlaySeatNow(seat.id, seat.now, inventCaption) }
        : seat;
    }
    const status = String(r.status || seat.status);
    const rawNow = typeof r.watching === "string" && r.watching ? r.watching : seat.now;
    const now = overlaySeatNow(seat.id, rawNow, inventCaption);
    return {
      ...seat,
      status: (status as LiveStamp["seats"][number]["status"]) || seat.status,
      now,
    };
  });
}

/** Invent seats: live oracle invent_mode wins over stale plant_digest densify watching. */
function overlaySeatNow(seatId: string, watching: string, inventCaption: string | null): string {
  if (!inventCaption || !INVENT_SEAT_IDS.has(seatId)) return watching;
  const staleDensify = /\bdensify\b/i.test(watching) || /invent\s*\(densify\)/i.test(watching);
  const liveHunt = /empty-hole hunt|invent_empty/i.test(inventCaption);
  if (!staleDensify && !liveHunt) return watching;
  if (!staleDensify && liveHunt && !/empty-hole hunt|invent_empty/i.test(watching)) {
    const tail = stripStaleInventTokens(watching);
    return tail ? `${inventCaption} · ${tail}` : inventCaption;
  }
  if (staleDensify || liveHunt) {
    const tail = stripStaleInventTokens(watching);
    return tail ? `${inventCaption} · ${tail}` : inventCaption;
  }
  return watching;
}

function stripStaleInventTokens(s: string): string {
  return s
    .replace(/\binvent on\b/gi, "")
    .replace(/invent\s*\([^)]*\)/gi, "")
    .replace(/\bdensify\b/gi, "")
    .replace(/^[\s·—]+|[\s·—]+$/g, "")
    .replace(/\s*·\s*/g, " · ")
    .trim();
}

function overlayKpis<T extends LiveStamp["kpis"]>(
  base: T,
  inventCaption: string | null,
  inventOn: boolean,
): T {
  if (!inventCaption) return base;
  return base.map((k) => {
    if (k.id !== "invent") return k;
    return {
      ...k,
      detail: inventCaption,
      status: inventOn ? (k.status === "RED" ? k.status : "GREEN") : k.status,
    };
  }) as unknown as T;
}

/** Live oracle plant_digest / snapshot invent — never keep bundled digest.json densify caption. */
function inventCaptionFromSnap(snap: Record<string, unknown>): string | null {
  const inventRec = rec(snap.invent);
  const fromString =
    typeof snap.invent === "string" && snap.invent.trim() ? snap.invent.trim() : null;
  const board = rec(snap.board);
  const boardInvent =
    typeof board?.invent === "string" && board.invent.trim() ? board.invent.trim() : null;
  const fromRec =
    typeof inventRec?.line === "string" && inventRec.line.trim()
      ? inventRec.line.trim()
      : typeof inventRec?.caption === "string" && inventRec.caption.trim()
        ? inventRec.caption.trim()
        : null;

  if (fromString) return fromString;
  if (boardInvent) return boardInvent;
  if (fromRec) return fromRec;

  const fromMode =
    typeof snap.invent_mode === "string" && snap.invent_mode.trim() ? snap.invent_mode.trim() : null;
  if (fromMode) return fromMode.replace(/_/g, " ");

  const staff = Array.isArray(snap.staff) ? snap.staff : [];
  for (const row of staff) {
    const r = rec(row);
    if (!r || String(r.seat).toLowerCase() !== "bauron") continue;
    const w = typeof r.watching === "string" ? r.watching.trim() : "";
    if (w) return w;
  }
  return null;
}

function inventIsOn(caption: string): boolean {
  return /invent on|empty-hole hunt on|invent_empty/i.test(caption);
}

function isMillParked(snap: Record<string, unknown>, inventCaption: string | null): boolean {
  if (inventCaption && /mill parked/i.test(inventCaption)) return true;
  const modes = [
    snap.mill_mode,
    rec(snap.invent_mill)?.mill_mode,
    rec(snap.empty_hole_hunt)?.mill_mode,
  ];
  return modes.some((m) => String(m ?? "").toLowerCase() === "parked");
}

function plantLineFromInvent(caption: string): string {
  return inventIsOn(caption) ? `Invent ${caption}` : caption;
}

function plantHealthFromSnap(snap: Record<string, unknown>, base: LiveStamp): LiveStamp["plantHealth"] {
  const board = rec(snap.board);
  const ops = board?.ops ?? snap.ops ?? snap.plant_health ?? snap.plantHealth;
  if (typeof ops === "string" && /^(GREEN|AMBER|RED)$/i.test(ops)) {
    return ops.toUpperCase() as LiveStamp["plantHealth"];
  }
  return base.plantHealth;
}
