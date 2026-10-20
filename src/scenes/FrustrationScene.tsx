import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ShotClip, StillFrame} from '../components/Footage';
import {Pill} from '../components/Graphics';
import {Scrim} from '../components/Overlays';
import {Window} from '../components/Timing';
import {cue, SCENES, SHOTS} from '../data/edit';
import {EASE_IN_OUT, sec} from '../theme';

const COST: readonly [number, number] = [SHOTS.flatTire.to, SCENES.frustration[1]];

/** While the costs pile up the world blurs and sinks to black (into the proverb). */
const CostBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = sec(COST[1]) - sec(COST[0]);
  const blur = interpolate(frame, [0, 24], [0, 22], {extrapolateRight: 'clamp', easing: EASE_IN_OUT});
  const light = interpolate(frame, [0, 20, duration - 12, duration], [1, 0.8, 0.8, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{filter: `blur(${blur}px) brightness(${light})`, transform: 'scale(1.06)'}}>
      <StillFrame
        name="flat-tire"
        durationInFrames={duration}
        focus={SHOTS.flatTire.focus}
        zoom={[SHOTS.flatTire.zoom[1], SHOTS.flatTire.zoom[1] + 0.04]}
        grade="mono"
      />
    </AbsoluteFill>
  );
};

/** C — waiting for help, unplanned costs. */
export const FrustrationScene: React.FC = () => (
  <>
    <ShotClip shot={SHOTS.flatTire} />
    <Window range={COST} name="C2 cost backdrop">
      <CostBackdrop />
    </Window>
    <Window range={SCENES.frustration} name="C scrim">
      <Scrim y={820} height={900} strength={0.45} />
    </Window>
    <Pill cue={cue('wait-pill')} />
    <Pill cue={cue('cost-pill')} />
  </>
);
