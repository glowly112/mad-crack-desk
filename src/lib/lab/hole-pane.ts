/** Empty-hole pane facts for Floor clicks. Stamp facts only — Empty is Empty. */

import {
  holeName,
  inventHole,
  isEmptyHoleHuntBoard,
  plantInventQueue,
  SQUARE_WINDOW_LABEL,
  type HoleCell,
} from "./boards.ts";
import { EMPTY, eholeRunSuffix, strategyMark } from "./desk.ts";
import { recipeDisplayHoleKey } from "./mill-display.ts";
import { tradesWaitChips } from "./trades.ts";
import type { Fill, Recipe, WaitOpen } from "./stamp.ts";

export type EmptyHoleInvent = "waiting" | "hunting" | "parked";

export type EmptyHolePane = {
  holeKey: string;
  title: string;
  market: string;
  state: "Empty";
  invent: EmptyHoleInvent;
  skin: string;
  prefer: string;
  distrust: string;
};

export type HolePaneStamp = {
  office?: { invent?: boolean; inventWhy?: string };
  hunters?: readonly { id: string; note: string }[];
  mill_mode?: string;
  wait_open?: readonly WaitOpen[];
  trades?: readonly Fill[];
  recipes?: readonly Recipe[];
  hole_skills?: Readonly<Record<string, { prefer?: string[]; distrust?: string[] }>>;
};

const HUNTER_LABEL: Record<string, string> = {
  card: "Card",
  steam: "Steam",
  residual: "Residual",
  geo: "Geo",
  docbrown: "Doc Brown",
  lens: "Lens",
  mercator: "Mercator",
  bauron: "Bauron",
};

function holeKeyParts(key: string): { region: string; window: string; market: string } | null {
  const [region, window, market] = key.split("|");
  if (!region || !window || !market) return null;
  return { region, window, market };
}

function noteMentionsHole(note: string, holeKey: string): boolean {
  const parts = holeKeyParts(holeKey);
  if (!parts) return false;
  const n = note.toLowerCase();
  const wlabel = SQUARE_WINDOW_LABEL[parts.window as keyof typeof SQUARE_WINDOW_LABEL] ?? parts.window;
  const regionRe = new RegExp(`\\b${parts.region}\\b`, "i");
  const windowRe = new RegExp(wlabel.replace(/-/g, "[\\s_-]*"), "i");
  const marketRe = parts.market === "PLACE" ? /\bplace\b/i : /\bwin(?:ner)?\b/i;
  if (note.includes(holeKey.replace(/\|/g, "|"))) return true;
  if (note.includes(holeKey)) return true;
  return regionRe.test(note) && windowRe.test(note) && marketRe.test(note);
}

function skinLabelForRecipe(id: string, title: string): string {
  const run = eholeRunSuffix(id);
  if (run) return `ehole · ${run}`;
  const mark = strategyMark(title, id);
  if (mark && mark !== EMPTY && !mark.includes(id)) return mark;
  const short = id.replace(/^H-ehole-/i, "").replace(/^H-/i, "");
  return short || EMPTY;
}

function inventStatus(holeKey: string, stamp: HolePaneStamp): EmptyHoleInvent {
  const why = stamp.office?.inventWhy?.trim() ?? "";
  const millMode = String(stamp.mill_mode ?? "").toLowerCase();
  if (millMode === "parked" || /mill parked/i.test(why)) return "parked";
  const huntBoard = isEmptyHoleHuntBoard(why) || stamp.office?.invent === true;
  if (!huntBoard) return "waiting";
  const queue = plantInventQueue("", why, stamp.hunters ?? []);
  const queued = inventHole(why);
  const targets = [queue, queued].filter((t) => t && t !== EMPTY);
  for (const t of targets) {
    const named = holeName(t);
    const title = holeName(holeKey);
    if (named === title || t.includes(holeKey) || noteMentionsHole(t, holeKey)) return "hunting";
  }
  for (const h of stamp.hunters ?? []) {
    if (noteMentionsHole(h.note, holeKey) && /queue|next hole|hunt/i.test(h.note)) return "hunting";
  }
  return "waiting";
}

function waitingSkin(holeKey: string, stamp: HolePaneStamp): string {
  const open = (stamp.trades ?? []).filter((f) => f.result === "waiting");
  const chips = tradesWaitChips(stamp.recipes ?? [], stamp.wait_open ?? [], open);
  for (const chip of chips) {
    const key = recipeDisplayHoleKey({ id: chip.id, title: chip.title }) ?? chip.id;
    if (key === holeKey) return skinLabelForRecipe(chip.id, chip.title);
  }
  for (const r of stamp.recipes ?? []) {
    const key = recipeDisplayHoleKey(r);
    if (key !== holeKey) continue;
    if (r.status === "HUNTING" || r.status === "MEASURING") {
      return skinLabelForRecipe(r.id, r.title);
    }
  }
  return EMPTY;
}

function skillsForHole(holeKey: string, stamp: HolePaneStamp): { prefer: string; distrust: string } {
  const stamped = stamp.hole_skills?.[holeKey];
  if (stamped) {
    const prefer = (stamped.prefer ?? []).filter(Boolean).join(", ");
    const distrust = (stamped.distrust ?? []).filter(Boolean).join(", ");
    return {
      prefer: prefer || EMPTY,
      distrust: distrust || EMPTY,
    };
  }
  const prefer: string[] = [];
  const distrust: string[] = [];
  for (const h of stamp.hunters ?? []) {
    const note = h.note ?? "";
    if (!noteMentionsHole(note, holeKey)) continue;
    const label = HUNTER_LABEL[h.id] ?? h.id;
    if (/\bprefer\b/i.test(note)) prefer.push(label);
    if (/\bdistrust\b/i.test(note)) distrust.push(label);
  }
  return {
    prefer: prefer.length ? prefer.join(", ") : EMPTY,
    distrust: distrust.length ? distrust.join(", ") : EMPTY,
  };
}

/** Facts for an Empty Floor cell — no poetry, stamp only. */
export function emptyHolePane(cell: HoleCell, stamp: HolePaneStamp): EmptyHolePane {
  const holeKey = cell.id;
  const skills = skillsForHole(holeKey, stamp);
  return {
    holeKey,
    title: holeName(holeKey),
    market: cell.market,
    state: "Empty",
    invent: inventStatus(holeKey, stamp),
    skin: waitingSkin(holeKey, stamp),
    prefer: skills.prefer,
    distrust: skills.distrust,
  };
}
