import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtU(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}u`;
}

/** Production score on Floor. Null is Empty — never a skeleton or freeze £. */
export function fmtScore(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "Empty";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}u`;
}

export function fmtGbp(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}£${Math.abs(v).toFixed(2)}`;
}
