import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStamp } from "@/components/plant-context";
import { productionDomain } from "@/lib/lab/desk";
import { fmtU } from "@/lib/utils";

export const Route = createFileRoute("/trends")({ component: Trends });

function Trends() {
  const stamp = useStamp();
  const [showPile, setShowPile] = useState(false);
  const points = stamp.trends.map((p) => ({
    ...p,
    label: p.day.slice(5),
  }));
  const domain = productionDomain(
    stamp.trends.map((p) => p.paper_live_day_u),
    stamp.hero.aim_u,
  );

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Trends</h1>
        <p className="mt-1 text-sm text-muted">
          Production score and conversion counts. Research pile stays behind a tap.
        </p>
      </header>

      <ChartBlock title="Today's production score" sub="Solid recipes only. Still paper. Aim £100/day on the axis.">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-subtle)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              domain={domain}
              stroke="var(--color-subtle)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ReferenceLine y={stamp.hero.aim_u} stroke="var(--color-subtle)" strokeDasharray="3 4" />
            <Tooltip
              contentStyle={{
                background: "var(--color-elev)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
              formatter={(v) => fmtU(typeof v === "number" ? v : null)}
            />
            <Line
              type="monotone"
              dataKey="paper_live_day_u"
              stroke="var(--color-up)"
              strokeWidth={1.8}
              dot={{ r: 3, fill: "var(--color-up)" }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartBlock>

      <ChartBlock title="Conversion" sub="Keeps, proving, dropped — counts, not £.">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-subtle)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--color-subtle)" fontSize={11} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{
                background: "var(--color-elev)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            />
            <Line type="monotone" dataKey="n_keep" stroke="var(--color-fg)" strokeWidth={1.6} dot={false} />
            <Line type="monotone" dataKey="n_measuring" stroke="var(--color-muted)" strokeWidth={1.6} dot={false} />
            <Line type="monotone" dataKey="n_dropped" stroke="var(--color-bad)" strokeWidth={1.4} dot={false} />
            <Line type="monotone" dataKey="n_solid" stroke="var(--color-up)" strokeWidth={1.8} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <ul className="mt-3 flex flex-wrap gap-4 font-mono text-xs text-muted">
          <li>Keep</li>
          <li>Measuring</li>
          <li className="text-bad">Dropped</li>
          <li className="text-up">Solid</li>
        </ul>
      </ChartBlock>

      <div>
        <button
          type="button"
          onClick={() => setShowPile((s) => !s)}
          className="min-h-11 rounded-sm border border-border px-4 text-sm text-muted transition-transform duration-150 ease-out active:scale-[0.96]"
        >
          {showPile ? "Hide research pile" : "Show research pile"}
        </button>
      </div>

      {showPile ? (
        <ChartBlock title="Research pile" sub="Research — not the score. Factory day P&L.">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={points}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--color-subtle)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-subtle)" fontSize={11} width={40} tickLine={false} axisLine={false} />
              <Line
                type="monotone"
                dataKey="factory_day_pnl_u"
                stroke="var(--color-muted)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBlock>
      ) : null}
    </div>
  );
}

function ChartBlock({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium text-muted">{title}</h2>
      <p className="mb-3 text-xs text-subtle">{sub}</p>
      {children}
    </section>
  );
}
