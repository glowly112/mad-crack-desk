import { createFileRoute, Link } from "@tanstack/react-router";
import { Portrait } from "@/components/portrait";
import { useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/staff/")({ component: StaffIndex });

function StaffIndex() {
  const stamp = useStamp();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl">Staff</h1>
        <p className="mt-1 text-sm text-muted">Watching line is the row.</p>
      </header>
      <ul className="divide-y divide-border border-y border-border">
        {stamp.seats.map((s) => (
          <li key={s.id}>
            <Link
              to="/staff/$id"
              params={{ id: s.id }}
              className="flex items-center gap-3 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
            >
              <Portrait id={s.id} name={s.name} size="lg" />
              <div className="min-w-0 flex-1">
                <p>{s.name}</p>
                <p className="mt-0.5 text-sm">{s.now}</p>
                <p className="mt-1 text-xs text-subtle">
                  {s.role} · {s.status} · {s.cadence}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
