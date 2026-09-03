import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import { officeBookCounts, officeBookRows, officeBookRecipes } from "./office-display.ts";
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

test("office book rows include hole, strategy, side, market, state", () => {
  const rows = officeBookRows([
    ehole("H-ehole-nz-morning-win-73508Z", { region: "NZ" }),
  ]);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.hole, /New Zealand/);
  assert.match(rows[0]!.hole, /WIN/);
  assert.equal(rows[0]!.state, "measuring");
  assert.equal(rows[0]!.pnl, "Empty");
});

test("KEEP shows later-race P&L as neutral not a win", () => {
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
  const rows = officeBookRows([keep]);
  assert.equal(rows[0]?.state, "KEEP");
  assert.equal(rows[0]?.pnlTone, "neutral");
  assert.match(rows[0]?.pnl ?? "", /44\.02u/);
});

test("production book uses same-bets P&L with score tone", () => {
  const solid = STAMP.recipes.find((r) => r.badge === "Solid");
  assert.ok(solid);
  const rows = officeBookRows([solid!]);
  assert.equal(rows[0]?.state, "production");
  assert.ok(rows[0]?.pnlTone === "up" || rows[0]?.pnlTone === "down");
});

test("office counts strategies, KEEP, production; live Empty when fuse off", () => {
  const rows = officeBookRows(STAMP.recipes);
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
