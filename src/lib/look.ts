/** Gallery looks. Not Settings theme skins (paper / night / lab). */

export const LOOKS = ["charcoal", "tape", "ledger", "field"] as const;
export const LOOK_GALLERY = ["tape", "ledger", "field"] as const;

export type Look = (typeof LOOKS)[number];
export type GalleryLook = (typeof LOOK_GALLERY)[number];

export const LOOK_LABEL: Record<Look, string> = {
  charcoal: "IA",
  tape: "Tape",
  ledger: "Ledger",
  field: "Field",
};

/** Desk tokens used by glare tests — not the Settings costume hexes. */
export const LOOK_TOKENS = {
  charcoal: { bg: "#0a0a0b", paper: false },
  tape: { bg: "#0c101b", paper: false },
  ledger: { bg: "#f4f5f7", paper: true },
  field: { bg: "#050505", paper: false },
} as const;

export function parseLook(raw: unknown): Look {
  if (raw === "tape" || raw === "ledger" || raw === "field" || raw === "charcoal") {
    return raw;
  }
  return "charcoal";
}

export function isGalleryLook(look: string): look is GalleryLook {
  return look === "tape" || look === "ledger" || look === "field";
}

export function searchString(location: { href?: string; search?: unknown; searchStr?: string }): string {
  if (typeof location.searchStr === "string" && location.searchStr) return location.searchStr;
  if (typeof location.search === "string") return location.search;
  if (location.search && typeof location.search === "object") {
    const q = new URLSearchParams(location.search as Record<string, string>).toString();
    return q ? `?${q}` : "";
  }
  if (typeof location.href === "string" && location.href.includes("?")) {
    return location.href.slice(location.href.indexOf("?"));
  }
  return "";
}

export function lookFromLocation(pathname: string, search = ""): Look {
  const m = pathname.match(/^\/looks\/([^/]+)/);
  if (m?.[1]) return parseLook(m[1]);
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return parseLook(q.get("look"));
}

export function applyLook(look: Look, el: HTMLElement = document.documentElement) {
  if (look === "charcoal") delete el.dataset.look;
  else el.dataset.look = look;
}

/** Tape: colour is the score. Empty, behind, or down is red. Up is green. */
export function tapeScoreTone(u: number | null | undefined): "up" | "bad" {
  return u != null && Number.isFinite(u) && u >= 0 ? "up" : "bad";
}

export function tapeScoreClass(u: number | null | undefined): "tape-score-up" | "tape-score-bad" {
  return tapeScoreTone(u) === "up" ? "tape-score-up" : "tape-score-bad";
}

export function fieldBettingClass(on: boolean): "field-strip-on" | "field-strip-off" {
  return on ? "field-strip-on" : "field-strip-off";
}

export function isColourField(cls: string): boolean {
  return cls === "field-strip-on" || cls === "field-strip-off";
}

export function resolvePath(to: string, params?: Record<string, string>): string {
  if (!params) return to;
  return to.replace(/\$(\w+)/g, (_, key: string) => params[key] ?? `$${key}`);
}

/** Floor in a gallery look lives at /looks/:look. Other views keep ?look=. */
export function withLook(path: string, look: Look): string {
  const [rawBase, rawQs] = path.split("?");
  const base = rawBase || "/";
  const params = new URLSearchParams(rawQs);

  if (base === "/" || base === "") {
    return look === "charcoal" ? "/" : `/looks/${look}`;
  }
  if (base.startsWith("/looks/")) {
    return look === "charcoal" ? "/" : `/looks/${look}`;
  }
  if (look === "charcoal") params.delete("look");
  else params.set("look", look);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function switchLookPath(pathname: string, search: string, next: Look): string {
  if (pathname.startsWith("/looks/")) {
    return next === "charcoal" ? "/" : `/looks/${next}`;
  }
  const qs = search.startsWith("?") ? search : search ? `?${search}` : "";
  return withLook(`${pathname}${qs}`, next);
}
