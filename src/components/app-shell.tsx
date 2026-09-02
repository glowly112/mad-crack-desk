import { Link, useRouterState } from "@tanstack/react-router";
import { LabMark, MarkSettings, NAV_MARKS } from "@/components/marks";
import { LiveDot } from "@/components/live-dot";
import { usePlantSource, useStamp } from "@/components/plant-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Floor" },
  { to: "/moves", label: "Moves" },
  { to: "/office", label: "Office" },
  { to: "/pipe", label: "Pipe" },
  { to: "/health", label: "Health" },
  { to: "/issues", label: "Issues" },
  { to: "/staff", label: "Staff" },
  { to: "/trends", label: "Trends" },
] as const;

function pathActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const settingsOn = pathActive(pathname, "/settings");
  const stamp = useStamp();
  const plant = usePlantSource();

  return (
    <div className="min-h-dvh bg-bg text-fg md:flex">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border md:flex">
        <div className="flex items-center gap-2 px-4 py-4">
          <LabMark className="size-6 text-fg" />
          <div>
            <p className="text-sm font-medium tracking-tight">Mad Crack Lab</p>
            <p className="font-mono text-xs text-subtle">
              {plant.source === "oracle"
                ? `${stamp.day} · live oracle`
                : plant.source === "freeze"
                  ? `frozen ${stamp.generated}`
                  : plant.detail}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} active={pathActive(pathname, item.to)} />
          ))}
        </nav>
        <div className="space-y-2 border-t border-border px-2 py-3">
          <Link
            to="/settings"
            preload="intent"
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm",
              settingsOn ? "bg-elev text-fg" : "text-muted hover:text-fg",
            )}
          >
            <MarkSettings className="size-4" />
            Settings
          </Link>
          <p
            className={cn(
              "flex items-center gap-2 px-2 font-mono text-xs",
              stamp.fuse_on ? "text-up" : "text-warn",
            )}
          >
            <LiveDot tone={stamp.fuse_on ? "ok" : "warn"} />
            <span>{stamp.fuse}</span>
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <LabMark className="size-5 shrink-0 text-fg" />
            <div className="min-w-0">
              <p className="text-sm font-medium">Mad Crack Lab</p>
              <p className="truncate font-mono text-xs text-subtle">
                {plant.source === "oracle"
                  ? `${stamp.day} · live oracle`
                  : plant.source === "freeze"
                    ? `frozen ${stamp.generated}`
                    : plant.detail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 font-mono text-xs", stamp.fuse_on ? "text-up" : "text-warn")}>
              <LiveDot tone={stamp.fuse_on ? "ok" : "warn"} />
              <span>{stamp.fuse}</span>
            </span>
            <Link
              to="/settings"
              preload="intent"
              aria-label="Settings"
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-sm",
                settingsOn ? "bg-elev text-fg" : "text-muted",
              )}
            >
              <MarkSettings className="size-4" />
            </Link>
          </div>
        </header>
        <main
          key={pathname}
          className="route-in min-w-0 overflow-x-hidden px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-7"
        >
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex overflow-x-auto">
          {NAV.map((item) => (
            <NavLink key={item.to} {...item} active={pathActive(pathname, item.to)} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavLink({
  to,
  label,
  active,
  compact,
}: {
  to: (typeof NAV)[number]["to"];
  label: string;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = NAV_MARKS[to];
  return (
    <Link
      to={to}
      preload="intent"
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors duration-150",
        compact && "min-h-11 min-w-16 shrink-0 flex-col justify-center gap-1 py-2 text-xs",
        active ? "bg-elev text-fg" : "text-muted hover:bg-elev/60 hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );
}
