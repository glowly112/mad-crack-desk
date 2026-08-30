import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { EmptyState } from "@/components/empty-state";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/staff/$id")({ component: Seat });

function Seat() {
  const { id } = Route.useParams();
  const stamp = useStamp();
  const s = stamp.seats.find((row) => row.id === id);
  if (!s) {
    return (
      <DetailShell backTo="/staff" backLabel="Staff">
        <EmptyState />
      </DetailShell>
    );
  }
  return (
    <DetailShell backTo="/staff" backLabel="Staff">
      <div className="flex items-center gap-4">
        <Portrait id={s.id} name={s.name} size="lg" />
        <div>
          <h1 className="text-2xl">{s.name}</h1>
          <p className="text-sm text-muted">
            {s.role} · {s.status} · {s.cadence}
          </p>
        </div>
      </div>
      <p className="text-sm">{s.now}</p>
    </DetailShell>
  );
}
