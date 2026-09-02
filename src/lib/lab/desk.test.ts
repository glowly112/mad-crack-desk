import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY, SOLID_EMPTY, floorSeats, hopMoves, parkedCount, recipePack, solidRows } from "./desk.ts";
import { STAMP } from "./stamp.ts";

test("empty copy is Empty, not a skeleton", () => {
  assert.equal(EMPTY, "Empty");
});

test("solid pack leads; research keep is parked, not income", () => {
  const pack = recipePack(STAMP.recipes);
  assert.equal(STAMP.n_solid, 1);
  assert.equal(pack.solids.length, 1);
  assert.equal(pack.solids[0]?.id, "H-fast-gb-nearoff-win-83959Z");
  assert.equal(pack.keeps.length, 1);
  assert.equal(pack.keeps[0]?.badge, "Parked");
  assert.equal(solidRows(STAMP.recipes, 1)[0]?.badge, "Solid");
  assert.deepEqual(solidRows(STAMP.recipes, 0), []);
  assert.equal(parkedCount(STAMP.counts.keep, STAMP.n_solid), 2);
  assert.equal(SOLID_EMPTY, "No solid recipes on the day tape.");
});

test("a keep dressed as Solid stays out of the pack when n_solid is 0", () => {
  const dressed = [{ ...STAMP.recipes[1], badge: "Solid" as const }];
  assert.equal(recipePack(dressed).solids.length, 1);
  assert.deepEqual(solidRows(dressed, 0), []);
});

test("floor log hops are state changes, not proving ticks", () => {
  const hops = hopMoves(STAMP.moves);
  assert.ok(hops.some((m) => m.to === "Certified"));
  assert.ok(hops.some((m) => m.to === "Dead"));
  assert.ok(hops.every((m) => m.from !== "Proving" || m.to !== "Proving"));
});

test("floor watching strip is Clerk, Foreman, mill", () => {
  const ids = floorSeats(STAMP.seats).map((s) => s.id);
  assert.deepEqual(ids, ["clerk", "foreman", "igor"]);
});
