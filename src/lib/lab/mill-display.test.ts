import assert from "node:assert/strict";
import { test } from "node:test";
import type { Recipe } from "./stamp.ts";
import {
  collapseEholeTwinSkins,
  isSprayClassInPlayEholeFirstBook,
  millDisplayRecipes,
} from "./mill-display.ts";
import { tradesWaitChips } from "./trades.ts";
import { recipePack } from "./desk.ts";

function ehole(
  id: string,
  overrides: Partial<Recipe> = {},
): Recipe {
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

test("in-play ehole first books are spray-class for display", () => {
  const inPlay = ehole("H-ehole-fr-inplay-win-73339Z", { region: "FR" });
  assert.equal(isSprayClassInPlayEholeFirstBook(inPlay), true);
  const nearoff = ehole("H-ehole-nz-nearoff-win-73508Z");
  assert.equal(isSprayClassInPlayEholeFirstBook(nearoff), false);
});

test("defined two-pick near-off is not hidden as in-play spray", () => {
  const twoPick = {
    id: "H-20260903T120000Z-gb-nearoff-win-two-pick",
    title: "GB near-off WIN · two-pick",
    region: "GB" as const,
    status: "MEASURING" as const,
    badge: "Research" as const,
    chip: null,
    n: 0,
    roi: 0,
    freezePnl: 0,
    why: "Still proving.",
    hunterName: "Geo",
  };
  assert.equal(isSprayClassInPlayEholeFirstBook(twoPick), false);
});

test("Geo twins in one hole collapse to earliest run suffix", () => {
  const twins = [
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-01741Z", { region: "NZ" }),
  ];
  const out = collapseEholeTwinSkins(twins);
  assert.equal(out.length, 1);
  assert.equal(out[0]?.id, "H-ehole-nz-latepre-place-00206Z");
});

test("mill display hides in-play and collapses Geo twins", () => {
  const recipes = [
    ehole("H-ehole-us-inplay-win-11111Z", { region: "US" }),
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
    ehole("H-ehole-gb-latepre-place-03333Z", { region: "GB", hunterName: "Card" }),
    ehole("H-ehole-gb-latepre-place-01111Z", { region: "GB", hunterName: "Card" }),
    ehole("H-ehole-au-morning-win-73508Z", { region: "AU", hunterName: "Geo" }),
  ];
  const display = millDisplayRecipes(recipes);
  assert.equal(display.some((r) => /inplay/i.test(r.id)), false);
  assert.equal(display.filter((r) => r.region === "NZ").length, 1);
  assert.equal(display.find((r) => r.region === "NZ")?.id, "H-ehole-nz-latepre-place-00206Z");
  assert.equal(display.filter((r) => r.region === "GB").length, 1);
  assert.equal(display.find((r) => r.region === "GB")?.id, "H-ehole-gb-latepre-place-01111Z");
  assert.equal(recipePack(display).proving.length, 3);
});

test("trades wait chips match mill display — no in-play, one skin per hole", () => {
  const recipes = [
    ehole("H-ehole-fr-inplay-place-73339Z", { region: "FR" }),
    ehole("H-ehole-nz-latepre-place-35151Z", { region: "NZ" }),
    ehole("H-ehole-nz-latepre-place-00206Z", { region: "NZ" }),
    ehole("H-ehole-au-morning-win-73508Z", { region: "AU" }),
  ];
  const chips = tradesWaitChips(recipes, [], []);
  assert.equal(chips.length, 2);
  assert.ok(chips.some((c) => c.id === "H-ehole-nz-latepre-place-00206Z"));
  assert.ok(chips.some((c) => c.id === "H-ehole-au-morning-win-73508Z"));
  assert.ok(!chips.some((c) => /inplay/i.test(c.id)));
  assert.ok(!chips.some((c) => c.id.includes("35151")));
});
