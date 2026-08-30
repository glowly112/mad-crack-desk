import { useStamp } from "@/components/plant-context";

/** Stamp trend spark — display only. Does not invent a score. */
export function TapeSpark({ className }: { className?: string }) {
  const stamp = useStamp();
  const values = stamp.trends.map((p) => p.paper_live_day_u);
  const present = values.filter((v): v is number => typeof v === "number");
  const w = 220;
  const h = 56;
  const min = present.length ? Math.min(0, ...present) : 0;
  const max = present.length ? Math.max(stamp.hero.aim_u, ...present) : stamp.hero.aim_u;
  const span = max - min || 1;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  let started = false;
  const d = values
    .map((v, i) => {
      if (v == null) {
        started = false;
        return "";
      }
      const x = i * step;
      const y = h - ((v - min) / span) * (h - 8) - 4;
      const cmd = started ? "L" : "M";
      started = true;
      return `${cmd}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function MiniSpark({
  values,
  tone = "mute",
}: {
  values: readonly (number | null)[];
  tone?: "up" | "bad" | "mute";
}) {
  const present = values.filter((v): v is number => typeof v === "number");
  const w = 72;
  const h = 28;
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 1;
  const span = max - min || 1;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const d = values
    .map((v, i) => {
      const n = v ?? min;
      const x = i * step;
      const y = h - ((n - min) / span) * (h - 6) - 3;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="tape-mini-spark" data-tone={tone} aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
