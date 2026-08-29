import { cn } from "@/lib/utils";

export function LiveDot({ tone }: { tone: "ok" | "warn" | "bad" }) {
  return (
    <span
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        tone === "ok" && "bg-up",
        tone === "warn" && "bg-warn",
        tone === "bad" && "bg-bad",
      )}
      aria-hidden="true"
    />
  );
}
