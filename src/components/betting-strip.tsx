import { useStamp } from "@/components/plant-context";
import { LiveDot } from "@/components/live-dot";
import { cn } from "@/lib/utils";

/** Fuse display only. Does not arm live betting. */
export function BettingStrip({ loud }: { loud?: boolean }) {
  const stamp = useStamp();
  const on = stamp.fuse_on;

  return (
    <div
      role="status"
      className={cn(
        "flex items-center justify-between gap-3 border border-border px-4 py-3",
        loud ? "rounded-md bg-elev" : "border-x-0 border-t-0",
        on ? "text-muted" : "bg-elev",
      )}
    >
      <p className={cn("inline-flex items-center gap-2 text-sm", on ? "text-fg" : "text-warn")}>
        <LiveDot tone={on ? "ok" : "warn"} />
        <span>
          Real betting is <span className="font-medium">{on ? "ON" : "OFF"}</span>
          {on ? null : <span className="text-subtle"> · paper only</span>}
        </span>
      </p>
      <p className="shrink-0 font-mono text-xs text-subtle">{stamp.clerk}</p>
    </div>
  );
}
