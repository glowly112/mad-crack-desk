import assert from "node:assert/strict";
import { test } from "node:test";
import { floorRacingSquare } from "./boards.ts";
import { applyBoardResetView, isBoardResetView } from "./board-reset.ts";
import { STAMP } from "./stamp.ts";
import { EMPTY } from "./desk.ts";
import { seatBubbles } from "./staff-voice.ts";

test("board reset view is empty tape and empty recipes", () => {
  const reset = applyBoardResetView(STAMP as import("./from-digest.ts").LiveStamp);
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
  const reset = applyBoardResetView(STAMP as import("./from-digest.ts").LiveStamp);
  const holes = floorRacingSquare({ namedHoles: reset.holes });
  assert.equal(holes.length, 64);
  assert.equal(holes.filter((h) => h.tone === "empty").length, 64);
  assert.equal(holes.find((h) => h.id === "GB|near_off|WIN")?.tone, "empty");
});

test("staff on board reset watches empty square, not Britain tape", () => {
  const reset = applyBoardResetView(STAMP as import("./from-digest.ts").LiveStamp);
  const clerk = seatBubbles(reset.seats.find((s) => s.id === "clerk")!, reset).map((b) => b.text).join(" ");
  assert.match(clerk, /empty/i);
  assert.ok(!clerk.includes("Britain · near-off"));
  const igor = seatBubbles(reset.seats.find((s) => s.id === "igor")!, reset).map((b) => b.text).join(" ");
  assert.match(igor, /empty square/i);
  assert.ok(!igor.includes("paper bets already on the books"));
});

test("STAMP is not board reset — office tests keep legacy tape", () => {
  assert.equal(isBoardResetView(STAMP), false);
  assert.ok(STAMP.recipes.length > 0);
});
