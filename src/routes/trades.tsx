import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { EmptyState } from "@/components/empty-state";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { axisDay, EMPTY } from "@/lib/lab/desk";
import { speakBook } from "@/lib/lab/staff-voice";
import {
  bookedClock,
  dayTapePnl,
  fillsOnDay,
  fmtOdds,
  fmtStake,
  openFills,
  settledFills,
  tapePnl,
  waitOpenChips,
  type Fill,
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
  const firstId = open[0]?.id ?? settled[0]?.id ?? chips[0]?.id ?? "";
  const [picked, setPicked] = useState(firstId);
  const selected = picked || firstId;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Trades</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          Open first, then the day's settled tape. Won and lost in u. Paper is not income.
        </p>
      </header>

      <DayChips days={days} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
          <LiveDot tone={live ? "ok" : "warn"} tick={stamp.generated} />
          <span key={stamp.generated} className="stamp-tick">
            {live ? `${stamp.generated} · live oracle` : plant.detail}
          </span>
        </p>
        <p className="font-mono text-xs text-subtle">
          paper {tape.paper == null ? "Empty" : fmtU(tape.paper)} · production{" "}
          {tape.production == null ? "Empty" : fmtU(tape.production)} · live{" "}
          {stamp.fuse_on ? fmtU(tape.live) : "0"}
        </p>
      </div>

      {open.length === 0 && chips.length === 0 && settled.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ol className="divide-y divide-border border-y border-border">
          {open.length ? <Divider label="Open" hint={scope.lookingBack ? axisDay(scope.day) : "Still in flight"} /> : null}
          {open.map((fill) => (
            <TradeRow
              key={`${scope.day}:${fill.id}`}
              fill={fill}
              fuseOn={stamp.fuse_on}
              open
              selected={selected === fill.id}
              onPick={() => setPicked(fill.id)}
            />
          ))}
          {chips.length ? <Divider label="Waiting for races" hint="Recipe · not a ticket" /> : null}
          {chips.map((chip) => (
            <WaitRow
              key={chip.id}
              chip={chip}
              selected={selected === chip.id}
              onPick={() => setPicked(chip.id)}
            />
          ))}
          {settled.length ? (
            <Divider
              label={scope.lookingBack ? `${axisDay(scope.day)} settled` : "Settled"}
              hint="Won / lost in u"
            />
          ) : null}
          {settled.map((fill) => (
            <TradeRow
              key={`${scope.day}:${fill.id}`}
              fill={fill}
              fuseOn={stamp.fuse_on}
              selected={selected === fill.id}
              onPick={() => setPicked(fill.id)}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function Divider({ label, hint }: { label: string; hint: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 bg-bg py-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-subtle">{hint}</p>
    </li>
  );
}

function TradeRow({
  fill,
  fuseOn,
  open,
  selected,
  onPick,
}: {
  fill: Fill;
  fuseOn: boolean;
  open?: boolean;
  selected: boolean;
  onPick: () => void;
}) {
  const tape = tapePnl(fill, fuseOn);
  const clock = bookedClock(fill.ts, fill.t);
  const name = speakBook(fill.recipe) || fill.recipe;
  const result = open
    ? "Still open."
    : fill.result === "won"
      ? "Won"
      : fill.result === "lost"
        ? "Lost"
        : fill.result === "void"
          ? "Void"
          : "";
  const paper = fill.book === "paper";

  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex w-full items-baseline gap-3 py-2.5 text-left transition-colors duration-150",
          selected && "bg-elev/80",
        )}
      >
        <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-subtle">{clock}</span>
        <span className="min-w-0 flex-1">
          <span className="text-sm">{cap(name)}</span>
          <span className="mt-0.5 block font-mono text-[10px] text-subtle">
            {fill.side ? `${fill.side} · ` : ""}
            {fmtOdds(fill.odds)}
            {fill.stake != null ? ` · ${fmtStake(fill.stake)}` : ""}
            {paper ? " · paper, not income" : ""}
            {open ? ` · ${result}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {open ? (
            <span className="font-mono text-xs text-subtle">{EMPTY}</span>
          ) : (
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                tape.pnl != null && tape.pnl > 0 && "text-up",
                tape.pnl != null && tape.pnl < 0 && "text-bad",
                (tape.pnl == null || tape.pnl === 0) && "text-muted",
                paper && "text-muted",
              )}
            >
              {tape.pnl == null ? EMPTY : fmtU(tape.pnl)}
            </span>
          )}
          {!open && result ? (
            <span
              className={cn(
                "mt-0.5 block font-mono text-[10px]",
                fill.result === "won" && "text-up",
                fill.result === "lost" && "text-bad",
                fill.result === "void" && "text-subtle",
              )}
            >
              {result}
            </span>
          ) : null}
        </span>
      </button>
    </li>
  );
}

function WaitRow({
  chip,
  selected,
  onPick,
}: {
  chip: WaitOpen;
  selected: boolean;
  onPick: () => void;
}) {
  const name = speakBook(chip.title) || chip.title;
  const why = /size_ok/i.test(chip.why ?? "") ? "No races of the right size yet." : chip.why;
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex w-full items-baseline gap-3 py-2.5 text-left transition-colors duration-150",
          selected && "bg-elev/80",
        )}
      >
        <span className="w-16 shrink-0 font-mono text-xs text-subtle" />
        <span className="min-w-0 flex-1">
          <span className="text-sm">{cap(name)}</span>
          <span className="mt-0.5 block text-xs text-subtle">Waiting for races. Not a ticket.</span>
          {why ? <span className="mt-0.5 block text-xs text-subtle">{why}</span> : null}
        </span>
      </button>
    </li>
  );
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
