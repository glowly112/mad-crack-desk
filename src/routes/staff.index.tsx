import { createFileRoute } from "@tanstack/react-router";
import { StaffDesk } from "@/components/staff-desk";

export const Route = createFileRoute("/staff/")({ component: StaffIndex });

function StaffIndex() {
  return <StaffDesk />;
}
