import { createFileRoute } from "@tanstack/react-router";
import { FactoryLine, RecipesNotEarning, ThingsToFix } from "@/components/office-board";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">When something is not earning.</p>
      </header>
      <ThingsToFix />
      <FactoryLine />
      <RecipesNotEarning />
    </div>
  );
}
