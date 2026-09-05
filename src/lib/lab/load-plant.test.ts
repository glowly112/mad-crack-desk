import assert from "node:assert/strict";
import { test } from "node:test";
import { isBoardResetView } from "./board-reset.ts";
import { productionScore } from "./hero.ts";
import { loadPlant } from "./load-plant.server.ts";

test("loadPlant stays on the plant tape and does not hang", async () => {
  const t0 = Date.now();
  const plant = await loadPlant();
  assert.ok(Date.now() - t0 < 9000);
  assert.ok(plant.source === "oracle" || plant.source === "freeze");
  assert.equal(plant.stamp.fuse_on, false);
  assert.notEqual(plant.stamp.hero.day_u, plant.stamp.researchKeepGbp);

  const empty = isBoardResetView(plant.stamp);
  if (plant.source === "freeze" && empty) {
    assert.match(plant.detail, /frozen|board reset/);
    assert.equal(plant.stamp.hero.day_u, null);
    assert.equal(
      productionScore({
        n_solid: plant.stamp.n_solid,
        day_u: plant.stamp.hero.day_u,
        researchKeepGbp: plant.stamp.researchKeepGbp,
      }),
      null,
    );
    assert.equal(plant.stamp.pipe.certified, plant.stamp.n_solid);
    assert.equal(plant.stamp.trades.length, 0);
    assert.equal(plant.stamp.recipes.length, 0);
  }

  if (!empty) {
    assert.match(plant.detail, /live oracle|post-reset/i);
    assert.ok(plant.stamp.recipes.length > 0 || plant.stamp.trades.length > 0);
  }
});
