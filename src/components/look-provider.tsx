import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";
import { applyLook, lookFromLocation, searchString, type Look } from "@/lib/look";

const LookCtx = createContext<Look>("charcoal");

export function LookProvider({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => searchString(s.location) });
  const look = useMemo(() => lookFromLocation(pathname, search), [pathname, search]);

  useEffect(() => {
    applyLook(look);
  }, [look]);

  return <LookCtx.Provider value={look}>{children}</LookCtx.Provider>;
}

export function useLook(): Look {
  return useContext(LookCtx);
}
