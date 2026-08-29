import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_PREFS, parsePrefs } from "./prefs.ts";

test("junk storage falls back to charcoal Satoshi medium", () => {
  assert.deepEqual(parsePrefs(null), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs("not-json"), DEFAULT_PREFS);
  assert.deepEqual(parsePrefs('{"theme":"hotpink","font":"comic","size":"xxl"}'), DEFAULT_PREFS);
});
