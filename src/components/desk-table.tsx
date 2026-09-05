import { useNavigate } from "@tanstack/react-router";
import { DeskScroll } from "@/components/desk-scroll";
import { EmptyState } from "@/components/empty-state";
import { DESK_HEADERS, EMPTY, type DeskGroup, type DeskRow } from "@/lib/lab/desk";
import { cn, fmtU } from "@/lib/utils";

const RIGHT = new Set(["Odds", "Stake", "P&L"]);
const MONO = new Set(["Time", "Odds", "Stake", "P&L"]);

function cellText(value: string, className?: string) {
  const shown = value && value !== EMPTY ? value : EMPTY;
  return (
    <span className={cn("block truncate whitespace-nowrap", shown === EMPTY && "text-muted", className)}>
      {shown}
    </span>
  );
}

/** Aligned desk board — compact columns matching Office Strategies. */
export function DeskTable({ groups, empty }: { groups: DeskGroup[]; empty: string }) {
  const rows = groups.flatMap((g) => g.rows);
  if (rows.length === 0) return <EmptyState copy={empty} />;

  return (
    <DeskScroll className="min-w-0">
      <table className="w-full min-w-[44rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[3.5rem]" />
          <col className="w-[5.5rem]" />
          <col className="w-[6.5rem]" />
          <col className="w-10" />
          <col className="w-16" />
          <col className="w-14" />
          <col className="w-10" />
          <col className="w-10" />
          <col className="w-12" />
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            {DESK_HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  "px-1.5 py-1.5 text-[9px] font-normal tracking-wide text-subtle",
                  RIGHT.has(h) && "text-right",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) =>
            g.rows.length === 0 ? null : (
              <GroupBody key={g.id} group={g} />
            ),
          )}
        </tbody>
      </table>
    </DeskScroll>
  );
}

function GroupBody({ group }: { group: DeskGroup }) {
  return (
    <>
      {group.label ? (
        <tr>
          <td colSpan={DESK_HEADERS.length} className="bg-bg px-2 pt-4 pb-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium">{group.label}</p>
              {group.hint ? <p className="text-[10px] text-subtle">{group.hint}</p> : null}
            </div>
          </td>
        </tr>
      ) : null}
      {group.rows.map((row) => (
        <DataRow key={row.id} row={row} />
      ))}
    </>
  );
}

function DataRow({ row }: { row: DeskRow }) {
  const navigate = useNavigate();
  const clickable = Boolean(row.holdingId || row.onPick);
  const pick = () => {
    row.onPick?.();
    if (row.holdingId) {
      void navigate({ to: "/holdings/$id", params: { id: row.holdingId } });
    }
  };

  return (
    <tr
      className={cn(
        "border-b border-border",
        clickable && "cursor-pointer hover:bg-elev/60",
        row.selected && "bg-elev",
      )}
      onClick={clickable ? pick : undefined}
    >
      <Cell k="Time" v={row.time} />
      <td className="max-w-[5.5rem] px-1.5 py-2 align-middle text-[11px]">
        {cellText(row.horse)}
      </td>
      <td className="max-w-[6.5rem] px-1.5 py-2 align-middle text-[11px]" title={row.hole}>
        {cellText(row.hole)}
      </td>
      <Cell k="Odds" v={row.odds} />
      <td className="max-w-[4rem] px-1.5 py-2 align-middle text-[11px]">
        {cellText(row.course, "text-subtle")}
      </td>
      <td className="max-w-[3.5rem] px-1.5 py-2 align-middle text-[11px]">
        {cellText(row.card, "text-muted")}
      </td>
      <Cell k="Side" v={row.side} />
      <Cell k="Stake" v={row.stake} />
      <Cell k="Result" v={row.result} />
      <PnlCell v={row.pnl} />
    </tr>
  );
}

function Cell({ k, v }: { k: (typeof DESK_HEADERS)[number]; v: string }) {
  const shown = v && v !== EMPTY ? v : EMPTY;
  return (
    <td
      className={cn(
        "max-w-[4rem] px-1.5 py-2 align-middle text-[11px]",
        MONO.has(k) && "font-mono text-[10px] tabular-nums",
        RIGHT.has(k) && "text-right",
        shown === EMPTY ? "text-muted" : k === "Result" ? "text-fg" : "text-subtle",
      )}
    >
      <span className="block truncate whitespace-nowrap">{shown}</span>
    </td>
  );
}

function PnlCell({ v }: { v: number | null }) {
  if (v == null) {
    return (
      <td className="px-1.5 py-2 text-right font-mono text-[10px] tabular-nums text-muted" aria-label="Pending">
        —
      </td>
    );
  }
  return (
    <td
      className={cn(
        "px-1.5 py-2 text-right font-mono text-[10px] tabular-nums",
        v > 0 && "text-up",
        v < 0 && "text-bad",
        v === 0 && "text-muted",
      )}
    >
      {fmtU(v)}
    </td>
  );
}
