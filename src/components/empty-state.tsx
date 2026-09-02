import { EMPTY } from "@/lib/lab/desk";

export function EmptyState({ copy = EMPTY }: { copy?: string }) {
  return <p className="text-sm text-subtle">{copy}</p>;
}
