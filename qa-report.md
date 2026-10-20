# MACHRI Ad — QA Report

**File:** `MACHRI_AD_FINAL.mp4` · **Verdict:** all automated hard checks pass; visual review done
scene by scene; open items needing the seller's confirmation are listed in §7.

Everything below was measured on the delivered file. The raw output of the automated suite is in
`qa/qa-output.txt` (re-run with `python3 -I tools/qa.py MACHRI_AD_FINAL.mp4 qa/contact-sheet.png`).
Visual references: `qa/contact-sheet.png` (1 frame per second, the full ad) and `qa/key-frames.png`
(one frame per scene, extracted from the MP4 with ffmpeg).

Toolchain: Remotion 4.0.537 (`@remotion/media` Video/Audio), Chrome Headless Shell 1194,
FFmpeg 6.1.1, faster-whisper 1.2.1 (`large-v3`).

## 1. Output file (ffprobe)

| Check | Result |
| --- | --- |
| Streams | 1 video + 1 audio |
| Video | H.264 High, `yuv420p`, BT.709 limited range (tagged matrix/transfer/primaries) |
| Resolution / aspect | 1080 × 1920 (9:16) |
| Frame rate | 30/1 (r and avg), 1,250 frames |
| Audio | AAC-LC 48 kHz stereo, ~189 kb/s |
| Duration | 41.685 s = voice-over 40.438 s + 1.25 s CTA hold (last word ends 40.27 s) |
| Size / bitrate | 31.5 MB, 5.8 Mb/s video |

## 2. Audio

| Check | Method | Result |
| --- | --- | --- |
| Voice-over aligned | FFT cross-correlation of output vs. `voiceover.mp3` | offset **+0.0 ms**, normalised correlation **0.9999** |
| Voice-over unaltered (no regenerate / pitch / speed change, nothing layered) | gain-matched residual (output − voice-over), first channel | gain 0.997 (−0.03 dB), residual SNR **38.0 dB** = AAC coding noise only; L = R (bit-identical), peak 0.817 vs. source 0.818, 0 clipped samples |
| Plays start to end | 0.5 s RMS windows vs. the voice-over | 80 windows, **no dropouts** |
| CTA tail | RMS after 40.44 s | −180 dBFS (digital silence) |
| **Original soundtrack absent** | locally-normalised cross-correlation of 28 one-second chunks of the source clip's audio against every position of the residual | max NCC **0.176** (threshold 0.25) |
| Detector self-test | same detector after mixing the source audio 20 dB under the voice | NCC **1.000** → a leak would have been caught |
| Footage master | ffprobe on `public/assets/footage_1080p60.webm` | **no audio stream**; additionally every `<Video>` is `muted` with `volume={0}` |

No music or SFX were added (no licensed assets were supplied); the voice-over is the only audio.

## 3. Picture

| Check | Result |
| --- | --- |
| Black frames / gaps (`blackdetect` ≥ 0.05 s, pix_th 0.06) | **none** |
| Frozen frames (`freezedetect` n = 0.0008, ≥ 0.5 s) | **none** (freeze-frames in the edit carry a slow push) |
| Every picture change on a designed edit point (scene score > 0.15, ±1 frame) | 17 changes, **all** on the 22 designed edit points (± 1 frame) — none unexpected |
| Hard cuts detected (score > 0.3) | 15: 3.83 · 6.47 · 17.13 · 19.00 · 21.87 · 22.63 · 23.20 · 24.03 · 24.60 · 28.20 · 30.67 · 31.87 · 33.47 · 35.03 · 37.53 (the mono→mono cut at 8.22 and the card swap at 25.92 score just under 0.3 and appear in the 0.15 scan; the punch-in 2.34, freeze 5.34, blur 11.19, fade 13.63 and blinds reveal 15.53 are same-image or gradual changes and are not detected as cuts, as intended) |
| First frame | graded hood shot (no black lead-in); "أخيب" is legible from frame 5 (0.17 s), "شعور..." from frame 11 |
| Last frame | complete CTA (product window, MACHRI, طلبو دابا, try-before-you-pay pill) |

## 4. Sync

All caption tokens are keyed to measured word onsets (`captions.json`); reveals start 4 frames
early. Independently measured on the rendered pixels (frame at which each lime keyword reaches
half of its final pixel count, vs. its spoken onset):

| Word | Onset | Half-visible | Offset |
| --- | --- | --- | --- |
| معطّل | 2.34 s | frame 71 | +1 frame (33 ms) |
| والو! | 5.70 s | frame 172 | +1 |
| ما بغاتش | 6.88 s | frame 207 | +1 |
| تشعل | 7.34 s | frame 221 | +1 |
| الحل | 16.46 s | frame 494 | 0 |
| 4 (أربع) | 19.80 s | frame 594 | 0 |
| 4 (هادشي) | 28.96 s | frame 869 | 0 |
| عملي | 30.66 s | frame 921 | +1 |

Words that share their moment with another accent animation (feature labels with the index
change, ضو/LED, طلبو/دابا, strikes) cannot be isolated by pixel colour; they use the same code
path and onset data. Cut points were verified against the narration: e.g. the punch-in cut lands
on "معطّل" (2.34), the freeze holds through the measured pause before "والو!" (5.34–5.70), the
reveal opens on the first word after the proverb (15.53), each feature cut sits on its spoken
label (21.88 / 23.20 / 24.60 / 25.92), the recap cuts on "العجلة" (35.04) and the CTA on "طلبو" (37.53).

## 5. Arabic text review

All on-screen strings (from `captions.json`), checked in the render at full resolution:

| Time (s) | Text |
| --- | --- |
| 0.00–1.95 | أخيب شعور... |
| 1.95–3.66 | تفيق **معطّل** / على الخدمة؟ |
| 3.83–5.30 | وتجي تشعل الطوموبيل... |
| 5.62–6.40 | **والو!** |
| 6.48–8.14 | البطارية / **ما بغاتش تشعل** |
| 9.00–13.42 | تبقى تسنّى المساعدة؟ |
| 11.40–13.42 | مصاريف ما حسبتيش ليها؟ |
| 13.55–15.52 | الوقاية / خير من العلاج |
| 16.40–17.06 | **الحل** عندك! |
| 17.13–18.94 | هاد الجهاز / كيبان **صغير...** |
| 19.00–21.76 | **4** خدمات / فمنتوج واحد |
| 21.88–28.06 | بوستر للبطارية · منفاخ للرويدات · باور بانك للطوارئ · ضو LED للطوارئ (+ BOOSTER BATTERIE / TIRE INFLATOR / EMERGENCY POWER BANK / LED EMERGENCY LIGHT) |
| 28.19–28.90 | تخيّل! |
| 28.90–30.58 | **4** خدمات. / جهاز واحد. |
| 30.66–31.80 | **عملي** وساهل |
| 31.86–33.38 | تخليه / فالطوموبيل |
| 33.45–37.42 | ~~مشكل فالبطارية~~ / ~~العجلة مفشوشة~~ |
| 37.53–end | MACHRI / **طلبو دابا** / جرّب قبل ما تخلّص |

- Shaping: joined letterforms correct throughout; shadda renders on معطّل، تسنّى، تخيّل، جرّب، تخلّص.
- Direction: every line is RTL — first word on the right, "…" and "؟/!" at the left end; the
  Latin "LED" and digits sit correctly inside RTL runs.
- Clipping: none. Every line is measured with the real font and auto-fits the safe width.
- Safe zones: all text between y = 270 and ≈1,250 px (Reels top 14 % / bottom 35 % clear),
  ≥ 72 px from the sides.
- Spelling follows Moroccan Darija as spoken (Whisper's MSA spellings corrected: مصاريف، ليها، تستافد، دابا، جرّبو، تخلّص).
- Deliberate wording differences from the audio: "ما بغاتش **تشعل**" (narrator: تعاون) and
  "الحل **عندك!**", both as specified in the brief; "جرّب" (brief) for spoken "جرّبو".

## 6. Defects found during QA and fixed

| # | Found | Fix |
| --- | --- | --- |
| 1 | "ما بغاتش تشعل" overflowed the frame at 156 px | resized; then added measured auto-fit for every line |
| 2 | Product (case + unit) faintly visible in the hook — spoiled the problem beat | tighter crop + bottom fade on the hook |
| 3 | Key-turn shot's last frame was the first dashboard frame (cut at 4.733 s, not 4.75) | segment table rebuilt from detected cuts; shot speeds adjusted; `tools/check_shots.py` added |
| 4 | Flat-tyre freeze still was pulled 1 frame past its take | re-extracted at 7.55 s |
| 5 | `@remotion/media` fell back to `<OffthreadVideo>` (no H.264 WebCodecs in this Chromium) | footage master re-encoded to VP9/WebM → native decode; time mapping verified by PSNR |
| 6 | "عملي وساهل" overflowed and clipped | resized + auto-fit |
| 7 | Cost pill overflowed the right edge (a transform-scaled line kept its natural layout width) | fitted lines now reserve their scaled box |
| 8 | Keywords became readable 67–100 ms after the spoken onset (blur reveal) | reveal lead 2 → 4 frames; measured 0–33 ms |
| 9 | 0.7 s static hold on the proverb (freezedetect) and a 0.13 s empty beat before the reveal | caption blocks drift +3 % while holding; proverb glow keeps moving; text exits into the blinds |
| 10 | Reveal scrim switched off 2 frames before its cut (17.07 s) — a brightness pop; "4" segments and battery glyph popped off | scrim spans the full shot; caption graphics fade with their caption; new QA check "every picture change sits on a designed edit point" |
| 11 | Output tagged full-range `yuvj420p` | rendered as BT.709 limited-range `yuv420p` |
| 12 | Feature cards small / CTA top-heavy / dashboard crop showed the wheel rim / "الظلام" dim too subtle | layouts enlarged and re-framed |
| 13 | With the 4-frame lead, eight captions whose first word sits on a cut became visible 1–3 frames **before** that cut, over the previous shot (e.g. "بوستر" over the "4 خدمات" shot) | those cues now start on their cut; `tools/check_shots.py` fails if any caption can appear before the cut its first word follows |

## 7. Known limitations and items for the seller

1. **Try-before-you-pay** ("جرّب قبل ما تخلّص") is shown because the supplied voice-over says it.
   The policy and its testing conditions were **not** confirmed to me — switch
   `showTryBeforePay` off in `src/Root.tsx` if they don't apply (the spoken line remains).
2. **Power bank and LED light are not demonstrated** in the supplied footage. They are presented
   as typographic cards on real product stills (the LED card points at the real light button);
   nothing is faked. B-roll that would let them be shown is listed in `edit-plan.md` §6.
3. **Resolution:** the source is 576×1024. It was upscaled (Lanczos + light sharpening, 2× motion
   interpolation for slow-motion) and grain was added; it cannot carry true 1080p detail. The
   tightest crops (hook punch-in ≈ 3.7× the source pixels, tyre valve ≈ 3.2×) are visibly softer
   than the wide shots.
4. **Third-party marks in the supplier footage:** Ford badges remain visible on the wheel caps in
   several tyre shots (the steering-wheel badge in the dashboard take is cropped out), and the car
   battery's label is legible in the battery shots. Consider this before paid distribution.
5. **No brand kit** was supplied: "MACHRI" is typeset in Cairo, not a logo; the lime accent is a
   placeholder until a brand palette exists.
6. **Darija ASR:** Whisper needed manual corrections (word boundaries and spellings), documented
   in `edit-plan.md` §1. The voice itself is untouched.
7. The Pinterest reference was reviewed through the pin's public preview video; it is not part of
   the project and was not used in the ad.
