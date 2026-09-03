#!/usr/bin/env node
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failed = [];
page.on("response", (r) => {
  if (r.status() >= 400) failed.push({ status: r.status(), url: r.url() });
});
await page.goto("https://stridesmart.uk/desk/", { waitUntil: "networkidle", timeout: 60000 });
await browser.close();
console.log(JSON.stringify(failed, null, 2));
