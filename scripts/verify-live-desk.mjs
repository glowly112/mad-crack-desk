#!/usr/bin/env node
/** Hard-refresh browser proof for live desk (Floor, Office, Trades). */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.DESK_URL?.trim() || "https://stridesmart.uk/desk";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const pages = [
  { path: "/", name: "floor", shot: "live-floor.png" },
  { path: "/office", name: "office", shot: "live-office.png" },
  { path: "/trades", name: "trades", shot: "live-trades.png" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  ignoreHTTPSErrors: true,
});
await context.route("**/*", async (route) => {
  const headers = { ...route.request().headers(), "cache-control": "no-cache", pragma: "no-cache" };
  await route.continue({ headers });
});

const results = [];
const consoleErrors = [];
const assetFailures = [];

for (const p of pages) {
  const page = await context.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push({ page: p.name, text: msg.text() });
  });
  page.on("pageerror", (err) => consoleErrors.push({ page: p.name, text: err.message }));
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("/desk/assets/") && r.status() >= 400) assetFailures.push({ url: u, status: r.status() });
  });

  const url = `${BASE}${p.path}`;
  const res = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const status = res?.status() ?? 0;
  await page.waitForTimeout(1500);

  const probe = await page.evaluate(() => {
    const html = document.documentElement;
    const body = getComputedStyle(document.body);
    return {
      theme: html.getAttribute("data-theme"),
      font: html.getAttribute("data-font"),
      bg: body.backgroundColor,
      textLen: document.body.innerText?.length ?? 0,
      hasStylesheet: [...document.querySelectorAll("link[rel=stylesheet]")].some((l) =>
        l.href.includes("/desk/assets/styles"),
      ),
      stamp: document.body.innerText.match(/20\d{6}T\d{6}Z/)?.[0] ?? null,
      fuse: document.body.innerText.includes("Real betting: OFF"),
    };
  });

  await page.screenshot({ path: join(OUT, p.shot), fullPage: false });
  results.push({ name: p.name, url, status, ...probe, screenshot: join(OUT, p.shot) });
  await page.close();
}

await browser.close();

const ok =
  results.every((r) => r.status === 200 && r.hasStylesheet && r.textLen > 200) &&
  results.every((r) => r.theme === "charcoal" && r.font === "satoshi") &&
  consoleErrors.length === 0 &&
  assetFailures.length === 0;

console.log(
  JSON.stringify(
    {
      ok,
      results,
      consoleErrors,
      assetFailures,
      stamp: results.map((r) => r.stamp).find(Boolean) ?? null,
      fuseOff: results.every((r) => r.fuse),
    },
    null,
    2,
  ),
);

process.exit(ok ? 0 : 1);
