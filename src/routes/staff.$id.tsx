import { createFileRoute } from "@tanstack/react-router";
import { StaffDesk } from "@/components/staff-desk";

export const Route = createFileRoute("/staff/$id")({ component: Seat });

function Seat() {
  const { id } = Route.useParams();
  return <StaffDesk selectedId={id} />;
}
