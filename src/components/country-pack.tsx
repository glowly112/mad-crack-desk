import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { countryMarket, countryPackLine, countryPile, officeCountries, waffleCols } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { CountryRow } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

/** One market. Every region lives inside it. Parked is fg, still being tested is warn. */
export function CountryPack() {
  const stamp = useStamp();
  const countries = officeCountries(stamp.coverage, stamp.recipes);
  const market = countryMarket(countries);
  const line = countryPackLine(countries);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">By country</h2>
        <p className="flex items-center gap-3 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 bg-fg" aria-hidden />
            parked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2 bg-warn" aria-hidden />
            still being tested
          </span>
        </p>
      </header>
      {market.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <div className="bg-elev px-4 py-4" role="img" aria-label={line}>
            <div className="flex flex-wrap items-end gap-x-7 gap-y-5">
              {market.map((c, i) => (
                <Cluster key={c.region} row={c} delay={i} />
              ))}
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">{line}</p>
        </div>
      )}
    </section>
  );
}

function Cluster({ row, delay }: { row: CountryRow; delay: number }) {
  const n = countryPile(row);
  return (
    <article
      className="log-in min-w-0"
      style={{ animationDelay: `${Math.min(delay, 8) * 28}ms` }}
      aria-label={`${row.name}. ${row.line}`}
      title={`${row.name}. ${row.line}`}
    >
      {n > 0 ? (
        <Waffle parked={row.parked} testing={row.testing} />
      ) : (
        <p className="text-xs text-subtle">{EMPTY}</p>
      )}
      <p className="mt-1.5 text-xs leading-tight">{row.name}</p>
    </article>
  );
}

function Waffle({ parked, testing }: { parked: number; testing: number }) {
  const n = parked + testing;
  const cols = waffleCols(n);
  const cells = [
    ...Array.from({ length: parked }, (_, i) => ({ key: `p${i}`, tone: "parked" as const })),
    ...Array.from({ length: testing }, (_, i) => ({ key: `t${i}`, tone: "test" as const })),
  ];
  return (
    <div
      className="grid gap-[3px]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1.25rem)`,
        gridAutoRows: "1.25rem",
      }}
    >
      {cells.map((c) => (
        <span
          key={c.key}
          className={cn("block rounded-[2px]", c.tone === "parked" ? "bg-fg" : "bg-warn")}
        />
      ))}
    </div>
  );
}
