import { useState } from "react";
import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { EmptyState } from "@/components/empty-state";
import { floorRacingSquare } from "@/lib/lab/boards";
import {
  axisDay,
  dailyDomain,
  dailyTicks,
  EMPTY,
  floorDayValue,
  floorFacts,
  seriesWindow,
  type FloorFact,
  type FloorFactId,
} from "@/lib/lab/desk";
import { cn, fmtScore } from "@/lib/utils";

export function PlantPane() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const scope = useDayScope();
  const [fact, setFact] = useState<FloorFactId>("paper");
  const holes = floorRacingSquare({ namedHoles: stamp.holes });
  const authOccupied = (stamp as { square_occupied_n?: number }).square_occupied_n;
  const paintedOccupied = holes.filter((h) => h.tone !== "empty").length;
  const occupiedN =
    authOccupied != null && authOccupied > paintedOccupied ? authOccupied : paintedOccupied;
  const emptyHoles = holes.length - occupiedN;
  const facts = floorFacts(stamp, scope, emptyHoles);
  const selected = facts.find((f) => f.id === fact) ?? facts[0];
  const live = plant.source === "oracle";

  return (
    <section className="space-y-4">
      <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
        <LiveDot tone={live ? "ok" : "warn"} tick={stamp.generated} />
        <span key={stamp.generated} className="stamp-tick">
          {live ? `${stamp.generated} · live oracle` : plant.detail}
        </span>
      </p>

      <div role="tablist" aria-label="Plant" className="flex flex-wrap border-b border-border">
        {facts.map((f) => (
          <FactCell key={f.id} fact={f} on={f.id === fact} onPick={() => setFact(f.id)} />
        ))}
      </div>

      <div>
        <header className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-medium text-muted">{selected?.label ?? "Paper"}</h2>
          <p className="font-mono text-xs text-subtle">
            {selected?.kind === "count" ? "on the square" : "u / day"}
          </p>
        </header>
        <DayChips days={stamp.trends.map((t) => t.day)} />
        <DailyBars fact={fact} />
      </div>
    </section>
  );
}

function FactCell({
  fact,
  on,
  onPick,
}: {
  fact: FloorFact;
  on: boolean;
  onPick: () => void;
}) {
  const empty = fact.value == null;
  const tone =
    fact.kind === "u" && !empty
      ? fact.value! >= 0
        ? "text-up"
        : "text-bad"
      : "text-fg";
  const display =
    fact.kind === "u"
      ? fmtScore(fact.value)
      : fact.value == null
        ? EMPTY
        : String(fact.value);
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onPick}
      className={cn(
        "min-w-[7rem] flex-1 border-r border-border px-3 py-3 text-left last:border-r-0",
        on && "shadow-[inset_0_-2px_0_0_var(--color-fg)]",
      )}
    >
      <p className="text-xs text-muted">{fact.label}</p>
      <p key={`${fact.id}-${fact.value}`} className={cn("log-in mt-1 font-mono text-2xl leading-none tracking-tight", tone)}>
        {display}
      </p>
      <p className="mt-1.5 text-[10px] text-subtle">{fact.hint}</p>
    </button>
  );
}

function DailyBars({ fact }: { fact: FloorFactId }) {
  const stamp = useStamp();
  const scope = useDayScope();
  const days = stamp.trends.map((t) => t.day);
  const points = seriesWindow(days, scope.day, (d) =>
    floorDayValue(
      fact,
      stamp.trends.find((t) => t.day === d),
    ),
  );
  const series = points
    .map((d) => stamp.trends.find((t) => t.day === d))
    .filter(Boolean) as typeof stamp.trends;
  const nums = series.map((p) => floorDayValue(fact, p));
  const vacant = fact === "holes" || nums.every((v) => v == null);
  if (vacant) {
    return (
      <div className="mt-3">
        <EmptyState copy={EMPTY} />
        <p className="mt-1 font-mono text-[10px] text-subtle">one bar · Empty stays Empty</p>
      </div>
    );
  }

  const w = 640;
  const h = 200;
  const padL = 34;
  const padR = 10;
  const padT = 16;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const [lo, hi] = dailyDomain(nums);
  const span = hi - lo || 1;
  const slot = innerW / Math.max(1, series.length);
  const xAt = (i: number) => padL + i * slot + slot / 2;
  const yAt = (v: number) => padT + innerH - ((v - lo) / span) * innerH;
  const y0 = yAt(0);
  const yTicks = dailyTicks([lo, hi]);

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-52 w-full max-w-full min-w-0 text-subtle"
        role="img"
        aria-label={`Daily ${fact}. Empty days stay Empty.`}
      >
        <text x={4} y={12} className="fill-subtle font-mono" fontSize="9">
          u
        </text>
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={padL}
              x2={w - padR}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="currentColor"
              strokeOpacity={tick === 0 ? 0.4 : 0.16}
              strokeDasharray={tick === 0 ? "2 4" : undefined}
            />
            <text
              x={padL - 5}
              y={yAt(tick) + 3}
              textAnchor="end"
              className="fill-subtle font-mono"
              fontSize="9"
            >
              {tick === 0 ? "0" : tick.toFixed(0)}
            </text>
          </g>
        ))}
        {series.map((p, i) => {
          const selected = p.day === scope.day;
          const v = floorDayValue(fact, p);
          const cx = xAt(i);
          const barW = Math.max(6, slot * 0.55);
          return (
            <g
              key={p.day}
              role="button"
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => scope.setDay(p.day)}
            >
              {v != null ? (
                <rect
                  className="bar-in"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: v >= 0 ? "center bottom" : "center top",
                    animationDelay: `${Math.min(i, 10) * 22}ms`,
                  }}
                  x={cx - barW / 2}
                  y={Math.min(yAt(v), y0)}
                  width={barW}
                  height={Math.max(2, Math.abs(yAt(v) - y0))}
                  fill={v >= 0 ? "var(--color-up)" : "var(--color-bad)"}
                  opacity={selected ? 1 : 0.72}
                />
              ) : null}
              <text
                x={cx}
                y={h - 8}
                textAnchor="middle"
                className={selected ? "fill-fg font-mono" : "fill-subtle font-mono"}
                fontSize="8"
              >
                {i === 0 || i === series.length - 1 || selected ? axisDay(p.day) : String(Number(p.day.slice(8)))}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 font-mono text-[10px] text-subtle">one bar · Empty stays Empty</p>
    </div>
  );
}
