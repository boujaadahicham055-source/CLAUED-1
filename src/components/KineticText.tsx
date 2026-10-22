import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, DUR, EASE, FONT, WIDTH} from '../styles/brand';

// Arabic is animated word by word, never letter by letter, so contextual
// shaping (joined letter forms, shadda, kasra) is never broken.

export type Variant = 'MaskedReveal' | 'SoftScale' | 'DirectionalSlide';

export type Mark = {
  word: number;
  type: 'underline' | 'strike' | 'glow';
  color: string;
  at: number; // absolute frame
};

export type KineticTextProps = {
  text: string;
  inAt: number;
  outAt: number;
  variant: Variant;
  size: number;
  y: number; // vertical centre of the line
  x?: number; // horizontal centre
  weight?: 500 | 700 | 800 | 900;
  color?: string;
  wordColors?: Record<number, string>;
  wordIn?: number[]; // per-word entrance frames (overrides stagger)
  stagger?: number;
  dir?: 'rtl' | 'ltr';
  letterSpacing?: number;
  glow?: string;
  marks?: Mark[];
  inDur?: number;
  outDur?: number;
  outVariant?: 'mask' | 'fade';
};

const ease = (f: number, d: number, e = EASE.out) => interpolate(f, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

// Room for Cairo's tall ascenders/marks inside a clipping mask (see report).
const MASK_PAD = {top: 0.12, bottom: 0.24, side: 0.08};

const WordMark: React.FC<{mark: Mark; frame: number}> = ({mark, frame}) => {
  const p = ease(frame - mark.at, 9);
  if (p <= 0) {
    return null;
  }
  if (mark.type === 'glow') {
    return null;
  }
  const isStrike = mark.type === 'strike';
  return (
    <span
      style={{
        position: 'absolute',
        right: 0,
        left: 0,
        // below Arabic descenders (ح ق ي reach ~0.35em under the baseline)
        bottom: isStrike ? undefined : '-0.17em',
        top: isStrike ? '0.78em' : undefined,
        height: isStrike ? '0.075em' : '0.085em',
        borderRadius: '0.05em',
        background: mark.color,
        transform: `scaleX(${p})`,
        transformOrigin: 'right center',
        boxShadow: `0 0 0.25em ${mark.color}66`,
      }}
    />
  );
};

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  inAt,
  outAt,
  variant,
  size,
  y,
  x = WIDTH / 2,
  weight = 900,
  color = COLORS.ink,
  wordColors = {},
  wordIn,
  stagger = 3,
  dir = 'rtl',
  letterSpacing = 0,
  glow,
  marks = [],
  inDur = DUR.in,
  outDur = DUR.out,
  outVariant,
}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  if (frame < Math.min(inAt, wordIn?.[0] ?? inAt) || frame > outAt + outDur + 2) {
    return null;
  }
  const exitMode = outVariant ?? (variant === 'MaskedReveal' ? 'mask' : 'fade');
  // SoftScale scales the whole line as one unit (per-word scaling makes neighbours collide).
  const firstIn = wordIn?.[0] ?? inAt;
  const lineScale =
    variant === 'SoftScale' ? 1.08 - 0.08 * ease(frame - firstIn, inDur) - 0.05 * ease(frame - outAt, outDur, EASE.in) : 1;

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x - WIDTH / 2,
        width: WIDTH,
        transform: `translateY(-50%) scale(${lineScale})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        direction: dir,
        gap: `${dir === 'rtl' ? 0.24 : 0.28}em`,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.42,
        whiteSpace: 'nowrap',
        letterSpacing,
        color,
      }}
      lang={dir === 'rtl' ? 'ar' : 'en'}
    >
      {words.map((w, i) => {
        const start = wordIn?.[i] ?? inAt + i * stagger;
        const fi = frame - start;
        const fo = frame - (outAt + i * 1);
        const pin = ease(fi, inDur);
        const pout = ease(fo, outDur, EASE.in);
        const wColor = wordColors[i] ?? color;
        const wordGlow = marks.find((m) => m.word === i && m.type === 'glow');
        const glowAmt = wordGlow ? ease(frame - wordGlow.at, 10) : 0;
        const shadow = [
          glow ? `0 0 0.3em ${glow}` : null,
          wordGlow && glowAmt > 0 ? `0 0 ${0.18 + 0.25 * glowAmt}em ${wordGlow.color}` : null,
          '0 0.03em 0.22em rgba(0,0,0,0.7)',
        ]
          .filter(Boolean)
          .join(', ');

        let inner: React.CSSProperties = {};
        let wrap: React.CSSProperties = {};
        if (variant === 'MaskedReveal') {
          // 130% clears the mask including the underline that sits under the descenders
          const yIn = (1 - pin) * 130;
          const yOut = exitMode === 'mask' ? -pout * 130 : 0;
          inner = {transform: `translateY(${fi < 0 ? 130 : yIn + yOut}%)`, opacity: exitMode === 'fade' ? 1 - pout : 1};
          wrap = {overflow: 'hidden', padding: `${MASK_PAD.top}em ${MASK_PAD.side}em ${MASK_PAD.bottom}em`, margin: `-${MASK_PAD.top}em -${MASK_PAD.side}em -${MASK_PAD.bottom}em`};
        } else if (variant === 'SoftScale') {
          inner = {opacity: fi < 0 ? 0 : pin * (1 - pout), filter: `blur(${(1 - pin) * 10 + pout * 6}px)`};
          wrap = {padding: `${MASK_PAD.top}em ${MASK_PAD.side}em ${MASK_PAD.bottom}em`, margin: `-${MASK_PAD.top}em -${MASK_PAD.side}em -${MASK_PAD.bottom}em`};
        } else {
          const sign = dir === 'rtl' ? 1 : -1;
          const dx = sign * (1 - pin) * 0.55 - sign * pout * 0.3;
          inner = {transform: `translateX(${dx}em)`, opacity: fi < 0 ? 0 : pin * (1 - pout)};
          wrap = {padding: `${MASK_PAD.top}em ${MASK_PAD.side}em ${MASK_PAD.bottom}em`, margin: `-${MASK_PAD.top}em -${MASK_PAD.side}em -${MASK_PAD.bottom}em`};
        }

        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', ...wrap}}>
            <span style={{position: 'relative', display: 'inline-block', color: wColor, textShadow: shadow, ...inner}}>
              {w}
              {marks
                .filter((m) => m.word === i && m.type !== 'glow')
                .map((m, k) => (
                  <WordMark key={k} mark={m} frame={frame} />
                ))}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** "4": digits roll 1→2→3→4 inside a mask and land with a soft settle. */
export const NumberReveal: React.FC<{
  inAt: number;
  outAt: number;
  size: number;
  x: number;
  y: number;
  color?: string;
  to?: number;
}> = ({inAt, outAt, size, x, y, color = COLORS.accent, to = 4}) => {
  const frame = useCurrentFrame();
  if (frame < inAt || frame > outAt + DUR.out + 2) {
    return null;
  }
  const digits = Array.from({length: to}, (_, i) => String(i + 1));
  const roll = interpolate(frame - inAt, [0, 13], [0, to - 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  const settle = interpolate(frame - inAt, [8, 20], [1.08, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.soft});
  const out = ease(frame - outAt, DUR.out, EASE.in);
  const cell = size * 1.05;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${-out * 0.35 * size}px) scale(${settle})`,
        opacity: 1 - out,
        height: cell,
        overflow: 'hidden',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize: size,
        lineHeight: `${cell}px`,
        color,
        textShadow: `0 0 0.12em ${color}88`,
      }}
    >
      <div style={{transform: `translateY(${-roll * cell}px)`}}>
        {digits.map((d) => (
          <div key={d} style={{height: cell, textAlign: 'center'}}>
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Primary CTA pill: grows from its centre, label rises in, one light sweep, then holds. */
export const CTAReveal: React.FC<{
  text: string;
  inAt: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  sweepAt?: number;
}> = ({text, inAt, y, width, height, fontSize, sweepAt}) => {
  const frame = useCurrentFrame();
  if (frame < inAt) {
    return null;
  }
  const grow = ease(frame - inAt, 10);
  const label = ease(frame - inAt - 4, 10);
  const sweep = sweepAt === undefined ? -1 : interpolate(frame - sweepAt, [0, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.inOut});
  const side = (1 - grow) * 50;
  return (
    <div
      style={{
        position: 'absolute',
        left: (WIDTH - width) / 2,
        top: y - height / 2,
        width,
        height,
        borderRadius: height / 2,
        clipPath: `inset(0 ${side}% 0 ${side}% round ${height / 2}px)`,
        background: `linear-gradient(180deg, ${COLORS.accent} 0%, ${COLORS.accentDeep} 100%)`,
        boxShadow: `0 18px 50px ${COLORS.accent}55, inset 0 2px 0 rgba(255,255,255,0.28)`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{overflow: 'hidden', padding: '0.1em 0.1em 0.2em', direction: 'rtl'}} lang="ar">
        <div
          style={{
            transform: `translateY(${(1 - label) * 110}%)`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize,
            lineHeight: 1.35,
            color: '#FFFFFF',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      </div>
      {sweep > 0 && sweep < 1 ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: width * 0.35,
            right: `${-35 + sweep * 135}%`,
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%)',
            transform: 'skewX(-18deg)',
          }}
        />
      ) : null}
    </div>
  );
};
