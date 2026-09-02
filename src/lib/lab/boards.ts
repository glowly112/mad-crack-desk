/** Display English for Office, Pipe, Health, Issues. Never invents counts. */

import { EMPTY, cellName, recipePack } from "./desk.ts";
import type { Move, Recipe, Seat } from "./stamp.ts";

const REGIONS = ["AU", "GB", "IE", "US", "NZ", "ZA", "HK", "FR"] as const;

export const COUNTRY: Record<string, string> = {
  AU: "Australia",
  GB: "Britain",
  IE: "Ireland",
  US: "United States",
  NZ: "New Zealand",
  ZA: "South Africa",
  HK: "Hong Kong",
  FR: "France",
};

const HUNTER_NAME: Record<string, string> = {
  card: "Card",
  steam: "Steam",
  residual: "Residual",
  geo: "Geo",
  docbrown: "Doc Brown",
  lens: "Lens",
};

export function countryName(code: string): string {
  return COUNTRY[code] ?? code;
}

export function expandCountry(text: string): string {
  return text.replace(/\b(AU|GB|IE|US|NZ|ZA|HK|FR)\b/g, (m) => COUNTRY[m] ?? m);
}

/** `ZA|morning|WIN` → `South Africa morning WIN`. */
export function holeName(raw: string): string {
  const named = cellName(raw.replace(/\|/g, " "));
  return named && named !== EMPTY ? expandCountry(named) : EMPTY;
}

/** Caption a named invent hole. Never extra squares. */
export function inventHole(why: string): string {
  const m = why.match(/(?:next hole|queue)\s+([A-Za-z0-9_|-]+)/i);
  if (!m) return EMPTY;
  return holeName(m[1]);
}

/** `1 parked, 5 still being tested`. Both empty → Empty. */
export function countrySentence(parked: number, testing: number): string {
  const bits: string[] = [];
  if (parked > 0) bits.push(`${parked} parked`);
  if (testing > 0) bits.push(`${testing} still being tested`);
  return bits.length ? bits.join(", ") : EMPTY;
}

export type CountryRow = {
  region: string;
  name: string;
  parked: number;
  testing: number;
  line: string;
};

export function officeCountries(
  coverage: readonly { region: string; keep: number; measuring: number }[],
  recipes: readonly Recipe[],
): CountryRow[] {
  const pack = recipePack(recipes);
  const seen = new Set<string>();
  const rows: CountryRow[] = [];
  const push = (region: string, keep: number, measuring: number) => {
    if (seen.has(region)) return;
    seen.add(region);
    const parkedRecipes = pack.keeps.filter((r) => r.region === region).length;
    const testingRecipes = pack.proving.filter((r) => r.region === region).length;
    const parked = Math.max(keep, parkedRecipes);
    const testing = Math.max(measuring, testingRecipes);
    rows.push({
      region,
      name: countryName(region),
      parked,
      testing,
      line: countrySentence(parked, testing),
    });
  };
  for (const c of coverage) push(c.region, c.keep, c.measuring);
  for (const r of [...pack.keeps, ...pack.proving]) push(r.region, 0, 0);
  return rows;
}

export function countryPile(row: CountryRow): number {
  return row.parked + row.testing;
}

/** Compact waffle columns for n unit squares. */
export function waffleCols(n: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(Math.max(0, n))));
}

/** Every region in one market. Pile first, Empty last — never dropped. */
export function countryMarket(rows: readonly CountryRow[]): CountryRow[] {
  return [...rows].sort((a, b) => {
    const pa = countryPile(a);
    const pb = countryPile(b);
    if (pa === 0 && pb > 0) return 1;
    if (pb === 0 && pa > 0) return -1;
    return pb - pa || a.name.localeCompare(b.name);
  });
}

/** `Australia is the pile. Hong Kong Empty.` Empty markets stay Empty. */
export function countryPackLine(rows: readonly CountryRow[]): string {
  const piled = [...rows]
    .filter((r) => countryPile(r) > 0)
    .sort((a, b) => countryPile(b) - countryPile(a) || a.name.localeCompare(b.name));
  const empty = rows.filter((r) => countryPile(r) === 0);
  const bits: string[] = [];
  if (piled[0]) bits.push(`${piled[0].name} is the pile`);
  for (const e of empty) bits.push(`${e.name} Empty`);
  return bits.length ? `${bits.join(". ")}.` : EMPTY;
}

export type MarketTone = "empty" | "hunt" | "idea" | "win" | "loss" | "parked";

export type MarketSquare = { id: string; tone: MarketTone };

export type PlantCounts = {
  cells: number;
  certified: number;
  keep: number;
  measuring: number;
  hunting: number;
  kill: number;
};

/** Honest buckets from stamp.counts. Leftover only if cells > the named buckets. */
export function plantCellBuckets(counts: PlantCounts) {
  const win = Math.max(0, counts.certified);
  const parked = Math.max(0, counts.keep - win);
  const idea = Math.max(0, counts.measuring);
  const hunt = Math.max(0, counts.hunting);
  const loss = Math.max(0, counts.kill);
  const used = win + parked + idea + hunt + loss;
  const empty = Math.max(0, counts.cells - used);
  return { empty, hunt, idea, parked, win, loss, used };
}

/**
 * One square per counted cell. Untouched leftover, hunting, and kill first
 * so unused + rejected dominate. Occupied recipes stay the small filled set.
 * Never invents a per-country split or an exchange size.
 */
export function plantCells(counts: PlantCounts): MarketSquare[] {
  const b = plantCellBuckets(counts);
  const out: MarketSquare[] = [];
  const push = (n: number, tone: MarketTone, key: string) => {
    for (let i = 0; i < n; i++) out.push({ id: `${key}-${i}`, tone });
  };
  push(b.empty, "empty", "empty");
  push(b.hunt, "hunt", "hunt");
  push(b.loss, "loss", "kill");
  push(b.idea, "idea", "idea");
  push(b.parked, "parked", "parked");
  push(b.win, "win", "solid");
  return out;
}

export const SQUARE_WINDOWS = ["morning", "late_pre", "near_off", "in_play"] as const;
export type SquareWindow = (typeof SQUARE_WINDOWS)[number];
export const SQUARE_WINDOW_LABEL: Record<SquareWindow, string> = {
  morning: "morning",
  late_pre: "late-pre",
  near_off: "near-off",
  in_play: "in-play",
};

export type SquareMarket = "WIN" | "PLACE" | "LAY";

export type HoleCell = {
  id: string;
  region: string;
  name: string;
  window: SquareWindow;
  market: SquareMarket;
  tone: MarketTone;
};

const TONE_RANK: Record<MarketTone, number> = {
  empty: 0,
  hunt: 1,
  idea: 2,
  parked: 3,
  loss: 4,
  win: 5,
};

const WINDOW_PARSE: [RegExp, SquareWindow][] = [
  [/near[\s_-]*off|nearoff/, "near_off"],
  [/late[\s_-]*pre|latepre/, "late_pre"],
  [/in[\s_-]*play|inplay/, "in_play"],
  [/morning/, "morning"],
];

/** WIN beside PLACE. LAY only when the plant already names it. */
export function plantMarkets(texts: readonly string[]): SquareMarket[] {
  const blob = texts.join(" ");
  if (/(?:^|[^A-Za-z])LAY(?:[^A-Za-z]|$)/.test(blob) && !/display/i.test(blob)) {
    return ["WIN", "PLACE", "LAY"];
  }
  return ["WIN", "PLACE"];
}

export function parseWindow(text: string): SquareWindow | null {
  const lower = text.toLowerCase();
  for (const [re, key] of WINDOW_PARSE) {
    if (re.test(lower)) return key;
  }
  return null;
}

export function parseMarket(text: string): SquareMarket | null {
  const t = text.toUpperCase().replace(/_/g, " ");
  if (/(?:^|[^A-Z])LAY(?:[^A-Z]|$)/.test(t)) return "LAY";
  if (/\bPLACE\b/.test(t)) return "PLACE";
  if (/\bWIN\b/.test(t)) return "WIN";
  return null;
}

/** Country × window × market. All three or nothing — never invent a missing axis. */
export function parseHole(text: string): { region: string; window: SquareWindow; market: SquareMarket } | null {
  const region = regionFromText(text);
  const window = parseWindow(text);
  const market = parseMarket(text);
  if (!region || !window || !market) return null;
  return { region, window, market };
}

function asHoleTone(t?: string): MarketTone | null {
  if (t === "empty" || t === "hunt" || t === "idea" || t === "win" || t === "loss" || t === "parked") return t;
  return null;
}

function occupy(
  map: Map<string, HoleCell>,
  hole: { region: string; window: SquareWindow; market: SquareMarket },
  tone: MarketTone,
) {
  const id = `${hole.region}|${hole.window}|${hole.market}`;
  const cur = map.get(id);
  if (!cur || TONE_RANK[tone] >= TONE_RANK[cur.tone]) {
    map.set(id, { id, region: hole.region, name: countryName(hole.region), window: hole.window, market: hole.market, tone });
  }
}

/**
 * Whole racing square. Empty holes are real squares. Occupied only when the
 * mill names that country × window × market. Never paints 126 kills across countries.
 */
export function racingSquare(input: {
  recipes: readonly Recipe[];
  coverage?: readonly { region: string; keep: number; measuring: number; note?: string }[];
  moves?: readonly { recipe: string; to: string }[];
  floorLog?: readonly { kind?: string; line: string }[];
  huntNotes?: readonly string[];
  namedHoles?: readonly { region: string; window: string; market: string; tone?: string }[];
}): HoleCell[] {
  const texts = [
    ...input.recipes.map((r) => `${r.id} ${r.title} ${r.why}`),
    ...(input.moves ?? []).map((m) => m.recipe),
    ...(input.floorLog ?? []).map((r) => r.line),
    ...(input.huntNotes ?? []),
    ...(input.coverage ?? []).map((c) => c.note ?? ""),
    ...(input.namedHoles ?? []).map((h) => h.market),
  ];
  const markets = plantMarkets(texts);
  const occ = new Map<string, HoleCell>();
  const grid: HoleCell[] = [];
  for (const region of REGIONS) {
    for (const window of SQUARE_WINDOWS) {
      for (const market of markets) {
        const id = `${region}|${window}|${market}`;
        const cell: HoleCell = { id, region, name: countryName(region), window, market, tone: "empty" };
        grid.push(cell);
        occ.set(id, cell);
      }
    }
  }

  const named = input.namedHoles ?? [];
  if (named.length) {
    for (const h of named) {
      const window = parseWindow(h.window) ?? (SQUARE_WINDOWS.includes(h.window as SquareWindow) ? (h.window as SquareWindow) : null);
      const market = parseMarket(h.market);
      const region = REGIONS.includes(h.region as (typeof REGIONS)[number]) ? h.region : regionFromText(h.region);
      if (!region || !window || !market || !markets.includes(market)) continue;
      occupy(occ, { region, window, market }, asHoleTone(h.tone) ?? "idea");
    }
  } else {
    const regionsWithBook = new Set<string>();
    for (const r of input.recipes) {
      const hole = parseHole(`${r.region} ${r.title} ${r.id}`);
      if (!hole) continue;
      regionsWithBook.add(r.region);
      occupy(occ, hole, recipeTone(r));
    }
    for (const m of input.moves ?? []) {
      if (m.to !== "Dead") continue;
      const hole = parseHole(m.recipe);
      if (hole) occupy(occ, hole, "loss");
    }
    for (const row of input.floorLog ?? []) {
      if (row.kind !== "kill" && !/→\s*Dead/i.test(row.line)) continue;
      const hole = parseHole(row.line);
      if (hole) occupy(occ, hole, "loss");
    }
    for (const note of input.huntNotes ?? []) {
      const hole = parseHole(note);
      if (hole) occupy(occ, hole, "hunt");
    }
    for (const c of input.coverage ?? []) {
      if (regionsWithBook.has(c.region)) continue;
      if (c.keep + c.measuring === 0) continue;
      const hole = parseHole(`${c.region} ${c.note ?? ""}`);
      if (!hole) continue;
      occupy(occ, hole, c.keep > 0 ? "parked" : "idea");
    }
  }

  return grid.map((cell) => occ.get(cell.id) ?? cell);
}

export type BookPeriods = {
  paperN: number;
  paperU: number | null;
  holdoutN: number | null;
  holdoutNeed: number | null;
  sameBook: boolean;
  line: string;
};

export type BookStageKind = "same" | "split" | "empty";

export type BookStage = {
  key: "invent" | "paper" | "holdout" | "production" | "live";
  label: string;
  kind: BookStageKind;
  n: number | null;
  u: number | null;
  mark: string;
};

const SPLIT_MARK = "Hyde cousin, not the same picks";

function isSplitBook(recipe: Recipe): boolean {
  return /cousin|not the same pick|different pick|\btwin\b/i.test(`${recipe.why} ${recipe.title}`);
}

/** One book: invent → paper → holdout → production → live. Never recomputes P&L. */
export function bookStages(recipe: Recipe): BookStage[] {
  const periods = bookPeriods(recipe);
  const split = isSplitBook(recipe);
  const invent: BookStage = {
    key: "invent",
    label: "invent",
    kind: split ? "split" : "same",
    n: null,
    u: null,
    mark: split ? SPLIT_MARK : "same",
  };
  const paper: BookStage = {
    key: "paper",
    label: "paper",
    kind: "same",
    n: periods.paperN,
    u: periods.paperU,
    mark: "same",
  };
  const holdout: BookStage = {
    key: "holdout",
    label: "holdout",
    kind: periods.holdoutN == null ? "empty" : split ? "split" : "same",
    n: periods.holdoutN,
    u: null,
    mark: periods.holdoutN == null ? EMPTY : split ? SPLIT_MARK : "same",
  };
  const production: BookStage = {
    key: "production",
    label: "production",
    kind: recipe.badge === "Solid" ? "same" : "empty",
    n: null,
    u: null,
    mark: recipe.badge === "Solid" ? "same" : EMPTY,
  };
  const live: BookStage = {
    key: "live",
    label: "live",
    kind: "empty",
    n: null,
    u: null,
    mark: EMPTY,
  };
  return [invent, paper, holdout, production, live];
}

export function bookStageLine(stages: readonly BookStage[]): string {
  return stages
    .map((s) => {
      if (s.kind === "empty") return `${s.label} ${EMPTY}`;
      if (s.kind === "split") return `${s.label} ${s.mark}`;
      const n = s.n != null ? ` n=${s.n}` : "";
      return `${s.label} ${s.mark}${n}`;
    })
    .join(" · ");
}

/** Fuse off is the law, not a problem. */
export function isLawNotIssue(iss: { id: string; title?: string }): boolean {
  return iss.id === "live-subset" || /real betting is off/i.test(iss.title ?? "");
}

export function officeIssues(
  issues: readonly { id: string; owner: string; title: string; detail: string; fix: string }[],
): IssueRow[] {
  return issues.filter((iss) => !isLawNotIssue(iss)).map(issueBoard);
}

/** Paper and holdout as two periods of one book. Never recomputes P&L. */
export function bookPeriods(recipe: Recipe): BookPeriods {
  const paperN = Number.isFinite(recipe.n) ? recipe.n : 0;
  const paperU = Number.isFinite(recipe.freezePnl) ? recipe.freezePnl : null;
  const m = /holdout\s+(\d+)\s*\/\s*(\d+)/i.exec(recipe.why);
  if (!m) {
    return {
      paperN,
      paperU,
      holdoutN: null,
      holdoutNeed: null,
      sameBook: false,
      line: "Holdout Empty. The stamp does not prove paper and holdout are the same pick set.",
    };
  }
  const holdoutN = Number.parseInt(m[1], 10);
  const holdoutNeed = Number.parseInt(m[2], 10);
  const short = holdoutN < holdoutNeed ? " Not enough holdout races yet." : "";
  return {
    paperN,
    paperU,
    holdoutN,
    holdoutNeed,
    sameBook: true,
    line: `Same book. Holdout is later races.${short}`,
  };
}

export function rejectEnglish(raw: string): string {
  const t = raw.trim();
  if (!t) return EMPTY;
  if (/card_axes_on_geo_broad/i.test(t)) {
    return "The gate sent Geo's card axes back on South Africa, New Zealand, and the United States. Those books are too broad.";
  }
  const snake = t.match(/\b([a-z]+_[a-z0-9_]+)\b/);
  if (snake) {
    return `The gate sent it back (${snake[1].replace(/_/g, " ")}).`;
  }
  return EMPTY;
}

/** Invent queue and reject in short English so Office does not look stalled. */
export function inventWhatHappened(input: {
  invent: boolean;
  inventWhy: string;
  pitched: number;
  hunters: readonly { id: string; note: string }[];
  rejects?: readonly string[];
}): string {
  const notes = [input.inventWhy, ...input.hunters.map((h) => h.note), ...(input.rejects ?? [])];
  const bits: string[] = [];
  if (input.invent) bits.push("Invent is on.");
  if (input.pitched > 0) bits.push(`${input.pitched} new ideas in the queue.`);
  const hole =
    notes.map(inventHole).find((n) => n !== EMPTY) ?? EMPTY;
  const hunter = input.hunters.find((h) => inventHole(h.note) !== EMPTY);
  if (hole !== EMPTY) {
    bits.push(`${hunter ? hunterName(hunter.id) : "Geo"} is looking at ${hole}.`);
  }
  const reject = notes.map(rejectEnglish).find((n) => n !== EMPTY);
  if (reject) bits.push(reject);
  else if (input.invent || input.pitched > 0) bits.push("The mill is not stalled.");
  return bits.length ? bits.join(" ") : EMPTY;
}

export type MarketCountry = {
  region: string;
  name: string;
  n: number;
  empty: boolean;
  squares: MarketSquare[];
  caption: string;
};

export function recipeTone(recipe: Recipe): MarketTone {
  if (recipe.badge === "Solid") return "win";
  if (recipe.badge === "Dead" || recipe.status === "KILL") return "loss";
  if (recipe.status === "MEASURING" || recipe.badge === "Research") return "idea";
  if (recipe.status === "KEEP") return "parked";
  return "idea";
}

export function regionFromText(text: string): string | null {
  const t = text.toUpperCase();
  for (const r of REGIONS) {
    if (new RegExp(`\\b${r}\\b`).test(t)) return r;
  }
  return null;
}

/** One loss mark per country that the stamp actually killed. Never 126 red squares. */
export function countryKillMarks(
  moves: readonly { recipe: string; to: string }[],
  log: readonly { kind?: string; line: string }[] = [],
): Set<string> {
  const regions = new Set<string>();
  for (const m of moves) {
    if (m.to !== "Dead") continue;
    const r = regionFromText(m.recipe);
    if (r) regions.add(r);
  }
  for (const row of log) {
    if (row.kind !== "kill" && !/→\s*Dead/i.test(row.line)) continue;
    const r = regionFromText(row.line);
    if (r) regions.add(r);
  }
  return regions;
}

/** `1 solid of 161 cells. 126 killed.` Occupied vs Empty — not a percent of world racing. */
export function capitalisingLine(counts: {
  certified: number;
  cells: number;
  kill: number;
}): string {
  const bits = [`${counts.certified} solid of ${counts.cells} cells`];
  if (counts.kill > 0) bits.push(`${counts.kill} killed`);
  return `${bits.join(". ")}.`;
}

export function marketGlance(
  countries: readonly MarketCountry[],
  counts: { certified: number; cells: number; kill: number },
): string {
  const cap = capitalisingLine(counts);
  const empty = countries.filter((c) => c.empty);
  if (!empty.length) return cap;
  return `${cap} ${empty.map((e) => `${e.name} Empty`).join(". ")}.`.replace(/\.\s*\./g, ".");
}

/** Size ∝ sum of recipe n. Squares are named recipes + coverage extras + honest kill marks. */
export function sizeMarket(
  coverage: readonly { region: string; keep: number; measuring: number }[],
  recipes: readonly Recipe[],
  moves: readonly { recipe: string; to: string }[] = [],
  log: readonly { kind?: string; line: string }[] = [],
): MarketCountry[] {
  const kills = countryKillMarks(moves, log);
  const named = new Map<string, Recipe[]>();
  for (const r of recipes) {
    const list = named.get(r.region) ?? [];
    list.push(r);
    named.set(r.region, list);
  }
  const seen = new Set<string>();
  const rows: MarketCountry[] = [];
  const push = (region: string, keep: number, measuring: number) => {
    if (seen.has(region)) return;
    seen.add(region);
    const list = named.get(region) ?? [];
    const n = list.reduce((s, r) => s + (Number.isFinite(r.n) ? r.n : 0), 0);
    const squares: MarketSquare[] = list.map((r) => ({ id: r.id, tone: recipeTone(r) }));
    const namedParked = squares.filter((s) => s.tone === "parked").length;
    const namedWin = squares.filter((s) => s.tone === "win").length;
    const namedIdea = squares.filter((s) => s.tone === "idea").length;
    const extraParked = Math.max(0, keep - namedParked - namedWin);
    const extraIdea = Math.max(0, measuring - namedIdea);
    for (let i = 0; i < extraParked; i++) squares.push({ id: `${region}-parked-${i}`, tone: "parked" });
    for (let i = 0; i < extraIdea; i++) squares.push({ id: `${region}-idea-${i}`, tone: "idea" });
    if (kills.has(region) && !squares.some((s) => s.tone === "loss")) {
      squares.push({ id: `${region}-kill`, tone: "loss" });
    }
    const empty = keep + measuring === 0 && list.length === 0 && !kills.has(region);
    const win = list.find((r) => recipeTone(r) === "win");
    const caption = win && win.n > 0 ? `n=${win.n}` : n > 0 ? `n=${n}` : "";
    rows.push({ region, name: countryName(region), n, empty, squares, caption });
  };
  for (const c of coverage) push(c.region, c.keep, c.measuring);
  for (const r of recipes) push(r.region, 0, 0);
  return rows.sort((a, b) => {
    if (a.empty !== b.empty) return a.empty ? 1 : -1;
    return b.n - a.n || a.name.localeCompare(b.name);
  });
}

export type SizeBox = MarketCountry & { x: number; y: number; w: number; h: number };

/** Treemap area ∝ measured n. x/y/w/h are percents of the market box, so height is 100. */
export function sizePackBoxes(
  countries: readonly MarketCountry[],
  width = 100,
  height = 100,
): SizeBox[] {
  const items = countries.map((c) => ({ ...c, value: Math.max(c.n, 1) }));
  if (!items.length || width <= 0 || height <= 0) return [];
  const total = items.reduce((s, n) => s + n.value, 0);
  const scale = (width * height) / total;
  return splitRects(
    items.map((n) => ({ ...n, area: n.value * scale })),
    0,
    0,
    width,
    height,
  );
}

type SplitNode = MarketCountry & { value: number; area: number };

function splitRects(items: SplitNode[], x: number, y: number, w: number, h: number): SizeBox[] {
  if (!items.length) return [];
  if (items.length === 1) {
    const it = items[0];
    return [{ ...it, x, y, w, h }];
  }
  const total = items.reduce((s, i) => s + i.value, 0);
  let acc = 0;
  let cut = 1;
  for (let i = 0; i < items.length; i++) {
    acc += items[i].value;
    cut = i + 1;
    if (acc >= total / 2) break;
  }
  if (cut >= items.length) cut = items.length - 1;
  const left = items.slice(0, cut);
  const right = items.slice(cut);
  const leftSum = left.reduce((s, i) => s + i.value, 0);
  const frac = leftSum / total;
  if (w >= h) {
    const lw = w * frac;
    return [...splitRects(left, x, y, lw, h), ...splitRects(right, x + lw, y, w - lw, h)];
  }
  const lh = h * frac;
  return [...splitRects(left, x, y, w, lh), ...splitRects(right, x, y + lh, w, h - lh)];
}

export type PackBox = CountryRow & { x: number; y: number; w: number; h: number };

type AreaNode = CountryRow & { value: number; area: number };

/** Squarified treemap. Outer area ∝ parked+testing. Empty omitted. */
export function countryPackBoxes(
  rows: readonly CountryRow[],
  width = 100,
  height = 100,
): PackBox[] {
  const items = [...rows]
    .filter((r) => countryPile(r) > 0)
    .map((r) => ({ ...r, value: countryPile(r) }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  if (!items.length || width <= 0 || height <= 0) return [];
  const total = items.reduce((s, n) => s + n.value, 0);
  const scale = (width * height) / total;
  return squarify(
    items.map((n) => ({ ...n, area: n.value * scale })),
    0,
    0,
    width,
    height,
  );
}

function worstAspect(row: AreaNode[], side: number): number {
  if (!row.length || side <= 0) return Number.POSITIVE_INFINITY;
  const sum = row.reduce((s, n) => s + n.area, 0);
  if (sum <= 0) return Number.POSITIVE_INFINITY;
  const across = sum / side;
  if (across <= 0) return Number.POSITIVE_INFINITY;
  let worst = 0;
  for (const n of row) {
    const along = n.area / across;
    worst = Math.max(worst, along / across, across / along);
  }
  return worst;
}

function squarify(nodes: AreaNode[], x: number, y: number, w: number, h: number): PackBox[] {
  const out: PackBox[] = [];
  let rest = nodes;
  let cx = x;
  let cy = y;
  let cw = w;
  let ch = h;

  const flush = (row: AreaNode[]) => {
    const sum = row.reduce((s, n) => s + n.area, 0);
    if (sum <= 0 || cw <= 0 || ch <= 0) return;
    if (cw >= ch) {
      const stripW = sum / ch;
      let yy = cy;
      for (const n of row) {
        const hh = n.area / stripW;
        out.push(boxOf(n, cx, yy, stripW, hh));
        yy += hh;
      }
      cx += stripW;
      cw -= stripW;
    } else {
      const stripH = sum / cw;
      let xx = cx;
      for (const n of row) {
        const ww = n.area / stripH;
        out.push(boxOf(n, xx, cy, ww, stripH));
        xx += ww;
      }
      cy += stripH;
      ch -= stripH;
    }
  };

  while (rest.length) {
    if (cw < 1e-6 || ch < 1e-6) {
      const leftover = rest.reduce((s, n) => s + n.area, 0);
      if (leftover > 0) {
        out.push(
          boxOf(
            {
              ...rest[0],
              area: leftover,
              value: rest.reduce((s, n) => s + n.value, 0),
            },
            cx,
            cy,
            Math.max(cw, 0),
            Math.max(ch, 0),
          ),
        );
      }
      break;
    }
    const side = Math.min(cw, ch);
    const row: AreaNode[] = [];
    for (const node of rest) {
      const next = [...row, node];
      if (row.length && worstAspect(next, side) > worstAspect(row, side)) break;
      row.push(node);
    }
    rest = rest.slice(row.length);
    flush(row);
  }
  return out;
}

function boxOf(n: AreaNode, x: number, y: number, w: number, h: number): PackBox {
  return {
    region: n.region,
    name: n.name,
    parked: n.parked,
    testing: n.testing,
    line: n.line,
    x,
    y,
    w,
    h,
  };
}

/** Status in English. Drops holdout_n_too_small and plant tokens. */
export function recipeStatus(recipe: Recipe): string {
  if (recipe.status === "MEASURING" || recipe.badge === "Research") {
    return "Still being tested. Not the score.";
  }
  if (recipe.status === "KEEP" && recipe.badge !== "Solid") {
    if (/holdout_n_too_small|holdout \d+\/\d+/i.test(recipe.why)) {
      return "Parked. Not certified. Not enough holdout races yet.";
    }
    return "Parked. Not today's production.";
  }
  if (recipe.badge === "Solid") return "Certified. On the production tape.";
  return "Parked. Not today's production.";
}

export function hunterName(id: string): string {
  return HUNTER_NAME[id] ?? id.replace(/^\w/, (c) => c.toUpperCase());
}

/** What a hunter is doing, in English. FLOWING / pitched= / conv% never reach the surface. */
export function hunterWork(note: string): string {
  const raw = note ?? "";
  if (!raw.trim() || /no open deals/i.test(raw)) return EMPTY;
  const queue = /queue\s+([^·]+)/i.exec(raw);
  if (queue) {
    const named = holeName(queue[1].trim());
    return named !== EMPTY ? `Looking at ${named}` : EMPTY;
  }
  const pitched = /pitched=(\d+)/i.exec(raw);
  const proving = /proving=(\d+)/i.exec(raw);
  if (pitched || proving) {
    const bits: string[] = [];
    const p = pitched ? Number.parseInt(pitched[1], 10) : 0;
    const m = proving ? Number.parseInt(proving[1], 10) : 0;
    if (p > 0) bits.push(`${p} new idea${p === 1 ? "" : "s"}`);
    if (m > 0) bits.push(`${m} still being tested`);
    return bits.length ? `Working ${bits.join(", ")}` : EMPTY;
  }
  let cleaned = raw
    .replace(/\bFLOWING\b/gi, "")
    .replace(/\bHELD\b/gi, "Held")
    .replace(/conv\s*\d+(?:\.\d+)?%/gi, "")
    .replace(/invent\s*\(densify\)/gi, "")
    .replace(/\bdensify\b/gi, "")
    .replace(/\bPareto\b/gi, "")
    .replace(/\s*·\s*/g, ". ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .trim();
  if (/pitched=|conv |holdout_n|LIVE_CANDIDATE/i.test(cleaned)) return EMPTY;
  return cleaned || EMPTY;
}

export type WorkerRow = { id: string; name: string; work: string };

export function officeWorkers(
  hunters: readonly { id: string; note: string }[],
  activeId?: string | null,
): WorkerRow[] {
  const rows = hunters
    .map((h) => ({ id: h.id, name: hunterName(h.id), work: hunterWork(h.note) }))
    .filter((h) => h.work !== EMPTY);
  if (!activeId) return rows;
  return [...rows].sort((a, b) => Number(b.id === activeId) - Number(a.id === activeId));
}

export type PipeStage = {
  key: string;
  label: string;
  count: number;
  hint: string;
  stuck: boolean;
};

export type PipeBoard = {
  stages: PipeStage[];
  stuck: string;
};

export function pipeBoard(
  pipe: { pitched: number; proving: number; closed: number; certified: number; scaling: number },
  fuseOn: boolean,
): PipeBoard {
  const live = fuseOn ? pipe.scaling : 0;
  const stages: PipeStage[] = [
    { key: "pitched", label: "New ideas", count: pipe.pitched, hint: "", stuck: false },
    { key: "proving", label: "Being tested", count: pipe.proving, hint: "", stuck: false },
    { key: "closed", label: "Out of window", count: pipe.closed, hint: "", stuck: false },
    { key: "certified", label: "Solid", count: pipe.certified, hint: "the score", stuck: false },
    {
      key: "live",
      label: "Live",
      count: live,
      hint: fuseOn ? "" : "off while the fuse is off",
      stuck: false,
    },
  ];

  const peak = Math.max(pipe.pitched, pipe.proving, pipe.closed);
  let stuckKey: string | null = null;
  if (pipe.proving >= pipe.pitched && pipe.proving >= pipe.closed && pipe.proving > pipe.certified) {
    stuckKey = "proving";
  } else if (pipe.pitched > pipe.proving && pipe.pitched > pipe.certified) {
    stuckKey = "pitched";
  } else if (!fuseOn) {
    stuckKey = "live";
  }
  if (stuckKey && peak === 0 && stuckKey !== "live") stuckKey = fuseOn ? null : "live";

  const marked = stages.map((s) => ({ ...s, stuck: s.key === stuckKey }));
  const bits: string[] = [];
  if (pipe.proving > 0) bits.push(`${pipe.proving} still being tested`);
  if (pipe.certified > 0) bits.push(`${pipe.certified} solid`);
  if (!fuseOn) bits.push("Live is off");
  if (pipe.pitched > 0 && pipe.proving === 0 && pipe.certified === 0) {
    bits.unshift(`${pipe.pitched} new ideas`);
  }
  return { stages: marked, stuck: bits.length ? `${bits.join(". ")}.` : EMPTY };
}

export type FactorySquare = { id: string; key: string; label: string };

/** One unit square per recipe in a stage. Count 0 — including Live while the fuse is off — adds none. */
export function factorySquares(stages: readonly PipeStage[]): FactorySquare[] {
  const out: FactorySquare[] = [];
  for (const s of stages) {
    const n = Number.isFinite(s.count) ? Math.max(0, Math.floor(s.count)) : 0;
    for (let i = 0; i < n; i++) {
      out.push({ id: `${s.key}-${i}`, key: s.key, label: s.label });
    }
  }
  return out;
}

export type HealthGroup = "broken" | "watching" | "fine";

export type HealthRow = {
  id: string;
  group: HealthGroup;
  sentence: string;
  why: string;
};

function groupOf(status: string): HealthGroup {
  if (status === "RED") return "broken";
  if (status === "AMBER") return "watching";
  return "fine";
}

function healthKnown(k: { id: string; label: string; detail: string; status: string }): HealthRow | null {
  const d = k.detail ?? "";
  switch (k.id) {
    case "invent":
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: /on|densify/i.test(d) ? "Invent is running." : "Invent is paused.",
        why: "New ideas are still being found.",
      };
    case "doer":
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: "The last pass completed.",
        why: "The doer is clear.",
      };
    case "tick": {
      const m = /Age\s+(\d+)\s*m/i.exec(d);
      const n = m?.[1];
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: n ? `The lab ticked ${n} minute${n === "1" ? "" : "s"} ago.` : "The lab ticked recently.",
        why: "The stamp is fresh.",
      };
    }
    case "path":
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: "The path is clean.",
        why: "Picks still match paper.",
      };
    case "factory":
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: "Money is on paper only.",
        why: "A keep is parked, not certified for today.",
      };
    case "residual": {
      const m = /Lag\s+(\d+)\s*d/i.exec(d);
      const n = m?.[1];
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: n ? `Residual is ${n} day${n === "1" ? "" : "s"} behind.` : "Residual is behind.",
        why: "That hunter has not caught up.",
      };
    }
    case "card": {
      const m = /ok=(\d+)/i.exec(d);
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: "Card join is fine.",
        why: m ? `${m[1]} joins landed.` : "Joins are landing.",
      };
    }
    case "live":
      return {
        id: k.id,
        group: groupOf(k.status),
        sentence: /fuse off|0 orders/i.test(d) ? "Live is off." : "Live is quiet.",
        why: "The fuse is off. No live orders.",
      };
    default:
      return null;
  }
}

export function healthRow(k: { id: string; label: string; detail: string; status: string }): HealthRow {
  return (
    healthKnown(k) ?? {
      id: k.id,
      group: groupOf(k.status),
      sentence: k.label.replace(/\.$/, "") + ".",
      why: k.detail || EMPTY,
    }
  );
}

export function healthBoard(kpis: readonly { id: string; label: string; detail: string; status: string }[]) {
  const rows = kpis.map(healthRow);
  return {
    broken: rows.filter((r) => r.group === "broken"),
    watching: rows.filter((r) => r.group === "watching"),
    fine: rows.filter((r) => r.group === "fine"),
    glance: healthGlance(rows),
  };
}

function healthGlance(rows: HealthRow[]): string {
  const n = {
    broken: rows.filter((r) => r.group === "broken").length,
    watching: rows.filter((r) => r.group === "watching").length,
    fine: rows.filter((r) => r.group === "fine").length,
  };
  const bits: string[] = [];
  if (n.broken) bits.push(`${n.broken} broken`);
  if (n.watching) bits.push(`${n.watching} watching`);
  if (n.fine) bits.push(`${n.fine} fine`);
  return bits.length ? `${bits.join(". ")}.` : EMPTY;
}

export type IssueRow = {
  id: string;
  owner: string;
  problem: string;
  next: string;
};

const ISSUE_COPY: Record<string, { problem: string; next: string }> = {
  "keep-hold-paper": {
    problem: "A keep is on hold this tick.",
    next: "Inspect the keep gate. Do not arm the fuse.",
  },
  "keep-not-solid": {
    problem: "Parked research is not today's production.",
    next: "Leave it parked. Do not treat it as income.",
  },
  "live-subset": {
    problem: "Real betting is off. Nothing is live.",
    next: "Leave the fuse off until a solid is on tape.",
  },
};

export function issueBoard(iss: { id: string; owner: string; title: string; detail: string; fix: string }): IssueRow {
  const known = ISSUE_COPY[iss.id];
  return {
    id: iss.id,
    owner: iss.owner,
    problem: known?.problem ?? iss.title,
    next: known?.next ?? iss.fix,
  };
}

export type StaffWatchStamp = {
  recipes: readonly Recipe[];
  solids?: readonly Recipe[];
  moves?: readonly Move[];
  office?: { invent?: boolean; inventWhy?: string };
  hunters?: readonly { id: string; note: string }[];
  issues?: readonly { id: string; title?: string; owner?: string }[];
};

function bookLabel(raw: string, recipes: readonly Recipe[] = []): string {
  const id = /H-[A-Za-z0-9-]+/.exec(raw)?.[0];
  if (id) {
    const hit = recipes.find((r) => r.id === id);
    if (hit?.title) return hit.title;
    const named = cellName(id);
    if (named && named !== EMPTY) return named;
  }
  const titled = recipes.find((r) => r.title === raw || r.id === raw);
  if (titled?.title) return titled.title;
  const cell = cellName(raw);
  if (cell && cell !== EMPTY) return cell;
  const hole = holeName(raw);
  return hole !== EMPTY ? hole : "";
}

function firstRecipeId(text: string): string {
  return /(?:first:\s*)?(H-[A-Za-z0-9-]+)/i.exec(text)?.[1] ?? "";
}

function staffBookFacts(seatNow: string, stamp: StaffWatchStamp) {
  const blob = [seatNow, stamp.office?.inventWhy ?? "", ...(stamp.hunters ?? []).map((h) => h.note)].join(" ");
  const recipes = stamp.recipes ?? [];
  const solids = (stamp.solids?.length ? stamp.solids : recipes.filter((r) => r.badge === "Solid")) ?? [];
  const tape = solids[0] ?? recipes.find((r) => r.badge === "Solid") ?? null;
  const parked = recipes.filter((r) => r.badge === "Parked" || (r.status === "KEEP" && r.badge !== "Solid"));
  const trial = recipes.find((r) => r.status === "MEASURING") ?? null;
  const hydeTrials = recipes.filter((r) => /hyde|cousin/i.test(`${r.id} ${r.title} ${r.why}`));
  for (const id of blob.match(/H-hyde-[A-Za-z0-9-]+/gi) ?? []) {
    if (!hydeTrials.some((r) => r.id === id)) {
      hydeTrials.push({
        id,
        title: bookLabel(id, recipes) || "Hyde cousin",
        region: "GB",
        status: "MEASURING",
        badge: "Research",
        chip: null,
        n: 0,
        roi: 0,
        freezePnl: 0,
        why: "Hyde cousin, not the same picks",
      });
    }
  }
  const fillAdjKills = (stamp.moves ?? []).filter((m) => /fill-adj/i.test(m.why) && /dead/i.test(m.to));
  const inventCell =
    inventHole(stamp.office?.inventWhy ?? "") !== EMPTY
      ? inventHole(stamp.office?.inventWhy ?? "")
      : inventHole(seatNow) !== EMPTY
        ? inventHole(seatNow)
        : (() => {
            const q = /(?:next hole|queue)\s+([A-Za-z0-9_|-]+)/i.exec(blob);
            return q ? holeName(q[1]) : EMPTY;
          })();
  const densify = /\bdensify\b/i.test(blob);
  const holdId = firstRecipeId(seatNow);
  const holdBook = holdId ? bookLabel(holdId, recipes) : "";
  const tapeName = tape?.title ?? "";
  return { recipes, tape, tapeName, parked, trial, hydeTrials, fillAdjKills, inventCell, densify, holdBook };
}

function sentences(...parts: Array<string | false | null | undefined>): string {
  const bits = parts.filter((p): p is string => typeof p === "string" && p.trim().length > 0).map((p) => p.trim());
  return bits.length ? bits.join(" ") : EMPTY;
}

/** Each seat watches that the pipeline is the same bets. Empty if nothing. */
export function seatWatching(seat: Pick<Seat, "id" | "now">, stamp: StaffWatchStamp): string {
  const now = seat.now?.trim() ?? "";
  const f = staffBookFacts(now, stamp);
  switch (seat.id) {
    case "bauron": {
      const cell = f.inventCell !== EMPTY ? f.inventCell : "";
      if (!cell && !f.densify && !stamp.office?.invent) return now ? staffLine(now) : EMPTY;
      return sentences(
        cell ? `Inventing ${cell} — this cell’s bets.` : stamp.office?.invent ? "Invent is on." : "",
        f.densify
          ? `A densify cousin is a new book${f.tapeName ? `, not ${f.tapeName}` : ""}.`
          : "",
      );
    }
    case "igor": {
      if (!f.tapeName) return EMPTY;
      return `Scoring those same freeze bets as ${f.tapeName}.`;
    }
    case "hyde": {
      const cousin = f.hydeTrials[0];
      if (cousin && f.tapeName) {
        return `The Hyde trial (${cousin.title}) is a SHARPEN cousin, not the ${f.tapeName} KEEP.`;
      }
      if (cousin) return `${cousin.title} is a SHARPEN cousin, not the KEEP.`;
      if (f.tapeName) return `${f.tapeName} KEEP is the original. No Hyde SHARPEN cousin named.`;
      return EMPTY;
    }
    case "clerk": {
      if (!f.tapeName && !f.holdBook && f.fillAdjKills.length === 0) return EMPTY;
      const stages = f.tape ? bookStages(f.tape) : [];
      const same = stages.length > 0 && stages.filter((s) => s.key !== "live").every((s) => s.kind !== "split");
      const live = stages.find((s) => s.key === "live");
      const fill = f.fillAdjKills[0];
      const fillName = fill ? bookLabel(fill.recipe, f.recipes) : "";
      return sentences(
        f.tapeName
          ? same
            ? `${f.tapeName} is the same pick set through paper, holdout, and production.`
            : `${f.tapeName} is a split — not the same picks through the book.`
          : "",
        live?.kind === "empty" ? "Live Empty." : "",
        f.holdBook && f.holdBook !== f.tapeName ? `${f.holdBook} is on hold. Not the tape.` : "",
        fillName ? `Holdout fill-adj killed ${fillName} — not this book.` : "",
        "A Hyde cousin is not it.",
      );
    }
    case "foreman": {
      if (!f.tapeName && !f.trial && !f.parked[0]) return EMPTY;
      const other =
        f.trial && f.trial.title !== f.tapeName
          ? `${f.trial.title} is on trial, not the tape.`
          : f.parked[0] && f.parked[0].title !== f.tapeName
            ? `${f.parked[0].title} is parked, not the tape.`
            : "";
      return sentences(
        f.tapeName ? `Tape KEEP is ${f.tapeName}.` : "",
        other,
        "Do not treat a Hyde cousin as a restore.",
      );
    }
    case "virchow": {
      const kill = f.fillAdjKills[0] ?? (stamp.moves ?? []).find((m) => /dead/i.test(m.to));
      if (!kill) return EMPTY;
      const name = bookLabel(kill.recipe, f.recipes);
      return `${name} is dead${/fill-adj/i.test(kill.why) ? " from holdout fill-adj" : ""}. That kill is that book, not a twin of a dead school.`;
    }
    case "mercator": {
      const hole = f.inventCell !== EMPTY ? f.inventCell : holeName(/next hole:\s*([^\s·,]+)/i.exec(now)?.[1] ?? "");
      if (!hole || hole === EMPTY) return EMPTY;
      return `Next hole is ${hole}. A hole, not a new product type.`;
    }
    case "curator": {
      if (!f.tapeName) return EMPTY;
      return `Freeze fuel for ${f.tapeName}.`;
    }
    default:
      return now ? staffLine(now) : EMPTY;
  }
}

/** Staff watching line in English. Layout stays; plant tokens do not. */
export function staffLine(now: string): string {
  if (!now?.trim()) return EMPTY;
  let s = now;
  s = s.replace(/next hole:\s*([^\s·,]+)/gi, (_, hole) => `Next gap: ${holeName(hole)}`);
  s = s.replace(/first:\s*(H-[A-Za-z0-9-]+)/gi, (_, id) => holeName(id));
  s = s.replace(/H-[A-Za-z0-9-]+/g, (id) => holeName(id));
  s = s.replace(/Measuring n=(\d+)/gi, "Watching $1 still being tested");
  s = s.replace(/proving=(\d+)/gi, "$1 still being tested");
  s = s.replace(/pitched=(\d+)/gi, "$1 new ideas");
  s = s.replace(/closed=(\d+)/gi, "$1 out of window");
  s = s.replace(/certified=(\d+)/gi, "$1 solid");
  s = s.replace(/scaling=(\d+)/gi, "$1 live");
  s = s.replace(/passed=(\d+)/gi, "");
  s = s.replace(/KEEP=(\d+)/gi, "$1 keeps");
  s = s.replace(/keep=(\d+)/gi, "$1 parked");
  s = s.replace(/measuring=(\d+)/gi, "$1 still being tested");
  s = s.replace(/n_applied\s*(\d+)/gi, "$1 applied this shift");
  s = s.replace(/n_schools\s*(\d+)/gi, "$1 on the kill list");
  s = s.replace(/keep_hold_paper[:\s]*/gi, "A keep is on hold. ");
  s = s.replace(/PAPER_ONLY/gi, "Paper only");
  s = s.replace(/fuse off/gi, "Fuse off");
  s = s.replace(/invent on/gi, "Invent is on");
  s = s.replace(/invent\s*\([^)]*\)/gi, "");
  s = s.replace(/\bdensify\b/gi, "");
  s = s.replace(/hunter\s+(\w+)/gi, (_, n) => hunterName(String(n).toLowerCase()));
  s = s.replace(/not LIVE_CANDIDATE this tick/gi, "cannot go live this tick");
  s = s.replace(/not LIVE_CANDIDATE[^.·—]*/gi, "cannot go live this tick");
  s = s.replace(/scoreboard KEEP\(s\)/gi, "A keep");
  s = s.replace(/KEEP on hold\s*\(n=\d+\)/gi, "A keep is on hold");
  s = s.replace(/KEEP on hold/gi, "A keep is on hold");
  s = s.replace(/exotic green/gi, "exotic freezes are fine");
  s = s.replace(/\btick\s*·/gi, "");
  s = s.replace(/\s*[·—]\s*/g, ". ");
  s = s.replace(/\b(n_applied|n_schools|keep_hold_paper|LIVE_CANDIDATE|holdout_n_too_small)\b/gi, "");
  s = s.replace(/\b\w+=\d+(?:\.\d+)?%?/g, "");
  s = s.replace(/\(\s*\)/g, "");
  s = s.replace(/\s{2,}/g, " ");
  s = s.replace(/^[.\s]+|[.\s]+$/g, "");
  s = s.replace(/(A keep is on hold\.\s*){2,}/gi, "A keep is on hold. ");
  s = s.replace(/\s{2,}/g, " ").replace(/^[.\s]+|[.\s]+$/g, "").trim();
  return s || EMPTY;
}
