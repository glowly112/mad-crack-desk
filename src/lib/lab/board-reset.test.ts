import assert from "node:assert/strict";
import { test } from "node:test";
import { floorRacingSquare } from "./boards.ts";
import {
  applyBoardResetView,
  BOARD_RESET_EPOCH,
  countArmed,
  filterPreEpochLeftovers,
  isBoardResetView,
  recipeIsPostEpoch,
} from "./board-reset.ts";
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

test("epoch constant matches frozen reset stamp", () => {
  assert.equal(STAMP.generated, BOARD_RESET_EPOCH);
});
