import {Easing} from 'remotion';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// MACHRI has no logo/design files in this project, so the identity is a simple
// typographic wordmark plus one accent colour taken from the product itself
// (the orange hose connector / clamp).
export const COLORS = {
  bg: '#08090B',
  ink: '#FFFFFF',
  inkSoft: 'rgba(255,255,255,0.86)',
  inkFaint: 'rgba(255,255,255,0.5)',
  accent: '#FF6B1F',
  accentDeep: '#E2520C',
  danger: '#FF4A3D',
  ice: '#A8DCFF',
  panel: 'rgba(16,18,22,0.72)',
};

export const FONT = 'Cairo';

// Text zones. Facebook/Instagram 9:16 placements cover roughly the top 14% and
// the bottom 20-35% with UI; feed placements crop 9:16 to 4:5 (y 285-1635).
// Key copy therefore lives between y≈300 and y≈1300.
export const SAFE = {
  top: 300,
  bottom: 1300,
  side: 64,
};

export const TEXT_ZONE = {
  // centre line of the headline block above the footage focus
  headlineY: 470,
};

// Motion language: fast-out / soft-settle for entrances, quick accelerate for
// exits. No bouncy springs.
export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  soft: Easing.bezier(0.33, 1, 0.68, 1),
};

export const DUR = {
  in: 11,
  out: 7,
};
