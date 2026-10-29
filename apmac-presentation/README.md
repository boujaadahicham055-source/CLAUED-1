# APMAC — Statutes Presentation (العرض التقديمي للقانون الأساسي)

An animated, Arabic-first web presentation of the statutes (القانون الأساسي) of the
**Professional Moroccan Association of Actor-Artists – Souss-Massa (APMAC)**:
«الجمعية المهنية المغربية للفنانين الممثلين – سوس ماسة».

- 31 slides on a fixed 16:9 canvas (1920×1080), letterboxed to any screen
- Native RTL, `lang="ar" dir="rtl"`; IBM Plex Sans Arabic for display type and Noto Sans Arabic for body text, both bundled locally (SIL OFL)
- Three transition families: article, chapter and opening/closing
- Every provision of the 5 chapters and 14 articles is reproduced. The deck checks this coverage when it builds (50 of 50 text blocks).

## Launch

Requires Node.js 18+.

```bash
cd apmac-presentation
npm install
npm run dev          # http://localhost:5173 (development)
# or, for presenting:
npm run build
npm run preview      # http://localhost:4173
```

After `npm install`, nothing loads from the network at runtime. All fonts and code are bundled.
After `npm run build`, the `dist/` folder is a static site. You can open it from any static server.

Open the page and press **F** for fullscreen.

## Presenting

| Action | Keys / gesture |
|---|---|
| Next slide (RTL: reading runs leftward) | `←` · `PageDown` · `↓` · `Space` · `Enter` · swipe right |
| Previous slide | `→` · `PageUp` · `↑` · `Backspace` · swipe left |
| First / last slide | `Home` / `End` |
| Fullscreen | `F` |
| Slide overview (الفهرس) | `G` or `O` (`Esc` closes) |
| Original statute wording for the current slide (النص الأصلي) | `T` or `S` |
| Hide / show presenter controls | `H` (controls also hide after 2.6 s without mouse movement) |

Wireless presenter clickers usually send `PageDown`/`PageUp`, so they work as expected.
Deep links work: `…/#/21` opens slide 21.
If the operating system has *reduced motion* enabled, the movement-based transitions become short fades.

## Static PDF

```bash
npm run build
npm run pdf          # → exports/APMAC-Statuts-Presentation.pdf (31 pages, 16:9, fonts embedded)
```

The PDF is a static, print-friendly copy. It has no transitions.

## Quality assurance

```bash
npm run build
npm run qa           # Playwright: screenshots + geometry/typography audit + navigation tests → qa-output/
```

It checks:
- that each slide fits its canvas
- line-box collisions, clipping and footer intrusion
- that no Arabic text has `letter-spacing` and nothing is justified
- the fonts actually used for rendering, read through Chrome DevTools: only IBM Plex Sans Arabic and Noto Sans Arabic may appear
- viewport fit at 1920×1080, 1366×768, 1440×900, 1280×800 and 390×844
- keyboard, buttons, swipe, overview, reference panel, fullscreen, rapid key-mashing, reduced motion and frame pacing

## Structure

```
src/content/statute.ts   ← the authoritative statute text (single source of truth)
src/content/deck.tsx     ← slide order, transition family, article/block coverage
src/slides/layouts.tsx   ← slide compositions
src/slides/parts.tsx     ← masthead, footer, provision lists, bidi + verbatim helpers
src/components/          ← deck engine, motion primitives, stagecraft, reference panel
src/styles/              ← tokens (palette, type scale, spacing), slide and chrome CSS
scripts/                 ← QA, PDF export, full-text appendix generator
docs/EDITORIAL_REPORT.md ← proofreading, source ambiguities, QA results
docs/APPENDIX_FULL_TEXT.md ← complete statute wording (generated from statute.ts)
source/                  ← the supplied .pub and a rendered PDF reference
```

Slides do not retype the statute. They read it from `statute.ts`. When a slide splits a sentence across a layout, `verbatimSplit()` checks that the pieces join back into the exact source sentence. If they don't, the slide throws when it renders, so `npm run qa` fails.
