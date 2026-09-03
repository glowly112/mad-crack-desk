#!/usr/bin/env node
/** Proof: Floor paper Empty or first-book only; matches Office sum. */
import { chromium } from "playwright";

const BASE = "https://stridesmart.uk/desk";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const floorPage = await context.newPage();
await floorPage.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await floorPage.waitForTimeout(2000);

const floor = await floorPage.evaluate(() => {
  const paperTab = [...document.querySelectorAll("button[role=tab]")].find(
    (b) => b.querySelector("p")?.textContent?.trim() === "Paper",
  );
  const val = paperTab?.querySelector(".font-mono.text-2xl")?.textContent?.trim() ?? "";
  const isEmpty = val === "Empty" || val === "";
  const m = val.match(/^([−+-]?\d+\.\d{2})u$/);
  const paperU = m ? Number.parseFloat(m[1].replace("−", "-")) : null;
  const hasHydeHint = val.includes("−3.71") || val.includes("-3.71");
  return { isEmpty, paperU, hasHydeHint, fuseOff: document.body.innerText.includes("Real betting: OFF") };
});

const officePage = await context.newPage();
await officePage.goto(`${BASE}/office`, { waitUntil: "networkidle", timeout: 60000 });
await officePage.waitForTimeout(2000);

const office = await officePage.evaluate(() => {
  const headers = [...document.querySelectorAll("th")].map((t) => t.textContent?.trim() ?? "");
  const paperIdx = headers.indexOf("Paper P&L");
  let sum = 0;
  let count = 0;
  for (const row of document.querySelectorAll("tbody tr")) {
    const cell = row.querySelectorAll("td")[paperIdx]?.textContent?.trim() ?? "";
    if (!cell || cell === "Empty") continue;
    count += 1;
    const n = Number.parseFloat(cell.replace(/u$/, "").replace("−", "-").replace("+", ""));
    if (Number.isFinite(n)) sum += n;
  }
  return { paperRows: count, paperSum: count ? sum : null };
});

await browser.close();

const reconciles =
  (floor.isEmpty && office.paperRows === 0) ||
  (floor.paperU != null &&
    office.paperRows > 0 &&
    office.paperSum != null &&
    Math.abs(office.paperSum - floor.paperU) < 0.05);

const ok =
  floor.fuseOff &&
  !floor.hasHydeHint &&
  (floor.isEmpty || floor.paperU != null) &&
  reconciles;

console.log(JSON.stringify({ ok, floor, office, reconciles }, null, 2));
process.exit(ok ? 0 : 1);
