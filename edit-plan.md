# MACHRI — 4-in-1 Jump Starter · Edit Plan

Vertical 1080×1920, 30 fps, **41.67 s** (1,250 frames). The ElevenLabs Darija voice-over (40.44 s)
is the master clock: every cut, caption and reveal below is placed on a **measured** word onset
or pause. The source clip's own audio is never used (the footage master has no audio stream).

## 1. How the audio timeline was built

| Step | Tool | Output |
| --- | --- | --- |
| Word-level ASR | faster-whisper `large-v3`, `language=ar`, `word_timestamps=True`, beam 5 (`tools/transcribe.py`) | `tools/asr/whisper-large-v3.json` |
| Pause detection | `ffmpeg silencedetect` −40 dB, ≥ 0.15 s (24 pauses) | `tools/asr/silences-40dB.txt` |
| Energy envelope | 10 ms RMS (`tools/envelope.py`) — speech 0.15 s → 40.27 s | used to verify boundaries |
| Refinement | words clamped into the speech "islands" between pauses (`tools/refine_timeline.py`) | `tools/asr/timeline.json` |
| Manual corrections | `هاد` belongs after the "تخيّل!" pause (Darija هادشي); `عملي` starts 30.66 s (a −89 dB dip at 30.43–30.64 s); Darija spellings (أخيب، مصاريف، ليها، تستافد، دابا، جرّبو، تخلّص…) | merged into `captions.json → narration` |

Whisper stretched several words back over the preceding pause (e.g. `وتجي` 3.40 s → actually 3.83 s;
`تخيّل` 27.70 s → 28.19 s); the pause-island clamp fixes this. Spot checks of emphasis words against
energy dips agree within ±0.1 s (معطّل 2.34/2.38, الحل 16.46/16.45, صغير 18.26/18.24, ماشري 38.18/38.17).

### Measured narration (phrase level)

| Start–end (s) | Phrase |
| --- | --- |
| 0.15–1.30 | أخيب شعور هو… |
| 1.63–3.42 | شي نهار تفيق معطّل على الخدمة، |
| 3.83–5.34 | وتجي باش تشعل الطوموبيل ديالك، |
| 5.70–6.13 | والو! |
| 6.48–7.86 | البطارية ما بغاتش تعاون. |
| 8.22–8.59 | ودابا، |
| 9.03–10.81 | واش غادي تبقى تسنّى شي حدّ يجي يعاونك، |
| 11.19–13.13 | وتزيد عليها مصاريف ما كنتيش حاسب ليها؟ |
| 13.63–15.30 | الوقاية خير من العلاج. |
| 15.53–16.81 | وها علاش جبنا ليك الحل. |
| 17.13–18.77 | مع هاد الجهاز اللي كيبان صغير، |
| 19.01–21.50 | غادي تستافد من أربع خدمات فمنتوج واحد. |
| 21.88–22.95 | بوستر للبطارية، |
| 23.20–24.36 | منفاخ للرويدات، |
| 24.60–25.77 | باور بانك للطوارئ، |
| 25.96–26.82 / 26.97–27.86 | وحتى ضو LED / ينفعك فالظلام. |
| 28.19–28.76 | تخيّل! |
| 28.96–31.25 | هادشي كامل فجهاز واحد، عملي |
| 31.40–33.05 | وساهل تخليه معاك فالطوموبيل |
| 33.45–37.16 | ما تخليش مشكل فالبطارية ولا العجلة مفشوشة يعطلك نهارك |
| 37.53–38.73 | طلبو دابا من ماشري |
| 38.92–40.27 | وجرّبو قبل ما تخلّص |

## 2. Source footage inventory (14.83 s, 576×1024, 30 fps)

Cut times from `ffmpeg` scene detection. Nothing outside these takes is used.

| # | Source (s) | Content | Used in |
| --- | --- | --- | --- |
| S1 | 0.00–1.30 | Unit front (display, buttons), jump lead plugged in | D4 (motion), card 03 (still @0.25) |
| S1' | 1.30–2.43 | Unit rotated to the rear, lead in its port | F3a |
| S3 | 2.47–3.87 | Clamps onto the car battery | B3 (mono, 2.47–3.20), E1a (colour, 3.13–3.87) |
| S4 | 4.10–4.70 | Ignition key turn | B1, B2 freeze (still @4.70) |
| S4b | 4.73–5.20 | Instrument cluster lights up (car starts) | E1b |
| S5 | 5.23–6.27 | Hood open; unit, its case and clamps in the engine bay | A1/A2 (mono, cropped + faded to hide the unit), F2b (colour) |
| S6 | 6.30–7.57 | Hand on a soft tyre | C1, C2 (still @7.55, blurred) |
| S7 | 7.60–8.77 | Hand-held unit with hose, display ring lit | D2 reveal, card 04 (still @8.10), G (CTA window) |
| S8 | 8.80–9.43 | Hose on valve, pressure reading 0.45 | E2a |
| S9 | 9.47–11.13 | Unit on the ground inflating the tyre | D3, E2b, F3b (tight on the valve) |
| S10 | 11.17–13.00 | Unit on grass inflating a ball | F1 |
| S11 | 13.03–14.05 | Unit inflating a football | F2a — ends before a burned-in red arrow that appears at ~14.1 s |

Footage preparation (`tools/prepare-footage.sh`): audio dropped, 2× motion-compensated interpolation
(30 → 60 fps) so slow-motion shots stay smooth, Lanczos 576×1024 → 1080×1920 with light sharpening,
VP9/WebM master (decodes natively in `@remotion/media`). Slowed shots run at 0.22–0.83× —
never the whole clip stretched; each take is used once or twice, with a different crop, grade
or moment the second time (`tools/check_shots.py` verifies every shot stays inside one take).

## 3. Scene breakdown (actual timestamps)

Times in seconds; frame = time × 30. "Text @" is the spoken onset each word reveal is keyed to
(reveals start 4 frames early; measured on the render, accent words are half-visible 0–1 frame
after their onset).

| Scene | Time | Narration | Picture | On-screen text @ onset |
| --- | --- | --- | --- | --- |
| **A Hook** | 0.00–3.83 | أخيب شعور… تفيق معطّل على الخدمة | A1 hood-open car, mono/cold, slow push (S5 0.30×). **Cut at 2.34 on "معطّل"** to A2 punch-in on the raised hood (0.22×). Unit hidden by crop + bottom fade. | "أخيب شعور..." 0.15/0.36 → "تفيق" 2.06 · **"معطّل"** 2.34 (accent, impact reveal) · "على الخدمة؟" 2.76 |
| **B Battery** | 3.83–8.22 | وتجي باش تشعل الطوموبيل ديالك… والو! البطارية ما بغاتش تعاون | B1 key turn, slow (0.40×), cropped under the cluster. **Freeze on the pause 5.34–5.70**; frame sinks darker as **"والو!" lands at 5.70**. B3 battery close-up, mono (0.42×) + empty-battery glyph whose last cell blinks out. | "وتجي" 3.83 "تشعل" 4.22 "الطوموبيل..." 4.44 · **"والو!"** 5.70 · "البطارية" 6.48 / "ما بغاتش" 6.88 "تشعل" 7.34 (brief's wording; narrator says تعاون) |
| **C Frustration** | 8.22–13.63 | واش غادي تبقى تسنّى… وتزيد عليها مصاريف ما كنتيش حاسب ليها؟ | C1 hand on soft tyre, mono (0.43×). At 11.19 ("وتزيد") the frame freezes, blurs and sinks to black into the proverb. | Notification pill + ticking clock: "تبقى" 9.28 "تسنّى" 9.54 "المساعدة؟" 9.96 → slides up/dims at 11.19; pill + receipt: "مصاريف" 11.66 "ما حسبتيش" 12.10/12.18 "ليها؟" 12.76 |
| **D1 Proverb** | 13.63–15.53 | الوقاية خير من العلاج | Clean dark backdrop, a faint glow rises and opens (tone turns from frustration to calm); text exits at 15.52 straight into the reveal. | "الوقاية" 13.63 · "خير" 14.04 "من" 14.50 "العلاج" 14.60 |
| **D2 Reveal** | 15.53–17.13 | وها علاش جبنا ليك الحل | **Vertical-blinds reveal** (right-to-left) from black to the product in full colour: hand-held unit, display ring lit (S7 0.72×). First colour image of the ad. | **"الحل"** 16.46 (accent, impact) + "عندك!" |
| **D3 Compact** | 17.13–19.01 | مع هاد الجهاز اللي كيبان صغير | Unit beside the wheel (S9 0.60×) — scale is visible. Accent ring draws around the unit on "كيبان". | "هاد الجهاز" 17.18 · "كيبان" 18.04 **"صغير..."** 18.26 |
| **D4 Four** | 19.01–21.88 | غادي تستافد من أربع خدمات فمنتوج واحد | Unit front with jump leads (S1 0.45×). | **"4"** 19.80 "خدمات" 20.18 (4 segments fill) · "فمنتوج واحد" 20.76 |
| **E Features** | 21.88–28.19 | بوستر للبطارية، منفاخ للرويدات، باور بانك للطوارئ، وحتى ضو LED ينفعك فالظلام | Persistent header: index 01→04 + progress segments. **01** clamps on battery (1×) → cluster lights up (0.75×). **02** pressure reading at the valve (0.78×) → unit inflating the tyre (1×). **03** card: real product still (no demo exists). **04** card: still of the real light button + ring on "LED"; frame dims on "الظلام" 27.42. | 01 "بوستر" 21.88 "للبطارية" 22.16 · 02 "منفاخ" 23.20 "للرويدات" 23.54 · 03 "باور بانك" 24.60 "للطوارئ" 25.04 · 04 "ضو" 26.26 "LED" 26.42 "للطوارئ" 26.97 · Latin sub-labels BOOSTER BATTERIE / TIRE INFLATOR / EMERGENCY POWER BANK / LED EMERGENCY LIGHT |
| **F1 One device** | 28.19–30.66 | تخيّل! هادشي كامل فجهاز واحد | Unit on grass inflating a ball (S10 0.74×). | "تخيّل!" 28.19 · **"4"** 28.96 "خدمات." 29.18 / "جهاز واحد." 29.82 |
| **F2 Practical** | 30.66–33.45 | عملي وساهل تخليه معاك فالطوموبيل | F2a football (S11 0.83×). **F2b: the same hood as the hook — now in colour, the unit sitting in the engine bay** (callback). | **"عملي"** 30.66 "وساهل" 31.40 · "تخليه" 31.86 / "فالطوموبيل" 32.44 |
| **F3 Recap** | 33.45–37.53 | ما تخليش مشكل فالبطارية ولا العجلة مفشوشة يعطلك نهارك | Lead plugged into the unit (0.70×) → cut on "العجلة" 35.04 to the hose on the valve, tight (0.45×). | "مشكل فالبطارية" 33.84/34.20, **struck through 34.95** · "العجلة مفشوشة" 35.04/35.52, **struck through 36.00** |
| **G CTA** | 37.53–41.67 | طلبو دابا من ماشري، وجرّبو قبل ما تخلّص | Dark stage, product window (S7 0.27×), soft accent glow. Holds 1.4 s after the last word. | **"طلبو دابا"** 37.53/37.74 · "MACHRI" 38.18 (on "ماشري") · pill "جرّب قبل ما تخلّص" 38.92→39.68 |

## 4. Feature claims vs. footage

| Feature | Demonstrated in the supplied footage? | Treatment |
| --- | --- | --- |
| 01 Booster batterie | **Yes** — clamps on the battery, key turn, instrument cluster lights up | Real footage |
| 02 Tire inflator | **Yes** — hose on valve, pressure read-out, tyre and balls inflating | Real footage |
| 03 Emergency power bank | **No** | Typographic card on a real product still; no phone, cable or charging is shown |
| 04 LED emergency light | **No** (the light is never shown on) | Card highlighting the real light button; no fake beam or glow |

No wait times, repair costs, discounts, countdowns, testimonials or guarantees are shown.

## 5. Design system

- **Type:** Cairo (SIL OFL 1.1) 700/800/900, bundled locally (`public/fonts`). RTL lines, max two lines,
  large sizes (lead 100–128 px, keywords 150–310 px); each line auto-fits the safe width.
- **Colour:** no MACHRI brand kit was supplied, so the ad uses a monochrome base (ink `#0B0B0D`,
  graphite, off-white) + one accent, electric lime `#D4FF3C` (echoes the reference and the unit's
  teal-green display). Problem scenes are graded mono/cold; colour arrives with the solution.
- **Motion:** word reveals rise + de-blur with an expo-out ease (11 frames); emphasis words use a
  scale-settle "impact" reveal (9 frames); exits fade/blur up (6 frames); every caption block
  drifts +3 % in scale while it holds, so holds never read as frozen frames. Pushes are slow
  (≤ 8 % zoom per shot). One stylised transition (blinds) at the solution; all other cuts are hard cuts.
- **Safe zones:** all text between y = 270 and y ≈ 1250 px, 72 px side margins (Reels bottom 35 % /
  top 14 % kept clear). Media may extend into the UI zones.
- **Reference** (Pinterest pin 953637289872814725 — "Reels Editing Tutorial Clean & Minimal Style"):
  the preview video was downloaded and reviewed (for reference only, not used in the ad). Adapted:
  small lead word + large accent keyword stacks, blur/rise reveals, a strike-through annotation,
  glassy notification pills, a circle highlight ring, the striped wipe, and a dark desaturated grade
  with a single lime accent.
- **Audio:** voice-over only. No music or SFX — no licensed assets were supplied.

## 6. Additional B-roll that would strengthen the ad

1. Power bank in use — a phone charging from the unit's USB port (would replace card 03).
2. LED light switched on at night / in an engine bay (would replace card 04 and pay off "فالظلام").
3. A morning "late for work" moment (person, keys, watch) for the hook.
4. The unit stored in a boot or glovebox for "تخليه معاك فالطوموبيل".
5. MACHRI logo and brand colours (the end card currently typesets the name only).
