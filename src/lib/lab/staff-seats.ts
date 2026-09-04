/** Locked Staff roster — display only. Oracle plant seats map in behind the scenes. */

import type { Seat } from "./stamp.ts";

export type LockedStaffId = "invent" | "holdout" | "auditor" | "mill-watch" | "wiki";

export const LOCKED_STAFF_ORDER: readonly LockedStaffId[] = [
  "invent",
  "holdout",
  "auditor",
  "mill-watch",
  "wiki",
];

const LOCKED_META: Record<LockedStaffId, { name: string; role: string; cadence: string }> = {
  invent: { name: "Invent", role: "Empty-hole hunt · new skins", cadence: "tick" },
  holdout: { name: "Holdout", role: "Later-race proof · fill-adj", cadence: "shift" },
  auditor: { name: "Auditor", role: "Money truth · tape", cadence: "tick" },
  "mill-watch": { name: "Night + mill watch", role: "Shift · armed tickets", cadence: "shift" },
  wiki: { name: "Wiki", role: "Race files · freeze index", cadence: "cron" },
};

/** Legacy oracle seat ids folded into each locked Staff seat. */
export const LEGACY_SEATS_BY_LOCKED: Record<LockedStaffId, readonly string[]> = {
  invent: ["bauron", "mercator"],
  holdout: ["igor", "virchow"],
  auditor: ["clerk", "hyde"],
  "mill-watch": ["foreman"],
  wiki: ["curator"],
};

/** Portrait files still live under legacy ids on disk. */
export const STAFF_PORTRAIT_ID: Record<LockedStaffId, string> = {
  invent: "bauron",
  holdout: "igor",
  auditor: "clerk",
  "mill-watch": "foreman",
  wiki: "curator",
};

export function isLockedStaffId(id: string): id is LockedStaffId {
  return (LOCKED_STAFF_ORDER as readonly string[]).includes(id);
}

/** Staff screen roster — locked seats only, not the raw plant digest list. */
export function staffSeats(stamp: { seats: readonly Pick<import("./stamp.ts").Seat, "id" | "now" | "status">[] }): Seat[] {
  return LOCKED_STAFF_ORDER.map((id) => {
    const meta = LOCKED_META[id];
    const legacy = LEGACY_SEATS_BY_LOCKED[id]
      .map((lid) => stamp.seats.find((s) => s.id === lid))
      .filter((s): s is Seat => Boolean(s));
    const status =
      legacy.find((s) => s.status && s.status !== "IDLE")?.status ?? legacy[0]?.status ?? "GREEN";
    const now = legacy.map((s) => s.now?.trim()).filter(Boolean).join(" · ");
    return {
      id,
      name: meta.name,
      role: meta.role,
      status,
      now,
      cadence: meta.cadence,
    };
  });
}
