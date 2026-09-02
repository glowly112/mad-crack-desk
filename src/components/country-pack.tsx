import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import {
  countryPackBoxes,
  countryPackLine,
  countryPile,
  officeCountries,
  waffleCols,
} from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { CountryRow, PackBox } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

/** Treemap of waffles on desktop; wrap of squares on a phone so 1-recipe cells stay readable. */
export function CountryPack() {
  const stamp = useStamp();
  const countries = officeCountries(stamp.coverage, stamp.recipes);
  const piled = [...countries]
    .filter((c) => countryPile(c) > 0)
    .sort((a, b) => countryPile(b) - countryPile(a) || a.name.localeCompare(b.name));
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
      {piled.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <HugPack rows={piled} line={line} />
          <TreemapPack boxes={boxes} line={line} />
          <p className="mt-2 text-sm text-muted">{line}</p>
        </div>
      )}
    </section>
  );
}

function HugPack({ rows, line }: { rows: CountryRow[]; line: string }) {
  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-4 md:hidden" role="img" aria-label={line}>
      {rows.map((c, i) => {
        return (
          <article
            key={c.region}
            className="log-in"
            style={{ animationDelay: `${Math.min(i, 8) * 28}ms` }}
            aria-label={`${c.name}. ${c.line}`}
            title={`${c.name}. ${c.line}`}
          >
            <Waffle parked={c.parked} testing={c.testing} unit="1.25rem" />
            <p className="mt-1.5 max-w-[7.5rem] truncate text-xs leading-tight">{c.name}</p>
          </article>
        );
      })}
    </div>
  );
}

function TreemapPack({ boxes, line }: { boxes: PackBox[]; line: string }) {
  return (
    <div
      className="relative hidden aspect-[2/1] w-full md:block"
      role="img"
      aria-label={line}
    >
      {boxes.map((b, i) => (
        <article
          key={b.region}
          className="log-in absolute bg-elev"
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
          <div className="absolute inset-2 bottom-6">
            <Waffle parked={b.parked} testing={b.testing} fill />
          </div>
          <p className="pointer-events-none absolute inset-x-2 bottom-1.5 truncate text-xs leading-tight">
            {b.name}
          </p>
        </article>
      ))}
    </div>
  );
}

function Waffle({
  parked,
  testing,
  unit,
  fill,
}: {
  parked: number;
  testing: number;
  unit?: string;
  fill?: boolean;
}) {
  const n = parked + testing;
  const cols = waffleCols(n);
  const rows = Math.ceil(n / cols);
  const cells = [
    ...Array.from({ length: parked }, (_, i) => ({ key: `p${i}`, tone: "parked" as const })),
    ...Array.from({ length: testing }, (_, i) => ({ key: `t${i}`, tone: "test" as const })),
  ];
  const gap = 3;
  const u = fill
    ? `min(calc((100cqw - ${(cols - 1) * gap}px) / ${cols}), calc((100cqh - ${(rows - 1) * gap}px) / ${rows}))`
    : (unit ?? "1.25rem");

  return (
    <div className={cn(fill && "h-full w-full [container-type:size]")}>
      <div
        className={cn("grid place-content-center", fill && "h-full w-full")}
        style={{
          gap,
          gridTemplateColumns: `repeat(${cols}, var(--u))`,
          gridAutoRows: "var(--u)",
          ["--u" as string]: u,
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
