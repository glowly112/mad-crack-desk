import { STAMP, type Recipe } from "./stamp.ts";

export type StampSource = "oracle" | "digest" | "freeze";

export type BoardRow = {
  day: string;
  stamp: string;
  fuse: string;
  invent: string;
  keep: number;
  kill: number;
  measuring: number;
  keepPaper: number;
  keepLiveEnv?: number | null;
  ops: "GREEN" | "AMBER" | "RED";
};

export type StaffRow = {
  seat: string;
  status: "GREEN" | "AMBER" | "RED" | "IDLE";
  watching: string | null;
};

export type HistoryRow = {
  day: string;
  stamp: string;
  keep: number;
  kill: number;
  measuring: number;
  keepPaper: number;
};

export type Digest = {
  board: BoardRow;
  history?: HistoryRow[];
  staff: StaffRow[];
  hunters: StaffRow[];
};

export type ParsedLine = {
  day_u: number | null;
  n_solid: number;
  fuse_on: boolean;
  generated: string;
};

const SCORE_RE =
  /Score\s+(—|[+\-]?\d+(?:\.\d+)?u?)\s*·\s*Solids\s+(\d+)\s*·\s*Real betting:\s*(OFF|ON)(?:\s*·\s*(\S+))?/i;

export function parseStampLine(line: string): ParsedLine {
  const m = SCORE_RE.exec(line);
  if (!m) {
    return { day_u: null, n_solid: 0, fuse_on: false, generated: "" };
  }
  const raw = m[1];
  const day_u = raw === "—" ? null : Number.parseFloat(raw);
  return {
    day_u: Number.isFinite(day_u) ? day_u : null,
    n_solid: Number.parseInt(m[2], 10) || 0,
    fuse_on: m[3].toUpperCase() === "ON",
    generated: m[4] ?? "",
  };
}

function hunterState(watching: string | null): "FLOWING" | "HELD" {
  const w = watching ?? "";
  if (/\bHELD\b/i.test(w)) return "HELD";
  return "FLOWING";
}

function hunterId(seat: string): string {
  return seat.toLowerCase().replace(/\s+/g, "");
}

function seatId(seat: string): string {
  return seat.toLowerCase();
}

function parsePipe(watching: string | null) {
  const w = watching ?? "";
  const n = (k: string) => {
    const m = new RegExp(`${k}=(\\d+)`).exec(w);
    return m ? Number.parseInt(m[1], 10) : null;
  };
  return {
    pitched: n("pitched"),
    proving: n("proving"),
    closed: n("closed"),
    certified: n("certified"),
    scaling: n("scaling"),
  };
}

function parseHunter(watching: string | null): string | null {
  const m = /hunter\s+([^·]+)/i.exec(watching ?? "");
  return m ? m[1].trim() : null;
}

export function applyDigest(digest: Digest, base: typeof STAMP = STAMP) {
  const parsed = parseStampLine(digest.board.stamp);
  const fuse_on = digest.board.fuse.toLowerCase() === "on" || parsed.fuse_on;
  const inventOn = /invent on/i.test(digest.board.invent);
  const pipeFrom = parsePipe(digest.staff.find((s) => s.seat === "Bauron")?.watching ?? null);
  const activeHunter = parseHunter(digest.staff.find((s) => s.seat === "Bauron")?.watching ?? null);

  const seats = base.seats.map((seat) => {
    const row = digest.staff.find((s) => seatId(s.seat) === seat.id);
    if (!row) return seat;
    return {
      ...seat,
      status: row.status,
      now: row.watching || seat.now,
    };
  });

  const hunters = base.hunters.map((h) => {
    const row = digest.hunters.find((s) => hunterId(s.seat) === h.id);
    if (!row) return h;
    return {
      ...h,
      state: hunterState(row.watching),
      note: row.watching || h.note,
    };
  });

  const trends = base.trends.map((t) => {
    const row = digest.history?.find((h) => h.day === t.day);
    if (!row) return t;
    const p = parseStampLine(row.stamp);
    return {
      ...t,
      paper_live_day_u: p.day_u,
      n_solid: p.n_solid,
      n_keep: row.keep,
      n_measuring: row.measuring,
      n_dropped: row.kill,
    };
  });

  return {
    ...base,
    day: digest.board.day,
    generated: parsed.generated || digest.board.day,
    source: "digest" as StampSource,
    n_solid: parsed.n_solid,
    fuse_on,
    fuse: fuse_on ? "Real betting: ON" : "Real betting: OFF",
    plantHealth: digest.board.ops,
    plantLine: inventOn ? `Invent ${digest.board.invent}` : digest.board.invent,
    researchKeepGbp: digest.board.keepPaper,
    hero: {
      ...base.hero,
      day_u: parsed.day_u,
    },
    counts: {
      keep: digest.board.keep,
      certified: parsed.n_solid,
      measuring: digest.board.measuring,
      hunting: Number(base.counts.hunting),
      kill: digest.board.kill,
      cells: Number(base.counts.cells),
    },
    pipe: {
      pitched: pipeFrom.pitched ?? base.pipe.pitched,
      proving: pipeFrom.proving ?? digest.board.measuring,
      closed: pipeFrom.closed ?? base.pipe.closed,
      // Certified on Pipe is the score (solids), not invent-pipeline certified=0.
      certified: parsed.n_solid,
      scaling: pipeFrom.scaling ?? base.pipe.scaling,
    },
    office: {
      ...base.office,
      invent: inventOn,
      inventWhy: digest.board.invent,
      activeHunter: activeHunter ?? base.office.activeHunter,
      pareto: base.office.pareto,
    },
    seats,
    hunters,
    trends,
    recipes: base.recipes.map((r) => ({ ...r })) as Recipe[],
    solids: [...base.solids] as Recipe[],
    trades: [...(base.trades ?? [])],
  };
}

export type LiveStamp = ReturnType<typeof applyDigest>;
