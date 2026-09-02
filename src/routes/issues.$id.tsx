import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { ownerId, Portrait } from "@/components/portrait";
import { issueBoard } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { issueById } from "@/lib/lab/lookup";

export const Route = createFileRoute("/issues/$id")({ component: Issue });

function Issue() {
  const { id } = Route.useParams();
  const raw = issueById(id);
  if (!raw) {
    return (
      <DetailShell backTo="/issues" backLabel="Issues">
        <p className="text-sm text-subtle">{EMPTY}</p>
      </DetailShell>
    );
  }
  const iss = issueBoard(raw);
  const face = ownerId(iss.owner);
  return (
    <DetailShell backTo="/issues" backLabel="Issues">
      <div className="flex items-center gap-3">
        {face ? <Portrait id={face} name={iss.owner} /> : null}
        <div>
          <h1 className="text-2xl">{iss.problem}</h1>
          <p className="text-sm text-muted">{iss.owner}</p>
        </div>
      </div>
      <p className="text-sm">{iss.next}</p>
    </DetailShell>
  );
}
