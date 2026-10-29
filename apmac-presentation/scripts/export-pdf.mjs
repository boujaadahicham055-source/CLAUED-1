/**
 * Static, print-friendly PDF of the deck (one 1920×1080 page per slide).
 *   npm run build && npm run pdf
 * Motion is not part of the PDF; the web presentation remains the primary deliverable.
 */
import fs from "node:fs";
import path from "node:path";
import { startPreview } from "./serve.mjs";
import { loadPlaywright } from "./pw.mjs";

const { chromium } = loadPlaywright();
const root = new URL("..", import.meta.url).pathname;
const outDir = path.join(root, "exports");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "APMAC-Statuts-Presentation.pdf");

const server = await startPreview(4174);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(server.url + "?print");
  await page.waitForSelector(".print-sheet");
  await page.evaluate(() => document.fonts.ready);
  const n = await page.locator(".print-sheet").count();
  await page.pdf({ path: out, width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });
  console.log(`PDF written: ${out} (${n} slides)`);
} finally {
  await browser.close();
  server.stop();
}
process.exit(0);
