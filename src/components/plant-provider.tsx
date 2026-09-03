import { useEffect, useState, type ReactNode } from "react";
import { DayScopeProvider } from "@/components/day-scope";
import { PlantCtx, plantInitial, type PlantState } from "@/components/plant-context";
import { getPlant } from "@/lib/lab/get-plant";

export function PlantProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: PlantState;
}) {
  const boot = initial ?? plantInitial;
  const [state, setState] = useState(boot);

  useEffect(() => {
    let on = true;
    const pull = () => {
      void getPlant()
        .then((p) => {
          if (on) setState({ stamp: p.stamp, source: p.source, detail: p.detail });
        })
        .catch(() => {
          if (on) setState(boot);
        });
    };
    pull();
    const t = window.setInterval(pull, 60_000);
    return () => {
      on = false;
      window.clearInterval(t);
    };
  }, [initial?.source, initial?.stamp.generated, initial?.detail]);

  return (
    <PlantCtx.Provider value={state}>
      <DayScopeProvider>{children}</DayScopeProvider>
    </PlantCtx.Provider>
  );
}
