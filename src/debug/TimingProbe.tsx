import {Video} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';

export type TimingProbeProps = {src: string; trimBefore: number; playbackRate: number};

/** QA only: full-frame footage with a known trim/rate, to compare against ffmpeg frames. */
export const TimingProbe: React.FC<TimingProbeProps> = ({src, trimBefore, playbackRate}) => (
  <AbsoluteFill>
    <Video src={staticFile(src)} trimBefore={trimBefore} playbackRate={playbackRate} muted objectFit="fill" style={{width: '100%', height: '100%'}} />
  </AbsoluteFill>
);
