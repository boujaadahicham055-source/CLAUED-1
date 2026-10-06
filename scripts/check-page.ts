// Browser check of the demo page: console errors, desktop and mobile screenshots,
// microphone denied state, connection failure state, and no API key in any response.
//
//   npx tsx scripts/check-page.ts <base url> [--secret <value that must never appear>] [--out dir]
//
// Uses the preinstalled Chromium (CHROMIUM_PATH or /opt/pw-browsers). The mic-granted run mocks
// /api/create-web-call so it never creates a billed Retell call.

import { mkdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { chromium, type Browser, type Page } from "playwright";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { secret: { type: "string" }, out: { type: "string", default: "docs/screenshots" } },
});
const base = (positionals[0] ?? "http://localhost:3000").replace(/\/$/, "");
const out = values.out!;
mkdirSync(out, { recursive: true });
const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const results: { check: string; ok: boolean; detail: string }[] = [];
const record = (check: string, ok: boolean, detail = "") => results.push({ check, ok, detail });

async function watch(page: Page) {
  const errors: string[] = [];
  const bodies: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("response", async (r) => {
    try {
      bodies.push(`${r.url()}\n${JSON.stringify(r.headers())}\n${await r.text()}`);
    } catch {}
  });
  return { errors, bodies };
}

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2600); // entrance animation
}

async function run(browser: Browser, denyingBrowser: Browser) {
  // 1. Desktop and mobile render, no console errors.
  for (const [name, viewport, mobile] of [
    ["desktop", { width: 1440, height: 900 }, false],
    ["mobile", { width: 390, height: 844 }, true],
  ] as const) {
    const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const w = await watch(page);
    await page.goto(base + "/");
    await settle(page);
    await page.screenshot({ path: `${out}/${name}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    record(`${name}: no console errors`, w.errors.length === 0, w.errors.join(" | "));
    record(`${name}: no horizontal scroll`, !overflow);
    const fonts = await page.evaluate(() => document.fonts.check('16px "Gloock"') && document.fonts.check('16px "Figtree"'));
    record(`${name}: brand fonts loaded`, fonts);
    await ctx.close();
  }

  // 2. Microphone denied (browser started with --deny-permission-prompts): clean error, no token request.
  {
    const ctx = await denyingBrowser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    let tokenRequested = false;
    page.on("request", (r) => r.url().endsWith("/api/create-web-call") && (tokenRequested = true));
    await page.goto(base + "/");
    await settle(page);
    await page.click("#orb");
    await page.waitForSelector('body[data-state="error"]', { state: "attached", timeout: 10_000 });
    const hint = await page.textContent("#hint");
    await page.screenshot({ path: `${out}/mic-denied.png` });
    record("mic denied: error state shown", /micro est bloqué/i.test(hint ?? ""), hint ?? "");
    record("mic denied: no web call created", !tokenRequested);
    await ctx.close();
  }

  // 3. Mic granted, token mocked, Retell unreachable or rejected: clean connection error.
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, permissions: ["microphone"] });
    const page = await ctx.newPage();
    const w = await watch(page);
    await page.route("**/api/create-web-call", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ call_id: "call_fake", access_token: "fake_token", expires_at: Date.now() + 60_000, transport: "gateway", ice_servers: [] }),
      }),
    );
    await page.goto(base + "/");
    await settle(page);
    await page.click("#orb");
    const state = await page
      .waitForSelector('body[data-state="error"], body[data-state="listening"]', { state: "attached", timeout: 30_000 })
      .then((el) => el.evaluate(() => document.body.dataset.state))
      .catch(() => "timeout");
    await page.screenshot({ path: `${out}/connection-error.png` });
    const uncaught = w.errors.filter((e) => e.startsWith("pageerror"));
    record("fake token: page reaches a clean state", state === "error", `state=${state}`);
    record("fake token: no uncaught exceptions", uncaught.length === 0, uncaught.join(" | "));
    await ctx.close();
  }

  // 4. The real token endpoint never leaks the secret (response may be 503/502 without Retell config).
  if (values.secret) {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const w = await watch(page);
    await page.goto(base + "/");
    const status = await page.evaluate(async () => (await fetch("/api/create-web-call", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status);
    await page.waitForTimeout(500);
    const leaked = w.bodies.some((b) => b.includes(values.secret!));
    record("no API key in any response", !leaked, `token endpoint status ${status}, ${w.bodies.length} responses scanned`);
    await ctx.close();
  }
}

// Behind an egress proxy (cloud sessions), route the browser through it too.
const proxy = process.env.HTTPS_PROXY && !base.includes("localhost") ? { server: process.env.HTTPS_PROXY } : undefined;
// Extra Chromium flags for unusual environments (e.g. a container whose NSS store has no root CAs).
const extra = process.env.CHROMIUM_EXTRA_ARGS?.split(" ").filter(Boolean) ?? [];
const browser = await chromium.launch({ executablePath, proxy, args: ["--use-fake-device-for-media-stream", ...extra] });
const denyingBrowser = await chromium.launch({
  executablePath,
  proxy,
  args: ["--use-fake-device-for-media-stream", "--deny-permission-prompts", ...extra],
});
try {
  await run(browser, denyingBrowser);
} finally {
  await Promise.all([browser.close(), denyingBrowser.close()]);
}
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.check}${r.detail ? `  (${r.detail})` : ""}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
