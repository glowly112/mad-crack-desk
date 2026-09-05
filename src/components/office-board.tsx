import { memo, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DeskScroll } from "@/components/desk-scroll";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { countArmed } from "@/lib/lab/board-reset";
import { EMPTY } from "@/lib/lab/desk";
import {
  filterOfficeStrategyRows,
  officeBookCounts,
  officeProductionHeroValue,
  type OfficeBookRow,
  type OfficeFilter,
  type OfficePnlTone,
  type OfficeTypeFilter,
} from "@/lib/lab/office-display";
import { officeStrategyRows } from "@/lib/lab/office-nuggets";
import { cn } from "@/lib/utils";

const FILTERS: { key: OfficeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "measuring", label: "Measuring" },
  { key: "keep", label: "KEEP" },
  { key: "killed", label: "Killed" },
];

const TYPE_FILTERS: { key: OfficeTypeFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "wide", label: "Wide" },
  { key: "mid", label: "Mid" },
  { key: "nugget", label: "Nugget" },
];

const HEADERS = [
  { key: "type", label: "Type", align: "left" },
  { key: "hole", label: "Hole", align: "left" },
  { key: "odds", label: "Odds", align: "left" },
  { key: "course", label: "Course", align: "left" },
  { key: "card", label: "Card", align: "left" },
  { key: "state", label: "State", align: "left" },
  { key: "n", label: "n / W–L", align: "right" },
  { key: "today", label: "Today", align: "right" },
  { key: "pnl", label: "Paper P&L", align: "right" },
  { key: "unit", label: "u/n", align: "right" },
  { key: "prod", label: "Prd", align: "right" },
  { key: "later", label: "Later", align: "right" },
] as const;

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
    const input = officeInput(stamp);
    const rows = officeStrategyRows(input);
    const counts = officeBookCounts(rows, stamp.fuse_on, stamp.pipe.scaling);
    const armed = countArmed({
      recipes: stamp.recipes,
      wait_open: stamp.wait_open,
      mill_n_armed: (stamp as { mill_n_armed?: number }).mill_n_armed,
      n_armed: (stamp as { n_armed?: number }).n_armed,
    });
    return { rows, counts, armed, strategyCount: rows.length };
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
  const { counts, armed, strategyCount } = useOfficeDesk();

  const tiles = [
    { label: "Strategies", value: String(strategyCount), hint: armed > 0 ? `${armed} armed on mill` : "Wide · mid · nugget" },
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

function pnlClass(tone: OfficePnlTone, muted = false): string {
  return cn(
    "px-1.5 py-2 font-mono text-[11px] tabular-nums",
    muted && "text-muted",
    !muted && tone === "empty" && "text-muted",
    !muted && tone === "neutral" && "text-muted",
    !muted && tone === "up" && "text-up",
    !muted && tone === "down" && "text-bad",
  );
}

function cellText(value: string, className?: string) {
  return (
    <span className={cn("block truncate text-[11px]", value === EMPTY && "text-muted", className)}>
      {value}
    </span>
  );
}

function TypeBadge({ type }: { type: OfficeBookRow["strategyType"] }) {
  const label = type === "wide" ? "Wide" : type === "mid" ? "Mid" : "Nug";
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-1 py-0.5 text-[9px] font-medium leading-none",
        type === "wide" ? "bg-elev text-fg" : "border border-border bg-surface text-subtle",
      )}
    >
      {label}
    </span>
  );
}

const OfficeStrategyTableRow = memo(function OfficeStrategyTableRow({ row }: { row: OfficeBookRow }) {
  return (
    <tr className="border-b border-border">
      <td className="px-1.5 py-2">
        <TypeBadge type={row.strategyType} />
      </td>
      <td className="max-w-[7.5rem] px-1.5 py-2">
        <Link
          to="/holdings/$id"
          params={{ id: row.holdingId }}
          className="block truncate text-[11px] transition-colors hover:text-fg"
          title={row.hole}
        >
          {row.hole}
        </Link>
      </td>
      <td className="max-w-[3.5rem] px-1.5 py-2 font-mono text-[10px] tabular-nums text-subtle">
        {cellText(row.oddsSlice)}
      </td>
      <td className="max-w-[5rem] px-1.5 py-2">{cellText(row.courseSlice, "text-subtle")}</td>
      <td className="max-w-[4.5rem] px-1.5 py-2">{cellText(row.cardSlice, "text-muted")}</td>
      <td className="px-1.5 py-2 text-[10px] text-muted">{row.stateLabel}</td>
      <td className={pnlClass("empty")}>{cellText(row.wlN, "text-right font-mono tabular-nums text-subtle")}</td>
      <td className={pnlClass(row.todayPnlTone, row.todayWlN === EMPTY && row.todayPnl === EMPTY)}>
        {row.todayWlN !== EMPTY ? (
          <div className="text-[10px] text-subtle">{row.todayWlN}</div>
        ) : null}
        {row.todayPnl !== EMPTY ? <div>{row.todayPnl}</div> : null}
      </td>
      <td className={pnlClass(row.paperPnlTone)}>
        <div>{row.paperPnl}</div>
        {row.paperCounts && row.paperCounts !== EMPTY ? (
          <div className="mt-0.5 truncate text-[9px] text-muted">{row.paperCounts}</div>
        ) : null}
      </td>
      <td className={pnlClass(row.paperUnitTone)}>{row.paperUnit}</td>
      <td className={pnlClass(row.productionPnlTone, row.productionPnl === EMPTY)}>
        {row.productionPnl}
      </td>
      <td className={pnlClass(row.laterRacePnlTone, row.laterRacePnl === EMPTY)}>{row.laterRacePnl}</td>
    </tr>
  );
});

/** Wide hole skins + spice nuggets — one compact Strategies table. */
export function OfficeBooksTable() {
  const { rows, armed } = useOfficeDesk();
  const [filter, setFilter] = useState<OfficeFilter>("all");
  const [typeFilter, setTypeFilter] = useState<OfficeTypeFilter>("all");
  const filtered = useMemo(
    () => filterOfficeStrategyRows(rows, filter, typeFilter),
    [rows, filter, typeFilter],
  );

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
        <div>
          <h2 className="text-sm font-medium">Strategies</h2>
          <p className="text-xs text-subtle">
            {rows.length} strategies
            {armed > 0 ? ` · ${armed} armed on mill` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-sm border border-border p-0.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setTypeFilter(f.key)}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs transition-colors",
                  typeFilter === f.key
                    ? "bg-elev text-fg"
                    : "text-muted hover:bg-elev/60 hover:text-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs transition-colors",
                  filter === f.key
                    ? "bg-elev text-fg"
                    : "text-muted hover:bg-elev/60 hover:text-fg",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </header>
      {filtered.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <DeskScroll axis="y" className="min-w-0 max-h-[min(70vh,42rem)]">
          <table className="w-full min-w-[48rem] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-11" />
              <col className="w-[7.5rem]" />
              <col className="w-12" />
              <col className="w-16" />
              <col className="w-14" />
              <col className="w-16" />
              <col className="w-14" />
              <col className="w-12" />
              <col className="w-14" />
              <col className="w-12" />
              <col className="w-11" />
              <col className="w-11" />
            </colgroup>
            <thead className="sticky top-0 z-[1] bg-bg">
              <tr className="border-b border-border">
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    scope="col"
                    className={cn(
                      "px-1.5 py-1.5 text-[9px] font-normal tracking-wide text-subtle",
                      h.align === "right" && "text-right",
                    )}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <OfficeStrategyTableRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </DeskScroll>
      )}
    </section>
  );
}
