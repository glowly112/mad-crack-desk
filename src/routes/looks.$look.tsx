import { createFileRoute, redirect } from "@tanstack/react-router";
import { FloorPage } from "@/components/floor-page";
import { isGalleryLook } from "@/lib/look";

export const Route = createFileRoute("/looks/$look")({
  beforeLoad: ({ params }) => {
    if (!isGalleryLook(params.look)) {
      throw redirect({ to: "/" });
    }
  },
  component: FloorPage,
});
