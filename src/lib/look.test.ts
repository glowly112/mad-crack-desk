import assert from "node:assert/strict";
import { test } from "node:test";
import {
  LOOK_TOKENS,
  fieldBettingClass,
  isColourField,
  lookFromLocation,
  parseLook,
  switchLookPath,
  tapeScoreClass,
  tapeScoreTone,
  withLook,
} from "./look.ts";

test("glare: Tape production number is green or red — colour is the score", () => {
  assert.equal(tapeScoreTone(12.4), "up");
  assert.equal(tapeScoreClass(12.4), "tape-score-up");
  assert.equal(tapeScoreTone(-3), "bad");
  assert.equal(tapeScoreClass(-3), "tape-score-bad");
  assert.equal(tapeScoreTone(null), "bad");
  assert.equal(tapeScoreClass(null), "tape-score-bad");
  assert.equal(tapeScoreClass(undefined), "tape-score-bad");
});

test("glare: Ledger background is light day paper", () => {
  assert.equal(LOOK_TOKENS.ledger.paper, true);
  assert.match(LOOK_TOKENS.ledger.bg, /^#f/i);
  assert.equal(LOOK_TOKENS.charcoal.paper, false);
  assert.equal(LOOK_TOKENS.tape.paper, false);
});

test("glare: Field betting strip is a colour field", () => {
  assert.equal(fieldBettingClass(false), "field-strip-off");
  assert.equal(fieldBettingClass(true), "field-strip-on");
  assert.equal(isColourField(fieldBettingClass(false)), true);
  assert.equal(isColourField(fieldBettingClass(true)), true);
  assert.equal(isColourField("border-b"), false);
});

test("look routes and ?look= read the same gallery", () => {
  assert.equal(lookFromLocation("/looks/tape"), "tape");
  assert.equal(lookFromLocation("/moves", "?look=ledger"), "ledger");
  assert.equal(lookFromLocation("/pipe", "look=field"), "field");
  assert.equal(lookFromLocation("/"), "charcoal");
  assert.equal(parseLook("hotpink"), "charcoal");
});

test("look hrefs keep the stamp path and do not invent a Market route", () => {
  assert.equal(withLook("/", "tape"), "/looks/tape");
  assert.equal(withLook("/moves", "field"), "/moves?look=field");
  assert.equal(withLook("/issues/conversion", "ledger"), "/issues/conversion?look=ledger");
  assert.equal(withLook("/looks/tape", "charcoal"), "/");
  assert.equal(switchLookPath("/looks/tape", "", "ledger"), "/looks/ledger");
  assert.equal(switchLookPath("/health", "?look=tape", "field"), "/health?look=field");
  assert.equal(switchLookPath("/office", "?look=tape", "charcoal"), "/office");
});
