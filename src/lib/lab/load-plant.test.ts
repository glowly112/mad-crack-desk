import assert from "node:assert/strict";
import { test } from "node:test";
import { productionScore } from "./hero.ts";
import { loadPlant } from "./load-plant.server.ts";

test("loadPlant stays on the plant tape and does not hang", async () => {
  const t0 = Date.now();
  const plant = await loadPlant();
  assert.ok(Date.now() - t0 < 2500);
  assert.equal(plant.source, "oracle");
  assert.equal(plant.stamp.n_solid, 0);
  assert.equal(plant.stamp.hero.day_u, null);
  assert.equal(plant.stamp.fuse_on, false);
  assert.equal(plant.stamp.counts.keep, 2);
  assert.equal(plant.stamp.counts.measuring, 17);
  assert.equal(
    productionScore({
      n_solid: plant.stamp.n_solid,
      day_u: plant.stamp.hero.day_u,
      researchKeepGbp: plant.stamp.researchKeepGbp,
    }),
    null,
  );
});
