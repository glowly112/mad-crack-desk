import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import { bookStages } from "./boards.ts";
import { EMPTY } from "./desk.ts";
import { bookStagesForHolding, holdingPaperSettled } from "./holding-book.ts";
import { officeBookRows } from "./office-display.ts";

function ehole(id: string, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id,
    title: id.replace(/^H-ehole-/, "ehole_").replace(/-/g, "_"),
    region: "AU",
    status: "MEASURING",
    badge: "Research",
    chip: null,
    n: 19,
    roi: 0,
    freezePnl: -64.79,
    why: "Still proving.",
    hunterName: "Geo",
    ...overrides,
  };
}

const day = "2026-09-03";

test("holdings paper uses today's Settled, not freezePnl", () => {
  const recipe = ehole("H-ehole-au-latepre-place-14131Z", {
    region: "AU",
    title: "ehole_au_latepre_place",
    freezePnl: -64.79,
    n: 19,
  });
  const ctx = { recipes: [recipe], day, trades: [] as const };
  const freezeStages = bookStages(recipe);
  assert.match(String(freezeStages.find((s) => s.key === "paper")?.u), /64/);

  const settled = holdingPaperSettled(recipe, ctx);
  assert.equal(settled, null);
  const stages = bookStagesForHolding(recipe, ctx);
  assert.equal(stages.find((s) => s.key === "paper")?.kind, "empty");
  assert.equal(stages.find((s) => s.key === "paper")?.mark, EMPTY);
});

test("holdings paper matches Office Settled for the skin", () => {
  const recipe = ehole("H-ehole-au-latepre-place-14131Z", { region: "AU" });
  const trades = [
    {
      id: "p1",
      ts: "2026-09-03T10:00:00Z",
      t: "11:00",
      day,
      recipe: recipe.title,
      recipeId: recipe.id,
      market: "PLACE",
      book: "paper" as const,
      side: "BACK",
      odds: 3,
      stake: 1,
      result: "won" as const,
      flight: null,
      liquidity: null,
      pnl: 2.21,
      horse: null,
    },
    {
      id: "p2",
      ts: "2026-09-03T11:00:00Z",
      t: "12:00",
      day,
      recipe: recipe.title,
      recipeId: recipe.id,
      market: "PLACE",
      book: "paper" as const,
      side: "BACK",
      odds: 2.5,
      stake: 1,
      result: "lost" as const,
      flight: null,
      liquidity: null,
      pnl: -1,
      horse: null,
    },
  ];
  const ctx = { recipes: [recipe], day, trades };
  const office = officeBookRows(ctx)[0];
  const settled = holdingPaperSettled(recipe, ctx);
  assert.ok(settled);
  assert.equal(office?.paperPnl, "+1.21u");
  assert.equal(office?.paperCounts, "1–1 · n=2 · since armed");
  assert.match(settled.line, /1 win · 1 lose/);
  assert.match(settled.line, /\+1\.21u/);
  const paper = bookStagesForHolding(recipe, ctx).find((s) => s.key === "paper");
  assert.equal(paper?.mark, settled.line);
  assert.equal(paper?.u, 1.21);
});

test("holdings production and live stay Empty until proven", () => {
  const recipe = ehole("H-ehole-au-latepre-place-14131Z", { badge: "Research" });
  const stages = bookStagesForHolding(recipe, { recipes: [recipe], day, trades: [] });
  assert.equal(stages.find((s) => s.key === "production")?.kind, "empty");
  assert.equal(stages.find((s) => s.key === "live")?.kind, "empty");
});
