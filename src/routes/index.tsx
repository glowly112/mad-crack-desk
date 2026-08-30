import { createFileRoute } from "@tanstack/react-router";
import { DoNext } from "@/components/do-next";
import { HeroStrip } from "@/components/hero-strip";
import { PackList } from "@/components/pack-list";

export const Route = createFileRoute("/")({ component: Floor });

function Floor() {
  return (
    <div className="space-y-10">
      <HeroStrip />
      <DoNext />
      <PackList />
    </div>
  );
}
