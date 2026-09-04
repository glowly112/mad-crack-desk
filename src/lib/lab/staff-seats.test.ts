import assert from "node:assert/strict";
import { test } from "node:test";
import { STAMP } from "./stamp.ts";
import { LOCKED_STAFF_ORDER, staffSeats } from "./staff-seats.ts";

test("staffSeats returns locked roster only", () => {
  const roster = staffSeats(STAMP);
  assert.deepEqual(roster.map((s) => s.id), [...LOCKED_STAFF_ORDER]);
  assert.ok(!roster.some((s) => ["igor", "bauron", "hyde", "virchow", "mercator", "clerk"].includes(s.id)));
});
