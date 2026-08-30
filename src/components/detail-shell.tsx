import { LookLink } from "@/components/look-link";

export function DetailShell({
  backTo,
  backLabel,
  children,
}: {
  backTo: "/" | "/office" | "/staff" | "/moves" | "/issues" | "/pipe" | "/health";
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <LookLink
        to={backTo}
        className="inline-flex min-h-11 items-center text-sm text-muted transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        ← {backLabel}
      </LookLink>
      {children}
    </div>
  );
}
