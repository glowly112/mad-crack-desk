import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { DeskTable } from "@/components/desk-table";
import { OracleStampLine } from "@/components/oracle-stamp-line";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { axisDay, EMPTY, type DeskGroup } from "@/lib/lab/desk";
import {
  dayTapePnl,
  deskSettledTapeRollup,
  fillDeskRow,
  fillsOnDay,
  tradesMillOpenFills,
  tradesSettledVoidFills,
  waitDeskRow,
  tradesWaitChips,
} from "@/lib/lab/trades";
import { fmtU } from "@/lib/utils";

export const Route = createFileRoute("/trades")({ component: Trades });

export function Trades() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const scope = useDayScope();
  const dayFills = fillsOnDay(stamp.trades, scope.day);
  const rollup = deskSettledTapeRollup(stamp.trades, scope.day, stamp.recipes);
  const open = tradesMillOpenFills(stamp.trades, scope.day, stamp.recipes);
  const settled = rollup.fills;
  const voided = tradesSettledVoidFills(dayFills, stamp.recipes);
  const chips = scope.lookingBack ? [] : tradesWaitChips(stamp.recipes, stamp.wait_open ?? [], open);
  const tape = dayTapePnl(settled, stamp.fuse_on);
  const live = plant.source === "oracle";
  const days = stamp.trends.map((t) => t.day);
  const firstId = open[0]?.id ?? settled[0]?.id ?? chips[0]?.id ?? "";
  const [picked, setPicked] = useState(firstId);
  const selected = picked || firstId;

  const pick = (id: string) => () => setPicked(id);
  const groups: DeskGroup[] = [
    {
      id: "open",
      label: "Open",
      hint: scope.lookingBack ? axisDay(scope.day) : "Still in flight",
      rows: open.map((fill) => ({
        ...fillDeskRow(fill, stamp.fuse_on),
        selected: selected === fill.id,
        onPick: pick(fill.id),
      })),
    },
    {
      id: "wait",
      label: "Waiting for races",
      hint: "Recipe · not a ticket",
      rows: chips.map((chip) => ({
        ...waitDeskRow(chip),
        selected: selected === chip.id,
        onPick: pick(chip.id),
      })),
    },
    {
      id: "settled",
      label: scope.lookingBack ? `${axisDay(scope.day)} settled` : "Settled",
      hint: "Won / lost in u",
      rows: settled.map((fill) => ({
        ...fillDeskRow(fill, stamp.fuse_on),
        selected: selected === fill.id,
        onPick: pick(fill.id),
      })),
    },
    ...(voided.length
      ? [
          {
            id: "void",
            label: "Void",
            hint: "0u · not a win or lose",
            rows: voided.map((fill) => ({
              ...fillDeskRow(fill, stamp.fuse_on),
              selected: selected === fill.id,
              onPick: pick(fill.id),
            })),
          },
        ]
      : []),
  ];

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
        <OracleStampLine
          generated={stamp.generated}
          live={live}
          detail={plant.detail}
          tone={live ? "ok" : "warn"}
        />
        <p className="font-mono text-xs text-subtle">
          paper {tape.paper == null ? "Empty" : fmtU(tape.paper)} · production{" "}
          {tape.production == null ? "Empty" : fmtU(tape.production)} · live{" "}
          {stamp.fuse_on ? fmtU(tape.live) : "0"}
        </p>
      </div>

      <DeskTable groups={groups} empty={EMPTY} />
    </div>
  );
}
