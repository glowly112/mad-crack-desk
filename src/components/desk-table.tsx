import { useNavigate } from "@tanstack/react-router";
import { DeskScroll } from "@/components/desk-scroll";
import { EmptyState } from "@/components/empty-state";
import { DESK_HEADERS, EMPTY, type DeskGroup, type DeskRow } from "@/lib/lab/desk";
import { cn, fmtU } from "@/lib/utils";

const RIGHT = new Set(["Odds", "Stake", "P&L"]);
const MONO = new Set(["Time", "Market", "Side", "Odds", "Stake", "P&L"]);

/** Aligned desk board. Quiet headers. Colour only on P&L. No pills. */
export function DeskTable({ groups, empty }: { groups: DeskGroup[]; empty: string }) {
  const rows = groups.flatMap((g) => g.rows);
  if (rows.length === 0) return <EmptyState copy={empty} />;

  return (
    <DeskScroll className="min-w-0">
      <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[4.5rem]" />
          <col />
          <col className="w-[3.25rem]" />
          <col className="w-[3.25rem]" />
          <col className="w-[3.25rem]" />
          <col className="w-12" />
          <col className="w-[3.5rem]" />
          <col className="w-[7.25rem]" />
          <col className="w-[3.75rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-border">
            {DESK_HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className={cn(
                  "px-2 py-2 text-[10px] font-normal tracking-wide text-subtle",
                  RIGHT.has(h) && "text-right",
                  h === "Name" && "w-[28%]",
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
      <NameCell row={row} />
      <Cell k="Market" v={row.market} />
      <Cell k="Side" v={row.side} />
      <Cell k="Odds" v={row.odds} />
      <Cell k="Stake" v={row.stake} />
      <Cell k="Book" v={row.book} />
      <Cell k="Result" v={row.result} />
      <PnlCell v={row.pnl} />
    </tr>
  );
}

function NameCell({ row }: { row: DeskRow }) {
  const shown = row.name && row.name !== EMPTY ? row.name : EMPTY;
  const course = row.course && row.course !== EMPTY ? row.course : null;
  const spice = row.spiceLine && row.spiceLine !== EMPTY ? row.spiceLine : null;
  return (
    <td className="px-2 py-2 align-middle text-sm break-words text-fg">
      {shown === EMPTY ? (
        <span className="text-subtle">{EMPTY}</span>
      ) : (
        <span>
          {shown}
          {row.nameTag ? (
            <span className="ml-1.5 font-mono text-[10px] text-subtle">{row.nameTag}</span>
          ) : null}
        </span>
      )}
      {course ? <p className="mt-0.5 text-xs text-muted">{course}</p> : null}
      {spice ? <p className="mt-0.5 font-mono text-[10px] text-subtle">{spice}</p> : null}
    </td>
  );
}

function Cell({ k, v }: { k: (typeof DESK_HEADERS)[number]; v: string }) {
  const shown = v && v !== EMPTY ? v : EMPTY;
  return (
    <td
      className={cn(
        "px-2 py-2 align-middle text-sm",
        MONO.has(k) && "font-mono text-xs tabular-nums",
        RIGHT.has(k) && "text-right",
        shown === EMPTY ? "text-subtle" : k === "Name" ? "text-fg" : "text-muted",
        k === "Name" && "break-words",
      )}
    >
      {shown}
    </td>
  );
}

function PnlCell({ v }: { v: number | null }) {
  if (v == null) {
    return (
      <td className="px-2 py-2 text-right font-mono text-xs tabular-nums text-muted" aria-label="Pending">
        —
      </td>
    );
  }
  return (
    <td
      className={cn(
        "px-2 py-2 text-right font-mono text-xs tabular-nums",
        v > 0 && "text-up",
        v < 0 && "text-bad",
        v === 0 && "text-muted",
      )}
    >
      {fmtU(v)}
    </td>
  );
}
