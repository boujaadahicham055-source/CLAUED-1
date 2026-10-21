import {Easing} from 'remotion';
import type {SizeKey} from './timeline';

// No MACHRI brand kit exists in the project, so the identity is a restrained
// typographic system: one typeface (Cairo), white + one accent, dark ink.
export const theme = {
	font: '"Cairo", sans-serif',
	color: {
		text: '#FFFFFF',
		accent: '#D6FF3A',
		ink: '#0B0D10',
		soft: 'rgba(255,255,255,0.82)',
	},
	size: {xs: 34, s: 60, m: 76, l: 100, xl: 158, xxl: 400} satisfies Record<SizeKey, number>,
	weight: {xs: 800, s: 700, m: 700, l: 900, xl: 950, xxl: 1000} satisfies Record<SizeKey, number>,
	tracking: {xs: '0.24em', s: '0', m: '0', l: '0', xl: '0', xxl: '-0.02em'} satisfies Record<SizeKey, string>,
	shadow: '0 6px 28px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.35)',
	accentShadow: '0 0 34px rgba(214,255,58,0.32), 0 6px 28px rgba(0,0,0,0.45)',
	easeOut: Easing.bezier(0.16, 1, 0.3, 1),
	easeIn: Easing.bezier(0.7, 0, 0.84, 0),
	easeInOut: Easing.bezier(0.65, 0, 0.35, 1),
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
