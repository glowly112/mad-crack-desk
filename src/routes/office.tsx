import { createFileRoute } from "@tanstack/react-router";
import { MillCaption, SkippedOffTape, ThingsToFix } from "@/components/office-board";

export const Route = createFileRoute("/office")({ component: Office });

export function Office() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl">Office</h1>
        <p className="mt-1 text-sm text-muted">Mill clutter and what Floor and Trades already own.</p>
      </header>
      <ThingsToFix />
      <MillCaption />
      <SkippedOffTape />
    </div>
  );
}
