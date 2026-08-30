import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

/** System strip — fuse is a display of the stamp. Does not arm live. */
export function BettingStrip() {
  const stamp = useStamp();
  const on = stamp.fuse_on;

  return (
    <div
      role="status"
      className={cn(
        "flex min-h-10 items-center justify-between gap-3 border-b border-border px-4 py-2 text-sm md:px-6",
        on ? "bg-surface text-muted" : "bg-elev text-muted",
      )}
    >
      <p>
        Real betting is{" "}
        <span className={cn("font-medium", on ? "text-fg" : "text-warn")}>{on ? "on" : "off"}</span>
        {on ? null : <span className="text-subtle">. Paper only.</span>}
      </p>
      <p className="shrink-0 font-mono text-xs text-subtle">{stamp.fuse}</p>
    </div>
  );
}
