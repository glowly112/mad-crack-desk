import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Units. Null is Empty — never £ and never a skeleton. */
export function fmtU(v: number | null | undefined): string {
  if (v == null || Number.isNaN(v)) return "Empty";
  const sign = v > 0 ? "+" : v < 0 ? "−" : "";
  return `${sign}${Math.abs(v).toFixed(2)}u`;
}

/** Production score on Floor. Null is Empty — never a skeleton or freeze cash. */
export function fmtScore(v: number | null | undefined): string {
  return fmtU(v);
}

export function fmtAim(v: number): string {
  return `${v}u`;
}
