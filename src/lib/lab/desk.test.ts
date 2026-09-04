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
  floorFactDayValue,
  scrubPostResetTrendPaper,
  ensurePostResetTrendDays,
  trendProductionScore,
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
import { assertDeskTapeFloorAligns, deskSettledTapeRollup, fillFromRow } from "./trades.ts";

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

test("floor watching strip is Invent, Holdout, Night", () => {
  const ids = floorSeats(STAMP.seats).map((s) => s.id);
  assert.deepEqual(ids, ["invent", "holdout", "night"]);
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
  const win = chartWindow(STAMP.trends, "2026-08-25", 8);
  assert.equal(win.at(-1), "2026-08-25");
  assert.ok(win.includes("2026-08-19"));
  assert.equal(win.length, 7);
  const nums = win.map((d) => STAMP.trends.find((t) => t.day === d)?.paper_live_day_u);
  const [lo, hi] = dailyDomain(nums);
  assert.ok(lo <= -60);
  assert.ok(hi < 20);
  assert.notEqual(hi, 100);
  assert.ok(!dailyTicks([lo, hi]).includes(100));
  assert.deepEqual(dailyDomain([null, null]), [0, 1]);
});

test("Floor facts are plant numbers, not a 100u quota", () => {
  const facts = floorFacts(STAMP, { day: STAMP.day, lookingBack: false });
  const blob = JSON.stringify(facts).toLowerCase();
  assert.ok(!blob.includes("aim"));
  assert.ok(!blob.includes("behind"));
  assert.ok(!blob.includes("on track"));
  assert.ok(!blob.includes("remaining"));
  assert.ok(!blob.includes("100"));
  assert.ok(!blob.includes("£"));
  assert.equal(facts.find((f) => f.id === "paper")?.value, null);
  assert.equal(facts.find((f) => f.id === "production")?.value, null);
  assert.equal(facts.find((f) => f.id === "live")?.value, null);
  assert.deepEqual(facts.map((f) => f.id), ["paper", "production", "live"]);
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
  );
  assert.equal(hydeFacts.find((f) => f.id === "paper")?.value, null);
  const tally = hopTally(STAMP.moves);
  assert.ok(tally.some((t) => t.label === "Certified" && t.n === 1));
});

test("Floor paper chart uses first-book tape on post-reset days", () => {
  const stamp = {
    ...STAMP,
    day: "2026-09-03",
    trades: [],
    trends: [
      ...STAMP.trends,
      {
        day: "2026-09-03",
        paper_live_day_u: -3.71 as number | null,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
        factory_day_pnl_u: null,
      },
    ],
  };
  assert.equal(floorFactDayValue(stamp, "paper", "2026-09-03"), null);
  const scrubbed = scrubPostResetTrendPaper(stamp.trends, [], stamp.recipes);
  assert.equal(scrubbed.find((t) => t.day === "2026-09-03")?.paper_live_day_u, null);
});

test("ensurePostResetTrendDays restores missing settled days on the chart", () => {
  const day = "2026-09-03";
  const deskDay = "2026-09-04";
  const wins = Array.from({ length: 16 }, (_, i) =>
    fillFromRow({
      pick_id: `trend-w-${i}`,
      date: day,
      cell_id: `H-ehole-gb-morning-win-${String(10000 + i)}Z`,
      mode: "auto_dry",
      status: "SETTLED",
      paper_pnl_gbp: 1,
      stake_gbp: 2,
      placed_result: true,
      side: "BACK",
      ts: `2026-09-03T10:${String(i).padStart(2, "0")}:00Z`,
    })!,
  );
  const losses = Array.from({ length: 47 }, (_, i) =>
    fillFromRow({
      pick_id: `trend-l-${i}`,
      date: day,
      cell_id: `H-ehole-ie-nearoff-win-${String(20000 + i)}Z`,
      mode: "auto_dry",
      status: "SETTLED",
      paper_pnl_gbp: -0.5,
      stake_gbp: 2,
      placed_result: false,
      side: "BACK",
      ts: `2026-09-03T11:${String(i).padStart(2, "0")}:00Z`,
    })!,
  );
  const trades = [...wins, ...losses].filter(Boolean) as NonNullable<ReturnType<typeof fillFromRow>>[];
  const rollup = deskSettledTapeRollup(trades, day, []);
  const trendsMissingDay = STAMP.trends.filter((t) => t.day !== day);
  const ensured = ensurePostResetTrendDays(trendsMissingDay, trades, [], deskDay);
  const sep3 = ensured.find((t) => t.day === day);
  assert.ok(sep3);
  assert.equal(sep3?.paper_live_day_u, null);
  assert.equal(rollup.u, -3.75);
  assert.equal(sep3?.factory_day_pnl_u, null);
  assert.ok(ensured.some((t) => t.day === deskDay));
  const solidDay = { ...sep3!, n_solid: 1, paper_live_day_u: rollup.u };
  assert.equal(trendProductionScore(solidDay), rollup.u);
});

test("Floor paper tile matches Trades settled tape roll-up", () => {
  const harb = fillFromRow({
    pick_id: "harb-34829",
    date: "2026-09-03",
    cell_id: "H-ehole-gb-latepre-win-34829Z",
    mode: "auto_dry",
    status: "SETTLED",
    horse_name: "Harb",
    paper_pnl_gbp: 3.724,
    stake_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-03T14:00:00Z",
  })!;
  const spl = fillFromRow({
    pick_id: "spl-73339",
    date: "2026-09-03",
    cell_id: "H-ehole-ie-nearoff-win-73339Z",
    mode: "auto_dry",
    status: "SETTLED",
    horse_name: "Splendid Fellow",
    paper_pnl_gbp: 1.47,
    stake_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-03T15:00:00Z",
  })!;
  const trades = [harb!, spl!];
  const day = "2026-09-03";
  const rollup = deskSettledTapeRollup(trades, day, []);
  const facts = floorFacts(
    { ...STAMP, day, trades, trends: STAMP.trends },
    { day, lookingBack: false },
  );
  const paper = facts.find((f) => f.id === "paper");
  assert.equal(paper?.value, rollup.u);
  assert.equal(paper?.countsLine, rollup.countsLine);
  assertDeskTapeFloorAligns(trades, day, [], paper?.value ?? null, rollup.counts);
});
