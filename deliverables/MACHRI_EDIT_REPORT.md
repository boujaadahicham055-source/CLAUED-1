# MACHRI — Edit Report

**Deliverable:** `MACHRI_FINAL_AD.mp4` · 1080×1920 (9:16) · 30 fps · 900 frames · **30.00 s** · H.264 High (yuv420p, BT.709 limited range) + AAC-LC 192 kb/s 48 kHz stereo.
**Project:** Remotion 4.0.530 / React 19 / TypeScript. It is fully editable: timings live in `src/data/audioTimeline.ts` and footage choices in `src/data/shotMap.ts`.

| | Duration | Notes |
| --- | --- | --- |
| Voice-over (master) | **28.761 s** (speech 0.09 → 28.52 s) | `ElevenLabs_2026-10-21T22_27_52_CHAREF MARKETING_gen_sp100_s50_sb75_v4.mp3`, MP3 44.1 kHz mono 128 kb/s, used unmodified |
| Source video | **38.68 s** | 576×768 (3:4), 25 fps, H.264 ~316 kb/s, AAC stereo (removed) |
| Final ad | **30.00 s** | VO + 1.48 s hold on the closing card |

---

## 1. Assets inspected

**Source video.** The upload arrived as `998d899c-____…_5____1_Portable_Car_Battery_Jump_Starter_with_Air_Compressor_1000A_150PSI_…mp4`; the Arabic part of the name was replaced by underscores in transit. It is the "… 5 في 1 Portable Car Battery Jump Starter …" clip. It was copied byte-identical (md5 `08e7cb0a…`) to `public/media/source_product.mp4`. The full analysis is in `source_shot_inventory.json`, covering 17 source shots with scene cuts detected by ffmpeg at 1.04 / 3.24 / 5.40 / 7.88 / 10.08 / 12.40 / 13.36 / 16.24 / 18.92 / 21.52 / 22.72 / 28.20 / 29.04 / 32.96 s.

Embedded graphics found:
- Three black title cards ("Jump Starters", "Tire Inflator", "Charger"). All rejected.
- Burned-in English captions in the lower band of most shots, including the typo "Red clamp to the pvositive termiv +". I measured the clean rows per shot and **never show anything below them** (e.g. rows 0–592 on the clamp shots, 0–768 on the caption-free inflator/phone shots).
- An embossed manufacturer badge on the device body. It is left untouched (see §7).

**Voice-over.** 28.761 s. I measured it directly rather than estimating (§3).

**Motion reference.** The Pinterest pin *was* accessible: "Reels Editing Tutorial — Clean & Minimal Style" (720×1280, 30 fps, 16.9 s). I analysed it for editing principles only. No footage was used or reproduced.
- **Hierarchy:** a small white lead word sits above one oversized keyword in a single saturated accent, sometimes with a small trailing line.
- **Sync:** each word appears as it is spoken, with a new text beat every ~1–1.5 s.
- **Motion:** fast ease-out entrances (≈6–10 frames) with a blur-to-sharp settle and a soft glow on the keyword. Exits are quick and upward.
- **Emphasis:** a red strike-through for negatives, a ring/focus highlight on the subject, and one stripe ("blinds") transition. The footage is dark and desaturated so the single accent carries.

**Branding.** No MACHRI logo or design files were supplied, so I used a simple typographic wordmark ("MACHRI", Cairo Black, wide tracking, accent underline). The accent colour #FF6B1F is taken from the product's own orange hose connector and clamp.

## 2. Creative direction

Premium, clean kinetic typography over real footage, with **one accent colour**: product orange. Two exceptions are deliberate: red for "ما بغاتش" (failure) and ice-blue for "البرد".

- **Layout.** Each shot is a sharp, caption-free window of the source, feathered into a blurred, dimmed extension of itself. This fills 9:16 without stretching, without showing captions, and without a letterbox look.
- **Text placement.** Headlines live in a top zone (y≈390–650) over a dark scrim. Product action is framed lower (y≈700–1300).
- **Emotional arc:**

| Phase | Scenes |
| --- | --- |
| Suspense | S01 cold, dark interior |
| Concern | S02 freeze + drained grade; S03 grade drifts to icy on "البرد" |
| Relief | S04 type-only beat over a defocused product, then S05 focus pull |
| Discovery | S06–S09 four functions under one numbered system (01–04 progress rail) |
| Payoff | S10 "4" + 2×2 grid collapsing into one device |
| Confidence | S11 |
| Urgency | S12 (no timers/counters) |
| Reassurance | S13 |

## 3. Audio timeline (master clock)

**Method:**
1. ffmpeg `silencedetect` (−40 dB / 120 ms; identical at −35 dB) gave **18 phrase segments** with exact start/end times.
2. faster-whisper large-v3-turbo produced word timestamps.
3. Each word boundary was refined to the nearest 10 ms RMS-envelope dip.
4. I checked a waveform plot with every word marker against the recording.

Whisper's words matched the supplied transcript. The recording says "في جهاز" where the script writes "فجِهاز"; the on-screen text uses the scripted "فجِهاز" (with kasra). Full data, including frames at 30 fps, planned visual, text and animation per segment, is in `audio_timeline.json`.

## 4. Scene-by-scene timing (frames @30 fps)

Every scene cut falls inside a measured silence, 2–8 frames before the next line. No cut lands on a word.

| Scene | Frames | Time (s) | Voice (measured) | Footage (source @ time) | On-screen text → entrance (frame) |
| --- | --- | --- | --- | --- | --- |
| S01 The hook | 0–94 | 0.00–3.13 | تخيل تفيق الصباح، (0.09–1.20)<br>عندك خدمة ضرورية، (1.42–2.88) | SRC05 @7.96s freeze | تخيّل → MaskedReveal (f-4)<br>هاد الموقف → MaskedReveal (f6)<br>عندك خدمة ضرورية… → DirectionalSlide (f40) |
| S02 The problem | 94–157 | 3.13–5.23 | وتلقى الطوموبيل ما بغاتش تديماري. (3.21–5.08) | SRC05 @8.12s<br>SRC05 @8.933s freeze | وتلقى الطوموبيل → DirectionalSlide (f95)<br>ما بغاتش تديماري! → SoftScale (f116) |
| S03 Old battery & cold | 157–262 | 5.23–8.73 | خصوصاً إلا كانت البطارية قديمة، (5.36–7.36)<br>وزاد عليها البرد. (7.68–8.65) | SRC04 @5.42s 0.695x | خصوصاً إلا كانت → DirectionalSlide (f159)<br>البطارية قديمة؟ → KeywordEmphasis (f189)<br>وزاد عليها → DirectionalSlide (f228)<br>البرد! → KeywordEmphasis (f247) |
| S04 The emotional turn | 262–331 | 8.73–11.03 | علاش تبقى متقلق من هاد المواقف؟ (9.00–10.83) | SRC11 @21.62s freeze | علاش → MaskedReveal (f268)<br>تبقى متقلق؟ → MaskedReveal (f278) |
| S05 Product reveal | 331–365 | 11.03–12.17 | مع هاد الجهاز، (11.11–12.03) | SRC11 @21.52s | مع هاد الجهاز → DirectionalSlide (f332) |
| S06 Battery booster | 365–418 | 12.17–13.93 | عندك ديماغيور للبطارية، (12.22–13.78) | SRC02 @1.12s<br>SRC03 @3.72s | ديمارور البطارية → FeatureReveal (f372) |
| S07 Tyre inflator | 418–464 | 13.93–15.47 | وگونفلور للرويضات. (13.99–15.32) | SRC08 @14.95s<br>SRC09 @16.95s | گونفلور للرويضات → FeatureReveal (f418) |
| S08 Power bank | 464–510 | 15.47–17.00 | وزيد عليهم باور بانك، (15.59–16.88) | SRC14 @30.7s | POWER BANK → FeatureReveal (f484) |
| S09 Emergency light | 510–556 | 17.00–18.53 | وحتى ضو ديال الطوارئ. (17.09–18.36) | SRC15 @34.1s<br>SRC17 @37s | ضو الطوارئ → FeatureReveal (f519) |
| S10 4-in-1 payoff | 556–626 | 18.53–20.87 | أربع خدمات (18.62–19.53)<br>فجِهاز واحد! (19.73–20.65) | 2x2 grid: SRC03 / SRC09 / SRC14 / SRC15<br>SRC10 @20s | 4 → NumberReveal (f556)<br>خدمات → MaskedReveal (f563)<br>فجِهاز → MaskedReveal (f590)<br>واحد → KeywordEmphasis (f603) |
| S11 Convenience | 626–689 | 20.87–22.97 | تقدر تخليه ديما معاك فالطوموبيل. (20.96–22.85) | SRC12 @23.2s | تقدر تخليه → DirectionalSlide (f627)<br>ديما معاك → SoftScale (f649) |
| S12 Stock announcement | 689–773 | 22.97–25.77 | الجهاز رجع للستوك، (23.12–24.35)<br>والكمية محدودة. (24.55–25.59) | SRC02 @1.75s<br>SRC11 @22.02s 0.5x | رجع للستوك → MaskedReveal (f704)<br>الكمية محدودة → KeywordEmphasis (f734) |
| S13 Call to action | 773–900 | 25.77–30.00 | طلبو دابا، (25.90–26.65)<br>وما تخلّص حتى تجرّبو. (26.90–28.52) | card still SRC10 @20.3s | MACHRI → MaskedReveal (f776)<br>طلبو دابا → CTAReveal (f775)<br>جرّب قبل ما تخلّص → DirectionalSlide (f805) |

## 5. Key editing decisions

**Footage choices**
- **Hook changed after the first test render.** The obvious "open bonnet" shot (SRC06) visibly shows the red clamps *and the jump starter itself* sitting on the engine. That would reveal the solution before the problem. The hook instead holds on the dark start/stop button (SRC05, before the hand enters), with a slow push-in from frame 0. Text is already mid-reveal on frame 0, so there is no empty or black opening.
- **"Won't start" is truthful.** In the source the dashboard lights up at 9.6 s, meaning the car starts. The press is used only up to 8.93 s, then frozen and drained of colour on "ما بغاتش".
- **No global speed change.** Slow motion is used only where it is invisible or intentional: the battery close-up at 0.695× and the display close-up at 0.5× (near-static). Freezes are used for the hook, the problem beat, the defocused S04 background and the CTA card. Everything else plays at 1.0×. Source time is driven frame-exactly and can never cross into a neighbouring source shot.
- **Real demonstrations, each synced to its word:**
  - Charge ring lights on "باور".
  - Red SOS appears on "الطوارئ".
  - Hose meets the tyre valve on "للرويضات".
  - Display ring lights on "الجهاز".
- **Selective reuse.** The display close-up (SRC11) appears defocused in S04, sharp in S05 and slowed in S12. The front view (SRC10) is the S10 hero and the S13 card.

**Claims and wording**
- **4 functions, not "5-in-1".** On-screen messaging follows the approved four-function voice-over. No specs from the source title are shown (1000A, 150 PSI, "auto off"), and nothing about compatibility or capacity is claimed.
- **On-screen wording follows the brief**, e.g. "ديمارور البطارية" while the VO says "ديماغيور".
- **Stock and CTA copy.** No timers, counters, prices, phone numbers, websites or discounts were invented.

**Typography & motion**
- **Font.** Cairo (OFL), loaded locally.
- **Shaping.** RTL with `lang="ar"`. Animation is word by word, never letter by letter, so joining, shadda (تخيّل, جرّب, تخلّص), kasra (فجِهاز) and گ (گونفلور) shape correctly. Lines never wrap (`nowrap`).
- **Mask room.** Mask boxes are padded for Cairo's ascent/descent and the reveal travel is 130%, so marks and underlines never clip or linger.
- **Variants.** MaskedReveal, SoftScale (scales the whole line), DirectionalSlide (RTL direction), KeywordEmphasis (underline below the descenders, glow), NumberReveal (1→2→3→4 roll), CTAReveal (pill growth + one light sweep). There are no springs or bounces.

**Transitions**
These are varied and motivated, not one repeated wipe:
- Hard cuts on line onsets
- Freeze + impact settle (S02)
- Push (S03)
- Blur dissolve (S03→S04)
- Focus pull (S05)
- RTL wipe with an accent edge into the features (S06) and into S12
- "Blinds" stripes into the white-studio power-bank shot (S08)
- Grid collapse → hero zoom (S10)
- Card build (S13)

**Sound**
- The original MP4 audio is fully removed: the proxy is encoded without audio and every video element is muted.
- The narration is the delivered MP3, **unmodified** (no edits, no speed change), on one continuous track from frame 0.
- Eight subtle sound-design hits (impact/whoosh/swell/tick), **synthesized from code** in `scripts/make_sfx.py`, so there are no third-party samples and no licensing question. They sit about 12–20 dB under the voice.
- No music was added because no licensed track was supplied (see §7).

## 6. Verification results (final file)

**Technical**
- 1080×1920, 30/1 fps, 900 frames, 30.000 s.
- H.264 High yuv420p `tv` range, BT.709 primaries/transfer/matrix.
- AAC-LC 48 kHz stereo, 30.000 s.
- ffmpeg `blackdetect`: **0 black frames**. `freezedetect` (>1.5 s): **none**. All footage is uniformly scaled (never stretched).

**Timing (every text cue checked against its anchor word)**
- All 26 spoken-word cues begin **0–8 frames before** their word.
- They are fully settled **0.10–0.36 s after** the word onset. None is late.
- Every exit finishes before the next cut or entrance. I verified this frame-by-frame at all scene boundaries after the correction pass.
- Narration is complete: last audible audio is at 28.53 s, which matches the VO's last speech at 28.53 s.

**Audio** (`scripts/audio_qa.py`, cross-correlation against the delivered MP3)

| Check | Result |
| --- | --- |
| Narration offset | **0.0 ms** (correlation 0.987) |
| Per-channel gain | **−0.01 dB**, i.e. the original level |
| Residual after subtracting the VO, outside SFX windows | −57.6 dBFS, which is codec noise only, so the narration is untouched |
| Correlation with the product video's own soundtrack | **0.011**, i.e. absent |
| Sample peak | −1.1 dBFS (true peak −1.1 dBTP). **No clipping** |
| Loudness | −15.7 LUFS integrated, LRA 5.0 LU |

The lossless mix is exact dual-mono (L = R). There is no doubled voice, no second voice and no music masking the narration.

**Visual**
- Contact sheet (`MACHRI_CONTACT_SHEET.png`, 24 frames covering every scene) reviewed for Arabic rendering and legibility at phone size.
- Safe zones checked by overlaying the Stories/Reels top 14% band, the Reels bottom 35% band and the 4:5 feed crop. **All headlines, feature names, "4 خدمات", the CTA and "جرّب قبل ما تخلّص" sit inside the safe area** (y≈300–1240).
- Only the small brand tag at y≈1566 sits in the Reels caption band, by design as the lowest-priority element.

**Correction pass (defects found in my own renders and fixed)**

| # | Defect | Fix |
| --- | --- | --- |
| 1 | Source frames past 30 s showed the wrong content: `<Freeze>` clamps to the composition length | Source offset moved to `trimBefore` |
| 2 | Hook revealed the product (bonnet shot) | Hook switched to the start-button shot |
| 3 | SoftScale words collided and briefly exceeded the frame | Line now scales as one unit; size reduced |
| 4 | Outgoing text overlapped incoming text at seven transitions | All exits re-timed |
| 5 | Keyword underline cut through ح/ق descenders, and lingered after its word exited | Underline moved below the descenders and into the animated span; mask travel raised to 130% |
| 6 | Narration was 42.7 ms (2048 samples) late: Remotion's AAC encoder priming with no edit list | Mix exported losslessly and AAC encoded once by ffmpeg with an edit list; offset now 0.0 ms |
| 7 | VO 3 dB low per channel: ffmpeg pans mono as front-centre at −3 dB | Compensated ×√2 |
| 8 | Output flagged full-range `yuvj420p` | Rendered BT.709 limited range from PNG frames |
| 9 | Weak legibility over the bright wheel and white studio shots | Stronger headline scrim and text shadow |
| 10 | Trust line and two grid labels sat in the Reels caption zone | End card lifted and tightened; grid labels moved to the tile tops |

## 7. Unresolved issues & limitations

- **Claims to confirm before publishing.** The store must confirm that the device is genuinely back in stock, that quantity is genuinely limited, and that "pay only after trying" (جرّب قبل ما تخلّص) is a real service. The ad states these only because the approved voice-over does.
- **Source resolution.** The footage is 576×768 at ~316 kb/s. It is shown at 1.9–2.6× via a 2× Lanczos proxy with light sharpening, which is clean on phones but visibly soft on large screens. Higher-resolution product footage would be the single biggest quality upgrade.
- **Third-party badge.** The device carries an embossed manufacturer badge (visible in the S10 hero and the S13 card). I did not remove or alter it, since altering the product isn't allowed. Check that this is acceptable for the MACHRI listing.
- **No background music.** None was supplied and none can be licensed from here; the ad uses synthesized SFX only. A licensed bed can be added with one `<Html5Audio>` line in `MachriAd.tsx`, kept at least 15 dB under the voice.
- **Caption-limited framing.** Burned-in source captions forced tighter crops. The S11 wheel shot shows only the upper half of the device, including its lit display. The strongest problem-phase footage is limited (no real cold-weather or failed-start footage exists in the source), so "البرد" is conveyed by a colour-temperature shift on the real battery shot, not fabricated weather.
- **Frame-rate cadence.** The source is 25 fps in a 30 fps timeline, so frames repeat in the standard 5:6 cadence.
- **Alignment precision.** Darija word-level timing from Whisper is accurate to roughly ±50 ms. Phrase boundaries (used for all cuts) come from silence detection and are accurate to about 10 ms.
- **Safe-zone method.** Safe zones were verified against published platform guidance with overlays, not on a physical device.
- **Rebuilding the proxy.** `public/media/source_hq.mp4` (~39 MB) is generated by `npm run prepare-media` and is not committed. Run it before `npm run studio` / `npm run render`.
