/** Holdings detail — today's first-book Settled paper only; never freeze research as paper. */

import { bookStages, type BookStage } from "./boards.ts";
import { EMPTY } from "./desk.ts";
import {
  officeHoleLabel,
  officePaperCounts,
  officePaperTotals,
  type OfficeBookInput,
} from "./office-display.ts";
import { fmtWinLoseCounts } from "./trades.ts";
import type { Recipe } from "./stamp.ts";

export type HoldingBookContext = OfficeBookInput;

function fmtPnlU(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}u`;
}

/** Plain hole mark for the holdings title — country × window × market. */
export function holdingHoleTitle(recipe: Recipe): string {
  return officeHoleLabel(recipe);
}

/** Today's Settled tape for this skin — same gate as Office / Trades. */
export function holdingPaperSettled(recipe: Recipe, ctx: HoldingBookContext) {
  const totals = officePaperTotals(ctx);
  const counts = officePaperCounts(ctx);
  const u = totals.get(recipe.id);
  const c = counts.get(recipe.id) ?? null;
  if (u == null || !c) return null;
  const countsLine = fmtWinLoseCounts(c);
  if (countsLine === EMPTY) return null;
  return {
    u,
    counts: c,
    countsLine,
    line: `${countsLine} · ${fmtPnlU(u)}`,
  };
}

/** Invent → paper → holdout → production → live. Paper from today's Settled, not freezePnl. */
export function bookStagesForHolding(recipe: Recipe, ctx: HoldingBookContext): BookStage[] {
  const settled = holdingPaperSettled(recipe, ctx);
  return bookStages(recipe).map((s) => {
    if (s.key === "paper") {
      if (!settled) {
        return { ...s, kind: "empty", n: null, u: null, mark: EMPTY };
      }
      return {
        ...s,
        kind: "same",
        n: null,
        u: settled.u,
        mark: settled.line,
      };
    }
    if (s.key === "production" || s.key === "live") {
      return { ...s, kind: "empty", n: null, u: null, mark: EMPTY };
    }
    return s;
  });
}

export function holdingStageValue(stage: BookStage): string {
  if (stage.kind === "empty") return EMPTY;
  if (stage.kind === "split") return stage.mark;
  if (stage.key === "paper" && stage.mark && stage.mark !== "same") return stage.mark;
  if (stage.n != null) return `n=${stage.n}`;
  return stage.mark && stage.mark !== "same" ? stage.mark : EMPTY;
}
