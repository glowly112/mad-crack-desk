/** Matrix keys for hollow occupancy — client-safe (no node:fs). */

import { parseWindow } from "./boards.ts";

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
