// Master timeline. The ElevenLabs voice-over is the clock for everything.
//
// Phrase start/end: ffmpeg silencedetect (-40 dB, 120 ms) on the MP3.
// Word onsets: faster-whisper large-v3-turbo word timestamps, refined against
// the 10 ms RMS envelope where a clear energy dip exists (see report).
// All times in seconds of the original, unmodified MP3.

import {FPS} from '../styles/brand';

export const VO = {
  file: 'media/ElevenLabs_2026-10-21T22_27_52_CHAREF MARKETING_gen_sp100_s50_sb75_v4.mp3',
  durationS: 28.760813,
  speechStartS: 0.09,
  speechEndS: 28.52,
};

// 30.0 s: full voice-over + ~1.5 s hold on the final card.
export const COMPOSITION_FRAMES = 900;

export const toFrame = (s: number) => Math.round(s * FPS);

export type Word = {w: string; s: number};
export type Phrase = {id: string; text: string; start: number; end: number; words: Word[]};

export const PHRASES: Phrase[] = [
  {id: 'P01', text: 'تخيل تفيق الصباح،', start: 0.09, end: 1.2, words: [{w: 'تخيل', s: 0.09}, {w: 'تفيق', s: 0.47}, {w: 'الصباح', s: 0.68}]},
  {id: 'P02', text: 'عندك خدمة ضرورية،', start: 1.42, end: 2.88, words: [{w: 'عندك', s: 1.42}, {w: 'خدمة', s: 1.72}, {w: 'ضرورية', s: 2.09}]},
  {id: 'P03', text: 'وتلقى الطوموبيل ما بغاتش تديماري.', start: 3.21, end: 5.08, words: [{w: 'وتلقى', s: 3.21}, {w: 'الطوموبيل', s: 3.61}, {w: 'ما', s: 3.95}, {w: 'بغاتش', s: 4.14}, {w: 'تديماري', s: 4.49}]},
  {id: 'P04', text: 'خصوصاً إلا كانت البطارية قديمة،', start: 5.36, end: 7.36, words: [{w: 'خصوصاً', s: 5.36}, {w: 'إلا', s: 6.0}, {w: 'كانت', s: 6.18}, {w: 'البطارية', s: 6.41}, {w: 'قديمة', s: 6.96}]},
  {id: 'P05', text: 'وزاد عليها البرد.', start: 7.68, end: 8.65, words: [{w: 'وزاد', s: 7.68}, {w: 'عليها', s: 8.03}, {w: 'البرد', s: 8.33}]},
  {id: 'P06', text: 'علاش تبقى متقلق من هاد المواقف؟', start: 9.0, end: 10.83, words: [{w: 'علاش', s: 9.0}, {w: 'تبقى', s: 9.27}, {w: 'متقلق', s: 9.6}, {w: 'من', s: 9.95}, {w: 'هاد', s: 10.06}, {w: 'المواقف', s: 10.23}]},
  {id: 'P07', text: 'مع هاد الجهاز،', start: 11.11, end: 12.03, words: [{w: 'مع', s: 11.11}, {w: 'هاد', s: 11.18}, {w: 'الجهاز', s: 11.49}]},
  {id: 'P08', text: 'عندك ديماغيور للبطارية،', start: 12.22, end: 13.78, words: [{w: 'عندك', s: 12.22}, {w: 'ديماغيور', s: 12.5}, {w: 'للبطارية', s: 13.02}]},
  {id: 'P09', text: 'وگونفلور للرويضات.', start: 13.99, end: 15.32, words: [{w: 'وگونفلور', s: 13.99}, {w: 'للرويضات', s: 14.63}]},
  {id: 'P10', text: 'وزيد عليهم باور بانك،', start: 15.59, end: 16.88, words: [{w: 'وزيد', s: 15.59}, {w: 'عليهم', s: 15.85}, {w: 'باور', s: 16.27}, {w: 'بانك', s: 16.55}]},
  {id: 'P11', text: 'وحتى ضو ديال الطوارئ.', start: 17.09, end: 18.36, words: [{w: 'وحتى', s: 17.09}, {w: 'ضو', s: 17.4}, {w: 'ديال', s: 17.55}, {w: 'الطوارئ', s: 17.85}]},
  {id: 'P12', text: 'أربع خدمات', start: 18.62, end: 19.53, words: [{w: 'أربع', s: 18.62}, {w: 'خدمات', s: 18.85}]},
  {id: 'P13', text: 'فجِهاز واحد!', start: 19.73, end: 20.65, words: [{w: 'فجِهاز', s: 19.73}, {w: 'واحد', s: 20.19}]},
  {id: 'P14', text: 'تقدر تخليه ديما معاك فالطوموبيل.', start: 20.96, end: 22.85, words: [{w: 'تقدر', s: 20.96}, {w: 'تخليه', s: 21.24}, {w: 'ديما', s: 21.72}, {w: 'معاك', s: 22.03}, {w: 'فالطوموبيل', s: 22.3}]},
  {id: 'P15', text: 'الجهاز رجع للستوك،', start: 23.12, end: 24.35, words: [{w: 'الجهاز', s: 23.12}, {w: 'رجع', s: 23.58}, {w: 'للستوك', s: 23.92}]},
  {id: 'P16', text: 'والكمية محدودة.', start: 24.55, end: 25.59, words: [{w: 'والكمية', s: 24.55}, {w: 'محدودة', s: 25.12}]},
  {id: 'P17', text: 'طلبو دابا،', start: 25.9, end: 26.65, words: [{w: 'طلبو', s: 25.9}, {w: 'دابا', s: 26.26}]},
  {id: 'P18', text: 'وما تخلّص حتى تجرّبو.', start: 26.9, end: 28.52, words: [{w: 'وما', s: 26.9}, {w: 'تخلّص', s: 27.09}, {w: 'حتى', s: 27.74}, {w: 'تجرّبو', s: 27.93}]},
];

export type Scene = {
  id: string;
  name: string;
  phase: 'Suspense' | 'Concern' | 'Relief' | 'Discovery' | 'Confidence' | 'Urgency' | 'Reassurance';
  from: number; // frame (inclusive)
  to: number; // frame (exclusive)
  phrases: string[];
  visual: string;
};

// Every scene cut sits in a measured silence, 2-8 frames before the next line.
export const SCENES: Scene[] = [
  {id: 'S01', name: 'The hook', phase: 'Suspense', from: 0, to: 94, phrases: ['P01', 'P02'], visual: 'Dark car interior on the start/stop button (held frame before the hand enters), cool low-key grade, slow push-in from frame 0.'},
  {id: 'S02', name: 'The problem', phase: 'Concern', from: 94, to: 157, phrases: ['P03'], visual: 'Finger presses the start button; freeze + desaturate on "ما بغاتش" (taken before the dashboard lights up in the source).'},
  {id: 'S03', name: 'Old battery & cold', phase: 'Concern', from: 157, to: 262, phrases: ['P04', 'P05'], visual: 'Battery close-up (0.70x, continuous); grade drifts to an icy tone on "وزاد عليها البرد".'},
  {id: 'S04', name: 'The emotional turn', phase: 'Relief', from: 262, to: 331, phrases: ['P06'], visual: 'Type-led beat over a defocused, dark still of the product close-up — anticipation before the reveal.'},
  {id: 'S05', name: 'Product reveal', phase: 'Relief', from: 331, to: 365, phrases: ['P07'], visual: 'Focus pull onto the real device close-up; ring highlight as the display lights.'},
  {id: 'S06', name: 'Battery booster', phase: 'Discovery', from: 365, to: 418, phrases: ['P08'], visual: 'Clamp lead plugged into the device, then red clamp onto the + terminal.'},
  {id: 'S07', name: 'Tyre inflator', phase: 'Discovery', from: 418, to: 464, phrases: ['P09'], visual: 'Hose screwed onto the tyre valve, then the device in hand with the hose attached.'},
  {id: 'S08', name: 'Power bank', phase: 'Discovery', from: 464, to: 510, phrases: ['P10'], visual: 'Phone plugged into the device; charging ring lights on "باور".'},
  {id: 'S09', name: 'Emergency light', phase: 'Discovery', from: 510, to: 556, phrases: ['P11'], visual: 'White LED lit, then red SOS mode on "الطوارئ".'},
  {id: 'S10', name: '4-in-1 payoff', phase: 'Discovery', from: 556, to: 626, phrases: ['P12', 'P13'], visual: '2x2 grid of the four demos with a dominant "4", collapsing into the single-device hero.'},
  {id: 'S11', name: 'Convenience', phase: 'Confidence', from: 626, to: 689, phrases: ['P14'], visual: 'Device standing next to the car wheel; slow push-in.'},
  {id: 'S12', name: 'Stock announcement', phase: 'Urgency', from: 689, to: 773, phrases: ['P15', 'P16'], visual: 'Device with its clamp lead, then display close-up. No timers or counters.'},
  {id: 'S13', name: 'Call to action', phase: 'Reassurance', from: 773, to: 900, phrases: ['P17', 'P18'], visual: 'Product card + MACHRI wordmark + CTA, held ~1.5 s after the last word.'},
];

export type CueVariant = 'MaskedReveal' | 'SoftScale' | 'DirectionalSlide' | 'KeywordEmphasis' | 'NumberReveal' | 'CTAReveal' | 'FeatureReveal';

export type Cue = {
  id: string;
  scene: string;
  text: string;
  anchor: string; // spoken word the cue is locked to
  in: number; // frame the entrance starts
  out: number; // frame the exit starts (exit lasts DUR.out unless noted)
  variant: CueVariant;
  exit: string;
};

// Entrances start 0-8 frames before the anchor word so the text has settled
// while the word is heard. Exits (7 f + 1 f per word) finish before the next
// cut or the next entrance, so two lines never share the headline zone.
export const CUES: Cue[] = [
  {id: 'T01a', scene: 'S01', text: 'تخيّل', anchor: 'تخيل @0.09', in: -4, out: 86, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T01b', scene: 'S01', text: 'هاد الموقف', anchor: 'تفيق @0.47', in: 6, out: 86, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T01c', scene: 'S01', text: 'عندك خدمة ضرورية…', anchor: 'عندك @1.42', in: 40, out: 84, variant: 'DirectionalSlide', exit: 'fade + slide'},
  {id: 'T02a', scene: 'S02', text: 'وتلقى الطوموبيل', anchor: 'وتلقى @3.21', in: 95, out: 147, variant: 'DirectionalSlide', exit: 'fade'},
  {id: 'T02b', scene: 'S02', text: 'ما بغاتش تديماري!', anchor: 'ما @3.95', in: 116, out: 147, variant: 'SoftScale', exit: 'scale-down fade'},
  {id: 'T03a', scene: 'S03', text: 'خصوصاً إلا كانت', anchor: 'خصوصاً @5.36', in: 159, out: 220, variant: 'DirectionalSlide', exit: 'fade'},
  {id: 'T03b', scene: 'S03', text: 'البطارية قديمة؟', anchor: 'البطارية @6.41', in: 189, out: 220, variant: 'KeywordEmphasis', exit: 'mask out upward'},
  {id: 'T03c', scene: 'S03', text: 'وزاد عليها', anchor: 'وزاد @7.68', in: 228, out: 256, variant: 'DirectionalSlide', exit: 'fade'},
  {id: 'T03d', scene: 'S03', text: 'البرد!', anchor: 'البرد @8.33', in: 247, out: 256, variant: 'KeywordEmphasis', exit: 'blur out with the dissolve'},
  {id: 'T04a', scene: 'S04', text: 'علاش', anchor: 'علاش @9.00', in: 268, out: 322, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T04b', scene: 'S04', text: 'تبقى متقلق؟', anchor: 'تبقى @9.27 / متقلق @9.60', in: 278, out: 322, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T05', scene: 'S05', text: 'مع هاد الجهاز', anchor: 'مع @11.11', in: 332, out: 356, variant: 'DirectionalSlide', exit: 'fade'},
  {id: 'T06', scene: 'S06', text: 'ديمارور البطارية', anchor: 'ديماغيور @12.50', in: 372, out: 409, variant: 'FeatureReveal', exit: 'mask out upward'},
  {id: 'T07', scene: 'S07', text: 'گونفلور للرويضات', anchor: 'وگونفلور @13.99', in: 418, out: 455, variant: 'FeatureReveal', exit: 'mask out upward'},
  {id: 'T08', scene: 'S08', text: 'POWER BANK', anchor: 'باور @16.27', in: 484, out: 501, variant: 'FeatureReveal', exit: 'mask out upward'},
  {id: 'T09', scene: 'S09', text: 'ضو الطوارئ', anchor: 'ضو @17.40', in: 519, out: 546, variant: 'FeatureReveal', exit: 'mask out upward'},
  {id: 'T10a', scene: 'S10', text: '4', anchor: 'أربع @18.62', in: 557, out: 582, variant: 'NumberReveal', exit: 'slide up + fade'},
  {id: 'T10b', scene: 'S10', text: 'خدمات', anchor: 'خدمات @18.85', in: 563, out: 582, variant: 'MaskedReveal', exit: 'slide up + fade'},
  {id: 'T10c', scene: 'S10', text: 'فجِهاز', anchor: 'فجِهاز @19.73', in: 590, out: 617, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T10d', scene: 'S10', text: 'واحد', anchor: 'واحد @20.19', in: 603, out: 617, variant: 'KeywordEmphasis', exit: 'mask out upward'},
  {id: 'T11a', scene: 'S11', text: 'تقدر تخليه', anchor: 'تقدر @20.96', in: 627, out: 679, variant: 'DirectionalSlide', exit: 'fade'},
  {id: 'T11b', scene: 'S11', text: 'ديما معاك', anchor: 'ديما @21.72', in: 649, out: 679, variant: 'SoftScale', exit: 'scale-down fade'},
  {id: 'T12a', scene: 'S12', text: 'رجع للستوك', anchor: 'رجع @23.58', in: 704, out: 764, variant: 'MaskedReveal', exit: 'mask out upward'},
  {id: 'T12b', scene: 'S12', text: 'الكمية محدودة', anchor: 'والكمية @24.55', in: 734, out: 764, variant: 'KeywordEmphasis', exit: 'mask out upward'},
  {id: 'T13w', scene: 'S13', text: 'MACHRI', anchor: 'scene start', in: 776, out: 99999, variant: 'MaskedReveal', exit: 'holds to end'},
  {id: 'T13a', scene: 'S13', text: 'طلبو دابا', anchor: 'طلبو @25.90', in: 775, out: 99999, variant: 'CTAReveal', exit: 'holds to end'},
  {id: 'T13b', scene: 'S13', text: 'جرّب قبل ما تخلّص', anchor: 'وما @26.90', in: 805, out: 99999, variant: 'DirectionalSlide', exit: 'holds to end'},
];

export const cue = (id: string): Cue => {
  const c = CUES.find((x) => x.id === id);
  if (!c) {
    throw new Error(`Unknown cue ${id}`);
  }
  return c;
};
