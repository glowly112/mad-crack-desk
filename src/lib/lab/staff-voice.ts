/** Ordinary-English staff bubbles. Stamp facts only. Never invents P&L. */

import { EMPTY, cellName, hopMoves } from "./desk.ts";
import { bookStages, staffBookFacts, type StaffWatchStamp } from "./boards.ts";
import type { Move, Recipe, Seat } from "./stamp.ts";

export type SeatBubble = {
  text: string;
  at?: string;
  older?: boolean;
};

const LAND: Record<string, string> = {
  AU: "Australia",
  GB: "Britain",
  IE: "Ireland",
  US: "the United States",
  NZ: "New Zealand",
  ZA: "South Africa",
  HK: "Hong Kong",
  FR: "France",
};

const REGIONS = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;

const JARGON =
  /\bGB WIN\b|freeze fuel|\bKEEP\b|\bcousin\b|\bdensify\b|size_ok|\bn=|LIVE_CANDIDATE|holdout_fill_adj|\bmill\b|\bhole\b/i;

export function hasJargon(text: string): boolean {
  return JARGON.test(text);
}

function land(code: string): string {
  return LAND[code] ?? code;
}

function windowBit(named: string): "near-off" | "late-pre" | "morning" | "in-play" | "" {
  if (/near-?off/.test(named)) return "near-off";
  if (/late-?pre/.test(named)) return "late-pre";
  if (/morning/.test(named)) return "morning";
  if (/in-?play/.test(named)) return "in-play";
  return "";
}

function regionOf(named: string): string {
  const code = REGIONS.find((r) => new RegExp(`\\b${r}\\b`, "i").test(named));
  if (code) return code;
  const lower = named.toLowerCase();
  if (lower.includes("south africa")) return "ZA";
  if (lower.includes("britain") || lower.includes("united kingdom")) return "GB";
  if (lower.includes("australia")) return "AU";
  if (lower.includes("ireland")) return "IE";
  if (lower.includes("united states") || lower.includes("america")) return "US";
  if (lower.includes("new zealand")) return "NZ";
  if (lower.includes("hong kong")) return "HK";
  if (lower.includes("france")) return "FR";
  return "";
}

/** Britain winner just-before-off — never a raw GB WIN. */
export function speakBook(raw: string): string {
  const slug = raw.replace(/\|/g, " ");
  const named = cellName(slug);
  const region = regionOf(slug) || regionOf(named);
  const country = region ? land(region) : "";
  const place = /place/i.test(named);
  const win = /win/i.test(named) && !place;
  const w = windowBit(named.toLowerCase());
  if (region === "GB" && w === "near-off" && win) {
    return "the Britain recipe that bets the winner just before the off";
  }
  if (place && w === "near-off") return `${country} place just before the off`;
  if (place && w === "in-play") return `${country} place while the race is on`;
  if (place && w === "morning") return `${country} morning place`;
  if (place && w === "late-pre") return `${country} late-afternoon place`;
  if (place) return `${country} place`.trim();
  if (win && w === "morning") return `a ${country} morning winner idea`;
  if (win && w === "late-pre") return `an ${country} late-afternoon winner idea`;
  if (win && w === "near-off") return `a ${country} winner idea for races about to start`;
  if (win && w === "in-play") return `a ${country} winner idea while the race is on`;
  if (win && country) return `a ${country} winner idea`;
  return country ? `${country} market` : named && named !== EMPTY ? named : "";
}

/** South Africa, morning, winner — a look, not a hole. */
export function speakLook(raw: string): string {
  const slug = raw.replace(/\|/g, " ");
  const named = cellName(slug);
  const region = regionOf(slug) || regionOf(named);
  const country = region ? land(region) : "";
  const place = /place/i.test(named);
  const w = windowBit(named.toLowerCase());
  const when =
    w === "near-off" ? "just before the off" : w === "late-pre" ? "late afternoon" : w === "in-play" ? "in running" : w;
  const market = place ? "place" : "winner";
  return [country, when, market].filter(Boolean).join(", ");
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paperLine(recipe: Recipe | null): string {
  if (!recipe || !Number.isFinite(recipe.freezePnl)) return "";
  const book = speakBook(recipe.title);
  if (recipe.freezePnl > 0) return `${cap(book)} made money on old races.`;
  if (recipe.freezePnl < 0) return `${cap(book)} lost money on old races.`;
  return "";
}

export function hopVoice(move: Move): string {
  const book = speakBook(move.recipe);
  if (!book) return "";
  if (/dead/i.test(move.to) && /fill-adj/i.test(move.why)) {
    return `${cap(book)} died because later races of those same bets lost money after costs.`;
  }
  if (/certified|solid/i.test(move.to)) {
    return `${cap(book)} was marked ready for today's tape.`;
  }
  if (/research keep|parked/i.test(move.to)) {
    return `${cap(book)} was parked. It is not on today's tape.`;
  }
  return "";
}

function olderFor(seatId: string, stamp: StaffWatchStamp): SeatBubble[] {
  const hops = hopMoves(stamp.moves ?? []);
  const out: SeatBubble[] = [];
  for (const m of hops) {
    const text = hopVoice(m);
    if (!text) continue;
    const dead = /dead/i.test(m.to);
    const certified = /certified|solid/i.test(m.to);
    const parked = /parked|research keep/i.test(m.to);
    const mine =
      (seatId === "virchow" && dead) ||
      (seatId === "clerk" && dead) ||
      (seatId === "hyde" && (certified || parked)) ||
      (seatId === "foreman" && (certified || parked));
    if (mine) out.push({ text, at: m.at, older: true });
  }
  return out;
}

function nowBubbles(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string[] {
  const f = staffBookFacts(seat.now ?? "", stamp);
  const britain = f.tape ? speakBook(f.tape.title) : "";
  switch (seat.id) {
    case "bauron": {
      const look = f.inventCell !== EMPTY ? speakLook(f.inventCell) : "";
      const idea = f.inventCell !== EMPTY ? speakBook(f.inventCell) : "";
      if (!look && !f.densify && !stamp.office?.invent) return [];
      return [
        idea ? `I'm writing ${idea}.` : stamp.office?.invent ? "I'm writing a new winner idea." : "",
        f.densify ? "New market, not a patch on Britain." : "",
      ].filter(Boolean);
    }
    case "igor":
      return f.tapeName
        ? ["I'm scoring the paper bets already on the books.", "Not inventing."]
        : [];
    case "hyde": {
      const trial = f.hydeTrials[0];
      if (trial) {
        const fade = /steam|fade/i.test(`${trial.why} ${trial.id} ${seat.now}`);
        return [
          fade
            ? "I wrote a tweak (fade the steam, one pick)."
            : "I wrote a tweak — one pick, different horses.",
          britain
            ? `That's different horses, not ${britain} coming back.`
            : "That's different horses, not the tape recipe coming back.",
        ];
      }
      if (!britain) return [];
      return [
        `I have not written a tweak of ${britain}.`,
        "The one on the tape is still the original horses.",
      ];
    }
    case "clerk": {
      if (!f.tape && !f.holdBook && f.fillAdjKills.length === 0) return [];
      const stages = f.tape ? bookStages(f.tape) : [];
      const same = stages.length > 0 && stages.filter((s) => s.key !== "live").every((s) => s.kind !== "split");
      const fill = f.fillAdjKills[0];
      const fillBook = fill ? speakBook(fill.recipe) : "";
      const lines = [
        paperLine(f.tape),
        britain && same
          ? `The same bets on later races stayed that recipe, so it is still on today's tape.`
          : britain
            ? `Later races of those same bets are not proven as the same horses.`
            : "",
        stages.find((s) => s.key === "live")?.kind === "empty" ? "Nothing is running for real." : "",
        fillBook
          ? `${cap(fillBook)} came off the tape because later races of those same bets lost money after costs.`
          : "",
        britain ? `A later tweak with different horses is not ${britain}.` : "",
      ];
      return lines.filter(Boolean);
    }
    case "foreman": {
      const trial = f.trial ? speakBook(f.trial.title) : "";
      const parked = f.parked[0] ? speakBook(f.parked[0].title) : "";
      if (!britain && !trial && !parked) return [];
      return [
        britain
          ? `${cap(britain)} is on today's tape.`
          : "Nothing certified is on today's tape.",
        trial && trial !== britain ? `What's being tried is ${trial}.` : "",
        !trial && parked && parked !== britain ? `${cap(parked)} is parked, not on today's tape.` : "",
        "Don't mix them.",
      ].filter(Boolean);
    }
    case "virchow": {
      const kill = f.fillAdjKills[0] ?? (stamp.moves ?? []).find((m) => /dead/i.test(m.to));
      if (!kill) return [];
      return [
        `${cap(speakBook(kill.recipe))} died because later races of those same bets lost money after costs.`,
        "Don't copy it.",
      ];
    }
    case "mercator": {
      const raw = f.inventCell !== EMPTY ? f.inventCell : "";
      if (!raw) return [];
      return [`Next empty market to look at: ${speakLook(raw)}.`];
    }
    case "curator":
      if (!f.tapeName) return [];
      return ["Today's British race files are in.", "Nothing missing to score."];
    default:
      return [];
  }
}

/** Chat bubbles for one seat. Older hops first. Empty seat → []. */
export function seatBubbles(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): SeatBubble[] {
  const older = olderFor(seat.id, stamp);
  const now = nowBubbles(seat, stamp).map((text) => ({ text }));
  return [...older, ...now];
}

export function seatPreview(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string {
  const now = seatBubbles(seat, stamp).filter((b) => !b.older);
  return now[0]?.text || EMPTY;
}
