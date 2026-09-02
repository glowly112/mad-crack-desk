import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { LiveDot } from "@/components/live-dot";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { seatWatching } from "@/lib/lab/boards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/staff/$id")({ component: Seat });

function Seat() {
  const { id } = Route.useParams();
  const stamp = useStamp();
  const s = stamp.seats.find((row) => row.id === id);
  if (!s) {
    return (
      <DetailShell backTo="/staff" backLabel="Staff">
        <p className="text-sm text-subtle">No seat on this stamp for that id.</p>
      </DetailShell>
    );
  }
  const tone = s.status === "RED" ? "bad" : s.status === "AMBER" ? "warn" : "ok";
  return (
    <DetailShell backTo="/staff" backLabel="Staff">
      <div className="flex items-center gap-4">
        <Portrait id={s.id} name={s.name} size="lg" />
        <div>
          <h1 className="text-2xl">{s.name}</h1>
          <p className="text-sm text-muted">{s.role}</p>
        </div>
      </div>
      <p className="flex items-center gap-2 font-mono text-sm">
        <LiveDot tone={tone} />
        <span className={cn(tone === "bad" && "text-bad", tone === "warn" && "text-warn")}>
          {s.status}
        </span>
        <span className="text-subtle">{s.cadence}</span>
      </p>
      <p className="text-sm">{seatWatching(s, stamp)}</p>
    </DetailShell>
  );
}
