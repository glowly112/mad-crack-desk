import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { productionScore } from "@/lib/lab/hero";
import { tapeScoreClass } from "@/lib/look";
import { cn, fmtU } from "@/lib/utils";

export function HeroStrip() {
  const stamp = useStamp();
  const look = useLook();
  const u = productionScore({
    n_solid: stamp.n_solid,
    day_u: stamp.hero.day_u,
    researchKeepGbp: stamp.researchKeepGbp,
  });
  const tone =
    look === "tape"
      ? tapeScoreClass(u)
      : u == null
        ? "text-fg"
        : u >= 0
          ? "text-up"
          : "text-bad";

  return (
    <section>
      <p className="text-sm text-muted">{stamp.hero.label}</p>
      <p
        data-glare={look === "tape" ? "tape-score" : undefined}
        className={cn(
          "mt-2 font-mono text-6xl leading-none tracking-tight md:text-7xl",
          look === "tape" ? tone : tone,
        )}
      >
        {fmtU(u)}
      </p>
      <p className="mt-3 text-sm text-subtle">
        Aim £{stamp.hero.aim_u}/day · {stamp.hero.aim_vs}
      </p>
    </section>
  );
}
