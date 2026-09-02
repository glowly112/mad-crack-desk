import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PREFS, parsePrefs, THEME_COLOR } from "./prefs.ts";

test("junk storage falls back to charcoal Satoshi medium", () => {
  assert.deepEqual(parsePrefs(null), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs("not-json"), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs('{"theme":"hotpink","font":"comic","size":"xxl"}'), DEFAULT_PREFS);
});

test("each theme has its own browser chrome color", () => {
  assert.equal(THEME_COLOR.charcoal, "#0a0a0b");
  assert.equal(THEME_COLOR.paper, "#f7f0e3");
  assert.equal(THEME_COLOR.night, "#06080f");
  assert.equal(THEME_COLOR.lab, "#041208");
  assert.notEqual(THEME_COLOR.paper, THEME_COLOR.charcoal);
});
