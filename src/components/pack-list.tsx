import { LookLink } from "@/components/look-link";
import { StatusPill, packKind } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { MarkKeep, MarkMeasure, MarkSolid } from "@/components/marks";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { EMPTY, SOLID_EMPTY, recipePack, solidRows } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";

export function PackList() {
  const stamp = useStamp();
  const look = useLook();
  const pack = recipePack(stamp.recipes);
  const solids = solidRows(stamp.recipes, stamp.n_solid);

  return (
    <section className={`space-y-8 pack-list look-${look}`}>
      <Group
        icon={MarkSolid}
        label="Solid"
        count={stamp.n_solid}
        empty={SOLID_EMPTY}
        rows={solids}
      />
      <Group
        icon={MarkKeep}
        label="Research keep"
        count={stamp.counts.keep}
        empty={EMPTY}
        rows={pack.keeps}
        quiet
      />
      <Group
        icon={MarkMeasure}
        label="Proving"
        count={stamp.counts.measuring}
        empty={EMPTY}
        rows={pack.proving}
        quiet
      />
    </section>
  );
}

function Group({
  icon: Icon,
  label,
  count,
  empty,
  rows,
  quiet,
}: {
  icon: typeof MarkSolid;
  label: string;
  count: number;
  empty: string;
  rows: Recipe[];
  quiet?: boolean;
}) {
  const look = useLook();
  return (
    <div>
      <header className="mb-2 flex items-center gap-2 border-b border-border pb-2">
        <Icon className="size-3.5 text-subtle" />
        <h2 className="text-sm font-medium text-muted">{label}</h2>
        <span className="font-mono text-xs text-subtle">{count}</span>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={empty} />
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="border-b border-border">
              <LookLink
                to="/holdings/$id"
                params={{ id: r.id }}
                className="flex items-center gap-3 py-2.5 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className={quiet ? "text-sm text-muted" : "text-sm"}>{r.title}</p>
                    {look === "charcoal" ? (
                      <span className="rounded-sm bg-elev px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-subtle">
                        {label}
                      </span>
                    ) : (
                      <StatusPill kind={packKind(label)}>{label}</StatusPill>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-subtle">{r.why}</p>
                </div>
                <p className="hidden font-mono text-xs text-subtle sm:block">{r.region}</p>
                <p className="font-mono text-xs tabular-nums text-subtle">n={r.n}</p>
                <p className="w-16 text-right font-mono text-xs tabular-nums text-subtle">
                  {r.roi >= 0 ? "+" : ""}
                  {r.roi.toFixed(1)}%
                </p>
              </LookLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
