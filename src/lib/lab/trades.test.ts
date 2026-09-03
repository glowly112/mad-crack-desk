import assert from "node:assert/strict";
import { test } from "node:test";
import { recipeDeskRow } from "./desk.ts";
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
  honestSettledFills,
  honestOpenFills,
  paperSettledFills,
  fieldSprayFillIds,
  settledPaperDayU,
  tapePnl,
  tradeCounts,
  bookWord,
  fillDeskRow,
  fillResultWord,
  tradeName,
  waitDeskRow,
  measuringEholeWaitChips,
  dedupeWaitChipsByHole,
  millTapeRows,
  tradesWaitChips,
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
  assert.equal(fill.pnl, -1);
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
  assert.equal(paperTape.pnl, 1.372);
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

test("trade name is the mark plus horse; odds live in Odds", () => {
  const opens = [3.2, 25, 10, 9.4].map((odds) => fillFromRow({ ...gbOpen, odds, pick_id: `${gbOpen.pick_id}:${odds}` }));
  const rows = opens.map((f) => {
    assert.ok(f);
    return fillDeskRow(f, false);
  });
  assert.deepEqual(rows.map((r) => r.odds), ["3.2", "25", "10", "9.4"]);
  assert.deepEqual(
    rows.map((r) => r.name),
    [
      "Britain · near-off · winner · 3.2 BACK",
      "Britain · near-off · winner · 25 BACK",
      "Britain · near-off · winner · 10 BACK",
      "Britain · near-off · winner · 9.4 BACK",
    ],
  );
  assert.equal(new Set(rows.map((r) => r.name)).size, 4);
  assert.ok(rows.every((r) => r.book === "paper"));
  assert.ok(rows.every((r) => r.side === "BACK"));
  assert.ok(rows.every((r) => r.stake === "1u"));
  assert.ok(rows.every((r) => r.result === "Open"));
  assert.ok(rows.every((r) => r.pnl == null));
  assert.ok(rows.every((r) => !`${r.name} ${r.book} ${r.result}`.includes("not income")));
  assert.equal(new Set(rows.map((r) => r.odds)).size, 4);
  const named = fillFromRow({ ...gbOpen, horse: "Desert Crown", odds: 3.2 });
  assert.ok(named);
  assert.equal(tradeName(named), "Britain · near-off · winner · Desert Crown");
  assert.equal(fillDeskRow(named, false).odds, "3.2");
  const blank = fillFromRow({ ...gbOpen, horse: "H-fast-gb-nearoff-win-83959Z", runner: "67117187" });
  assert.equal(blank?.horse, null);
  assert.equal(tradeName(blank!), "Britain · near-off · winner · 3.2 BACK");
  assert.equal(bookWord("production"), "paper");
  assert.equal(bookWord("live"), "live");
  assert.equal(fillResultWord(fillFromRow(auWon)!), "Won");
  const wait = waitDeskRow({
    id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
    title: "NZ morning WIN · one-pick 2.5–4.49",
    why: "no size_ok candidates",
  });
  assert.equal(wait.name, "New Zealand · morning · winner · one-pick 2.5–4.49");
  assert.equal(wait.side, "WIN");
  assert.equal(wait.time, "Waiting");
  assert.equal(wait.odds, "Waiting");
  assert.equal(wait.stake, "Waiting");
  assert.equal(wait.book, "paper");
  assert.equal(wait.result, "Waiting for races");
});

test("tradesWaitChips lists post-epoch ehole recipes and hides legacy KEEP steam-fade", () => {
  const open = openFills(parseFills([gbOpen]));
  const legacySteam = {
    id: "Britain_near_off_WIN_steam_fade_residual_one_pick",
    title: "GB near-off WIN steam fade",
    why: null,
  };
  const eholeAu = {
    id: "H-ehole-au-morning-win-73508Z",
    title: "AU morning WIN",
    region: "AU" as const,
    status: "MEASURING" as const,
    badge: "Research" as const,
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Still proving.",
    hunterName: "Geo",
  };
  const eholeGb = {
    id: "H-ehole-gb-latepre-win-34829Z",
    title: "GB late-pre WIN",
    region: "GB" as const,
    status: "HUNTING" as const,
    badge: "Research" as const,
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Looking.",
  };
  const legacyFast = {
    id: "H-fast-gb-nearoff-win-83959Z",
    title: "GB near-off WIN",
    region: "GB" as const,
    status: "KEEP" as const,
    badge: "Solid" as const,
    chip: "Waiting for races" as const,
    n: 76,
    roi: 8.9,
    freezePnl: 119.97,
    why: "Certified keep",
  };
  const chips = tradesWaitChips([eholeAu, eholeGb, legacyFast], [legacySteam], open);
  assert.equal(chips.length, 2);
  assert.ok(chips.every((c) => /^H-ehole-/i.test(c.id)));
  assert.ok(chips.some((c) => c.id === eholeAu.id));
  assert.ok(chips.some((c) => c.id === eholeGb.id));
  assert.ok(!chips.some((c) => /steam|fade|H-fast/i.test(`${c.id} ${c.title}`)));
  const rows = chips.map((c) => waitDeskRow(c));
  assert.ok(rows.every((r) => r.result === "Waiting for races"));
  assert.ok(rows.every((r) => r.book === "paper"));
  assert.ok(rows.every((r) => r.pnl == null));
  assert.ok(rows.every((r) => r.odds === "Waiting" && r.stake === "Waiting" && r.time === "Waiting"));
  assert.ok(rows.every((r) => r.side === "WIN" || r.side === "PLACE"));
  assert.match(rows.find((r) => r.id === eholeAu.id)?.name ?? "", /Australia · morning · winner/);
});

test("measuring recipe desk row names hunter and run, not hole alone", () => {
  const row = recipeDeskRow({
    id: "H-ehole-nz-latepre-place-01741Z",
    title: "ehole_nz_late_pre_place_01741Z",
    region: "NZ",
    status: "MEASURING",
    badge: "Research",
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Still proving",
    hunterName: "Geo",
  });
  assert.match(row.name, /New Zealand · late-pre · place · Geo · 01741Z/);
});

test("open ticket shows real side/odds/stake; unsettled P&L stays Empty", () => {
  const nzOpen = fillFromRow({
    pick_id: "nz-open|1.26|102|BACK|2026-09-03",
    ts: "2026-09-03T08:14:03Z",
    date: "2026-09-03",
    cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
    mode: "auto_dry",
    status: "OPEN",
    odds: 3.55,
    stake_gbp: 1,
    side: "BACK",
    horse: null,
    paper_pnl_gbp: null,
  });
  assert.ok(nzOpen);
  const row = fillDeskRow(nzOpen, false);
  assert.equal(row.side, "BACK");
  assert.equal(row.odds, "3.55");
  assert.equal(row.stake, "1u");
  assert.equal(row.time, "08:14:03");
  assert.equal(row.result, "Open");
  assert.match(row.name, /New Zealand · morning · winner/);
  assert.match(row.name, /3\.55 BACK/);
  assert.equal(row.pnl, null);
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

test("mill tape shows open tickets, not recipe-only line", () => {
  const open = fillFromRow(gbOpen)!;
  const rows = millTapeRows({
    day: "2026-09-02",
    moves: [],
    recipes: [],
    trades: [open],
    mill_n_armed: 56,
    office: { inventWhy: "empty-hole hunt on · mill parked" },
  });
  assert.ok(rows.some((r) => /Booked/.test(r.text)));
  assert.ok(rows.some((r) => /1 open on the mill/.test(r.text)));
  assert.ok(!rows.some((r) => /recipe, not a ticket/i.test(r.text)));
});

test("mill tape shows hunt arms when hops are empty and no tickets", () => {
  const rows = millTapeRows({
    moves: [],
    recipes: [],
    mill_n_armed: 52,
    office: { inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked" },
  });
  assert.ok(rows.length >= 2);
  assert.match(rows[0].text, /empty-hole hunt/);
  assert.match(rows.at(-1)?.text ?? "", /52 armed/);
  assert.ok(!rows.at(-1)?.text.includes("recipe, not a ticket"));
});

test("field spray packs do not count as paper or appear in settled", () => {
  const base = {
    date: "2026-09-03",
    cell_id: "H-ehole-fr-inplay-win-73339Z",
    mode: "auto_dry",
    status: "SETTLED",
    stake_gbp: 2,
    placed_result: false,
    side: "BACK",
    ts: "2026-09-03T10:55:08Z",
    t: "10:55:08",
  };
  const oddsList = [9.4, 15, 6, 16, 17, 22, 11];
  const spray = oddsList
    .map((odds, i) =>
      fillFromRow({
        ...base,
        pick_id: `fr-spray-${i}`,
        odds,
        paper_pnl_gbp: -2,
      }),
    )
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const honest = fillFromRow({
    pick_id: "gb-one-pick",
    date: "2026-09-03",
    cell_id: "H-20260903T120000Z-gb-nearoff-win-one-pick",
    mode: "auto_dry",
    status: "SETTLED",
    odds: 3.2,
    stake_gbp: 2,
    paper_pnl_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-03T11:00:00Z",
    t: "11:00:00",
  })!;
  const fills = [...spray, honest];
  const ids = fieldSprayFillIds(fills);
  assert.equal(ids.size, 7);
  assert.equal(honestSettledFills(fills).length, 1);
  assert.equal(honestSettledFills(fills)[0]?.id, honest.id);
  assert.equal(settledPaperDayU(fills, "2026-09-03"), 1);
  assert.equal(settledPaperDayU(spray, "2026-09-03"), null);
});

test("field spray open packs are hidden from Open tape", () => {
  const base = {
    date: "2026-09-03",
    cell_id: "H-ehole-fr-inplay-win-73339Z",
    mode: "auto_dry",
    status: "OPEN",
    stake_gbp: 2,
    placed_result: null,
    side: "BACK",
    ts: "2026-09-03T11:13:38Z",
    t: "11:13:38",
  };
  const spray = [11.5, 6.2, 5.2, 19, 50, 26, 220, 32]
    .map((odds, i) =>
      fillFromRow({
        ...base,
        pick_id: `fr-open-spray-${i}`,
        odds,
      }),
    )
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const honest = fillFromRow({
    pick_id: "gb-one-pick-open",
    date: "2026-09-03",
    cell_id: "H-20260903T120000Z-gb-nearoff-win-one-pick",
    mode: "auto_dry",
    status: "OPEN",
    odds: 3.2,
    stake_gbp: 2,
    side: "BACK",
    ts: "2026-09-03T11:20:00Z",
    t: "11:20:00",
  })!;
  const fills = [...spray, honest];
  assert.equal(honestOpenFills(fills).length, 1);
  assert.equal(honestOpenFills(fills)[0]?.id, honest.id);
  assert.equal(fieldSprayFillIds(fills).size, 8);
});

test("wait chips dedupe by country window market", () => {
  const chips = dedupeWaitChipsByHole([
    { id: "a", title: "GB late-pre PLACE", why: null },
    { id: "b", title: "GB late-pre PLACE · copy", why: null },
    { id: "c", title: "NZ morning WIN", why: null },
  ]);
  assert.equal(chips.length, 2);
});
