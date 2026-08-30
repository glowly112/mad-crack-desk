import { useRouterState } from "@tanstack/react-router";
import { LookLink } from "@/components/look-link";
import { LookSwitcher } from "@/components/look-switcher";
import { useLook } from "@/components/look-provider";
import { BettingStrip } from "@/components/betting-strip";
import { JobChrome } from "@/components/job-chrome";
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
  if (to === "/") return pathname === "/" || pathname.startsWith("/looks/");
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const look = useLook();
  const settingsOn = pathActive(pathname, "/settings");
  const stamp = useStamp();
  const plant = usePlantSource();
  const floor = pathname === "/" || pathname.startsWith("/looks/");
  const showJob = !floor && !pathActive(pathname, "/settings");

  return (
    <div className={cn("min-h-dvh bg-bg text-fg desk-shell", `look-${look}`)}>
      <BettingStrip />
      <div className="desk-cols">
        <aside className="desk-nav">
          <div className="desk-brand">
            <LabMark className="size-6 text-fg" />
            <div>
              <p className="text-sm font-medium tracking-tight">Mad Crack Lab</p>
              <p className="font-mono text-xs text-subtle">
                {plant.source === "oracle" ? `${stamp.day} · oracle` : plant.detail}
              </p>
            </div>
          </div>
          <LookSwitcher />
          <nav className="desk-nav-list">
            {NAV.map((item) => (
              <NavLink key={item.to} {...item} active={pathActive(pathname, item.to)} />
            ))}
          </nav>
          <div className="desk-nav-foot">
            <LookLink
              to="/settings"
              className={cn("desk-nav-link", settingsOn && "is-on")}
            >
              <MarkSettings className="size-4" />
              Settings
            </LookLink>
            <p
              className={cn(
                "flex items-center gap-2 px-2 font-mono text-xs",
                stamp.fuse_on ? "text-muted" : "text-subtle",
              )}
            >
              <LiveDot tone={stamp.fuse_on ? "ok" : "warn"} />
              <span>{stamp.fuse}</span>
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="desk-mobile-bar">
            <div className="flex min-w-0 items-center gap-2">
              <LabMark className="size-5 shrink-0 text-fg" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Mad Crack Lab</p>
                <p className="truncate font-mono text-xs text-subtle">
                  {plant.source === "oracle" ? `${stamp.day} · oracle` : plant.detail}
                </p>
              </div>
            </div>
            <LookLink
              to="/settings"
              aria-label="Settings"
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-sm",
                settingsOn ? "bg-elev text-fg" : "text-muted",
              )}
            >
              <MarkSettings className="size-4" />
            </LookLink>
          </header>
          <div className="desk-mobile-look">
            <LookSwitcher compact />
          </div>
          <main
            key={pathname}
            className="route-in desk-main"
          >
            {showJob ? <JobChrome /> : null}
            {children}
          </main>
        </div>
      </div>

      <nav className="desk-dock">
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
    <LookLink
      to={to}
      className={cn(
        "desk-nav-link",
        compact && "is-compact",
        active && "is-on",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </LookLink>
  );
}
