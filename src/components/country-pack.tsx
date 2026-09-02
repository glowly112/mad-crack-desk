import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { capitalisingLine, marketGlance, sizeMarket, sizePackBoxes, waffleCols } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { MarketSquare, SizeBox } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

const TONE: Record<MarketSquare["tone"], string> = {
  win: "bg-fg",
  idea: "bg-warn",
  loss: "bg-bad",
  parked: "bg-muted",
};

/** One market sized by measured n. Colour is win / idea / loss / parked. */
export function CountryPack() {
  const stamp = useStamp();
  const countries = sizeMarket(stamp.coverage, stamp.recipes, stamp.moves, stamp.floorLog);
  const boxes = sizePackBoxes(countries);
  const glance = marketGlance(countries, stamp.counts);
  const cap = capitalisingLine(stamp.counts);

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">By country</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <LegendDot tone="win" label="solid" />
          <LegendDot tone="idea" label="still being tested" />
          <LegendDot tone="parked" label="parked" />
          <LegendDot tone="loss" label="killed" />
        </p>
      </header>
      {boxes.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <div
            className="relative aspect-[2/1] w-full border border-border bg-elev"
            role="img"
            aria-label={glance}
          >
            {boxes.map((b, i) => (
              <Cluster key={b.region} box={b} delay={i} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">{cap}</p>
          {countries.some((c) => c.empty) ? (
            <p className="mt-0.5 text-xs text-subtle">
              {countries
                .filter((c) => c.empty)
                .map((c) => `${c.name} Empty`)
                .join(". ")}
              .
            </p>
          ) : null}
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

function Cluster({ box, delay }: { box: SizeBox; delay: number }) {
  return (
    <article
      className="log-in absolute min-w-0 px-2 py-1.5"
      style={{
        left: `calc(${box.x}% + 1px)`,
        top: `calc(${box.y}% + 1px)`,
        width: `calc(${box.w}% - 2px)`,
        height: `calc(${box.h}% - 2px)`,
        animationDelay: `${Math.min(delay, 8) * 28}ms`,
      }}
      aria-label={`${box.name}. ${box.empty ? EMPTY : box.caption || `n=${box.n}`}`}
      title={`${box.name}${box.caption ? ` · ${box.caption}` : ""}`}
    >
      {box.empty ? (
        <p className="text-xs text-subtle">{EMPTY}</p>
      ) : (
        <Waffle squares={box.squares} />
      )}
      <p className="mt-1 truncate text-xs leading-tight">{box.name}</p>
      {box.caption ? <p className="truncate font-mono text-[10px] text-subtle">{box.caption}</p> : null}
    </article>
  );
}

function Waffle({ squares }: { squares: MarketSquare[] }) {
  if (!squares.length) return null;
  const cols = waffleCols(squares.length);
  return (
    <div
      className="grid gap-[3px]"
      style={{
        gridTemplateColumns: `repeat(${cols}, 0.85rem)`,
        gridAutoRows: "0.85rem",
      }}
    >
      {squares.map((s) => (
        <span key={s.id} className={cn("block rounded-[2px]", TONE[s.tone])} />
      ))}
    </div>
  );
}
