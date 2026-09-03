import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import { fillFromRow } from "./trades.ts";
import {
  fillHasRawIdTicketName,
  junkFillIds,
  isMillVoidLeftover,
  isRawIdRunSuffix,
  twinSkinJunkFillIds,
  voidedJunkSquareHoles,
} from "./junk-fills.ts";
import { honestOpenFills, honestSettledFills, settledPaperDayU } from "./trades.ts";

function eholeRecipe(id: string, overrides: Partial<Recipe> = {}): Recipe {
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
    why: "",
    hunterName: "Geo",
    ...overrides,
  };
}

test("raw-id run suffix detection", () => {
  assert.equal(isRawIdRunSuffix("73508Z"), true);
  assert.equal(isRawIdRunSuffix("34829Z"), true);
  assert.equal(isRawIdRunSuffix("Noble Saint"), false);
});

test("Noble Saint one-pick with horse is not junk", () => {
  const fill = fillFromRow({
    pick_id: "gb-noble",
    date: "2026-09-03",
    cell_id: "H-ehole-nz-nearoff-win-73508Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Noble Saint",
    odds: 3.2,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T11:00:00Z",
    t: "11:00:00",
  })!;
  assert.ok(fill.horse === "Noble Saint");
  assert.equal(fillHasRawIdTicketName(fill), false);
  assert.equal(junkFillIds([fill]).has(fill.id), false);
  assert.equal(honestOpenFills([fill]).length, 1);
});

test("raw-id ehole ticket without horse is junk", () => {
  const fill = fillFromRow({
    pick_id: "nz-raw",
    date: "2026-09-03",
    cell_id: "H-ehole-nz-morning-win-73508Z",
    mode: "auto_dry",
    status: "SETTLED",
    odds: 4,
    side: "BACK",
    stake_gbp: 2,
    paper_pnl_gbp: 2,
    placed_result: true,
    ts: "2026-09-03T10:30:00Z",
    t: "10:30:00",
  })!;
  assert.equal(junkFillIds([fill]).has(fill.id), true);
  assert.equal(honestSettledFills([fill]).length, 0);
  assert.equal(settledPaperDayU([fill], "2026-09-03"), null);
});

test("in-play ehole first book fill is junk", () => {
  const fill = fillFromRow({
    pick_id: "fr-inplay",
    date: "2026-09-03",
    cell_id: "H-ehole-fr-inplay-win-73339Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Runner One",
    odds: 5,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T11:13:00Z",
    t: "11:13:00",
  })!;
  assert.equal(junkFillIds([fill]).has(fill.id), true);
});

test("ehole twin skin beyond first is junk", () => {
  const recipes = [
    eholeRecipe("H-ehole-nz-latepre-place-35151Z"),
    eholeRecipe("H-ehole-nz-latepre-place-00206Z"),
  ];
  const late = fillFromRow({
    pick_id: "nz-late",
    date: "2026-09-03",
    cell_id: "H-ehole-nz-latepre-place-35151Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Late Skin",
    odds: 3,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T12:00:00Z",
    t: "12:00:00",
  })!;
  const early = fillFromRow({
    pick_id: "nz-early",
    date: "2026-09-03",
    cell_id: "H-ehole-nz-latepre-place-00206Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Early Skin",
    odds: 3.5,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T12:01:00Z",
    t: "12:01:00",
  })!;
  const junk = twinSkinJunkFillIds([late, early], recipes);
  assert.ok(junk.has(late.id));
  assert.ok(!junk.has(early.id));
});

test("only junk on tape yields Empty paper", () => {
  const junkOnly = fillFromRow({
    pick_id: "junk-only",
    date: "2026-09-03",
    cell_id: "H-ehole-au-morning-win-34829Z",
    mode: "auto_dry",
    status: "SETTLED",
    odds: 4,
    side: "BACK",
    stake_gbp: 2,
    paper_pnl_gbp: 2,
    placed_result: true,
    ts: "2026-09-03T09:00:00Z",
    t: "09:00:00",
  })!;
  assert.equal(settledPaperDayU([junkOnly], "2026-09-03"), null);
});

test("mill-voided spray leftovers do not count as paper lost", () => {
  const voidSpray = fillFromRow({
    pick_id: "za-void",
    date: "2026-09-03",
    cell_id: "H-ehole-za-nearoff-win-73506Z",
    mode: "auto_dry",
    status: "VOID",
    odds: 4,
    side: "BACK",
    stake_gbp: 2,
    paper_pnl_gbp: -2,
    placed_result: false,
    ts: "2026-09-03T10:00:00Z",
    t: "10:00:00",
  })!;
  assert.equal(isMillVoidLeftover(voidSpray), true);
  assert.equal(honestSettledFills([voidSpray]).length, 0);
  assert.equal(settledPaperDayU([voidSpray], "2026-09-03"), null);
});

test("voided junk paints killed on square, not fake empty", () => {
  const voidGb = fillFromRow({
    pick_id: "gb-void",
    date: "2026-09-03",
    cell_id: "H-ehole-gb-latepre-win-34829Z",
    mode: "auto_dry",
    status: "VOID",
    odds: 5,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T11:00:00Z",
    t: "11:00:00",
  })!;
  const holes = voidedJunkSquareHoles([voidGb]);
  assert.equal(holes.length, 1);
  assert.equal(holes[0]?.region, "GB");
  assert.equal(holes[0]?.tone, "loss");
  assert.equal(holes[0]?.window, "late_pre");
});
