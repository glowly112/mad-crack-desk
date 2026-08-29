import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/issues")({ component: IssuesLayout });

function IssuesLayout() {
  return <Outlet />;
}
