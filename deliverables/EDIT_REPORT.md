# MACHRI — vertical ad · Edit report

**Final:** `MACHRI_AD_FINAL.mp4` — H.264 High, 1080×1920, 30 fps, 708 frames (23.6 s), yuv420p BT.709, AAC 48 kHz.
**Project:** `machri-ad/` (Remotion 4.0.537 · React 19 · TypeScript). Master timing file: `machri-ad/timeline.json` (copied here as `timeline.json`).
**QA:** `MACHRI_QA_CONTACT_SHEET.png` (24 frames sampled from the rendered MP4) and `machri-ad/data/qa_report.json`.

---

## 1. What was actually supplied (read this first)

| | Brief said | Actually received |
|---|---|---|
| Video | `VIDEO ADS MACHRI.mp4`, 1080×1920, ~41.685 s | `Buvaye_car_air_jump_4in1_…_Lighting_1.mp4`, **576×1024, 12.83 s** (385 frames), 30 fps, stereo AAC |
| Voice-over | ElevenLabs MP3, ~22.831 s | Matches: 22.831 s, mono 44.1 kHz |
| Brand assets | "use MACHRI identity if available" | None in the repository (it only had a README) |

Consequences:
- The footage is **10 s shorter than the narration**, so the job became the opposite of trimming. Coverage is stretched with motion-compensated slow motion (0.25×–0.96×, no frame repeats), reframes/crops, and deliberate re-use of the strongest shots in different framings. Nothing is sped up.
- Everything is **upscaled 1.875×** (Lanczos + light sharpening). It is clean, but softer than native 1080p, most visibly on the tight crops (reveal/CTA hero, light detail, stock shot).
- No logo or palette existed, so the brand is a restrained typographic **"MACHRI" wordmark** (letter-spaced Cairo Black). The lime accent comes from the motion reference, not from a MACHRI guideline; it is one token in `src/theme.ts` if a brand colour exists.

## 2. Motion reference (Pinterest)

The pin page loaded. It is a **video pin**: "Reels Editing Tutorial Clean & Minimal Style", 16.9 s. To respect "do not download or reuse the reference footage", I inspected **only its poster frame and description**. I did **not** download or watch the video. Its pacing and transitions were therefore **not** inspected; only the typography in the poster was.

What the poster shows, and what I took from it:
- Kinetic lockups centred slightly below mid-frame.
- Small white supporting words around **one oversized keyword in a lime accent with a soft glow**.
- Heavy sans-serif type over a dark, vignetted grade.

Pacing and transitions follow the brief's own direction instead (clean cuts, masked reveals, subtle push-ins).

## 3. Audio — voice-over is the master

- The ElevenLabs MP3 plays **untouched from frame 0**: no gain, no stretch, no edits.
- The original soundtrack was removed at the source. Every derived clip is encoded **without an audio track**, and every video element is also `muted`.
- No music or SFX were added, because no licensed assets were available.

**Verified on the rendered file** (`scripts/qa.py`):

| Check | Result |
|---|---|
| Output audio vs master voice-over: cross-correlation lag | **0.00 ms**, r = 0.99998 |
| Anything in the output that is not the voice-over | 46 dB below the voice (AAC codec noise only): **no source-audio leakage, no double audio** |
| Start / end | First word at 0.19 s as in the master; digital silence after the voice ends (22.83 s → 23.6 s hold) |
| Loudness | −19.0 LUFS integrated, identical to the master (the source true peak is −1.5 dBTP) |

> Loudness note: −19 LUFS is quieter than typical Reels masters (around −14). Raising it would need a limiter on the approved voice, so I did not apply one. Decide at mastering.

## 4. Timing verification (frame-accurate)

**Method** (`scripts/analyze_audio.py`):
1. **Envelope.** 10 ms RMS envelope; speech = ≥ −40 dBFS; pauses ≥ 120 ms. This gives exactly **14 speech islands for the 14 phrases**.
2. **Transcript.** A local Whisper-medium pass confirmed the content and order of every phrase (e.g. "…وطموبيلتك ما بغاتش تدماري…", "…باوربانك…", "…الجهاز رجع للستوك…").
3. **Word onsets.** Recognizer word starts were snapped to the deepest energy dip within ±120 ms.

Caveat: I cannot listen to audio, so this verification is waveform- and ASR-based. A human listening pass before publishing is recommended.

| ID | Phrase | Frames | Seconds | vs. brief's map |
|---|---|---|---|---|
| P01 | تخيّل تكون فشي بلاصة | 5–46 | 0.19–1.51 | = |
| P02 | وطوموبيلتك ما بغاتش تديماري | 54–105 | 1.82–3.48 | = (ما @f73, تديماري @f89) |
| P03 | أو الرويضة نقصات فيها الريح | 122–172 | 4.09–5.73 | = |
| P04 | مع هاد الجهاز | 186–214 | 6.23–7.12 | ≈ (brief 7.15) |
| P05 | عندك ديمارور للبطارية | 219–266 | 7.31–8.86 | = (ديمارور @f228) |
| P06 | وگونفلور للرويضات | 272–307 | 9.07–**10.22** | **ends 0.12 s earlier** than the brief's 10.34 |
| P07 | وزيد عليهم باور بانك | 320–360 | 10.67–11.97 | = (باور بانك @f341) |
| P08 | وضو ديال الطوارئ | 364–395 | 12.15–13.14 | = |
| P09 | كل هادشي فجِهاز واحد | 406–453 | 13.56–15.10 | = (فجِهاز @f426, واحد @f441) |
| P10 | تقدر تخليه ديما معاك فالطوموبيل | 462–513 | 15.40–17.09 | = |
| P11 | الجهاز رجع للستوك | 526–562 | 17.55–18.71 | = (رجع @f539) |
| P12 | والكمية محدودة | 568–601 | 18.96–20.02 | = (محدودة @f582) |
| P13 | طلبو دابا | 610–631 | 20.36–21.01 | = |
| P14 | وما تخلّص حتى تجرّبو | 636–677 | 21.22–22.56 | = |

**Caption sync** (rendered): every caption line starts **0–3 frames before its spoken word** (≤ 100 ms; the text needs ~3 frames to become legible). The one exception is the "4" of "4 خدمات", which leads "كل" by 5 frames on purpose, as a visual summary rather than a spoken word.

**Cuts:** all 12 visual cuts sit in speech pauses or exactly on a phrase onset. A frame-difference scan of the output confirms they land on the planned frames.

## 5. Footage analysis and the new edit

Scene detection found 9 source shots: S1 hands + jump starter + clamp; S2 red clamp on terminal; S3 black clamp; S4 start button; S5 dashboard; S6 hood open with a water bottle; S7 inflator on the tyre (display lit); S8 wide tyre with the device at its base; S9 device charging a phone on the console.

S1 and S2 carry a **baked-in yellow English caption** ("Tyre Inflator & Jump Starter (Power Bank)"), which also bleeds into the first 5 frames of S3.

| Comp. frames | Time | Narration | Source (frames · speed) | Framing / treatment | On-screen text |
|---|---|---|---|---|---|
| 0–49 | 0.00–1.67 | P01 | S4 111–130 · 0.40× | Driver reaches for the start button; cold "problem" grade | تخيّل / هاد الموقف |
| 50–70 | 1.67–2.37 | P02 | S5 131–145 · 0.71× | Dashboard warning lamps | — |
| 71–118 | 2.37–3.97 | P02 | S6 152–163 · 0.25× | Hood open, engine silent (bottle still; it falls later in the source, which is not used) | ما بغاتش / **تديماري!** |
| 119–190 | 3.97–6.37 | P03 | S8 245–300 · 0.78× | The tyre | الرويضة / **نقصات؟** |
| 183–215 | 6.10–7.20 | P04 | S7 crop 202–218 · 0.52× | **Reveal:** masked upward wipe with a thin accent edge; grade turns clean; pull-back on the device face | **الحل** / معاك |
| 216–241 | 7.20–8.07 | P05 | S2 54–79 · 1.0× | Red clamp; baked-in caption dissolved by a progressive bottom blur | 01/04 · **ديمارور** البطارية |
| 242–268 | 8.07–8.97 | P05 | S3 85–110 · 0.96× | Black clamp (caption-free frames only) | (same label) |
| 269–317 | 8.97–10.60 | P06 | S7 219–244 · 0.53× | Inflator on the valve, finger setting it | 02/04 · **گونفلور** للرويضات |
| 318–363 | 10.60–12.13 | P07 | S9 325–362 · 0.83× | Phone plugged in; charging indicator appears on "باور بانك" | 03/04 · **POWER BANK** |
| 364–400 | 12.13–13.37 | P08 | S9 crop 362–384 · 0.59× | Time-continuous cut-in to the **light button (bulb icon) and LED lens** | 04/04 · **ضو** الطوارئ |
| 401–431 | 13.37–14.40 | P09 | 2×2 grid of S3 / S7 / S9 / S9-crop | The four real demos in RTL order; the power tile grows to full frame on "فجِهاز واحد" | **4** / خدمات |
| 401–521 | (14.40–17.40 full frame) | P09–P10 | S9 330–384 · 0.45× | Device on the console in the car; seamless hand-off from the grid tile; slow push | فجِهاز / **واحد** → **ديما معاك** / فالطوموبيل |
| 522–605 | 17.40–20.20 | P11–P12 | S9 crop 319–384 · 0.79× | Cut-in to the device itself | رجع / **للستوك** → الكمية / **محدودة** |
| 606–707 | 20.20–23.60 | P13–P14 + hold | S7 crop 202–244 · 0.42× | Hero device face (bookends the reveal); CTA stack above the product; 1.03 s hold after the last word | MACHRI · [**طلبو دابا**] · جرّب قبل ما تخلّص |

**Rejected footage:**
- **S1 entirely:** its baked-in caption covers the device body, so it could not be cleaned without hiding the product.
- **S6 after frame 163:** the bottle falling off the engine.
- **S3 frames 80–84:** caption residue.

## 6. Motion design and typography

- **One design language.** Cairo (variable, bundled locally); white supporting words plus one lime keyword with a soft glow; soft local radial scrims instead of boxes.
- **Text motion.** Each **whole word** rises out of a mask with motion blur (13 frames, 3-frame stagger in RTL reading order) and leaves upward through the same mask (8 frames). Every exit finishes on or before the next cut, so captions never overlap each other or straddle cuts.
- **Camera and transitions.**
  - Every shot has a slow push-in; feature cuts get an 8-frame "settle".
  - The problem→solution reveal is the only wipe.
  - The grid tile expands into the next shot.
  - No flashes, spins, bounces, 3D text or emoji.
- **Counting structure.** "01 / 04 … 04 / 04" pays off in the "4 خدمات" grid and then "فجِهاز واحد".
- **CTA.** A lime pill reveals from its centre with a single emphasis beat on "دابا"; the wordmark sits above it. No price, phone number, website, warranty, delivery promise, stock counter or reviews were added.
- **Arabic rendering.**
  - Words are never split into letters, and Arabic gets no letter-spacing, so joining stays intact. Lines are `dir="rtl"`.
  - Verified at full resolution: گ in گونفلور, the **kasra in فجِهاز**, the shadda in تخيّل / جرّب / تخلّص, ئ in الطوارئ, and the Arabic question mark ؟.
- **Copy.** On-screen text follows the brief's suggested phrases. The only additions are "ديما معاك / فالطوموبيل" for Scene F, taken verbatim from the narration because the brief listed no text for that beat, and the 01–04 counters.
- **Safe areas.**
  - All essential text stays inside y 300–1250 and x 90–990, clear of the Reels/Facebook UI bands (~14 % top, ~35 % bottom, right-hand icons).
  - The small wordmark bug (y ≈ 268) is non-essential.
  - The product image itself may extend into the bottom band; that is footage, not text.

## 7. QA performed on the rendered MP4

| Check | Result |
|---|---|
| Container / format | H.264 High 1080×1920, 30 fps, **708 frames**, yuv420p **BT.709 limited range**, one AAC stream |
| Black frames (blackdetect) | **None** |
| Frozen segments ≥ 0.3 s (freezedetect) | **None** |
| Cut map | 12/12 cuts on their planned frames; the grid→full-frame hand-off differs by no more than ordinary motion |
| Audio identity / leakage | Pass (section 3) |
| Visual review | 24-frame contact sheet plus full-resolution crops of every diacritic case |

**Defects found during QA and fixed before this render:**
1. One near-black frame at the grid's first frame (f401). The tiles now land on the cut.
2. Three captions whose exits ran 1–3 frames past a cut, and "ضو الطوارئ" / "4 خدمات" ghosting into the next beat. All exits were retimed to finish by the next cut, and the light cut was moved to the exact onset of "وضو" (f364).
3. The embedded-text cover on S2 read as a blurred rectangle. It is now a full-width progressive bottom blur.
4. Stock text sat on the bright phone screen. It was moved to the dark console band.
5. A CTA accent rule read as an underlined "C" in MACHRI. It was removed, and the pill and secondary line were enlarged.
6. Output was full-range `yuvj420p`. It is now standard `yuv420p` BT.709.

Process note: the first full render attempt aborted near the end with a React error whose message was not captured. Three later full renders, including this final one, completed cleanly with full logs and no errors.

## 8. Remaining limitations — for the human reviewer

1. **Resolution.** The source is 576×1024, so tight crops are noticeably soft on large screens and acceptable on phones. Native-resolution footage (the 1080×1920 file the brief described) would be a drop-in improvement: re-run `prepare_footage.py` with new source ranges.
2. **No light demonstration exists in the footage.** The "ضو الطوارئ" beat shows the real light button and LED lens; no glow was faked. A clip of the LED on would make this beat stronger.
3. **Footage re-use is unavoidable** (12.8 s of footage for 23.6 s of voice).
   - The console scene (S9) appears in five framings: power bank, light detail, grid tile, "one device / in the car", and stock.
   - The S7 device face opens (reveal) and closes (CTA) the solution.
4. **The tyre-problem shot (S8)** already shows the device at the base of the tyre. It is the only tyre shot available.
5. **The "won't start" beat is assembled from ignition footage** (button press, warning lamps, silent engine bay) that, in the source, precedes a successful start. The successful-start moments are not used, and no failure effect was invented.
6. **Interpolated slow motion** shows mild smearing on fast finger movements (most visible in the CTA shot).
7. **Branding and rights.**
   - The device carries a small printed manufacturer mark (lower-right edge in close-ups), and the source file is named "Buvaye…". This was left untouched to preserve the product's real appearance.
   - Please confirm usage rights for this footage before publishing.
8. **Loudness** is −19 LUFS (see section 3).
9. **Verification limits.** Audio sync is verified by waveform and ASR, not by ear. The Pinterest reference was inspected from its poster frame only.

## 9. Rebuild

```bash
cd machri-ad && npm install
npm run prepare-footage     # clips from timeline.json (ffmpeg)
npm run render              # → out/MACHRI_AD_FINAL.mp4
python3 scripts/qa.py       # → contact sheet + data/qa_report.json
```
