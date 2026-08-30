import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { EmptyState } from "@/components/empty-state";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/hunters/$id")({ component: Hunter });

function Hunter() {
  const { id } = Route.useParams();
  const stamp = useStamp();
  const h = stamp.hunters.find((row) => row.id === id) ?? null;
  if (!h) {
    return (
      <DetailShell backTo="/office" backLabel="Office">
        <EmptyState />
      </DetailShell>
    );
  }
  const Icon = HUNTER_MARKS[h.id as keyof typeof HUNTER_MARKS];
  const off = h.state !== "FLOWING";
  return (
    <DetailShell backTo="/office" backLabel="Office">
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="size-8 text-muted" /> : null}
        <h1 className="text-2xl capitalize">{h.id}</h1>
      </div>
      <p className="flex items-center gap-2 font-mono text-sm">
        <LiveDot tone={off ? "warn" : "ok"} />
        <span className="text-muted">{h.state}</span>
      </p>
      <p className="text-sm">{h.note}</p>
    </DetailShell>
  );
}
