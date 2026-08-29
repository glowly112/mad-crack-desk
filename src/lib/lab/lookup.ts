import { STAMP } from "./stamp.ts";

export function recipeById(id: string) {
  return STAMP.recipes.find((r) => r.id === id) ?? null;
}

export function seatById(id: string) {
  return STAMP.seats.find((s) => s.id === id) ?? null;
}

export function issueById(id: string) {
  return STAMP.issues.find((i) => i.id === id) ?? null;
}

export function hunterById(id: string) {
  return STAMP.hunters.find((h) => h.id === id) ?? null;
}
