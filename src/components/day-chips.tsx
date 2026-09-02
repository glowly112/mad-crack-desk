import { useDayScope } from "@/components/day-scope";
import { axisDay } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export function DayChips({ days }: { days: readonly string[] }) {
  const { day, today, setDay } = useDayScope();
  const chips = [...days].reverse();

  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Day">
      {chips.map((d) => {
        const on = d === day;
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => setDay(d)}
            className={cn(
              "shrink-0 rounded-sm px-2.5 py-1.5 font-mono text-xs transition-colors duration-150",
              on ? "bg-elev text-fg" : "text-subtle hover:text-fg",
            )}
          >
            {d === today ? "Today" : axisDay(d)}
          </button>
        );
      })}
    </div>
  );
}
