import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import {
  capitalisingLine,
  countryMarket,
  inventHole,
  officeCountries,
  plantCells,
} from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { CountryRow, MarketSquare } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

const TONE: Record<MarketSquare["tone"], string> = {
  empty: "bg-elev ring-1 ring-inset ring-border-strong",
  hunt: "bg-subtle",
  idea: "bg-warn",
  win: "bg-fg",
  loss: "bg-bad",
  parked: "bg-muted",
};

const TONE_LABEL: Record<MarketSquare["tone"], string> = {
  empty: "unused",
  hunt: "looking",
  idea: "still being tested",
  win: "solid",
  loss: "killed",
  parked: "parked",
};

/** One plant waffle of stamp cells, then eight countries as occupied vs Empty. */
export function CountryPack() {
  const stamp = useStamp();
  const squares = plantCells(stamp.counts);
  const countries = countryMarket(officeCountries(stamp.coverage, stamp.recipes));
  const cap = capitalisingLine(stamp.counts);
  const hole =
    [stamp.office.inventWhy, ...stamp.hunters.map((h) => h.note)]
      .map(inventHole)
      .find((n) => n !== EMPTY) ?? EMPTY;
  const glance = `${cap}${hole !== EMPTY ? ` Looking at ${hole}.` : ""}`;

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">By country</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <LegendDot tone="empty" label="unused" />
          <LegendDot tone="hunt" label="looking" />
          <LegendDot tone="loss" label="killed" />
          <LegendDot tone="idea" label="still being tested" />
          <LegendDot tone="parked" label="parked" />
          <LegendDot tone="win" label="solid" />
        </p>
      </header>
      {squares.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <div
            className="grid gap-[3px] border border-border bg-bg p-3"
            role="img"
            aria-label={glance}
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(0.7rem, 1fr))" }}
          >
            {squares.map((s) => (
              <span
                key={s.id}
                title={TONE_LABEL[s.tone]}
                className={cn("aspect-square rounded-[2px]", TONE[s.tone])}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{cap}</p>
          {hole !== EMPTY ? <p className="mt-0.5 text-xs text-subtle">Looking at {hole}.</p> : null}
          <CountryRowList rows={countries} />
        </div>
      )}
    </section>
  );
}

function LegendDot({ tone, label }: { tone: MarketSquare["tone"]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block size-2", TONE[tone])} aria-hidden />
      {label}
    </span>
  );
}

function CountryRowList({ rows }: { rows: readonly CountryRow[] }) {
  if (!rows.length) return null;
  return (
    <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {rows.map((row) => (
        <li key={row.region} className="min-w-0">
          <p className="truncate text-xs">{row.name}</p>
          <p className={cn("mt-0.5 font-mono text-[10px] leading-snug", row.line === EMPTY ? "text-muted" : "text-subtle")}>
            {row.line}
          </p>
        </li>
      ))}
    </ol>
  );
}
