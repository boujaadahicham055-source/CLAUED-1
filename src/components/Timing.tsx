import React from 'react';
import {interpolate, Sequence, useCurrentFrame} from 'remotion';
import type {Cue, Shot} from '../data/edit';
import {EASE_IN_OUT, HEIGHT, sec, WIDTH} from '../theme';
import {mediaBox, pointInBox} from './Footage';
import {useCueExit} from './KineticCaption';

/**
 * Time conventions used by every scene:
 *  - <Window> is a Sequence: children see frames relative to its start (media, backdrops).
 *  - <Visible> only gates rendering: children keep the absolute timeline frame, which is
 *    what caption/cue timings (voice-over seconds) are expressed in.
 */
export const Window: React.FC<{
  range: readonly [number, number];
  name?: string;
  children: React.ReactNode;
}> = ({range, name, children}) => (
  <Sequence from={sec(range[0])} durationInFrames={sec(range[1]) - sec(range[0])} name={name}>
    {children}
  </Sequence>
);

export const Visible: React.FC<{range: readonly [number, number]; children: React.ReactNode}> = ({
  range,
  children,
}) => {
  const frame = useCurrentFrame();
  return frame >= sec(range[0]) && frame < sec(range[1]) ? <>{children}</> : null;
};

/** Where a normalised source point of a shot is on screen at the current (absolute) frame. */
export const useShotPoint = (shot: Shot, p: {x: number; y: number}, width = WIDTH, height = HEIGHT) => {
  const frame = useCurrentFrame();
  const from = sec(shot.from);
  const duration = sec(shot.to) - from;
  const z = interpolate(frame - from, [0, Math.max(1, duration - 1)], shot.zoom, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  return pointInBox(mediaBox(width, height, shot.focus, z), p);
};

/** Graphics that belong to a caption leave with it (same exit curve), instead of popping off. */
export const FadeWithCue: React.FC<{cue: Cue; children: React.ReactNode}> = ({cue, children}) => {
  const exit = useCueExit(cue);
  return <div style={{opacity: 1 - exit}}>{children}</div>;
};
