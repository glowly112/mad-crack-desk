import { useStamp } from "@/components/plant-context";
import { productionScore } from "@/lib/lab/hero";
import type { LiveStamp } from "@/lib/lab/from-digest";
import { fmtU } from "@/lib/utils";

export function HeroStrip() {
  const stamp = useStamp();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const tone = u == null ? "text-muted" : u >= 0 ? "text-up" : "text-bad";

  return (
    <section>
      <p className="text-sm text-muted">{stamp.hero.label}</p>
      <p className={`mt-1 font-mono text-6xl leading-none tracking-tight md:text-7xl ${tone}`}>
        {fmtU(u)}
      </p>
      <p className="mt-3 text-sm text-subtle">
        Aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs} · solids {stamp.n_solid}
      </p>
    </section>
  );
}

export function ScoreChart() {
  const stamp = useStamp();
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-muted">Production</h2>
      <Spark series={stamp.trends} />
    </section>
  );
}

function Spark({ series }: { series: LiveStamp["trends"] }) {
  const w = 360;
  const h = 176;
  const padL = 36;
  const padR = 8;
  const padT = 10;
  const padB = 24;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const nums = series.map((p) => p.paper_live_day_u);
  const present = nums.filter((v): v is number => v != null);
  const lo = Math.min(0, ...present, -1);
  const hi = Math.max(0, ...present, 1);
  const span = hi - lo || 1;
  const xAt = (i: number) => padL + (i / Math.max(1, nums.length - 1)) * innerW;
  const yAt = (v: number) => padT + innerH - ((v - lo) / span) * innerH;
  const pts = nums
    .map((v, i) => (v == null ? null : `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`))
    .filter((p): p is string => p != null);
  const yTicks = [hi, 0, lo].filter((v, i, a) => a.indexOf(v) === i);
  const xTicks = [0, Math.floor((series.length - 1) / 2), series.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-44 w-full max-w-full min-w-0 text-subtle"
      role="img"
      aria-label="Paper live day units from 19 Aug to 29 Aug"
    >
      {yTicks.map((tick) => (
        <g key={`y-${tick}`}>
          <line
            x1={padL}
            x2={w - padR}
            y1={yAt(tick)}
            y2={yAt(tick)}
            stroke="currentColor"
            strokeOpacity={tick === 0 ? 0.4 : 0.16}
            strokeDasharray={tick === 0 ? "3 4" : undefined}
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
          y={h - 6}
          textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
          className="fill-subtle font-mono"
          fontSize="9"
        >
          {series[i].day.slice(8)}
        </text>
      ))}
      {pts.length > 1 ? (
        <polyline
          fill="none"
          stroke="var(--color-up)"
          strokeWidth="1.5"
          className="spark-draw"
          points={pts.join(" ")}
        />
      ) : null}
    </svg>
  );
}
