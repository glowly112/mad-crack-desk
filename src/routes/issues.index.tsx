import { createFileRoute, Link } from "@tanstack/react-router";
import { ownerId, Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/issues/")({ component: IssuesIndex });

function IssuesIndex() {
  const stamp = useStamp();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Issues</h1>
        <p className="mt-1 text-sm text-muted">Inefficiencies with an owner and a next fix.</p>
      </header>
      <ol className="divide-y divide-border border-y border-border">
          {stamp.issues.map((iss, i) => {
            const id = ownerId(iss.owner);
            return (
              <li key={iss.id}>
                <Link
                  to="/issues/$id"
                  params={{ id: iss.id }}
                  className="flex gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {id ? <Portrait id={id} name={iss.owner} size="sm" /> : null}
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-subtle">
                      {String(i + 1).padStart(2, "0")} · {iss.owner}
                    </p>
                    <h3 className="mt-1 text-base">{iss.title}</h3>
                    <p className="mt-1 text-sm text-muted">{iss.detail}</p>
                    <p className="mt-2 text-sm">{iss.fix}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
    </div>
  );
}
