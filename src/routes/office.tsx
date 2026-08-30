import { createFileRoute, Link } from "@tanstack/react-router";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { useStamp } from "@/components/plant-context";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  const stamp = useStamp();
  const regions = stamp.coverage.map((c) => c.region).join(" · ");

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm">
          Invent {stamp.office.invent ? "on" : "off"}
        </p>
        <p className="mt-1 text-sm text-subtle">{stamp.office.inventWhy}</p>
        <p className="mt-3 font-mono text-xs text-muted">
          Hunter {stamp.office.activeHunter} · Pareto {stamp.office.pareto}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">Hunters</h2>
        <ul className="divide-y divide-border border-y border-border">
          {stamp.hunters.map((h) => {
            const Icon = HUNTER_MARKS[h.id as keyof typeof HUNTER_MARKS];
            const off = h.state !== "FLOWING";
            return (
              <li key={h.id}>
                <Link
                  to="/hunters/$id"
                  params={{ id: h.id }}
                  className="flex items-center gap-4 py-3 transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  {Icon ? <Icon className="size-8 shrink-0 text-muted" /> : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="capitalize">{h.id}</p>
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                        <LiveDot tone={off ? "warn" : "ok"} />
                        <span className={off ? "text-muted" : "text-muted"}>{h.state}</span>
                      </span>
                    </div>
                    <p className="text-xs text-subtle">{h.note}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-muted">Coverage</h2>
        <p className="mb-3 font-mono text-xs text-subtle">{regions}</p>
        <ul className="divide-y divide-border border-y border-border">
          {stamp.coverage.map((c) => (
            <li key={c.region} className="flex items-baseline justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-mono text-sm">{c.region}</p>
                <p className="text-xs text-subtle">{c.note}</p>
              </div>
              <p className="shrink-0 font-mono text-xs tabular-nums text-muted">
                keep {c.keep} · proving {c.measuring}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
