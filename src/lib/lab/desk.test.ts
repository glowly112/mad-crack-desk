import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY,
  SOLID_EMPTY,
  axisDay,
  cellName,
  DESK_HEADERS,
  recipeDeskRow,
  recipeResult,
  strategyMark,
  chartWindow,
  dailyDomain,
  dayWindow,
  floorSeats,
  hopMoves,
  floorNextAction,
  parkedCount,
  recipePack,
  solidRows,
} from "./desk.ts";
import { STAMP } from "./stamp.ts";

test("empty copy is Empty, not a skeleton", () => {
  assert.equal(EMPTY, "Empty");
});

test("solid pack leads; research keep is parked, not income", () => {
  const pack = recipePack(STAMP.recipes);
  assert.equal(STAMP.n_solid, 1);
  assert.equal(pack.solids.length, 1);
  assert.equal(pack.solids[0]?.id, "H-fast-gb-nearoff-win-83959Z");
  assert.equal(pack.keeps.length, 1);
  assert.equal(pack.keeps[0]?.badge, "Parked");
  assert.equal(solidRows(STAMP.recipes, 1)[0]?.badge, "Solid");
  assert.deepEqual(solidRows(STAMP.recipes, 0), []);
  assert.equal(parkedCount(STAMP.counts.keep, STAMP.n_solid), 2);
  assert.equal(SOLID_EMPTY, "No solid recipes on the day tape.");
});

test("a keep dressed as Solid stays out of the pack when n_solid is 0", () => {
  const dressed = [{ ...STAMP.recipes[1], badge: "Solid" as const }];
  assert.equal(recipePack(dressed).solids.length, 1);
  assert.deepEqual(solidRows(dressed, 0), []);
});

test("floor log hops are state changes, not proving ticks", () => {
  const hops = hopMoves(STAMP.moves);
  assert.ok(hops.some((m) => m.to === "Certified"));
  assert.ok(hops.some((m) => m.to === "Dead"));
  assert.ok(hops.every((m) => m.from !== "Proving" || m.to !== "Proving"));
});

test("Floor next action is KEEP on hold while fuse is off, else Empty", () => {
  assert.equal(floorNextAction(STAMP)?.id, "keep-hold-paper");
  assert.equal(floorNextAction({ ...STAMP, fuse_on: true }), null);
  assert.equal(floorNextAction({ fuse_on: false, topBlocker: null }), null);
});

test("floor watching strip is Clerk, Foreman, mill", () => {
  const ids = floorSeats(STAMP.seats).map((s) => s.id);
  assert.deepEqual(ids, ["clerk", "foreman", "igor"]);
});

test("cell names carry country, window, market, and a pick hint", () => {
  assert.equal(cellName("H-fast-gb-nearoff-win-83959Z"), "GB near-off WIN");
  assert.equal(
    cellName("H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49"),
    "NZ morning WIN · one-pick 2.5–4.49",
  );
  assert.equal(cellName("H-fast-au-nearoff-place-83723Z"), "AU near-off PLACE");
  assert.ok(!cellName("H-fast-gb-nearoff-win-83959Z").startsWith("H-"));
});

test("strategy mark is country · window · market · axis", () => {
  assert.equal(strategyMark("H-fast-gb-nearoff-win-83959Z"), "Britain · near-off · winner");
  assert.equal(
    strategyMark("H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49"),
    "New Zealand · morning · winner · one-pick 2.5–4.49",
  );
  assert.equal(strategyMark("AU late-pre WIN · midfield"), "Australia · late-pre · winner · midfield");
  assert.equal(
    strategyMark("Britain · near-off · winner"),
    "Britain · near-off · winner",
  );
  assert.equal(
    strategyMark("Britain · near-off · winner · one-pick"),
    "Britain · near-off · winner · one-pick",
  );
  assert.equal(strategyMark("ZA|morning|WIN"), "South Africa · morning · winner");
  assert.ok(!strategyMark("H-fast-gb-nearoff-win-83959Z").includes("H-"));
  assert.ok(!strategyMark("GB near-off WIN").includes("WIN"));
});

test("recipe board row uses the same columns; missing facts are Empty", () => {
  assert.deepEqual([...DESK_HEADERS], ["Time", "Name", "Side", "Odds", "Stake", "Book", "Result", "P&L"]);
  const solid = recipeDeskRow(STAMP.recipes[0]);
  assert.equal(solid.name, "Britain · near-off · winner");
  assert.equal(solid.time, "Empty");
  assert.equal(solid.odds, "Empty");
  assert.equal(solid.book, "Empty");
  assert.equal(solid.pnl, null);
  assert.equal(solid.result, "Waiting for races");
  const parked = STAMP.recipes.find((r) => r.badge === "Parked");
  assert.ok(parked);
  assert.equal(recipeResult(parked), "Parked");
  assert.equal(recipeDeskRow(parked).name, "New Zealand · morning · winner · one-pick 2.5–4.49");
});

test("daily window and domain keep Empty days off the scale", () => {
  assert.equal(axisDay("2026-08-19"), "19 Aug");
  assert.equal(axisDay("2026-09-02"), "2 Sep");
  const days = STAMP.trends.map((t) => t.day);
  assert.deepEqual(dayWindow(days, "2026-09-02", 8).at(-1), "2026-09-02");
  assert.equal(dayWindow(days, "2026-09-02", 8).length, 8);
  const win = chartWindow(STAMP.trends, "2026-09-02", 8);
  assert.equal(win.at(-1), "2026-09-02");
  assert.ok(win.includes("2026-08-25"));
  assert.ok(STAMP.trends.find((t) => t.day === "2026-08-25")?.paper_live_day_u != null);
  const nums = win.map((d) => STAMP.trends.find((t) => t.day === d)?.paper_live_day_u);
  const [lo, hi] = dailyDomain(nums, 100);
  assert.ok(lo <= -60);
  assert.equal(hi, 100);
  assert.deepEqual(dailyDomain([null, null], 100), [0, 100]);
});
