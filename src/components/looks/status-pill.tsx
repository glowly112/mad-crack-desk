import { cn } from "@/lib/utils";

export type PillKind = "solid" | "keep" | "proving" | "dead" | "stuck" | "mute" | "need" | "watch";

export function StatusPill({
  kind,
  children,
}: {
  kind: PillKind;
  children: React.ReactNode;
}) {
  return <span className={cn("look-pill", `look-pill-${kind}`)}>{children}</span>;
}

export function packKind(label: string): PillKind {
  if (label === "Solid") return "solid";
  if (label === "Research keep") return "keep";
  if (label === "Proving") return "proving";
  if (label === "Dead") return "dead";
  if (label === "Stuck") return "stuck";
  return "mute";
}
