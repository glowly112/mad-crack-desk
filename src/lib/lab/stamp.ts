/** Display-only stamp of the plant at 2026-08-29 morning. Never sums cells. */

export type Badge = "Solid" | "Research" | "Parked" | "Dead";
export type Chip = "Waiting for races" | "Booking" | "On tape today" | null;
export type HunterState = "FLOWING" | "HELD";
export type Health = "GREEN" | "AMBER" | "RED";

export type InventScale = "wide" | "mid" | "nugget";

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
  /** Oracle cell hunter_name — distinguishes books in the same hole. */
  hunterName?: string | null;
  /** Plant invent scale — wide hole skin, mid odds band, or nugget spice slice. */
  inventScale?: InventScale | null;
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

export type { Fill, FillBook, FillResult, WaitOpen } from "./trades.ts";
import type { Fill, WaitOpen } from "./trades.ts";

export const STAMP = {
  day: "2026-09-02",
  generated: "20260902T101756Z",
  source: "freeze" as const,
  oneSystem:
    "Invent → prove on research paper → production paper → real betting · same picks",
  hero: {
    day_u: null as number | null,
    aim_u: 100,
    aim_vs: "behind" as const,
    label: "Today's production",
    empty: "Empty",
  },
  n_solid: 1,
  fuse_on: false,
  fuse: "Real betting: OFF",
  plantLine: "Clerk keep_hold_paper · fuse off",
  plantHealth: "AMBER" as Health,
  clerk: "PAPER_ONLY",
  topBlocker: {
    id: "keep-hold-paper",
    title: "KEEP on hold — not LIVE_CANDIDATE this tick",
    owner: "Clerk",
    action: "Inspect the KEEP gate. Do not arm the fuse.",
  },
  counts: {
    keep: 3,
    certified: 1,
    measuring: 21,
    hunting: 12,
    kill: 126,
    cells: 161,
  },
  researchKeepGbp: 408.67,
  pipe: {
    pitched: 12,
    proving: 21,
    closed: 1,
    certified: 1,
    scaling: 1,
  },
  office: {
    activeHunter: "geo",
    pareto: "geo",
    invent: true,
    inventWhy: "invent on · invent (densify) · next hole ZA|morning|WIN",
    rejects: [] as string[],
  },
  holes: [] as { region: string; window: string; market: string; tone?: string; side?: string }[],
  hunters: [
    { id: "card", state: "FLOWING" as HunterState, note: "FLOWING · pitched=3 · proving=6 · conv 0.0%" },
    { id: "steam", state: "FLOWING" as HunterState, note: "FLOWING · no open deals" },
    { id: "residual", state: "FLOWING" as HunterState, note: "FLOWING · pitched=5 · proving=5 · conv 0.0%" },
    { id: "geo", state: "FLOWING" as HunterState, note: "FLOWING · queue ZA|morning|WIN" },
    { id: "docbrown", state: "FLOWING" as HunterState, note: "FLOWING · no open deals" },
    { id: "lens", state: "FLOWING" as HunterState, note: "FLOWING · no open deals" },
  ],
  kpis: [
    { id: "invent", label: "Invent fire", status: "GREEN" as Health, detail: "invent on · densify" },
    { id: "doer", label: "Doer", status: "GREEN" as Health, detail: "PASS" },
    { id: "tick", label: "Lab tick", status: "GREEN" as Health, detail: "Age 1m" },
    { id: "path", label: "Path", status: "GREEN" as Health, detail: "Fidelity green" },
    { id: "factory", label: "Money factory", status: "AMBER" as Health, detail: "HOLD_PAPER · uncertified keep" },
    { id: "residual", label: "Residual", status: "AMBER" as Health, detail: "Lag 2d" },
    { id: "card", label: "Card join", status: "GREEN" as Health, detail: "ok=173" },
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
      id: "H-fast-gb-nearoff-win-83959Z",
      title: "GB near-off WIN",
      region: "GB",
      status: "KEEP",
      badge: "Solid",
      chip: "Waiting for races",
      n: 76,
      roi: 8.9,
      freezePnl: 119.97,
      why: "Certified keep · production door (fuse still gates live money) · holdout 23/22",
    },
    {
      id: "H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49",
      title: "NZ morning WIN · one-pick 2.5–4.49",
      region: "NZ",
      status: "KEEP",
      badge: "Parked",
      chip: null,
      n: 68,
      roi: 12.2,
      freezePnl: 83.57,
      why: "Research keep · not certified · holdout 12/22 · holdout_n_too_small",
    },
    {
      id: "H-20260820T014100Z",
      title: "AU late-pre WIN · midfield",
      region: "AU",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 32,
      roi: 50.7,
      freezePnl: 306.65,
      why: "Still proving. Not the score.",
    },
    {
      id: "H-20260831T141500Z-us-inplay-place-smallfield",
      title: "US in-play PLACE · small field",
      region: "US",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 18,
      roi: 84.9,
      freezePnl: 305.5,
      why: "Still proving. Not the score.",
    },
    {
      id: "H-autopsy-za_near_off_place_back_one_pick_smallfield_5to7",
      title: "ZA near-off PLACE · small field",
      region: "ZA",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 14,
      roi: 25.4,
      freezePnl: 71.08,
      why: "Still proving. Not the score.",
    },
    {
      id: "H-20260901T203000Z-fr-nearoff-place-flat-largefield-onepick",
      title: "FR near-off PLACE",
      region: "FR",
      status: "MEASURING",
      badge: "Research",
      chip: null,
      n: 9,
      roi: 36.1,
      freezePnl: 65.04,
      why: "Still proving. Not the score.",
    },
  ] satisfies Recipe[],
  solids: [
    {
      id: "H-fast-gb-nearoff-win-83959Z",
      title: "GB near-off WIN",
      region: "GB",
      status: "KEEP",
      badge: "Solid",
      chip: "Waiting for races",
      n: 76,
      roi: 8.9,
      freezePnl: 119.97,
      why: "Certified keep · production door (fuse still gates live money) · holdout 23/22",
    },
  ] as Recipe[],
  moves: [
    {
      at: "10:13",
      recipe: "AU place near-off",
      from: "Research keep",
      to: "Dead",
      why: "holdout fill-adj below floor · holdout 18/22",
    },
    {
      at: "10:09",
      recipe: "GB win near-off",
      from: "Measuring",
      to: "Certified",
      why: "holdout 23/22 · production door · wait_open",
    },
    {
      at: "02:00",
      recipe: "NZ morning win",
      from: "Measuring",
      to: "Research keep",
      why: "holdout 12/22 · not certified · parked",
    },
  ] satisfies Move[],
  floorLog: [
    { t: "10:13", kind: "kill", line: "AU place near-off · Research keep → Dead" },
    { t: "10:09", kind: "keep", line: "GB win near-off · Measuring → Certified" },
    { t: "02:00", kind: "keep", line: "NZ morning win · Measuring → Research keep" },
  ],
  issues: [
    {
      id: "keep-hold-paper",
      title: "A keep is on hold this tick.",
      detail: "The keep cannot go live this tick.",
      owner: "Clerk",
      fix: "Inspect the keep gate. Do not arm the fuse.",
    },
    {
      id: "keep-not-solid",
      title: "Parked research is not today's production.",
      detail: "NZ morning WIN is parked. Freeze 408.67u is not today's production.",
      owner: "Hyde",
      fix: "Leave it parked. Do not treat it as income.",
    },
  ],
  seats: [
    {
      id: "invent",
      name: "Invent",
      role: "Empty-hole hunt",
      status: "GREEN",
      now: "Invent empty-hole fast-arm hunt on · mill parked",
      cadence: "tick",
    },
    {
      id: "holdout",
      name: "Holdout",
      role: "Later-race slice",
      status: "AMBER",
      now: "keep_hold_paper · PAPER_ONLY · fuse off",
      cadence: "tick",
    },
    {
      id: "auditor",
      name: "Auditor",
      role: "Kill / twins",
      status: "AMBER",
      now: "n_schools 16",
      cadence: "shift",
    },
    {
      id: "night",
      name: "Night",
      role: "Mill watch",
      status: "AMBER",
      now: "tick · measuring=33",
      cadence: "shift",
    },
    {
      id: "wiki",
      name: "Wiki",
      role: "Race files",
      status: "GREEN",
      now: "Geo / WIPD / exotic green",
      cadence: "cron",
    },
  ] satisfies Seat[],
  trades: [] as Fill[],
  wait_open: [] as WaitOpen[],
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
    { day: "2026-08-30", paper_live_day_u: null, n_solid: 0, n_keep: 2, n_measuring: 16, n_dropped: 118, factory_day_pnl_u: null },
    { day: "2026-08-31", paper_live_day_u: null, n_solid: 1, n_keep: 3, n_measuring: 18, n_dropped: 120, factory_day_pnl_u: null },
    { day: "2026-09-01", paper_live_day_u: null, n_solid: 1, n_keep: 3, n_measuring: 17, n_dropped: 122, factory_day_pnl_u: null },
    { day: "2026-09-02", paper_live_day_u: null, n_solid: 1, n_keep: 3, n_measuring: 21, n_dropped: 126, factory_day_pnl_u: null },
  ] satisfies TrendPoint[],
} as const;
