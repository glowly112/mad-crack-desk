import assert from "node:assert/strict";
import { test } from "node:test";
import { floorRacingSquare, parseHole } from "./boards.ts";
import {
  applyBoardResetView,
  BOARD_RESET_EPOCH,
  cellIsPostEpochEhole,
  countArmed,
  filterPreEpochLeftovers,
  isBoardResetView,
  recipeIsPostEpoch,
} from "./board-reset.ts";
import { applySnapshot } from "./from-snapshot.ts";
import type { LiveStamp } from "./from-digest.ts";
import { STAMP } from "./stamp.ts";
import { EMPTY } from "./desk.ts";
import { seatBubbles } from "./staff-voice.ts";

const POST_EPOCH_RECIPE = {
  id: "H-20260902T120000Z-au-nearoff-win-midfield",
  title: "AU near-off WIN · midfield",
  region: "AU" as const,
  status: "MEASURING" as const,
  badge: "Research" as const,
  chip: null,
  n: 12,
  roi: 22.4,
  freezePnl: 18.5,
  why: "Still proving. Not the score.",
};

test("pre-epoch STAMP leftovers are hidden", () => {
  assert.equal(recipeIsPostEpoch(STAMP.recipes[0]!), false);
  const filtered = filterPreEpochLeftovers(STAMP as unknown as LiveStamp);
  assert.equal(filtered.recipes.length, 0);
  assert.equal(filtered.trades.length, 0);
});

test("post-epoch recipe survives filter and is not wiped", () => {
  const stamp = {
    ...STAMP,
    recipes: [POST_EPOCH_RECIPE],
    solids: [],
    trades: [],
    wait_open: [],
  } as unknown as LiveStamp;
  const view = applyBoardResetView(stamp);
  assert.equal(isBoardResetView(view), false);
  assert.equal(view.recipes.length, 1);
  assert.equal(view.recipes[0]?.id, POST_EPOCH_RECIPE.id);
  assert.equal(view.recipes[0]?.region, "AU");
  assert.equal(countArmed(view), 1);
});

test("board reset view is empty tape when n_armed=0", () => {
  const reset = applyBoardResetView(STAMP as unknown as LiveStamp);
  assert.equal(isBoardResetView(reset), true);
  assert.equal(reset.n_solid, 0);
  assert.equal(reset.trades.length, 0);
  assert.equal(reset.recipes.length, 0);
  assert.equal(reset.wait_open?.length ?? 0, 0);
  assert.equal(reset.hero.day_u, null);
  assert.equal(reset.fuse_on, false);
  assert.ok(reset.trends.every((t) => t.paper_live_day_u == null));
  assert.equal(reset.trends.length, 1);
  assert.equal(reset.trends[0]?.day, reset.day);
});

test("floor square is 64 empty holes on board reset", () => {
  const reset = applyBoardResetView(STAMP as unknown as LiveStamp);
  const holes = floorRacingSquare({ namedHoles: reset.holes });
  assert.equal(holes.length, 64);
  assert.equal(holes.filter((h) => h.tone === "empty").length, 64);
  assert.equal(holes.find((h) => h.id === "GB|near_off|WIN")?.tone, "empty");
});

test("staff on board reset watches empty square, not Britain tape", () => {
  const reset = applyBoardResetView(STAMP as unknown as LiveStamp);
  const clerk = seatBubbles(reset.seats.find((s) => s.id === "clerk")!, reset).map((b) => b.text).join(" ");
  assert.match(clerk, /empty/i);
  assert.ok(!clerk.includes("Britain · near-off"));
  const igor = seatBubbles(reset.seats.find((s) => s.id === "igor")!, reset).map((b) => b.text).join(" ");
  assert.match(igor, /empty square/i);
  assert.ok(!igor.includes("paper bets already on the books"));
});

test("STAMP legacy recipes do not count as armed — post-epoch arms only", () => {
  assert.ok(STAMP.recipes.length > 0);
  assert.equal(isBoardResetView(STAMP), true);
});

test("ehole measuring cell survives post-epoch filter", () => {
  const ehole = {
    id: "H-ehole-au-nearoff-win-34829Z",
    title: "ehole_au_near_off_win_34829Z",
    region: "AU" as const,
    status: "MEASURING" as const,
    badge: "Research" as const,
    chip: null,
    n: 3,
    roi: 0,
    freezePnl: 0,
    why: "Still proving. Not the score.",
  };
  assert.equal(recipeIsPostEpoch(ehole), true);
  const view = applyBoardResetView({
    ...STAMP,
    source: "oracle",
    generated: "20260902T235019Z",
    recipes: [ehole],
    trades: [],
    wait_open: [],
  } as unknown as LiveStamp);
  assert.equal(view.recipes.length, 1);
  assert.equal(isBoardResetView(view), false);
});

test("Hyde KEEP does not paint GB near-off WIN when oracle has ehole arms", () => {
  const hyde = {
    id: "H-hyde-GB_near_off_WIN_steam_fade_residual_one_pick_BAC",
    title: "GB near-off WIN steam fade",
    region: "GB" as const,
    status: "KEEP" as const,
    badge: "Parked" as const,
    chip: null,
    n: 40,
    roi: 12,
    freezePnl: 80,
    why: "Research keep.",
  };
  const ehole = {
    id: "H-ehole-gb-late-pre-win-34829Z",
    title: "ehole_gb_late_pre_win_34829Z",
    region: "GB" as const,
    status: "HUNTING" as const,
    badge: "Research" as const,
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Looking.",
  };
  assert.equal(recipeIsPostEpoch(hyde), false);
  const stamp = applyBoardResetView({
    ...STAMP,
    source: "oracle",
    generated: "20260903T001118Z",
    n_armed: 2,
    mill_n_armed: 0,
    recipes: [hyde, ehole],
    holes: [
      { region: "GB", window: "near_off", market: "WIN", tone: "parked" },
      { region: "GB", window: "late_pre", market: "WIN", tone: "hunt" },
    ],
    trades: [],
    wait_open: [],
  } as unknown as LiveStamp);
  assert.equal(stamp.recipes.length, 1);
  assert.equal(stamp.recipes[0]?.id, ehole.id);
  const holes = floorRacingSquare({ namedHoles: stamp.holes });
  assert.equal(holes.find((h) => h.id === "GB|near_off|WIN")?.tone, "empty");
  assert.equal(holes.find((h) => h.id === "GB|late_pre|WIN")?.tone, "hunt");
});

test("scoreboard ehole cells paint holes including KILL and ignore Hyde", () => {
  const cells = [
    {
      id: "H-hyde-GB_near_off_WIN_steam_fade_residual_one_pick_BAC",
      title: "hyde residual",
      status: "KEEP",
    },
    {
      id: "H-ehole-gb-late-pre-place-01107Z",
      title: "ehole_gb_late_pre_place_01107Z",
      status: "HUNTING",
      n: 0,
    },
    {
      id: "H-ehole-nz-late-pre-place-01107Z",
      title: "ehole_nz_late_pre_place_01107Z",
      status: "MEASURING",
      n: 3,
    },
    {
      id: "H-ehole-au-nearoff-win-34829Z",
      title: "ehole_au_near_off_win_34829Z",
      status: "KILL",
    },
  ];
  assert.ok(cellIsPostEpochEhole(cells[1]!));
  assert.ok(!cellIsPostEpochEhole(cells[0]!));
  assert.ok(parseHole("nz late pre place 01107Z"));
  const base = STAMP as unknown as LiveStamp;
  const snap = applySnapshot({ cells, truth: {}, summary: {} }, base);
  const holes = floorRacingSquare({ namedHoles: snap.holes });
  assert.equal(holes.find((h) => h.id === "GB|near_off|WIN")?.tone, "empty");
  assert.equal(holes.find((h) => h.id === "GB|late_pre|PLACE")?.tone, "hunt");
  assert.equal(holes.find((h) => h.id === "NZ|late_pre|PLACE")?.tone, "idea");
  assert.equal(holes.find((h) => h.id === "AU|near_off|WIN")?.tone, "loss");
  assert.equal(snap.recipes.length, 2);
});
