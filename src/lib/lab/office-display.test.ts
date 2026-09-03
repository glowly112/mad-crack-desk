import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import {
  officeMillCaption,
  officeMillFixLines,
  officeMillJunkCount,
  officeTapeSkips,
} from "./office-display.ts";
import { STAMP } from "./stamp.ts";

function ehole(id: string, overrides: Partial<Recipe> = {}): Recipe {
  return {
    id,
    title: id.replace(/^H-ehole-/, "ehole_").replace(/-/g, "_"),
    region: "NZ",
    status: "MEASURING",
    badge: "Research",
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Still proving.",
    hunterName: "Geo",
    ...overrides,
  };
}

test("office mill fix lines count in-play, twins, junk, and sprays", () => {
  const recipes = [
    ehole("H-ehole-fr-inplay-win-73339Z", { region: "FR" }),
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
  ];
  const lines = officeMillFixLines(recipes, [], "2026-09-03");
  assert.ok(lines.some((l) => l.id === "in-play-first-books"));
  assert.ok(lines.some((l) => l.id === "twin-skins"));
});

test("office tape skips explains sparse in-play", () => {
  const recipes = [ehole("H-ehole-fr-inplay-place-73339Z", { region: "FR" })];
  const skips = officeTapeSkips(recipes, [], "2026-09-03");
  assert.ok(skips.some((s) => /sparse on purpose/i.test(s)));
  assert.ok(skips.some((s) => /not a first-book window/i.test(s)));
});

test("office mill caption is one hunt line with fuse off", () => {
  const line = officeMillCaption({
    fuse_on: false,
    office: { invent: true, inventWhy: "empty-hole hunt on · invent_empty_holes · mill parked" },
    pipe: { pitched: 0 },
    hunters: [],
    mill_n_armed: 52,
    n_armed: 52,
  });
  assert.match(line, /fast-arm/i);
  assert.match(line, /fuse off/i);
  assert.ok(!/mill parked/i.test(line));
});

test("office mill junk excludes in-play and twin extras", () => {
  const recipes = [
    ehole("H-ehole-fr-inplay-win-73339Z", { region: "FR" }),
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
    ehole("H-ehole-au-morning-win-73508Z", { region: "AU" }),
  ];
  assert.equal(officeMillJunkCount(recipes), 0);
});

test("stamp office caption does not duplicate floor square", () => {
  const line = officeMillCaption({
    fuse_on: STAMP.fuse_on,
    office: STAMP.office,
    pipe: STAMP.pipe,
    hunters: STAMP.hunters,
    mill_n_armed: 52,
    n_armed: 52,
  });
  assert.ok(line.length > 0);
  assert.ok(!/The square|64 square/i.test(line));
});
