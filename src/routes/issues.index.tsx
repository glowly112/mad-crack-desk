import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/empty-state";
import { ownerId, Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";
import { issueBoard } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";

export const Route = createFileRoute("/issues/")({ component: IssuesIndex });

function IssuesIndex() {
  const stamp = useStamp();
  const rows = stamp.issues.map(issueBoard);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Issues</h1>
        <p className="mt-1 text-sm text-muted">Things to fix.</p>
      </header>
      {rows.length === 0 ? (
        <EmptyState copy={EMPTY} />
      ) : (
        <ol>
          {rows.map((iss) => {
            const id = ownerId(iss.owner);
            return (
              <li key={iss.id} className="border-b border-border">
                <Link
                  to="/issues/$id"
                  params={{ id: iss.id }}
                  className="flex gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {id ? <Portrait id={id} name={iss.owner} size="sm" /> : null}
                  <div className="min-w-0">
                    <p className="text-sm">{iss.problem}</p>
                    <p className="mt-1 text-xs text-subtle">
                      {iss.owner} · {iss.next}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
