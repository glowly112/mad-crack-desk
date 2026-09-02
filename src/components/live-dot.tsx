import { cn } from "@/lib/utils";

export function LiveDot({ tone, tick }: { tone: "ok" | "warn" | "bad"; tick?: string }) {
  return (
    <span
      key={tick}
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        tick && "stamp-tick",
        tone === "ok" && "bg-up",
        tone === "warn" && "bg-warn",
        tone === "bad" && "bg-bad",
      )}
      aria-hidden="true"
    />
  );
}
