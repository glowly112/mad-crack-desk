import { createFileRoute } from "@tanstack/react-router";
import { DetailShell } from "@/components/detail-shell";
import { useStamp } from "@/components/plant-context";
import { BookStageLine } from "@/components/book-stages";
import { bookStages, recipeStatus } from "@/lib/lab/boards";
import { EMPTY } from "@/lib/lab/desk";
import { cn, fmtU } from "@/lib/utils";

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
  const stages = bookStages(r);
  return (
    <DetailShell backTo="/" backLabel="Floor">
      <p className="font-mono text-xs text-subtle">{r.id}</p>
      <h1 className="text-2xl">{r.title}</h1>
      <p className="mt-2 text-xs text-subtle">One book</p>
      <BookStageLine recipe={r} />
      <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
        <Row k="Region" v={r.region} />
        <Row k="Status" v={recipeStatus(r)} />
        {stages.map((s) => (
          <Row
            key={s.key}
            k={s.label}
            v={
              s.kind === "empty"
                ? EMPTY
                : s.kind === "split"
                  ? s.mark
                  : s.n != null
                    ? `n=${s.n} · ${s.key === "paper" ? fmtU(s.u) : EMPTY}`
                    : s.mark
            }
          />
        ))}
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
