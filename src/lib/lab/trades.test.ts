import assert from "node:assert/strict";
import { test } from "node:test";
import { fillFromRow, fmtStake, parseFills, tapePnl, tradeCounts } from "./trades.ts";

const nzLost = {
  pick_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49|1.261774121|102292006|BACK|2026-09-02",
  ts: "2026-09-02T00:07:45Z",
  cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
  mode: "auto_dry",
  status: "SETTLED",
  odds: 3.35,
  stake_gbp: 2,
  paper_pnl_gbp: -2,
  placed_result: false,
  certified_keep: false,
};

const auWon = {
  pick_id: "H-fast-au-nearoff-place-83723Z|1.261773569|102292467|BACK|2026-09-02",
  ts: "2026-09-02T07:14:44Z",
  cell_id: "H-fast-au-nearoff-place-83723Z",
  mode: "auto_dry",
  status: "SETTLED",
  odds: 2.4,
  stake_gbp: 2,
  paper_pnl_gbp: 2.744,
  placed_result: true,
  certified_keep: false,
};

test("auto_dry SETTLED maps to paper, not production or live", () => {
  const fill = fillFromRow(nzLost);
  assert.ok(fill);
  assert.equal(fill.book, "paper");
  assert.equal(fill.result, "lost");
  assert.equal(fill.recipe, "NZ morning win");
  assert.equal(fill.market, "WIN 3.35");
  assert.equal(fill.t, "00:07:45");
  assert.equal(fill.pnl, -2);
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
  const fills = parseFills([nzLost, auWon]);
  assert.equal(fills.length, 2);
  assert.equal(fills[0]?.id, auWon.pick_id);
  assert.equal(fills[1]?.id, nzLost.pick_id);
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

test("tradeCounts and stake Empty", () => {
  const fills = parseFills([nzLost, auWon]);
  assert.deepEqual(tradeCounts(fills), { paper: 2, production: 0, live: 0 });
  assert.equal(fmtStake(2), "2");
  assert.equal(fmtStake(null), "Empty");
});
