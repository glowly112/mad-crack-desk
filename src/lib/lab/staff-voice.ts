/** Ordinary-English staff bubbles. Stamp facts only. Never invents P&L. */

import { EMPTY, hopMoves, bookDisplayName } from "./desk.ts";
import { scrubMillWatchingLine, isMillArchivePoison } from "./mill-ingest.ts";
import { ukHopAt } from "./uk-time.ts";
import { isBoardResetView } from "./board-reset.ts";
import { bookStages, bookLabel, holeName, staffBookFacts, staffLine, type StaffWatchStamp } from "./boards.ts";
import { millActivity, fillTradeName } from "./trades.ts";
import type { Move, Recipe, Seat } from "./stamp.ts";
import { fmtU } from "../utils.ts";
import type { LockedStaffId } from "./staff-seats.ts";

export type SeatBubble = {
  text: string;
  at?: string;
  older?: boolean;
};

const JARGON =
  /\bGB WIN\b|freeze fuel|\bKEEP\b|\bcousin\b|\bdensify\b|size_ok|\bn=|LIVE_CANDIDATE|holdout_fill_adj|\bmill\b|\bhole\b/i;

export function hasJargon(text: string): boolean {
  return JARGON.test(text);
}

/** Same short mark Staff, Office and Floor use. Never a paragraph, never H-fast-…. */
export function speakBook(raw: string, recipe?: { id: string; title: string; hunterName?: string | null }): string {
  if (recipe) {
    const mark = bookDisplayName({ title: recipe.title, id: recipe.id, hunterName: recipe.hunterName });
    return mark;
  }
  return bookDisplayName({ title: raw, id: raw });
}

/** Same mark — a look, not a hole. */
export function speakLook(raw: string): string {
  return holeName(raw);
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function paperLine(recipe: Recipe | null): string {
  if (!recipe || !Number.isFinite(recipe.freezePnl)) return "";
  const book = speakBook(recipe.title, recipe);
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
      (seatId === "holdout" && dead) ||
      (seatId === "auditor" && dead) ||
      (seatId === "auditor" && (certified || parked)) ||
      (seatId === "mill-watch" && (certified || parked));
    if (mine) out.push({ text, at: ukHopAt(m.at) || m.at, older: true });
  }
  return out;
}

function resetNowBubbles(seatId: LockedStaffId): string[] {
  switch (seatId) {
    case "auditor":
      return ["The square is empty. Paper is Empty.", "Nothing certified is on today's tape."];
    case "holdout":
      return ["Watching the empty square.", "Old kills stay in the archive — not on the morning board."];
    case "mill-watch":
      return ["Nothing certified is on today's tape.", "The board reset — we start from empty holes."];
    case "invent":
      return ["Invent is on.", "We are hunting empty holes, not replaying yesterday's tape."];
    case "wiki":
      return ["Race files stay on disk.", "Today's board is Empty."];
    default:
      return ["Watching the empty square."];
  }
}

function settleWord(result: string): string {
  if (result === "won") return "won";
  if (result === "lost") return "lost";
  if (result === "void") return "void";
  return "settled";
}

/** Mill tickets on the same tape as Trades — not empty-hole overlay when fills exist. */
function millSeatLines(seatId: string, stamp: StaffWatchStamp): string[] {
  const day = stamp.day ?? "";
  const recipes = stamp.recipes ?? [];
  const act = millActivity({ day, trades: stamp.trades ?? [], recipes });
  if (act.openCount === 0 && act.settledToday.length === 0) return [];

  const lastOpenName = act.lastOpen ? fillTradeName(act.lastOpen, recipes) : "";
  const lastSettleName = act.lastSettled ? fillTradeName(act.lastSettled, recipes) : "";
  const openLine =
    act.openCount > 0
      ? `${act.openCount} open on the mill — paper only, fuse off.`
      : "";
  const settleLine =
    act.lastSettled
      ? `Last settle: ${lastSettleName} ${settleWord(act.lastSettled.result)}${act.lastSettled.pnl != null ? ` ${fmtU(act.lastSettled.pnl)}` : ""}.`
      : "";
  const bookLine = act.lastOpen
    ? `Last book: ${lastOpenName} at ${act.lastOpen.t || "—"}.`
    : "";
  const paperLine =
    act.paperDayU != null ? `Today's settled paper is ${fmtU(act.paperDayU)}.` : "";

  switch (seatId) {
    case "auditor":
      return [bookLine, openLine, settleLine].filter(Boolean);
    case "holdout":
      return [
        act.openCount > 0 ? `Paper is booking — ${act.openCount} open tickets.` : "",
        paperLine,
        act.lastSettled && act.lastSettled.result === "lost"
          ? `${lastSettleName} lost ${act.lastSettled.pnl != null ? fmtU(act.lastSettled.pnl) : "money"} on paper.`
          : "",
      ].filter(Boolean);
    case "wiki":
      return act.openCount > 0 || act.settledToday.length > 0
        ? ["Race files are in.", bookLine || settleLine || openLine].filter(Boolean)
        : [];
    case "mill-watch":
      return [
        act.openCount > 0
          ? `${act.openCount} armed tickets on the mill — paper, not live.`
          : "",
        paperLine,
      ].filter(Boolean);
    case "invent":
      return [];
    default:
      return [bookLine, openLine].filter(Boolean);
  }
}

function nowBubbles(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string[] {
  if (isBoardResetView(stamp)) return resetNowBubbles(seat.id as LockedStaffId);
  const mill = millSeatLines(seat.id, stamp);
  const tape = tapeSeatLines(seat, stamp);
  if (mill.length) return [...mill, ...tape];
  return tape;
}

function tapeSeatLines(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string[] {
  const f = staffBookFacts(seat.now ?? "", stamp);
  const britain = f.tape ? speakBook(f.tape.title, f.tape) : "";
  switch (seat.id) {
    case "invent": {
      const inventWhy = stamp.office?.inventWhy ?? "";
      const emptyHoleHunt = /empty-hole hunt|invent_empty/i.test(inventWhy);
      const look = f.inventCell !== EMPTY ? f.inventCell : "";
      if (emptyHoleHunt) {
        const millMode = String((stamp as { mill_mode?: string }).mill_mode ?? "").toLowerCase();
        const parked = millMode === "parked" || /mill parked/i.test(inventWhy);
        return [
          look ? `Next empty hole: ${look}.` : "Invent is on.",
          parked
            ? "Mill parked — empty-hole fast-arm hunt on the square."
            : "Empty-hole fast-arm hunt — not densifying the tape.",
        ].filter(Boolean);
      }
      const idea = look ? speakBook(f.inventCell) : "";
      if (!look && !stamp.office?.invent) return [];
      return [
        idea ? `Next empty market to look at: ${idea}.` : stamp.office?.invent ? "Invent is on." : "",
      ].filter(Boolean);
    }
    case "holdout":
      return f.tapeName
        ? ["Scoring paper on the books.", "Not inventing new skins."]
        : [];
    case "auditor": {
      const trial = f.hydeTrials[0];
      if (trial) {
        const fade = /steam|fade/i.test(`${trial.why} ${trial.id} ${seat.now}`);
        return [
          fade
            ? "Parked tweak (fade the steam, one pick) — not on today's tape."
            : "Parked tweak — different horses, not on today's tape.",
          britain
            ? `That's different horses, not ${britain} coming back.`
            : "That's different horses, not the tape recipe coming back.",
        ];
      }
      if (!f.tape && !f.holdBook && f.fillAdjKills.length === 0) {
        if (actOpenCount(stamp) > 0) {
          return [
            "Nothing certified is on today's tape.",
            `Measuring books are booking — ${actOpenCount(stamp)} open paper tickets.`,
          ];
        }
        return [];
      }
      const stages = f.tape ? bookStages(f.tape) : [];
      const same = stages.length > 0 && stages.filter((s) => s.key !== "live").every((s) => s.kind !== "split");
      const fill = f.fillAdjKills[0];
      const fillBook = fill ? bookLabel(fill.recipe, f.recipes) : "";
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
    case "mill-watch": {
      const trial = f.trial ? speakBook(f.trial.title, f.trial) : "";
      const parked = f.parked[0] ? speakBook(f.parked[0].title, f.parked[0]) : "";
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
    case "wiki":
      if (!f.tapeName) return [];
      return ["Today's race files are in.", "Nothing missing to score."];
    default:
      return [];
  }
}

function actOpenCount(stamp: StaffWatchStamp): number {
  return millActivity({
    day: stamp.day ?? "",
    trades: stamp.trades ?? [],
    recipes: stamp.recipes ?? [],
  }).openCount;
}

/** Chat bubbles for one seat. Older hops first. Empty seat → []. */
export function seatBubbles(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): SeatBubble[] {
  const older = olderFor(seat.id, stamp);
  const now = nowBubbles(seat, stamp).map((text) => ({ text }));
  return [...older, ...now];
}

export function seatPreview(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string {
  const now = seatBubbles(seat, stamp).filter((b) => !b.older);
  if (now[0]?.text) return now[0].text;
  const cleaned = scrubMillWatchingLine(seat.now ?? "");
  if (cleaned === EMPTY || isMillArchivePoison(cleaned)) {
    const mill = millSeatLines(seat.id, stamp);
    if (mill[0]) return mill[0];
    return EMPTY;
  }
  const watching = staffLine(cleaned, stamp.recipes ?? []);
  if (watching !== EMPTY) return watching;
  const older = seatBubbles(seat, stamp).filter((b) => b.older);
  return older[older.length - 1]?.text ?? EMPTY;
}

/** Recent recipe hops for Staff — people lines, not Empty chrome. */
export function staffPeopleHops(stamp: StaffWatchStamp): SeatBubble[] {
  const hops = hopMoves(stamp.moves ?? []);
  const out: SeatBubble[] = [];
  for (const m of hops) {
    const text = hopVoice(m);
    if (!text) continue;
    const dead = /dead/i.test(m.to);
    const certified = /certified|solid/i.test(m.to);
    const parked = /parked|research keep/i.test(m.to);
    const who =
      dead
        ? "Holdout · Auditor"
        : certified || parked
          ? "Auditor · Night + mill watch"
          : "Staff";
    out.push({ text: `${who}: ${text}`, at: ukHopAt(m.at) || m.at, older: true });
  }
  return out;
}
