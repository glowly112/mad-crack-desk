import { createFileRoute, Link } from "@tanstack/react-router";
import { HUNTER_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { BackstagePacks } from "@/components/pack-list";
import { useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  const stamp = useStamp();
  const maxM = Math.max(...stamp.coverage.map((c) => c.measuring), 1);
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">
          Active hunter {stamp.office.activeHunter} · Pareto {stamp.office.pareto} · invent{" "}
          {stamp.office.invent ? "on" : "paused"}
        </p>
        <p className="mt-1 text-sm text-subtle">{stamp.office.inventWhy}</p>
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
                        <span className={off ? "text-muted" : "text-up"}>{h.state}</span>
                      </span>
                    </div>
                    <p className="text-xs text-subtle">{h.note}</p>
                    <span className="mt-2 block h-0.5 overflow-hidden bg-elev">
                      <span
                        className={cn("block h-full", off ? "w-1/5 bg-warn" : "w-full bg-up")}
                      />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted">Coverage</h2>
        <ul className="space-y-3">
          {stamp.coverage.map((c) => (
            <li key={c.region}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <p className="font-mono text-sm">{c.region}</p>
                <p className="font-mono text-xs text-subtle">
                  keep {c.keep} · proving {c.measuring}
                </p>
              </div>
              <div className="flex h-2 gap-px">
                {c.keep > 0 ? <span className="w-3 shrink-0 bg-fg" /> : <span className="w-3 shrink-0 bg-elev" />}
                {Array.from({ length: maxM }).map((_, i) => (
                  <span
                    key={c.region + i}
                    className={cn("h-full flex-1", i < c.measuring ? "bg-muted" : "bg-elev")}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-subtle">{c.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <BackstagePacks />
    </div>
  );
}
