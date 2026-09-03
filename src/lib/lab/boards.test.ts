import assert from "node:assert/strict";
import { test } from "node:test";
import {
  capitalisingLine,
  countryKillMarks,
  countryMarket,
  countryPackBoxes,
  countryPackLine,
  countrySentence,
  healthBoard,
  hunterWork,
  issueBoard,
  marketGlance,
  nextEmptySquareHole,
  officeCountries,
  officeWorkers,
  factorySquares,
  floorRacingSquare,
  holeSideOccupied,
  inventHole,
  inventWhatHappened,
  plantInventQueue,
  bookPeriods,
  bookStageLine,
  bookStages,
  officeIssues,
  officeIssuesForBoard,
  pipeBoard,
  plantMarkets,
  racingSquare,
  plantCellBuckets,
  plantCells,
  recipeStatus,
  sizeMarket,
  sizePackBoxes,
  squareGlanceLine,
  seatWatching,
  staffLine,
  waffleCols,
} from "./boards.ts";
import { scrubMillVoidNamedHoles } from "./junk-fills.ts";
import { EMPTY } from "./desk.ts";
import { STAMP } from "./stamp.ts";

test("country sentence is parked vs tested, or Empty", () => {
  assert.equal(countrySentence(1, 5), "1 parked, 5 still being tested");
  assert.equal(countrySentence(0, 3), "3 still being tested");
  assert.equal(countrySentence(2, 0), "2 parked");
  assert.equal(countrySentence(0, 0), EMPTY);
});

test("Office countries speak English and pick up a parked NZ the coverage missed", () => {
  const rows = officeCountries(STAMP.coverage, STAMP.recipes);
  const au = rows.find((r) => r.region === "AU");
  const nz = rows.find((r) => r.region === "NZ");
  const us = rows.find((r) => r.region === "US");
  const hk = rows.find((r) => r.region === "HK");
  assert.equal(au?.name, "Australia");
  assert.equal(au?.line, "1 parked, 5 still being tested");
  assert.equal(nz?.line, "1 parked, 2 still being tested");
  assert.equal(us?.line, "1 still being tested");
  assert.equal(hk?.line, EMPTY);
});

test("country pack sizes Australia over a one-recipe market and omits Empty", () => {
  const rows = officeCountries(STAMP.coverage, STAMP.recipes);
  const boxes = countryPackBoxes(rows);
  const au = boxes.find((b) => b.region === "AU");
  const us = boxes.find((b) => b.region === "US");
  assert.ok(au && us);
  const auArea = au.w * au.h;
  const usArea = us.w * us.h;
  assert.ok(usArea > 0);
  assert.ok(Math.abs(auArea / usArea - 6) < 0.05);
  assert.equal(waffleCols(6), 3);
  assert.equal(waffleCols(1), 1);
  assert.equal(countryPackLine(rows), "Australia is the pile. Hong Kong Empty.");
  assert.equal(countryPackLine([]), EMPTY);
});

test("the market keeps every stamp region, including Empty Hong Kong", () => {
  const rows = officeCountries(STAMP.coverage, STAMP.recipes);
  const market = countryMarket(rows);
  assert.deepEqual(
    [...new Set(market.map((r) => r.region))].sort(),
    ["AU", "FR", "GB", "HK", "IE", "NZ", "US", "ZA"],
  );
  assert.equal(market[0]?.region, "AU");
  assert.ok(market.some((r) => r.region === "HK" && r.line === EMPTY));
});

test("country size is measured n, not a recipe count, and HK stays Empty", () => {
  const market = sizeMarket(STAMP.coverage, STAMP.recipes, STAMP.moves, STAMP.floorLog);
  const gb = market.find((c) => c.region === "GB");
  const au = market.find((c) => c.region === "AU");
  const hk = market.find((c) => c.region === "HK");
  assert.equal(market.map((c) => c.region).sort().join(), "AU,FR,GB,HK,IE,NZ,US,ZA");
  assert.equal(gb?.n, 76);
  assert.equal(au?.n, 32);
  assert.ok(gb && au && gb.n > au.n);
  assert.equal(gb.squares.filter((s) => s.tone === "win").length, 1);
  assert.equal(au.squares.filter((s) => s.tone === "loss").length, 1);
  assert.equal(market.flatMap((c) => c.squares).filter((s) => s.tone === "loss").length, 1);
  assert.equal(hk?.empty, true);
  assert.equal(hk?.squares.length, 0);
  assert.equal(countryKillMarks(STAMP.moves, STAMP.floorLog).has("AU"), true);
  const boxes = sizePackBoxes(market);
  const gbBox = boxes.find((b) => b.region === "GB");
  const auBox = boxes.find((b) => b.region === "AU");
  const hkBox = boxes.find((b) => b.region === "HK");
  assert.equal(boxes.length, 8);
  assert.ok(gbBox && auBox && hkBox);
  assert.ok(gbBox.w * gbBox.h > auBox.w * auBox.h);
  assert.equal(hkBox.empty, true);
  const packed = boxes.reduce((s, b) => s + b.w * b.h, 0);
  assert.ok(Math.abs(packed - 100 * 100) < 0.01);
  assert.equal(capitalisingLine(STAMP.counts), "1 solid of 161 cells. 126 killed.");
  assert.match(marketGlance(market, STAMP.counts), /Hong Kong Empty/);
});

test("the plant waffle is stamp cells: unused leftover, hunting, kill, then the small occupied set", () => {
  const buckets = plantCellBuckets(STAMP.counts);
  const squares = plantCells(STAMP.counts);
  assert.equal(buckets.win, 1);
  assert.equal(buckets.parked, 2);
  assert.equal(buckets.idea, 21);
  assert.equal(buckets.hunt, 12);
  assert.equal(buckets.loss, 126);
  assert.equal(buckets.empty, 0);
  assert.equal(squares.length, 3 + 21 + 12 + 126);
  assert.equal(squares.filter((s) => s.tone === "loss").length, 126);
  assert.equal(squares.filter((s) => s.tone === "win").length, 1);
  assert.ok(buckets.loss + buckets.hunt + buckets.empty > buckets.win + buckets.parked + buckets.idea);
  const leftover = plantCellBuckets({ ...STAMP.counts, cells: 180 });
  assert.equal(leftover.empty, 180 - leftover.used);
  assert.equal(inventHole(STAMP.office.inventWhy), "South Africa · morning · winner");
  assert.equal(inventHole("invent off"), EMPTY);
});

test("square cells show BACK and LAY on the same WIN/PLACE hole", () => {
  const holes = floorRacingSquare({
    namedHoles: [
      { region: "GB", window: "near_off", market: "WIN", tone: "hunt" },
      { region: "AU", window: "morning", market: "WIN", tone: "idea", side: "LAY" },
    ],
    recipes: [
      {
        id: "H-ehole-nz-latepre-place-01741Z",
        title: "ehole_nz_late_pre_place",
        region: "NZ",
        status: "MEASURING",
        badge: "Research",
        chip: null,
        n: 0,
        roi: 0,
        freezePnl: 0,
        why: "",
      },
    ],
    openFills: [
      {
        id: "open-1",
        recipeId: "H-ehole-gb-nearoff-win-83959Z",
        recipe: "GB near-off WIN",
        side: "BACK",
      },
    ],
  });
  assert.equal(holes.length, 64);
  const gbWin = holes.find((h) => h.id === "GB|near_off|WIN");
  assert.ok(gbWin);
  assert.equal(gbWin!.backTone, "idea");
  assert.equal(gbWin!.layTone, "empty");
  const auWin = holes.find((h) => h.id === "AU|morning|WIN");
  assert.ok(auWin);
  assert.equal(auWin!.layTone, "idea");
  const nzPlace = holes.find((h) => h.id === "NZ|late_pre|PLACE");
  assert.ok(nzPlace);
  assert.equal(nzPlace!.backTone, "idea");
  assert.ok(holeSideOccupied(gbWin!));
});

test("floor morning board strips whole-cell kills — voids stay Empty", () => {
  const voidFills = [
    {
      id: "za-void",
      ts: "2026-09-03T10:00:00Z",
      t: "10:00",
      day: "2026-09-03",
      recipe: "ZA morning WIN",
      recipeId: "H-ehole-za-morning-win-73506Z",
      market: "WIN",
      book: "paper",
      side: "BACK",
      odds: 2,
      stake: 1,
      result: "void",
      flight: null,
      liquidity: null,
      pnl: 0,
      horse: null,
    },
    {
      id: "gb-void",
      ts: "2026-09-03T10:05:00Z",
      t: "10:05",
      day: "2026-09-03",
      recipe: "GB late-pre WIN",
      recipeId: "H-ehole-gb-latepre-win-34829Z",
      market: "WIN",
      book: "paper",
      side: "BACK",
      odds: 2,
      stake: 1,
      result: "void",
      flight: null,
      liquidity: null,
      pnl: 0,
      horse: null,
    },
  ] as const;
  const named = scrubMillVoidNamedHoles(
    [
      { region: "ZA", window: "morning", market: "WIN", tone: "loss" },
      { region: "GB", window: "late_pre", market: "WIN", tone: "kill" },
    ],
    voidFills,
  );
  const holes = floorRacingSquare({
    namedHoles: named,
    recipes: [
      {
        id: "H-killed-book",
        title: "GB morning WIN",
        region: "GB",
        status: "KILL",
        badge: "Dead",
        chip: null,
        n: 0,
        roi: 0,
        freezePnl: -5,
        why: "killed",
      },
    ],
  });
  const za = holes.find((h) => h.id === "ZA|morning|WIN");
  const gb = holes.find((h) => h.id === "GB|morning|WIN");
  assert.equal(za?.tone, "empty");
  assert.equal(gb?.tone, "empty");
  assert.equal(holes.filter((h) => h.tone === "loss").length, 0);
});

test("the racing square is the finite mill grid; Empty holes are real area", () => {
  const holes = racingSquare({
    recipes: STAMP.recipes,
    coverage: STAMP.coverage,
    moves: STAMP.moves,
    floorLog: STAMP.floorLog,
    huntNotes: [STAMP.office.inventWhy, ...STAMP.hunters.map((h) => h.note)],
  });
  assert.equal(plantMarkets(STAMP.recipes.map((r) => r.title)).join(), "WIN,PLACE");
  assert.equal(holes.length, 8 * 4 * 2);
  assert.equal(holes.filter((h) => h.tone === "empty").length > 40, true);
  assert.equal(holes.find((h) => h.id === "GB|near_off|WIN")?.tone, "win");
  assert.equal(holes.find((h) => h.id === "NZ|morning|WIN")?.tone, "parked");
  assert.equal(holes.find((h) => h.id === "AU|late_pre|WIN")?.tone, "idea");
  assert.equal(holes.find((h) => h.id === "AU|near_off|PLACE")?.tone, "loss");
  assert.equal(holes.find((h) => h.id === "ZA|morning|WIN")?.tone, "hunt");
  assert.equal(holes.find((h) => h.id === "IE|morning|PLACE")?.tone, "parked");
  assert.equal(holes.find((h) => h.id === "HK|morning|WIN")?.tone, "empty");
  assert.equal(holes.filter((h) => h.tone === "loss").length, 1);
  const gbWin = holes.find((h) => h.id === "GB|near_off|WIN");
  const gbPlace = holes.find((h) => h.id === "GB|near_off|PLACE");
  assert.ok(gbWin && gbPlace);
});

test("one book is invent, paper, holdout, production, live", () => {
  const solid = STAMP.recipes.find((r) => r.badge === "Solid");
  const parked = STAMP.recipes.find((r) => r.badge === "Parked");
  assert.ok(solid && parked);
  const gb = bookStages(solid);
  assert.deepEqual(
    gb.map((s) => s.key),
    ["invent", "paper", "holdout", "production", "live"],
  );
  assert.equal(gb.find((s) => s.key === "invent")?.kind, "same");
  assert.equal(gb.find((s) => s.key === "paper")?.n, 76);
  assert.equal(gb.find((s) => s.key === "holdout")?.n, 23);
  assert.equal(gb.find((s) => s.key === "production")?.kind, "same");
  assert.equal(gb.find((s) => s.key === "live")?.kind, "empty");
  assert.match(bookStageLine(gb), /live Empty/);
  const nz = bookStages(parked);
  assert.equal(nz.find((s) => s.key === "production")?.kind, "empty");
  const cousin = bookStages({
    ...solid,
    why: "Hyde cousin of GB near-off WIN · not the same picks",
  });
  assert.equal(cousin.find((s) => s.key === "invent")?.kind, "split");
  assert.match(cousin.find((s) => s.key === "invent")?.mark ?? "", /Hyde cousin/);
});

test("fuse off is the law, not a thing to fix", () => {
  const rows = officeIssues([
    ...STAMP.issues,
    {
      id: "live-subset",
      title: "Real betting is off. Nothing is live.",
      detail: "The fuse is off.",
      owner: "Clerk",
      fix: "Leave the fuse off.",
    },
  ]);
  assert.equal(rows.some((r) => /real betting is off/i.test(r.problem)), false);
  assert.ok(rows.some((r) => r.id === "keep-hold-paper"));
});

test("office issues hide stale KEEP rows on empty hunt board", () => {
  const rows = officeIssuesForBoard(STAMP.issues, { n_solid: 0, mill_n_armed: 52 });
  assert.ok(!rows.some((r) => r.id === "keep-hold-paper"));
  assert.ok(!rows.some((r) => r.id === "keep-not-solid"));
});

test("next empty square hole skips occupied hunt cells and in-play", () => {
  const hole = nextEmptySquareHole({
    recipes: [{ ...STAMP.recipes[0], region: "ZA", title: "ZA morning WIN", status: "MEASURING" }],
    office: { inventWhy: "empty-hole hunt on · mill parked" },
    hunters: [{ id: "geo", note: "FLOWING · queue ZA|morning|WIN" }],
  });
  assert.ok(hole !== EMPTY);
  assert.ok(!/South Africa · morning · winner/i.test(hole));
  assert.ok(!/in-play/i.test(hole));
});

test("plant invent queue prefers live seat.now and skips in-play", () => {
  assert.equal(
    plantInventQueue("hunt HK|morning|WIN · empty-hole fast-arm", "empty-hole hunt on · invent_empty_holes", []),
    "Hong Kong · morning · winner",
  );
  assert.equal(
    plantInventQueue(
      "HK morning/late_pre/near_off WIN empties",
      "empty-hole hunt on · invent_empty_holes",
      [],
    ),
    "Hong Kong · morning, late-pre, near-off · winner",
  );
  assert.equal(plantInventQueue("next hole: AU|in_play|PLACE", "empty-hole hunt on", []), EMPTY);
  assert.ok(
    !plantInventQueue("", "empty-hole hunt on", [{ note: "queue AU|in_play|WIN" }]).includes("in-play"),
  );
});

test("square glance is 64-hole occupancy, not mill cells", () => {
  assert.match(
    squareGlanceLine({ occupied: 55, n_solid: 0, kill: 0 }),
    /0 solid\. 55 armed of 64 holes\. 9 empty/,
  );
});

test("paper and holdout are two periods of one book", () => {
  const solid = STAMP.recipes.find((r) => r.badge === "Solid");
  const proving = STAMP.recipes.find((r) => r.status === "MEASURING");
  assert.ok(solid && proving);
  const keep = bookPeriods(solid);
  assert.equal(keep.sameBook, true);
  assert.equal(keep.holdoutN, 23);
  assert.match(keep.line, /Same book/);
  const open = bookPeriods(proving);
  assert.equal(open.holdoutN, null);
  assert.match(open.line, /does not prove/);
});

test("invent what happened names the queue and a known reject", () => {
  const line = inventWhatHappened({
    invent: true,
    inventWhy: STAMP.office.inventWhy,
    pitched: 12,
    hunters: STAMP.hunters,
  });
  assert.match(line, /12 new ideas/);
  assert.match(line, /South Africa · morning · winner/);
  assert.match(line, /not stalled/);
  const hunt = inventWhatHappened({
    invent: true,
    inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked",
    pitched: 12,
    hunters: [],
    mill_n_armed: 52,
  });
  assert.match(hunt, /empty-hole fast-arm hunt/);
  assert.ok(!hunt.includes("mill parked"));
  assert.ok(!hunt.includes("12 new ideas"));
  const rejected = inventWhatHappened({
    invent: true,
    inventWhy: STAMP.office.inventWhy,
    pitched: 18,
    hunters: STAMP.hunters,
    rejects: ["card_axes_on_geo_broad"],
  });
  assert.match(rejected, /card axes/);
  assert.match(rejected, /too broad/i);
});

test("recipe status drops holdout_n_too_small", () => {
  const parked = STAMP.recipes.find((r) => r.badge === "Parked");
  const proving = STAMP.recipes.find((r) => r.status === "MEASURING");
  assert.ok(parked && proving);
  assert.equal(recipeStatus(parked), "Parked. Not certified. Not enough holdout races yet.");
  assert.equal(recipeStatus(proving), "Still being tested. Not the score.");
  assert.ok(!recipeStatus(parked).includes("holdout_n"));
});

test("hunter work drops FLOWING, pitched=, and conv%", () => {
  assert.equal(
    hunterWork("FLOWING · pitched=3 · proving=6 · conv 0.0%", { huntBoard: true }),
    "Hunting empty holes on the square.",
  );
  assert.equal(hunterWork("FLOWING · pitched=3 · proving=6 · conv 0.0%"), "Working 3 new ideas, 6 still being tested");
  assert.equal(hunterWork("FLOWING · no open deals"), EMPTY);
  assert.equal(hunterWork("FLOWING · queue ZA|morning|WIN"), "Looking at South Africa · morning · winner");
  assert.ok(officeWorkers(STAMP.hunters, "geo")[0]?.id === "geo");
});

test("health residual uses live hunter note when FLOWING on hunt board", () => {
  const board = healthBoard(STAMP.kpis, {
    hunters: STAMP.hunters,
    inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked",
  });
  const residual = board.fine.find((r) => r.id === "residual");
  assert.ok(residual);
  assert.match(residual!.sentence, /Hunting empty holes/);
  assert.ok(!residual!.sentence.includes("behind"));
});

test("Pipe stages are the factory line; Live is 0 while fuse is off", () => {
  const board = pipeBoard(STAMP.pipe, false);
  assert.deepEqual(
    board.stages.map((s) => s.label),
    ["New ideas", "Being tested", "Out of window", "Solid", "Live"],
  );
  assert.equal(board.stages.find((s) => s.key === "live")?.count, 0);
  assert.equal(board.stages.find((s) => s.key === "certified")?.hint, "the score");
  assert.ok(board.stages.find((s) => s.key === "proving")?.stuck);
  assert.match(board.stuck, /21 still being tested/);
  assert.match(board.stuck, /Live is off/);
  assert.ok(!board.stuck.includes("Invent"));
  assert.ok(!board.stuck.includes("⊆"));
  const squares = factorySquares(board.stages);
  assert.equal(squares.filter((s) => s.key === "proving").length, 21);
  assert.equal(squares.filter((s) => s.key === "certified").length, 1);
  assert.equal(squares.filter((s) => s.key === "live").length, 0);
  assert.equal(squares.length, 12 + 21 + 1 + 1);
});

test("empty-hole hunt factory line uses square occupancy, not invent queue", () => {
  const board = pipeBoard(STAMP.pipe, false, {
    inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked",
    square: { armed: 52, empty: 9, solid: 0 },
  });
  assert.deepEqual(
    board.stages.map((s) => s.label),
    ["Empty holes", "Armed on mill", "Solid", "Live"],
  );
  assert.equal(board.stages.find((s) => s.key === "empty")?.count, 9);
  assert.equal(board.stages.find((s) => s.key === "armed")?.count, 52);
  assert.ok(!board.stuck.includes("new ideas"));
  assert.ok(!board.stuck.includes("still being tested"));
  assert.match(board.stuck, /52 armed on the mill/);
  assert.match(board.stuck, /9 empty on the square/);
});

test("Health rows are sentences, not RED/AMBER/GREEN", () => {
  const board = healthBoard(STAMP.kpis);
  assert.equal(board.broken.length, 0);
  assert.ok(board.watching.some((r) => r.sentence === "Money is on paper only."));
  assert.ok(board.fine.some((r) => r.sentence === "Live is off."));
  assert.ok(!board.glance.includes("RED"));
  assert.ok(!board.glance.includes("AMBER"));
  assert.ok(!board.watching.some((r) => /HOLD_PAPER|ok=|densify/.test(r.sentence + r.why)));
});

test("Issues are a problem, an owner, and a next action", () => {
  const row = issueBoard(STAMP.issues[0]);
  assert.equal(row.owner, "Clerk");
  assert.equal(row.problem, "A keep is on hold this tick.");
  assert.match(row.next, /Do not arm the fuse/);
  assert.ok(!row.problem.includes("LIVE_CANDIDATE"));
});

test("Staff watching lines are same-bets, not bios", () => {
  const line = (id: string) => {
    const seat = STAMP.seats.find((s) => s.id === id);
    assert.ok(seat);
    return seatWatching(seat, STAMP);
  };
  assert.match(line("bauron"), /this cell/);
  assert.match(line("bauron"), /South Africa · morning · winner/);
  assert.match(line("bauron"), /densify cousin is a new book/);
  assert.match(line("bauron"), /Britain · near-off · winner/);
  assert.match(line("igor"), /same freeze bets/);
  assert.match(line("igor"), /Britain · near-off · winner/);
  assert.match(line("hyde"), /KEEP is the original/);
  assert.match(line("hyde"), /No Hyde SHARPEN cousin/);
  assert.match(line("clerk"), /same pick set/);
  assert.match(line("clerk"), /fill-adj killed/);
  assert.match(line("clerk"), /Australia · near-off · place/);
  assert.match(line("clerk"), /Hyde cousin is not it/);
  assert.equal(/real betting is off/i.test(line("clerk")), false);
  assert.match(line("foreman"), /Tape KEEP is Britain · near-off · winner/);
  assert.match(line("foreman"), /on trial, not the tape/);
  assert.match(line("foreman"), /not treat a Hyde cousin as a restore/);
  assert.match(line("virchow"), /Australia · near-off · place is dead/);
  assert.match(line("virchow"), /not a twin of a dead school/);
  assert.match(line("mercator"), /Next hole is South Africa · morning · winner/);
  assert.match(line("mercator"), /not a new product type/);
  assert.match(line("curator"), /Freeze fuel for Britain · near-off · winner/);
  for (const s of STAMP.seats) {
    const text = seatWatching(s, STAMP);
    assert.equal(/keep_hold_paper|n_schools|n_applied|Measuring n=/.test(text), false);
  }
});

test("Hyde names a SHARPEN cousin when the stamp does", () => {
  const hyde = STAMP.seats.find((s) => s.id === "hyde");
  assert.ok(hyde);
  const text = seatWatching(
    { ...hyde, now: "trial H-hyde-gb-nearoff-win-cousin" },
    {
      ...STAMP,
      recipes: [
        ...STAMP.recipes,
        {
          ...STAMP.recipes[0],
          id: "H-hyde-gb-nearoff-win-cousin",
          title: "GB near-off WIN · Hyde cousin",
          badge: "Research",
          status: "MEASURING",
          why: "Hyde cousin, not the same picks",
        },
      ],
    },
  );
  assert.match(text, /SHARPEN cousin/);
  assert.match(text, /not the Britain · near-off · winner KEEP/);
});

test("Clerk names a hold book in English, not a bare country", () => {
  const clerk = STAMP.seats.find((s) => s.id === "clerk");
  assert.ok(clerk);
  const text = seatWatching(
    { ...clerk, now: "keep_hold_paper first: Britain_near_off_WIN_steam_fade_residual_one_pick" },
    { ...STAMP, solids: [], recipes: STAMP.recipes.filter((r) => r.badge !== "Solid") },
  );
  assert.match(text, /near-off · winner/);
  assert.equal(/\bGB is on hold\b/.test(text), false);
  assert.equal(/real betting is off/i.test(text), false);
});

test("Staff seat with nothing is Empty", () => {
  const curator = STAMP.seats.find((s) => s.id === "curator");
  assert.ok(curator);
  assert.equal(
    seatWatching(
      { ...curator, now: "" },
      { recipes: [], solids: [], moves: [], office: { invent: false, inventWhy: "" }, hunters: [] },
    ),
    EMPTY,
  );
});

test("Staff watching lines drop plant tokens", () => {
  assert.match(staffLine("Measuring n=33"), /Watching 33 still being tested/);
  assert.match(staffLine("next hole: ZA|morning|WIN"), /South Africa\. morning\. winner/);
  assert.ok(!staffLine(STAMP.seats.find((s) => s.id === "clerk")?.now ?? "").includes("keep_hold_paper"));
  assert.ok(!staffLine("invent on · densify · hunter Geo · proving=21").includes("densify"));
  const liveClerk =
    "keep_hold_paper: KEEP on hold (n=1) — scoreboard KEEP(s) not LIVE_CANDIDATE this tick, first: H-20260828T020000Z-nz-morning-win-one-pick-band-2-5-4-49";
  const clerk = staffLine(liveClerk);
  assert.match(clerk, /A keep is on hold/);
  assert.match(clerk, /one-pick/);
  assert.equal((clerk.match(/A keep is on hold/g) ?? []).length, 1);
  const bauron = staffLine("invent on · invent (densify) · proving=21 · passed=4188");
  assert.ok(!bauron.includes("invent ()"));
  assert.ok(!bauron.includes("passed="));
});
