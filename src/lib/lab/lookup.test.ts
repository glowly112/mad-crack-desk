import assert from "node:assert/strict";
import { test } from "node:test";
import { hunterById, issueById, recipeById, seatById } from "./lookup.ts";

test("recipe lookup returns the certified GB solid by id", () => {
  const r = recipeById("H-fast-gb-nearoff-win-83959Z");
  assert.equal(r?.title, "GB win near-off");
  assert.equal(r?.badge, "Solid");
  assert.match(r?.why ?? "", /Certified keep/);
});

test("missing recipe id is empty, not a throw", () => {
  assert.equal(recipeById("no-such-recipe"), null);
  assert.equal(seatById("nobody"), null);
  assert.equal(issueById("ghost"), null);
  assert.equal(hunterById("ghost"), null);
});
