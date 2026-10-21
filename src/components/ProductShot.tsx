import React from 'react';
import {AbsoluteFill, Freeze, OffthreadVideo, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {GRADES, type Grade, type Shot, sourceShot} from '../data/shotMap';
import {COLORS, EASE, FPS, HEIGHT, WIDTH} from '../styles/brand';

// 2x Lanczos proxy of the product video, audio stripped (scripts/prepare-media.sh).
export const PROXY_SRC = staticFile('media/source_hq.mp4');
export const SRC_W = 576;
export const SRC_H = 768;
const SOURCE_FPS = 25;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Source time shown at a shot-local frame. Never crosses into a neighbouring source shot. */
export const sourceTimeAt = (shot: Shot, localFrame: number) => {
  const s = sourceShot(shot.source);
  const raw = shot.freeze ? shot.src : shot.src + (localFrame * (shot.rate ?? 1)) / FPS;
  return clamp(raw, s.start + 1 / SOURCE_FPS, s.end - 1.5 / SOURCE_FPS);
};

export const mixGrade = (a: Grade, b: Grade, t: number): Grade => ({
  brightness: a.brightness + (b.brightness - a.brightness) * t,
  contrast: a.contrast + (b.contrast - a.contrast) * t,
  saturate: a.saturate + (b.saturate - a.saturate) * t,
  tint: t < 0.5 ? a.tint : b.tint,
  tintOpacity: t < 0.5 ? a.tintOpacity * (1 - 2 * t) : b.tintOpacity * (2 * t - 1),
});

export const gradeFilter = (g: Grade) => `brightness(${g.brightness}) contrast(${g.contrast}) saturate(${g.saturate})`;

/**
 * One frame of the source at `time` seconds. The source offset goes into
 * `trimBefore` and the child is frozen at its local frame 0: this gives
 * frame-exact control over speed ramps, freezes and shot limits while
 * <OffthreadVideo> still extracts the real decoded frame. (Putting the offset
 * in <Freeze frame> instead fails past 30 s: Freeze clamps to the
 * composition's duration.)
 */
export const SourceFrame: React.FC<{time: number; style?: React.CSSProperties}> = ({time, style}) => (
  <Freeze frame={0}>
    <OffthreadVideo src={PROXY_SRC} muted trimBefore={Math.round(time * FPS)} style={style} />
  </Freeze>
);

type FootageProps = {
  time: number;
  focus: [number, number];
  scale: number;
  centerX?: number;
  centerY: number;
  cleanBottom: number;
  filter?: string;
  feather?: {top: number; bottom: number};
  fitWidth?: number; // keep the window covering this width (px), centred on centerX
};

/**
 * The source cropped to its caption-free rows, scaled about a focus point.
 * Rows below `cleanBottom` (burned-in captions) are never rendered.
 */
/** Where the cropped source window lands on screen (shared with overlays that track the product). */
export const footagePlacement = (focus: [number, number], scale: number, centerY: number, centerX = WIDTH / 2, fitWidth = WIDTH) => {
  const winW = SRC_W * scale;
  const minLeft = centerX + fitWidth / 2 - winW;
  const maxLeft = centerX - fitWidth / 2;
  const left = winW >= fitWidth ? clamp(centerX - focus[0] * scale, minLeft, maxLeft) : centerX - winW / 2;
  const top = centerY - focus[1] * scale;
  return {left, top, winW};
};

/** Screen position of a source pixel for a shot at a shot-local frame. */
export const shotPoint = (shot: Shot, localFrame: number, p: [number, number]) => {
  const progress = clamp(localFrame / (shot.to - shot.from), 0, 1);
  const scale = interpolate(progress, [0, 1], shot.scale, {easing: EASE.inOut});
  const {left, top} = footagePlacement(shot.focus, scale, shot.targetY);
  return {x: left + p[0] * scale, y: top + p[1] * scale, scale};
};

export const Footage: React.FC<FootageProps> = ({time, focus, scale, centerX = WIDTH / 2, centerY, cleanBottom, filter, feather = {top: 0.1, bottom: 0.12}, fitWidth = WIDTH}) => {
  const {left, top, winW} = footagePlacement(focus, scale, centerY, centerX, fitWidth);
  const winH = cleanBottom * scale;
  const mask = `linear-gradient(to bottom, transparent 0%, #000 ${feather.top * 100}%, #000 ${100 - feather.bottom * 100}%, transparent 100%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: winW,
        height: winH,
        overflow: 'hidden',
        WebkitMaskImage: mask,
        maskImage: mask,
      }}
    >
      <SourceFrame time={time} style={{width: winW, height: SRC_H * scale, display: 'block', filter}} />
    </div>
  );
};

/** Full-frame blurred extension of the same shot, rendered small and scaled up (cheap blur). */
export const BlurredBackdrop: React.FC<{time: number; cleanBottom: number; filter: string; dim?: number}> = ({time, cleanBottom, filter, dim = 0.42}) => {
  const k = 4;
  const scale = (Math.max(WIDTH / SRC_W, HEIGHT / cleanBottom) * 1.1) / k;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: WIDTH / k, height: HEIGHT / k, transform: `scale(${k})`, transformOrigin: '0 0'}}>
        <Footage
          time={time}
          focus={[SRC_W / 2, cleanBottom / 2]}
          scale={scale}
          centerX={WIDTH / k / 2}
          centerY={HEIGHT / k / 2}
          cleanBottom={cleanBottom}
          fitWidth={WIDTH / k}
          feather={{top: 0, bottom: 0}}
          filter={`${filter} blur(9px) brightness(${dim})`}
        />
      </div>
    </AbsoluteFill>
  );
};

const enterStyle = (shot: Shot, f: number): React.CSSProperties => {
  const d = shot.enterDur ?? 8;
  const p = interpolate(f, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  switch (shot.enter) {
    case 'push':
      return {transform: `scale(${1.07 - 0.07 * p})`};
    case 'impact': {
      const settle = interpolate(f, [0, d], [1.045, 1], {extrapolateRight: 'clamp', easing: EASE.out});
      return {transform: `scale(${settle})`};
    }
    case 'dissolve':
      return {opacity: p};
    case 'focusPull':
      return {filter: `blur(${(1 - p) * 22}px) brightness(${0.55 + 0.45 * p})`, transform: `scale(${1.05 - 0.05 * p})`};
    case 'wipe':
      // RTL: new image enters from the right edge and travels left
      return {clipPath: `inset(0 0 0 ${(1 - p) * 100}%)`};
    case 'blinds': {
      const n = 6;
      const w = 100 / n;
      const pts: string[] = [];
      for (let i = 0; i < n; i++) {
        const local = interpolate(f, [i * 1.2, i * 1.2 + d - 4], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
        const x0 = 100 - (i + 1) * w; // right-to-left order
        const x1 = 100 - i * w;
        pts.push(`${x1}% 0%`, `${x1}% ${local}%`, `${x0}% ${local}%`, `${x0}% 0%`);
      }
      return {clipPath: `polygon(${pts.join(', ')})`};
    }
    case 'zoomIn':
      return {opacity: p, transform: `scale(${0.62 + 0.38 * p})`, borderRadius: `${(1 - p) * 60}px`, overflow: 'hidden'};
    default:
      return {};
  }
};

export const WipeEdge: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const d = shot.enterDur ?? 8;
  if (shot.enter !== 'wipe' || f > d) {
    return null;
  }
  const p = interpolate(f, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  const x = (1 - p) * WIDTH;
  return <div style={{position: 'absolute', top: 0, bottom: 0, left: x - 3, width: 6, background: COLORS.accent, boxShadow: `0 0 30px 6px ${COLORS.accent}88`, opacity: 1 - p * 0.6}} />;
};

/** A shot of the edit: blurred extension + sharp caption-free window, graded, with its entrance. */
export const ProductShot: React.FC<{shot: Shot}> = ({shot}) => {
  const f = useCurrentFrame();
  const len = shot.to - shot.from;
  const src = sourceShot(shot.source);
  const time = sourceTimeAt(shot, f);
  const progress = clamp(f / len, 0, 1);
  const scale = interpolate(progress, [0, 1], shot.scale, {easing: EASE.inOut});

  let grade = GRADES[shot.grade];
  if (shot.gradeTo) {
    const t = interpolate(shot.from + f, [shot.gradeTo.at, shot.gradeTo.at + shot.gradeTo.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
    grade = mixGrade(grade, GRADES[shot.gradeTo.grade], t);
  }
  const filter = gradeFilter(grade) + (shot.blur ? ` blur(${shot.blur}px)` : '');
  const outer = enterStyle(shot, f);

  return (
    <>
      <AbsoluteFill style={{...outer, backgroundColor: COLORS.bg}}>
        <BlurredBackdrop time={time} cleanBottom={src.cleanBottom} filter={gradeFilter(grade)} dim={shot.blur ? 0.3 : 0.42} />
        <Footage time={time} focus={shot.focus} scale={scale} centerY={shot.targetY} cleanBottom={src.cleanBottom} filter={filter} />
        <AbsoluteFill style={{backgroundColor: grade.tint, opacity: grade.tintOpacity, mixBlendMode: 'soft-light'}} />
      </AbsoluteFill>
      <WipeEdge shot={shot} />
    </>
  );
};
