import digest from "./digest.json" with { type: "json" };
import liveSnap from "./live-snapshot.json" with { type: "json" };
import { applyDigest, type Digest, type LiveStamp } from "./from-digest.ts";
import { applySnapshot } from "./from-snapshot.ts";
import { scrubDigestStampArchive } from "./mill-ingest.ts";
import { STAMP } from "./stamp.ts";

export type PlantPayload = {
  stamp: LiveStamp;
  source: "oracle" | "digest" | "freeze";
  detail: string;
};

export function digestStamp(): LiveStamp {
  return scrubDigestStampArchive(applyDigest(digest as Digest, STAMP));
}

export function bootStamp(): LiveStamp {
  const live = applySnapshot(liveSnap, digestStamp());
  // Baked file is a snapshot, not a live poll — never pretend it is oracle.
  return { ...live, source: "freeze" };
}

export function plantFromTape(stamp: LiveStamp): PlantPayload {
  if (stamp.source === "oracle") {
    return { stamp, source: "oracle", detail: "plant snapshot" };
  }
  if (stamp.source === "freeze") {
    return { stamp, source: "freeze", detail: `oracle unreachable · frozen ${stamp.generated}` };
  }
  return { stamp, source: "digest", detail: "oracle unreachable · plant digest" };
}
