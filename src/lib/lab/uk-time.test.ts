import assert from "node:assert/strict";
import test from "node:test";
import { oracleUtcMeta, ukClock, ukHopAt, ukStampLine } from "./uk-time.ts";

test("UTC Z converts to BST in September (+1)", () => {
  assert.equal(ukClock("2026-09-03T08:14:03Z"), "09:14:03");
  assert.equal(ukClock("2026-09-02T10:59:45Z"), "11:59:45");
  assert.equal(ukClock("20260903T131606Z"), "14:16:06");
});

test("bare HH:MM passes through as local oracle clock", () => {
  assert.equal(ukClock("", "14:03"), "14:03:00");
  assert.equal(ukClock(undefined, "Empty", "09:12:00"), "09:12:00");
});

test("ukStampLine is readable UK with suffix", () => {
  const line = ukStampLine("20260903T131606Z", "live oracle");
  assert.match(line, /3 Sep/);
  assert.match(line, /14:16:06/);
  assert.match(line, /BST/);
  assert.match(line, /live oracle/);
});

test("oracleUtcMeta keeps Z stamp", () => {
  assert.equal(oracleUtcMeta("20260903T131606Z"), "2026-09-03T13:16:06Z");
});

test("ukHopAt shortens Z stamp to HH:MM UK", () => {
  assert.equal(ukHopAt("20260903T131606Z"), "14:16");
});
