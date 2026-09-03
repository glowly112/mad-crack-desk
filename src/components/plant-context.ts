import { createContext, useContext } from "react";
import { applyBoardResetView } from "@/lib/lab/board-reset";
import { digestStamp } from "@/lib/lab/plant-boot";
import type { LiveStamp } from "@/lib/lab/from-digest";

/** SSR fallback only — empty board until the root loader supplies live oracle. */
const boot = applyBoardResetView(digestStamp());

export type PlantState = {
  stamp: LiveStamp;
  source: string;
  detail: string;
};

export const plantInitial: PlantState = {
  stamp: boot,
  source: "freeze",
  detail: "loading live oracle",
};

export const PlantCtx = createContext<PlantState>(plantInitial);

export function useStamp(): LiveStamp {
  return useContext(PlantCtx).stamp;
}

export function usePlantSource(): PlantState {
  return useContext(PlantCtx);
}
