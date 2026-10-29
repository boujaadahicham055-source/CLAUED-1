/**
 * Rendered visual QA for the APMAC deck.
 *   npm run build && npm run qa
 * Writes screenshots + qa-output/report.json.
 */
import fs from "node:fs";
import path from "node:path";
import { startPreview } from "./serve.mjs";
import { loadPlaywright } from "./pw.mjs";

const { chromium } = loadPlaywright();
const OUT = path.resolve(new URL("..", import.meta.url).pathname, "qa-output");
fs.mkdirSync(path.join(OUT, "1920"), { recursive: true });
fs.mkdirSync(path.join(OUT, "1366"), { recursive: true });
fs.mkdirSync(path.join(OUT, "motion"), { recursive: true });

const server = await startPreview();
const browser = await chromium.launch();
const report = { slides: [], viewports: [], navigation: [], fontsUsed: {}, coverage: null, errors: [] };

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ONLY = process.env.QA_ONLY || "all"; // all | static | viewports | nav
const log = (...a) => console.log(`[qa ${new Date().toISOString().slice(11, 19)}]`, ...a);
const HIDE_CHROME = ".controls{display:none!important}";

/* In-page geometry audit for the currently displayed slide. */
function audit() {
  const stage = document.querySelector(".stage");
  const sr = stage.getBoundingClientRect();
  const scale = sr.width / 1920;
  const slide = stage.querySelector(".slide");
  const arabic = /[؀-ۿ]/;
  const issues = [];
  const footer = slide.querySelector(".folio");
  const footerTop = footer ? (footer.getBoundingClientRect().top - sr.top) / scale : 1080;

  // Collect line boxes per text node
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  const boxes = [];
  let n;
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (el.closest("svg")) continue;
    const cs = getComputedStyle(el);
    if (arabic.test(n.textContent) && cs.letterSpacing !== "normal" && cs.letterSpacing !== "0px") {
      issues.push({ type: "arabic-letter-spacing", text: n.textContent.slice(0, 40), value: cs.letterSpacing });
    }
    if (cs.textAlign === "justify") issues.push({ type: "justify", text: n.textContent.slice(0, 40) });
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      boxes.push({
        el,
        inFooter: !!el.closest(".folio"),
        text: n.textContent.trim().slice(0, 36),
        x1: (r.left - sr.left) / scale,
        y1: (r.top - sr.top) / scale,
        x2: (r.right - sr.left) / scale,
        y2: (r.bottom - sr.top) / scale,
      });
    }
  }
  for (const b of boxes) {
    if (b.x1 < 40 || b.x2 > 1880 || b.y1 < 30 || b.y2 > 1060)
      issues.push({ type: "outside-safe-canvas", text: b.text, box: [b.x1, b.y1, b.x2, b.y2].map(Math.round) });
    if (!b.inFooter && b.y2 > footerTop + 2)
      issues.push({ type: "collides-with-footer", text: b.text, bottom: Math.round(b.y2), footerTop: Math.round(footerTop) });
  }
  // Overlap between line boxes of different, non-nested elements
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
      const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
      // line boxes legitimately touch; require a real intersection (> 6px vertical)
      const minH = Math.min(a.y2 - a.y1, b.y2 - b.y1);
      // Arabic fonts have tall ascent/descent: adjacent lines' content boxes touch.
      // Flag only real intrusions (> 35% of the smaller line box).
      if (ox > 2 && oy > minH * 0.35) issues.push({ type: "overlap", a: a.text, b: b.text, ox: Math.round(ox), oy: Math.round(oy) });
    }
  // Elements whose content is clipped
  for (const el of slide.querySelectorAll("*")) {
    if (el.closest("svg")) continue;
    if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow === "hidden" && !el.classList.contains("slide"))
      issues.push({ type: "clipped", cls: el.className });
  }
  return { issues, lineBoxes: boxes.length };
}

async function fontsForSlide(page, cdp) {
  const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: ".stage .slide *:not(svg):not(path)",
  });
  const used = {};
  for (const id of nodeIds) {
    try {
      const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId: id });
      for (const f of fonts) used[f.familyName] = (used[f.familyName] || 0) + f.glyphCount;
    } catch {
      /* node without text */
    }
  }
  return used;
}

try {
  /* ---------- 1. Static per-slide audit + screenshots @1920×1080 ---------- */
  log("static audit");
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("console", (m) => m.type() === "error" && report.errors.push(m.text()));
  page.on("pageerror", (e) => report.errors.push(String(e)));
  page.setDefaultTimeout(10000);
  await page.goto(server.url + "?static#/1");
  await page.addStyleTag({ content: HIDE_CHROME });
  await page.evaluate(() => document.fonts.ready);
  report.coverage = await page.evaluate(() => window.__DECK_COVERAGE__);
  const total = await page.evaluate(() => Number(document.querySelector(".controls__pos").textContent.split("/")[1]));
  log("slides:", total);
  report.fontFaces = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`);
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");

  for (let i = 1; i <= (ONLY === "all" || ONLY === "static" ? total : 0); i++) {
    await page.evaluate((n) => (window.location.hash = `#/${n}`), i);
    await page.waitForFunction((n) => document.querySelector(".stage")?.dataset.slide === String(n), i);
    await page.evaluate(() => document.fonts.ready);
    await wait(120);
    const res = await page.evaluate(audit);
    const fonts = await fontsForSlide(page, cdp);
    for (const [k, v] of Object.entries(fonts)) report.fontsUsed[k] = (report.fontsUsed[k] || 0) + v;
    const file = path.join(OUT, "1920", `slide-${String(i).padStart(2, "0")}.png`);
    await page.locator(".stage").screenshot({ path: file });
    report.slides.push({ slide: i, ...res, fonts });
  }

  /* ---------- 2. Other presentation viewports ---------- */
  log("viewports");
  for (const vp of (ONLY === "all" || ONLY === "viewports") ? [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ] : []) {
    const p = await browser.newPage({ viewport: vp });
    p.setDefaultTimeout(10000);
    await p.goto(server.url + "?static#/1");
    await p.addStyleTag({ content: HIDE_CHROME });
    await p.evaluate(() => document.fonts.ready);
    const issues = [];
    for (let i = 1; i <= total; i++) {
      await p.evaluate((n) => (window.location.hash = `#/${n}`), i);
      await p.waitForFunction((n) => document.querySelector(".stage")?.dataset.slide === String(n), i);
      const r = await p.evaluate(() => {
        const s = document.querySelector(".stage").getBoundingClientRect();
        const se = document.scrollingElement;
        return {
          fits: s.left >= -0.5 && s.top >= -0.5 && s.right <= innerWidth + 0.5 && s.bottom <= innerHeight + 0.5,
          pageScroll: se.scrollWidth > innerWidth || se.scrollHeight > innerHeight,
        };
      });
      const a = await p.evaluate(audit);
      if (!r.fits || r.pageScroll || a.issues.length) issues.push({ slide: i, ...r, issues: a.issues });
      if (vp.width === 1366 && [1, 4, 9, 20, 21, 23, 25, 27].includes(i))
        await p.screenshot({ path: path.join(OUT, "1366", `slide-${String(i).padStart(2, "0")}.png`) });
    }
    report.viewports.push({ viewport: `${vp.width}x${vp.height}`, issues });
    await p.close();
  }

  /* ---------- 3. Animated navigation behaviour ---------- */
  if (ONLY === "all" || ONLY === "nav") {
  log("navigation");
  const nav = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  nav.setDefaultTimeout(8000);
  nav.on("pageerror", (e) => report.errors.push(String(e)));
  await nav.goto(server.url + "#/1");
  await nav.evaluate(() => document.fonts.ready);
  const state = () =>
    nav.evaluate(() => ({
      slide: Number(document.querySelector(".stage").dataset.slide),
      layers: document.querySelectorAll(".slide-layer").length,
      hash: location.hash,
      opacity: getComputedStyle(document.querySelector(".slide-layer")).opacity,
    }));
  const check = (name, ok, detail) => {
    report.navigation.push({ name, ok, detail });
    log(ok ? "PASS" : "FAIL", name);
  };

  // Opening motion frames
  let prevT = 0;
  for (const t of [150, 700, 1400, 2600]) {
    await wait(t - prevT);
    prevT = t;
    await nav.screenshot({ path: path.join(OUT, "motion", `cover-${t}ms.png`) });
  }
  await wait(600);
  await nav.keyboard.press("ArrowLeft");
  await wait(1200);
  let s = await state();
  check("ArrowLeft advances (RTL)", s.slide === 2 && s.hash === "#/2", s);
  await nav.keyboard.press("ArrowRight");
  await wait(1200);
  s = await state();
  check("ArrowRight goes back (RTL)", s.slide === 1, s);
  await nav.keyboard.press("PageDown");
  await wait(1100);
  check("PageDown advances (clicker)", (await state()).slide === 2);
  // chapter transition frames (2 -> 3)
  await nav.keyboard.press("ArrowLeft");
  for (const t of [120, 450, 800]) {
    await wait(t === 120 ? 120 : t === 450 ? 330 : 350);
    await nav.screenshot({ path: path.join(OUT, "motion", `chapter-${t}ms.png`) });
  }
  await wait(900);
  // article transition frames (3 -> 4)
  await nav.keyboard.press("ArrowLeft");
  for (const t of [150, 400]) {
    await wait(t === 150 ? 150 : 250);
    await nav.screenshot({ path: path.join(OUT, "motion", `article-${t}ms.png`) });
  }
  await wait(1200);
  await nav.keyboard.press("End");
  await wait(2600);
  s = await state();
  check("End jumps to last slide", s.slide === total && s.layers === 1, s);
  await nav.screenshot({ path: path.join(OUT, "motion", "closing-settled.png") });
  await nav.keyboard.press("Home");
  await wait(2600);
  s = await state();
  check("Home jumps to first slide", s.slide === 1 && s.layers === 1, s);

  // Stress: 14 rapid presses, then settle
  for (let k = 0; k < 14; k++) {
    await nav.keyboard.press("ArrowLeft");
    await wait(35);
  }
  await wait(2400);
  s = await state();
  check("Rapid navigation settles cleanly", s.slide === 15 && s.layers === 1 && s.opacity === "1", s);
  for (let k = 0; k < 8; k++) {
    await nav.keyboard.press(k % 2 ? "ArrowLeft" : "ArrowRight");
    await wait(25);
  }
  await wait(2400);
  s = await state();
  check("Back-and-forth mashing settles cleanly", s.slide === 15 && s.layers === 1 && s.opacity === "1", s);

  // Bounds
  await nav.keyboard.press("Home");
  await wait(300);
  await nav.keyboard.press("ArrowRight");
  await wait(1000);
  check("No navigation before first slide", (await state()).slide === 1);

  // Buttons
  await nav.mouse.move(900, 900);
  await nav.locator('button[aria-label="الشريحة التالية"]').click();
  await wait(1100);
  check("Next button", (await state()).slide === 2);
  await nav.locator('button[aria-label="الشريحة السابقة"]').click();
  await wait(1100);
  check("Previous button", (await state()).slide === 1);

  // Overview
  await nav.keyboard.press("g");
  await wait(500);
  const thumbs = await nav.locator(".ov__item").count();
  await nav.screenshot({ path: path.join(OUT, "motion", "overview-grid.png") });
  await nav.locator('.ov__item[data-i="19"]').click();
  await wait(1300);
  check("Overview grid opens and jumps", thumbs === total && (await state()).slide === 20, { thumbs });

  // Reference panel
  await nav.keyboard.press("t");
  await wait(600);
  const srcText = await nav.locator(".source").innerText();
  await nav.screenshot({ path: path.join(OUT, "motion", "source-panel.png") });
  check("Reference panel shows Article 9 wording", srcText.includes("الفصل التاسع") && srcText.includes("أعلى هيئة تقريرية"));
  await nav.keyboard.press("Escape");
  await wait(600);
  check("Escape closes panel", (await nav.locator(".source").count()) === 0);

  // Controls hide when idle, H toggles
  await wait(3000);
  const hidden = await nav.evaluate(() => document.querySelector(".controls").classList.contains("is-hidden"));
  check("Controls auto-hide when idle", hidden);

  // Fullscreen
  await nav.keyboard.press("f");
  await wait(600);
  const fs1 = await nav.evaluate(() => !!document.fullscreenElement);
  await nav.keyboard.press("f");
  await wait(400);
  check("F toggles fullscreen", fs1, { enteredFullscreen: fs1 });

  // Touch swipe (RTL: swipe right = next)
  const tp = await browser.newPage({ viewport: { width: 1366, height: 768 }, hasTouch: true });
  await tp.goto(server.url + "#/5");
  await wait(800);
  await tp.evaluate(() => {
    const el = document.querySelector(".viewport");
    const mk = (type, x) =>
      new TouchEvent(type, {
        bubbles: true,
        touches: type === "touchend" ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 })],
        changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: 400 })],
      });
    el.dispatchEvent(mk("touchstart", 300));
    el.dispatchEvent(mk("touchend", 700));
  });
  await wait(1100);
  check("Swipe right advances (RTL)", (await tp.evaluate(() => document.querySelector(".stage").dataset.slide)) === "6");
  await tp.close();

  // Reduced motion
  const rm = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" });
  await rm.goto(server.url + "#/2");
  await wait(500);
  await rm.keyboard.press("ArrowLeft");
  await wait(600);
  const rms = await rm.evaluate(() => ({
    slide: document.querySelector(".stage").dataset.slide,
    layers: document.querySelectorAll(".slide-layer").length,
    sweep: document.querySelectorAll(".chapter-sweep").length,
  }));
  check("Reduced motion: navigation works with simple fades", rms.slide === "3" && rms.layers === 1 && rms.sweep === 0, rms);
  await rm.close();

  // Frame pacing during a chapter transition
  const pacing = async (fn) => nav.evaluate(fn);
  const idle = await pacing(async () => {
    const times = [];
    let last = performance.now();
    await new Promise((done) => {
      const tick = (t) => {
        times.push(t - last);
        last = t;
        if (times.length < 90) requestAnimationFrame(tick);
        else done();
      };
      requestAnimationFrame(tick);
    });
    const sorted = [...times].sort((a, b) => a - b);
    return { p50: sorted[Math.floor(sorted.length * 0.5)], p95: sorted[Math.floor(sorted.length * 0.95)] };
  });
  const perf = await nav.evaluate(async () => {
    const times = [];
    let last = performance.now();
    let run = true;
    const tick = (t) => {
      times.push(t - last);
      last = t;
      if (run) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.location.hash = "#/4";
    await new Promise((r) => setTimeout(r, 1500));
    for (let k = 0; k < 4; k++) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      await new Promise((r) => setTimeout(r, 1100));
    }
    run = false;
    const sorted = [...times].sort((a, b) => a - b);
    return { frames: times.length, p50: sorted[Math.floor(sorted.length * 0.5)], p95: sorted[Math.floor(sorted.length * 0.95)] };
  });
  // Headless software rendering in CI has no GPU; compare against the idle baseline.
  check("Frame pacing during transitions vs idle baseline", perf.p50 <= idle.p50 * 1.25 + 1, { idle, transitions: perf });
  }
} finally {
  await browser.close();
  server.stop();
}

const totalIssues = report.slides.reduce((n, s) => n + s.issues.length, 0);
const vpIssues = report.viewports.reduce((n, v) => n + v.issues.length, 0);
fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
console.log(`slides audited: ${report.slides.length}, layout issues: ${totalIssues}, viewport issues: ${vpIssues}`);
for (const s of report.slides) if (s.issues.length) console.log(`  slide ${s.slide}:`, JSON.stringify(s.issues).slice(0, 600));
for (const v of report.viewports) if (v.issues.length) console.log(`  ${v.viewport}:`, JSON.stringify(v.issues).slice(0, 600));
console.log("fonts used (glyphs):", report.fontsUsed);
console.log("coverage:", report.coverage && { total: report.coverage.total, missing: report.coverage.missing });
for (const n of report.navigation) console.log(`  [${n.ok ? "PASS" : "FAIL"}] ${n.name}`, n.ok ? "" : JSON.stringify(n.detail ?? ""));
if (report.errors.length) console.log("console errors:", report.errors);
const failed =
  totalIssues + vpIssues + report.errors.length + report.navigation.filter((n) => !n.ok).length +
  (report.coverage?.missing?.length ?? 0);
console.log(failed ? `QA FAILED (${failed})` : "QA PASSED");
process.exit(failed ? 1 : 0);
