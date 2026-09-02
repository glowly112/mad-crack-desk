import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bookBadge,
  bookedClock,
  dayTapePnl,
  fillFromRow,
  fillsOnDay,
  fmtStake,
  openFills,
  parseFills,
  parseWaitOpen,
  settledFills,
  tapePnl,
  tradeCounts,
  tradeMark,
  waitOpenChips,
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
  atb_size_gbp: 19.17,
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
  assert.equal(fill.stake, 1);
  assert.equal(fill.liquidity, 19.17);
  assert.equal(fill.flight, "waiting result");
  assert.equal(fill.pnl, null);
  assert.equal(bookBadge(fill.book), "No money");
  assert.deepEqual(tapePnl(fill, false), { pnl: null, caption: "waiting result" });
});

test("atb is liquidity, never unmatched; wait_open is a chip not a ticket", () => {
  const fill = fillFromRow({ ...gbOpen, unmatched_size: 4, unmatched: 4 });
  assert.equal(fill?.flight, "waiting result");
  assert.equal(fill?.liquidity, 19.17);
  assert.deepEqual(parseWaitOpen(null), []);
  assert.deepEqual(parseWaitOpen([]), []);
  const chips = parseWaitOpen([
    {
      cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
      mode: "wait_open",
      reasons: ["no_open_size_ok_candidates"],
    },
    { cell_id: "H-fast-gb-nearoff-win-83959Z", mode: "auto_dry" },
  ]);
  assert.equal(chips.length, 1);
  assert.equal(chips[0]?.title, "NZ morning WIN · one-pick 2.5–4.49");
  assert.equal(chips[0]?.why, "no size_ok candidates");
  const open = openFills(parseFills([gbOpen]));
  assert.equal(waitOpenChips(chips, open).length, 1);
  assert.deepEqual(
    waitOpenChips(
      [{ id: gbOpen.cell_id, title: "GB near-off WIN", why: null }],
      open,
    ),
    [],
  );
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

test("trade mark is the strategy plus runner and odds", () => {
  const opens = [3.2, 25, 10, 9.4].map((odds) => fillFromRow({ ...gbOpen, odds, pick_id: `${gbOpen.pick_id}:${odds}` }));
  const marks = opens.map((f) => {
    assert.ok(f);
    return tradeMark(f);
  });
  assert.deepEqual(marks, [
    "Britain · near-off · winner · Empty · 3.2",
    "Britain · near-off · winner · Empty · 25",
    "Britain · near-off · winner · Empty · 10",
    "Britain · near-off · winner · Empty · 9.4",
  ]);
  assert.equal(new Set(marks).size, 4);
  assert.ok(marks.every((m) => !m.includes("recipe that bets")));
  assert.ok(marks.every((m) => !m.startsWith("H-")));
  const named = fillFromRow({ ...gbOpen, horse: "Desert Crown", odds: 3.2 });
  assert.ok(named);
  assert.equal(named.horse, "Desert Crown");
  assert.equal(tradeMark(named), "Britain · near-off · winner · Desert Crown · 3.2");
  const blank = fillFromRow({ ...gbOpen, horse: "H-fast-gb-nearoff-win-83959Z", runner: "67117187" });
  assert.equal(blank?.horse, null);
  assert.match(tradeMark(blank!), /Empty · 3\.2/);
});

test("booked clock is a real time, never Empty", () => {
  assert.equal(bookedClock("2026-09-02T10:59:45Z"), "10:59:45");
  assert.equal(bookedClock("", "14:03"), "14:03");
  assert.equal(bookedClock(undefined, "Empty", "09:12:00"), "09:12:00");
  const offOnly = fillFromRow({
    pick_id: "off-1",
    cell_id: "H-fast-gb-nearoff-win-83959Z",
    off_time: "15:22",
    status: "OPEN",
    mode: "auto_dry",
  });
  assert.ok(offOnly);
  assert.equal(offOnly.t, "15:22");
  assert.notEqual(offOnly.t, "Empty");
  assert.equal(bookedClock(offOnly.ts, offOnly.t), "15:22");
});

test("tradeCounts, stake u, and day tape Empty when no production", () => {
  const fills = parseFills([nzLost, auWon]);
  assert.deepEqual(tradeCounts(fills), { paper: 2, production: 0, live: 0 });
  assert.equal(fmtStake(1), "1u");
  assert.equal(fmtStake(null), "Empty");
  assert.equal(fillFromRow(nzLost)?.stake, 1);
  const tape = dayTapePnl(fills, false);
  assert.equal(tape.production, null);
  assert.equal(tape.live, 0);
  assert.ok(tape.paper != null);
});
