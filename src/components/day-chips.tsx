import { useRef } from "react";
import { DeskScroll } from "@/components/desk-scroll";
import { useDayScope } from "@/components/day-scope";
import { axisDay } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export function DayChips({ days }: { days: readonly string[] }) {
  const { day, today, setDay } = useDayScope();
  const chips = [...days].reverse();
  const row = useRef<HTMLDivElement>(null);

  return (
    <DeskScroll axis="x" className="-mx-1">
      <div ref={row} className="flex w-max gap-1 px-1 pb-2" role="tablist" aria-label="Day">
        {chips.map((d) => {
          const on = d === day;
          return (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={(e) => {
                setDay(d);
                const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                e.currentTarget.scrollIntoView({
                  inline: "center",
                  block: "nearest",
                  behavior: reduce ? "instant" : "smooth",
                });
              }}
              className={cn(
                "chip-pick shrink-0 rounded-sm px-2.5 py-1.5 font-mono text-xs",
                on && "chip-on bg-elev text-fg",
                !on && "text-subtle hover:text-fg",
              )}
            >
              {d === today ? "Today" : axisDay(d)}
            </button>
          );
        })}
      </div>
    </DeskScroll>
  );
}
