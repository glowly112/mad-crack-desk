/** Morning board reset view — empty Floor and Trades. Plant files on disk stay untouched. */

import { EMPTY } from "./desk.ts";
import type { LiveStamp } from "./from-digest.ts";

const REGIONS_LIST = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;

export function isBoardResetView(stamp: {
  n_solid?: number;
  recipes?: readonly unknown[];
  trades?: readonly unknown[];
}): boolean {
  return stamp.n_solid === 0 && (stamp.recipes?.length ?? 0) === 0 && (stamp.trades?.length ?? 0) === 0;
}

/** Strip legacy tape, recipes, and fills from whatever poll returned — desk shows a fresh hunt. */
export function applyBoardResetView(stamp: LiveStamp): LiveStamp {
  const day = stamp.day;
  return {
    ...stamp,
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
    case "clerk":
      return "empty square · paper Empty · fuse off";
    case "igor":
      return "empty square · nothing on today's tape";
    case "hyde":
      return "empty square · no certified tape";
    case "foreman":
      return "empty square · new hunt";
    case "mercator":
      return "watching empty holes on the square";
    case "bauron":
      return "invent on · empty square · new hunt";
    case "curator":
      return "files on disk · today's board Empty";
    case "virchow":
      return "old kills stay in the archive · not on the board";
    default:
      return "empty square · new hunt";
  }
}
