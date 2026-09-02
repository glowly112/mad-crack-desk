import { createServerFn } from "@tanstack/react-start";
import type { PlantPayload } from "./plant-boot.ts";

export type { PlantPayload };

export const getPlant = createServerFn({ method: "POST" }).handler(async (): Promise<PlantPayload> => {
  try {
    const { loadPlant } = await import("./load-plant.server.ts");
    return await loadPlant();
  } catch {
    const { fallbackPlant } = await import("./load-plant.server.ts");
    return fallbackPlant();
  }
});
