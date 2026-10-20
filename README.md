# CLAUED-1 — MACHRI 4-in-1 jump starter ad (Remotion)

Moroccan Darija vertical ad (1080×1920, 30 fps, H.264/AAC, 41.7 s) for the MACHRI portable
jump starter / tyre inflator / power bank / LED light, built with Remotion + React + TypeScript.

| Deliverable | Path |
| --- | --- |
| Finished ad | `MACHRI_AD_FINAL.mp4` |
| Caption & narration timing (editable) | `captions.json` |
| Scene breakdown with real timestamps | `edit-plan.md` |
| Render + quality verification | `qa-report.md` |
| Remotion source | `src/` |

## Run

```bash
npm install
npm run studio      # preview / edit in Remotion Studio
npm run render      # -> MACHRI_AD_FINAL.mp4
python3 -I tools/qa.py MACHRI_AD_FINAL.mp4 out/contact-sheet.png   # automated QA
```

`remotion.config.ts` points Remotion at the Chrome Headless Shell installed in the build
container; on another machine delete that line (or set `REMOTION_BROWSER`) and Remotion
downloads its own browser.

## Editing

- **Captions:** edit `captions.json` (`cues[]`): text, `at` (spoken onset, seconds), `style`,
  `size`, `y`, `strikeAt`. Lines auto-shrink to the safe width. After re-timing the voice-over,
  regenerate the narration block with `python3 -I tools/sync_narration.py` (it also warns when a
  token's `at` is far from any measured word onset).
- **Cuts:** `src/data/edit.ts` → `SHOTS` (source in-point, speed, framing, grade) and `SCENES`.
  Check them with `python3 -I tools/check_shots.py` (every shot inside one source take, no
  overlaps, no caption visible before the cut its first word sits on).
- **Try-before-you-pay line:** `showTryBeforePay` in `src/Root.tsx` (on by default because the
  voice-over says it — switch off if the policy is not confirmed).

## Layout

```
src/
  ProductAd.tsx          root composition (voice-over + scenes + grain/vignette)
  scenes/                HookScene, ProblemScene, FrustrationScene, SolutionReveal,
                         ProductHero (ProductIntro, ValueScene), FeatureShowcase, RecapScene, FinalCTA
  components/            KineticCaption, Footage (ShotClip/StillFrame), Graphics (Pill, HighlightRing,
                         Segments, icons), Overlays, Timing
  data/edit.ts           shot list + scene boundaries
  debug/TimingProbe.tsx  QA composition for trim / playback-rate verification
public/
  assets/voiceover.mp3   ElevenLabs voice-over (unaltered)
  assets/footage_1080p60.webm   silent, interpolated, upscaled master (tools/prepare-footage.sh)
  stills/ grain/ fonts/  freeze-frames, procedural grain, Cairo (OFL)
assets-src/source.mp4    original supplier clip (has audio — never referenced by the composition)
tools/                   ASR, timeline refinement, footage prep, still/probe renderers, QA
```
