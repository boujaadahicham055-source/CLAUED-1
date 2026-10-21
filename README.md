# MACHRI — 4-in-1 jump starter ad (Remotion)

Vertical 9:16 Facebook / Instagram performance ad for MACHRI, edited in Remotion from the
real product footage and the approved ElevenLabs Moroccan-Darija voice-over.

| Deliverable | Path |
| --- | --- |
| Final ad (1080×1920, 30 fps, H.264 + AAC) | `deliverables/MACHRI_FINAL_AD.mp4` |
| Frame-accurate speech alignment | `deliverables/audio_timeline.json` |
| Source footage inventory | `deliverables/source_shot_inventory.json` |
| Contact sheet of the final edit | `deliverables/MACHRI_CONTACT_SHEET.png` |
| Edit report (timings, decisions, QA) | `deliverables/MACHRI_EDIT_REPORT.md` |

## Project layout

```
src/
  compositions/MachriAd.tsx   master timeline: VO track, shots, typography, SFX
  components/ProductShot.tsx  caption-safe footage window, blurred extension, grades, entrances
  components/KineticText.tsx  MaskedReveal / SoftScale / DirectionalSlide / KeywordEmphasis marks,
                              NumberReveal, CTAReveal
  components/FeatureReveal.tsx  the 4-function label system (progress rail + title)
  components/ProductHero.tsx  reveal ring highlight + "4 خدمات" grid payoff
  components/CallToAction.tsx closing card, MACHRI wordmark, trust line
  data/audioTimeline.ts       measured phrase/word timings, scenes, text cues (single source of truth)
  data/shotMap.ts             source inventory + edit shot list
  styles/brand.ts             colours, type, safe zones, easing
public/
  media/source_product.mp4    original product video (audio never used)
  media/ElevenLabs_…_v4.mp3   approved voice-over (used unmodified)
  fonts/Cairo-*.ttf           Cairo, SIL OFL 1.1 (see OFL.txt)
  sfx/*.wav                   synthesized sound design (scripts/make_sfx.py)
scripts/                      media prep, still/contact-sheet QA, audio QA, analysis export
```

## Usage

```bash
npm install
npm run prepare-media     # builds public/media/source_hq.mp4 (2x Lanczos, no audio) + SFX
npm run studio            # edit / preview
npm run render            # -> deliverables/MACHRI_FINAL_AD.mp4
npm run export-analysis   # -> deliverables/audio_timeline.json, source_shot_inventory.json
```

`source_hq.mp4` (~39 MB) is generated, not committed. Timing changes go in
`src/data/audioTimeline.ts`; footage choices in `src/data/shotMap.ts`.
