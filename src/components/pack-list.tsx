import { Link } from "@tanstack/react-router";
import { MarkSolid } from "@/components/marks";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { SOLID_EMPTY, solidRows } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";
import { cn } from "@/lib/utils";

/** Floor morning board: solids only. */
export function PackList() {
  const stamp = useStamp();
  const solids = solidRows(stamp.recipes, stamp.n_solid);

  return (
    <Group
      icon={MarkSolid}
      label="Solid"
      hint="Production tape"
      count={stamp.n_solid}
      empty={SOLID_EMPTY}
      rows={solids}
    />
  );
}

function Group({
  icon: Icon,
  label,
  hint,
  count,
  empty,
  rows,
  quiet,
  mute,
}: {
  icon: typeof MarkSolid;
  label: string;
  hint: string;
  count: number;
  empty: string;
  rows: Recipe[];
  quiet?: boolean;
  mute?: boolean;
}) {
  return (
    <div className={cn(mute && "opacity-50")}>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-subtle" />
          <h2 className={cn("text-sm font-medium", quiet ? "text-muted" : "text-fg")}>{label}</h2>
          <span className="font-mono text-xs text-subtle">{count}</span>
        </div>
        <p className="text-xs text-subtle">{hint}</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={empty} />
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="border-b border-border">
              <Link
                to="/holdings/$id"
                params={{ id: r.id }}
                className="flex items-center gap-3 py-2.5 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className={quiet ? "text-sm text-muted" : "text-sm font-medium"}>{r.title}</p>
                    <span className="rounded-sm bg-elev px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-subtle">
                      {label}
                    </span>
                    {r.chip ? (
                      <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">
                        {r.chip}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-subtle">{r.why}</p>
                </div>
                <p className="hidden font-mono text-xs text-subtle sm:block">{r.region}</p>
                <p className="font-mono text-xs tabular-nums text-subtle">n={r.n}</p>
                <p
                  className={cn(
                    "w-16 text-right font-mono text-xs tabular-nums",
                    quiet ? "text-subtle" : r.roi >= 0 ? "text-up" : "text-bad",
                  )}
                >
                  {r.roi >= 0 ? "+" : ""}
                  {r.roi.toFixed(1)}%
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
