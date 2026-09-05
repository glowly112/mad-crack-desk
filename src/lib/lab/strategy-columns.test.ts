import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cardSlice,
  compactHoleFromKey,
  compactHoleLabel,
  deskHorseName,
  oddsBandShort,
} from "./strategy-columns.ts";
import { EMPTY } from "./desk.ts";

test("compact hole from matrix key", () => {
  assert.equal(compactHoleFromKey("GB|late_pre|WIN"), "GB · late-pre · win");
  assert.equal(compactHoleFromKey("NZ|morning|PLACE"), "NZ · morning · plc");
});

test("compact hole label from recipe", () => {
  assert.equal(
    compactHoleLabel({
      id: "H-ehole-gb-latepre-win-34829Z",
      title: "ehole_gb_latepre_win",
      region: "GB",
    }),
    "GB · late-pre · win",
  );
});

test("odds band short labels", () => {
  assert.equal(oddsBandShort("4.5–7.99"), "4.5–8");
  assert.equal(oddsBandShort("13+"), "13+");
});

test("card slice abbreviates going", () => {
  assert.equal(cardSlice("Handicap", "Good"), "Handicap · Gd");
});

test("desk horse rejects recipe ids", () => {
  assert.equal(deskHorseName("Desert Crown"), "Desert Crown");
  assert.equal(deskHorseName("H-ehole-gb-morning-win-12001Z"), EMPTY);
  assert.equal(deskHorseName("67117187"), EMPTY);
});
