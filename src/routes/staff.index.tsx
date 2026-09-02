import { createFileRoute, Link } from "@tanstack/react-router";
import { FloorLog } from "@/components/floor-log";
import { LiveDot } from "@/components/live-dot";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { seatWatching } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/")({ component: StaffIndex });

function StaffIndex() {
  const stamp = useStamp();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Staff</h1>
        <p className="mt-1 text-sm text-muted">Who is watching the same bets.</p>
      </header>
      <ul className="divide-y divide-border border-y border-border">
        {stamp.seats.map((s) => {
          const tone = s.status === "RED" ? "bad" : s.status === "AMBER" ? "warn" : "ok";
          return (
            <li key={s.id}>
              <Link
                to="/staff/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <Portrait id={s.id} name={s.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <p>{s.name}</p>
                  <p className="text-sm text-subtle">{s.role}</p>
                  <p className="mt-1 text-sm">{seatWatching(s, stamp)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "inline-flex items-center gap-1.5 font-mono text-xs",
                      tone === "bad" && "text-bad",
                      tone === "warn" && "text-warn",
                      tone === "ok" && "text-up",
                    )}
                  >
                    <LiveDot tone={tone} />
                    {s.status}
                  </p>
                  <p className="font-mono text-xs text-subtle">{s.cadence}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <FloorLog />
    </div>
  );
}
