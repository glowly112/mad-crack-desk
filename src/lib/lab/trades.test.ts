import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dayTapePnl,
  fillFromRow,
  fillsOnDay,
  fmtStake,
  openFills,
  parseFills,
  settledFills,
  tapePnl,
  tradeCounts,
} from "./trades.ts";

const nzLost = {
  pick_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49|1.261774121|102292006|BACK|2026-09-02",
  ts: "2026-09-02T00:07:45Z",
  date: "2026-09-02",
  cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
  mode: "auto_dry",
  status: "SETTLED",
  odds: 3.35,
  stake_gbp: 2,
  paper_pnl_gbp: -2,
  placed_result: false,
  certified_keep: false,
  side: "BACK",
};

const auWon = {
  pick_id: "H-fast-au-nearoff-place-83723Z|1.261773569|102292467|BACK|2026-09-02",
  ts: "2026-09-02T07:14:44Z",
  date: "2026-09-02",
  cell_id: "H-fast-au-nearoff-place-83723Z",
  mode: "auto_dry",
  status: "SETTLED",
  odds: 2.4,
  stake_gbp: 2,
  paper_pnl_gbp: 2.744,
  placed_result: true,
  certified_keep: false,
  side: "BACK",
};

const gbOpen = {
  pick_id: "H-fast-gb-nearoff-win-83959Z|1.261796533|67117187|BACK|2026-09-02",
  ts: "2026-09-02T10:59:45Z",
  date: "2026-09-02",
  cell_id: "H-fast-gb-nearoff-win-83959Z",
  mode: "auto_dry",
  status: "OPEN",
  odds: 3.2,
  stake_gbp: 2,
  paper_pnl_gbp: null,
  placed_result: null,
  certified_keep: true,
  gate_verdict: "LIVE_CANDIDATE",
  side: "BACK",
};

test("auto_dry SETTLED maps to paper, not production or live", () => {
  const fill = fillFromRow(nzLost);
  assert.ok(fill);
  assert.equal(fill.book, "paper");
  assert.equal(fill.result, "lost");
  assert.equal(fill.recipe, "NZ morning WIN · one-pick 2.5–4.49");
  assert.equal(fill.market, "WIN 3.35");
  assert.equal(fill.t, "00:07:45");
  assert.equal(fill.day, "2026-09-02");
  assert.equal(fill.pnl, -2);
  assert.equal(fill.flight, null);
});

test("OPEN auto_dry is waiting result, not a settled ticket", () => {
  const fill = fillFromRow(gbOpen);
  assert.ok(fill);
  assert.equal(fill.book, "paper");
  assert.equal(fill.result, "waiting");
  assert.equal(fill.flight, "waiting result");
  assert.equal(fill.recipe, "GB near-off WIN");
  assert.equal(fill.side, "BACK");
  assert.equal(fill.pnl, null);
  assert.deepEqual(tapePnl(fill, false), { pnl: null, caption: "waiting result" });
});

test("live + certified_keep is production; live alone is live", () => {
  const prod = fillFromRow({
    pick_id: "prod-1",
    ts: "2026-09-02T11:00:00Z",
    cell_id: "H-fast-gb-nearoff-win-83959Z",
    mode: "live",
    status: "SETTLED",
    certified_keep: true,
    placed_result: true,
    stake_gbp: 2,
    paper_pnl_gbp: 1.1,
  });
  const live = fillFromRow({
    pick_id: "live-1",
    ts: "2026-09-02T11:01:00Z",
    cell_id: "H-fast-gb-nearoff-win-83959Z",
    mode: "live",
    status: "OPEN",
    certified_keep: false,
  });
  assert.equal(prod?.book, "production");
  assert.equal(prod?.result, "won");
  assert.equal(live?.book, "live");
  assert.equal(live?.result, "waiting");
});

test("parseFills is newest first and invents nothing from empty", () => {
  assert.deepEqual(parseFills(null), []);
  assert.deepEqual(parseFills([]), []);
  const fills = parseFills([nzLost, auWon, gbOpen]);
  assert.equal(fills.length, 3);
  assert.equal(fills[0]?.id, gbOpen.pick_id);
  assert.equal(openFills(fills).length, 1);
  assert.equal(settledFills(fills).length, 2);
  assert.deepEqual(fillsOnDay(fills, "2026-09-01"), []);
});

test("paper P&L is not income; live is 0 while fuse off", () => {
  const paper = fillFromRow(auWon);
  assert.ok(paper);
  const paperTape = tapePnl(paper, false);
  assert.equal(paperTape.pnl, 2.744);
  assert.equal(paperTape.caption, "not income");
  const liveFill = fillFromRow({
    pick_id: "live-2",
    ts: "2026-09-02T11:02:00Z",
    cell_id: "x",
    mode: "live",
    status: "SETTLED",
    placed_result: true,
    paper_pnl_gbp: 4,
  });
  assert.ok(liveFill);
  assert.deepEqual(tapePnl(liveFill, false), { pnl: 0, caption: "fuse off" });
  assert.deepEqual(tapePnl(liveFill, true), { pnl: 4, caption: null });
});

test("tradeCounts, stake u, and day tape Empty when no production", () => {
  const fills = parseFills([nzLost, auWon]);
  assert.deepEqual(tradeCounts(fills), { paper: 2, production: 0, live: 0 });
  assert.equal(fmtStake(2), "2u");
  assert.equal(fmtStake(null), "Empty");
  const tape = dayTapePnl(fills, false);
  assert.equal(tape.production, null);
  assert.equal(tape.live, 0);
  assert.ok(tape.paper != null);
});
