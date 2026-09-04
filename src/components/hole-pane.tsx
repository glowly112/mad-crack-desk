import { EMPTY } from "@/lib/lab/desk";
import type { HolePaneDetail } from "@/lib/lab/hole-pane";
import { cn } from "@/lib/utils";

export function HolePane({ detail }: { detail: HolePaneDetail }) {
  const rows = [
    { label: "Settled", value: detail.settledLine },
    { label: "Invent", value: detail.inventLine },
    { label: "Prefer", value: detail.preferLine },
    { label: "Distrust", value: detail.distrustLine },
    { label: "Holdout", value: detail.holdoutLine },
  ].filter((r) => r.value && r.value !== EMPTY);

  return (
    <aside
      className="mt-4 border border-border bg-elev px-4 py-3"
      aria-label={`Hole ${detail.name}`}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{detail.name}</h3>
          {detail.skinId ? (
            <p className="mt-0.5 font-mono text-[10px] text-subtle">{detail.skinId}</p>
          ) : null}
        </div>
        <p className="font-mono text-xs text-muted">
          {detail.statusLine && detail.statusLine !== EMPTY ? detail.statusLine : EMPTY}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{EMPTY}</p>
      ) : (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[10px] text-subtle">{row.label}</dt>
              <dd className="font-mono text-xs text-fg tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}

export function HoleCellMark({ mark, selected }: { mark: string; selected?: boolean }) {
  if (!mark || mark === EMPTY) return null;
  return (
    <span
      className={cn(
        "pointer-events-none absolute -bottom-3 left-1/2 z-10 max-w-[2.75rem] -translate-x-1/2 truncate font-mono text-[7px] leading-none tabular-nums",
        selected ? "text-fg" : "text-subtle",
      )}
      aria-hidden
    >
      {mark}
    </span>
  );
}
