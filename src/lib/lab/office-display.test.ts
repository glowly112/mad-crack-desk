import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import { officeBookCounts, officeBookRows, officeBookRecipes, officePaperTotals, officeProductionHeroValue } from "./office-display.ts";
import { settledPaperDayU } from "./trades.ts";
import { EMPTY } from "./desk.ts";
import { STAMP } from "./stamp.ts";

function ehole(id: string, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id,
    title: id.replace(/^H-ehole-/, "ehole_").replace(/-/g, "_"),
    region: "NZ",
    status: "MEASURING",
    badge: "Research",
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Still proving.",
    hunterName: "Geo",
    ...overrides,
  };
}

const day = "2026-09-03";

test("office book rows include hole, strategy, side, market, state", () => {
  const rows = officeBookRows({
    recipes: [ehole("H-ehole-nz-morning-win-73508Z", { region: "NZ" })],
    day,
  });
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.hole, /New Zealand/);
  assert.match(rows[0]!.hole, /WIN/);
  assert.equal(rows[0]!.state, "measuring");
  assert.equal(rows[0]!.paperPnl, "Empty");
  assert.equal(rows[0]!.paperCounts, "Empty");
});

test("measuring row shows today's paper settles — measuring is not KEEP", () => {
  const recipe = ehole("H-ehole-nz-morning-win-73508Z", { region: "NZ" });
  const trades = [
    {
      id: "p1",
      ts: "2026-09-03T10:00:00Z",
      t: "11:00",
      day,
      recipe: recipe.title,
      recipeId: recipe.id,
      market: "WIN 3",
      book: "paper" as const,
      side: "BACK",
      odds: 3,
      stake: 1,
      result: "lost" as const,
      flight: null,
      liquidity: null,
      pnl: -1.5,
      horse: null,
    },
  ];
  const rows = officeBookRows({ recipes: [recipe], day, trades });
  assert.equal(rows[0]?.paperPnl, "−1.50u");
  assert.equal(rows[0]?.paperPnlTone, "down");
  assert.equal(rows[0]?.paperCounts, "0–1 · n=1 · since armed");
  assert.equal(rows[0]?.paperTodayCounts, "today 0–1 · n=1");
  assert.equal(rows[0]?.productionPnl, "Empty");
  assert.equal(rows[0]?.laterRacePnl, "Empty");
});

test("office paper u sums to Floor paper tile on a single day", () => {
  const r1 = ehole("H-ehole-nz-morning-win-73508Z", { region: "NZ" });
  const r2 = ehole("H-ehole-gb-nearoff-win-83959Z", { region: "GB" });
  const trades = [
    {
      id: "p1",
      ts: "2026-09-03T10:00:00Z",
      t: "11:00",
      day,
      recipe: r1.title,
      recipeId: r1.id,
      market: "WIN 3",
      book: "paper" as const,
      side: "BACK",
      odds: 3,
      stake: 1,
      result: "lost" as const,
      flight: null,
      liquidity: null,
      pnl: -2,
      horse: null,
    },
    {
      id: "p2",
      ts: "2026-09-03T11:00:00Z",
      t: "12:00",
      day,
      recipe: r2.title,
      recipeId: r2.id,
      market: "WIN 4",
      book: "paper" as const,
      side: "BACK",
      odds: 4,
      stake: 1,
      result: "won" as const,
      flight: null,
      liquidity: null,
      pnl: 1.29,
      horse: null,
    },
  ];
  const recipes = [r1, r2];
  const rows = officeBookRows({ recipes, day, trades });
  const floorU = settledPaperDayU(trades, day, recipes);
  const totals = officePaperTotals({ recipes, day, trades });
  let officeSum = 0;
  for (const u of totals.values()) officeSum += u;
  assert.equal(floorU, -0.71);
  assert.equal(officeSum, floorU);
});

test("office paper survives day roll — prior-day settles stay cumulative", () => {
  const priorDay = "2026-09-03";
  const deskDay = "2026-09-04";
  const nz = ehole("H-ehole-nz-nearoff-win-73508Z", { region: "NZ" });
  const gb = ehole("H-ehole-gb-morning-win-83959Z", { region: "GB" });
  const priorSettled = {
    id: "nz-prior",
    ts: "2026-09-03T10:00:00Z",
    t: "11:00",
    day: priorDay,
    recipe: nz.title,
    recipeId: nz.id,
    market: "WIN 3",
    book: "paper" as const,
    side: "BACK",
    odds: 3,
    stake: 1,
    result: "won" as const,
    flight: null,
    liquidity: null,
    pnl: 2.5,
    horse: null,
  };
  const todaySettled = {
    id: "gb-today",
    ts: "2026-09-04T10:00:00Z",
    t: "11:00",
    day: deskDay,
    recipe: gb.title,
    recipeId: gb.id,
    market: "WIN 4",
    book: "paper" as const,
    side: "BACK",
    odds: 4,
    stake: 1,
    result: "lost" as const,
    flight: null,
    liquidity: null,
    pnl: -1,
    horse: null,
  };
  const recipes = [nz, gb];
  const trades = [priorSettled, todaySettled];
  const rows = officeBookRows({ recipes, day: deskDay, trades });
  const nzRow = rows.find((r) => r.id === nz.id);
  const gbRow = rows.find((r) => r.id === gb.id);
  assert.equal(nzRow?.paperPnl, "+2.50u");
  assert.equal(nzRow?.paperCounts, "1–0 · n=1 · since armed");
  assert.equal(nzRow?.paperTodayCounts, EMPTY);
  assert.equal(gbRow?.paperPnl, "−1.00u");
  assert.equal(gbRow?.paperCounts, "0–1 · n=1 · since armed");
  assert.equal(gbRow?.paperTodayCounts, "today 0–1 · n=1");
  const floorU = settledPaperDayU(trades, deskDay, recipes);
  assert.equal(floorU, -1);
  const totals = officePaperTotals({ recipes, day: deskDay, trades });
  assert.equal(totals.get(nz.id), 2.5);
  assert.equal(totals.get(gb.id), -1);
});

test("KEEP later-race Empty until holdout same-bets exist", () => {
  const keep: Recipe = {
    id: "H-20260828T020000Z-gb-nearoff-win-one-pick",
    title: "GB near-off WIN · one-pick",
    region: "GB",
    status: "KEEP",
    badge: "Parked",
    chip: null,
    n: 58,
    roi: 0,
    freezePnl: 44.02,
    why: "Firm lab KEEP",
    hunterName: "Geo",
  };
  const rows = officeBookRows({ recipes: [keep], day, n_keep: 3 });
  assert.equal(rows[0]?.state, "KEEP");
  assert.equal(rows[0]?.laterRacePnl, "Empty");
  assert.equal(rows[0]?.productionPnl, "Empty");
});

test("KEEP with holdout shows later-race P&L as neutral", () => {
  const keep: Recipe = {
    id: "H-keep-holdout",
    title: "GB near-off WIN",
    region: "GB",
    status: "KEEP",
    badge: "Parked",
    chip: null,
    n: 58,
    roi: 0,
    freezePnl: 44.02,
    why: "holdout 23/22",
    hunterName: "Geo",
  };
  const rows = officeBookRows({ recipes: [keep], day, n_keep: 3 });
  assert.equal(rows[0]?.laterRacePnlTone, "neutral");
  assert.match(rows[0]?.laterRacePnl ?? "", /44\.02u/);
});

test("production P&L Empty while KEEP is 0", () => {
  const solid = STAMP.recipes.find((r) => r.badge === "Solid");
  assert.ok(solid);
  const rows = officeBookRows({ recipes: [solid!], day: STAMP.day, n_keep: 0 });
  assert.equal(rows[0]?.state, "production");
  assert.equal(rows[0]?.productionPnl, "Empty");
});

test("production book shows production P&L when KEEP > 0", () => {
  const solid = STAMP.recipes.find((r) => r.badge === "Solid");
  assert.ok(solid);
  const rows = officeBookRows({ recipes: [solid!], day: STAMP.day, n_keep: 3 });
  assert.ok(rows[0]?.productionPnlTone === "up" || rows[0]?.productionPnlTone === "down");
});

test("office counts strategies, KEEP, production; live Empty when fuse off", () => {
  const rows = officeBookRows({ recipes: STAMP.recipes, day: STAMP.day });
  const counts = officeBookCounts(rows, false, 1);
  assert.ok(counts.strategies > 0);
  assert.ok(counts.keep > 0);
  assert.equal(counts.production, rows.filter((r) => r.state === "production").length);
  assert.equal(counts.live, "Empty");
});

test("office production hero Empty while KEEP is 0", () => {
  const rows = officeBookRows({ recipes: STAMP.recipes, day: STAMP.day, n_keep: 0 });
  const counts = officeBookCounts(rows, false);
  assert.equal(officeProductionHeroValue(0, counts.production), "Empty");
});

test("office paper totals sum to Floor settled tape u on a single day", () => {
  const day = "2026-09-03";
  const r1 = ehole("H-ehole-us-nearoff-win-73506Z", { region: "US" });
  const r2 = ehole("H-ehole-us-latepre-win-73644Z", { region: "US" });
  const trades = [
    {
      id: "us1",
      ts: "2026-09-03T15:27:09Z",
      t: "16:27:09",
      day,
      recipe: r1.title,
      recipeId: r1.id,
      market: "WIN",
      book: "production" as const,
      side: "BACK",
      odds: 3,
      stake: 1,
      result: "won" as const,
      flight: null,
      liquidity: null,
      pnl: 0.14,
      horse: "Modern Miss",
    },
    {
      id: "us2",
      ts: "2026-09-03T15:27:13Z",
      t: "16:27:13",
      day,
      recipe: r2.title,
      recipeId: r2.id,
      market: "WIN",
      book: "production" as const,
      side: "BACK",
      odds: 4,
      stake: 1,
      result: "won" as const,
      flight: null,
      liquidity: null,
      pnl: 3.33,
      horse: "Despos Dream",
    },
  ];
  const recipes = [r1, r2];
  const floorU = settledPaperDayU(trades, day, recipes);
  const totals = officePaperTotals({ recipes, day, trades });
  let officeSum = 0;
  for (const u of totals.values()) officeSum += u;
  assert.equal(floorU, 3.47);
  assert.equal(officeSum, floorU);
});

test("twins collapse to one measuring row per hole", () => {
  const recipes = [
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
  ];
  assert.equal(officeBookRecipes(recipes).length, 1);
});

test("in-play spray-class first books stay off Office", () => {
  const recipes = [ehole("H-ehole-fr-inplay-win-73339Z", { region: "FR" })];
  assert.equal(officeBookRecipes(recipes).length, 0);
});
