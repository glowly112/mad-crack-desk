import { useEffect, useState, type ReactNode } from "react";
import { DayScopeProvider } from "@/components/day-scope";
import { PlantCtx, plantInitial, type PlantState } from "@/components/plant-context";
import { getPlant } from "@/lib/lab/get-plant";
import { mergeMillTradesTape } from "@/lib/lab/trades";
import { scrubDeskStampArchive } from "@/lib/lab/mill-ingest";

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
          if (on) {
            setState((prev) => {
              const merged = mergeMillTradesTape(prev.stamp.trades, p.stamp.trades, p.stamp.day);
              const stamp = scrubDeskStampArchive({ ...p.stamp, trades: merged });
              return {
                stamp,
                source: p.source,
                detail: p.detail,
              };
            });
          }
        })
        .catch(() => {
          if (on && !initial) setState(boot);
        });
    };
    pull();
    const ms = boot.source === "oracle" ? 15_000 : 60_000;
    const t = window.setInterval(pull, ms);
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
