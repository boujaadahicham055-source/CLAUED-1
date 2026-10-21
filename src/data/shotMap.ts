// Source footage inventory + the edit's shot list.
//
// Source: 576x768, 25 fps, 38.68 s (rendered from the 2x Lanczos proxy
// public/media/source_hq.mp4, which carries no audio). Coordinates below are in
// ORIGINAL source pixels (576x768). `cleanBottom` is the last source row free of
// the burned-in English captions; nothing below it is ever shown.

export type SourceShot = {
  id: string;
  start: number;
  end: number;
  description: string;
  function: string;
  captions: string | null;
  cleanBottom: number;
  quality: 'high' | 'medium' | 'low' | 'reject';
  usefulness: string;
  destination: string[];
};

export const SOURCE_SHOTS: SourceShot[] = [
  {id: 'SRC01', start: 0.0, end: 1.04, description: 'Black title card "Jump Starters".', function: 'none', captions: 'title card', cleanBottom: 0, quality: 'reject', usefulness: 'Graphic card, no product.', destination: []},
  {id: 'SRC02', start: 1.04, end: 3.24, description: 'Device close-up on dark car interior; jumper-lead plug pushed into the device (1.0-1.8 s); orange and black clamps hang beside it; display reads 0.0.', function: 'Battery booster (jump starter)', captions: '"Connect" (rows ~615-650)', cleanBottom: 600, quality: 'high', usefulness: 'Best shot of the device as a jump-starter kit.', destination: ['S06', 'S12']},
  {id: 'SRC03', start: 3.24, end: 5.4, description: 'Engine bay, battery + terminal. Clean 3.24-3.55; red clamp brought in from 3.6 and clamped on the terminal 4.0-5.4.', function: 'Battery booster (jump starter)', captions: '"Connect" / "Red clamp to the pvositive termiv +" (typo, 2 lines)', cleanBottom: 592, quality: 'high', usefulness: 'Clear, readable jump-start demonstration.', destination: ['S06', 'S10']},
  {id: 'SRC04', start: 5.4, end: 7.88, description: 'Battery close-up with label; a hand places the black clamp on the - terminal (5.6-7.3), then leaves.', function: 'Battery (problem context)', captions: '"Black clamp to the negative terminal -" (2 lines)', cleanBottom: 592, quality: 'medium', usefulness: 'Only real battery close-up; used for "old battery" + "cold".', destination: ['S03']},
  {id: 'SRC05', start: 7.88, end: 10.08, description: 'Car interior, start/stop button. Finger enters 8.2, presses 8.6-9.5; dashboard lights up from ~9.6 (car starts).', function: 'Problem: trying to start the car', captions: '"Start"', cleanBottom: 615, quality: 'high', usefulness: 'Strong hook/problem visual. Must be cut before 9.6 s so the car is not shown starting during the "won\'t start" line.', destination: ['S01', 'S02']},
  {id: 'SRC06', start: 10.08, end: 12.4, description: 'Static wide shot of an open bonnet / engine bay; small red clamps visible on the battery.', function: 'Problem context (car with bonnet open)', captions: '"Remove" from ~10.5', cleanBottom: 610, quality: 'medium', usefulness: 'Rejected for the hook: the red clamps and the jump starter itself are visible on the engine, which would reveal the solution before the problem.', destination: []},
  {id: 'SRC07', start: 12.4, end: 13.36, description: 'Black title card "Tire Inflator".', function: 'none', captions: 'title card', cleanBottom: 0, quality: 'reject', usefulness: 'Graphic card, no product.', destination: []},
  {id: 'SRC08', start: 13.36, end: 16.24, description: 'Outdoors on asphalt: hands hold the device and attach the orange hose coupler.', function: 'Tyre inflator (set-up) / portability', captions: null, cleanBottom: 768, quality: 'high', usefulness: 'Device in hand with hose.', destination: ['S07']},
  {id: 'SRC09', start: 16.24, end: 18.92, description: 'Tyre valve close-up; hand screws the hose onto the valve (16.9-18.4).', function: 'Tyre inflator', captions: null, cleanBottom: 768, quality: 'high', usefulness: 'Clearest tyre-inflation action.', destination: ['S07', 'S10']},
  {id: 'SRC10', start: 18.92, end: 21.52, description: 'Device held in hand, front view, hose attached on top, display blinking "25.0", tyre behind. Embossed manufacturer badge at the bottom.', function: 'Tyre inflator / product hero', captions: null, cleanBottom: 768, quality: 'high', usefulness: 'Cleanest full-device front view.', destination: ['S10', 'S13']},
  {id: 'SRC11', start: 21.52, end: 22.72, description: 'Angled close-up of the display: "25.0", off, then "0.00" segmented ring lights at ~22.2.', function: 'Product hero (display)', captions: null, cleanBottom: 768, quality: 'high', usefulness: 'Most premium-looking close-up; used for the reveal.', destination: ['S04', 'S05', 'S12']},
  {id: 'SRC12', start: 22.72, end: 28.2, description: 'Static: car wheel with the device standing on the ground next to it, hose connected.', function: 'Convenience / in-car context', captions: '"Wireless Inflatable Auto Off" over the lower half of the device', cleanBottom: 615, quality: 'medium', usefulness: 'Only shot of the device next to the car; 5.5 s static and repetitive, so only ~2 s used.', destination: ['S11']},
  {id: 'SRC13', start: 28.2, end: 29.04, description: 'Black title card "Charger".', function: 'none', captions: 'title card', cleanBottom: 0, quality: 'reject', usefulness: 'Graphic card, no product.', destination: []},
  {id: 'SRC14', start: 29.04, end: 32.96, description: 'White tabletop: phone plugged into the device; phone charging ring appears at ~31.5.', function: 'Power bank', captions: null, cleanBottom: 768, quality: 'high', usefulness: 'Only charging demonstration.', destination: ['S08', 'S10']},
  {id: 'SRC15', start: 32.96, end: 35.0, description: 'White tabletop: device with front white LED lit, finger on the button.', function: 'Emergency light (white)', captions: '"LED Lights" (faint grey)', cleanBottom: 610, quality: 'high', usefulness: 'Light clearly visible.', destination: ['S09', 'S10']},
  {id: 'SRC16', start: 35.0, end: 36.8, description: 'Strobe mode: LED alternates colours.', function: 'Emergency light (strobe)', captions: '"Strobe"', cleanBottom: 610, quality: 'medium', usefulness: 'Flickering; not needed.', destination: []},
  {id: 'SRC17', start: 36.8, end: 38.68, description: 'SOS mode: LED blinks red.', function: 'Emergency light (SOS)', captions: '"SOS"', cleanBottom: 610, quality: 'high', usefulness: 'Reads as "emergency" instantly.', destination: ['S09']},
];

export type Grade = {
  brightness: number;
  contrast: number;
  saturate: number;
  tint: string; // overlay colour (mix-blend-mode: soft-light)
  tintOpacity: number;
};

export const GRADES = {
  coldDark: {brightness: 0.92, contrast: 1.16, saturate: 0.62, tint: '#2B4A6B', tintOpacity: 0.55},
  tension: {brightness: 0.82, contrast: 1.12, saturate: 0.75, tint: '#2A3340', tintOpacity: 0.45},
  drained: {brightness: 0.72, contrast: 1.18, saturate: 0.12, tint: '#1B2430', tintOpacity: 0.5},
  muted: {brightness: 0.86, contrast: 1.08, saturate: 0.7, tint: '#3A3F46', tintOpacity: 0.35},
  icy: {brightness: 0.84, contrast: 1.12, saturate: 0.45, tint: '#4F8FD0', tintOpacity: 0.75},
  natural: {brightness: 1.0, contrast: 1.06, saturate: 1.06, tint: '#FFB27A', tintOpacity: 0.12},
  studio: {brightness: 0.97, contrast: 1.08, saturate: 1.04, tint: '#FFFFFF', tintOpacity: 0},
} satisfies Record<string, Grade>;

export type GradeName = keyof typeof GRADES;

export type Enter = 'none' | 'cut' | 'push' | 'impact' | 'dissolve' | 'focusPull' | 'wipe' | 'blinds' | 'zoomIn';

export type Shot = {
  id: string;
  scene: string;
  source: string; // SourceShot id
  from: number; // composition frame
  to: number;
  src: number; // source seconds at `from`
  rate?: number; // playback rate (1 = real time)
  freeze?: boolean; // hold the frame at `src`
  focus: [number, number]; // source px placed at (540, targetY)
  targetY: number;
  scale: [number, number]; // screen px per source px, start -> end (push-in)
  grade: GradeName;
  gradeTo?: {grade: GradeName; at: number; dur: number};
  blur?: number;
  enter: Enter;
  enterDur?: number;
  description: string;
};

export const SHOTS: Shot[] = [
  {id: 'sh01', scene: 'S01', source: 'SRC05', from: 0, to: 94, src: 7.96, freeze: true, focus: [330, 330], targetY: 960, scale: [1.92, 2.2], grade: 'coldDark', enter: 'none', description: 'Dark car interior, start/stop button, before the hand enters; slow cinematic push-in.'},
  {id: 'sh02', scene: 'S02', source: 'SRC05', from: 94, to: 118, src: 8.12, focus: [300, 370], targetY: 1000, scale: [2.32, 2.4], grade: 'tension', enter: 'cut', description: 'Tighter: finger reaches and presses the start button.'},
  {id: 'sh02f', scene: 'S02', source: 'SRC05', from: 118, to: 157, src: 8.933, freeze: true, focus: [300, 370], targetY: 1000, scale: [2.4, 2.62], grade: 'drained', enter: 'impact', enterDur: 8, description: 'Freeze on the press — nothing happens (cut before the dashboard lights at 9.6 s).'},
  {id: 'sh03', scene: 'S03', source: 'SRC04', from: 157, to: 262, src: 5.42, rate: 0.695, focus: [280, 440], targetY: 1000, scale: [2.05, 2.32], grade: 'muted', gradeTo: {grade: 'icy', at: 229, dur: 16}, enter: 'push', description: 'Battery close-up; temperature drop on "البرد".'},
  {id: 'sh04', scene: 'S04', source: 'SRC11', from: 262, to: 331, src: 21.62, freeze: true, focus: [235, 330], targetY: 900, scale: [2.3, 2.45], grade: 'natural', blur: 26, enter: 'dissolve', enterDur: 12, description: 'Defocused, dark product close-up: anticipation.'},
  {id: 'sh05', scene: 'S05', source: 'SRC11', from: 331, to: 365, src: 21.52, focus: [235, 320], targetY: 960, scale: [2.18, 2.3], grade: 'natural', enter: 'focusPull', enterDur: 12, description: 'Focus pull onto the real device; display ring lights on "الجهاز".'},
  {id: 'sh06a', scene: 'S06', source: 'SRC02', from: 365, to: 388, src: 1.12, focus: [240, 380], targetY: 1010, scale: [2.0, 2.1], grade: 'natural', enter: 'wipe', enterDur: 8, description: 'Jumper lead plugged into the device.'},
  {id: 'sh06b', scene: 'S06', source: 'SRC03', from: 388, to: 418, src: 3.72, focus: [300, 300], targetY: 1000, scale: [2.08, 2.2], grade: 'natural', enter: 'cut', description: 'Red clamp onto the + terminal.'},
  {id: 'sh07a', scene: 'S07', source: 'SRC08', from: 418, to: 438, src: 14.95, focus: [330, 380], targetY: 1000, scale: [1.95, 2.05], grade: 'natural', enter: 'cut', description: 'Hose coupler attached to the device.'},
  {id: 'sh07b', scene: 'S07', source: 'SRC09', from: 438, to: 464, src: 16.95, focus: [300, 360], targetY: 1000, scale: [2.0, 2.12], grade: 'natural', enter: 'cut', description: 'Hose screwed onto the tyre valve on "للرويضات".'},
  {id: 'sh08', scene: 'S08', source: 'SRC14', from: 464, to: 510, src: 30.7, focus: [300, 330], targetY: 1000, scale: [1.92, 2.02], grade: 'studio', enter: 'blinds', enterDur: 10, description: 'Phone charging from the device; ring lights on "باور".'},
  {id: 'sh09a', scene: 'S09', source: 'SRC15', from: 510, to: 533, src: 34.1, focus: [300, 360], targetY: 1000, scale: [2.05, 2.15], grade: 'studio', enter: 'cut', description: 'White LED lit.'},
  {id: 'sh09b', scene: 'S09', source: 'SRC17', from: 533, to: 556, src: 37.0, focus: [290, 370], targetY: 1000, scale: [2.15, 2.25], grade: 'studio', enter: 'cut', description: 'Red SOS mode on "الطوارئ".'},
  {id: 'sh10h', scene: 'S10', source: 'SRC10', from: 589, to: 626, src: 20.0, focus: [265, 380], targetY: 1120, scale: [1.86, 1.96], grade: 'natural', enter: 'zoomIn', enterDur: 10, description: 'One device — full front hero.'},
  {id: 'sh11', scene: 'S11', source: 'SRC12', from: 626, to: 689, src: 23.2, focus: [240, 470], targetY: 1000, scale: [1.9, 2.4], grade: 'natural', enter: 'cut', description: 'Device standing by the car wheel; push-in.'},
  {id: 'sh12a', scene: 'S12', source: 'SRC02', from: 689, to: 733, src: 1.75, focus: [240, 400], targetY: 1040, scale: [2.0, 2.1], grade: 'natural', enter: 'wipe', enterDur: 8, description: 'Device with its clamp lead.'},
  {id: 'sh12b', scene: 'S12', source: 'SRC11', from: 733, to: 773, src: 22.02, rate: 0.5, focus: [235, 320], targetY: 1040, scale: [2.1, 2.2], grade: 'natural', enter: 'cut', description: 'Display ring lights (0.5x; near-static close-up).'},
];

// 2x2 grid for "4 خدمات" (S10, frames 556-589)
export const GRID_TILES = [
  {id: 'tile1', source: 'SRC03', src: 4.0, focus: [300, 300] as [number, number], scale: 1.05, label: 'ديمارور'},
  {id: 'tile2', source: 'SRC09', src: 17.3, focus: [300, 360] as [number, number], scale: 1.0, label: 'گونفلور'},
  {id: 'tile3', source: 'SRC14', src: 31.6, focus: [260, 380] as [number, number], scale: 0.95, label: 'باور بانك'},
  {id: 'tile4', source: 'SRC15', src: 33.3, focus: [290, 350] as [number, number], scale: 1.05, label: 'ضو الطوارئ'},
];

// Final card (S13) uses a still of the cleanest front view.
export const CTA_PRODUCT = {source: 'SRC10', src: 20.3, focus: [262, 360] as [number, number]};

export const sourceShot = (id: string) => {
  const s = SOURCE_SHOTS.find((x) => x.id === id);
  if (!s) {
    throw new Error(`Unknown source shot ${id}`);
  }
  return s;
};
