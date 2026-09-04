import assert from "node:assert/strict";
import { test } from "node:test";
import { matrixKeyFromArmedYamlName, matrixKeyFromScoreboardCell } from "./hollow-occupancy.ts";

test("matrixKeyFromScoreboardCell uses plant scopes", () => {
  assert.equal(
    matrixKeyFromScoreboardCell({
      country_scope: ["GB"],
      window_scope: ["near_off"],
      market_type: "WIN",
    }),
    "GB|near_off|WIN",
  );
});

test("matrixKeyFromArmedYamlName parses ehole and steam yaml names", () => {
  assert.equal(
    matrixKeyFromArmedYamlName("20260903T064136Z_H-ehole-hk-latepre-win-64136Z.yaml"),
    "HK|late_pre|WIN",
  );
  assert.equal(
    matrixKeyFromArmedYamlName(
      "20260903T063912Z_0_GB_near_off_WIN_steam_fade_residual_one_pick_BAC.yaml",
    ),
    "GB|near_off|WIN",
  );
});
