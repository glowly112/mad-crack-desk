import { bookStageLine, bookStages } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import type { Recipe } from "@/lib/lab/stamp";
import { cn, fmtU } from "@/lib/utils";

/** Invent → paper → holdout → production → live. Same bets, a split, or Empty. */
export function BookStageLine({ recipe }: { recipe: Recipe }) {
  const stages = bookStages(recipe);
  return (
    <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[10px] leading-snug text-subtle">
      {stages.map((s, i) => (
        <span key={s.key} className="inline-flex items-baseline gap-1">
          {i > 0 ? <span className="text-border-strong">/</span> : null}
          <span className="text-muted">{s.label}</span>
          <span className={cn(s.kind === "split" && "text-warn", s.kind === "empty" && "text-subtle")}>
            {stageMark(s)}
          </span>
        </span>
      ))}
      <span className="sr-only">{bookStageLine(stages)}</span>
    </p>
  );
}

function stageMark(s: ReturnType<typeof bookStages>[number]): string {
  if (s.kind === "empty") return EMPTY;
  if (s.kind === "split") return s.mark;
  if (s.n != null) {
    const units = s.key === "paper" ? ` ${fmtU(s.u)}` : s.key === "holdout" ? ` ${EMPTY}` : "";
    return `n=${s.n}${units}`;
  }
  return s.mark;
}
