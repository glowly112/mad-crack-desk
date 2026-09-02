import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { EMPTY } from "@/lib/lab/desk";
import { fmtStake, tapePnl, tradeCounts, type Fill, type FillBook, type FillResult } from "@/lib/lab/trades";
import { cn, fmtGbp } from "@/lib/utils";

export const Route = createFileRoute("/trades")({ component: Trades });

export function Trades() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const fills = stamp.trades;
  const counts = tradeCounts(fills);
  const live = plant.source === "oracle";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Trades</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Fills as they land. Paper is not income. Live is 0 while the fuse is off.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
          <LiveDot tone={live ? "ok" : "warn"} />
          {live ? `${stamp.generated} · live oracle` : plant.detail}
        </p>
        <p className="font-mono text-xs text-subtle">
          paper {counts.paper || "Empty"} · production {counts.production || "Empty"} · live{" "}
          {counts.live}
        </p>
      </div>

      {fills.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <TradeTape fills={fills} fuseOn={stamp.fuse_on} />
      )}
    </div>
  );
}

function TradeTape({ fills, fuseOn }: { fills: readonly Fill[]; fuseOn: boolean }) {
  return (
    <>
      <ol className="space-y-3 sm:hidden">
        {fills.map((fill) => {
          const tape = tapePnl(fill, fuseOn);
          return (
            <li key={fill.id} className="log-in font-mono text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <span className="tabular-nums text-subtle">{fill.t}</span>
                <span className={cn("tabular-nums", pnlTone(fill.book, tape.pnl))}>
                  {tape.pnl == null ? "Empty" : fmtGbp(tape.pnl)}
                </span>
              </div>
              <p className="mt-0.5 text-fg">{fill.recipe}</p>
              <p className="mt-0.5 text-muted">
                <span>{fill.market}</span>
                <span className={cn("px-1.5", bookTone(fill.book))}>{fill.book}</span>
                <span>{fmtStake(fill.stake)}</span>
                <span className={cn("px-1.5", resultTone(fill.result))}>{fill.result}</span>
                {tape.caption ? <span className="text-subtle">{tape.caption}</span> : null}
              </p>
            </li>
          );
        })}
      </ol>
      <table className="hidden w-full border-collapse text-left sm:table">
        <thead>
          <tr className="font-mono text-[10px] uppercase tracking-wide text-subtle">
            <th className="pb-2 pr-3 font-medium">Time</th>
            <th className="pb-2 pr-3 font-medium">Recipe</th>
            <th className="pb-2 pr-3 font-medium">Market</th>
            <th className="pb-2 pr-3 font-medium">Book</th>
            <th className="pb-2 pr-3 text-right font-medium">Stake</th>
            <th className="pb-2 pr-3 font-medium">Result</th>
            <th className="pb-2 text-right font-medium">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {fills.map((fill) => {
            const tape = tapePnl(fill, fuseOn);
            return (
              <tr key={fill.id} className="log-in font-mono text-xs">
                <td className="py-1.5 pr-3 tabular-nums text-subtle">{fill.t}</td>
                <td className="py-1.5 pr-3 text-fg">{fill.recipe}</td>
                <td className="py-1.5 pr-3 text-muted">{fill.market}</td>
                <td className={cn("py-1.5 pr-3", bookTone(fill.book))}>{fill.book}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{fmtStake(fill.stake)}</td>
                <td className={cn("py-1.5 pr-3", resultTone(fill.result))}>{fill.result}</td>
                <td className="py-1.5 text-right">
                  <span className={cn("tabular-nums", pnlTone(fill.book, tape.pnl))}>
                    {tape.pnl == null ? "Empty" : fmtGbp(tape.pnl)}
                  </span>
                  {tape.caption ? (
                    <span className="mt-0.5 block text-[10px] text-subtle">{tape.caption}</span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function bookTone(book: FillBook) {
  if (book === "live") return "text-warn";
  if (book === "production") return "text-fg";
  return "text-subtle";
}

function resultTone(result: FillResult) {
  if (result === "won") return "text-up";
  if (result === "lost") return "text-bad";
  if (result === "waiting") return "text-warn";
  return "text-subtle";
}

function pnlTone(book: FillBook, pnl: number | null) {
  if (book === "paper" || book === "live") return "text-muted";
  if (pnl == null) return "text-subtle";
  if (pnl > 0) return "text-up";
  if (pnl < 0) return "text-bad";
  return "text-muted";
}
