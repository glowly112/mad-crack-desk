import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/issues/")({
  beforeLoad: () => {
    throw redirect({ to: "/office" });
  },
});
