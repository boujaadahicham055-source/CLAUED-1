import captionsJson from '../../captions.json';
import type {TokenStyleName} from '../theme';
import {sec} from '../theme';

// ---------------------------------------------------------------------------
// Captions (captions.json at the repo root is the editable source of truth)
// ---------------------------------------------------------------------------

export type Token = {
  text: string;
  at: number;
  style: TokenStyleName;
  size?: number;
  strikeAt?: number;
};

export type Cue = {
  id: string;
  scene: string;
  kind: 'kinetic' | 'pill' | 'feature' | 'cta';
  in: number;
  out: number;
  y?: number;
  icon?: 'clock' | 'receipt';
  moveAt?: number;
  moveToY?: number;
  index?: number;
  latin?: string;
  brand?: {text: string; at: number};
  lines: Token[][];
};

export const CUES = captionsJson.cues as unknown as Cue[];

export const cue = (id: string): Cue => {
  const found = CUES.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown cue "${id}" — check captions.json`);
  }
  return found;
};

// ---------------------------------------------------------------------------
// Timeline. All times in seconds on the voice-over clock.
// Scene boundaries sit on measured pauses / word onsets (see edit-plan.md).
// ---------------------------------------------------------------------------

export const VOICEOVER_SECONDS = 40.4375;
export const END_SECONDS = 41.67; // last word ends 40.27 s -> ~1.4 s CTA hold
export const TOTAL_FRAMES = sec(END_SECONDS);

export const SCENES = {
  hook: [0, 3.83],
  battery: [3.83, 8.22],
  frustration: [8.22, 13.63],
  prevention: [13.63, 15.53],
  reveal: [15.53, 17.13],
  compact: [17.13, 19.01],
  fourServices: [19.01, 21.88],
  features: [21.88, 28.19],
  oneDevice: [28.19, 30.66],
  practical: [30.66, 31.86],
  inTheCar: [31.86, 33.45],
  recap: [33.45, 37.53],
  cta: [37.53, END_SECONDS],
} as const satisfies Record<string, readonly [number, number]>;

export type Grade = 'mono' | 'monoDeep' | 'natural' | 'hero';

export type Focus = {x: number; y: number};

/**
 * One cut of source footage. `src` is a time in the original 14.9 s clip, `rate` the
 * playback speed (< 1 = slow motion, rendered from the 60 fps interpolated master).
 * `focus` is the point of the source frame (0-1) kept centred; `zoom` is relative to
 * a plain cover-fit and animates from the first to the second value.
 */
export type Shot = {
  id: string;
  from: number;
  to: number;
  src: number;
  rate: number;
  focus: Focus;
  zoom: [number, number];
  grade: Grade;
  note: string;
};

const shot = (s: Shot) => s;

export const SHOTS = {
  // A — hook: hood-open breakdown, desaturated; jump-zoom on "معطّل"
  hookWide: shot({id: 'A1', from: 0, to: 2.34, src: 5.24, rate: 0.3, focus: {x: 0.8, y: 0.3}, zoom: [1.45, 1.52], grade: 'mono', note: 'Hood-open car (crop + bottom fade keep the product out of the problem beat)'}),
  hookPunch: shot({id: 'A2', from: 2.34, to: 3.83, src: 5.9333, rate: 0.22, focus: {x: 0.66, y: 0.22}, zoom: [1.95, 2.0], grade: 'mono', note: 'Punch-in on the open hood, cut on "معطّل"'}),
  // B — battery problem
  keyTurn: shot({id: 'B1', from: 3.83, to: 5.34, src: 4.1, rate: 0.4, focus: {x: 0.5, y: 0.62}, zoom: [1.22, 1.3], grade: 'mono', note: 'Ignition key turn, cropped below the instrument cluster'}),
  battery: shot({id: 'B3', from: 6.48, to: 8.22, src: 2.47, rate: 0.42, focus: {x: 0.22, y: 0.38}, zoom: [1.45, 1.52], grade: 'mono', note: 'Car battery close-up'}),
  // C — frustration
  flatTire: shot({id: 'C1', from: 8.22, to: 11.19, src: 6.31, rate: 0.43, focus: {x: 0.5, y: 0.5}, zoom: [1.05, 1.12], grade: 'mono', note: 'Hand on a soft tyre — stranded'}),
  // D — solution
  reveal: shot({id: 'D2', from: 15.53, to: 17.13, src: 7.62, rate: 0.72, focus: {x: 0.5, y: 0.62}, zoom: [1.0, 1.06], grade: 'hero', note: 'Product reveal: hand-held unit, display lit'}),
  compact: shot({id: 'D3', from: 17.13, to: 19.01, src: 9.47, rate: 0.6, focus: {x: 0.6, y: 0.6}, zoom: [1.0, 1.05], grade: 'natural', note: 'Unit next to the wheel — shows its size'}),
  fourServices: shot({id: 'D4', from: 19.01, to: 21.88, src: 0.0, rate: 0.45, focus: {x: 0.42, y: 0.7}, zoom: [1.0, 1.06], grade: 'natural', note: 'Unit front with jump leads plugged in'}),
  // E — features (01, 02 have real demonstrations; 03, 04 are cards)
  boosterClamp: shot({id: 'E1a', from: 21.88, to: 22.62, src: 3.15, rate: 1.0, focus: {x: 0.3, y: 0.45}, zoom: [1.12, 1.16], grade: 'natural', note: 'Clamps on the battery'}),
  boosterDash: shot({id: 'E1b', from: 22.62, to: 23.2, src: 4.77, rate: 0.75, focus: {x: 0.5, y: 0.35}, zoom: [1.5, 1.56], grade: 'natural', note: 'Instrument cluster lights up — the car starts'}),
  inflatorGauge: shot({id: 'E2a', from: 23.2, to: 24.02, src: 8.8, rate: 0.78, focus: {x: 0.45, y: 0.55}, zoom: [1.08, 1.12], grade: 'natural', note: 'Hose on the valve, pressure reading on the display'}),
  inflatorWheel: shot({id: 'E2b', from: 24.02, to: 24.6, src: 10.58, rate: 1.0, focus: {x: 0.62, y: 0.62}, zoom: [1.2, 1.24], grade: 'natural', note: 'Unit inflating the tyre'}),
  // F — value
  oneDevice: shot({id: 'F1', from: 28.19, to: 30.66, src: 11.17, rate: 0.74, focus: {x: 0.5, y: 0.5}, zoom: [1.0, 1.06], grade: 'natural', note: 'Unit on grass inflating a ball'}),
  practical: shot({id: 'F2a', from: 30.66, to: 31.86, src: 13.04, rate: 0.83, focus: {x: 0.5, y: 0.55}, zoom: [1.0, 1.04], grade: 'natural', note: 'Unit inflating a football (ends before the burned-in arrow at 14.1 s)'}),
  inTheCar: shot({id: 'F2b', from: 31.86, to: 33.45, src: 5.24, rate: 0.65, focus: {x: 0.45, y: 0.5}, zoom: [1.45, 1.52], grade: 'natural', note: 'Same hood as the hook — now in colour, unit and case in the engine bay'}),
  recapBattery: shot({id: 'F3a', from: 33.45, to: 35.04, src: 1.31, rate: 0.7, focus: {x: 0.5, y: 0.45}, zoom: [1.05, 1.1], grade: 'natural', note: 'Jump lead plugged into the unit'}),
  recapTire: shot({id: 'F3b', from: 35.04, to: 37.53, src: 9.6, rate: 0.45, focus: {x: 0.45, y: 0.36}, zoom: [1.6, 1.7], grade: 'natural', note: 'Hose on the tyre valve, tight'}),
  // G — CTA product window
  cta: shot({id: 'G', from: 37.53, to: END_SECONDS, src: 7.62, rate: 0.27, focus: {x: 0.47, y: 0.6}, zoom: [1.05, 1.12], grade: 'hero', note: 'Hand-held unit, slow'}),
};

// Source-clip boundaries (seconds): ffmpeg scene-cut detection on the original clip.
// Ranges run from a shot's first frame to its last frame (30 fps source).
// Every shot's displayed source range must stay inside one of these.
export const SOURCE_SEGMENTS: Array<[number, number, string]> = [
  [0.0, 2.4333, 'device front, rotated to the rear at ~1.35 s, lead plugged in'],
  [2.4663, 3.867, 'clamps onto battery'],
  [4.0997, 4.6997, 'ignition key'],
  [4.733, 5.1997, 'instrument cluster lights up'],
  [5.233, 6.2663, 'hood open, unit in engine bay'],
  [6.2997, 7.5663, 'hand on soft tyre'],
  [7.5997, 8.7663, 'hand-held unit, hose'],
  [8.7997, 9.433, 'pressure reading at valve'],
  [9.4663, 11.133, 'unit inflating tyre'],
  [11.1663, 13.0, 'ball on grass'],
  [13.033, 14.05, 'football (clean; burned-in arrow from ~14.1 s)'],
];

export const shotSourceEnd = (s: Shot) => s.src + (s.to - s.from) * s.rate;
