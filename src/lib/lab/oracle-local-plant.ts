/** Read live plant scoreboard + digest on the Oracle host (no SSH hop). */

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function labLatestDir(): string {
  const root = process.env.BBB_ROOT?.trim() || join(homedir(), "bbb");
  return join(root, "data/firm/lab/latest");
}

function scoreboardPath(): string {
  return process.env.ORACLE_SCOREBOARD_PATH?.trim() || join(labLatestDir(), "scoreboard.json");
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
    const summary = rec(sb.summary) ?? {};
    const cliff = rec(summary.settled_total_cliff);
    const day =
      (typeof digest.date === "string" && digest.date) ||
      (typeof digest.day === "string" && digest.day) ||
      (typeof sb.date === "string" && sb.date) ||
      (typeof sb.day === "string" && sb.day) ||
      "";
    const generated =
      (typeof cliff?.new_ts === "string" && cliff.new_ts) ||
      (typeof sb.generated_at_utc === "string" && sb.generated_at_utc) ||
      (typeof digest.generated_at_utc === "string" && digest.generated_at_utc) ||
      (typeof digest.generatedAt === "string" && digest.generatedAt) ||
      "";

    const measuring = Number(summary.n_measuring ?? rec(summary.by_status)?.MEASURING ?? 0);
    const hunting = Number(summary.n_hunting ?? rec(summary.by_status)?.HUNTING ?? 0);
    const n_armed = Number(digest.n_armed ?? sb.n_armed ?? measuring + hunting);

    const fills = day ? await readRecentFills(day) : [];
    const wait_open = await readWaitOpen();

    return {
      ...digest,
      ...sb,
      cells: sb.cells,
      summary,
      truth: sb.truth ?? digest.truth,
      date: day,
      day,
      generated_at_utc: generated,
      generatedAt: generated,
      n_armed,
      fills,
      wait_open,
    };
  } catch {
    return null;
  }
}
