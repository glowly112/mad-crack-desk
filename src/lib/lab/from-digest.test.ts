import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDigest, parseStampLine, type Digest } from "./from-digest.ts";
import { STAMP } from "./stamp.ts";
import digest from "./digest.json" with { type: "json" };

test("stamp line: em dash score is empty, not research pounds", () => {
  const p = parseStampLine("Score — · Solids 0 · Real betting: OFF · 20260829T105150Z");
  assert.equal(p.day_u, null);
  assert.equal(p.n_solid, 0);
  assert.equal(p.fuse_on, false);
  assert.equal(p.generated, "20260829T105150Z");
});

test("stamp line: a printed score passes through", () => {
  const p = parseStampLine("Score +2.33u · Solids 0 · Real betting: OFF · 20260828T234601Z");
  assert.equal(p.day_u, 2.33);
  assert.equal(p.n_solid, 0);
});

test("digest overlay uses plant KEEP/measuring and leaves research £ off the hero", () => {
  const live = applyDigest(digest as Digest, STAMP);
  assert.equal(live.counts.keep, 3);
  assert.equal(live.counts.measuring, 21);
  assert.equal(live.counts.kill, 126);
  assert.equal(live.n_solid, 1);
  assert.equal(live.hero.day_u, null);
  assert.equal(live.fuse_on, false);
  assert.equal(live.office.invent, true);
  assert.equal(live.pipe.certified, 1);
  assert.equal(live.pipe.certified, live.n_solid);
  assert.equal(live.pipe.proving, 21);
  assert.equal(live.source, "digest");
  assert.equal(live.generated, "20260902T101756Z");
  assert.equal(live.office.activeHunter, "Geo");
  const igor = live.seats.find((s) => s.id === "igor");
  assert.equal(igor?.status, "GREEN");
  assert.deepEqual(live.trades, []);
});
