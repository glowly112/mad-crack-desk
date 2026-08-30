import { useRouterState } from "@tanstack/react-router";
import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { fieldBettingClass } from "@/lib/look";
import { cn } from "@/lib/utils";

/** System strip — fuse is a display of the stamp. Does not arm live. */
export function BettingStrip() {
  const stamp = useStamp();
  const look = useLook();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const floor = pathname === "/" || pathname.startsWith("/looks/");
  const on = stamp.fuse_on;

  if (look === "field" && floor) return null;

  if (look === "field") {
    return (
      <div
        role="status"
        data-glare="field-betting"
        className={cn("field-shell-strip", fieldBettingClass(on))}
      >
        <p className="field-shell-num">{on ? "ON" : "OFF"}</p>
        <p>
          Real betting
          {on ? null : <span> · paper only</span>}
        </p>
        <p className="field-shell-fuse">{stamp.fuse}</p>
      </div>
    );
  }

  if (look === "tape") {
    return (
      <div
        role="status"
        className={cn("tape-bet", on ? "is-on" : "is-off")}
      >
        <p>
          Real betting is{" "}
          <span className={cn("tape-chip", on ? "is-up" : "is-bad")}>{on ? "on" : "off"}</span>
          {on ? null : <span className="text-subtle"> Paper only.</span>}
        </p>
        <p className="font-mono text-xs text-subtle">{stamp.fuse}</p>
      </div>
    );
  }

  if (look === "ledger") {
    return (
      <div role="status" className="ledger-bet">
        <p>
          Real betting is <strong>{on ? "on" : "off"}</strong>
          {on ? null : ". Paper only."}
        </p>
        <p className="font-mono text-xs text-subtle">{stamp.fuse}</p>
      </div>
    );
  }

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
