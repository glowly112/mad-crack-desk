/** Fail-closed mill ingest — archive Hyde/history off the desk; never mix into tiles or stamps. */

import { BOARD_RESET_DAY } from "./board-reset.ts";
import { EMPTY, scrubPostResetTrendPaper, ensurePostResetTrendDays } from "./desk.ts";
import type { LiveStamp } from "./from-digest.ts";
import type { Recipe } from "./stamp.ts";
import {
  archiveTradesTape,
  assertDeskTapeFloorAligns,
  deskSettledTapeRollup,
  ingestMillFills,
} from "./trades.ts";

/** Mill-history / Hyde / quota strings that must not paint on the desk. */
export const MILL_ARCHIVE_POISON =
  /\baim\b|£?\s*100\s*\/?\s*(?:day|u)|100u\/day|hyde\s+paper|H-hyde-|H-fast-|factory_day|dry_bets|occupancy_post|mill[\s-]?history|\b254\s+settled|-139\.58|-140u?|-67\.63|68\s*win\s*·\s*183/i;

export function isMillArchivePoison(text: string): boolean {
  return Boolean(text && MILL_ARCHIVE_POISON.test(text));
}

/** Drop Hyde/fast/freeze rows before parseFills. */
export function filterIngestMillFillRows(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  const out: Record<string, unknown>[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const cell = String(r.cell_id ?? r.recipeId ?? "").trim();
    const pick = String(r.pick_id ?? r.id ?? "").trim();
    if (/^H-hyde-/i.test(cell) || /^H-fast-/i.test(cell)) continue;
    if (/H-hyde-|H-fast-/i.test(pick)) continue;
    const mode = String(r.mode ?? "").toLowerCase();
    if (mode === "freeze" || mode === "dry_bets") continue;
    out.push(r);
  }
  return out;
}

export function scrubMillWatchingLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return EMPTY;
  if (!isMillArchivePoison(trimmed)) return trimmed;
  const kept = trimmed
    .split(/[·|]/)
    .map((s) => s.trim())
    .filter((seg) => seg && !isMillArchivePoison(seg));
  return kept.length ? kept.join(" · ") : EMPTY;
}

function scrubMillKpiDetail(detail: string): string {
  const scrubbed = scrubMillWatchingLine(detail);
  return scrubbed === EMPTY ? EMPTY : scrubbed;
}

function keepCountOnBoard(recipes: readonly Recipe[]): number {
  return recipes.filter((r) => r.status === "KEEP").length;
}

/**
 * Floor Paper = Trades › Settled first-book sum. Mill stamp paper_live_day_u and
 * factory_day_pnl_u never override the tape roll-up.
 */
export function sealFloorPaperFromTape(stamp: LiveStamp): LiveStamp {
  const day = stamp.day;
  const recipes = stamp.recipes ?? [];
  const trades = ingestMillFills(stamp.trades ?? [], day, recipes);
  const rollup = deskSettledTapeRollup(trades, day, recipes);
  const trends = ensurePostResetTrendDays(stamp.trends, trades, recipes, day);
  const sealed: LiveStamp = {
    ...stamp,
    trades,
    trends,
    hero: {
      ...stamp.hero,
      day_u: day >= BOARD_RESET_DAY ? rollup.u : stamp.hero.day_u,
    },
    fuse_on: false,
    fuse: "Real betting: OFF",
  };
  if (day >= BOARD_RESET_DAY) {
    assertDeskTapeFloorAligns(trades, day, recipes, rollup.u, rollup.counts);
  }
  return sealed;
}

/** Oracle stamp — first-book tape, no mill freeze £, no factory history, no occupancy dumps. */
export function scrubDeskStampArchive(stamp: LiveStamp): LiveStamp {
  const day = stamp.day;
  const recipes = stamp.recipes ?? [];
  const trades = ingestMillFills(stamp.trades ?? [], day, recipes);

  const trends = scrubPostResetTrendPaper(
    stamp.trends.map((t) =>
      t.day >= BOARD_RESET_DAY ? { ...t, factory_day_pnl_u: null } : t,
    ),
    trades,
    recipes,
  );

  const boardKeep = keepCountOnBoard(recipes);
  const nKeep = boardKeep;

  const seats = stamp.seats.map((seat) => {
    const now = scrubMillWatchingLine(seat.now ?? "");
    const poison = isMillArchivePoison(seat.now ?? "");
    const status =
      poison && seat.id === "hyde"
        ? ("AMBER" as const)
        : poison && (seat.id === "clerk" || seat.id === "foreman")
          ? seat.status
          : poison
            ? ("AMBER" as const)
            : seat.status;
    return { ...seat, now: now === EMPTY ? boardResetSeatHint(seat.id) : now, status };
  });

  const kpis = stamp.kpis.map((k) => ({
    ...k,
    detail: scrubMillKpiDetail(k.detail),
    status: isMillArchivePoison(k.detail) && k.id === "factory" ? ("AMBER" as const) : k.status,
  }));

  const sealed = sealFloorPaperFromTape({
    ...stamp,
    trades,
    trends,
    seats,
    kpis: kpis as unknown as LiveStamp["kpis"],
    plantLine: scrubMillWatchingLine(stamp.plantLine ?? ""),
    office: {
      ...stamp.office,
      inventWhy: scrubMillWatchingLine(stamp.office.inventWhy ?? ""),
    },
    square_occupied_n: undefined,
    researchKeepGbp: 0,
    hero: {
      ...stamp.hero,
      aim_u: 0 as typeof stamp.hero.aim_u,
      aim_vs: "behind" as const,
    },
    counts: {
      ...stamp.counts,
      keep: nKeep,
      certified: stamp.n_solid,
    },
  } as LiveStamp);
  return sealed;
}

function boardResetSeatHint(seatId: string): string {
  switch (seatId) {
    case "hyde":
      return "nothing certified on today's tape";
    case "clerk":
      return "paper from today's settled tape only";
    case "foreman":
      return "today's board · not mill history";
    case "bauron":
      return stampInventFallback();
    default:
      return "today's first-book tape only";
  }
}

function stampInventFallback(): string {
  return "invent on · empty-hole hunt";
}

/** Digest / freeze boot — never paint mill history rows or freeze KEEP £. */
export function scrubDigestStampArchive(stamp: LiveStamp): LiveStamp {
  const scrubbed = scrubDeskStampArchive({
    ...stamp,
    trades: ingestMillFills(stamp.trades ?? [], stamp.day, stamp.recipes ?? []),
  });
  return {
    ...scrubbed,
    trends: scrubbed.trends.map((t) =>
      t.day >= BOARD_RESET_DAY
        ? {
            ...t,
            paper_live_day_u: null,
            factory_day_pnl_u: null,
            n_keep: keepCountOnBoard(scrubbed.recipes),
          }
        : t,
    ),
    hero: { ...scrubbed.hero, day_u: null },
  };
}
