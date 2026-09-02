import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import liveSnap from "./live-snapshot.json" with { type: "json" };
import { applySnapshot } from "./from-snapshot.ts";
import { bootStamp, digestStamp, plantFromTape, type PlantPayload } from "./plant-boot.ts";
import type { LiveStamp } from "./from-digest.ts";

const execFileAsync = promisify(execFile);

export type { PlantPayload };

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
        "python3 -c \"import json,pathlib;p=pathlib.Path.home()/'bbb/data/firm/lab/latest';d=json.loads((p/'plant_digest.json').read_text());s=json.loads((p/'scoreboard.json').read_text());d['cells']=s.get('cells');d['summary']=s.get('summary',d.get('summary'));d['truth']=s.get('truth');print(json.dumps(d))\"",
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
  const stamp = applySnapshot(liveSnap, base);
  const frozen = {
    ...stamp,
    source: "freeze" as const,
  };
  return {
    stamp: frozen,
    source: "freeze",
    detail: `oracle unreachable · frozen ${frozen.generated}`,
  };
}

export async function loadPlant(): Promise<PlantPayload> {
  try {
    const base = digestStamp();
    const remote = Promise.race([
      (async () => {
        const [http, ssh] = await Promise.all([tryHttp(base), trySsh(base)]);
        return http ?? ssh;
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
  return plantFromTape(bootStamp());
}
