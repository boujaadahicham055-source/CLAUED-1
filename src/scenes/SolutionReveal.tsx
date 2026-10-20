import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ShotClip} from '../components/Footage';
import {KineticCaption} from '../components/KineticCaption';
import {TopScrim} from '../components/Overlays';
import {Window} from '../components/Timing';
import {cue, SCENES, SHOTS} from '../data/edit';
import {COLORS, EASE_IN_OUT, WIDTH} from '../theme';

// Purely vertical gradient, so it can be sliced into strips without seams.
const PROVERB_BG = `linear-gradient(180deg, ${COLORS.ink} 0%, #17181C 46%, #141518 60%, ${COLORS.ink} 100%)`;

const ProverbBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  // a quiet glow rises behind the proverb: the tone turns from frustration to calm
  const glow = interpolate(frame, [0, 57], [0, 1], {extrapolateRight: 'clamp', easing: EASE_IN_OUT});
  return (
    <AbsoluteFill style={{background: PROVERB_BG}}>
      <AbsoluteFill
        style={{
          opacity: glow,
          transform: `scale(${0.85 + 0.25 * glow})`,
          background:
            'radial-gradient(ellipse 60% 26% at 50% 50%, rgba(212,255,60,0.09) 0%, rgba(212,255,60,0) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

const STRIPS = 9;
const REVEAL_FRAMES = 13;

/** Strips of the proverb backdrop fold away right-to-left, revealing the product. */
const BlindsReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const w = WIDTH / STRIPS;
  return (
    <AbsoluteFill>
      {Array.from({length: STRIPS}, (_, i) => {
        const delay = (STRIPS - 1 - i) * 1.1; // rightmost strip first (RTL)
        const p = interpolate(frame - delay, [0, REVEAL_FRAMES], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: EASE_IN_OUT,
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: i * w - 0.5,
              width: w + 1,
              background: PROVERB_BG,
              transform: `scaleX(${1 - p})`,
              transformOrigin: 'left center',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** D — "الوقاية خير من العلاج... وها علاش جبنا ليك الحل!" */
export const SolutionReveal: React.FC = () => {
  const reveal = cue('solution');
  return (
    <>
      <Window range={SCENES.prevention} name="D1 proverb">
        <ProverbBackdrop />
      </Window>
      <ShotClip shot={SHOTS.reveal} />
      <Window range={[SCENES.reveal[0], SCENES.reveal[0] + 0.8]} name="D2 blinds">
        <BlindsReveal />
      </Window>
      <Window range={SCENES.reveal} name="D2 scrim">
        <TopScrim height={900} strength={0.7} />
      </Window>
      <KineticCaption cue={cue('prevention')} />
      <KineticCaption cue={reveal} />
    </>
  );
};
