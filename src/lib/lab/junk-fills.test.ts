import assert from "node:assert/strict";
import { test } from "node:test";
import { fillFromRow } from "./trades.ts";
import {
  isMillVoidLeftover,
  isMillVoidPackFill,
  isRawIdRunSuffix,
  junkFillIds,
  voidedJunkSquareHoles,
} from "./junk-fills.ts";
import { honestOpenFills, honestSettledFills, settledPaperDayU } from "./trades.ts";

test("raw-id run suffix detection", () => {
  assert.equal(isRawIdRunSuffix("73506Z"), true);
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
  assert.equal(junkFillIds([fill]).has(fill.id), false);
  assert.equal(honestOpenFills([fill]).length, 1);
});

test("US morning WIN 1.15 one-per-market first book is not junk", () => {
  const fill = fillFromRow({
    pick_id: "us-one-per",
    date: "2026-09-03",
    cell_id: "H-ehole-us-morning-win-83912Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Morning Runner",
    odds: 1.15,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T08:30:00Z",
    t: "08:30:00",
  })!;
  assert.equal(isMillVoidPackFill(fill), false);
  assert.equal(junkFillIds([fill]).has(fill.id), false);
  assert.equal(honestOpenFills([fill]).length, 1);
});

test("GB late-pre one-per-market first book is not junk", () => {
  const fill = fillFromRow({
    pick_id: "gb-late-one",
    date: "2026-09-03",
    cell_id: "H-ehole-gb-latepre-win-83959Z",
    mode: "auto_dry",
    status: "OPEN",
    horse_name: "Late Runner",
    odds: 2.4,
    side: "BACK",
    stake_gbp: 2,
    ts: "2026-09-03T12:30:00Z",
    t: "12:30:00",
  })!;
  assert.equal(isMillVoidPackFill(fill), false);
  assert.equal(junkFillIds([fill]).has(fill.id), false);
});

test("other raw-id ehole without horse is not junk", () => {
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
  assert.equal(junkFillIds([fill]).has(fill.id), false);
  assert.equal(honestSettledFills([fill]).length, 1);
});

test("FR in-play 73339Z pack is junk", () => {
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
  assert.equal(isMillVoidPackFill(fill), true);
  assert.equal(junkFillIds([fill]).has(fill.id), true);
});

test("mill-voided ZA 73506Z does not count as paper lost", () => {
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

test("voided GB 34829Z spray paints killed on square", () => {
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
