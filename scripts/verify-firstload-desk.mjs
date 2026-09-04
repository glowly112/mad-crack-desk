#!/usr/bin/env node
/** First-load browser proof — uses normal cache (no ignoreCache). */
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
const results = [];

for (const { path, name, shot } of [
  { path: "/", name: "floor", shot: "firstload-floor.png" },
  { path: "/office", name: "office", shot: "firstload-office.png" },
]) {
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push({ page: name, text: msg.text() });
  });
  page.on("pageerror", (err) => consoleErrors.push({ page: name, text: err.message }));
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("/desk/assets/") && r.status() >= 400) assetFailures.push({ url: u, status: r.status() });
    if (u.includes("/desk/assets/assets/")) assetFailures.push({ url: u, status: r.status(), bug: "double-assets" });
  });

  const url = `${BASE}${path}`;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);

  const probe = await page.evaluate(() => {
    const html = document.documentElement;
    const body = getComputedStyle(document.body);
    return {
      theme: html.getAttribute("data-theme"),
      font: html.getAttribute("data-font"),
      bg: body.backgroundColor,
      textLen: document.body.innerText?.length ?? 0,
      styled: body.backgroundColor === "rgb(10, 10, 11)" || body.backgroundColor === "rgb(10, 10, 11)",
      stamp: document.body.innerText.match(/20\d{6}T\d{6}Z/)?.[0] ?? null,
      fuse: document.body.innerText.includes("Real betting: OFF"),
    };
  });

  await page.screenshot({ path: join(OUT, shot), fullPage: false });
  results.push({ name, url, status: res?.status() ?? 0, ...probe, screenshot: join(OUT, shot) });
  await page.close();
}

await browser.close();

const ok =
  results.every((r) => r.status === 200 && r.styled && r.textLen > 200) &&
  consoleErrors.length === 0 &&
  assetFailures.length === 0 &&
  !consoleErrors.some((e) => /dynamically imported module|routes-/i.test(e.text));

console.log(JSON.stringify({ ok, results, consoleErrors, assetFailures }, null, 2));
process.exit(ok ? 0 : 1);
