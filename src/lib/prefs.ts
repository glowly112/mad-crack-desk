export const THEMES = ["charcoal", "paper", "night", "lab"] as const;
export const FONTS = ["satoshi", "ledger", "tape"] as const;
export const SIZES = ["s", "m", "l"] as const;

export type Theme = (typeof THEMES)[number];
export type Font = (typeof FONTS)[number];
export type Size = (typeof SIZES)[number];

export type Prefs = {
  theme: Theme;
  font: Font;
  size: Size;
};

export const DEFAULT_PREFS: Prefs = {
  theme: "charcoal",
  font: "satoshi",
  size: "m",
};

export const PREFS_KEY = "mcl.prefs";

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return { ...DEFAULT_PREFS };
  try {
    const data = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: oneOf(data.theme, THEMES, DEFAULT_PREFS.theme),
      font: oneOf(data.font, FONTS, DEFAULT_PREFS.font),
      size: oneOf(data.size, SIZES, DEFAULT_PREFS.size),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function applyPrefs(prefs: Prefs, el: HTMLElement = document.documentElement) {
  el.dataset.theme = prefs.theme;
  el.dataset.font = prefs.font;
  el.dataset.size = prefs.size;
}

export function readStoredPrefs(): Prefs {
  if (typeof localStorage === "undefined") return { ...DEFAULT_PREFS };
  try {
    return parsePrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeStoredPrefs(prefs: Prefs) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
