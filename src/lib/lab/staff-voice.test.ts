import assert from "node:assert/strict";
import { test } from "node:test";
import { STAMP } from "./stamp.ts";
import { EMPTY } from "./desk.ts";
import { hasJargon, seatBubbles, speakBook, speakLook } from "./staff-voice.ts";

test("speakBook is the short strategy mark, not a paragraph", () => {
  assert.equal(speakBook("GB near-off WIN"), "Britain · near-off · winner");
  assert.equal(speakBook("H-fast-gb-nearoff-win-83959Z"), "Britain · near-off · winner");
  assert.equal(speakBook("AU place near-off"), "Australia · near-off · place");
  assert.equal(speakLook("South Africa morning WIN"), "South Africa · morning · winner");
  assert.ok(!speakBook("GB near-off WIN").includes("recipe that bets"));
  assert.ok(!speakBook("H-fast-gb-nearoff-win-83959Z").startsWith("H-"));
});

test("Staff bubbles speak like a person and ban jargon", () => {
  for (const s of STAMP.seats) {
    const texts = seatBubbles(s, STAMP).map((b) => b.text);
    assert.ok(texts.length > 0, s.id);
    for (const t of texts) {
      assert.equal(hasJargon(t), false, `${s.id}: ${t}`);
      assert.match(t, /[.?!]$/);
    }
  }
  const clerk = seatBubbles(STAMP.seats.find((s) => s.id === "clerk")!, STAMP).map((b) => b.text).join(" ");
  assert.match(clerk, /Britain · near-off · winner/);
  assert.ok(!clerk.includes("recipe that bets"));
  assert.match(clerk, /later races of those same bets/);
  assert.match(clerk, /Australia · near-off · place/);
  const bauron = seatBubbles(STAMP.seats.find((s) => s.id === "bauron")!, STAMP).map((b) => b.text).join(" ");
  assert.match(bauron, /South Africa · morning · winner/);
  assert.match(bauron, /not a patch on Britain/);
  const curator = seatBubbles(STAMP.seats.find((s) => s.id === "curator")!, STAMP).map((b) => b.text).join(" ");
  assert.match(curator, /race files/);
  const mercator = seatBubbles(STAMP.seats.find((s) => s.id === "mercator")!, STAMP).map((b) => b.text).join(" ");
  assert.match(mercator, /South Africa · morning · winner/);
});

test("Hyde names a different-horses tweak without saying cousin", () => {
  const hyde = STAMP.seats.find((s) => s.id === "hyde")!;
  const texts = seatBubbles(
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
          why: "Hyde cousin, fade the steam, one pick",
        },
      ],
    },
  ).map((b) => b.text);
  assert.match(texts.join(" "), /fade the steam/);
  assert.match(texts.join(" "), /different horses/);
  assert.equal(texts.some(hasJargon), false);
});

test("Empty seat has no bubbles", () => {
  const curator = STAMP.seats.find((s) => s.id === "curator")!;
  assert.deepEqual(
    seatBubbles(
      { ...curator, now: "" },
      { recipes: [], solids: [], moves: [], office: { invent: false, inventWhy: "" }, hunters: [] },
    ),
    [],
  );
  assert.equal(EMPTY, "Empty");
});
