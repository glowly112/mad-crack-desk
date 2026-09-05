import { STAFF_MARKS } from "@/components/marks";
import { cn } from "@/lib/utils";

const OWNER_TO_ID: Record<string, string> = {
  Invent: "invent",
  Holdout: "holdout",
  Auditor: "auditor",
  Night: "night",
  Wiki: "wiki",
  Clerk: "holdout",
  Foreman: "night",
  Igor: "night",
  Bauron: "invent",
  Mercator: "invent",
  Hyde: "auditor",
  Virchow: "auditor",
  Curator: "wiki",
  Grok: "invent",
};

export function ownerId(owner: string): string | null {
  return OWNER_TO_ID[owner] ?? null;
}

export function Portrait({
  id,
  name,
  size = "md",
}: {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-11";
  const iconBox = size === "sm" ? "size-4" : size === "lg" ? "size-7" : "size-5";
  const Mark = STAFF_MARKS[id as keyof typeof STAFF_MARKS];
  if (Mark) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm bg-elev text-muted",
          box,
        )}
        aria-hidden="true"
      >
        <Mark className={cn(iconBox, "text-fg")} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm bg-elev font-mono text-xs text-muted",
        box,
      )}
      aria-hidden="true"
    >
      {name.slice(0, 1)}
    </span>
  );
}
