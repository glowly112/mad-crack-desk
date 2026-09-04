/** Merge live_fast path_runs into the plant snapshot the same turn — no scoreboard lag. */

import { parseHole, parseWindow } from "./boards.ts";

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function cellsArray(snap: Record<string, unknown>): Record<string, unknown>[] {
  const list = Array.isArray(snap.cells) ? snap.cells : Array.isArray(snap.firm_cells) ? snap.firm_cells : [];
  return list.filter((c): c is Record<string, unknown> => Boolean(rec(c)));
}

export function pathRunsOf(snap: Record<string, unknown>): Record<string, unknown>[] {
  if (Array.isArray(snap.path_runs)) {
    return snap.path_runs.filter((r): r is Record<string, unknown> => Boolean(rec(r)));
  }
  const lf = rec(snap.live_fast);
  if (lf && Array.isArray(lf.path_runs)) {
    return lf.path_runs.filter((r): r is Record<string, unknown> => Boolean(rec(r)));
  }
  return [];
}

function syntheticCellFromPathRun(run: Record<string, unknown>): Record<string, unknown> {
  const id = String(run.cell_id || "").trim();
  const health = rec(run.health);
  const gate = String(run.gate_verdict || health?.lab_status || "MEASURING").toUpperCase();
  let status = "MEASURING";
  if (gate === "HUNTING" || run.mode === "wait_open") status = run.mode === "wait_open" ? "HUNTING" : "MEASURING";
  if (gate === "KILL" || gate === "DROPPED") status = "KILL";
  return {
    id,
    title: id.replace(/^H-ehole-/, "ehole_").replace(/-/g, "_"),
    status,
    live_gate: run.gate_verdict,
    gate_verdict: run.gate_verdict,
    chip: run.mode === "wait_open" ? "Waiting for races" : null,
  };
}

function mergeWaitOpenFromRuns(
  snap: Record<string, unknown>,
  runs: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  const existing = Array.isArray(snap.wait_open) ? snap.wait_open : [];
  for (const row of existing) {
    const r = rec(row);
    if (!r) continue;
    const id = String(r.cell_id || r.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(r);
  }
  for (const run of runs) {
    if (String(run.mode || "") !== "wait_open") continue;
    const id = String(run.cell_id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      cell_id: id,
      mode: "wait_open",
      reasons: run.reasons,
      gate_verdict: run.gate_verdict,
    });
  }
  return out;
}

function fillFromPickId(pickId: string): Record<string, unknown> | null {
  const parts = pickId.split("|");
  if (parts.length < 5) return null;
  const [cell_id, oddsRaw, , side, date] = parts;
  if (!cell_id?.startsWith("H-")) return null;
  const odds = Number.parseFloat(oddsRaw);
  return {
    pick_id: pickId,
    cell_id,
    odds: Number.isFinite(odds) ? odds : null,
    side: side?.toUpperCase() || "BACK",
    date,
    status: "OPEN",
    mode: "auto_dry",
    placed_result: null,
    ts: `${date}T12:00:00Z`,
  };
}

function supplementFillsFromRuns(
  fills: Record<string, unknown>[],
  runs: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  const have = new Set(
    fills.map((f) => String(f.pick_id || f.id || "").trim()).filter(Boolean),
  );
  const extra: Record<string, unknown>[] = [];
  for (const run of runs) {
    const mode = String(run.mode || "");
    if (mode !== "auto_dry" && mode !== "already_booked") continue;
    const details = rec(run.details);
    const picks = details?.pick_ids;
    if (!Array.isArray(picks)) continue;
    for (const raw of picks) {
      const pickId = String(raw || "").trim();
      if (!pickId || have.has(pickId)) continue;
      const row = fillFromPickId(pickId);
      if (!row) continue;
      have.add(pickId);
      extra.push(row);
    }
  }
  if (!extra.length) return fills;
  return [...fills, ...extra];
}

function freshestGenerated(snap: Record<string, unknown>, runs: readonly Record<string, unknown>[]): string {
  const candidates = [
    snap.generatedAt,
    snap.generated_at_utc,
    snap.ts,
    rec(snap.invent_mill)?.ts,
    rec(snap.live_fast)?.ts,
  ]
    .map((v) => (typeof v === "string" ? v : ""))
    .filter(Boolean);
  for (const run of runs) {
    const stats = rec(run.open_cand_stats);
    const card = rec(stats?.card_join);
    if (typeof card?.ts === "string") candidates.push(card.ts);
  }
  return candidates.sort().at(-1) ?? "";
}

/** Cells, wait_open, fills, and stamp from path_runs on the same oracle read. */
export function mergeMillPathRuns(snap: Record<string, unknown>): Record<string, unknown> {
  const runs = pathRunsOf(snap);
  if (!runs.length) return snap;

  const cells = cellsArray(snap);
  const byId = new Map<string, Record<string, unknown>>();
  for (const c of cells) {
    const id = String(c.id || c.title || "").trim();
    if (id) byId.set(id, c);
  }
  for (const run of runs) {
    const id = String(run.cell_id || "").trim();
    if (!id.startsWith("H-ehole-")) continue;
    if (!byId.has(id)) byId.set(id, syntheticCellFromPathRun(run));
  }

  const fills = Array.isArray(snap.fills)
    ? snap.fills.filter((f): f is Record<string, unknown> => Boolean(rec(f)))
    : [];
  const wait_open = mergeWaitOpenFromRuns(snap, runs);
  const mergedFills = supplementFillsFromRuns(fills, runs);
  const generated = freshestGenerated(snap, runs);

  return {
    ...snap,
    cells: [...byId.values()],
    wait_open,
    fills: mergedFills,
    path_runs: runs,
    ...(generated
      ? { generatedAt: generated, generated_at_utc: generated }
      : {}),
  };
}

/** Hole key for lay-side slot pairing (country × window × market). */
export function holeKeyFromParts(parts: { id: string; title: string; region?: string }): string | null {
  const hole = parseHole(`${parts.region ?? ""} ${parts.title} ${parts.id}`);
  if (hole) return `${hole.region}|${hole.window}|${hole.market}`;
  const ehole = /^H-ehole-([a-z]{2})-([a-z]+)-(win|place|lay)/i.exec(parts.id);
  if (ehole) {
    const window = parseWindow(ehole[2]);
    const market = ehole[3].toUpperCase();
    if (window) return `${ehole[1].toUpperCase()}|${window}|${market}`;
  }
  return null;
}
