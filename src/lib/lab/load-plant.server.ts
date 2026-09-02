import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import liveSnap from "./live-snapshot.json" with { type: "json" };
import { applyBoardResetView, isBoardResetView } from "./board-reset.ts";
import { applySnapshot } from "./from-snapshot.ts";
import { readLocalOraclePlant } from "./oracle-local-plant.ts";
import { bootStamp, digestStamp, plantFromTape, type PlantPayload } from "./plant-boot.ts";
import type { LiveStamp } from "./from-digest.ts";

const execFileAsync = promisify(execFile);

export type { PlantPayload };

const SSH_DIGEST = `
import json, pathlib
from collections import defaultdict
from datetime import date, timedelta
p = pathlib.Path.home() / "bbb/data/firm/lab/latest"
d = json.loads((p / "plant_digest.json").read_text())
s = json.loads((p / "scoreboard.json").read_text())
d["cells"] = s.get("cells")
d["summary"] = s.get("summary", d.get("summary"))
d["truth"] = s.get("truth")
day = d.get("date") or d.get("day") or s.get("date") or s.get("day")
if day:
    d["date"] = day
    d["day"] = day
book = pathlib.Path.home() / "bbb/data/firm/live_ledger/book.jsonl"
keys = ("pick_id","ts","settled_ts","cell_id","mode","status","odds","stake_gbp","paper_stake_gbp","paper_pnl_gbp","placed_result","certified_keep","gate_verdict","side","lab_status","date","unmatched","unmatched_size","atb_size_gbp","phase","in_play","off_ts","off_time","horse","runner","horse_name","runner_name","selection_name","sel_name")
want = set()
try:
    end = date.fromisoformat(str(day))
    want = {(end - timedelta(days=i)).isoformat() for i in range(14)}
except Exception:
    want = set()
by = defaultdict(list)
if book.exists() and want:
    for line in book.read_text().splitlines()[-4000:]:
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except Exception:
            continue
        dte = row.get("date")
        if dte in want:
            by[dte].append({k: row.get(k) for k in keys})
fills = []
for dte in sorted(by):
    fills.extend(by[dte][-80:])
d["fills"] = fills
wait_open = []
lf = pathlib.Path.home() / "bbb/data/firm/lab/latest/live_fast_auto.json"
if lf.exists():
    try:
        for r in json.loads(lf.read_text()).get("path_runs") or []:
            if r.get("mode") == "wait_open" and r.get("cell_id"):
                wait_open.append({"cell_id": r.get("cell_id"), "mode": "wait_open", "reasons": r.get("reasons"), "gate_verdict": r.get("gate_verdict")})
    except Exception:
        pass
d["wait_open"] = wait_open
print(json.dumps(d))
`.trim();

const LAB_SNAPSHOT = "https://stridesmart.uk/lab/api/snapshot";
const LOOPBACK = ["http://127.0.0.1:8788/api/snapshot", "http://127.0.0.1:8780/api/snapshot"];

function onVercel(): boolean {
  return Boolean(process.env.VERCEL);
}

function snapshotUrls(): string[] {
  const out: string[] = [];
  const envUrl = process.env.ORACLE_SNAPSHOT_URL?.trim();
  if (envUrl) out.push(envUrl);
  // Live lab console. Auth required; 401 is a miss. On Vercel always try so
  // ORACLE_BASIC_AUTH in project env actually wires the floor. Off-box preview
  // only hits it when auth is set (bare TLS hung the last poll).
  if (process.env.ORACLE_BASIC_AUTH?.trim() || onVercel()) {
    if (!out.includes(LAB_SNAPSHOT)) out.push(LAB_SNAPSHOT);
  }
  if (!onVercel()) {
    for (const u of LOOPBACK) {
      if (!out.includes(u)) out.push(u);
    }
  }
  return out;
}

function sshKey(): string | undefined {
  return process.env.ORACLE_SSH_KEY?.trim() || process.env.MULTIBOT_SSH_ORACLE_HRBOT_KEY?.trim();
}

function httpHeaders(): Record<string, string> {
  const raw = process.env.ORACLE_BASIC_AUTH?.trim();
  if (!raw) return {};
  if (/^basic\s+/i.test(raw)) return { Authorization: raw };
  const token = raw.includes(":") ? Buffer.from(raw).toString("base64") : raw;
  return { Authorization: `Basic ${token}` };
}

async function tryLocal(base: LiveStamp): Promise<PlantPayload | null> {
  const snap = await readLocalOraclePlant();
  if (!snap) return null;
  const stamp = applySnapshot(snap, base);
  if (stamp.source !== "oracle") return null;
  return { stamp, source: "oracle", detail: "local oracle scoreboard" };
}

async function tryHttp(base: LiveStamp): Promise<PlantPayload | null> {
  const headers = httpHeaders();
  const hits = await Promise.all(
    snapshotUrls().map(async (url) => {
      try {
        const bust = url.includes("?") ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
        const res = await fetch(bust, {
          signal: AbortSignal.timeout(3000),
          headers: { ...headers, Accept: "application/json", "Cache-Control": "no-cache" },
        });
        if (!res.ok) return null;
        const snap = (await res.json()) as unknown;
        const stamp = applySnapshot(snap, base);
        if (stamp.source !== "oracle") return null;
        return { stamp, source: "oracle" as const, detail: url };
      } catch {
        return null;
      }
    }),
  );
  return hits.find((h) => h !== null) ?? null;
}

async function trySsh(base: LiveStamp): Promise<PlantPayload | null> {
  const key = sshKey();
  if (!key) return null;
  let cleanup: () => Promise<void> = async () => {};
  try {
    const extra: string[] = [];
    if (key.includes("BEGIN") && key.includes("PRIVATE KEY")) {
      const dir = await mkdtemp(join(tmpdir(), "mcl-ssh-"));
      const path = join(dir, "id");
      const pem = key.endsWith("\n") ? key : `${key}\n`;
      await writeFile(path, pem, { mode: 0o600 });
      extra.push("-i", path, "-o", "IdentitiesOnly=yes");
      cleanup = async () => {
        await rm(dir, { recursive: true, force: true });
      };
    } else {
      extra.push("-i", key, "-o", "IdentitiesOnly=yes");
    }
    const host = process.env.ORACLE_SSH_HOST?.trim() || "ubuntu@140.238.126.80";
    const { stdout } = await execFileAsync(
      "ssh",
      [
        ...extra,
        "-o",
        "BatchMode=yes",
        "-o",
        "StrictHostKeyChecking=accept-new",
        "-o",
        "ConnectTimeout=4",
        host,
        `python3 -c 'import base64;exec(base64.b64decode("${Buffer.from(SSH_DIGEST).toString("base64")}").decode())'`,
      ],
      { timeout: 8000, maxBuffer: 4 * 1024 * 1024 },
    );
    const sb = JSON.parse(String(stdout)) as unknown;
    const stamp = applySnapshot(sb, base);
    if (stamp.source !== "oracle") return null;
    return { stamp, source: "oracle", detail: "ssh plant digest" };
  } catch {
    return null;
  } finally {
    await cleanup();
  }
}

function fromLiveFile(base: LiveStamp): PlantPayload {
  const snapStamp = applySnapshot(liveSnap, base);
  const stamp = applyBoardResetView(snapStamp);
  const frozen = {
    ...stamp,
    source: "freeze" as const,
  };
  const detail = isBoardResetView(stamp)
    ? `board reset · frozen ${frozen.generated}`
    : `frozen ${frozen.generated} · post-reset arms on board`;
  return {
    stamp: frozen,
    source: "freeze",
    detail,
  };
}

export async function loadPlant(): Promise<PlantPayload> {
  try {
    const base = digestStamp();
    const remote = Promise.race([
      (async () => {
        const [local, http, ssh] = await Promise.all([tryLocal(base), tryHttp(base), trySsh(base)]);
        let hit: PlantPayload | null = local;
        if (http && ssh) {
          const trades =
            http.stamp.trades.length === 0 && ssh.stamp.trades.length > 0
              ? ssh.stamp.trades
              : http.stamp.trades;
          const wait_open =
            (http.stamp.wait_open?.length ?? 0) === 0 && (ssh.stamp.wait_open?.length ?? 0) > 0
              ? ssh.stamp.wait_open
              : (http.stamp.wait_open ?? []);
          hit = { ...http, stamp: { ...http.stamp, trades, wait_open } };
        } else if (!hit) {
          hit = http ?? ssh;
        } else if (http || ssh) {
          const remote = http ?? ssh!;
          hit = {
            ...hit,
            stamp: {
              ...hit.stamp,
              trades: hit.stamp.trades.length ? hit.stamp.trades : remote.stamp.trades,
              wait_open:
                (hit.stamp.wait_open?.length ?? 0) > 0
                  ? hit.stamp.wait_open
                  : remote.stamp.wait_open,
            },
          };
        }
        if (!hit) return null;
        const stamp = applyBoardResetView(hit.stamp);
        const detail =
          hit.source === "oracle"
            ? isBoardResetView(stamp)
              ? "new run · board reset"
              : `live oracle · post-reset arms (${stamp.recipes.length} recipes · ${stamp.trades.length} fills)`
            : hit.detail;
        return { ...hit, stamp, detail };
      })(),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 10_000);
      }),
    ]);
    return (await remote) ?? fromLiveFile(base);
  } catch {
    return fromLiveFile(digestStamp());
  }
}

export function fallbackPlant(): PlantPayload {
  const payload = plantFromTape(bootStamp());
  return { ...payload, stamp: applyBoardResetView(payload.stamp) };
}
