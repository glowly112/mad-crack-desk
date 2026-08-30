import { useStamp } from "@/components/plant-context";
import { productionScore } from "@/lib/lab/hero";
import { cn, fmtU } from "@/lib/utils";

export function HeroStrip() {
  const stamp = useStamp();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const tone = u == null ? "text-fg" : u >= 0 ? "text-up" : "text-bad";

  return (
    <section>
      <p className="text-sm text-muted">{stamp.hero.label}</p>
      <p className={cn("mt-2 font-mono text-6xl leading-none tracking-tight md:text-7xl", tone)}>
        {fmtU(u)}
      </p>
      <p className="mt-3 text-sm text-subtle">
        Aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs}
      </p>
    </section>
  );
}
