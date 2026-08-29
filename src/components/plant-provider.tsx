import { useEffect, useState, type ReactNode } from "react";
import { PlantCtx, plantInitial } from "@/components/plant-context";
import { getPlant } from "@/lib/lab/get-plant";

export function PlantProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(plantInitial);

  useEffect(() => {
    let on = true;
    const pull = () => {
      void getPlant()
        .then((p) => {
          if (on) setState({ stamp: p.stamp, source: p.source, detail: p.detail });
        })
        .catch(() => {
          if (on) setState(plantInitial);
        });
    };
    pull();
    const t = window.setInterval(pull, 60_000);
    return () => {
      on = false;
      window.clearInterval(t);
    };
  }, []);

  return <PlantCtx.Provider value={state}>{children}</PlantCtx.Provider>;
}
