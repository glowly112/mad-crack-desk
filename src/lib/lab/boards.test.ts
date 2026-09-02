import assert from "node:assert/strict";
import { test } from "node:test";
import {
  countryMarket,
  countryPackBoxes,
  countryPackLine,
  countrySentence,
  healthBoard,
  hunterWork,
  issueBoard,
  officeCountries,
  officeWorkers,
  factorySquares,
  pipeBoard,
  recipeStatus,
  staffLine,
  waffleCols,
} from "./boards.ts";
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

test("recipe status drops holdout_n_too_small", () => {
  const parked = STAMP.recipes.find((r) => r.badge === "Parked");
  const proving = STAMP.recipes.find((r) => r.status === "MEASURING");
  assert.ok(parked && proving);
  assert.equal(recipeStatus(parked), "Parked. Not certified. Not enough holdout races yet.");
  assert.equal(recipeStatus(proving), "Still being tested. Not the score.");
  assert.ok(!recipeStatus(parked).includes("holdout_n"));
});

test("hunter work drops FLOWING, pitched=, and conv%", () => {
  assert.equal(hunterWork("FLOWING · pitched=3 · proving=6 · conv 0.0%"), "Working 3 new ideas, 6 still being tested");
  assert.equal(hunterWork("FLOWING · no open deals"), EMPTY);
  assert.equal(hunterWork("FLOWING · queue ZA|morning|WIN"), "Looking at South Africa morning WIN");
  assert.ok(officeWorkers(STAMP.hunters, "geo")[0]?.id === "geo");
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

test("Staff watching lines drop plant tokens", () => {
  assert.match(staffLine("Measuring n=33"), /Watching 33 still being tested/);
  assert.match(staffLine("next hole: ZA|morning|WIN"), /South Africa morning WIN/);
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
