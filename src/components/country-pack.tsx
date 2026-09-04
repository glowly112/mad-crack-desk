import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { HolePane } from "@/components/hole-pane";
import { useDayScope } from "@/components/day-scope";
import { useStamp } from "@/components/plant-context";
import { millDisplayRecipes } from "@/lib/lab/mill-display.ts";
import {
  SQUARE_WINDOW_LABEL,
  SQUARE_WINDOWS,
  countryMarket,
  floorRacingSquare,
  holeSideOccupied,
  inventHole,
  millHuntCaption,
  officeCountries,
  plantMarkets,
  racingSquare,
  squareGlanceLine,
  squareGridMarkets,
} from "@/lib/lab/boards";
import {
  scrubMillVoidNamedHoles,
  squareOpenFillsForPaint,
} from "@/lib/lab/junk-fills.ts";
import { EMPTY } from "@/lib/lab/desk";
import { holePaneDetail } from "@/lib/lab/hole-pane";
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

/** Morning board square: empty holes visible. BACK/LAY split on each WIN/PLACE cell. */
export function FloorSquare() {
  const stamp = useStamp();
  const scope = useDayScope();
  const [picked, setPicked] = useState<string | null>(null);
  const open = squareOpenFillsForPaint(stamp.trades);
  const holes = floorRacingSquare({
    namedHoles: scrubMillVoidNamedHoles(stamp.holes, stamp.trades),
    recipes: millDisplayRecipes(stamp.recipes),
    openFills: open.map((f) => ({
      id: f.id,
      recipeId: f.recipeId,
      recipe: f.recipe,
      side: f.side,
    })),
  });
  const markets = squareGridMarkets();
  const authOccupied = undefined;
  const paintedOccupied = holes.filter((h) => holeSideOccupied(h)).length;
  const occupiedN = paintedOccupied;
  const emptyN = holes.length - occupiedN;
  const glance = `${emptyN} empty of ${holes.length} holes on the square`;
  const paneCtx = {
    day: scope.day,
    recipes: stamp.recipes,
    trades: stamp.trades,
    inventWhy: stamp.office.inventWhy,
    seatNow: stamp.seats.find((s) => s.id === "invent")?.now ?? stamp.seats[0]?.now,
    hunters: stamp.hunters,
    rejects: stamp.office.rejects,
  };
  const selectedCell = picked ? holes.find((h) => h.id === picked) : undefined;
  const pane = picked ? holePaneDetail(picked, selectedCell, paneCtx) : null;

  return (
    <section>
      <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">The square</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
          <LegendDot tone="empty" label="Empty" />
          <LegendSide label="BACK" />
          <LegendSide label="LAY" split="right" />
          <LegendDot tone="win" label="solid" />
          <LegendDot tone="parked" label="parked" />
        </p>
      </header>
      {holes.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <div>
          <div role="img" aria-label={glance}>
            <SquareGrid
              holes={holes}
              markets={markets}
              picked={picked}
              onPick={setPicked}
              paneCtx={paneCtx}
            />
          </div>
          <p className="mt-2 text-sm text-muted">{glance}</p>
          {pane ? <HolePane detail={pane} /> : null}
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
  const markets = squareGridMarkets();
  const countries = countryMarket(officeCountries(stamp.coverage, millDisplayRecipes(stamp.recipes)));
  const authOccupied = undefined;
  const paintedOccupied = holes.filter((h) => holeSideOccupied(h)).length;
  const occupiedN = paintedOccupied;
  const cap = squareGlanceLine({
    occupied: occupiedN,
    n_solid: stamp.counts.certified,
    kill: stamp.counts.kill,
  });
  const inventWhy = millHuntCaption(stamp.office.inventWhy?.trim() ?? "", {
    mill_mode: (stamp as { mill_mode?: string }).mill_mode,
    mill_n_armed: (stamp as { mill_n_armed?: number }).mill_n_armed,
    n_armed: (stamp as { n_armed?: number }).n_armed,
  });
  const huntLine = /empty-hole hunt|invent_empty/i.test(inventWhy)
    ? inventWhy
    : (huntNotes.map(inventHole).find((n) => n !== EMPTY) ?? EMPTY);
  const emptyN = holes.length - occupiedN;
  const glance = `${emptyN} empty of ${holes.length} holes. WIN beside PLACE. ${cap}`;

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
            {emptyN} empty of {holes.length} holes. WIN beside PLACE.
          </p>
          <p className="mt-0.5 text-xs text-subtle">Square: {cap}</p>
          {huntLine !== EMPTY ? <p className="mt-0.5 text-xs text-subtle">{huntLine}</p> : null}
          <CountryRowList rows={countries} />
        </div>
      )}
    </section>
  );
}

function SquareGrid({
  holes,
  markets,
  picked,
  onPick,
  paneCtx,
}: {
  holes: readonly HoleCell[];
  markets: readonly SquareMarket[];
  picked?: string | null;
  onPick?: (id: string) => void;
  paneCtx?: {
    day: string;
    recipes: import("@/lib/lab/stamp").Recipe[];
    trades: import("@/lib/lab/trades").Fill[];
    inventWhy: string;
    seatNow?: string;
    hunters: readonly { note: string }[];
    rejects?: readonly string[];
  };
}) {
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
            {w === "in_play" ? (
              <span className="block text-[8px] font-normal normal-case text-subtle/80">sparse OK</span>
            ) : null}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-[3.4rem_repeat(4,minmax(0,1fr))] gap-px px-1.5 pb-1 sm:grid-cols-[5.75rem_repeat(4,minmax(0,1fr))] sm:px-2">
        <span />
        {SQUARE_WINDOWS.map((w) => (
          <div key={`${w}-mkt`} className="flex justify-center gap-1">
            {markets.map((m) => (
              <span key={m} className="w-4 text-center font-mono text-[9px] text-subtle">
                {m === "PLACE" ? "P" : "W"}
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
                  return (
                    <HoleSquare
                      key={market}
                      cell={cell}
                      regionName={name}
                      window={window}
                      market={market}
                      selected={picked === cell?.id}
                      onPick={onPick && cell ? () => onPick(cell.id) : undefined}
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

function HoleSquare({
  cell,
  regionName,
  window,
  market,
  selected,
  onPick,
}: {
  cell: HoleCell | undefined;
  regionName: string;
  window: (typeof SQUARE_WINDOWS)[number];
  market: SquareMarket;
  selected?: boolean;
  onPick?: () => void;
}) {
  const back = cell?.backTone ?? (cell?.tone !== "empty" ? cell?.tone : "empty") ?? "empty";
  const lay = cell?.layTone ?? "empty";
  const bothEmpty = back === "empty" && lay === "empty";
  const titleParts = [
    `${regionName} ${SQUARE_WINDOW_LABEL[window]} ${market}`,
    back !== "empty" ? `BACK · ${TONE_LABEL[back]}` : "BACK · Empty",
    lay !== "empty" ? `LAY · ${TONE_LABEL[lay]}` : "LAY · Empty",
  ];
  return (
    <button
      type="button"
      title={titleParts.filter(Boolean).join(" · ")}
      aria-label={titleParts.filter(Boolean).join(" · ")}
      aria-pressed={selected}
      onClick={onPick}
      className={cn(
        "relative inline-block size-4 rounded-[2px] transition-shadow",
        bothEmpty && TONE.empty,
        selected && "ring-2 ring-fg ring-offset-1 ring-offset-bg",
        onPick && "cursor-pointer hover:ring-1 hover:ring-border-strong",
      )}
    >
      {!bothEmpty ? (
        <>
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-1/2 rounded-l-[2px] ring-1 ring-inset ring-border/40",
              back !== "empty" ? TONE[back] : "bg-elev",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "absolute inset-y-0 right-0 w-1/2 rounded-r-[2px] ring-1 ring-inset ring-border/40",
              lay !== "empty" ? TONE[lay] : "bg-elev",
            )}
            aria-hidden
          />
        </>
      ) : null}
    </button>
  );
}

const markets = squareGridMarkets();

function LegendSide({ label, split }: { label: string; split?: "left" | "right" }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-block size-2 rounded-[1px] ring-1 ring-inset ring-border-strong" aria-hidden>
        <span
          className={cn(
            "absolute inset-y-0 w-1/2 bg-subtle",
            split === "right" ? "right-0" : "left-0",
          )}
        />
      </span>
      {label}
    </span>
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
