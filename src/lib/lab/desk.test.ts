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
  recipeBookName,
  bookDisplayName,
  isHoleOnlyMark,
  chartWindow,
  dailyDomain,
  dailyTicks,
  dayWindow,
  ensureWindowEndsOn,
  floorFacts,
  hopTally,
  floorSeats,
  hopMoves,
  floorNextAction,
  floorNextLine,
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
  const line = floorNextLine(STAMP);
  assert.ok(line);
  assert.ok(!/KEEP|LIVE_CANDIDATE|fuse gate/i.test(line!));
  assert.match(line!, /fuse stays off/i);
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

test("recipe book name adds hunter and run — never hole title alone", () => {
  assert.equal(
    recipeBookName({
      id: "H-ehole-nz-latepre-place-00206Z",
      title: "ehole_nz_late_pre_place_00206Z",
      hunterName: "Geo",
    }),
    "New Zealand · late-pre · place · Geo · 00206Z",
  );
  assert.equal(
    bookDisplayName({
      id: "H-ehole-gb-morning-place-73339Z",
      title: "ehole_gb_morning_place_73339Z",
      hunterName: "Card",
    }),
    "Britain · morning · place · Card · 73339Z",
  );
  assert.ok(isHoleOnlyMark("Australia · morning · winner"));
  assert.ok(!isHoleOnlyMark("Australia · morning · winner · one-pick 2.5–4.49"));
});

test("recipe board row uses Market and Side columns; missing facts are Empty", () => {
  assert.deepEqual([...DESK_HEADERS], [
    "Time",
    "Name",
    "Market",
    "Side",
    "Odds",
    "Stake",
    "Book",
    "Result",
    "P&L",
  ]);
  const solid = recipeDeskRow(STAMP.recipes[0]);
  assert.equal(solid.name, "Britain · near-off · winner");
  assert.equal(solid.time, "Waiting");
  assert.equal(solid.market, "WIN");
  assert.equal(solid.side, EMPTY);
  assert.equal(solid.odds, "Waiting");
  assert.equal(solid.book, "paper");
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
  assert.equal(axisDay("2026-09-03"), "3 Sep");
  const days = STAMP.trends.map((t) => t.day);
  assert.deepEqual(dayWindow(days, "2026-09-02", 8).at(-1), "2026-09-02");
  assert.equal(dayWindow(days, "2026-09-02", 8).length, 8);
  const ahead = dayWindow(days, "2026-09-03", 8);
  assert.equal(ahead.at(-1), "2026-09-03");
  assert.ok(ahead.includes("2026-09-02"));
  const anchored = ensureWindowEndsOn("2026-09-03", ["2026-08-27", "2026-09-02"], 8);
  assert.equal(anchored.at(-1), "2026-09-03");
  const win = chartWindow(STAMP.trends, "2026-09-02", 8);
  assert.equal(win.at(-1), "2026-09-02");
  assert.ok(win.includes("2026-08-26"));
  assert.equal(win.length, 8);
  const nums = win.map((d) => STAMP.trends.find((t) => t.day === d)?.paper_live_day_u);
  const [lo, hi] = dailyDomain(nums);
  assert.ok(lo <= -60);
  assert.ok(hi < 20);
  assert.notEqual(hi, 100);
  assert.ok(!dailyTicks([lo, hi]).includes(100));
  assert.deepEqual(dailyDomain([null, null]), [0, 1]);
});

test("Floor facts are plant numbers, not a 100u quota", () => {
  const emptyHoles = 42;
  const facts = floorFacts(STAMP, { day: STAMP.day, lookingBack: false }, emptyHoles);
  const blob = JSON.stringify(facts).toLowerCase();
  assert.ok(!blob.includes("aim"));
  assert.ok(!blob.includes("behind"));
  assert.ok(!blob.includes("on track"));
  assert.ok(!blob.includes("remaining"));
  assert.ok(!blob.includes("100"));
  assert.ok(!blob.includes("£"));
  assert.equal(facts.find((f) => f.id === "holes")?.value, emptyHoles);
  assert.equal(facts.find((f) => f.id === "paper")?.value, null);
  assert.equal(facts.find((f) => f.id === "production")?.value, null);
  assert.equal(facts.find((f) => f.id === "live")?.value, null);
  assert.deepEqual(facts.map((f) => f.id), ["holes", "paper", "production", "live"]);
  const hydeFacts = floorFacts(
    {
      ...STAMP,
      trades: [
        {
          id: "hyde-1",
          ts: "2026-09-03T12:00:00Z",
          t: "12:00",
          day: STAMP.day,
          recipe: "GB morning WIN",
          recipeId: "H-hyde-gb-morning-win",
          market: "WIN",
          book: "paper",
          side: "BACK",
          odds: 3,
          stake: 1,
          result: "lost",
          flight: null,
          liquidity: null,
          pnl: -3.71,
          horse: null,
        },
      ],
    },
    { day: STAMP.day, lookingBack: false },
    emptyHoles,
  );
  assert.equal(hydeFacts.find((f) => f.id === "paper")?.value, null);
  const tally = hopTally(STAMP.moves);
  assert.ok(tally.some((t) => t.label === "Certified" && t.n === 1));
});
