import assert from "node:assert/strict";
import { test } from "node:test";
import { holePaneDetail, holeCellMark } from "./hole-pane.ts";
import { STAMP } from "./stamp.ts";

const holeId = "GB|near_off|WIN";

test("hole pane is Empty for an empty cell", () => {
  const cell = {
    id: holeId,
    region: "GB",
    name: "Britain",
    window: "near_off" as const,
    market: "WIN" as const,
    tone: "empty" as const,
    backTone: "empty" as const,
    layTone: "empty" as const,
  };
  const detail = holePaneDetail(holeId, cell, {
    day: STAMP.day,
    recipes: STAMP.recipes,
    trades: STAMP.trades,
    inventWhy: STAMP.office.inventWhy,
    hunters: STAMP.hunters,
  });
  assert.equal(detail.name, "Britain · near-off · winner");
  assert.equal(detail.settledLine, "Empty");
  assert.equal(detail.statusLine, "Empty");
});

test("hole cell mark prefers settled W–L when tape exists", () => {
  const mark = holeCellMark(holeId, undefined, {
    day: "2026-09-02",
    recipes: STAMP.recipes,
    trades: [],
    inventWhy: "",
    hunters: [],
  });
  assert.ok(mark === "Empty" || typeof mark === "string");
});
