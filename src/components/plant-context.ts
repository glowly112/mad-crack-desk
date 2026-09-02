import { createContext, useContext } from "react";
import { bootStamp } from "@/lib/lab/plant-boot";
import type { LiveStamp } from "@/lib/lab/from-digest";

const boot = bootStamp();

export type PlantState = {
  stamp: LiveStamp;
  source: string;
  detail: string;
};

export const plantInitial: PlantState = {
  stamp: boot,
  source: boot.source,
  detail:
    boot.source === "oracle"
      ? "plant snapshot"
      : boot.source === "freeze"
        ? `oracle unreachable · frozen ${boot.generated}`
        : "plant digest",
};

export const PlantCtx = createContext<PlantState>(plantInitial);

export function useStamp(): LiveStamp {
  return useContext(PlantCtx).stamp;
}

export function usePlantSource(): PlantState {
  return useContext(PlantCtx);
}
