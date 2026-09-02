import { Link } from "@tanstack/react-router";

export function DetailShell({
  backTo,
  backLabel,
  children,
}: {
  backTo: "/" | "/office" | "/staff" | "/moves" | "/trades" | "/issues" | "/pipe" | "/health";
  backLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Link
        to={backTo}
        className="inline-flex min-h-11 items-center text-sm text-muted transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        ← {backLabel}
      </Link>
      {children}
    </div>
  );
}
