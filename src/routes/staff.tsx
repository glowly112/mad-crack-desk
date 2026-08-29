import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/staff")({ component: StaffLayout });

function StaffLayout() {
  return <Outlet />;
}
