import assert from "node:assert/strict";
import { test } from "node:test";
import { hunterById, issueById, recipeById, seatById } from "./lookup.ts";

test("recipe lookup returns the parked AU keep by id", () => {
  const r = recipeById("H-fast-au-nearoff-place");
  assert.equal(r?.title, "AU near-off place");
  assert.match(r?.why ?? "", /Hyde HOLD/);
});

test("missing recipe id is empty, not a throw", () => {
  assert.equal(recipeById("no-such-recipe"), null);
  assert.equal(seatById("nobody"), null);
  assert.equal(issueById("ghost"), null);
  assert.equal(hunterById("ghost"), null);
});
