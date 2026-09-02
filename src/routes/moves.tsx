import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/moves")({
  beforeLoad: () => {
    throw redirect({ to: "/trades" });
  },
});
