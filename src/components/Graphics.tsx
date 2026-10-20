import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {Cue} from '../data/edit';
import {COLORS, EASE_IN_OUT, EASE_OUT, FPS} from '../theme';
import {KineticToken, TokenLine, useCueExit, useReveal} from './KineticCaption';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const STROKE = {fill: 'none', stroke: COLORS.accent, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round'} as const;

export const ClockIcon: React.FC<{size?: number}> = ({size = 64}) => {
  const frame = useCurrentFrame();
  const minute = frame * 6; // slow sweep: one turn per 2 s
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="25" {...STROKE} />
      <line x1="32" y1="32" x2="32" y2="18" {...STROKE} transform={`rotate(${minute} 32 32)`} />
      <line x1="32" y1="32" x2="42" y2="32" {...STROKE} transform={`rotate(${minute / 12} 32 32)`} />
    </svg>
  );
};

export const ReceiptIcon: React.FC<{size?: number}> = ({size = 64}) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M16 8 H48 V56 L42 51 L36 56 L30 51 L24 56 L16 51 Z" {...STROKE} />
    <line x1="23" y1="21" x2="41" y2="21" {...STROKE} />
    <line x1="23" y1="31" x2="41" y2="31" {...STROKE} />
    <line x1="23" y1="41" x2="33" y2="41" {...STROKE} />
  </svg>
);

export const CheckIcon: React.FC<{size?: number; color?: string}> = ({size = 48, color = COLORS.ink}) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path d="M10 25 L20 34 L38 14" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Empty-battery glyph; the last cell blinks out at `at`. */
export const BatteryEmpty: React.FC<{at: number; size?: number}> = ({at, size = 150}) => {
  const frame = useCurrentFrame();
  const {p, opacity} = useReveal(at, 10);
  const t = frame - at * FPS;
  // cell: on -> flicker -> off, all after the reveal
  const cell = t < 6 ? 1 : t < 9 ? 0.25 : t < 12 ? 0.9 : interpolate(t, [12, 20], [0.9, 0], clamp);
  return (
    <svg
      width={size}
      height={size * 0.56}
      viewBox="0 0 150 84"
      style={{opacity, transform: `translateY(${(1 - p) * 24}px)`, overflow: 'visible'}}
    >
      <rect x="4" y="6" width="128" height="72" rx="14" fill="none" stroke={COLORS.white} strokeWidth="6" />
      <rect x="136" y="28" width="10" height="28" rx="4" fill={COLORS.white} />
      <rect x="16" y="18" width="22" height="48" rx="6" fill={COLORS.accent} opacity={cell} />
    </svg>
  );
};

/** Glass notification pill (problem beats). */
export const Pill: React.FC<{cue: Cue}> = ({cue: c}) => {
  const frame = useCurrentFrame();
  const exit = useCueExit(c);
  const inF = Math.round(c.in * FPS);
  if (frame < inF || frame >= Math.round(c.out * FPS)) {
    return null;
  }
  const enter = interpolate(frame - inF, [0, 12], [0, 1], {...clamp, easing: EASE_OUT});
  const move =
    c.moveAt === undefined
      ? 0
      : interpolate(frame - c.moveAt * FPS, [0, 12], [0, 1], {...clamp, easing: EASE_IN_OUT});
  const y = (c.y ?? 900) + ((c.moveToY ?? c.y ?? 900) - (c.y ?? 900)) * move;
  const Icon = c.icon === 'receipt' ? ReceiptIcon : ClockIcon;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          top: y,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          transform: `translateY(calc(-50% + ${(1 - enter) * 40}px)) scale(${(0.94 + 0.06 * enter) * (1 - 0.08 * move)})`,
          opacity: enter * (1 - 0.45 * move) * (1 - exit),
          filter: exit > 0.02 ? `blur(${exit * 8}px)` : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            direction: 'rtl',
            gap: 32,
            padding: '30px 52px 34px 58px',
            borderRadius: 999,
            backgroundColor: 'rgba(20, 21, 24, 0.78)',
            border: `2px solid ${COLORS.hairline}`,
            boxShadow: '0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 999,
              backgroundColor: 'rgba(212, 255, 60, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={70} />
          </div>
          <TokenLine
            tokens={c.lines[0]}
            gap={20}
            maxWidth={700}
            render={(tok) => <KineticToken tok={tok} shadow={false} />}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Accent ring drawn around a real product detail (no fake effects). */
export const HighlightRing: React.FC<{x: number; y: number; r: number; at: number; until?: number}> = ({
  x,
  y,
  r,
  at,
  until,
}) => {
  const frame = useCurrentFrame();
  const t = frame - at * FPS;
  if (t < 0) {
    return null;
  }
  const draw = interpolate(t, [0, 14], [0, 1], {...clamp, easing: EASE_OUT});
  const out = until === undefined ? 0 : interpolate(frame - until * FPS, [-6, 0], [0, 1], clamp);
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={r * 2 + 40}
      height={r * 2 + 40}
      style={{position: 'absolute', left: x - r - 20, top: y - r - 20, opacity: 1 - out, overflow: 'visible'}}
    >
      <circle
        cx={r + 20}
        cy={r + 20}
        r={r}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={5}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - draw)}
        strokeLinecap="round"
        transform={`rotate(${-90 - 40 * (1 - draw)} ${r + 20} ${r + 20})`}
        style={{filter: 'drop-shadow(0 0 14px rgba(212,255,60,0.35))'}}
      />
    </svg>
  );
};

/** Four-segment counter used for "4 خدمات" and the feature showcase progress. */
export const Segments: React.FC<{
  count?: number;
  filledAt: number[];
  activeIndex?: number;
  width?: number;
  height?: number;
  gap?: number;
}> = ({count = 4, filledAt, activeIndex, width = 70, height = 8, gap = 12}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'row', direction: 'rtl', gap}}>
      {Array.from({length: count}, (_, i) => {
        const fill = interpolate(frame - filledAt[i] * FPS, [0, 8], [0, 1], {...clamp, easing: EASE_OUT});
        const isActive = activeIndex === undefined || activeIndex === i;
        return (
          <div
            key={i}
            style={{
              width,
              height,
              borderRadius: 999,
              backgroundColor: 'rgba(245,245,242,0.22)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${fill * 100}%`,
                backgroundColor: isActive ? COLORS.accent : COLORS.white,
                opacity: isActive ? 1 : 0.55,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
