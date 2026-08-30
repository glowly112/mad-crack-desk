import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useLook } from "@/components/look-provider";
import { LOOKS, LOOK_LABEL, searchString, switchLookPath, type Look } from "@/lib/look";
import { cn } from "@/lib/utils";

export function LookSwitcher({ compact }: { compact?: boolean }) {
  const look = useLook();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => searchString(s.location) });

  return (
    <div
      role="tablist"
      aria-label="Desk look"
      className={cn("look-switcher", compact && "look-switcher-compact")}
    >
      {LOOKS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={look === id}
          data-look-tab={id}
          className={cn("look-switcher-tab", look === id && "is-on")}
          onClick={() => {
            const href = switchLookPath(pathname, search, id as Look);
            if (href.startsWith("/looks/")) {
              void navigate({ to: "/looks/$look", params: { look: href.slice("/looks/".length) } });
              return;
            }
            const [path, qs] = href.split("?");
            const nextSearch = qs ? Object.fromEntries(new URLSearchParams(qs)) : {};
            void navigate({
              to: (path || "/") as "/",
              search: (() => nextSearch) as never,
            });
          }}
        >
          {LOOK_LABEL[id]}
        </button>
      ))}
    </div>
  );
}
