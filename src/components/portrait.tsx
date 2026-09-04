import { STAFF_PORTRAIT_ID, isLockedStaffId } from "@/lib/lab/staff-seats";
import { cn } from "@/lib/utils";

const HAS_FACE = new Set([
  "igor",
  "bauron",
  "hyde",
  "virchow",
  "mercator",
  "clerk",
  "foreman",
  "curator",
]);

const OWNER_TO_ID: Record<string, string> = {
  Hyde: "hyde",
  Igor: "igor",
  Mercator: "mercator",
  Clerk: "clerk",
  Bauron: "bauron",
  Virchow: "virchow",
  Foreman: "foreman",
  Curator: "curator",
  Grok: "bauron",
  Invent: "bauron",
  Holdout: "igor",
  Auditor: "clerk",
  "Night + mill watch": "foreman",
  Wiki: "curator",
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
  const portraitId = isLockedStaffId(id) ? STAFF_PORTRAIT_ID[id] : id;
  const box = size === "sm" ? "size-8" : size === "lg" ? "size-14" : "size-11";
  if (!HAS_FACE.has(portraitId)) {
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
  return (
    <img
      src={`/portraits/${portraitId}.jpg`}
      alt=""
      width={size === "lg" ? 56 : size === "sm" ? 32 : 44}
      height={size === "lg" ? 56 : size === "sm" ? 32 : 44}
      loading={size === "sm" ? "eager" : "lazy"}
      decoding="async"
      className={cn("shrink-0 rounded-sm object-cover", box)}
    />
  );
}
