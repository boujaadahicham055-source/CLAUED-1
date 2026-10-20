import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';

/** Procedural film grain (4 tiles, swapped every 2 frames) — hides upscale softness. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const tile = Math.floor(frame / 2) % 4;
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <Img
        src={staticFile(`grain/grain-${tile}.png`)}
        style={{width: '100%', height: '100%', objectFit: 'none', objectPosition: 'left top'}}
      />
      <Img
        src={staticFile(`grain/grain-${(tile + 1) % 4}.png`)}
        style={{
          position: 'absolute',
          left: 512,
          top: 0,
          width: 568,
          height: 1920,
          objectFit: 'none',
          objectPosition: 'left top',
        }}
      />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** Soft dark band behind text placed over footage. */
export const Scrim: React.FC<{y: number; height?: number; strength?: number}> = ({
  y,
  height = 760,
  strength = 0.55,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 95% ${height / 2}px at 50% ${y}px, rgba(0,0,0,${strength}) 0%, rgba(0,0,0,${strength * 0.55}) 45%, rgba(0,0,0,0) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

export const TopScrim: React.FC<{height?: number; strength?: number}> = ({
  height = 820,
  strength = 0.78,
}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(180deg, rgba(0,0,0,${strength}) 0px, rgba(0,0,0,${strength * 0.6}) ${height * 0.45}px, rgba(0,0,0,0) ${height}px)`,
      pointerEvents: 'none',
    }}
  />
);
