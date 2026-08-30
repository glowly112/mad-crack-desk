import { LookLink } from "@/components/look-link";
import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { productionScore } from "@/lib/lab/hero";
import { tapeScoreClass } from "@/lib/look";
import { cn, fmtU } from "@/lib/utils";

/** Compact 5-second job on every view except Floor. Not a four-chip row. */
export function JobChrome() {
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
    <section className={cn("job-chrome", `look-${look}`)}>
      <p className="text-sm">
        <span className="text-muted">Production </span>
        <span
          data-glare={look === "tape" ? "tape-score" : undefined}
          className={cn("font-mono tabular-nums", tone)}
        >
          {fmtU(u)}
        </span>
        <span className="text-subtle">
          {" "}
          · {stamp.n_solid} solid · aim £{stamp.hero.aim_u}/day
        </span>
      </p>
      <LookLink
        to="/issues/$id"
        params={{ id: stamp.topBlocker.id }}
        className={look === "ledger" ? "ledger-send ledger-send-sm" : "job-next"}
      >
        {stamp.topBlocker.action}
        <span className="text-subtle"> · {stamp.topBlocker.owner}</span>
      </LookLink>
    </section>
  );
}
