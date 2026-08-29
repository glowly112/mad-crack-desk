export function productionScore(input: {
  n_solid: number;
  day_u: number | null;
  researchKeepGbp: number;
}): number | null {
  if (input.n_solid <= 0) return null;
  return input.day_u;
}
