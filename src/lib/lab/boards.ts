/** Display English for Office, Pipe, Health, Issues. Never invents counts. */

import { EMPTY, cellName, recipePack } from "./desk.ts";
import type { Recipe } from "./stamp.ts";

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
