/** Board reset epoch — hide pre-run leftovers only; post-epoch arms stay on the board. */

import { parseMarket, parseWindow } from "./boards.ts";
import { EMPTY, scrubPostResetTrendPaper } from "./desk.ts";
import type { LiveStamp } from "./from-digest.ts";
import type { Fill } from "./trades.ts";
import { scrubDeskStampArchive } from "./mill-ingest.ts";
import { honestFirstBookOpenFills, settledPaperDayU, isFirstBookTapeFill, deskSettledTapeRollup, archiveTradesTape } from "./trades.ts";
import type { Recipe } from "./stamp.ts";

export const BOARD_RESET_EPOCH = "20260902T101756Z";
export const BOARD_RESET_DAY = "2026-09-02";

const REGIONS_LIST = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;

function compactEpoch(text: string): string | null {
  const m = /(\d{8}T\d{6}Z)/i.exec(text);
  return m?.[1]?.toUpperCase() ?? null;
}

function isPostEpochCompact(epoch: string): boolean {
  return epoch.toUpperCase() >= BOARD_RESET_EPOCH;
}

export function cellIsPostEpochParkedKeep(cell: { id?: unknown; title?: unknown; status?: unknown }): boolean {
  const id = String(cell.id ?? "");
  if (/^H-hyde-/i.test(id) || /^H-fast-/i.test(id)) return false;
  const status = String(cell.status ?? "").toUpperCase();
  if (status !== "KEEP" && status !== "KEPT") return false;
  const fromId = compactEpoch(id);
  return fromId ? isPostEpochCompact(fromId) : false;
}

export function cellIsPostEpochEhole(cell: { id?: unknown; title?: unknown }): boolean {
  const id = String(cell.id ?? "");
  const title = String(cell.title ?? "");
  if (/^H-hyde-/i.test(id) || /^H-fast-/i.test(id)) return false;
  return (
    /^H-ehole-/i.test(id) ||
    /^H-mid-/i.test(id) ||
    /^H-nugget-/i.test(id) ||
    /^ehole_/i.test(title) ||
    /^ehole_/i.test(id)
  );
}

/** Post-epoch invent inner slice — mid/nugget measure books armed inside occupied holes. */
export function isPostEpochInventInnerRecipe(recipe: Pick<Recipe, "id" | "title">): boolean {
  if (/^H-hyde-/i.test(recipe.id) || /^H-fast-/i.test(recipe.id)) return false;
  return /^H-mid-/i.test(recipe.id) || /^H-nugget-/i.test(recipe.id);
}

/** Recipe armed on the board after reset — run stamp in id, ehole invent, or live poll. */
export function recipeIsPostEpoch(recipe: Recipe): boolean {
  if (/^H-hyde-/i.test(recipe.id) || /^H-fast-/i.test(recipe.id)) return false;
  if (/^H-ehole-/i.test(recipe.id) || /^ehole_/i.test(recipe.title)) return true;
  if (isPostEpochInventInnerRecipe(recipe)) return true;
  const fromId = compactEpoch(recipe.id);
  if (fromId) return isPostEpochCompact(fromId);
  if (/H-20260902T/i.test(recipe.id)) return true;
  return false;
}

export function hasPostEpochEholeRecipes(recipes: readonly Recipe[]): boolean {
  return recipes.some(
    (r) => /^H-ehole-/i.test(r.id) || /^ehole_/i.test(r.title) || recipeIsPostEpoch(r),
  );
}

/** Post-epoch invent ehole — never legacy H-fast KEEP or Hyde cousins. */
export function isPostEpochEholeRecipe(recipe: Pick<Recipe, "id" | "title">): boolean {
  if (/^H-hyde-/i.test(recipe.id) || /^H-fast-/i.test(recipe.id)) return false;
  if (isPostEpochInventInnerRecipe(recipe)) return true;
  if (!/^H-ehole-/i.test(recipe.id) && !/^ehole_/i.test(recipe.title)) return false;
  return recipeIsPostEpoch(recipe as Recipe);
}

export function isPostEpochEholeMeasuring(recipe: Pick<Recipe, "id" | "title" | "status">): boolean {
  const st = String(recipe.status ?? "").toUpperCase();
  if (st !== "MEASURING" && st !== "HUNTING") return false;
  return isPostEpochEholeRecipe(recipe);
}

export function fillIsPostEpoch(fill: Fill): boolean {
  if (fill.day && fill.day < BOARD_RESET_DAY) return false;
  const fromTs = compactEpoch(fill.ts);
  if (fromTs) return isPostEpochCompact(fromTs);
  if (fill.day && fill.day >= BOARD_RESET_DAY) return true;
  return false;
}

/** Armed recipes + wait_open chips. Zero means the square is empty. */
export function countArmed(stamp: {
  recipes?: readonly Recipe[];
  wait_open?: readonly { id: string }[];
  mill_n_armed?: number;
  n_armed?: number;
}): number {
  const mill = stamp.mill_n_armed ?? 0;
  const armed = stamp.n_armed ?? 0;
  if (mill > 0) return mill;
  if (armed > 0) return armed;
  return (stamp.recipes?.length ?? 0) + (stamp.wait_open?.length ?? 0);
}

/** Live mill or scoreboard has post-reset arms — never paint the empty overlay. */
export function hasLivePlantArms(stamp: LiveStamp): boolean {
  if (stamp.source !== "oracle") return false;
  const mill = (stamp as LiveStamp & { mill_n_armed?: number }).mill_n_armed ?? 0;
  const armed = (stamp as LiveStamp & { n_armed?: number }).n_armed ?? 0;
  if (mill > 0 || armed > 0) return true;
  if ((stamp.counts?.measuring ?? 0) > 0 || (stamp.counts?.hunting ?? 0) > 0) return true;
  if ((stamp.holes?.length ?? 0) > 0) return true;
  if (hasPostEpochEholeRecipes(stamp.recipes)) return true;
  if (countArmed({ recipes: stamp.recipes, wait_open: stamp.wait_open }) > 0) return true;
  return false;
}

function recipeHoleId(recipe: Recipe): string | null {
  const window = parseWindow(recipe.title);
  const market = parseMarket(recipe.title);
  if (!window || !market) return null;
  return `${recipe.region}|${window}|${market}`;
}

function filterWaitOpen(
  wait_open: LiveStamp["wait_open"],
  allRecipes: readonly Recipe[],
  postRecipes: readonly Recipe[],
): LiveStamp["wait_open"] {
  if (!wait_open?.length) return [];
  const preEpochRecipes = allRecipes.filter((r) => !recipeIsPostEpoch(r));
  const preCells = new Set(
    preEpochRecipes.map(recipeHoleId).filter((x): x is string => Boolean(x)),
  );
  const postCells = new Set(
    postRecipes.map(recipeHoleId).filter((x): x is string => Boolean(x)),
  );
  return wait_open.filter((w) => postCells.has(w.id) || !preCells.has(w.id));
}

/** Drop legacy tape, recipes, fills, and parked holes — keep post-epoch plant facts. */
export function filterPreEpochLeftovers(stamp: LiveStamp): LiveStamp {
  const recipes = stamp.recipes.filter(recipeIsPostEpoch);
  const solids = recipes.filter((r) => r.badge === "Solid");
  /** First-book tape for Trades/Floor — mill history archived off the live board. */
  const trades = archiveTradesTape(stamp.trades, stamp.day, recipes);
  const wait_open = filterWaitOpen(stamp.wait_open ?? [], stamp.recipes, recipes);
  const holes = stamp.holes.filter((h) => h.tone !== "parked");
  const firstBookPaper = deskSettledTapeRollup(trades, stamp.day, recipes).u;

  const trends = scrubPostResetTrendPaper(
    stamp.trends.filter((t) => t.day >= BOARD_RESET_DAY).map((t) =>
      t.day === stamp.day
        ? {
            ...t,
            n_keep: stamp.counts.keep,
            n_measuring: stamp.counts.measuring,
            n_dropped: stamp.counts.kill,
            n_solid: stamp.n_solid,
          }
        : t,
    ),
    trades,
    recipes,
  );

  const dayTrend =
    trends.find((t) => t.day === stamp.day) ??
    ({
      day: stamp.day,
      paper_live_day_u: firstBookPaper,
      factory_day_pnl_u: null,
      n_solid: stamp.n_solid,
      n_keep: stamp.counts.keep,
      n_measuring: stamp.counts.measuring,
      n_dropped: stamp.counts.kill,
    } as LiveStamp["trends"][number]);

  return {
    ...stamp,
    square_occupied_n: (stamp as LiveStamp & { square_occupied_n?: number }).square_occupied_n,
    recipes,
    solids,
    trades,
    wait_open,
    holes,
    hero: { ...stamp.hero, day_u: firstBookPaper },
    n_solid: solids.length > 0 ? solids.length : recipes.length ? stamp.n_solid : 0,
    trends: trends.length ? trends : [dayTrend],
    moves: stamp.moves.filter((m) => {
      const e = compactEpoch(m.recipe);
      return e ? isPostEpochCompact(e) : false;
    }),
    floorLog: stamp.floorLog.filter((row) => {
      const e = compactEpoch(row.line);
      return e ? isPostEpochCompact(e) : false;
    }) as unknown as LiveStamp["floorLog"],
  } as LiveStamp;
}

export function isBoardResetView(stamp: {
  n_solid?: number;
  recipes?: readonly unknown[];
  trades?: readonly unknown[];
  wait_open?: readonly unknown[];
  source?: string;
  counts?: { measuring?: number; hunting?: number };
  holes?: readonly unknown[];
  mill_n_armed?: number;
  n_armed?: number;
  day?: string;
}): boolean {
  if (hasLivePlantArms(stamp as LiveStamp)) return false;
  const recipes = (stamp.recipes ?? []) as Recipe[];
  const trades = (stamp.trades ?? []) as Fill[];
  const postRecipes = recipes.filter(recipeIsPostEpoch);
  const postTrades = trades.filter(isFirstBookTapeFill);
  if (postTrades.length > 0 || honestFirstBookOpenFills(postTrades, postRecipes).length > 0) return false;
  const day = stamp.day ?? "";
  if (day && settledPaperDayU(postTrades, day) != null) return false;
  return (
    countArmed({
      recipes: postRecipes,
      wait_open: stamp.wait_open as { id: string }[] | undefined,
      mill_n_armed: stamp.mill_n_armed,
      n_armed: stamp.n_armed,
    }) === 0
  );
}

function applyEmptyBoardOverlay(stamp: LiveStamp): LiveStamp {
  const day = stamp.day;
  return {
    ...stamp,
    square_occupied_n: (stamp as LiveStamp & { square_occupied_n?: number }).square_occupied_n,
    n_solid: 0,
    fuse_on: false,
    fuse: "Real betting: OFF",
    clerk: "PAPER_ONLY",
    hero: {
      ...stamp.hero,
      day_u: null,
      empty: EMPTY,
    },
    counts: {
      keep: 0,
      certified: 0,
      measuring: 0,
      hunting: 0,
      kill: 0,
      cells: 64,
    },
    researchKeepGbp: 0,
    pipe: {
      pitched: 0,
      proving: 0,
      closed: 0,
      certified: 0,
      scaling: 0,
    },
    recipes: [],
    solids: [],
    trades: [],
    wait_open: [],
    moves: [],
    floorLog: [],
    holes: [],
    coverage: REGIONS_LIST.map((region) => ({
      region,
      keep: 0,
      measuring: 0,
      note: EMPTY,
    })),
    trends: [
      {
        day,
        paper_live_day_u: null,
        factory_day_pnl_u: null,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
      },
    ],
    office: {
      ...stamp.office,
      invent: true,
      inventWhy: "invent on · empty square · new hunt",
      rejects: [],
    },
    hunters: stamp.hunters.map((h) => ({
      ...h,
      note: /no open deals/i.test(h.note) ? h.note : "FLOWING · watching empty square",
    })),
    seats: stamp.seats.map((s) => ({
      ...s,
      now: boardResetSeatNow(s.id),
    })),
    topBlocker: stamp.topBlocker
      ? {
          ...stamp.topBlocker,
          title: "KEEP on hold — not LIVE_CANDIDATE this tick",
          action: "Inspect the KEEP gate. Do not arm the fuse.",
        }
      : null,
    issues: stamp.issues.filter((i) => i.id === "keep-hold-paper"),
  } as unknown as LiveStamp;
}

function boardResetSeatNow(seatId: string): string {
  switch (seatId) {
    case "holdout":
    case "clerk":
      return "empty square · paper Empty · fuse off";
    case "night":
    case "igor":
    case "foreman":
      return "empty square · nothing on today's tape";
    case "auditor":
    case "hyde":
    case "virchow":
      return "empty square · no certified tape";
    case "invent":
    case "mercator":
    case "bauron":
      return "invent on · empty square · new hunt";
    case "wiki":
    case "curator":
      return "files on disk · today's board Empty";
    default:
      return "empty square · new hunt";
  }
}

/**
 * Hide pre-epoch leftovers. When the plant has post-reset arms, serve live facts.
 * When n_armed is zero, paint the empty morning board.
 */
function overlayPaperTape(stamp: LiveStamp): LiveStamp {
  const rollup = deskSettledTapeRollup(stamp.trades, stamp.day, stamp.recipes);
  const paperU = rollup.u;
  if (paperU == null) {
    return {
      ...stamp,
      hero: { ...stamp.hero, day_u: null },
      trends: stamp.trends.some((t) => t.day === stamp.day)
        ? stamp.trends.map((t) =>
            t.day === stamp.day ? { ...t, paper_live_day_u: null } : t,
          )
        : stamp.trends,
    };
  }
  const trends = stamp.trends.some((t) => t.day === stamp.day)
    ? stamp.trends.map((t) => (t.day === stamp.day ? { ...t, paper_live_day_u: paperU } : t))
    : [
        ...stamp.trends,
        {
          day: stamp.day,
          paper_live_day_u: paperU,
          factory_day_pnl_u: null,
          n_solid: stamp.n_solid,
          n_keep: stamp.counts.keep,
          n_measuring: stamp.counts.measuring,
          n_dropped: stamp.counts.kill,
        },
      ];
  return {
    ...stamp,
    hero: { ...stamp.hero, day_u: paperU },
    trends,
  };
}

export function applyBoardResetView(stamp: LiveStamp): LiveStamp {
  const filtered = filterPreEpochLeftovers(stamp);
  if (hasLivePlantArms(filtered)) {
    return scrubDeskStampArchive(
      overlayPaperTape({
        ...filtered,
        fuse_on: false,
        fuse: "Real betting: OFF",
      }),
    );
  }
  if (!isBoardResetView(filtered)) {
    return scrubDeskStampArchive(
      overlayPaperTape({
        ...filtered,
        fuse_on: false,
        fuse: filtered.fuse_on ? "Real betting: ON" : "Real betting: OFF",
      }),
    );
  }
  return scrubDeskStampArchive(applyEmptyBoardOverlay(filtered));
}
