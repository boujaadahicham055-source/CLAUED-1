import {Easing} from 'remotion';

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

// Restrained monochrome foundation + one accent (no MACHRI brand kit was supplied).
export const COLORS = {
  ink: '#0B0B0D',
  graphite: '#151619',
  graphiteLight: '#1E1F23',
  white: '#F5F5F2',
  muted: 'rgba(245, 245, 242, 0.66)',
  hairline: 'rgba(245, 245, 242, 0.14)',
  accent: '#D4FF3C',
} as const;

export const FONT_FAMILY = 'Cairo';

// Meta Reels / Stories: keep text inside this band.
export const SAFE = {top: 270, bottom: 1250, side: 72} as const;

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_IN = Easing.bezier(0.5, 0, 0.75, 0);

export const sec = (s: number) => Math.round(s * FPS);

export type TokenStyleName =
  | 'lead'
  | 'sub'
  | 'body'
  | 'key'
  | 'hero'
  | 'impact'
  | 'pill'
  | 'feature'
  | 'featureKey'
  | 'ctaPill';

type TokenStyle = {size: number; weight: number; color: string; reveal: 'rise' | 'impact'};

export const TOKEN_STYLES: Record<TokenStyleName, TokenStyle> = {
  lead: {size: 100, weight: 800, color: COLORS.white, reveal: 'rise'},
  sub: {size: 80, weight: 700, color: COLORS.muted, reveal: 'rise'},
  body: {size: 88, weight: 800, color: COLORS.white, reveal: 'rise'},
  key: {size: 200, weight: 900, color: COLORS.accent, reveal: 'rise'},
  hero: {size: 170, weight: 900, color: COLORS.white, reveal: 'rise'},
  impact: {size: 260, weight: 900, color: COLORS.accent, reveal: 'impact'},
  pill: {size: 78, weight: 800, color: COLORS.white, reveal: 'rise'},
  feature: {size: 112, weight: 800, color: COLORS.white, reveal: 'rise'},
  featureKey: {size: 112, weight: 900, color: COLORS.accent, reveal: 'rise'},
  ctaPill: {size: 60, weight: 800, color: COLORS.ink, reveal: 'rise'},
};

export const TEXT_SHADOW =
  '0 6px 36px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.35)';
