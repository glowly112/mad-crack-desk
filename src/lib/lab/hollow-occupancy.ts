/** Rebuild full hollow occupancy keys (bbb truncates occupied_cells to 24 in hunt stamp). */

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseWindow } from "./boards.ts";

function rec(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function matrixKeyFromScoreboardCell(c: Record<string, unknown>): string | null {
  const cs = c.country_scope;
  const ws = c.window_scope;
  const mt = c.market_type;
  if (!Array.isArray(cs) || !cs.length || !Array.isArray(ws) || !ws.length) return null;
  const region = String(cs[0]).toUpperCase();
  const window = String(ws[0]);
  const market = typeof mt === "string" && mt.trim() ? mt.toUpperCase() : "WIN";
  return `${region}|${window}|${market}`;
}

export function matrixKeyFromArmedYamlName(name: string): string | null {
  const ehole = /H-ehole-([a-z]{2})-([a-z]+)-(win|place|lay)/i.exec(name);
  if (ehole) {
    const region = ehole[1].toUpperCase();
    const window = parseWindow(ehole[2]) ?? parseWindow(ehole[2].replace(/([a-z])([a-z])/g, "$1_$2"));
    const market = ehole[3].toUpperCase();
    if (!window) return null;
    return `${region}|${window}|${market}`;
  }
  const steam = /^\d{8}T\d{6}Z_\d+_([A-Z]{2})_((?:near_off|late_pre|in_play|morning|[a-z_]+))_(WIN|PLACE|LAY)_/i.exec(
    name,
  );
  if (steam) {
    const region = steam[1].toUpperCase();
    const window = parseWindow(steam[2]) ?? steam[2].toLowerCase();
    const market = steam[3].toUpperCase();
    if (!window) return null;
    return `${region}|${window}|${market}`;
  }
  return null;
}

/** Match firm_runtime hollow_occupancy_counts — path mtime since hollow reset + armed yaml. */
export async function computeHollowOccupiedKeys(
  root: string,
  cells: unknown[],
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

  const keys = new Set<string>();
  const countedPaths = new Set<string>();

  for (const row of cells) {
    const c = rec(row);
    if (!c) continue;
    const st = String(c.status ?? "").toUpperCase();
    if (st !== "KEEP" && st !== "MEASURING" && st !== "HUNTING") continue;
    const pathRaw = c.path;
    if (typeof pathRaw !== "string" || !pathRaw.trim()) continue;
    const p = pathRaw.startsWith("/") ? pathRaw : join(root, pathRaw);
    try {
      const { mtimeMs } = await stat(p);
      if (mtimeMs / 1000 < resetUnix - 0.001) continue;
      countedPaths.add(p);
    } catch {
      continue;
    }
    const key = matrixKeyFromScoreboardCell(c);
    if (key) keys.add(key);
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

  return [...keys].sort();
}
