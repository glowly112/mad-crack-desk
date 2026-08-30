import { Link } from "@tanstack/react-router";
import { useStamp } from "@/components/plant-context";

export function DoNext() {
  const stamp = useStamp();
  return (
    <aside className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-y border-border py-3">
      <div className="min-w-0">
        <p className="text-sm">{stamp.topBlocker.action}</p>
        <p className="mt-1 text-xs text-subtle">
          {stamp.topBlocker.owner} · {stamp.topBlocker.title}
        </p>
      </div>
      <Link
        to="/issues/$id"
        params={{ id: stamp.topBlocker.id }}
        className="shrink-0 text-sm text-fg underline-offset-4 transition-transform duration-150 ease-out hover:underline active:scale-[0.96]"
      >
        Issues
      </Link>
    </aside>
  );
}
