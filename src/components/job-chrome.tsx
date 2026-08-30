import { Link } from "@tanstack/react-router";
import { useStamp } from "@/components/plant-context";
import { productionScore } from "@/lib/lab/hero";
import { cn, fmtU } from "@/lib/utils";

/** Compact 5-second job on every view except Floor. Not a four-chip row. */
export function JobChrome() {
  const stamp = useStamp();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const tone = u == null ? "text-fg" : u >= 0 ? "text-up" : "text-bad";

  return (
    <section className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-4">
      <p className="text-sm">
        <span className="text-muted">Production </span>
        <span className={cn("font-mono tabular-nums", tone)}>{fmtU(u)}</span>
        <span className="text-subtle">
          {" "}
          · {stamp.n_solid} solid · aim £{stamp.hero.aim_u}/day
        </span>
      </p>
      <Link
        to="/issues/$id"
        params={{ id: stamp.topBlocker.id }}
        className="text-sm transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        {stamp.topBlocker.action}
        <span className="text-subtle"> · {stamp.topBlocker.owner}</span>
      </Link>
    </section>
  );
}
