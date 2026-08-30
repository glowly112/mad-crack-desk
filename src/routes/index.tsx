import { createFileRoute } from "@tanstack/react-router";
import { FloorPage } from "@/components/floor-page";

export const Route = createFileRoute("/")({ component: Floor });

export function Floor() {
  return <FloorPage />;
}
