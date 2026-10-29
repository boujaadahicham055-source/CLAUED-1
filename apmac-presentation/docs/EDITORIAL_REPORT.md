# Editorial & QA Report — APMAC Statutes Presentation

This report is internal. None of it appears on the slides the audience sees.

**Source:** `source/statut APMAC V6.pub` (Microsoft Publisher). I converted it to `source/APMAC_Statuts_Source_Reference.pdf` with LibreOffice, rendered every page to an image and read it in full. Raw PDF text extraction garbles Arabic ligatures (for example `الظهري` for **الظهير**, `القوانني` for **القوانين**, `غري` for **غير**, `الرتافع` for **الترافع**, `تعىن` for **تُعنى**). Wherever extraction and the rendered page disagreed, I followed the **rendered page**. Those extraction artefacts are not listed below as corrections.

The statute text lives in one place, `src/content/statute.ts`. The slides, the reference panel shown with `T`, and `docs/APPENDIX_FULL_TEXT.md` are all generated from it.

---

## 1. Slides created (31)

Transition families: **C** opening/closing · **B** chapter · **A** article.

| # | Slide | Family | Theme |
|---|---|---|---|
| 01 | Cover — القانون الأساسي للجمعية المهنية المغربية للفنانين الممثلين · سوس ماسة | C | dark |
| 02 | Overview — the five chapters and their article ranges | A | ivory |
| 03 | الباب الأول: التأسيس – الاسم – المقر – الأهداف | B | dark |
| 04 | الفصل الأول · التأسيس | A | ivory |
| 05 | الفصل الثاني · المقر | A | ivory |
| 06 | الفصل الثالث · المدة | A | ivory |
| 07 | الفصل الرابع · الإطار القانوني المرجعي | A | ivory |
| 08 | الفصل الخامس · الأهداف المهنية (aim and index of the six areas) | A | ivory |
| 09–14 | الفصل الخامس · أولًا … سادسًا (one slide per area of activity) | A | ivory + charcoal band |
| 15 | الباب الثاني: العضوية والانخراط | B | dark |
| 16 | الفصل السادس · شروط العضوية | A | ivory |
| 17 | الفصل السابع · أنواع الأعضاء المنخرطين (comparison matrix) | A | ivory |
| 18 | الفصل الثامن · فقدان العضوية | A | ivory |
| 19 | الباب الثالث: الهيكلة الإدارية | B | dark |
| 20 | الفصل التاسع · الجمع العام العادي | A | ivory |
| 21 | الفصل العاشر (1/4) · election, term, composition, structure chart | A | ivory |
| 22 | الفصل العاشر (2/4) · the president and the two vice-presidents | A | ivory |
| 23 | الفصل العاشر (3/4) · secretary-general, treasurer and their deputies | A | ivory |
| 24 | الفصل العاشر (4/4) · counsellors and the duties of the executive bureau | A | ivory |
| 25 | الفصل الحادي عشر · مجلس الجمعية and الانتدابات الإقليمية | A | ivory |
| 26 | الباب الرابع: اللجان الوظيفية | B | dark |
| 27 | الفصل الثاني عشر · the five standing committees | A | ivory |
| 28 | الباب الخامس: الموارد المالية | B | dark |
| 29 | الفصل الثالث عشر · الموارد | A | ivory |
| 30 | الفصل الرابع عشر · التصفية والحل | A | ivory |
| 31 | Closing — association name, region, title | C | dark |

**Why 31 rather than 22–28:** Article 5 has six substantive areas, 26 provisions in all. Article 10 defines 8 posts with 19 listed duties, plus 4 duties of the executive bureau. Shrinking the type to fit them into fewer slides would break the readability rule, so both articles continue across additional slides. There are no filler slides.

## 2. Source article mapping

All 50 text blocks of the statute appear on slides. The deck checks this coverage at runtime (`coverageReport()`) and `npm run qa` verifies it.

| Article | Blocks | Slide(s) |
|---|---|---|
| الفصل 1 التأسيس | founding, legal-basis, personality | 04 |
| الفصل 2 المقر | seat, transfer | 05 |
| الفصل 3 المدة | duration | 06 |
| الفصل 4 الإطار القانوني المرجعي | framework (7 texts), compliance | 07 |
| الفصل 5 الأهداف المهنية | aim, means | 08 |
| | أولًا (6 provisions) | 09 |
| | ثانيًا (5) | 10 |
| | ثالثًا (intro + 4) | 11 |
| | رابعًا (4) | 12 |
| | خامسًا (4) | 13 |
| | سادسًا (3) | 14 |
| الفصل 6 شروط العضوية | conditions (7), other-categories | 16 |
| الفصل 7 أنواع الأعضاء | active, incubated, honorary | 17 |
| الفصل 8 فقدان العضوية | loss | 18 |
| الفصل 9 الجمع العام العادي | role, composition, agenda (5) | 20 |
| الفصل 10 المكتب المسير | term, vote, mandate, size | 21 |
| | president, vp1, vp2 | 22 |
| | sg, dsg, treasurer, dtreasurer | 23 |
| | counsellors, bureau-duties (4) | 24 |
| الفصل 11 مجلس الجمعية | council, delegations-head, delegations | 25 |
| الفصل 12 (no heading) | intro, 5 committees, flex | 27 |
| الفصل 13 الموارد | resources (5) | 29 |
| الفصل 14 التصفية والحل | dissolution | 30 |

**Wording.** All statutory text on the slides is **verbatim** (after the corrections in §3). It is not paraphrased. Where a layout splits a sentence (Art. 1, 2, 3, 7, 9), `verbatimSplit()` checks that the fragments join back into the exact source sentence.

**Presentation labels.** Some short labels are navigation aids I added. They are not statutory text:
- the Art. 9 fact labels: المكانة / الدورة العادية / الدورة الاستثنائية / التركيبة
- the Art. 10 part labels: الانتخاب والتركيبة / الرئاسة / الكتابة العامة وأمانة المال / المستشارون ومهام المكتب التنفيذي
- the overview heading «خمسة أبواب وأربعة عشر فصلًا»
- the Art. 1 timeline years (1958, 1973, 2002), taken from the dates in the text
- the Art. 7 rights row (يحق / لا يحق), which states explicitly what the source sentence «الفئة الوحيدة التي يحق لها التصويت والترشح لهياكل الجمعية» implies

The full original wording is always one key press away (`T`) and is reproduced in `docs/APPENDIX_FULL_TEXT.md`.

## 3. Arabic proofreading corrections

These are orthographic, punctuation and typesetting corrections only. None of them changes legal meaning.

| Where | Source | Applied | Reason |
|---|---|---|---|
| Throughout | `و ذلك`, `و اجتماعيا`, `و التلفزيونية`, `و هم`, … | وذلك، واجتماعيًا، والتلفزيونية، وهم … | The conjunction و is written attached to the next word |
| Art. 6 | `إنخراطات`, `إنخراطه` | انخراطات، انخراطه | Hamzat al-waṣl: انخراط takes no hamza |
| Art. 11 (subheading) | `الإنتدابات الإقليمية` | الانتدابات الإقليمية | Hamzat al-waṣl |
| Art. 9, Art. 11 | `أقليم` | إقليم | Hamza below the alif (إقليم) |
| Art. 1 | `)) Association … Comédiens ((… APMAC))` with stray brackets and `، . .` | Association … Comédiens (APMAC) | Publisher RTL bracket and punctuation artefacts |
| Art. 1 | `( 1958 … )`-style reversed or spaced parentheses | (الموافق لـ 15 نونبر 1958) | Bidi bracket normalisation |
| Throughout | Space before a comma or period (`المسرحية ، السينمائية`, `بالاستقالة ،`) | No space before punctuation | Arabic punctuation spacing |
| Art. 11 | Latin comma `,` after «مرتين في السنة» | Arabic comma «،» | Arabic punctuation |
| Art. 1, 5, 10 | Straight quotes `"…"`; in Art. 10 the closing quote of `"صندوق التضامن الفني` was missing | «…» | Arabic guillemets; closed the unterminated quotation |
| Art. 10 | `09 أعضاء … و 13 عشر عضوا على الأكثر` | 09 أعضاء على الأقل و13 عضوًا على الأكثر | `13 عشر` duplicates the tens word (a remnant of «ثلاثة عشر»). The numeral 13 is unambiguous and kept |
| Art. 10 | `و يضم المكتب الوطني، 09 أعضاء` | ويضم المكتب الوطني 09 أعضاء | Removed the comma between verb phrase and object |
| Art. 10 | `07 سبعة أيام` | 07 (سبعة) أيام | Parentheses, matching the source's own «أربع (05)» pattern |
| Art. 7 | `أعضاء مُحْتَضَنُون` (fully vocalised, stretched with kashida) | أعضاء مُحتضَنون | Kept the disambiguating vowels; removed kashida stretching, which breaks rendering at display sizes |
| Throughout | Tanwīn mixed: `مهنيا` / `قانونيًا` | Consistent ـًا (مهنيًا، قانونيًا، عضوًا …) | Consistency |
| Art. 5 (أولًا) | `المسرحية ، السينمائية و التلفزيونية` | المسرحية، والسينمائية والتلفزيونية | Spacing and the attached و. Comma sequence kept as in source |

**Deliberately not changed:**
- **لمبدإ** (Art. 5): a correct classical spelling.
- **مناديب**: used consistently in the source as the plural of مندوب. The standard plural is مندوبون/مندوبين (مندوبو الأقاليم). I left it for the association to decide.
- Art. 6, first condition «متمتعًا بحقوقه المدنية،»: the mixed list grammar (see §4.12) is preserved.
- Art. 6, «أن يوافق على قبول انخراطه المكتب المسير»: verb–object–subject order is grammatical and kept.

## 4. Unresolved source ambiguities (for the association's review)

These are shown **verbatim** on the slides. None was silently resolved.

1. **Art. 10, «لمدة أربع (05) سنوات».** The number word says *four* and the numeral says *05*. Art. 9 has the General Assembly meeting «مرة في كل ولاية من 05 سنوات», which points toward five, but I made no decision. The slide shows the wording exactly as written.
2. **Art. 9, GA agenda item «أن يوقع على ميثاق الشرف الذي تتبناه الجمعية».** This is identical to a membership condition in Art. 6. It does not fit grammatically or substantively in a list of matters the General Assembly deliberates on, and is probably a copy-paste remnant. It is kept as written.
3. **Art. 9, «بطلب من ثلثي أعضائه».** The pronoun could refer to the members of the General Assembly or of the bureau.
4. **The bureau is named five different ways:** المكتب المسير (Art. 2, 6, 9), المكتب التنفيذي المسير (Art. 8, 10), المكتب التنفيذي (Art. 10, 11), **المكتب الوطني** (Art. 10, unusual for a regional association) and المكتب (Art. 11, 12).
5. **Art. 8, scope of «وبقرار من المكتب التنفيذي المسير».** It is unclear whether this applies to every cause of loss of membership or only to the last («لأي سبب يتعارض مع ركائز الجمعية»).
6. **Art. 9, General Assembly composition:** bureau, council and provincial delegates. Ordinary active members are not mentioned, although Art. 7 reserves voting and candidacy rights to them.
7. **Council size wording:** «20 عضوًا فاعلًا» (Art. 9) against «20 عضوًا عاملًا» (Art. 11).
8. **How provincial delegates are chosen:**
   - Art. 9: «يتم تعيينهم من طرف المكتب المسير بتشاور مع فناني كل إقليم»
   - Art. 10: «الإشراف على تزكية مناديب الأقاليم»
   - Art. 11: «بعد التزكية بناءً على ترشيحات فناني كل إقليم»

   Appointment and endorsement are both mentioned. Art. 11 also fixes the number at «الأقاليم الستة».
9. **Committee naming:** «لجنة الشؤون القانونية» (Art. 10) against «اللجنة القانونية» (Art. 12).
10. **Art. 12 has no heading**, the only article without one. The slide shows «الفصل الثاني عشر» under the chapter title «اللجان الوظيفية». I did not invent a heading.
11. **Art. 14 refers to «الجمع العام الاستثنائي».** Extraordinary sessions are mentioned in Art. 9, but no quorum or majority is specified for dissolution.
12. **Art. 6 list grammar.** «يشترط في العضو أن يكون:» is followed by «متمتعًا…» and then by items starting «أن يزاول…», «الالتزام…».
13. **Chapter I title** «التأسيس – الاسم – المقر – الأهداف» does not mention المدة (Art. 3) or الإطار القانوني (Art. 4). The name has no separate article; it is covered in Art. 1.
14. **Art. 1 legal references.** The dates are reproduced as written: 3 Joumada I 1378 / 15 November 1958; 6 Rabii I 1393 / 10 April 1973; 12 Joumada I 1423 / 23 July 2002. They match the commonly cited dahirs on the right of association. Nothing was altered.

## 5. Responsive & typography checks

Run with `npm run qa` (Playwright + Chromium) on the final build:

- **Canvas.** Fixed 1920×1080 stage, scaled uniformly and letterboxed. Layout is identical at every size.
- **31/31 slides at 1920×1080:** 0 issues. The audit checks:
  - every rendered line box stays inside the canvas safe zone
  - no line box intrudes on the footer band
  - no line boxes of different elements intersect (beyond the tall ascent/descent of Arabic fonts, threshold 35% of line height)
  - no clipped containers
- **1366×768, 1440×900, 1280×800, 390×844:** the stage fits fully in the viewport, the page never scrolls, and 0 issues.
- **Fonts actually used**, read through Chrome DevTools `CSS.getPlatformFontsForNode` across every slide:
  - Noto Sans Arabic (Regular and Medium) for body text
  - IBM Plex Sans Arabic (SemiBold and Bold) for display type
  - IBM Plex Sans Arabic Latin 400 for Western digits and Latin inside body text, because the Arabic subset of Noto has no digits

  No system fallback fonts appear. That means no replacement boxes and no missing glyphs.
- **Arabic letter-spacing:** none. The audit fails if any Arabic text node computes non-zero `letter-spacing`. Tracking applies only to the Latin acronym «APMAC».
- **Justification:** none. All text is `text-align: start`, so there are no stretched inter-word gaps. Headings use `text-wrap: balance` and body text uses `text-wrap: pretty`.
- **Arabic animation:** none at character or word level. Reveals animate whole blocks only. Highlights (Art. 8, Art. 11) start and end on word boundaries, so joining is never broken.
- **Type sizes at 1920:**

  | Element | Size |
  |---|---|
  | Hero | 92 px |
  | Chapter title | 70 px |
  | Article title | 50 px |
  | Body | 24–34 px (dense lists 24–26 px) |
  | Metadata | 19–21 px |
  | Line height | 1.6–1.78 |

- **Bidi.** Latin runs are isolated with `dir="ltr"`, namely the French name and «(APMAC)». Numbers, dates, «68.16», «(05)», «1/4» and the counter «05 / 31» render in the correct order.
- **Palette.** Only #12151A, #F4F0E8, #C8A76D, #682438 and #A89F92 are used, plus opacity variants of them. Gold appears only as rules, markers and key numerals.
- **Images and logos:** none. No logo or seal was invented.
- **Visual review.** I inspected screenshots of every slide (`qa-output/1920/`) and selected 1366×768 renders (`qa-output/1366/`). `docs/qa-contact-sheet.jpg` shows all 31.

## 6. Transition & navigation checks

All 18 checks pass.

| Check | Result |
|---|---|
| `←` advances, `→` goes back (RTL) | PASS |
| `PageDown` advances (presenter clickers) | PASS |
| `Home` / `End` | PASS |
| 14 key presses in under 0.5 s settle on the correct slide, with exactly one layer remaining at full opacity | PASS |
| Alternating back-and-forth mashing settles cleanly | PASS |
| Cannot navigate before the first slide or after the last | PASS |
| Next and previous buttons | PASS |
| Overview grid opens, shows 31 thumbnails, and jumps to a slide | PASS |
| Reference panel (`T`) shows the original wording; `Esc` closes it | PASS |
| Controls auto-hide when idle (`H` toggles) | PASS |
| `F` enters and leaves fullscreen | PASS |
| Swiping right advances (RTL) | PASS |
| Reduced motion: navigation works, transitions become plain fades, no sweep line | PASS |
| Frame pacing during transitions (headless Chromium, software rendering) | median 16.7 ms (60 fps), same as the idle baseline |

**Motion system:**
- **A (article):** a 0.78 s horizontal shift with `cubic-bezier(0.22,1,0.36,1)`. Going forward, the new slide arrives from the left (the reading end) and the old one drifts right.
- **B (chapter):** a 1.0 s horizontal clip-mask reveal from the right, led by a 2 px gold line travelling across the stage.
- **C (opening/closing):** an abstract curtain (two charcoal panels whose hairline gold edges part from the centre) runs together with:
  - a slow spotlight drift
  - the proscenium lines drawing in
  - the title reveal
- **Content reveals:** small staggered block entrances, 90 ms apart, with headings first.

## 7. Output locations

| Item | Path |
|---|---|
| Presentation source (React + TypeScript + Vite) | `apmac-presentation/` |
| Statute data (single source of truth) | `apmac-presentation/src/content/statute.ts` |
| Production build (after `npm run build`) | `apmac-presentation/dist/` |
| Static PDF (16:9, 31 pages, fonts embedded) | `apmac-presentation/exports/APMAC-Statuts-Presentation.pdf` |
| Full statute text appendix | `apmac-presentation/docs/APPENDIX_FULL_TEXT.md` |
| This report | `apmac-presentation/docs/EDITORIAL_REPORT.md` |
| QA contact sheet (all 31 slides) | `apmac-presentation/docs/qa-contact-sheet.jpg` |
| QA screenshots and JSON report (regenerated by `npm run qa`, not committed) | `apmac-presentation/qa-output/` |
| Original source and rendered reference | `apmac-presentation/source/` |

**Not produced: a PowerPoint export.** Nothing in this project would carry the interactive transitions into PowerPoint, so I make no claim that one exists.
