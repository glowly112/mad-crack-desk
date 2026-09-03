import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isMillArchivePoison,
  scrubDeskStampArchive,
  scrubDigestStampArchive,
  scrubMillWatchingLine,
  filterIngestMillFillRows,
} from "./mill-ingest.ts";
import type { LiveStamp } from "./from-digest.ts";
import { STAMP } from "./stamp.ts";
import { fillFromRow } from "./trades.ts";

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
      s.id === "hyde" ? { ...s, status: "GREEN", now: "aim £100/day: -9.49u" } : s,
    ),
    kpis: STAMP.kpis.map((k) =>
      k.id === "factory" ? { ...k, detail: "aim £100/day · Hyde paper" } : k,
    ),
  } as unknown as LiveStamp);
  assert.equal(stamp.researchKeepGbp, 0);
  assert.equal((stamp as LiveStamp & { square_occupied_n?: number }).square_occupied_n, undefined);
  assert.equal(stamp.fuse_on, false);
  assert.ok(stamp.trends.every((t) => t.day < "2026-09-02" || t.factory_day_pnl_u == null));
  const hyde = stamp.seats.find((s) => s.id === "hyde");
  assert.ok(hyde);
  assert.ok(!isMillArchivePoison(hyde!.now));
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
