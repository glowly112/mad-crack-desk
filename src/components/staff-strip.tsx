import { Link } from "@tanstack/react-router";
import { LiveDot } from "@/components/live-dot";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { floorSeats } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

/** Clerk / Foreman / mill watching lines from the same stamp. */
export function StaffStrip() {
  const stamp = useStamp();
  const seats = floorSeats(stamp.seats);

  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-muted">Watching</h2>
        <Link to="/staff" className="text-xs text-subtle transition-transform duration-150 ease-out hover:text-fg active:scale-[0.96]">
          All staff
        </Link>
      </header>
      <ul className="divide-y divide-border border-y border-border">
        {seats.map((s) => {
          const tone = s.status === "RED" ? "bad" : s.status === "AMBER" ? "warn" : "ok";
          return (
            <li key={s.id}>
              <Link
                to="/staff/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 py-2.5 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <Portrait id={s.id} name={s.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {s.name}
                    <span className="text-subtle"> · {s.role}</span>
                  </p>
                  <p className="truncate font-mono text-xs text-muted">{s.now || "Empty"}</p>
                </div>
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
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
