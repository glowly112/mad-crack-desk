import { createFileRoute } from "@tanstack/react-router";
import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { EmptyState } from "@/components/empty-state";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { axisDay, EMPTY } from "@/lib/lab/desk";
import {
  dayTapePnl,
  fillsOnDay,
  fmtStake,
  openFills,
  settledFills,
  tapePnl,
  type Fill,
  type FillBook,
  type FillResult,
} from "@/lib/lab/trades";
import { cn, fmtU } from "@/lib/utils";

export const Route = createFileRoute("/trades")({ component: Trades });

export function Trades() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const scope = useDayScope();
  const dayFills = fillsOnDay(stamp.trades, scope.day);
  const open = openFills(dayFills);
  const settled = settledFills(dayFills);
  const tape = dayTapePnl(settled, stamp.fuse_on);
  const live = plant.source === "oracle";
  const days = stamp.trends.map((t) => t.day);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Trades</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Open first, then the day's settled tape. Paper is not income. Live is 0 while the fuse is
          off.
        </p>
      </header>

      <DayChips days={days} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
          <LiveDot tone={live ? "ok" : "warn"} />
          {live ? `${stamp.generated} · live oracle` : plant.detail}
        </p>
        <p className="font-mono text-xs text-subtle">
          paper {tape.paper == null ? "Empty" : fmtU(tape.paper)} · production{" "}
          {tape.production == null ? "Empty" : fmtU(tape.production)} · live{" "}
          {stamp.fuse_on ? fmtU(tape.live) : "0"}
        </p>
      </div>

      <Pack
        label="Open"
        hint={scope.lookingBack ? axisDay(scope.day) : "In flight"}
        count={open.length}
        fills={open}
        fuseOn={stamp.fuse_on}
        open
      />
      <Pack
        label={scope.lookingBack ? `${axisDay(scope.day)} settled` : "Today settled"}
        hint="Won / lost / void"
        count={settled.length}
        fills={settled}
        fuseOn={stamp.fuse_on}
      />
    </div>
  );
}

function Pack({
  label,
  hint,
  count,
  fills,
  fuseOn,
  open,
}: {
  label: string;
  hint: string;
  count: number;
  fills: readonly Fill[];
  fuseOn: boolean;
  open?: boolean;
}) {
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">{label}</h2>
          <span className="font-mono text-xs text-subtle">{count}</span>
        </div>
        <p className="text-xs text-subtle">{hint}</p>
      </header>
      {fills.length === 0 ? <EmptyState copy={EMPTY} /> : <TradeTape fills={fills} fuseOn={fuseOn} open={open} />}
    </section>
  );
}

function TradeTape({
  fills,
  fuseOn,
  open,
}: {
  fills: readonly Fill[];
  fuseOn: boolean;
  open?: boolean;
}) {
  return (
    <>
      <ol className="space-y-3 sm:hidden">
        {fills.map((fill) => {
          const tape = tapePnl(fill, fuseOn);
          return (
            <li key={fill.id} className="log-in font-mono text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <span className="tabular-nums text-subtle">{fill.t}</span>
                <span className={cn("tabular-nums", pnlTone(fill.book, tape.pnl, open))}>
                  {tape.pnl == null ? "Empty" : fmtU(tape.pnl)}
                </span>
              </div>
              <p className="mt-0.5 text-fg">{fill.recipe}</p>
              <p className="mt-0.5 text-muted">
                <span>{fill.market}</span>
                {fill.side ? <span className="px-1.5">{fill.side}</span> : null}
                <span className={cn("px-1.5", bookTone(fill.book))}>{fill.book}</span>
                <span>{fmtStake(fill.stake)}</span>
                <span className={cn("px-1.5", resultTone(fill.result))}>
                  {open ? fill.flight ?? "waiting result" : fill.result}
                </span>
                {tape.caption && !open ? <span className="text-subtle">{tape.caption}</span> : null}
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
            <th className="pb-2 pr-3 font-medium">Side</th>
            <th className="pb-2 pr-3 font-medium">Book</th>
            <th className="pb-2 pr-3 text-right font-medium">Stake</th>
            <th className="pb-2 pr-3 font-medium">{open ? "Status" : "Result"}</th>
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
                <td className="py-1.5 pr-3 text-muted">{fill.side ?? "Empty"}</td>
                <td className={cn("py-1.5 pr-3", bookTone(fill.book))}>{fill.book}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{fmtStake(fill.stake)}</td>
                <td className={cn("py-1.5 pr-3", resultTone(fill.result))}>
                  {open ? fill.flight ?? "waiting result" : fill.result}
                </td>
                <td className="py-1.5 text-right">
                  <span className={cn("tabular-nums", pnlTone(fill.book, tape.pnl, open))}>
                    {tape.pnl == null ? "Empty" : fmtU(tape.pnl)}
                  </span>
                  {tape.caption && !open ? (
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

function pnlTone(book: FillBook, pnl: number | null, open?: boolean) {
  if (open || pnl == null) return "text-subtle";
  if (book === "paper" || book === "live") return "text-muted";
  if (pnl > 0) return "text-up";
  if (pnl < 0) return "text-bad";
  return "text-muted";
}
