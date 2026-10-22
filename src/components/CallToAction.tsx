import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CTA_PRODUCT, GRADES, sourceShot} from '../data/shotMap';
import {COLORS, EASE, FONT, WIDTH} from '../styles/brand';
import {CTAReveal} from './KineticText';
import {BlurredBackdrop, Footage, gradeFilter} from './ProductShot';

const ease = (f: number, d: number, e = EASE.out) => interpolate(f, [0, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

/** Simple typographic MACHRI wordmark (no logo files were supplied). */
export const Wordmark: React.FC<{size: number; inAt: number; y: number; opacity?: number}> = ({size, inAt, y, opacity = 1}) => {
  const f = useCurrentFrame();
  const p = ease(f - inAt, 12);
  const bar = ease(f - inAt - 6, 12);
  if (p <= 0) {
    return null;
  }
  return (
    <div style={{position: 'absolute', top: y, left: 0, width: WIDTH, transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', opacity}}>
      <div style={{overflow: 'hidden', padding: '0.1em 0.2em 0.15em'}}>
        <div
          style={{
            transform: `translateY(${(1 - p) * 110}%)`,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.2,
            letterSpacing: '0.34em',
            marginRight: '-0.34em',
            color: COLORS.ink,
            textShadow: '0 2px 14px rgba(0,0,0,0.55)',
          }}
        >
          MACHRI
        </div>
      </div>
      <div style={{width: size * 1.3, height: Math.max(4, size * 0.09), marginTop: size * 0.08, borderRadius: 4, background: COLORS.accent, transform: `scaleX(${bar})`}} />
    </div>
  );
};

// Everything critical stays above y≈1240 (Reels caption/CTA overlay covers the bottom ~35%).
const CARD = {w: 720, h: 660, top: 398};

/** Closing card: real product + MACHRI + primary CTA + try-before-you-pay line. Local frame 0 = comp 773. */
export const CallToAction: React.FC<{ctaIn: number; trustIn: number; wordmarkIn: number}> = ({ctaIn, trustIn, wordmarkIn}) => {
  const f = useCurrentFrame();
  const src = sourceShot(CTA_PRODUCT.source);
  const bgIn = ease(f, 10, EASE.inOut);
  const card = ease(f, 14);
  const push = interpolate(f, [0, 127], [1, 1.035]);
  const productScale = 1.27;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: bgIn, backgroundColor: COLORS.bg}}>
        <BlurredBackdrop time={CTA_PRODUCT.src} cleanBottom={src.cleanBottom} filter={gradeFilter(GRADES.natural)} dim={0.28} />
        <AbsoluteFill style={{background: `radial-gradient(60% 36% at 50% 50%, ${COLORS.accent}30 0%, rgba(0,0,0,0) 72%)`}} />
        <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(8,9,11,0.55) 0%, rgba(8,9,11,0.15) 40%, rgba(8,9,11,0.85) 100%)'}} />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: (WIDTH - CARD.w) / 2,
          top: CARD.top,
          width: CARD.w,
          height: CARD.h,
          borderRadius: 40,
          overflow: 'hidden',
          opacity: card,
          transform: `translateY(${(1 - card) * 50}px) scale(${(1.1 - 0.1 * card) * push})`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,255,255,0.14)`,
          backgroundColor: '#0E0F12',
        }}
      >
        <Footage
          time={CTA_PRODUCT.src}
          focus={CTA_PRODUCT.focus}
          scale={productScale}
          centerX={CARD.w / 2}
          centerY={CARD.h / 2}
          cleanBottom={src.cleanBottom}
          fitWidth={CARD.w}
          feather={{top: 0, bottom: 0}}
          filter={gradeFilter(GRADES.natural)}
        />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)'}} />
      </div>

      <Wordmark size={52} inAt={wordmarkIn} y={326} />
      <CTAReveal text="طلبو دابا" inAt={ctaIn} y={1062} width={620} height={136} fontSize={74} sweepAt={ctaIn + 52} />
      <TrustLine inAt={trustIn} y={1188} />
    </AbsoluteFill>
  );
};

/** "جرّب قبل ما تخلّص": check badge + line, laid out as one RTL row (DirectionalSlide). */
const TrustLine: React.FC<{inAt: number; y: number}> = ({inAt, y}) => {
  const f = useCurrentFrame();
  const p = ease(f - inAt, 11);
  const check = ease(f - inAt - 5, 10);
  if (p <= 0) {
    return null;
  }
  return (
    <div
      lang="ar"
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: WIDTH,
        transform: `translateY(-50%) translateX(${(1 - p) * 34}px)`,
        opacity: p,
        display: 'flex',
        direction: 'rtl',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18,
      }}
    >
      <div style={{width: 54, height: 54, borderRadius: 27, background: COLORS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${COLORS.accent}66`}}>
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={24} strokeDashoffset={24 * (1 - check)} />
        </svg>
      </div>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 58, lineHeight: 1.4, color: COLORS.ink, whiteSpace: 'nowrap', textShadow: '0 2px 12px rgba(0,0,0,0.5)'}}>جرّب قبل ما تخلّص</div>
    </div>
  );
};
