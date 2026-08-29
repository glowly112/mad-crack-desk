import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { ownerId, Portrait } from "@/components/portrait";
import { issueById } from "@/lib/lab/lookup";

export const Route = createFileRoute("/issues/$id")({ component: Issue });

function Issue() {
  const { id } = Route.useParams();
  const iss = issueById(id);
  if (!iss) {
    return (
      <DetailShell backTo="/issues" backLabel="Issues">
        <p className="text-sm text-subtle">No issue on this stamp for that id.</p>
      </DetailShell>
    );
  }
  const face = ownerId(iss.owner);
  return (
    <DetailShell backTo="/issues" backLabel="Issues">
      <p className="font-mono text-xs text-subtle">{iss.id}</p>
      <div className="flex items-center gap-3">
        {face ? <Portrait id={face} name={iss.owner} /> : null}
        <div>
          <h1 className="text-2xl">{iss.title}</h1>
          <p className="text-sm text-muted">{iss.owner}</p>
        </div>
      </div>
      <p className="text-sm text-muted">{iss.detail}</p>
      <p className="text-sm">{iss.fix}</p>
    </DetailShell>
  );
}
