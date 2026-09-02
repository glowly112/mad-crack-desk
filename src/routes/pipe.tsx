import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pipe")({
  beforeLoad: () => {
    throw redirect({ to: "/office" });
  },
});
