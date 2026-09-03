/** Read live plant scoreboard + digest on the Oracle host (no SSH hop). */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { computeHollowOccupiedKeys } from "./hollow-occupancy.ts";
import { mergeMillPathRuns } from "./mill-paths.ts";

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function int(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim()) {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return 0;
}

function labLatestDir(): string {
  const root = process.env.BBB_ROOT?.trim() || join(homedir(), "bbb");
  return join(root, "data/firm/lab/latest");
}

function scoreboardPath(): string {
  return process.env.ORACLE_SCOREBOARD_PATH?.trim() || join(labLatestDir(), "scoreboard.json");
}

export async function oracleScoreboardExists(): Promise<boolean> {
  try {
    const { access } = await import("node:fs/promises");
    await access(scoreboardPath());
    return true;
  } catch {
    return false;
  }
}

function digestPath(): string {
  return (
    process.env.ORACLE_PLANT_DIGEST_PATH?.trim() || join(labLatestDir(), "plant_digest.json")
  );
}

function bookPath(): string {
  const root = process.env.BBB_ROOT?.trim() || join(homedir(), "bbb");
  return join(root, "data/firm/live_ledger/book.jsonl");
}

function liveFastPath(): string {
  return join(labLatestDir(), "live_fast_auto.json");
}

async function readJsonOptional(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const FILL_KEYS = [
  "pick_id",
  "ts",
  "settled_ts",
  "cell_id",
  "mode",
  "status",
  "odds",
  "stake_gbp",
  "paper_stake_gbp",
  "paper_pnl_gbp",
  "placed_result",
  "certified_keep",
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
] as const;

function recentFillDays(endDay: string, window = 14): Set<string> {
  const out = new Set<string>();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDay);
  if (!m) return out;
  const end = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  for (let i = 0; i < window; i++) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    out.add(d.toISOString().slice(0, 10));
  }
  return out;
}

async function readRecentFills(day: string): Promise<Record<string, unknown>[]> {
  const want = recentFillDays(day);
  if (!want.size) return [];
  try {
    const text = await readFile(bookPath(), "utf8");
    const byDay = new Map<string, Record<string, unknown>[]>();
    for (const line of text.split("\n").slice(-4000)) {
      if (!line.trim()) continue;
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        const dte = row.date;
        if (typeof dte !== "string" || !want.has(dte)) continue;
        const slim: Record<string, unknown> = {};
        for (const k of FILL_KEYS) slim[k] = row[k];
        const bucket = byDay.get(dte) ?? [];
        bucket.push(slim);
        byDay.set(dte, bucket);
      } catch {
        /* skip bad line */
      }
    }
    const fills: Record<string, unknown>[] = [];
    for (const dte of [...byDay.keys()].sort()) {
      fills.push(...(byDay.get(dte) ?? []).slice(-80));
    }
    return fills;
  } catch {
    return [];
  }
}

async function readWaitOpen(): Promise<Record<string, unknown>[]> {
  try {
    const raw = JSON.parse(await readFile(liveFastPath(), "utf8")) as Record<string, unknown>;
    const runs = raw.path_runs;
    if (!Array.isArray(runs)) return [];
    const out: Record<string, unknown>[] = [];
    for (const row of runs) {
      const r = rec(row);
      if (!r) continue;
      if (r.mode === "wait_open" && r.cell_id) {
        out.push({
          cell_id: r.cell_id,
          mode: "wait_open",
          reasons: r.reasons,
          gate_verdict: r.gate_verdict,
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

/** Merge scoreboard + digest into one oracle-shaped snapshot blob. */
export async function readLocalOraclePlant(): Promise<Record<string, unknown> | null> {
  try {
    const sb = JSON.parse(await readFile(scoreboardPath(), "utf8")) as Record<string, unknown>;
    let digest: Record<string, unknown> = {};
    try {
      digest = JSON.parse(await readFile(digestPath(), "utf8")) as Record<string, unknown>;
    } catch {
      /* digest optional */
    }
    const snapInner = rec(digest.snapshot) ?? {};
    const summary = rec(sb.summary) ?? rec(snapInner.summary) ?? {};
    const cliff = rec(summary.settled_total_cliff);
    const day =
      (typeof digest.date === "string" && digest.date) ||
      (typeof digest.day === "string" && digest.day) ||
      (typeof snapInner.day === "string" && snapInner.day) ||
      (typeof sb.date === "string" && sb.date) ||
      (typeof sb.day === "string" && sb.day) ||
      "";
    const generated =
      (typeof digest.ts === "string" && digest.ts) ||
      (typeof cliff?.new_ts === "string" && cliff.new_ts) ||
      (typeof sb.generated_at_utc === "string" && sb.generated_at_utc) ||
      (typeof digest.generated_at_utc === "string" && digest.generated_at_utc) ||
      (typeof digest.generatedAt === "string" && digest.generatedAt) ||
      "";

    const byStatus = rec(summary.by_status) ?? {};
    const measuring = int(summary.n_measuring ?? byStatus.MEASURING);
    const hunting = int(summary.n_hunting ?? byStatus.HUNTING);

    const huntStamp = await readJsonOptional(join(labLatestDir(), "factory_empty_hole_hunt_stamp.json"));
    const inventMill = await readJsonOptional(join(labLatestDir(), "invent_mill.json"));
    const millMode = String(huntStamp?.mill_mode ?? inventMill?.mill_mode ?? "").toLowerCase();
    const inventArmed = int(inventMill?.n_armed);
    const publishArmed = int(
      digest.mill_n_armed ?? snapInner.mill_n_armed ?? digest.n_armed ?? snapInner.n_armed,
    );

    let mill_n_armed: number;
    let n_armed: number;
    if (millMode === "parked" && inventArmed > 0) {
      n_armed = inventArmed;
      mill_n_armed = int(inventMill?.mill_n_armed) > 0 ? int(inventMill?.mill_n_armed) : inventArmed;
    } else if (publishArmed > 0) {
      mill_n_armed = publishArmed;
      n_armed = publishArmed;
    } else if (inventArmed > 0) {
      mill_n_armed = inventArmed;
      n_armed = inventArmed;
    } else {
      mill_n_armed = measuring + hunting;
      n_armed = measuring + hunting;
    }

    const huntTs = typeof huntStamp?.ts === "string" ? huntStamp.ts : "";
    const millTs = typeof inventMill?.ts === "string" ? inventMill.ts : "";
    const freshest = [generated, huntTs, millTs].filter(Boolean).sort().at(-1) ?? generated;

    const fills = day ? await readRecentFills(day) : [];
    const wait_open = await readWaitOpen();

    const bbbRoot = process.env.BBB_ROOT?.trim() || join(homedir(), "bbb");
    const cells = Array.isArray(sb.cells) ? sb.cells : [];
    const stampOcc = rec(huntStamp?.occupancy_post_epoch);
    const stampList = Array.isArray(stampOcc?.occupied_cells)
      ? stampOcc.occupied_cells.map((x) => String(x))
      : [];
    const stampN = int(stampOcc?.n_occupied_cells);
    const hollowKeys = await computeHollowOccupiedKeys(bbbRoot, cells, stampList);
    const occupied_cells = hollowKeys.length > 0 ? hollowKeys : stampList;
    const n_occupied_cells =
      stampN > 0 ? Math.max(stampN, occupied_cells.length) : occupied_cells.length;
    const occupancy_post_epoch =
      occupied_cells.length > 0 || stampN > 0
        ? { n_occupied_cells, occupied_cells }
        : stampOcc ?? snapInner.occupancy_post_epoch;

    const merged = mergeMillPathRuns({
      ...snapInner,
      ...digest,
      ...sb,
      cells: sb.cells,
      summary,
      truth: sb.truth ?? digest.truth ?? snapInner.truth,
      date: day,
      day,
      generated_at_utc: freshest,
      generatedAt: freshest,
      occupancy_post_epoch,
      mill_mode: huntStamp?.mill_mode ?? inventMill?.mill_mode,
      invent_mode: huntStamp?.invent_mode ?? inventMill?.hunt_mode,
      invent_mill: inventMill,
      empty_hole_hunt: huntStamp,
      live_fast: await readJsonOptional(liveFastPath()),
      mill_n_armed,
      n_armed,
      fills,
      wait_open,
    });

    return merged;
  } catch {
    return null;
  }
}
