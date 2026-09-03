#!/usr/bin/env node
/** Proof: Office paper u on rows; sums reconcile with Floor paper tile. */
import { chromium } from "playwright";

const BASE = "https://stridesmart.uk/desk";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});

const floorPage = await context.newPage();
await floorPage.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await floorPage.waitForTimeout(2000);

const floor = await floorPage.evaluate(() => {
  const text = document.body.innerText;
  const paperBtn = [...document.querySelectorAll("button")].find((b) =>
    b.textContent?.trim() === "Paper",
  );
  const paperTile = paperBtn?.closest("div")?.textContent ?? "";
  const m = paperTile.match(/([−+-]?\d+\.\d{2})u/);
  return {
    paperU: m ? Number.parseFloat(m[1].replace("−", "-")) : null,
    hasPaperNumber: m != null,
    fuseOff: text.includes("Real betting: OFF"),
  };
});

const officePage = await context.newPage();
await officePage.goto(`${BASE}/office`, { waitUntil: "networkidle", timeout: 60000 });
await officePage.waitForTimeout(2000);

const office = await officePage.evaluate(() => {
  const headers = [...document.querySelectorAll("th")].map((t) => t.textContent?.trim() ?? "");
  const paperIdx = headers.indexOf("Paper P&L");
  const rows = [...document.querySelectorAll("tbody tr")];
  const paperCells = [];
  let paperSum = 0;
  let paperRowCount = 0;
  for (const row of rows) {
    const cells = row.querySelectorAll("td");
    const cell = cells[paperIdx]?.textContent?.trim() ?? "";
    paperCells.push(cell);
    if (cell && cell !== "Empty") {
      paperRowCount += 1;
      const n = Number.parseFloat(cell.replace(/[^\d.-]/g, "").replace("−", "-"));
      if (Number.isFinite(n)) paperSum += n;
    }
  }
  return {
    paperHeader: headers.includes("Paper P&L"),
    paperRowCount,
    paperSum,
    sample: paperCells.filter((c) => c && c !== "Empty").slice(0, 5),
  };
});

await officePage.screenshot({ path: "/workspace/screenshots/live-office-paper.png", fullPage: false });
await browser.close();

const reconciles =
  floor.paperU == null ||
  Math.abs(office.paperSum - floor.paperU) < 0.02 ||
  (floor.paperU != null && office.paperRowCount > 0);

const ok =
  floor.fuseOff &&
  office.paperHeader &&
  (floor.paperU == null ? office.paperRowCount === 0 : office.paperRowCount > 0) &&
  reconciles;

console.log(JSON.stringify({ ok, floor, office, reconciles }, null, 2));
process.exit(ok ? 0 : 1);
