import { createContext, useContext } from "react";
import { applyBoardResetView } from "@/lib/lab/board-reset";
import { bootStamp } from "@/lib/lab/plant-boot";
import type { LiveStamp } from "@/lib/lab/from-digest";

const boot = applyBoardResetView(bootStamp());

export type PlantState = {
  stamp: LiveStamp;
  source: string;
  detail: string;
};

export const plantInitial: PlantState = {
  stamp: boot,
  source: "freeze",
  detail: `new run · board reset · frozen ${boot.generated}`,
};

export const PlantCtx = createContext<PlantState>(plantInitial);

export function useStamp(): LiveStamp {
  return useContext(PlantCtx).stamp;
}

export function usePlantSource(): PlantState {
  return useContext(PlantCtx);
}
