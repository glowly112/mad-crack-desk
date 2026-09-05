import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isMillArchivePoison,
  scrubDeskStampArchive,
  scrubDigestStampArchive,
  scrubMillWatchingLine,
  filterIngestMillFillRows,
  sealFloorPaperFromTape,
} from "./mill-ingest.ts";
import type { LiveStamp } from "./from-digest.ts";
import { STAMP } from "./stamp.ts";
import { fillFromRow, deskSettledTapeRollup, mergeMillTradesTape, assertDeskTapeFloorAligns, seedTapeFromBook } from "./trades.ts";
import { floorFacts } from "./desk.ts";

test("mill archive poison detects aim and hyde history", () => {
  assert.ok(isMillArchivePoison("aim £100/day: -9.49u"));
  assert.ok(isMillArchivePoison("plant_status £100/day · Hyde paper"));
  assert.ok(isMillArchivePoison("254 settled · −140u"));
  assert.ok(isMillArchivePoison("H-hyde-GB_near_off_WIN"));
  assert.ok(!isMillArchivePoison("invent on · empty-hole hunt"));
});

test("scrubMillWatchingLine strips poison segments", () => {
  const out = scrubMillWatchingLine("invent on · aim £100/day: -9.49u · hunter Geo");
  assert.ok(!/aim|100\/day/i.test(out));
  assert.match(out, /invent on/);
});

test("filterIngestMillFillRows drops hyde and freeze rows", () => {
  const hyde = {
    pick_id: "h1",
    cell_id: "H-hyde-gb-morning-win",
    date: "2026-09-03",
    status: "SETTLED",
  };
  const freeze = {
    pick_id: "f1",
    cell_id: "H-ehole-gb-nearoff-win-83959Z",
    date: "2026-09-03",
    mode: "freeze",
    status: "SETTLED",
  };
  const ehole = {
    pick_id: "e1",
    cell_id: "H-ehole-gb-nearoff-win-83959Z",
    date: "2026-09-03",
    mode: "auto_dry",
    status: "SETTLED",
    paper_pnl_gbp: -1,
    stake_gbp: 1,
    placed_result: false,
    side: "BACK",
    ts: "2026-09-03T12:00:00Z",
  };
  const kept = filterIngestMillFillRows([hyde, freeze, ehole]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0]?.pick_id, "e1");
});

test("scrubDeskStampArchive zeros freeze keep and factory history", () => {
  const stamp = scrubDeskStampArchive({
    ...STAMP,
    day: "2026-09-03" as typeof STAMP.day,
    source: "oracle",
    researchKeepGbp: 408.67,
    square_occupied_n: 42,
    fuse_on: true,
    trends: STAMP.trends.map((t) =>
      t.day === "2026-09-03"
        ? { ...t, factory_day_pnl_u: -139.58, paper_live_day_u: -67.63 }
        : t,
    ),
    seats: STAMP.seats.map((s) =>
      s.id === "auditor" ? { ...s, status: "GREEN", now: "aim £100/day: -9.49u" } : s,
    ),
    kpis: STAMP.kpis.map((k) =>
      k.id === "factory" ? { ...k, detail: "aim £100/day · Hyde paper" } : k,
    ),
  } as unknown as LiveStamp);
  assert.equal(stamp.researchKeepGbp, 0);
  assert.equal((stamp as LiveStamp & { square_occupied_n?: number }).square_occupied_n, 42);
  assert.equal(stamp.fuse_on, false);
  assert.ok(stamp.trends.every((t) => t.day < "2026-09-02" || t.factory_day_pnl_u == null));
  const auditor = stamp.seats.find((s) => s.id === "auditor");
  assert.ok(auditor);
  assert.ok(!isMillArchivePoison(auditor!.now));
});

test("scrubDigestStampArchive clears digest history paper", () => {
  const scrubbed = scrubDigestStampArchive({
    ...STAMP,
    day: "2026-09-03",
    hero: { ...STAMP.hero, day_u: -67.63 },
    trends: STAMP.trends.map((t) =>
      t.day === "2026-09-03" ? { ...t, paper_live_day_u: -140, factory_day_pnl_u: -139.58 } : t,
    ),
  } as unknown as LiveStamp);
  assert.equal(scrubbed.hero.day_u, null);
  const today = scrubbed.trends.find((t) => t.day === "2026-09-03");
  assert.equal(today?.paper_live_day_u ?? null, null);
  assert.equal(today?.factory_day_pnl_u ?? null, null);
});

test("scrub keeps first-book ehole settles on tape", () => {
  const day = "2026-09-03";
  const harb = fillFromRow({
    pick_id: "harb-34829",
    date: day,
    cell_id: "H-ehole-gb-latepre-win-34829Z",
    mode: "auto_dry",
    status: "SETTLED",
    horse_name: "Harb",
    paper_pnl_gbp: 3.724,
    stake_gbp: 2,
    placed_result: true,
    side: "BACK",
    ts: "2026-09-03T14:00:00Z",
  })!;
  const stamp = scrubDeskStampArchive({
    ...STAMP,
    day,
    source: "oracle",
    trades: [harb],
    recipes: [
      {
        id: "H-ehole-gb-latepre-win-34829Z",
        title: "ehole_gb_latepre_win",
        region: "GB",
        status: "MEASURING",
        badge: "Research",
        chip: null,
        n: 0,
        roi: 0,
        freezePnl: 0,
        why: "proving",
        hunterName: "Geo",
      },
    ],
  } as unknown as LiveStamp);
  assert.ok(stamp.trades.some((f) => f.horse === "Harb"));
});

test("sealFloorPaperFromTape ignores mill stamp paper_live and factory_day_pnl", () => {
  const day = "2026-09-03";
  const wins = Array.from({ length: 16 }, (_, i) =>
    fillFromRow({
      pick_id: `w-${i}`,
      date: day,
      cell_id: `H-ehole-gb-morning-win-${String(10000 + i)}Z`,
      mode: "auto_dry",
      status: "SETTLED",
      paper_pnl_gbp: 1,
      stake_gbp: 2,
      placed_result: true,
      side: "BACK",
      ts: `2026-09-03T10:${String(i).padStart(2, "0")}:00Z`,
    })!,
  );
  const losses = Array.from({ length: 46 }, (_, i) =>
    fillFromRow({
      pick_id: `l-${i}`,
      date: day,
      cell_id: `H-ehole-ie-nearoff-win-${String(20000 + i)}Z`,
      mode: "auto_dry",
      status: "SETTLED",
      paper_pnl_gbp: -0.5,
      stake_gbp: 2,
      placed_result: false,
      side: "BACK",
      ts: `2026-09-03T11:${String(i).padStart(2, "0")}:00Z`,
    })!,
  );
  const tape = [...wins, ...losses].filter(Boolean) as NonNullable<ReturnType<typeof fillFromRow>>[];
  const rollup = deskSettledTapeRollup(tape, day, []);
  assert.equal(rollup.counts?.wins, 16);
  assert.equal(rollup.counts?.losses, 46);
  const millBloat = Array.from({ length: 20 }, (_, i) =>
    fillFromRow({
      pick_id: `bloat-${i}`,
      date: day,
      cell_id: `H-ehole-fr-inplay-win-${String(30000 + i)}Z`,
      mode: "auto_dry",
      status: "SETTLED",
      paper_pnl_gbp: -0.5,
      stake_gbp: 2,
      placed_result: false,
      side: "BACK",
      ts: `2026-09-03T09:${String(i).padStart(2, "0")}:00Z`,
    })!,
  ).filter(Boolean) as NonNullable<ReturnType<typeof fillFromRow>>[];

  const sealed = sealFloorPaperFromTape({
    ...STAMP,
    day,
    source: "oracle",
    trades: tape,
    trends: [
      ...STAMP.trends.filter((t) => t.day !== day),
      {
        day,
        paper_live_day_u: -18.76,
        factory_day_pnl_u: -18.76,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
      },
    ],
    hero: { ...STAMP.hero, day_u: -18.76 },
  } as unknown as LiveStamp);

  assert.equal(sealed.hero.day_u, rollup.u);
  assert.equal(sealed.trends.find((t) => t.day === day)?.paper_live_day_u, null);
  assert.equal(sealed.trends.find((t) => t.day === day)?.factory_day_pnl_u, null);

  const facts = floorFacts(sealed, { day, lookingBack: false });
  const paper = facts.find((f) => f.id === "paper");
  assert.equal(paper?.value, rollup.u);
  assert.equal(paper?.countsLine, rollup.countsLine);
  assertDeskTapeFloorAligns(sealed.trades, day, [], paper?.value ?? null, rollup.counts);

  const afterChurn = scrubDeskStampArchive({
    ...sealed,
    trades: mergeMillTradesTape(tape, [...tape, ...millBloat], day),
    trends: [
      ...STAMP.trends.filter((t) => t.day !== day),
      {
        day,
        paper_live_day_u: -18.76,
        factory_day_pnl_u: -18.76,
        n_solid: 0,
        n_keep: 0,
        n_measuring: 0,
        n_dropped: 0,
      },
    ],
    hero: { ...STAMP.hero, day_u: -18.76 },
  } as unknown as LiveStamp);
  const churnRollup = deskSettledTapeRollup(afterChurn.trades, day, []);
  assert.equal(churnRollup.u, rollup.u);
  assert.equal(churnRollup.counts?.wins, 16);
  assert.equal(churnRollup.counts?.losses, 46);
  const churnPaper = floorFacts(afterChurn, { day, lookingBack: false }).find((f) => f.id === "paper");
  assert.equal(churnPaper?.value, rollup.u);
});

test("day roll seals Sep 4 Empty while Sep 3 opens carry and trend bar survives", () => {
  const priorDay = "2026-09-03";
  const deskDay = "2026-09-04";
  const openRows = Array.from({ length: 6 }, (_, i) =>
    fillFromRow({
      pick_id: `roll-open-${i}`,
      date: priorDay,
      cell_id: `H-ehole-gb-nearoff-win-${String(84000 + i)}Z`,
      mode: "auto_dry",
      status: "OPEN",
      odds: 2.2 + i * 0.1,
      stake_gbp: 2,
      side: "BACK",
      ts: `2026-09-03T1${i}:00:00Z`,
    })!,
  );
  const settled = fillFromRow({
    pick_id: "roll-set-1",
    date: priorDay,
    cell_id: "H-ehole-ie-nearoff-win-73339Z",
    mode: "auto_dry",
    status: "SETTLED",
    paper_pnl_gbp: -2,
    stake_gbp: 2,
    placed_result: false,
    side: "BACK",
    ts: "2026-09-03T14:00:00Z",
  })!;
  const bookFills = [...openRows, settled!].filter(Boolean) as NonNullable<ReturnType<typeof fillFromRow>>[];
  const seeded = seedTapeFromBook([], bookFills, deskDay, STAMP.recipes);
  const sealed = sealFloorPaperFromTape({
    ...STAMP,
    day: deskDay,
    source: "oracle",
    trades: seeded,
    trends: STAMP.trends.filter((t) => t.day !== priorDay),
    hero: { ...STAMP.hero, day_u: null },
  } as unknown as LiveStamp);

  const opens = sealed.trades.filter((f) => f.result === "waiting" && f.day === deskDay);
  assert.equal(opens.length, 6);
  const sep3 = sealed.trends.find((t) => t.day === priorDay);
  assert.ok(sep3);
  const sep3Rollup = deskSettledTapeRollup(sealed.trades, priorDay, STAMP.recipes).u;
  assert.equal(sep3Rollup, -1);
  assert.equal(sep3?.paper_live_day_u, null);
  assert.equal(sep3?.factory_day_pnl_u, null);
  const todayPaper = floorFacts(sealed, { day: deskDay, lookingBack: false }).find((f) => f.id === "paper");
  assert.equal(todayPaper?.value, null);
  assert.equal(todayPaper?.countsLine, null);
});
