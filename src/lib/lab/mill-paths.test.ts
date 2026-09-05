import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeMillPathRuns, pathRunsOf } from "./mill-paths.ts";
import { waitDeskRow, fillFromRow, fillDeskRow } from "./trades.ts";
import { EMPTY } from "./desk.ts";

test("mergeMillPathRuns adds cells and fills from path_runs same turn", () => {
  const runs = [
    {
      cell_id: "H-ehole-za-nearoff-place-99999Z",
      mode: "wait_open",
      gate_verdict: "HOLD_PAPER",
      reasons: ["no_open_size_ok_candidates"],
    },
    {
      cell_id: "H-ehole-au-morning-win-73508Z",
      mode: "auto_dry",
      gate_verdict: "HOLD_PAPER",
      details: {
        pick_ids: [
          "H-ehole-au-morning-win-73508Z|3.5|123|BACK|2026-09-03",
        ],
      },
    },
  ];
  const snap = mergeMillPathRuns({
    cells: [],
    fills: [],
    wait_open: [],
    path_runs: runs,
  });
  const cells = snap.cells as unknown[];
  const waitOpen = snap.wait_open as unknown[];
  const fills = snap.fills as unknown[];
  assert.equal(cells.length, 2);
  assert.equal(waitOpen.length, 1);
  assert.equal(fills.length, 1);
  assert.equal(pathRunsOf(snap).length, 2);
});

test("waiting chips show compact hole and stamped LAY side", () => {
  const row = waitDeskRow({
    id: "H-ehole-nz-latepre-place-00206Z",
    title: "ehole_nz_late_pre_place_00206Z",
    why: null,
  });
  assert.equal(row.hole, "NZ · late-pre · plc");
  assert.equal(row.side, EMPTY);

  const lay = waitDeskRow({
    id: "H-ehole-au-morning-lay-73508Z",
    title: "ehole_au_morning_lay",
    why: null,
  });
  assert.equal(lay.hole, "AU · morning · win");
  assert.equal(lay.side, "LAY");
});

test("open BACK ticket shows hole and side separately", () => {
  const fill = fillFromRow({
    pick_id: "za-near|1|1|BACK|2026-09-03",
    cell_id: "H-ehole-za-nearoff-win-73508Z",
    status: "OPEN",
    side: "BACK",
    odds: 4.2,
    date: "2026-09-03",
    ts: "2026-09-03T12:00:00Z",
  })!;
  const row = fillDeskRow(fill, false);
  assert.equal(row.hole, "ZA · near-off · win");
  assert.equal(row.side, "BACK");
});
