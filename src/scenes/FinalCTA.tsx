import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ShotClip} from '../components/Footage';
import {CheckIcon} from '../components/Graphics';
import {KineticToken, LEAD_FRAMES, TokenLine, useReveal} from '../components/KineticCaption';
import {Visible, Window} from '../components/Timing';
import type {Token} from '../data/edit';
import {cue, SCENES, SHOTS} from '../data/edit';
import {COLORS, EASE_OUT, FONT_FAMILY, FPS, SAFE} from '../theme';

const FRAME = {left: 120, top: 380, width: 840, height: 620};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: EASE_OUT});
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 55% at 50% 42%, ${COLORS.graphiteLight} 0%, ${COLORS.graphite} 50%, ${COLORS.ink} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 50% 16% at 50% 52%, rgba(212,255,60,0.12) 0%, rgba(212,255,60,0) 100%)',
          opacity: enter,
        }}
      />
      <div
        style={{
          position: 'absolute',
          ...FRAME,
          borderRadius: 48,
          overflow: 'hidden',
          border: `2px solid ${COLORS.hairline}`,
          boxShadow: '0 50px 140px rgba(0,0,0,0.6)',
          opacity: enter,
          transform: `translateY(${(1 - enter) * 44}px) scale(${0.97 + 0.03 * enter})`,
        }}
      >
        <ShotClip shot={SHOTS.cta} width={FRAME.width} height={FRAME.height} offset={SCENES.cta[0]} />
      </div>
    </AbsoluteFill>
  );
};

const Wordmark: React.FC<{text: string; at: number}> = ({text, at}) => {
  const {p, opacity} = useReveal(at, 16);
  return (
    <div
      style={{
        position: 'absolute',
        top: 300,
        left: 0,
        right: 0,
        textAlign: 'center',
        transform: 'translateY(-50%)',
        fontFamily: FONT_FAMILY,
        fontWeight: 900,
        fontSize: 64,
        color: COLORS.white,
        letterSpacing: `${0.38 + (1 - p) * 0.4}em`,
        paddingLeft: '0.38em', // optically re-centre the tracked word
        opacity,
      }}
    >
      {text}
    </div>
  );
};

const TryBeforePayPill: React.FC<{tokens: Token[]}> = ({tokens}) => {
  const frame = useCurrentFrame();
  const first = tokens[0].at * FPS - LEAD_FRAMES - 2; // pill lands just before its words
  const enter = interpolate(frame - first, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 1244,
        left: SAFE.side,
        right: SAFE.side,
        display: 'flex',
        justifyContent: 'center',
        transform: `translateY(-50%) scale(${0.9 + 0.1 * enter})`,
        opacity: enter,
      }}
    >
      <div
        style={{
          display: 'flex',
          direction: 'rtl',
          alignItems: 'center',
          gap: 18,
          padding: '14px 46px 16px 52px',
          borderRadius: 999,
          backgroundColor: COLORS.accent,
          boxShadow: '0 20px 60px rgba(212,255,60,0.18)',
        }}
      >
        <CheckIcon size={50} />
        <TokenLine tokens={tokens} gap={16} maxWidth={760} render={(tok) => <KineticToken tok={tok} shadow={false} />} />
      </div>
    </div>
  );
};

/** G — "طلبو دابا من ماشري، وجرّبو قبل ما تخلّص!" */
export const FinalCTA: React.FC<{showTryBeforePay: boolean}> = ({showTryBeforePay}) => {
  const c = cue('cta');
  return (
    <>
      <Window range={SCENES.cta} name="G CTA">
        <Backdrop />
      </Window>
      <Visible range={SCENES.cta}>
        <AbsoluteFill>
          {c.brand ? <Wordmark text={c.brand.text} at={c.brand.at} /> : null}
          <div style={{position: 'absolute', top: 1112, left: SAFE.side, right: SAFE.side, transform: 'translateY(-50%)'}}>
            <TokenLine tokens={c.lines[0]} />
          </div>
          {showTryBeforePay ? <TryBeforePayPill tokens={c.lines[1]} /> : null}
        </AbsoluteFill>
      </Visible>
    </>
  );
};
