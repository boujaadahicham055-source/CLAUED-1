import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {COLORS, DUR, EASE, FONT, WIDTH} from '../styles/brand';
import {KineticText} from './KineticText';

/**
 * Feature label used for all four functions so the sequence reads as one
 * system: a 4-segment progress rail (counting up to the "4 خدمات" payoff),
 * the feature number, and the feature name with its first word in the accent.
 */
export const FeatureReveal: React.FC<{
  index: number; // 1..4
  title: string;
  dir?: 'rtl' | 'ltr';
  railIn: number; // scene start
  titleIn: number; // locked to the spoken feature name
  outAt: number;
  size?: number;
  accentWords?: number[];
  letterSpacing?: number;
}> = ({index, title, dir = 'rtl', railIn, titleIn, outAt, size = 116, accentWords = [0], letterSpacing = 0}) => {
  const frame = useCurrentFrame();
  if (frame < railIn || frame > outAt + DUR.out + 2) {
    return null;
  }
  const railP = interpolate(frame - railIn, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  const fillP = interpolate(frame - railIn - 3, [0, 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
  const outP = interpolate(frame - outAt, [0, DUR.out], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.in});
  const segW = 64;
  const gap = 10;
  const railWidth = segW * 4 + gap * 3;
  const wordColors = Object.fromEntries(accentWords.map((w) => [w, COLORS.accent]));

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 318,
          left: (WIDTH - railWidth - 110) / 2,
          width: railWidth + 110,
          height: 44,
          display: 'flex',
          direction: 'rtl',
          alignItems: 'center',
          gap: 22,
          opacity: railP * (1 - outP),
          transform: `translateY(${(1 - railP) * 14 - outP * 10}px)`,
        }}
      >
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color: COLORS.accent, letterSpacing: 2, minWidth: 66, textAlign: 'center'}}>{`0${index}`}</div>
        <div style={{display: 'flex', direction: 'rtl', gap}}>
          {[1, 2, 3, 4].map((i) => {
            const done = i < index;
            const current = i === index;
            return (
              <div key={i} style={{width: segW, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.22)', overflow: 'hidden'}}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: current ? COLORS.accent : 'rgba(255,255,255,0.85)',
                    transform: `scaleX(${done ? 1 : current ? fillP : 0})`,
                    transformOrigin: 'right center',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <KineticText text={title} inAt={titleIn} outAt={outAt} variant="MaskedReveal" size={size} y={470} dir={dir} wordColors={wordColors} letterSpacing={letterSpacing} stagger={4} />
    </>
  );
};
