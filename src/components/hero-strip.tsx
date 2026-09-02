import { DayChips } from "@/components/day-chips";
import { useDayScope } from "@/components/day-scope";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { EmptyState } from "@/components/empty-state";
import { axisDay, chartWindow, dailyDomain, EMPTY } from "@/lib/lab/desk";
import { productionScore } from "@/lib/lab/hero";
import { cn, fmtAim, fmtScore } from "@/lib/utils";

export function HeroStrip() {
  const stamp = useStamp();
  const plant = usePlantSource();
  const scope = useDayScope();
  const trend = stamp.trends.find((t) => t.day === scope.day);
  const u = scope.lookingBack
    ? (trend?.paper_live_day_u ?? null)
    : productionScore({
        n_solid: stamp.n_solid,
        day_u: stamp.hero.day_u,
        researchKeepGbp: stamp.researchKeepGbp,
      });
  const solids = scope.lookingBack ? (trend?.n_solid ?? 0) : stamp.n_solid;
  const empty = u == null;
  const tone = empty ? "text-fg" : u >= 0 ? "text-up" : "text-bad";
  const live = plant.source === "oracle";

  return (
    <section className="space-y-4">
      <p className="inline-flex items-center gap-2 font-mono text-xs text-subtle">
        <LiveDot tone={live ? "ok" : "warn"} tick={stamp.generated} />
        <span key={stamp.generated} className="stamp-tick">
          {live ? `${stamp.generated} · live oracle` : plant.detail}
        </span>
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-sm text-muted">
            {scope.lookingBack ? `${axisDay(scope.day)} production` : "Today's production"}
          </p>
          <p
            key={scope.day}
            className={cn("log-in mt-1 font-mono text-5xl leading-none tracking-tight md:text-6xl", tone)}
          >
            {fmtScore(u)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">Aim</p>
          <p className="mt-1 font-mono text-5xl leading-none tracking-tight text-fg md:text-6xl">
            {fmtAim(stamp.hero.aim_u)}
          </p>
          <p className="mt-2 text-xs text-subtle">/day · {stamp.hero.aim_vs}</p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <p className="text-sm text-muted">Solids</p>
          <p className="mt-1 font-mono text-5xl leading-none tracking-tight text-fg md:text-6xl">
            {solids}
          </p>
          <p className="mt-2 text-xs text-subtle">certified production</p>
        </div>
      </div>
    </section>
  );
}

export function ScoreChart() {
  const stamp = useStamp();
  const days = stamp.trends.map((t) => t.day);
  return (
    <section className="min-w-0">
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Production</h2>
        <p className="font-mono text-xs text-subtle">u / day · aim {fmtAim(stamp.hero.aim_u)}</p>
      </header>
      <DayChips days={days} />
      <DailyBars />
    </section>
  );
}

function DailyBars() {
  const stamp = useStamp();
  const scope = useDayScope();
  const aim = stamp.hero.aim_u;
  const points = chartWindow(stamp.trends, scope.day, 8);
  const series = points
    .map((d) => stamp.trends.find((t) => t.day === d))
    .filter(Boolean) as typeof stamp.trends;
  const nums = series.map((p) => p.paper_live_day_u);
  const vacant = nums.every((v) => v == null);
  if (vacant) {
    return (
      <div className="mt-3">
        <EmptyState copy={EMPTY} />
        <p className="mt-1 font-mono text-[10px] text-subtle">aim {aim}u · no production days on screen</p>
      </div>
    );
  }

  const w = 360;
  const h = 200;
  const padL = 34;
  const padR = 10;
  const padT = 16;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const [lo, hi] = dailyDomain(nums, aim);
  const span = hi - lo || 1;
  const slot = innerW / Math.max(1, series.length);
  const xAt = (i: number) => padL + i * slot + slot / 2;
  const yAt = (v: number) => padT + innerH - ((v - lo) / span) * innerH;
  const y0 = yAt(0);
  const yTicks = [lo, 0, aim].filter((v, i, a) => Number.isFinite(v) && a.indexOf(v) === i);

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-52 w-full max-w-full min-w-0 text-subtle"
        role="img"
        aria-label="Daily production units. Empty days stay Empty. Aim 100u is marked."
      >
        <text x={4} y={12} className="fill-subtle font-mono" fontSize="9">
          u
        </text>
        {yTicks.map((tick) => {
          const aimTick = tick === aim;
          return (
            <g key={`y-${tick}`}>
              <line
                x1={padL}
                x2={w - padR}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke={aimTick ? "var(--color-warn)" : "currentColor"}
                strokeOpacity={aimTick ? 0.85 : tick === 0 ? 0.4 : 0.16}
                strokeDasharray={aimTick ? "4 3" : tick === 0 ? "2 4" : undefined}
              />
              <text
                x={padL - 5}
                y={yAt(tick) + 3}
                textAnchor="end"
                className={aimTick ? "fill-warn font-mono" : "fill-subtle font-mono"}
                fontSize="9"
              >
                {tick === 0 ? "0" : tick.toFixed(0)}
              </text>
            </g>
          );
        })}
        {series.map((p, i) => {
          const selected = p.day === scope.day;
          const v = p.paper_live_day_u;
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
      <p className="mt-1 font-mono text-[10px] text-subtle">one bar · Empty stays Empty · aim {aim}u marked</p>
    </div>
  );
}
