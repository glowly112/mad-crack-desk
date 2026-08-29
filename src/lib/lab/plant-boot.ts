import digest from "./digest.json" with { type: "json" };
import liveSnap from "./live-snapshot.json" with { type: "json" };
import { applyDigest, type Digest, type LiveStamp } from "./from-digest.ts";
import { applySnapshot } from "./from-snapshot.ts";
import { STAMP } from "./stamp.ts";

export type PlantPayload = {
  stamp: LiveStamp;
  source: "oracle" | "digest" | "freeze";
  detail: string;
};

export function digestStamp(): LiveStamp {
  return applyDigest(digest as Digest, STAMP);
}

export function bootStamp(): LiveStamp {
  return applySnapshot(liveSnap, digestStamp());
}

export function plantFromTape(stamp: LiveStamp): PlantPayload {
  if (stamp.source === "oracle") {
    return { stamp, source: "oracle", detail: "plant snapshot" };
  }
  return { stamp, source: "digest", detail: "oracle unreachable · plant digest" };
}
