import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cachedPlantLoad,
  peekCachedPlant,
  rememberPlant,
  resetPlantCacheForTests,
  withPlantTimeout,
} from "./plant-cache.server.ts";
import type { PlantPayload } from "./plant-boot.ts";

function stubPayload(id: string): PlantPayload {
  return {
    stamp: { day: "2026-09-04", generated: id } as PlantPayload["stamp"],
    source: "freeze",
    detail: id,
  };
}

test("cachedPlantLoad dedupes concurrent loads", async () => {
  resetPlantCacheForTests();
  process.env.ORACLE_PLANT_CACHE_MS = "5000";
  let loads = 0;
  const slow = () =>
    new Promise<PlantPayload>((resolve) => {
      loads += 1;
      setTimeout(() => resolve(stubPayload("one")), 40);
    });
  const [a, b] = await Promise.all([
    cachedPlantLoad(slow, () => stubPayload("fallback")),
    cachedPlantLoad(slow, () => stubPayload("fallback")),
  ]);
  assert.equal(loads, 1);
  assert.equal(a.detail, "one");
  assert.equal(b.detail, "one");
  resetPlantCacheForTests();
});

test("cachedPlantLoad serves TTL cache without reloading", async () => {
  resetPlantCacheForTests();
  process.env.ORACLE_PLANT_CACHE_MS = "5000";
  let loads = 0;
  const load = async () => {
    loads += 1;
    return stubPayload(`load-${loads}`);
  };
  const first = await cachedPlantLoad(load, () => stubPayload("fallback"));
  const second = await cachedPlantLoad(load, () => stubPayload("fallback"));
  assert.equal(loads, 1);
  assert.equal(first.detail, second.detail);
  resetPlantCacheForTests();
});

test("withPlantTimeout falls back when work is slow", async () => {
  process.env.ORACLE_PLANT_LOAD_TIMEOUT_MS = "20";
  const timed = await withPlantTimeout(
    new Promise<string>((resolve) => setTimeout(() => resolve("late"), 80)),
    "fast",
  );
  assert.equal(timed, "fast");
});

test("rememberPlant and peekCachedPlant respect TTL", () => {
  resetPlantCacheForTests();
  process.env.ORACLE_PLANT_CACHE_MS = "1000";
  rememberPlant(stubPayload("cached"));
  assert.equal(peekCachedPlant()?.detail, "cached");
  resetPlantCacheForTests();
});
