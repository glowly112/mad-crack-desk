import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { useStamp } from "@/components/plant-context";
import { issueLanes } from "@/lib/lab/desk";

export const Route = createFileRoute("/issues/")({ component: IssuesIndex });

function IssuesIndex() {
  const stamp = useStamp();
  const lanes = issueLanes(stamp.issues, stamp.topBlocker.id);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Issues</h1>
        <p className="mt-1 text-sm text-muted">Owner and next fix. Needs-you first.</p>
      </header>
      <Lane title="Needs you" items={lanes.needsYou} />
      <Lane title="Watching" items={lanes.watching} />
    </div>
  );
}

function Lane({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string; owner: string; fix: string }[];
}) {
  return (
    <section>
      <header className="mb-2 flex items-center gap-2 border-b border-border pb-2">
        <h2 className="text-sm font-medium text-muted">{title}</h2>
        <span className="font-mono text-xs text-subtle">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul>
          {items.map((iss) => (
            <li key={iss.id} className="border-b border-border">
              <Link
                to="/issues/$id"
                params={{ id: iss.id }}
                className="flex items-baseline justify-between gap-4 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
              >
                <div className="min-w-0">
                  <p className="text-sm">{iss.title}</p>
                  <p className="mt-1 text-sm text-muted">{iss.fix}</p>
                </div>
                <p className="shrink-0 font-mono text-xs text-subtle">{iss.owner}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
