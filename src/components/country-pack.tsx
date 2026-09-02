import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { countryPackBoxes, countryPackLine, officeCountries, waffleCols } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

/** Treemap of waffles: outer size is the pile, inner squares are recipes. */
export function CountryPack() {
  const stamp = useStamp();
  const countries = officeCountries(stamp.coverage, stamp.recipes);
  const boxes = countryPackBoxes(countries);
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
            <span className="inline-block size-2 bg-muted" aria-hidden />
            still being tested
          </span>
        </p>
      </header>
      {boxes.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div
            className="relative aspect-[5/4] w-full min-h-56 sm:aspect-[16/9] sm:min-h-72"
            role="img"
            aria-label={line}
          >
            {boxes.map((b, i) => (
              <article
                key={b.region}
                className="log-in absolute flex flex-col bg-elev p-2"
                style={{
                  left: `calc(${b.x}% + 2px)`,
                  top: `calc(${b.y}% + 2px)`,
                  width: `calc(${b.w}% - 4px)`,
                  height: `calc(${b.h}% - 4px)`,
                  animationDelay: `${Math.min(i, 8) * 28}ms`,
                }}
                aria-label={`${b.name}. ${b.line}`}
                title={`${b.name}. ${b.line}`}
              >
                <Waffle parked={b.parked} testing={b.testing} />
                <p className="mt-1.5 truncate text-xs leading-tight">{b.name}</p>
              </article>
            ))}
          </div>
          <p className="shrink-0 text-sm text-muted lg:max-w-40">{line}</p>
        </div>
      )}
    </section>
  );
}

function Waffle({ parked, testing }: { parked: number; testing: number }) {
  const n = parked + testing;
  const cols = waffleCols(n);
  const rows = Math.ceil(n / cols);
  const cells = [
    ...Array.from({ length: parked }, (_, i) => ({ key: `p${i}`, tone: "parked" as const })),
    ...Array.from({ length: testing }, (_, i) => ({ key: `t${i}`, tone: "test" as const })),
  ];
  const gap = 3;
  const unit = `min(calc((100cqw - ${(cols - 1) * gap}px) / ${cols}), calc((100cqh - ${(rows - 1) * gap}px) / ${rows}))`;

  return (
    <div className="min-h-0 flex-1 [container-type:size]">
      <div
        className="grid h-full w-full place-content-center"
        style={{
          gap,
          gridTemplateColumns: `repeat(${cols}, var(--u))`,
          gridAutoRows: "var(--u)",
          ["--u" as string]: unit,
        }}
      >
        {cells.map((c) => (
          <span
            key={c.key}
            className={cn("block rounded-[2px]", c.tone === "parked" ? "bg-fg" : "bg-muted")}
          />
        ))}
      </div>
    </div>
  );
}