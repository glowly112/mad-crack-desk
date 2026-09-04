/** Rebuild full hollow occupancy keys (bbb truncates occupied_cells to 24 in hunt stamp). */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { matrixKeyFromArmedYamlName, matrixKeyFromScoreboardCell } from "./hollow-keys.ts";

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export { matrixKeyFromArmedYamlName, matrixKeyFromScoreboardCell } from "./hollow-keys.ts";

const DEFAULT_HOLLOW_CACHE_MS = 5_000;
let hollowCache: { key: string; at: number; keys: string[] } | null = null;

function hollowCacheMs(): number {
  const raw = Number(process.env.ORACLE_HOLLOW_CACHE_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_HOLLOW_CACHE_MS;
}

export function resetHollowOccupancyCacheForTests(): void {
  hollowCache = null;
}

/** Match firm_runtime hollow_occupancy_counts — path mtime since hollow reset + armed yaml. */
export async function computeHollowOccupiedKeys(
  root: string,
  cells: unknown[],
  stampOccupied?: readonly string[],
): Promise<string[]> {
  let resetUnix = 0;
  try {
    const raw = JSON.parse(
      await readFile(join(root, "data/firm/state/matrix_hollow_reset.json"), "utf8"),
    ) as Record<string, unknown>;
    resetUnix = Number(raw.reset_unix ?? 0);
  } catch {
    return [];
  }
  if (!resetUnix) return [];

  const cacheKey = `${root}|${resetUnix}|${cells.length}|${stampOccupied?.length ?? 0}`;
  const ttl = hollowCacheMs();
  if (hollowCache && hollowCache.key === cacheKey && ttl > 0 && Date.now() - hollowCache.at < ttl) {
    return hollowCache.keys;
  }

  const keys = await computeHollowOccupiedKeysInner(root, cells, stampOccupied, resetUnix);
  if (ttl > 0) hollowCache = { key: cacheKey, at: Date.now(), keys };
  return keys;
}

async function computeHollowOccupiedKeysInner(
  root: string,
  cells: unknown[],
  stampOccupied: readonly string[] | undefined,
  resetUnix: number,
): Promise<string[]> {
  const keys = new Set<string>();
  const countedPaths = new Set<string>();

  for (const row of cells) {
    const c = rec(row);
    if (!c) continue;
    const st = String(c.status ?? "").toUpperCase();
    if (st !== "KEEP" && st !== "MEASURING" && st !== "HUNTING") continue;
    const id = String(c.id ?? "");
    const pathRaw = c.path;
    if (typeof pathRaw === "string" && pathRaw.trim()) {
      const p = pathRaw.startsWith("/") ? pathRaw : join(root, pathRaw);
      try {
        const { mtimeMs } = await stat(p);
        if (mtimeMs / 1000 < resetUnix - 0.001) continue;
        countedPaths.add(p);
      } catch {
        /* path missing — fall through to scope / id key */
      }
    }
    const key = matrixKeyFromScoreboardCell(c);
    if (key) keys.add(key);
    else if (/^H-ehole-/i.test(id)) {
      const fromId = matrixKeyFromArmedYamlName(id.replace(/^H-ehole-/i, "").replace(/\.yaml$/i, "") + ".yaml");
      if (fromId) keys.add(fromId);
    }
  }

  const armedDir = join(root, "config/recipes_paper_armed");
  try {
    const names = await readdir(armedDir);
    for (const name of names) {
      if (name.startsWith("_") || !name.endsWith(".yaml")) continue;
      const p = join(armedDir, name);
      if (countedPaths.has(p)) continue;
      try {
        const { mtimeMs } = await stat(p);
        if (mtimeMs / 1000 < resetUnix - 0.001) continue;
      } catch {
        continue;
      }
      const key = matrixKeyFromArmedYamlName(name);
      if (key) keys.add(key);
    }
  } catch {
    /* armed dir missing */
  }

  if (stampOccupied?.length) {
    for (const raw of stampOccupied) {
      const k = String(raw).trim();
      if (k) keys.add(k);
    }
  }

  return [...keys].sort();
}
