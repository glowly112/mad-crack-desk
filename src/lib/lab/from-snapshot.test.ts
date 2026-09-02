import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDigest, type Digest } from "./from-digest.ts";
import { applySnapshot } from "./from-snapshot.ts";
import { productionScore } from "./hero.ts";
import { STAMP } from "./stamp.ts";
import digest from "./digest.json" with { type: "json" };
import snap from "./live-snapshot.json" with { type: "json" };

function base() {
  return applyDigest(digest as Digest, STAMP);
}

test("Linear snapshot overlays KEEP/measuring and never puts KEEP paper on the hero", () => {
  const live = applySnapshot(
    {
      date: "2026-08-29",
      generatedAt: "20260829T111412Z",
      sourceMode: "oracle",
      truth: { keep: 2, measuring: 18, gathering: 4, dropped: 113, profit: "Firm KEEP paper £444.02" },
      pnlTotal: 444.02,
      cells: [
        {
          id: "H-fast-au-nearoff-place",
          title: "AU near-off place",
          status: "KEEP",
          n: 58,
          why: "Firm lab KEEP · n_size_ok=58",
          pnl: 226.68,
          stats: { roi: 19.5 },
        },
        {
          id: "gb-late-pre-win",
          title: "GB late-pre win",
          status: "MEASURING",
          n: 31,
          stats: { roi: 13.3 },
        },
      ],
    },
    base(),
  );
  assert.equal(live.source, "oracle");
  assert.equal(live.counts.keep, 2);
  assert.equal(live.counts.measuring, 18);
  assert.equal(live.counts.kill, 113);
  assert.equal(live.n_solid, 0);
  assert.equal(live.hero.day_u, null);
  assert.equal(live.researchKeepGbp, 444.02);
  assert.equal(live.fuse_on, false);
  assert.equal(
    productionScore({ n_solid: live.n_solid, day_u: live.hero.day_u, researchKeepGbp: live.researchKeepGbp }),
    null,
  );
  assert.equal(live.recipes[0]?.id, "H-fast-au-nearoff-place");
  assert.equal(live.recipes[0]?.badge, "Parked");
  assert.equal(live.recipes[0]?.region, "AU");
  assert.equal(live.recipes[1]?.badge, "Research");
  assert.equal(live.recipes[1]?.region, "GB");
});

test("small field does not become Ireland", () => {
  const live = applySnapshot(
    {
      date: "2026-09-02",
      cells: [
        {
          id: "H-20260831T141500Z-us-inplay-place-smallfield",
          title: "US in-play PLACE · one-pick small field",
          status: "MEASURING",
          n: 18,
        },
      ],
    },
    base(),
  );
  assert.equal(live.recipes[0]?.region, "US");
});

test("firm scoreboard by_status and cells overlay without inventing solids", () => {
  const live = applySnapshot(
    {
      date: "2026-08-29",
      ts: "2026-08-29T11:14:12Z",
      summary: { by_status: { KEEP: 2, MEASURING: 18, HUNTING: 3, KILL: 113 }, keep_pnl_gbp: 444.02 },
      cells: [
        {
          id: "H-ie-morning-place-jumps",
          title: "IE morning place jumps",
          status: "KEEP",
          score: { n_size_ok: 54, roi_size_ok_pct: 16.7, honest_pnl_size_ok: 151.49 },
        },
      ],
    },
    base(),
  );
  assert.equal(live.source, "oracle");
  assert.equal(live.counts.keep, 2);
  assert.equal(live.counts.measuring, 18);
  assert.equal(live.counts.hunting, 3);
  assert.equal(live.n_solid, 0);
  assert.equal(live.hero.day_u, null);
  assert.equal(live.researchKeepGbp, 444.02);
  assert.equal(live.recipes[0]?.region, "IE");
  assert.equal(live.recipes[0]?.badge, "Parked");
  assert.equal(live.recipes[0]?.n, 54);
});

test("missing liveMoney leaves the digest fuse alone", () => {
  const live = applySnapshot({ truth: { keep: 2, measuring: 18, dropped: 113 } }, base());
  assert.equal(live.fuse_on, false);
  assert.equal(live.fuse, "Real betting: OFF");
});

test("liveMoney live_on and place_on is the only path that opens the fuse", () => {
  const live = applySnapshot(
    {
      truth: { keep: 2, measuring: 18, dropped: 113 },
      liveMoney: { live_on: true, place_on: true, day_pnl_gbp: 1.2, n_live_orders: 0 },
    },
    base(),
  );
  assert.equal(live.fuse_on, true);
  assert.equal(live.fuse, "Real betting: ON");
});

test("live_on without place_on does not open the fuse", () => {
  const live = applySnapshot(
    {
      truth: { keep: 2 },
      liveMoney: { live_on: true, place_on: false },
    },
    base(),
  );
  assert.equal(live.fuse_on, false);
});

test("Solid recipes lead the tape even when the scoreboard lists a parked keep first", () => {
  const live = applySnapshot(
    {
      truth: { keep: 2, measuring: 0, dropped: 0 },
      n_solid: 1,
      paper_live_day_u: null,
      cells: [
        { id: "parked_nz", title: "NZ morning win", status: "KEEP", keep_badge: "Parked", n: 68 },
        {
          id: "solid_gb",
          title: "GB win near-off",
          status: "KEEP",
          keep_badge: "Solid",
          status_chip: "Waiting for races",
          certified: true,
          n: 76,
        },
      ],
    },
    base(),
  );
  assert.equal(live.recipes[0]?.id, "solid_gb");
  assert.equal(live.recipes[0]?.badge, "Solid");
  assert.equal(live.recipes[1]?.badge, "Parked");
});

test("boardUx n_solid and paperLive day_u pass through; KEEP count is not solids", () => {
  const live = applySnapshot(
    {
      truth: { keep: 2, measuring: 1, dropped: 0 },
      boardUx: { n_solid: 1, hero_u: -2.8, fuse: "Real betting: OFF" },
      paperLive: { day_u: -2.8 },
      cells: [
        { id: "solid_a", title: "AU in-play place", status: "KEEP", keep_badge: "Solid", n: 40 },
        { id: "research_b", title: "US near-off", status: "KEEP", keep_badge: "Parked", n: 20 },
      ],
    },
    base(),
  );
  assert.equal(live.n_solid, 1);
  assert.equal(live.hero.day_u, -2.8);
  assert.equal(live.fuse_on, false);
  assert.equal(live.recipes[0]?.badge, "Solid");
  assert.equal(live.solids.length, 1);
  assert.equal(
    productionScore({ n_solid: live.n_solid, day_u: live.hero.day_u, researchKeepGbp: 444.02 }),
    -2.8,
  );
});

test("garbage or error payload leaves the digest stamp", () => {
  const boot = base();
  const live = applySnapshot({ error: "not found" }, boot);
  assert.equal(live.source, "digest");
  assert.equal(live.counts.keep, boot.counts.keep);
});

test("fills overlay lists today's paper tape and does not invent production", () => {
  const live = applySnapshot(
    {
      truth: { keep: 2 },
      fills: [
        {
          pick_id: "nz-1",
          ts: "2026-09-02T00:07:45Z",
          cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
          mode: "auto_dry",
          status: "SETTLED",
          odds: 3.35,
          stake_gbp: 2,
          paper_pnl_gbp: -2,
          placed_result: false,
          certified_keep: false,
        },
      ],
    },
    base(),
  );
  assert.equal(live.trades.length, 1);
  assert.equal(live.trades[0]?.book, "paper");
  assert.equal(live.trades[0]?.recipe, "NZ morning WIN · one-pick 2.5–4.49");
  assert.deepEqual(
    live.trades.filter((t) => t.book === "production" || t.book === "live"),
    [],
  );
});

test("empty fills array is Empty, missing fills keeps the digest tape", () => {
  const withTape = applySnapshot(
    {
      truth: { keep: 2 },
      fills: [
        {
          pick_id: "keep-me",
          ts: "2026-09-02T00:00:00Z",
          cell_id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
          mode: "auto_dry",
          status: "OPEN",
        },
      ],
    },
    base(),
  );
  assert.equal(withTape.trades.length, 1);
  const cleared = applySnapshot({ truth: { keep: 2 }, fills: [] }, withTape);
  assert.deepEqual(cleared.trades, []);
  const kept = applySnapshot({ truth: { keep: 2 } }, withTape);
  assert.equal(kept.trades.length, 1);
  assert.equal(kept.trades[0]?.id, "keep-me");
});

test("plant live snapshot is oracle empty board when day_u is null", () => {
  const live = applySnapshot(snap, base());
  assert.equal(live.source, "oracle");
  assert.equal(live.counts.keep, 0);
  assert.equal(live.counts.measuring, 0);
  assert.equal(live.n_solid, 0);
  assert.equal(live.pipe.certified, 0);
  assert.equal(live.fuse_on, false);
  assert.equal(live.hero.day_u, null);
  assert.equal(live.researchKeepGbp, 0);
  assert.equal(live.generated, "20260902T101756Z");
  assert.equal(live.recipes.length, 0);
  assert.equal(
    productionScore({ n_solid: live.n_solid, day_u: live.hero.day_u, researchKeepGbp: live.researchKeepGbp }),
    null,
  );
  assert.equal(live.trades.length, 0);
  assert.equal(live.wait_open?.length ?? 0, 0);
});
