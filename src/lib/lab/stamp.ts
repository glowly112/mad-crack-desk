/** Display-only stamp of the plant at 2026-08-29 morning. Never sums cells. */

export type Badge = "Solid" | "Research" | "Parked" | "Dead";
export type Chip = "Waiting for races" | "Booking" | "On tape today" | null;
export type HunterState = "FLOWING" | "HELD";
export type Health = "GREEN" | "AMBER" | "RED";

export type Recipe = {
  id: string;
  title: string;
  region: "AU" | "GB" | "IE" | "US" | "NZ" | "ZA" | "HK" | "FR";
  status: "KEEP" | "MEASURING" | "HUNTING" | "KILL";
  badge: Badge;
  chip: Chip;
  n: number;
  roi: number;
  freezePnl: number;
  why: string;
};

export type Move = {
  at: string;
  recipe: string;
  from: string;
  to: string;
  why: string;
};

export type TrendPoint = {
  day: string;
  paper_live_day_u: number | null;
  n_solid: number;
  n_keep: number;
  n_measuring: number;
  n_dropped: number;
  factory_day_pnl_u: number | null;
};

export type Seat = {
  id: string;
  name: string;
  role: string;
  status: Health | "IDLE";
  now: string;
  cadence: string;
};

export const STAMP = {
  day: "2026-08-29",
  generated: "09:51 BST",
  source: "freeze" as const,
  oneSystem:
    "Invent → prove on research paper → production paper → real betting · same picks",
  hero: {
    day_u: null as number | null,
    aim_u: 100,
    aim_vs: "behind" as const,
    label: "Today's production score (aim £100/day)",
    empty: "Production score off — nothing solid on the day tape yet",
  },
  n_solid: 0,
  fuse_on: false,
  fuse: "Real betting: OFF",
  plantLine: "Needs attention: doer over budget",
  plantHealth: "RED" as Health,
  clerk: "PAPER_ONLY",
  topBlocker: {
    id: "conversion",
    title: "Nothing certified — research keep is not the score",
    owner: "Hyde",
    action: "Certify or park the two research keeps. Do not invent twins.",
  },
  counts: {
    keep: 2,
    certified: 0,
    measuring: 15,
    hunting: 4,
    kill: 112,
    cells: 133,
  },
  researchKeepGbp: 444.02,
  pipe: {
    pitched: 4,
    proving: 15,
    closed: 0,
    certified: 0,
    scaling: 0,
  },
  office: {
    activeHunter: "residual",
    pareto: "geo",
    invent: false,
    inventWhy: "Protect the two research keeps · one HK near-off place gap",
  },
  hunters: [
    { id: "card", state: "FLOWING" as HunterState, note: "Fuel joining" },
    { id: "steam", state: "HELD" as HunterState, note: "Not on invent" },
    { id: "residual", state: "HELD" as HunterState, note: "Active seat, lag" },
    { id: "geo", state: "HELD" as HunterState, note: "Pareto leader — stall" },
    { id: "docbrown", state: "HELD" as HunterState, note: "Waiting" },
    { id: "lens", state: "HELD" as HunterState, note: "Waiting" },
  ],
  kpis: [
    { id: "invent", label: "Invent fire", status: "GREEN" as Health, detail: "Last pass · Grok" },
    { id: "doer", label: "Doer", status: "RED" as Health, detail: "Budget · streak 24" },
    { id: "tick", label: "Lab tick", status: "GREEN" as Health, detail: "Age 4m" },
    { id: "path", label: "Path", status: "GREEN" as Health, detail: "Fidelity green" },
    { id: "factory", label: "Money factory", status: "AMBER" as Health, detail: "Uncertified keep" },
    { id: "residual", label: "Residual", status: "AMBER" as Health, detail: "Lag on hunter" },
    { id: "card", label: "Card join", status: "GREEN" as Health, detail: "89/89" },
    { id: "live", label: "Live fast", status: "GREEN" as Health, detail: "0 orders · fuse off" },
  ],
  coverage: [
    { region: "AU", keep: 1, measuring: 5, note: "Near-off place banked" },
    { region: "GB", keep: 0, measuring: 3, note: "Late-pre proving" },
    { region: "IE", keep: 1, measuring: 2, note: "Morning place jumps" },
    { region: "US", keep: 0, measuring: 0, note: "Place mkts thin" },
    { region: "NZ", keep: 0, measuring: 2, note: "Thin n" },
    { region: "ZA", keep: 0, measuring: 1, note: "Late-pre win" },
    { region: "HK", keep: 0, measuring: 0, note: "Near-off freeze empty" },
    { region: "FR", keep: 0, measuring: 0, note: "Fuel unused" },
  ],
  recipes: [
    {
      id: "H-fast-au-nearoff-place",
      title: "AU near-off place",
      region: "AU",
      status: "KEEP",
      badge: "Parked",
      chip: null,
      n: 58,
      roi: 19.5,
      freezePnl: 226.68,
      why: "Research keep. Holdout not certified. Hyde HOLD. Live gate parked.",
    },
    {
      id: "H-ie-morning-place-jumps",
      title: "IE morning place jumps",
      region: "IE",
      status: "KEEP",
      badge: "Parked",
      chip: null,
      n: 54,
      roi: 16.7,
      freezePnl: 151.49,
      why: "Research keep. Fill-adj red. Not solid. Do not twin.",
    },
    {
      id: "au-late-pre-win",
      title: "AU late-pre win midfield",
      region: "AU",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 36,
      roi: 52.0,
      freezePnl: 0,
      why: "Still proving. n under keep bar.",
    },
    {
      id: "gb-late-pre-win",
      title: "GB late-pre win flat field",
      region: "GB",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 31,
      roi: 13.3,
      freezePnl: 0,
      why: "Still proving. Not the score.",
    },
    {
      id: "ie-win-near-off",
      title: "IE win near-off",
      region: "IE",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 26,
      roi: -52.3,
      freezePnl: 0,
      why: "Deep red. Hyde would shelve, not promote.",
    },
  ] satisfies Recipe[],
  solids: [] as Recipe[],
  moves: [
    {
      at: "09:47",
      recipe: "Doer lane",
      from: "Running",
      to: "Stuck",
      why: "Budget hit · streak 24. Not a recipe move.",
    },
    {
      at: "09:36",
      recipe: "Invent fire",
      from: "Idle",
      to: "Pass",
      why: "Grok pass. Gate still protect-the-book.",
    },
    {
      at: "08:10",
      recipe: "AU near-off place",
      from: "Measuring",
      to: "Research keep",
      why: "n=58 · ROI 19.5% · size_ok. Not certified.",
    },
    {
      at: "07:40",
      recipe: "IE morning place jumps",
      from: "Measuring",
      to: "Research keep",
      why: "n=54 · freeze green · fill-adj red so parked for live.",
    },
    {
      at: "06:12",
      recipe: "IE win near-off",
      from: "Hunting",
      to: "Measuring",
      why: "Opened a proving cell. ROI now −52%.",
    },
    {
      at: "05:04",
      recipe: "Twin of AU place",
      from: "Measuring",
      to: "Dead",
      why: "Virchow: same money line as banked keep. Densify-kill.",
    },
  ] satisfies Move[],
  floorLog: [
    { t: "09:51", kind: "score", line: "Scoreboard stamp · production off · KEEP 2" },
    { t: "09:47", kind: "doer", line: "Doer BUDGET · overall OPS red · streak 24" },
    { t: "09:41", kind: "plant", line: "Plant plan · solids 0 · proving 15 · certified 0" },
    { t: "09:36", kind: "invent", line: "Invent PASS · still protect keeps" },
    { t: "09:22", kind: "office", line: "Coverage AU 5 proving · GB 3 · IE 2" },
    { t: "09:18", kind: "hunter", line: "Residual FLOWING · steam HELD" },
    { t: "09:12", kind: "fuse", line: "Clerk PAPER_ONLY · fuse off" },
    { t: "09:04", kind: "hunter", line: "Card join 89/89" },
    { t: "08:52", kind: "measure", line: "IE win near-off still proving n=12" },
    { t: "08:40", kind: "fuse", line: "Live fast · 0 candidates · fuse off" },
    { t: "08:31", kind: "kill", line: "Twin of AU place densify-kill" },
    { t: "08:22", kind: "office", line: "Pareto residual · invent paused" },
    { t: "08:10", kind: "keep", line: "AU near-off place held as research keep" },
    { t: "07:58", kind: "measure", line: "Measuring pile 16 → 15" },
    { t: "07:40", kind: "keep", line: "IE morning place jumps parked HOLD_PAPER" },
    { t: "07:18", kind: "hunter", line: "Geo HELD · lens FLOWING" },
    { t: "07:04", kind: "plant", line: "Certified 0 · scaling 0 · pitched 8" },
    { t: "06:44", kind: "doer", line: "Igor lane streak 22 · budget watch" },
    { t: "06:28", kind: "invent", line: "Gate protect-the-book" },
    { t: "06:12", kind: "measure", line: "IE win near-off opened a proving cell" },
    { t: "05:51", kind: "kill", line: "GB win morning deep red · Hyde would shelve" },
    { t: "05:32", kind: "hunter", line: "Steam HELD · no candidates" },
    { t: "05:04", kind: "kill", line: "Twin of AU place · Virchow same money line" },
    { t: "04:48", kind: "plant", line: "Overnight stamp · fuse still off" },
  ],
  issues: [
    {
      id: "conversion",
      title: "Conversion stall",
      detail: "15 proving, 0 certified, 0 scaling. Invent paused for a reason.",
      owner: "Hyde",
      fix: "Promote or kill inside the window. Do not invent more twins.",
    },
    {
      id: "keep-not-solid",
      title: "Research keep ≠ solid",
      detail: "Two keeps, both HOLD_PAPER. £444 is freeze research, not today.",
      owner: "Hyde",
      fix: "Holdout + certify path. Fill-adj red on IE jumps stays parked.",
    },
    {
      id: "doer-budget",
      title: "Doer over budget",
      detail: "Igor lane RED, streak 24. Plant overall red for this, not money.",
      owner: "Igor",
      fix: "Wait the budget window. Do not arm fuse to ‘fix’ it.",
    },
    {
      id: "hunter-lag",
      title: "Office imbalance",
      detail: "Active hunter residual is held. Pareto is geo. FR/HK/US empty.",
      owner: "Mercator",
      fix: "One open gap: HK near-off place. Protect AU/IE keeps.",
    },
    {
      id: "live-subset",
      title: "Live ⊆ paper",
      detail: "Fuse off. No live book today. Gate already HOLD_PAPER.",
      owner: "Clerk",
      fix: "Leave fuse off until a solid is on tape.",
    },
  ],
  seats: [
    { id: "igor", name: "Igor", role: "Doer", status: "RED", now: "Budget · streak 24", cadence: "tick" },
    { id: "bauron", name: "Bauron", role: "Invent gate", status: "GREEN", now: "Invent paused · protect book", cadence: "tick" },
    { id: "hyde", name: "Hyde", role: "Sharpen / certify", status: "AMBER", now: "HOLD on KEEP · shelve deep-red", cadence: "shift" },
    { id: "virchow", name: "Virchow", role: "Kill / twins", status: "GREEN", now: "Densify-kill twins of AU place", cadence: "shift" },
    { id: "mercator", name: "Mercator", role: "Gaps", status: "AMBER", now: "One live gap HK|near_off|PLACE", cadence: "shift" },
    { id: "clerk", name: "Clerk", role: "Money truth", status: "AMBER", now: "PAPER_ONLY · fuse off", cadence: "tick" },
    { id: "foreman", name: "Foreman", role: "Shift", status: "GREEN", now: "Hands-off paper / auto_dry", cadence: "shift" },
    { id: "curator", name: "Curator", role: "Freezes", status: "GREEN", now: "Geo / WIPD / exotic green", cadence: "cron" },
  ] satisfies Seat[],
  trends: [
    { day: "2026-08-19", paper_live_day_u: -63.56, n_solid: 1, n_keep: 3, n_measuring: 48, n_dropped: 12, factory_day_pnl_u: -12.4 },
    { day: "2026-08-20", paper_live_day_u: 0.4, n_solid: 1, n_keep: 3, n_measuring: 40, n_dropped: 18, factory_day_pnl_u: -8.1 },
    { day: "2026-08-21", paper_live_day_u: -4.2, n_solid: 1, n_keep: 3, n_measuring: 36, n_dropped: 22, factory_day_pnl_u: -3.0 },
    { day: "2026-08-22", paper_live_day_u: 1.1, n_solid: 2, n_keep: 3, n_measuring: 30, n_dropped: 28, factory_day_pnl_u: 2.2 },
    { day: "2026-08-23", paper_live_day_u: -2.8, n_solid: 1, n_keep: 2, n_measuring: 28, n_dropped: 40, factory_day_pnl_u: -40.0 },
    { day: "2026-08-24", paper_live_day_u: 0.0, n_solid: 2, n_keep: 3, n_measuring: 22, n_dropped: 55, factory_day_pnl_u: -6.4 },
    { day: "2026-08-25", paper_live_day_u: 6.03, n_solid: 2, n_keep: 3, n_measuring: 18, n_dropped: 70, factory_day_pnl_u: 1.4 },
    { day: "2026-08-26", paper_live_day_u: null, n_solid: 0, n_keep: 2, n_measuring: 17, n_dropped: 88, factory_day_pnl_u: -2.1 },
    { day: "2026-08-27", paper_live_day_u: null, n_solid: 0, n_keep: 2, n_measuring: 16, n_dropped: 101, factory_day_pnl_u: 0.8 },
    { day: "2026-08-28", paper_live_day_u: null, n_solid: 0, n_keep: 2, n_measuring: 16, n_dropped: 108, factory_day_pnl_u: -1.2 },
    { day: "2026-08-29", paper_live_day_u: null, n_solid: 0, n_keep: 2, n_measuring: 15, n_dropped: 112, factory_day_pnl_u: null },
  ] satisfies TrendPoint[],
} as const;
