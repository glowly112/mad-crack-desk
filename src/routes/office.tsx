import { createFileRoute } from "@tanstack/react-router";
import { OfficeBooksTable, OfficeCounts } from "@/components/office-board";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">Strategies, KEEP, and later-race same-bets P&L.</p>
      </header>
      <OfficeCounts />
      <OfficeBooksTable />
    </div>
  );
}
