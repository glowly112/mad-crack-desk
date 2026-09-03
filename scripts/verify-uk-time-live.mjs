#!/usr/bin/env node
/** Proof: UK clocks on Floor stamp and Trades Time column (first load, normal cache). */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.DESK_URL?.trim() || "https://stridesmart.uk/desk";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const consoleErrors = [];
const assetFailures = [];

async function snap(page, name) {
  await page.screenshot({ path: join(OUT, name), fullPage: false });
}

const floor = await context.newPage();
floor.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push({ page: "floor", text: msg.text() });
});
floor.on("response", (r) => {
  if (r.url().includes("/desk/assets/") && r.status() >= 400) assetFailures.push({ url: r.url(), status: r.status() });
});
await floor.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
await floor.waitForTimeout(1500);

const floorStamp = await floor.evaluate(() => {
  const el = document.querySelector(".stamp-tick[data-oracle-stamp]");
  return {
    text: el?.textContent?.trim() ?? "",
    meta: el?.getAttribute("data-oracle-stamp") ?? "",
    hasZ: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(el?.textContent ?? ""),
    hasBst: /\b(BST|GMT)\b/.test(el?.textContent ?? ""),
  };
});
await snap(floor, "uk-floor.png");
await floor.close();

const trades = await context.newPage();
trades.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push({ page: "trades", text: msg.text() });
});
trades.on("response", (r) => {
  if (r.url().includes("/desk/assets/") && r.status() >= 400) assetFailures.push({ url: r.url(), status: r.status() });
});
await trades.goto(`${BASE}/trades`, { waitUntil: "networkidle", timeout: 60000 });
await trades.waitForTimeout(1500);

const tradesProbe = await trades.evaluate(() => {
  const stampEl = document.querySelector(".stamp-tick[data-oracle-stamp]");
  const rows = [...document.querySelectorAll("table tbody tr")];
  const times = rows
    .map((tr) => tr.querySelector("td")?.textContent?.trim() ?? "")
    .filter((t) => /^\d{2}:\d{2}:\d{2}$/.test(t))
    .slice(0, 5);
  return {
    stamp: stampEl?.textContent?.trim() ?? "",
    stampMeta: stampEl?.getAttribute("data-oracle-stamp") ?? "",
    times,
  };
});
await snap(trades, "uk-trades.png");
await trades.close();

await browser.close();

const ok =
  floorStamp.hasBst &&
  !floorStamp.hasZ &&
  floorStamp.meta.includes("Z") &&
  tradesProbe.stamp.match(/\b(BST|GMT)\b/) &&
  tradesProbe.times.length > 0 &&
  consoleErrors.length === 0 &&
  assetFailures.length === 0;

console.log(JSON.stringify({ ok, floorStamp, tradesProbe, consoleErrors, assetFailures }, null, 2));
process.exit(ok ? 0 : 1);
