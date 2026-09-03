import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import {
  SQUARE_WINDOW_LABEL,
  SQUARE_WINDOWS,
  capitalisingLine,
  countryMarket,
  floorRacingSquare,
  inventHole,
  officeCountries,
  plantMarkets,
  racingSquare,
} from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { CountryRow, HoleCell, MarketSquare, SquareMarket } from "@/lib/lab/boards";
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
  empty: "Empty",
  hunt: "looking",
  idea: "still being tested",
  win: "solid",
  loss: "killed",
  parked: "parked",
};

/** Morning board square: empty holes visible. No mill roll-up or invent lines. */
export function FloorSquare() {
  const stamp = useStamp();
  const holes = floorRacingSquare({ namedHoles: stamp.holes });
  const markets = plantMarkets(holes.map((h) => h.market));
  const authOccupied = (stamp as { square_occupied_n?: number }).square_occupied_n;
  const paintedOccupied = holes.filter((h) => h.tone !== "empty").length;
  const occupiedN =
    authOccupied != null && authOccupied > paintedOccupied ? authOccupied : paintedOccupied;
  const emptyN = holes.length - occupiedN;
  const glance = `${emptyN} empty of ${holes.length} holes on the square`;

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">The square</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <LegendDot tone="empty" label="Empty" />
          <LegendDot tone="win" label="solid" />
          <LegendDot tone="parked" label="parked" />
          <LegendDot tone="loss" label="killed" />
        </p>
      </header>
      {holes.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div role="img" aria-label={glance}>
          <SquareGrid holes={holes} markets={markets} />
          <p className="mt-2 text-sm text-muted">{glance}</p>
        </div>
      )}
    </section>
  );
}

/** Whole racing square: country × window × WIN beside PLACE. Empty is area. */
export function CountryPack() {
  const stamp = useStamp();
  const huntNotes = [stamp.office.inventWhy, ...stamp.hunters.map((h) => h.note)];
  const holes = racingSquare({
    recipes: stamp.recipes,
    coverage: stamp.coverage,
    moves: stamp.moves,
    floorLog: stamp.floorLog,
    huntNotes,
    namedHoles: stamp.holes,
  });
  const markets = plantMarkets(holes.map((h) => h.market));
  const countries = countryMarket(officeCountries(stamp.coverage, stamp.recipes));
  const cap = capitalisingLine(stamp.counts);
  const hole =
    huntNotes.map(inventHole).find((n) => n !== EMPTY) ?? EMPTY;
  const emptyN = holes.filter((h) => h.tone === "empty").length;
  const glance = `${holes.length} holes. ${emptyN} Empty. WIN beside PLACE. ${cap}`;

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">The square</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <LegendDot tone="empty" label="Empty" />
          <LegendDot tone="hunt" label="looking" />
          <LegendDot tone="loss" label="killed" />
          <LegendDot tone="idea" label="still being tested" />
          <LegendDot tone="parked" label="parked" />
          <LegendDot tone="win" label="solid" />
        </p>
      </header>
      {holes.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <div role="img" aria-label={glance}>
            <SquareGrid holes={holes} markets={markets} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {emptyN} Empty of {holes.length} holes. WIN beside PLACE.
          </p>
          <p className="mt-0.5 text-xs text-subtle">Opened mill: {cap}</p>
          {hole !== EMPTY ? <p className="mt-0.5 text-xs text-subtle">Looking at {hole}.</p> : null}
          <CountryRowList rows={countries} />
        </div>
      )}
    </section>
  );
}

function SquareGrid({ holes, markets }: { holes: readonly HoleCell[]; markets: readonly SquareMarket[] }) {
  const byId = new Map(holes.map((h) => [h.id, h]));
  const regions = [...new Set(holes.map((h) => h.region))];
  return (
    <div className="border border-border bg-bg">
      <div
        className="grid grid-cols-[3.4rem_repeat(4,minmax(0,1fr))] items-end gap-px px-1.5 pt-2 sm:grid-cols-[5.75rem_repeat(4,minmax(0,1fr))] sm:px-2"
      >
        <span />
        {SQUARE_WINDOWS.map((w) => (
          <p key={w} className="text-center font-mono text-[9px] leading-tight text-subtle sm:text-[10px]">
            {SQUARE_WINDOW_LABEL[w]}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-[3.4rem_repeat(4,minmax(0,1fr))] gap-px px-1.5 pb-1 sm:grid-cols-[5.75rem_repeat(4,minmax(0,1fr))] sm:px-2">
        <span />
        {SQUARE_WINDOWS.map((w) => (
          <div key={`${w}-mkt`} className="flex justify-center gap-1">
            {markets.map((m) => (
              <span key={m} className="w-4 text-center font-mono text-[9px] text-subtle">
                {m === "PLACE" ? "P" : m === "LAY" ? "L" : "W"}
              </span>
            ))}
          </div>
        ))}
      </div>
      {regions.map((region) => {
        const name = holes.find((h) => h.region === region)?.name ?? region;
        return (
          <div
            key={region}
            className="grid grid-cols-[3.4rem_repeat(4,minmax(0,1fr))] items-center gap-px border-t border-border px-1.5 py-1.5 sm:grid-cols-[5.75rem_repeat(4,minmax(0,1fr))] sm:px-2"
          >
            <p className="truncate text-xs" title={name}>
              {name}
            </p>
            {SQUARE_WINDOWS.map((window) => (
              <div key={`${region}-${window}`} className="flex justify-center gap-1">
                {markets.map((market) => {
                  const cell = byId.get(`${region}|${window}|${market}`);
                  const tone = cell?.tone ?? "empty";
                  return (
                    <span
                      key={market}
                      title={`${name} ${SQUARE_WINDOW_LABEL[window]} ${market} · ${TONE_LABEL[tone]}`}
                      className={cn("size-4 rounded-[2px]", TONE[tone])}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
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
