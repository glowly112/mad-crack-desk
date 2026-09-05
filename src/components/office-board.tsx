import { memo, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DeskScroll } from "@/components/desk-scroll";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { countArmed } from "@/lib/lab/board-reset";
import { EMPTY } from "@/lib/lab/desk";
import {
  filterOfficeRows,
  officeBookCounts,
  officeBookRecipes,
  officeBookRows,
  officeProductionHeroValue,
  type OfficeBookRow,
  type OfficeFilter,
  type OfficePnlTone,
} from "@/lib/lab/office-display";
import { cn } from "@/lib/utils";

const FILTERS: { key: OfficeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "measuring", label: "Measuring" },
  { key: "keep", label: "KEEP" },
  { key: "killed", label: "Killed" },
];

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
    const armed = countArmed({
      recipes: stamp.recipes,
      wait_open: stamp.wait_open,
      mill_n_armed: (stamp as { mill_n_armed?: number }).mill_n_armed,
      n_armed: (stamp as { n_armed?: number }).n_armed,
    });
    const recipeCount = officeBookRecipes(stamp.recipes).length;
    return { rows, counts, armed, recipeCount };
  }, [
    stamp.generated,
    stamp.day,
    stamp.fuse_on,
    stamp.pipe.scaling,
    stamp.recipes,
    stamp.trades,
    stamp.wait_open,
    trend?.n_keep,
  ]);
}

export function OfficeCounts() {
  const stamp = useStamp();
  const { counts, armed, recipeCount } = useOfficeDesk();

  const tiles = [
    { label: "Strategies", value: String(recipeCount), hint: armed > 0 ? `${armed} armed on mill` : "Armed skins" },
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
  "Strategy / hole",
  "State",
  "Paper P&L",
  "n / W–L",
  "Side",
  "Market",
  "Spices",
  "Production",
  "Later-race",
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
  todayCounts,
}: {
  pnl: string;
  tone: OfficePnlTone;
  counts: string;
  todayCounts?: string;
}) {
  return (
    <td className={pnlClass(tone)}>
      <div>{pnl}</div>
      {counts !== EMPTY ? (
        <div className="mt-0.5 text-[10px] text-subtle tabular-nums">{counts}</div>
      ) : null}
      {todayCounts && todayCounts !== EMPTY ? (
        <div className="mt-0.5 text-[10px] text-muted tabular-nums">{todayCounts}</div>
      ) : null}
    </td>
  );
}

const OfficeBookTableRow = memo(function OfficeBookTableRow({ row }: { row: OfficeBookRow }) {
  return (
    <tr className="border-b border-border">
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
          <div className="mt-0.5 text-[10px] text-muted">{row.hole}</div>
        </Link>
      </td>
      <td className="px-2 py-2.5 text-xs text-muted">{row.stateLabel}</td>
      <PnlCell
        pnl={row.paperPnl}
        tone={row.paperPnlTone}
        counts={row.paperCounts}
        todayCounts={row.paperTodayCounts}
      />
      <td className="px-2 py-2.5 font-mono text-xs tabular-nums text-subtle">{row.wlN}</td>
      <td className="px-2 py-2.5 font-mono text-xs text-subtle">{row.side}</td>
      <td className="px-2 py-2.5 font-mono text-xs text-subtle">{row.market}</td>
      <td className="px-2 py-2.5 text-[10px] text-muted">{row.spices ?? EMPTY}</td>
      <PnlCell pnl={row.productionPnl} tone={row.productionPnlTone} counts={row.productionCounts} />
      <td className={pnlClass(row.laterRacePnlTone)}>{row.laterRacePnl}</td>
    </tr>
  );
});

/** One row per armed strategy — hole, state, paper / production / later-race P&L. */
export function OfficeBooksTable() {
  const { rows, armed, recipeCount } = useOfficeDesk();
  const [filter, setFilter] = useState<OfficeFilter>("all");
  const filtered = useMemo(() => filterOfficeRows(rows, filter), [rows, filter]);

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-sm font-medium">Strategies</h2>
          <p className="text-xs text-subtle">
            {recipeCount} rows
            {armed > 0 ? ` · ${armed} armed on mill` : ""}
            {" · "}Paper P&L since armed
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs transition-colors",
                filter === f.key
                  ? "bg-elev text-fg"
                  : "text-muted hover:bg-elev/60 hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>
      {filtered.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <DeskScroll axis="y" className="min-w-0 max-h-[min(70vh,42rem)]">
          <table className="w-full min-w-[56rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-20" />
              <col className="w-[4.5rem]" />
              <col className="w-20" />
              <col className="w-12" />
              <col className="w-14" />
              <col className="w-[14%]" />
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
                      (h === "Paper P&L" || h === "Production" || h === "Later-race") && "text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <OfficeBookTableRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </DeskScroll>
      )}
    </section>
  );
}
