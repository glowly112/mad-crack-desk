import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { DeskScroll } from "@/components/desk-scroll";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { EMPTY } from "@/lib/lab/desk";
import {
  officeBookCounts,
  officeBookRows,
  officeProductionHeroValue,
  type OfficeBookRow,
  type OfficePnlTone,
} from "@/lib/lab/office-display";
import { cn } from "@/lib/utils";

/** Top strip — strategies, KEEP, production, live (Empty while fuse off). */
function officeInput(stamp: ReturnType<typeof useStamp>) {
  const trend = stamp.trends.find((t) => t.day === stamp.day);
  return {
    recipes: stamp.recipes,
    day: stamp.day,
    trades: stamp.trades,
    n_keep: trend?.n_keep,
  };
}

function useOfficeDesk() {
  const stamp = useStamp();
  const trend = stamp.trends.find((t) => t.day === stamp.day);
  return useMemo(() => {
    const rows = officeBookRows(officeInput(stamp));
    const counts = officeBookCounts(rows, stamp.fuse_on, stamp.pipe.scaling);
    return { rows, counts };
  }, [
    stamp.generated,
    stamp.day,
    stamp.fuse_on,
    stamp.pipe.scaling,
    stamp.recipes,
    stamp.trades,
    trend?.n_keep,
  ]);
}

export function OfficeCounts() {
  const stamp = useStamp();
  const { counts } = useOfficeDesk();

  const tiles = [
    { label: "Strategies", value: String(counts.strategies), hint: "First-book skins" },
    { label: "KEEP", value: String(counts.keep), hint: "Later-race same-bets" },
    {
      label: "Production",
      value: officeProductionHeroValue(counts.keep, counts.production),
      hint: counts.keep === 0 ? "Empty until KEEP proves" : "Solid recipes",
    },
    { label: "Live", value: counts.live, hint: stamp.fuse_on ? "Real betting" : "fuse off" },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-sm border border-border bg-surface px-3 py-2.5">
          <p className="text-xs text-subtle">{t.label}</p>
          <p className="mt-1 font-mono text-lg tabular-nums">{t.value}</p>
          <p className="mt-0.5 text-[10px] text-muted">{t.hint}</p>
        </div>
      ))}
    </section>
  );
}

const HEADERS = [
  "Hole",
  "Strategy",
  "Side",
  "Market",
  "State",
  "Paper P&L",
  "Production P&L",
  "Later-race P&L",
] as const;

function pnlClass(tone: OfficePnlTone): string {
  return cn(
    "px-2 py-2.5 text-right font-mono text-xs tabular-nums",
    tone === "empty" && "text-muted",
    tone === "neutral" && "text-muted",
    tone === "up" && "text-up",
    tone === "down" && "text-bad",
  );
}

function PnlCell({
  pnl,
  tone,
  counts,
}: {
  pnl: string;
  tone: OfficePnlTone;
  counts: string;
}) {
  return (
    <td className={pnlClass(tone)}>
      <div>{pnl}</div>
      {counts !== EMPTY ? (
        <div className="mt-0.5 text-[10px] text-subtle tabular-nums">{counts}</div>
      ) : null}
    </td>
  );
}

const OfficeBookTableRow = memo(function OfficeBookTableRow({ row }: { row: OfficeBookRow }) {
  return (
    <tr className="border-b border-border">
      <td className="px-2 py-2.5 text-sm text-muted">{row.hole}</td>
      <td className="px-2 py-2.5 text-sm">
        <Link
          to="/holdings/$id"
          params={{ id: row.holdingId }}
          className="transition-colors hover:text-fg"
        >
          <div>{row.strategy}</div>
          {row.strategySub ? (
            <div className="mt-0.5 font-mono text-[10px] leading-snug text-subtle">{row.strategySub}</div>
          ) : null}
        </Link>
      </td>
      <td className="px-2 py-2.5 font-mono text-xs text-subtle">{row.side}</td>
      <td className="px-2 py-2.5 font-mono text-xs text-subtle">{row.market}</td>
      <td className="px-2 py-2.5 text-xs text-muted">{row.state}</td>
      <PnlCell pnl={row.paperPnl} tone={row.paperPnlTone} counts={row.paperCounts} />
      <PnlCell pnl={row.productionPnl} tone={row.productionPnlTone} counts={row.productionCounts} />
      <td className={pnlClass(row.laterRacePnlTone)}>{row.laterRacePnl}</td>
    </tr>
  );
});

/** One row per strategy/book — hole, name, side, market, state, paper / production / later-race P&L. */
export function OfficeBooksTable() {
  const { rows } = useOfficeDesk();

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium">Books</h2>
        <p className="text-xs text-subtle">One row per strategy · measuring is not income</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <DeskScroll axis="y" className="min-w-0 max-h-[min(70vh,42rem)]">
          <table className="w-full min-w-[52rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col />
              <col className="w-12" />
              <col className="w-14" />
              <col className="w-20" />
              <col className="w-[4.5rem]" />
              <col className="w-[4.5rem]" />
              <col className="w-[4.5rem]" />
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-bg">
              <tr className="border-b border-border">
                {HEADERS.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={cn(
                      "px-2 py-2 text-[10px] font-normal tracking-wide text-subtle",
                      h.endsWith("P&L") && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => <OfficeBookTableRow key={row.id} row={row} />)}
            </tbody>
          </table>
        </DeskScroll>
      )}
    </section>
  );
}
