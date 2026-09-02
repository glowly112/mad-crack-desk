import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { useStamp } from "@/components/plant-context";
import { recipeStatus } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/holdings/$id")({ component: Holding });

function Holding() {
  const { id } = Route.useParams();
  const stamp = useStamp();
  const r = stamp.recipes.find((row) => row.id === id) ?? null;
  if (!r) {
    return (
      <DetailShell backTo="/" backLabel="Floor">
        <p className="text-sm text-subtle">{EMPTY}</p>
      </DetailShell>
    );
  }
  return (
    <DetailShell backTo="/" backLabel="Floor">
      <p className="font-mono text-xs text-subtle">{r.id}</p>
      <h1 className="text-2xl">{r.title}</h1>
      <dl className="divide-y divide-border border-y border-border text-sm">
        <Row k="Region" v={r.region} />
        <Row k="Status" v={recipeStatus(r)} />
        <Row k="Races" v={String(r.n)} />
        <Row
          k="Paper ROI"
          v={`${r.roi >= 0 ? "+" : ""}${r.roi.toFixed(1)}%`}
          tone={r.roi >= 0 ? "up" : "bad"}
        />
      </dl>
    </DetailShell>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: "up" | "bad" }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-subtle">{k}</dt>
      <dd className={cn("font-mono", tone === "up" && "text-up", tone === "bad" && "text-bad")}>
        {v}
      </dd>
    </div>
  );
}
