import {Video} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {Focus, Grade, Shot} from '../data/edit';
import {EASE_IN_OUT, HEIGHT, sec, WIDTH} from '../theme';

// Silent, upscaled, 60 fps master built by tools/prepare-footage.sh (no audio stream).
export const FOOTAGE_SRC = staticFile('assets/footage_1080p60.webm');
const MEDIA_W = 1080;
const MEDIA_H = 1920;

export type Box = {left: number; top: number; width: number; height: number};

/** Cover-fit the media in a container, zoomed, keeping `focus` centred where possible. */
export const mediaBox = (cw: number, ch: number, focus: Focus, zoom: number): Box => {
  const scale = Math.max(cw / MEDIA_W, ch / MEDIA_H) * zoom;
  const width = MEDIA_W * scale;
  const height = MEDIA_H * scale;
  const left = Math.min(0, Math.max(cw - width, cw / 2 - focus.x * width));
  const top = Math.min(0, Math.max(ch - height, ch / 2 - focus.y * height));
  return {left, top, width, height};
};

/** Container coordinates of a point given in normalised source coordinates. */
export const pointInBox = (box: Box, p: Focus) => ({
  x: box.left + p.x * box.width,
  y: box.top + p.y * box.height,
});

export const GRADE_FILTER: Record<Grade, string> = {
  mono: 'grayscale(1) contrast(1.12) brightness(0.6)',
  monoDeep: 'grayscale(1) contrast(1.16) brightness(0.46)',
  natural: 'saturate(1.08) contrast(1.06)',
  hero: 'saturate(1.14) contrast(1.08) brightness(1.03)',
};

const ColdTint: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: 'rgba(38, 58, 84, 0.32)', mixBlendMode: 'soft-light'}} />
);

type FramedProps = {
  durationInFrames: number;
  focus: Focus;
  zoom: [number, number];
  grade: Grade;
  width?: number;
  height?: number;
  extraFilter?: string;
  children: (box: Box, style: React.CSSProperties) => React.ReactNode;
};

/** Shared framing: animated push-in (zoom from -> to) over the clip's duration. */
const Framed: React.FC<FramedProps> = ({
  durationInFrames,
  focus,
  zoom,
  grade,
  width = WIDTH,
  height = HEIGHT,
  extraFilter,
  children,
}) => {
  const frame = useCurrentFrame();
  const z = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], zoom, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_IN_OUT,
  });
  const box = mediaBox(width, height, focus, z);
  const style: React.CSSProperties = {
    position: 'absolute',
    ...box,
    filter: [GRADE_FILTER[grade], extraFilter].filter(Boolean).join(' '),
  };
  return (
    <AbsoluteFill style={{overflow: 'hidden', width, height}}>
      {children(box, style)}
      {grade === 'mono' || grade === 'monoDeep' ? <ColdTint /> : null}
    </AbsoluteFill>
  );
};

/** A shot from the shot list, placed at its own time on the timeline. */
export const ShotClip: React.FC<{
  shot: Shot;
  width?: number;
  height?: number;
  /** Shift relative to the parent sequence start (seconds), when nested. */
  offset?: number;
  extraFilter?: string;
}> = ({shot, width, height, offset = 0, extraFilter}) => {
  const from = sec(shot.from - offset);
  const durationInFrames = sec(shot.to - offset) - from;
  return (
    <Sequence from={from} durationInFrames={durationInFrames} name={`${shot.id} ${shot.note}`}>
      <Framed
        durationInFrames={durationInFrames}
        focus={shot.focus}
        zoom={shot.zoom}
        grade={shot.grade}
        width={width}
        height={height}
        extraFilter={extraFilter}
      >
        {(_box, style) => (
          <Video
            src={FOOTAGE_SRC}
            trimBefore={sec(shot.src)}
            playbackRate={shot.rate}
            muted
            volume={0}
            objectFit="fill"
            style={style}
          />
        )}
      </Framed>
    </Sequence>
  );
};

/** A still from public/stills (freeze-frames and feature cards). */
export const StillFrame: React.FC<{
  name: string;
  durationInFrames: number;
  focus: Focus;
  zoom: [number, number];
  grade: Grade;
  width?: number;
  height?: number;
  extraFilter?: string;
  children?: (box: Box) => React.ReactNode;
}> = ({name, children, ...rest}) => (
  <Framed {...rest}>
    {(box, style) => (
      <>
        <Img src={staticFile(`stills/${name}.jpg`)} style={style} />
        {children ? children(box) : null}
      </>
    )}
  </Framed>
);
