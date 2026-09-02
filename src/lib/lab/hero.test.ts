import assert from "node:assert/strict";
import { test } from "node:test";
import { productionScore } from "./hero.ts";

test("production score is empty when nothing is solid — research pile is not the score", () => {
  const shown = productionScore({
    n_solid: 0,
    day_u: null,
    researchKeepGbp: 444.02,
  });
  assert.equal(shown, null);
});

test("production score never falls back to freeze research pounds", () => {
  const shown = productionScore({
    n_solid: 0,
    day_u: null,
    researchKeepGbp: 444.02,
  });
  assert.notEqual(shown, 444.02);
});

test("solids without a day book are Empty — not freeze £", () => {
  const shown = productionScore({
    n_solid: 1,
    day_u: null,
    researchKeepGbp: 408.67,
  });
  assert.equal(shown, null);
});
