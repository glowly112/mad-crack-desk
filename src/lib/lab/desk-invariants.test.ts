import assert from "node:assert/strict";
import { test } from "node:test";
import { applyBoardResetView } from "./board-reset.ts";
import { applySnapshot } from "./from-snapshot.ts";
import { applyDigest, type Digest, type LiveStamp } from "./from-digest.ts";
import { millHuntCaption } from "./boards.ts";
import {
  floorEmptyFromStamp,
  floorPaperFromStamp,
  scrubPreservesSquareOccupied,
  stampSquareOccupiedN,
  trendsFactoryPaperCleared,
} from "./desk-invariants.ts";
import { scrubDeskStampArchive, sealFloorPaperFromTape } from "./mill-ingest.ts";
import { STAMP } from "./stamp.ts";
import { fillFromRow, seedTapeFromBook, deskSettledTapeRollup, assertDeskTapeFloorAligns } from "./trades.ts";
import { floorFacts } from "./desk.ts";
import digest from "./digest.json" with { type: "json" };

function base() {
  return applyDigest(digest as Digest, STAMP);
}

test("law 2: scrubDeskStampArchive never drops square_occupied_n", () => {
  const input = {
    ...STAMP,
    day: "2026-09-04" as typeof STAMP.day,
    source: "oracle" as const,
    square_occupied_n: 47,
    fuse_on: true,
    trends: STAMP.trends.map((t) =>
      t.day === "2026-09-04"
        ? { ...t, factory_day_pnl_u: -99, paper_live_day_u: -18.76 }
        : t,
    ),
    seats: STAMP.seats.map((s) =>
      s.id === "hyde" ? { ...s, now: "aim £100/day: -9.49u" } : s,
    ),
  } as unknown as LiveStamp;
  const out = scrubDeskStampArchive(input);
  assert.ok(scrubPreservesSquareOccupied(input, out));
  assert.equal(stampSquareOccupiedN(out), 47);
  assert.equal(floorEmptyFromStamp(out, 38), 17);
});

test("law 1: sealFloorPaperFromTape ignores mill stamp paper and factory_day_pnl", () => {
  const day = "2026-09-04";
  const settled = fillFromRow({
    pick_id: "set-1",
    date: day,
    cell_id: "H-ehole-gb-nearoff-win-83959Z",
    mode: "auto_dry",
    status: "SETTLED",
    paper_pnl_gbp: 2.5,
    stake_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-04T10:00:00Z",
  })!;
  const sealed = sealFloorPaperFromTape({
    ...STAMP,
    day,
    source: "oracle",
    trades: [settled],
    square_occupied_n: 44,
    trends: [
      ...STAMP.trends.filter((t) => t.day !== day),
      {
        day,
        paper_live_day_u: -18.76,
        factory_day_pnl_u: -139.58,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
      },
    ],
    hero: { ...STAMP.hero, day_u: -18.76 },
  } as unknown as LiveStamp);
  const rollup = deskSettledTapeRollup(sealed.trades, day, []);
  assert.equal(sealed.hero.day_u, rollup.u);
  assert.equal(floorPaperFromStamp(sealed), rollup.u);
  assert.ok(trendsFactoryPaperCleared(sealed));
  assert.equal(stampSquareOccupiedN(sealed), 44);
  assertDeskTapeFloorAligns(sealed.trades, day, [], rollup.u, rollup.counts);
});

test("law 1: poll scrub after mill stamp churn keeps Floor paper on tape", () => {
  const day = "2026-09-04";
  const tape = fillFromRow({
    pick_id: "tape-1",
    date: day,
    cell_id: "H-ehole-gb-nearoff-win-83959Z",
    mode: "auto_dry",
    status: "SETTLED",
    paper_pnl_gbp: 1.5,
    stake_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-04T11:00:00Z",
  })!;
  const sealed = sealFloorPaperFromTape({
    ...STAMP,
    day,
    source: "oracle",
    trades: [tape!],
    square_occupied_n: 47,
  } as unknown as LiveStamp);
  const churned = scrubDeskStampArchive({
    ...sealed,
    trends: sealed.trends.map((t) =>
      t.day === day ? { ...t, paper_live_day_u: -67.63, factory_day_pnl_u: -140 } : t,
    ),
    hero: { ...sealed.hero, day_u: -67.63 },
  } as LiveStamp);
  assert.equal(floorPaperFromStamp(churned), deskSettledTapeRollup(churned.trades, day, []).u);
  assert.ok(trendsFactoryPaperCleared(churned));
  assert.equal(stampSquareOccupiedN(churned), 47);
});

test("law 3: day roll carries prior-day OPEN to desk day", () => {
  const deskDay = "2026-09-04";
  const priorDay = "2026-09-03";
  const opens = Array.from({ length: 6 }, (_, i) =>
    fillFromRow({
      pick_id: `roll-open-${i}`,
      date: priorDay,
      cell_id: `H-ehole-gb-nearoff-win-${String(84000 + i)}Z`,
      mode: "auto_dry",
      status: "OPEN",
      odds: 2.2,
      stake_gbp: 2,
      side: "BACK",
      ts: `2026-09-03T1${i}:00:00Z`,
    })!,
  );
  const seeded = seedTapeFromBook([], opens, deskDay, []);
  const waiting = seeded.filter((f) => f.result === "waiting" && f.day === deskDay);
  assert.equal(waiting.length, 6);
  const todayPaper = floorFacts(
    { ...STAMP, day: deskDay, trades: seeded, trends: STAMP.trends },
    { day: deskDay, lookingBack: false },
  ).find((f) => f.id === "paper");
  assert.equal(todayPaper?.value, null);
});

test("law 5: plantLine keeps mill parked when mill_mode is parked", () => {
  const line = millHuntCaption("empty-hole hunt on · invent_empty_holes", {
    mill_mode: "parked",
    mill_n_armed: 42,
  });
  assert.match(line, /mill parked/);
  const live = applySnapshot(
    {
      mill_mode: "parked",
      mill_n_armed: 42,
      invent: "empty-hole hunt on · invent_empty_holes",
      occupancy_post_epoch: { n_occupied_cells: 44, occupied_cells: ["GB|morning|WIN"] },
      cells: [],
    },
    base(),
  );
  assert.match(live.plantLine, /mill parked/);
  assert.equal(stampSquareOccupiedN(live), 44);
});

test("law 5: oracle snapshot + board reset scrub keeps stamp N for empty-of-64 caption", () => {
  const keys = Array.from({ length: 24 }, (_, i) => `GB|morning|WIN-${i}`);
  const live = applySnapshot(
    {
      mill_mode: "parked",
      mill_n_armed: 36,
      n_armed: 36,
      empty_hole_hunt: {
        occupancy_post_epoch: { n_occupied_cells: 47, occupied_cells: keys },
      },
      cells: keys.slice(0, 3).map((k, i) => ({
        id: `H-ehole-${i}`,
        title: k,
        status: "MEASURING",
        country_scope: [k.split("|")[0]],
        window_scope: [k.split("|")[1]],
        market_type: "WIN",
      })),
    },
    base(),
  );
  assert.equal(stampSquareOccupiedN(live), 47);
  const view = applyBoardResetView(live);
  assert.equal(stampSquareOccupiedN(view), 47);
  assert.equal(floorEmptyFromStamp(view, 44), 17);
});
