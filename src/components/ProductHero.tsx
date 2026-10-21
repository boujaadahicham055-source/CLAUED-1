import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GRADES, GRID_TILES, type Shot, sourceShot} from '../data/shotMap';
import {COLORS, EASE, FONT, WIDTH} from '../styles/brand';
import {Footage, gradeFilter, shotPoint} from './ProductShot';

const ease = (f: number, d: number, e = EASE.out) => interpolate(f, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

/**
 * Restrained highlight for the product reveal: a thin accent ring draws around
 * the device display, tracking the shot's push-in. Rendered inside the shot's
 * <Sequence>, so frames are shot-local.
 */
export const RingHighlight: React.FC<{shot: Shot; center: [number, number]; radius: number; inAt: number; outAt: number}> = ({shot, center, radius, inAt, outAt}) => {
  const f = useCurrentFrame();
  const {x, y, scale} = shotPoint(shot, f, center);
  const r = radius * scale;
  const draw = ease(f - inAt, 14);
  const fade = 1 - ease(f - outAt, 8, EASE.in);
  if (draw <= 0 || fade <= 0) {
    return null;
  }
  const c = 2 * Math.PI * r;
  const size = r * 2 + 40;
  return (
    <svg width={size} height={size} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, overflow: 'visible', opacity: fade}}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS.accent} strokeWidth={4} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - draw)} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{filter: `drop-shadow(0 0 10px ${COLORS.accent})`}} />
      <circle cx={size / 2} cy={size / 2} r={r + 14} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray={c} strokeDashoffset={c * (1 - draw * 0.92)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </svg>
  );
};

const TILE_W = 500;
const TILE_H = 390;
const GAP = 20;
const GRID_TOP = 742;
const tileRect = (i: number) => {
  // RTL reading order: top-right, top-left, bottom-right, bottom-left
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = WIDTH / 2 + (col === 0 ? GAP / 2 : -GAP / 2 - TILE_W);
  const y = GRID_TOP + row * (TILE_H + GAP);
  return {x, y};
};
const GRID_CX = WIDTH / 2;
const GRID_CY = GRID_TOP + TILE_H + GAP / 2;

/**
 * "أربع خدمات" payoff: the four real demonstrations land one by one in a 2x2
 * grid, then converge to the centre as the single-device hero takes over.
 * Frames are local to the S10 sequence (0 = comp frame 556).
 */
export const FourInOneGrid: React.FC<{collapseAt: number}> = ({collapseAt}) => {
  const f = useCurrentFrame();
  const bgIn = ease(f, 5);
  const collapse = ease(f - collapseAt, 10, EASE.in);
  const bgOpacity = bgIn * (1 - ease(f - collapseAt - 2, 8, EASE.inOut));

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{backgroundColor: COLORS.bg, opacity: bgOpacity}} />
      <AbsoluteFill style={{background: `radial-gradient(60% 40% at 50% 62%, ${COLORS.accent}22 0%, rgba(0,0,0,0) 70%)`, opacity: bgOpacity}} />
      {GRID_TILES.map((t, i) => {
        const appear = ease(f - 1 - i * 3, 10);
        if (appear <= 0) {
          return null;
        }
        const {x, y} = tileRect(i);
        const cx = x + TILE_W / 2;
        const cy = y + TILE_H / 2;
        const dx = (GRID_CX - cx) * 0.75 * collapse;
        const dy = (GRID_CY - cy) * 0.75 * collapse;
        const s = (0.86 + 0.14 * appear) * (1 - 0.5 * collapse);
        const src = sourceShot(t.source);
        const time = t.src + f / 30;
        return (
          <div
            key={t.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: TILE_W,
              height: TILE_H,
              borderRadius: 28,
              overflow: 'hidden',
              opacity: appear * (1 - collapse),
              transform: `translate(${dx}px, ${dy + (1 - appear) * 36}px) scale(${s})`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
              border: '1.5px solid rgba(255,255,255,0.16)',
              backgroundColor: '#111',
            }}
          >
            <Footage time={time} focus={t.focus} scale={t.scale} centerX={TILE_W / 2} centerY={TILE_H / 2} cleanBottom={src.cleanBottom} fitWidth={TILE_W} feather={{top: 0, bottom: 0}} filter={gradeFilter(GRADES.natural)} />
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))'}} />
            <div
              lang="ar"
              style={{position: 'absolute', right: 22, bottom: 14, direction: 'rtl', fontFamily: FONT, fontWeight: 800, fontSize: 38, lineHeight: 1.4, color: '#fff', display: 'flex', alignItems: 'center', gap: 12}}
            >
              <span style={{width: 12, height: 12, borderRadius: 6, background: COLORS.accent, boxShadow: `0 0 12px ${COLORS.accent}`}} />
              {t.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
