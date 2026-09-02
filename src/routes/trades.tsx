import { createFileRoute } from "@tanstack/react-router";
import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { EmptyState } from "@/components/empty-state";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { axisDay, EMPTY } from "@/lib/lab/desk";
import {
  bookBadge,
  dayTapePnl,
  fillsOnDay,
  fmtOdds,
  fmtStake,
  openFills,
  settledFills,
  tapePnl,
  waitOpenChips,
  type Fill,
  type FillBook,
  type FillResult,
  type WaitOpen,
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
  const chips = scope.lookingBack ? [] : waitOpenChips(stamp.wait_open ?? [], open);
  const tape = dayTapePnl(settled, stamp.fuse_on);
  const live = plant.source === "oracle";
  const days = stamp.trends.map((t) => t.day);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Trades</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Open first — booked tickets still in flight, then recipes waiting for races. Then the
          day's settled tape. Paper is not income. Live is 0 while the fuse is off.
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
        chips={chips}
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
  chips,
  fuseOn,
  open,
}: {
  label: string;
  hint: string;
  count: number;
  fills: readonly Fill[];
  chips?: readonly WaitOpen[];
  fuseOn: boolean;
  open?: boolean;
}) {
  const vacant = fills.length === 0 && (chips?.length ?? 0) === 0;
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-medium">{label}</h2>
          <span className="font-mono text-xs text-subtle">{count}</span>
        </div>
        <p className="text-xs text-subtle">{hint}</p>
      </header>
      {chips && chips.length > 0 ? <WaitOpenRow chips={chips} /> : null}
      {vacant ? <EmptyState copy={EMPTY} /> : fills.length ? <TradeTape fills={fills} fuseOn={fuseOn} open={open} /> : null}
    </section>
  );
}

function WaitOpenRow({ chips }: { chips: readonly WaitOpen[] }) {
  return (
    <ul className="mb-3 space-y-2">
      {chips.map((chip) => (
        <li key={chip.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className="text-sm text-fg">{chip.title}</p>
          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-warn">
            waiting for races
          </span>
          {chip.why ? <span className="font-mono text-[10px] text-subtle">{chip.why}</span> : null}
        </li>
      ))}
    </ul>
  );
}

function BookMark({ book }: { book: FillBook }) {
  const badge = bookBadge(book);
  return (
    <span className={cn(bookTone(book))}>
      {book}
      {badge ? <span className="text-subtle"> · {badge}</span> : null}
    </span>
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
                {fill.side ? <span>{fill.side}</span> : null}
                <span className="px-1.5">{fmtOdds(fill.odds)}</span>
                <span>{fmtStake(fill.stake)}</span>
                <span className="px-1.5">
                  <BookMark book={fill.book} />
                </span>
                {fill.liquidity != null ? (
                  <span className="text-subtle">liq {fmtStake(fill.liquidity)}</span>
                ) : null}
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
            <th className="pb-2 pr-3 font-medium">Booked</th>
            <th className="pb-2 pr-3 font-medium">Recipe</th>
            <th className="pb-2 pr-3 font-medium">Side</th>
            <th className="pb-2 pr-3 font-medium">Odds</th>
            <th className="pb-2 pr-3 text-right font-medium">Stake</th>
            <th className="pb-2 pr-3 font-medium">Book</th>
            {open ? <th className="pb-2 pr-3 font-medium">Liquidity</th> : null}
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
                <td className="py-1.5 pr-3 text-muted">{fill.side ?? "Empty"}</td>
                <td className="py-1.5 pr-3 tabular-nums text-muted">{fmtOdds(fill.odds)}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-muted">{fmtStake(fill.stake)}</td>
                <td className="py-1.5 pr-3">
                  <BookMark book={fill.book} />
                </td>
                {open ? (
                  <td className="py-1.5 pr-3 tabular-nums text-subtle">
                    {fill.liquidity == null ? "Empty" : fmtStake(fill.liquidity)}
                  </td>
                ) : null}
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
