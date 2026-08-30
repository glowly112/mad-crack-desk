import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { LookLink } from "@/components/look-link";
import { ViewHeader } from "@/components/looks/view-header";
import { StatusPill } from "@/components/looks/status-pill";
import { useLook } from "@/components/look-provider";
import { useStamp } from "@/components/plant-context";
import { issueLanes } from "@/lib/lab/desk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/issues/")({ component: IssuesIndex });

function IssuesIndex() {
  const stamp = useStamp();
  const look = useLook();
  const lanes = issueLanes(stamp.issues, stamp.topBlocker.id);

  return (
    <div className={cn("space-y-8", `look-${look}`)}>
      <ViewHeader title="Issues" lede="Owner and next fix. Needs-you first." />
      {look === "field" ? (
        <div className="field-sev">
          <div className="field-sev-tab is-stuck is-on">
            <span className="field-sev-label">Needs you</span>
            <span className="field-sev-count">{lanes.needsYou.length} now</span>
          </div>
          <div className="field-sev-tab is-proving">
            <span className="field-sev-label">Watching</span>
            <span className="field-sev-count">{lanes.watching.length} open</span>
          </div>
        </div>
      ) : null}
      <Lane title="Needs you" items={lanes.needsYou} need />
      <Lane title="Watching" items={lanes.watching} />
    </div>
  );
}

function Lane({
  title,
  items,
  need,
}: {
  title: string;
  items: { id: string; title: string; owner: string; fix: string }[];
  need?: boolean;
}) {
  const look = useLook();
  return (
    <section className={look === "ledger" ? "ledger-card" : undefined}>
      <header className="mb-2 flex items-center gap-2 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">{title}</h2>
        <span className="font-mono text-xs text-subtle">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className={look === "tape" ? "tape-table" : undefined}>
          {items.map((iss) => (
            <li key={iss.id} className={look === "tape" ? undefined : "border-b border-border"}>
              <LookLink
                to="/issues/$id"
                params={{ id: iss.id }}
                className={cn(
                  "flex items-baseline justify-between gap-4 py-3 transition-transform duration-150 ease-out active:scale-[0.96]",
                  look === "tape" && "tape-row",
                  look === "field" && "field-row",
                  look === "ledger" && "ledger-row",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm">{iss.title}</p>
                    {look !== "charcoal" ? (
                      <StatusPill kind={need ? "need" : "watch"}>{need ? "Needs you" : "Watch"}</StatusPill>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted">{iss.fix}</p>
                </div>
                <p className="shrink-0 font-mono text-xs text-subtle">{iss.owner}</p>
              </LookLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
