import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import { officeBookCounts, officeBookRows, officeBookRecipes } from "./office-display.ts";
import { settledPaperDayU, settledPaperUForRecipeIds } from "./trades.ts";
import { millPaperRecipeIds } from "./mill-display.ts";
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
  assert.equal(rows[0]?.productionPnl, "Empty");
  assert.equal(rows[0]?.laterRacePnl, "Empty");
});

test("office paper u sums to Floor paper tile", () => {
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
  let officeSum = 0;
  for (const row of rows) {
    const recipe = recipes.find((r) => r.id === row.id);
    if (!recipe) continue;
    const u = settledPaperUForRecipeIds(
      trades,
      day,
      millPaperRecipeIds(recipe, recipes),
      recipes,
    );
    if (u != null) officeSum += u;
  }
  assert.equal(floorU, -0.71);
  assert.equal(officeSum, floorU);
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
