import assert from "node:assert/strict";
import { test } from "node:test";
import {
  EMPTY,
  SOLID_EMPTY,
  healthLine,
  issueLanes,
  moveTone,
  productionDomain,
  productionTicks,
  recipePack,
  solidRows,
} from "./desk.ts";
import { STAMP } from "./stamp.ts";

test("research keep is not a win tone — Dead and Stuck stay loud", () => {
  assert.equal(moveTone("Research keep"), "mute");
  assert.equal(moveTone("Pass"), "mute");
  assert.equal(moveTone("Dead"), "bad");
  assert.equal(moveTone("Stuck"), "bad");
});

test("solids 0 pack is empty — research keeps are not the solid list", () => {
  const pack = recipePack(STAMP.recipes);
  assert.equal(STAMP.n_solid, 0);
  assert.equal(pack.solids.length, 0);
  assert.equal(pack.keeps.length, 2);
  assert.equal(pack.proving.length, 3);
  assert.deepEqual(solidRows(STAMP.recipes, 0), []);
  assert.equal(SOLID_EMPTY, "No solid recipes on the day tape.");
});

test("glare: a keep dressed as Solid still stays out of the pack when n_solid is 0", () => {
  const dressed = [
    { ...STAMP.recipes[0], badge: "Solid" as const },
    STAMP.recipes[1],
  ];
  assert.equal(recipePack(dressed).solids.length, 1);
  assert.deepEqual(solidRows(dressed, 0), []);
});

test("needs-you lane is the Floor top blocker — same row id", () => {
  const lanes = issueLanes(STAMP.issues, STAMP.topBlocker.id);
  assert.equal(lanes.needsYou.length, 1);
  assert.equal(lanes.needsYou[0]?.id, "conversion");
  assert.equal(lanes.watching.length, STAMP.issues.length - 1);
  assert.ok(!lanes.watching.some((i) => i.id === "conversion"));
});

test("health line is plant healthy or needs X — not a chip row", () => {
  assert.equal(
    healthLine({
      plantHealth: STAMP.plantHealth,
      plantLine: STAMP.plantLine,
      kpis: STAMP.kpis,
    }),
    "Needs Doer",
  );
  assert.equal(
    healthLine({ plantHealth: "GREEN", plantLine: "all quiet", kpis: [] }),
    "Plant healthy",
  );
});

test("production domain includes aim £100 — does not autoscale to 8", () => {
  const values = STAMP.trends.map((t) => t.paper_live_day_u);
  const [lo, hi] = productionDomain(values, STAMP.hero.aim_u);
  assert.ok(hi >= 100);
  assert.ok(lo <= -63);
  assert.ok(hi > 8);
  const [emptyLo, emptyHi] = productionDomain([null, null], 100);
  assert.equal(emptyHi, 100);
  assert.equal(emptyLo, 0);
  assert.deepEqual(productionTicks([lo, hi], 100), [-64, 0, 100]);
});

test("empty copy is Empty, not poetry", () => {
  assert.equal(EMPTY, "Empty");
});
