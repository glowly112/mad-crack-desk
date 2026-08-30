import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill, packKind } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/holdings/$id")({ component: Holding });

function Holding() {
  const { id } = Route.useParams();
  const look = useLook();
  const stamp = useStamp();
  const r = stamp.recipes.find((row) => row.id === id) ?? null;
  if (!r) {
    return (
      <DetailShell backTo="/" backLabel="Floor">
        <EmptyState />
      </DetailShell>
    );
  }
  return (
    <DetailShell backTo="/" backLabel="Floor">
      <div className={`look-${look} space-y-6`}>
      <p className="font-mono text-xs text-subtle">{r.id}</p>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl">{r.title}</h1>
        {look !== "charcoal" ? (
          <StatusPill kind={packKind(r.badge === "Solid" ? "Solid" : r.status === "KEEP" ? "Research keep" : "Proving")}>
            {r.badge === "Solid" ? "Solid" : r.status === "KEEP" ? "Research keep" : "Proving"}
          </StatusPill>
        ) : null}
      </div>
      <dl className="divide-y divide-border border-y border-border text-sm">
        <Row k="Region" v={r.region} />
        <Row k="Status" v={r.status} />
        <Row k="Badge" v={r.badge} />
        <Row k="n" v={String(r.n)} />
        <Row
          k="ROI"
          v={`${r.roi >= 0 ? "+" : ""}${r.roi.toFixed(1)}%`}
          tone={r.badge === "Solid" ? (r.roi >= 0 ? "up" : "bad") : undefined}
        />
      </dl>
      <p className="text-sm">{r.why}</p>
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
