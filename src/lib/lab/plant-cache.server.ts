/** Oracle desk — dedupe concurrent plant loads and serve a short TTL cache. */

import type { PlantPayload } from "./plant-boot.ts";

const DEFAULT_CACHE_MS = 3_000;
const DEFAULT_TIMEOUT_MS = 12_000;

let cached: { payload: PlantPayload; at: number } | null = null;
let inflight: Promise<PlantPayload> | null = null;

function cacheMs(): number {
  const raw = Number(process.env.ORACLE_PLANT_CACHE_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_CACHE_MS;
}

export function plantLoadTimeoutMs(): number {
  const raw = Number(process.env.ORACLE_PLANT_LOAD_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

export function withPlantTimeout<T>(work: Promise<T>, fallback: T): Promise<T> {
  const ms = plantLoadTimeoutMs();
  return Promise.race([
    work,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export function peekCachedPlant(): PlantPayload | null {
  const ttl = cacheMs();
  if (!cached || ttl <= 0) return null;
  if (Date.now() - cached.at > ttl) return null;
  return cached.payload;
}

export function rememberPlant(payload: PlantPayload): PlantPayload {
  const ttl = cacheMs();
  if (ttl > 0) cached = { payload, at: Date.now() };
  return payload;
}

/** Singleflight + TTL — prevents health probes and SSR from hammering book.jsonl. */
export async function cachedPlantLoad(
  load: () => Promise<PlantPayload>,
  fallback: () => PlantPayload,
): Promise<PlantPayload> {
  const fresh = peekCachedPlant();
  if (fresh) return fresh;

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const payload = await withPlantTimeout(load(), fallback());
      return rememberPlant(payload);
    } catch {
      return rememberPlant(peekCachedPlant() ?? fallback());
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Test helper — reset module cache between unit tests. */
export function resetPlantCacheForTests(): void {
  cached = null;
  inflight = null;
}
