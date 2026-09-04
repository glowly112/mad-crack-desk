import assert from "node:assert/strict";
import { test } from "node:test";
import { applyBoardResetView, isBoardResetView } from "./board-reset.ts";
import { EMPTY } from "./desk.ts";
import { STAMP } from "./stamp.ts";
import type { LiveStamp } from "./from-digest.ts";
import { hasJargon, seatBubbles, seatPreview, speakBook, speakLook } from "./staff-voice.ts";
import { staffSeats } from "./staff-seats.ts";
import { scrubMillWatchingLine } from "./mill-ingest.ts";
import { fillFromRow } from "./trades.ts";

const solidGb = {
  id: "H-20260903T120000Z-gb-nearoff-win-83959Z",
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

function liveTapeStamp(): LiveStamp {
  return applyBoardResetView({
    ...STAMP,
    recipes: [solidGb, ...STAMP.recipes.slice(1)],
    solids: [solidGb],
    n_solid: 1,
    trades: [],
    mill_n_armed: 0,
  } as unknown as LiveStamp);
}

const gbOpenRow = {
  pick_id: "H-ehole-za-nearoff-win-73508Z|open",
  ts: "2026-09-03T10:52:51Z",
  date: "2026-09-03",
  cell_id: "H-ehole-za-nearoff-win-73508Z",
  mode: "auto_dry",
  status: "OPEN",
  odds: 20,
  stake_gbp: 2,
  side: "BACK",
};

function seat(stamp: { seats: readonly import("./stamp.ts").Seat[] }, id: string) {
  return staffSeats(stamp).find((s) => s.id === id)!;
}

test("locked staff roster has five seats, not legacy plant names", () => {
  const roster = staffSeats(STAMP);
  assert.equal(roster.length, 5);
  assert.deepEqual(roster.map((s) => s.name), [
    "Invent",
    "Holdout",
    "Auditor",
    "Night + mill watch",
    "Wiki",
  ]);
  assert.ok(!roster.some((s) => /^(Igor|Bauron|Hyde|Virchow|Mercator)$/i.test(s.name)));
});

test("staff seats name live mill tickets from trades", () => {
  const open = fillFromRow(gbOpenRow)!;
  const settled = fillFromRow({
    ...gbOpenRow,
    pick_id: "settle-1",
    status: "SETTLED",
    placed_result: false,
    paper_pnl_gbp: -2,
    ts: "2026-09-03T10:33:04Z",
  })!;
  const stamp = {
    ...STAMP,
    day: "2026-09-03",
    trades: [open, settled],
    n_solid: 0,
    solids: [],
    mill_n_armed: 56,
  };
  assert.equal(isBoardResetView(stamp), false);
  const auditor = seatBubbles(seat(stamp, "auditor"), stamp).map((b) => b.text).join(" ");
  assert.match(auditor, /Last book:/);
  assert.match(auditor, /open on the mill/);
  const holdout = seatBubbles(seat(stamp, "holdout"), stamp).map((b) => b.text).join(" ");
  assert.match(holdout, /open tickets/);
  assert.match(holdout, /settled paper/);
});

test("speakBook is the short strategy mark, not a paragraph", () => {
  assert.equal(speakBook("GB near-off WIN"), "Britain · near-off · winner");
  assert.equal(speakBook("H-fast-gb-nearoff-win-83959Z"), "Britain · near-off · winner");
  assert.equal(speakBook("AU place near-off"), "Australia · near-off · place");
  assert.equal(speakLook("South Africa morning WIN"), "South Africa · morning · winner");
  assert.ok(!speakBook("GB near-off WIN").includes("recipe that bets"));
  assert.ok(!speakBook("H-fast-gb-nearoff-win-83959Z").startsWith("H-"));
});

test("Staff bubbles speak like a person and ban jargon", () => {
  const stamp = liveTapeStamp();
  const optionalEmpty = new Set<string>();
  for (const s of staffSeats(stamp)) {
    const texts = seatBubbles(s, stamp).map((b) => b.text);
    if (!optionalEmpty.has(s.id)) assert.ok(texts.length > 0, s.id);
    for (const t of texts) {
      assert.equal(hasJargon(t), false, `${s.id}: ${t}`);
      assert.match(t, /[.?!]$/);
    }
  }
  const auditor = seatBubbles(seat(stamp, "auditor"), stamp).map((b) => b.text).join(" ");
  assert.match(auditor, /Britain · near-off · winner/);
  assert.ok(!auditor.includes("recipe that bets"));
  assert.match(auditor, /later races/);
  const wiki = seatBubbles(seat(stamp, "wiki"), stamp).map((b) => b.text).join(" ");
  assert.match(wiki, /race files/);
});

test("Auditor names a parked tweak without saying cousin", () => {
  const stamp = liveTapeStamp();
  const texts = seatBubbles(
    { id: "auditor", now: "trial H-hyde-gb-nearoff-win-cousin" },
    {
      ...stamp,
      recipes: [
        ...stamp.recipes,
        {
          ...solidGb,
          id: "H-hyde-gb-nearoff-win-cousin",
          title: "GB near-off WIN · Hyde cousin",
          badge: "Research",
          status: "MEASURING",
          why: "Hyde cousin, fade the steam, one pick",
        },
      ],
      moves: [],
    },
  ).map((b) => b.text);
  assert.match(texts.join(" "), /fade the steam/);
  assert.match(texts.join(" "), /different horses/);
  assert.equal(texts.some(hasJargon), false);
});

test("Wiki seat has bubbles when race files are in", () => {
  const wiki = seat(liveTapeStamp(), "wiki");
  const bubbles = seatBubbles(wiki, liveTapeStamp());
  assert.ok(bubbles.length > 0);
  assert.equal(EMPTY, "Empty");
});

test("Staff preview scrubs aim and Hyde poison from seat.now fallback", () => {
  const stamp = {
    ...STAMP,
    day: "2026-09-04",
    trades: [],
    office: { ...STAMP.office, inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked" },
  };
  const preview = seatPreview(
    { id: "auditor", now: "aim £100/day: -9.49u · Hyde paper" },
    stamp,
  );
  assert.ok(!/aim|100\/day|hyde paper/i.test(preview));
  assert.notEqual(preview, EMPTY);
  assert.equal(scrubMillWatchingLine("aim £100/day: -9.49u"), EMPTY);
});

test("Staff hunt bubbles use plant seat.now, not in-play square scan", () => {
  const stamp = {
    ...STAMP,
    day: "2026-09-03",
    office: { ...STAMP.office, invent: true, inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked" },
    mill_n_armed: 23,
    trades: [],
    n_solid: 0,
    solids: [],
  };
  const inventSeat = staffSeats(stamp).find((s) => s.id === "invent")!;
  const bText = seatBubbles({ ...inventSeat, now: "hunt HK|morning|WIN" }, stamp)
    .map((b) => b.text)
    .join(" ");
  assert.match(bText, /Next empty hole: Hong Kong · morning · winner/);
  assert.ok(!bText.includes("in-play"));
  const mText = seatBubbles(
    { ...inventSeat, now: "HK morning/late_pre/near_off WIN empties" },
    stamp,
  )
    .map((b) => b.text)
    .join(" ");
  assert.match(mText, /Hong Kong · morning, late-pre, near-off · winner/);
  assert.ok(!mText.includes("Australia"));
});
