import React from 'react';
import {Composition} from 'remotion';
import {TOTAL_FRAMES} from './data/edit';
import {TimingProbe, type TimingProbeProps} from './debug/TimingProbe';
import {ProductAd, type ProductAdProps} from './ProductAd';
import {FPS, HEIGHT, WIDTH} from './theme';

const defaultProps: ProductAdProps = {
  // The seller's voice-over says "وجرّبو قبل ما تخلّص". Set to false if that policy
  // (and its testing conditions) is not confirmed — the audio line would remain.
  showTryBeforePay: true,
};

const probeProps: TimingProbeProps = {
  src: 'assets/footage_1080p60.webm',
  trimBefore: 0,
  playbackRate: 1,
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="ProductAd"
      component={ProductAd}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={defaultProps}
    />
    {/* QA only (not part of the ad): verifies the trim / playback-rate time mapping. */}
    <Composition
      id="TimingProbe"
      component={TimingProbe}
      durationInFrames={300}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={probeProps}
    />
  </>
);
