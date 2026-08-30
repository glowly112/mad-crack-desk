import { Link } from "@tanstack/react-router";
import { useLook } from "@/components/look-provider";
import { resolvePath, withLook } from "@/lib/look";

function hrefParts(href: string): { to: string; search?: Record<string, string>; params?: { look: string } } {
  const [path, qs] = href.split("?");
  if (path.startsWith("/looks/")) {
    return { to: "/looks/$look", params: { look: path.slice("/looks/".length) } };
  }
  const search = qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined;
  return { to: path || "/", search };
}

export function LookLink({
  to,
  params,
  className,
  preload = "intent",
  children,
  "aria-label": ariaLabel,
}: {
  to: string;
  params?: Record<string, string>;
  className?: string;
  preload?: false | "intent";
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  const look = useLook();
  const parts = hrefParts(withLook(resolvePath(to, params), look));
  return (
    <Link
      to={parts.to as "/"}
      params={parts.params as never}
      search={parts.search as never}
      preload={preload}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
