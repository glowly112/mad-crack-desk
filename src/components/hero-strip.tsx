import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import {
  axisDay,
  chartDayTicks,
  productionDomain,
  productionSegments,
  productionTicks,
} from "@/lib/lab/desk";
import { productionScore } from "@/lib/lab/hero";
import type { LiveStamp } from "@/lib/lab/from-digest";
import { cn, fmtScore } from "@/lib/utils";

export function HeroStrip() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const empty = u == null;
  const tone = empty ? "text-fg" : u >= 0 ? "text-up" : "text-bad";
  const live = plant.source === "oracle";

  return (
    <section className="space-y-4">
      <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
        <LiveDot tone={live ? "ok" : "warn"} />
        {live ? `${stamp.generated} · live oracle` : plant.detail}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted">Today's production</p>
          <p className={cn("mt-1 font-mono text-5xl leading-none tracking-tight md:text-6xl", tone)}>
            {fmtScore(u)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Aim</p>
          <p className="mt-1 font-mono text-5xl leading-none tracking-tight text-fg md:text-6xl">
            £{stamp.hero.aim_u}
          </p>
          <p className="mt-2 text-xs text-subtle">/day · {stamp.hero.aim_vs}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-sm text-muted">Solids</p>
          <p className="mt-1 font-mono text-5xl leading-none tracking-tight text-fg md:text-6xl">
            {stamp.n_solid}
          </p>
          <p className="mt-2 text-xs text-subtle">certified production</p>
        </div>
      </div>
    </section>
  );
}

export function ScoreChart() {
  const stamp = useStamp();
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Production</h2>
        <p className="font-mono text-xs text-subtle">u / day · aim £{stamp.hero.aim_u}</p>
      </header>
      <Spark series={stamp.trends} aim={stamp.hero.aim_u} />
    </section>
  );
}

function Spark({ series, aim }: { series: LiveStamp["trends"]; aim: number }) {
  const w = 360;
  const h = 220;
  const padL = 36;
  const padR = 28;
  const padT = 14;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const nums = series.map((p) => p.paper_live_day_u);
  const [lo, hi] = productionDomain(nums, aim);
  const span = hi - lo || 1;
  const xAt = (i: number) => padL + (i / Math.max(1, series.length - 1)) * innerW;
  const yAt = (v: number) => padT + innerH - ((v - lo) / span) * innerH;
  const yTicks = productionTicks([lo, hi], aim);
  const xTicks = chartDayTicks(series);
  const segs = productionSegments(series);
  const dots = segs.flat();

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-56 w-full max-w-full min-w-0 text-subtle"
        role="img"
        aria-label="Production units by day versus aim"
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
              strokeOpacity={tick === 0 || tick === aim ? 0.38 : 0.12}
              strokeDasharray={tick === aim ? "3 5" : tick === 0 ? "2 4" : undefined}
            />
            <text
              x={padL - 6}
              y={yAt(tick) + 3}
              textAnchor="end"
              className="fill-subtle font-mono"
              fontSize="9"
            >
              {tick === 0 ? "0" : tick.toFixed(0)}
            </text>
          </g>
        ))}
        <text
          x={w - padR + 4}
          y={yAt(aim) + 3}
          className="fill-subtle font-mono"
          fontSize="9"
        >
          aim
        </text>
        <line
          x1={padL}
          x2={padL}
          y1={padT}
          y2={h - padB}
          stroke="currentColor"
          strokeOpacity="0.28"
        />
        <line
          x1={padL}
          x2={w - padR}
          y1={h - padB}
          y2={h - padB}
          stroke="currentColor"
          strokeOpacity="0.28"
        />
        {xTicks.map((i) => (
          <text
            key={`x-${series[i].day}`}
            x={xAt(i)}
            y={h - 8}
            textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
            className="fill-subtle font-mono"
            fontSize="9"
          >
            {axisDay(series[i].day)}
          </text>
        ))}
        {segs.map((seg, si) =>
          seg.length > 1 ? (
            <polyline
              key={`seg-${seg[0].i}-${seg[seg.length - 1].i}`}
              fill="none"
              stroke="var(--color-up)"
              strokeWidth="1.7"
              className={si === 0 ? "spark-draw" : undefined}
              points={seg.map((p) => `${xAt(p.i).toFixed(1)},${yAt(p.v).toFixed(1)}`).join(" ")}
            />
          ) : null,
        )}
        {dots.map((p) => (
          <circle
            key={`dot-${p.i}`}
            cx={xAt(p.i)}
            cy={yAt(p.v)}
            r="2.2"
            fill="var(--color-up)"
          />
        ))}
      </svg>
      <ul className="mt-1 flex flex-wrap gap-4 font-mono text-[10px] text-subtle">
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block h-px w-3 bg-up" aria-hidden="true" />
          production
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3 border-t border-dashed border-subtle" aria-hidden="true" />
          aim
        </li>
      </ul>
    </div>
  );
}
