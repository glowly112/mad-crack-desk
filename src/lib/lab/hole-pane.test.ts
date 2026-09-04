import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyHolePane } from "./hole-pane.ts";
import { trendProductionScore } from "./desk.ts";
import type { HoleCell } from "./boards.ts";

const emptyCell: HoleCell = {
  id: "AU|morning|WIN",
  region: "AU",
  name: "Australia",
  window: "morning",
  market: "WIN",
  tone: "empty",
  backTone: "empty",
  layTone: "empty",
};

test("emptyHolePane names hole and shows Empty state", () => {
  const pane = emptyHolePane(emptyCell, {
    office: { invent: true, inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked" },
    hunters: [{ id: "geo", note: "FLOWING · queue AU|morning|WIN" }],
    mill_mode: "parked",
  });
  assert.match(pane.title, /Australia · morning · winner/);
  assert.equal(pane.state, "Empty");
  assert.equal(pane.market, "WIN");
  assert.equal(pane.invent, "parked");
});

test("emptyHolePane marks queued hole as hunting", () => {
  const pane = emptyHolePane(emptyCell, {
    office: { invent: true, inventWhy: "empty-hole hunt on · invent_empty_holes" },
    hunters: [{ id: "geo", note: "FLOWING · queue AU|morning|WIN" }],
  });
  assert.equal(pane.invent, "hunting");
});

test("trendProductionScore is Empty when KEEP has no Solid", () => {
  assert.equal(
    trendProductionScore({
      day: "2026-09-04",
      paper_live_day_u: 12.5,
      n_solid: 0,
      n_keep: 0,
      n_measuring: 16,
      n_dropped: 0,
      factory_day_pnl_u: null,
    }),
    null,
  );
  assert.equal(
    trendProductionScore({
      day: "2026-08-25",
      paper_live_day_u: 6.03,
      n_solid: 2,
      n_keep: 3,
      n_measuring: 18,
      n_dropped: 70,
      factory_day_pnl_u: 1.4,
    }),
    6.03,
  );
});
