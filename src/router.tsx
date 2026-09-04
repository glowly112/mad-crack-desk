import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent, AppNotFoundComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

const deskBase =
  (import.meta.env.VITE_DESK_BASEPATH as string | undefined)?.trim().replace(/\/$/, "") || "";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultNotFoundComponent: AppNotFoundComponent,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    ...(deskBase ? { basepath: deskBase } : {}),
  });
}
