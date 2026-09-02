import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { HUNTER_MARKS } from "@/components/marks";
import { useStamp } from "@/components/plant-context";
import { hunterName, hunterWork } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";

export const Route = createFileRoute("/hunters/$id")({ component: Hunter });

function Hunter() {
  const { id } = Route.useParams();
  const stamp = useStamp();
  const h = stamp.hunters.find((row) => row.id === id) ?? null;
  if (!h) {
    return (
      <DetailShell backTo="/office" backLabel="Office">
        <p className="text-sm text-subtle">{EMPTY}</p>
      </DetailShell>
    );
  }
  const Icon = HUNTER_MARKS[h.id as keyof typeof HUNTER_MARKS];
  const work = hunterWork(h.note);
  return (
    <DetailShell backTo="/office" backLabel="Office">
      <div className="flex items-center gap-3">
        {Icon ? <Icon className="size-8 text-muted" /> : null}
        <h1 className="text-2xl">{hunterName(h.id)}</h1>
      </div>
      <p className="text-sm">{work}</p>
    </DetailShell>
  );
}
