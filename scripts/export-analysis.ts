// Writes deliverables/audio_timeline.json and deliverables/source_shot_inventory.json from
// the same data modules the composition renders from, so they cannot drift.
// usage: npm run export-analysis
import {writeFileSync, mkdirSync} from 'node:fs';
import {CUES, COMPOSITION_FRAMES, PHRASES, SCENES, VO, toFrame} from '../src/data/audioTimeline';
import {GRID_TILES, CTA_PRODUCT, SHOTS, SOURCE_SHOTS} from '../src/data/shotMap';
import {FPS} from '../src/styles/brand';

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const sceneOfPhrase = (id: string) => SCENES.find((s) => s.phrases.includes(id))!;

const audioTimeline = {
  master: {
    file: VO.file.replace('media/', ''),
    duration_s: VO.durationS,
    codec: 'mp3, 44.1 kHz mono, 128 kb/s',
    speech_start_s: VO.speechStartS,
    speech_end_s: VO.speechEndS,
    note: 'Original ElevenLabs file, used unmodified as one continuous track from frame 0.',
  },
  composition: {fps: FPS, frames: COMPOSITION_FRAMES, duration_s: COMPOSITION_FRAMES / FPS, final_hold_s: round(COMPOSITION_FRAMES / FPS - VO.speechEndS, 2)},
  method: [
    'Phrase boundaries: ffmpeg silencedetect (noise=-40dB, d=0.12s) on the MP3; cross-checked at -35 dB (identical within 30 ms).',
    'Word onsets: faster-whisper large-v3-turbo (word_timestamps, language=ar), refined to the nearest 10 ms RMS-envelope minimum where a clear dip exists.',
    'Manual check: waveform plot with every word marker; all 18 phrases and their words line up with the energy envelope.',
    'Frames = round(seconds x 30).',
  ],
  segments: PHRASES.map((p) => {
    const scene = sceneOfPhrase(p.id);
    const cues = CUES.filter((c) => c.scene === scene.id);
    return {
      id: p.id,
      phrase: p.text,
      start_s: p.start,
      end_s: p.end,
      start_frame: toFrame(p.start),
      end_frame: toFrame(p.end),
      words: p.words.map((w) => ({word: w.w, start_s: w.s, frame: toFrame(w.s)})),
      scene: scene.id,
      planned_visual: scene.visual,
      planned_on_screen_text: cues.map((c) => c.text),
    };
  }),
  scenes: SCENES.map((s) => ({
    id: s.id,
    name: s.name,
    emotional_phase: s.phase,
    start_frame: s.from,
    end_frame: s.to,
    start_s: round(s.from / FPS),
    end_s: round(s.to / FPS),
    phrases: s.phrases,
    planned_visual: s.visual,
    shots: SHOTS.filter((sh) => sh.scene === s.id).map((sh) => ({id: sh.id, source: sh.source, frames: [sh.from, sh.to], source_in_s: sh.src, speed: sh.freeze ? 'freeze' : sh.rate ?? 1, entrance: sh.enter})),
    on_screen_text: CUES.filter((c) => c.scene === s.id).map((c) => ({
      id: c.id,
      text: c.text,
      locked_to: c.anchor,
      in_frame: c.in,
      in_s: round(c.in / FPS),
      out_frame: c.out >= 99999 ? null : c.out,
      animation_in: c.variant,
      animation_out: c.exit,
    })),
  })),
};

const used = (id: string) => [
  ...SHOTS.filter((s) => s.source === id).map((s) => `${s.scene}/${s.id} @${s.src}s${s.freeze ? ' (freeze)' : s.rate && s.rate !== 1 ? ` (${s.rate}x)` : ''}`),
  ...GRID_TILES.filter((t) => t.source === id).map((t) => `S10/${t.id} @${t.src}s`),
  ...(CTA_PRODUCT.source === id ? [`S13/card still @${CTA_PRODUCT.src}s`] : []),
];

const inventory = {
  source: {
    original_upload_name: '998d899c-______________________________________5____1_Portable_Car_Battery_Jump_Starter_with_Air_Compressor_1000A_150PSI_Peak_Jump_Starter_Battery_Pack_12V_Jumper_Starter_Box____________________.mp4',
    note: 'The Arabic part of the filename arrived replaced by underscores; it is the "... 5 في 1 Portable Car Battery Jump Starter ..." clip. Saved in the project as public/media/source_product.mp4 (byte-identical, md5 08e7cb0a37b4e98d55a1afe142ec11fe).',
    resolution: '576x768 (3:4)',
    fps: 25,
    duration_s: 38.68,
    video: 'H.264, ~316 kb/s',
    audio: 'AAC stereo 44.1 kHz — fully removed from the edit (proxy encoded with -an, every <OffthreadVideo> muted)',
    embedded_graphics: 'Three black title cards (Jump Starters / Tire Inflator / Charger) and burned-in English captions in the lower band (rows ~600-700, incl. typo "pvositive termiv"). Embossed manufacturer badge on the device body.',
    scene_cuts_s: [1.04, 3.24, 5.4, 7.88, 10.08, 12.4, 13.36, 16.24, 18.92, 21.52, 22.72, 28.2, 29.04, 32.96],
  },
  shots: SOURCE_SHOTS.map((s) => ({
    id: s.id,
    source_start_s: s.start,
    source_end_s: s.end,
    visual_description: s.description,
    product_function: s.function,
    burned_in_captions: s.captions,
    clean_rows: s.cleanBottom ? `0-${s.cleanBottom}` : null,
    quality: s.quality,
    usefulness: s.usefulness,
    suggested_destination: s.destination,
    used_in_edit: used(s.id),
  })),
};

mkdirSync('deliverables', {recursive: true});
writeFileSync('deliverables/audio_timeline.json', JSON.stringify(audioTimeline, null, 2) + '\n');
writeFileSync('deliverables/source_shot_inventory.json', JSON.stringify(inventory, null, 2) + '\n');
console.log('wrote deliverables/audio_timeline.json, deliverables/source_shot_inventory.json');
