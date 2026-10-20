import {measureText} from '@remotion/layout-utils';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, continueRender, delayRender, interpolate, useCurrentFrame} from 'remotion';
import type {Cue, Token} from '../data/edit';
import {fontsReady} from '../fonts';
import {
  COLORS,
  EASE_IN,
  EASE_OUT,
  FONT_FAMILY,
  FPS,
  SAFE,
  TEXT_SHADOW,
  TOKEN_STYLES,
  WIDTH,
} from '../theme';

/**
 * True once the bundled Cairo faces are loaded. Holds the frame (delayRender) until the
 * fitted layout has been committed, so widths are never measured with a fallback font.
 */
const useFontsReady = () => {
  const [handle] = useState(() => delayRender('Measuring caption widths'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    fontsReady.then(() => alive && setReady(true));
    return () => {
      alive = false;
      continueRender(handle);
    };
  }, [handle]);
  useEffect(() => {
    if (ready) {
      continueRender(handle);
    }
  }, [ready, handle]);
  return ready;
};

const measureToken = (tok: Token) =>
  measureText({
    text: tok.text,
    fontFamily: FONT_FAMILY,
    fontSize: tokenSize(tok),
    fontWeight: String(TOKEN_STYLES[tok.style].weight),
    validateFontIsLoaded: true,
  }).width;

/**
 * Reveals start this many frames before the spoken onset so the word reads as "landed"
 * on its first syllable (measured on the render: half-visible at +0..+1 frame).
 */
export const LEAD_FRAMES = 4;
const EXIT_FRAMES = 6;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const tokenSize = (tok: Token) => tok.size ?? TOKEN_STYLES[tok.style].size;

/** Enter progress of a token (0 -> 1), eased. */
export const useReveal = (at: number, frames = 10) => {
  const frame = useCurrentFrame();
  const t = frame - (at * FPS - LEAD_FRAMES);
  return {
    t,
    p: interpolate(t, [0, frames], [0, 1], {...clamp, easing: EASE_OUT}),
    opacity: interpolate(t, [0, 5], [0, 1], clamp),
  };
};

export const KineticToken: React.FC<{tok: Token; color?: string; shadow?: boolean}> = ({
  tok,
  color,
  shadow = true,
}) => {
  const frame = useCurrentFrame();
  const st = TOKEN_STYLES[tok.style];
  const size = tokenSize(tok);
  const impact = st.reveal === 'impact';
  const {p, opacity} = useReveal(tok.at, impact ? 9 : 11);

  const y = impact ? 0 : (1 - p) * size * 0.24;
  const scale = impact ? 1.16 - 0.16 * p : 1;
  const blur = (1 - p) * (impact ? 16 : 10);

  const strike =
    tok.strikeAt === undefined
      ? 0
      : interpolate(frame - tok.strikeAt * FPS, [0, 9], [0, 1], {...clamp, easing: EASE_OUT});
  const dim = interpolate(strike, [0.4, 1], [1, 0.5], clamp);

  return (
    <span
      style={{
        display: 'inline-block',
        position: 'relative',
        fontFamily: FONT_FAMILY,
        fontSize: size,
        fontWeight: st.weight,
        lineHeight: 1.18,
        color: color ?? st.color,
        whiteSpace: 'nowrap',
        opacity: opacity * dim,
        transform: `translateY(${y}px) scale(${scale})`,
        filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
        textShadow: shadow ? TEXT_SHADOW : undefined,
      }}
    >
      {tok.text}
      {tok.strikeAt === undefined ? null : (
        <span
          style={{
            position: 'absolute',
            right: -size * 0.04,
            top: '55%',
            height: Math.max(6, size * 0.075),
            width: `calc(${strike * 100}% + ${strike * size * 0.08}px)`,
            backgroundColor: COLORS.accent,
            borderRadius: 999,
            transform: 'translateY(-50%)',
            boxShadow: '0 4px 18px rgba(0,0,0,0.35)',
          }}
        />
      )}
    </span>
  );
};

/**
 * One RTL line of tokens. If the fully revealed line would exceed `maxWidth`, it is
 * scaled down to fit (sizes in captions.json are a design intent, not a guarantee).
 */
export const TokenLine: React.FC<{
  tokens: Token[];
  justify?: 'center' | 'flex-start';
  gap?: number;
  maxWidth?: number;
  render?: (tok: Token, i: number) => React.ReactNode;
}> = ({tokens, justify = 'center', gap, maxWidth = WIDTH - 2 * SAFE.side, render}) => {
  const ready = useFontsReady();
  const maxSize = Math.max(...tokens.map(tokenSize));
  const minSize = Math.min(...tokens.map(tokenSize));
  const columnGap = gap ?? Math.round(minSize * 0.28 + maxSize * 0.04);
  const natural = ready
    ? tokens.reduce((w, tok) => w + measureToken(tok), 0) + columnGap * (tokens.length - 1)
    : 0;
  const fit = natural > maxWidth ? maxWidth / natural : 1;
  const line = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: justify,
        alignItems: 'baseline',
        columnGap,
        direction: 'rtl',
        flexShrink: 0,
        width: fit < 1 ? natural : undefined,
        transform: fit < 1 ? `scale(${fit})` : undefined,
        transformOrigin: justify === 'center' ? 'top center' : 'top right',
      }}
    >
      {tokens.map((tok, i) => (
        <React.Fragment key={`${tok.text}-${i}`}>
          {render ? render(tok, i) : <KineticToken tok={tok} />}
        </React.Fragment>
      ))}
    </div>
  );
  if (fit >= 1) {
    return line;
  }
  // A transform does not change layout size: reserve the scaled box so containers
  // (pills, stacked lines) wrap the fitted line, not its natural width.
  return (
    <div
      style={{
        display: 'flex',
        direction: 'rtl',
        justifyContent: justify,
        width: natural * fit,
        height: maxSize * 1.18 * fit,
      }}
    >
      {line}
    </div>
  );
};

/** Exit progress of a cue (0 -> 1) over its last frames. */
export const useCueExit = (c: Cue) => {
  const frame = useCurrentFrame();
  const outF = Math.round(c.out * FPS);
  return interpolate(frame, [outF - EXIT_FRAMES, outF], [0, 1], {...clamp, easing: EASE_IN});
};

/**
 * Centered multi-line kinetic caption (max two lines). Uses the absolute timeline
 * frame, so render it outside of offset Sequences.
 */
export const KineticCaption: React.FC<{cue: Cue}> = ({cue: c}) => {
  const frame = useCurrentFrame();
  const exit = useCueExit(c);
  const inF = Math.round(c.in * FPS);
  const outF = Math.round(c.out * FPS);
  if (frame < inF || frame >= outF) {
    return null;
  }
  // slow push on the whole block so holds never read as a frozen frame
  const drift = 1 + 0.03 * interpolate(frame, [inF, outF], [0, 1], clamp);
  if (c.lines.length > 2) {
    throw new Error(`Cue ${c.id}: more than two lines`);
  }
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: SAFE.side,
          right: SAFE.side,
          top: c.y ?? 900,
          transform: `translateY(calc(-50% - ${exit * 24}px)) scale(${drift})`,
          opacity: 1 - exit,
          filter: exit > 0.02 ? `blur(${exit * 8}px)` : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          direction: 'rtl',
        }}
      >
        {c.lines.map((line, i) => {
          const prevMax = i === 0 ? 0 : Math.max(...c.lines[i - 1].map(tokenSize));
          return (
            <div key={i} style={{marginTop: i === 0 ? 0 : -prevMax * 0.1}}>
              <TokenLine tokens={line} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
