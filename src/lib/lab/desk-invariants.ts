/** Permanent desk laws — codified invariants for Floor, occupancy, and mill ingest. */

import type { LiveStamp } from "./from-digest.ts";
import { SQUARE_HOLE_COUNT, squareOccupancyCounts } from "./boards.ts";
import { floorFacts } from "./desk.ts";
import { deskSettledTapeRollup } from "./trades.ts";

export type StampWithOccupancy = LiveStamp & { square_occupied_n?: number };

export function stampSquareOccupiedN(stamp: LiveStamp): number | undefined {
  return (stamp as StampWithOccupancy).square_occupied_n;
}

/** Law 2: empty-of-64 caption from live mill occupancy, not painted grid lag. */
export function floorEmptyFromStamp(
  stamp: LiveStamp,
  paintedOccupied = 0,
  total = SQUARE_HOLE_COUNT,
): number {
  return squareOccupancyCounts({
    squareOccupiedN: stampSquareOccupiedN(stamp),
    paintedOccupied,
    total,
  }).emptyN;
}

/** Law 1: Floor Paper tile value must equal today's settled tape roll-up. */
export function floorPaperFromStamp(stamp: LiveStamp): number | null {
  const rollup = deskSettledTapeRollup(stamp.trades ?? [], stamp.day, stamp.recipes ?? []);
  const facts = floorFacts(stamp, { day: stamp.day, lookingBack: false });
  const paper = facts.find((f) => f.id === "paper");
  return paper?.value ?? null;
}

/** Law 1: mill factory_day_pnl must never paint post-reset trend paper. */
export function trendsFactoryPaperCleared(stamp: LiveStamp): boolean {
  return stamp.trends
    .filter((t) => t.day >= "2026-09-02")
    .every((t) => t.factory_day_pnl_u == null);
}

/** Law 2: scrub must never drop square_occupied_n when input carried it. */
export function scrubPreservesSquareOccupied(before: LiveStamp, after: LiveStamp): boolean {
  const beforeN = stampSquareOccupiedN(before);
  if (beforeN == null || beforeN <= 0) return true;
  return stampSquareOccupiedN(after) === beforeN;
}
