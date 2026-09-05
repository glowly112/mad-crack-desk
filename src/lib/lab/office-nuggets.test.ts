import assert from "node:assert/strict";
import { test } from "node:test";
import {
  nuggetKeyFromFill,
  nuggetLabel,
  nuggetOddsBand,
  nuggetOddsBandShort,
  officeNuggetGroups,
  officeNuggetRows,
  officeStrategyRows,
} from "./office-nuggets.ts";
import type { Fill } from "./trades.ts";
import { filterOfficeRows, filterOfficeStrategyRows, officeStrategyTypeCounts } from "./office-display.ts";

function fill(overrides: Partial<Fill> & Pick<Fill, "id" | "recipeId">): Fill {
  return {
    ts: "2026-09-03T10:00:00Z",
    t: "11:00",
    day: "2026-09-03",
    recipe: "NZ morning WIN",
    market: "WIN",
    book: "paper",
    side: "BACK",
    odds: 3.5,
    stake: 1,
    result: "lost",
    flight: null,
    liquidity: null,
    pnl: -1,
    horse: "Horse A",
    spice: {
      course: "Ascot",
      race_type: "Handicap",
      going: "Good",
      surface: null,
      distance_m: null,
      field_size: 12,
      card_join: null,
      country: null,
      window: null,
      market_type: null,
      race_id: null,
    },
    ...overrides,
  };
}

test("nugget odds bands match plant-style slices", () => {
  assert.equal(nuggetOddsBand(1.8), "under 2");
  assert.equal(nuggetOddsBand(2.2), "2.0–2.49");
  assert.equal(nuggetOddsBand(3.5), "2.5–4.49");
  assert.equal(nuggetOddsBand(6), "4.5–7.99");
  assert.equal(nuggetOddsBand(10), "8.0–12.99");
  assert.equal(nuggetOddsBand(20), "13+");
});

test("nugget odds band short labels fit narrow column", () => {
  assert.equal(nuggetOddsBandShort("4.5–7.99"), "4.5–8");
  assert.equal(nuggetOddsBandShort("13+"), "13+");
});

test("nugget key groups hole with odds band course race_type going", () => {
  const f = fill({
    id: "a",
    recipeId: "H-ehole-gb-morning-win-73508Z",
    odds: 3.2,
    spice: {
      course: "Ascot",
      race_type: "Handicap",
      going: "Good",
      surface: null,
      distance_m: null,
      field_size: null,
      card_join: null,
      country: null,
      window: null,
      market_type: null,
      race_id: null,
    },
  });
  const key = nuggetKeyFromFill(f);
  assert.match(key, /GB\|morning\|WIN/);
  assert.match(key, /odds:2\.5–4\.49/);
  assert.match(key, /course:Ascot/);
  assert.match(key, /rt:Handicap/);
  assert.match(key, /going:Good/);
  assert.match(nuggetLabel("GB|morning|WIN", { oddsBand: "2.5–4.49", course: "Ascot", raceType: "Handicap", going: "Good" }), /Ascot/);
});

const emptySpice = {
  course: null,
  race_type: null,
  going: null,
  surface: null,
  distance_m: null,
  field_size: null,
  card_join: null,
  country: null,
  window: null,
  market_type: null,
  race_id: null,
};

test("nugget rows include rare slices with n=1", () => {
  const trades = [
    fill({ id: "rare", recipeId: "H-ehole-nz-morning-win-73508Z", odds: 15, pnl: 2, result: "won", spice: emptySpice }),
    fill({
      id: "common-1",
      recipeId: "H-ehole-gb-morning-win-83959Z",
      odds: 3,
      pnl: -1,
      spice: { course: "York", race_type: "Maiden", going: null, surface: null, distance_m: null, field_size: null, card_join: null, country: null, window: null, market_type: null, race_id: null },
    }),
    fill({
      id: "common-2",
      recipeId: "H-ehole-gb-morning-win-83959Z",
      odds: 3.1,
      pnl: 1,
      result: "won",
      spice: { course: "York", race_type: "Maiden", going: null, surface: null, distance_m: null, field_size: null, card_join: null, country: null, window: null, market_type: null, race_id: null },
    }),
  ];
  const rows = officeNuggetRows({ recipes: [], day: "2026-09-03", trades });
  assert.equal(rows.length, 2);
  const rare = rows.find((r) => r.oddsSlice === "13+");
  assert.ok(rare);
  assert.equal(rare?.strategyType, "mid");
  assert.equal(rare?.stateLabel, "Measuring");
  assert.equal(rare?.productionPnl, "Empty");
  assert.equal(rare?.laterRacePnl, "Empty");
});

test("many spice combinations yield far more nugget rows than hole-only wide skins", () => {
  const regions = ["GB", "NZ", "AU", "US", "ZA", "FR"];
  const windows = ["morning", "nearoff", "latepre"];
  const courses = ["Ascot", "York", "Newmarket", "Epsom", "Sandown", "Cheltenham"];
  const raceTypes = ["Handicap", "Maiden", "Stakes", "Novice"];
  const oddsList = [2.1, 3.2, 5.5, 9, 14];
  const trades: Fill[] = [];
  let i = 0;
  for (const region of regions) {
    for (const window of windows) {
      for (const course of courses) {
        for (const raceType of raceTypes) {
          for (const odds of oddsList) {
            trades.push(
              fill({
                id: `n-${i++}`,
                recipeId: `H-ehole-${region.toLowerCase()}-${window}-win-73508Z`,
                odds,
                pnl: i % 3 === 0 ? 1.2 : -1,
                result: i % 3 === 0 ? "won" : "lost",
                spice: {
                  course,
                  race_type: raceType,
                  going: "Good",
                  surface: null,
                  distance_m: null,
                  field_size: 10,
                  card_join: null,
                  country: null,
                  window: null,
                  market_type: null,
                  race_id: null,
                },
              }),
            );
          }
        }
      }
    }
  }
  const groups = officeNuggetGroups({ recipes: [], day: "2026-09-03", trades });
  assert.ok(groups.length > 42, `expected >42 nuggets, got ${groups.length}`);
  const rows = officeNuggetRows({ recipes: [], day: "2026-09-03", trades });
  assert.ok(rows.length > 42);
  assert.equal(filterOfficeRows(rows, "measuring").length, rows.length);
  assert.equal(filterOfficeRows(rows, "keep").length, 0);
});

test("nuggets sort by absolute u then n", () => {
  const trades = [
    fill({ id: "a", recipeId: "H-ehole-gb-morning-win-73508Z", odds: 3, pnl: 1, result: "won", spice: { course: "A", race_type: null, going: null, surface: null, distance_m: null, field_size: null, card_join: null, country: null, window: null, market_type: null, race_id: null } }),
    fill({ id: "b", recipeId: "H-ehole-gb-morning-win-73508Z", odds: 9, pnl: -5, result: "lost", spice: { course: "B", race_type: null, going: null, surface: null, distance_m: null, field_size: null, card_join: null, country: null, window: null, market_type: null, race_id: null } }),
    fill({ id: "c", recipeId: "H-ehole-gb-morning-win-73508Z", odds: 2.2, pnl: 4, result: "won", spice: { course: "C", race_type: null, going: null, surface: null, distance_m: null, field_size: null, card_join: null, country: null, window: null, market_type: null, race_id: null } }),
  ];
  const groups = officeNuggetGroups({ recipes: [], day: "2026-09-03", trades });
  assert.equal(groups[0]?.u, -5);
  assert.equal(groups[1]?.u, 4);
});

test("office strategy rows merge wide and mid/nugget tape slices with type tags", () => {
  const trades = [
    fill({ id: "n1", recipeId: "H-ehole-nz-morning-win-73508Z", odds: 15, pnl: 2, result: "won", spice: emptySpice }),
  ];
  const recipes = [
    {
      id: "H-ehole-nz-morning-win-73508Z",
      title: "ehole_nz_morning_win",
      region: "NZ" as const,
      status: "MEASURING" as const,
      badge: "Research" as const,
      chip: null,
      n: 0,
      roi: 0,
      freezePnl: 0,
      why: "Still proving.",
      hunterName: "Geo",
    },
  ];
  const rows = officeStrategyRows({ recipes, day: "2026-09-03", trades });
  const counts = officeStrategyTypeCounts(rows);
  assert.equal(counts.wide, 1);
  assert.equal(counts.mid, 1);
  assert.equal(counts.nugget, 0);
  assert.equal(rows.length, 2);
  assert.ok(rows.some((r) => r.strategyType === "wide"));
  assert.ok(rows.some((r) => r.strategyType === "mid"));
  assert.equal(filterOfficeStrategyRows(rows, "all", "wide").length, 1);
  assert.equal(filterOfficeStrategyRows(rows, "all", "mid").length, 1);
  assert.equal(filterOfficeStrategyRows(rows, "measuring", "all").length, 2);
});
