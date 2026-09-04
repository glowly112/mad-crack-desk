#!/usr/bin/env node
/** Proof: Floor no whole-cell kills; Office has three P&L columns. */
import { chromium } from "playwright";

const BASE = "https://stridesmart.uk/desk";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});

const floorPage = await context.newPage();
await floorPage.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await floorPage.waitForTimeout(1500);

const floor = await floorPage.evaluate(() => {
  const text = document.body.innerText;
  const legend = text.includes("killed");
  const badSquares = document.querySelectorAll(".bg-bad").length;
  const squareSection = [...document.querySelectorAll("h2")].find((h) =>
    h.textContent?.includes("The square"),
  );
  const squareRoot = squareSection?.closest("section");
  const redInSquare = squareRoot
    ? squareRoot.querySelectorAll(".bg-bad").length
    : badSquares;
  return { legendKilled: legend, redInSquare, fuseOff: text.includes("Real betting: OFF") };
});

await floorPage.screenshot({ path: "/workspace/screenshots/live-floor-kills.png", fullPage: false });

const officePage = await context.newPage();
await officePage.goto(`${BASE}/office`, { waitUntil: "networkidle", timeout: 60000 });
await officePage.waitForTimeout(1500);

const office = await officePage.evaluate(() => {
  const text = document.body.innerText;
  const headers = [...document.querySelectorAll("th")].map((t) => t.textContent?.trim() ?? "");
  return {
    paper: headers.includes("Paper P&L"),
    production: headers.includes("Production P&L"),
    laterRace: headers.includes("Later-race P&L"),
    measuringEmpty: text.includes("measuring is not income"),
  };
});

await officePage.screenshot({ path: "/workspace/screenshots/live-office-pnl.png", fullPage: false });

await browser.close();

const ok =
  !floor.legendKilled &&
  floor.redInSquare === 0 &&
  floor.fuseOff &&
  office.paper &&
  office.production &&
  office.laterRace;

console.log(JSON.stringify({ ok, floor, office }, null, 2));
process.exit(ok ? 0 : 1);
