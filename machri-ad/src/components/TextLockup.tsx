import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../theme';
import type {Caption, CaptionLine, SizeKey} from '../timeline';

// Arabic shaping rule: animate whole words only. Each word is one span, so the
// browser shapes it as a unit (joining forms + harakat stay intact); never split
// Arabic into letters, and never apply letter-spacing to Arabic runs.

export const WORD_ENTER = 13;
export const WORD_STAGGER = 3;
export const EXIT = 8;

type Word = {text: string; accent: boolean};

export const parseWords = (t: string, forceAccent = false): Word[] => {
	let inAccent = false;
	return t
		.split(/\s+/)
		.filter(Boolean)
		.map((token) => {
			let text = token;
			let accent = inAccent;
			if (text.startsWith('*')) {
				accent = true;
				inAccent = true;
				text = text.slice(1);
			}
			if (text.endsWith('*')) {
				text = text.slice(0, -1);
				inAccent = false;
			}
			return {text, accent: accent || forceAccent};
		});
};

/** A word that rises out of a mask (with motion-blur) and leaves upward through the same mask. */
export const MaskedWord: React.FC<{
	text: string;
	accent: boolean;
	size: SizeKey;
	start: number;
	out: number;
	color?: string;
}> = ({text, accent, size, start, out, color}) => {
	const frame = useCurrentFrame();
	const p = interpolate(frame, [start, start + WORD_ENTER], [0, 1], {...clamp, easing: theme.easeOut});
	const q = interpolate(frame, [out, out + EXIT], [0, 1], {...clamp, easing: theme.easeIn});
	const y = (1 - p) * 120 - q * 55;
	const blur = (1 - p) * 10 + q * 8;
	const big = size === 'xl' || size === 'xxl';
	const scale = big && accent ? interpolate(p, [0, 1], [1.08, 1]) : 1;
	return (
		<span
			style={{
				display: 'inline-block',
				// vertical slot for the reveal; extended sideways so glows are never cut
				clipPath: 'inset(-0.32em -1.2em -0.42em -1.2em)',
			}}
		>
			<span
				style={{
					display: 'inline-block',
					transform: `translateY(${y}%) scale(${scale})`,
					filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
					opacity: Math.min(1, p * 1.8) * (1 - q),
					color: color ?? (accent ? theme.color.accent : theme.color.text),
					textShadow: accent ? theme.accentShadow : theme.shadow,
				}}
			>
				{text}
			</span>
		</span>
	);
};

export const LockupLine: React.FC<{line: CaptionLine; out: number}> = ({line, out}) => {
	const dir = line.dir ?? 'rtl';
	const words = parseWords(line.t, line.accent);
	return (
		<div
			dir={dir}
			lang={dir === 'rtl' ? 'ar' : 'en'}
			style={{
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'center',
				gap: '0.26em',
				fontSize: theme.size[line.size],
				fontWeight: theme.weight[line.size],
				letterSpacing: dir === 'ltr' ? theme.tracking[line.size] : 0,
				lineHeight: line.size === 'xxl' ? 1 : 1.16,
				whiteSpace: 'nowrap',
			}}
		>
			{words.map((w, i) => (
				<MaskedWord
					key={i}
					text={w.text}
					accent={w.accent}
					size={line.size}
					start={line.at + i * WORD_STAGGER}
					out={out}
				/>
			))}
		</div>
	);
};

/** Stacked caption lockup with a soft local scrim; positioned by its vertical centre. */
export const TextLockup: React.FC<{caption: Caption}> = ({caption}) => {
	const frame = useCurrentFrame();
	const first = Math.min(...caption.lines.map((l) => l.at));
	if (frame < first - 1 || frame > caption.out + EXIT + 1) {
		return null;
	}
	const appear = interpolate(frame, [first, first + 10], [0, 1], clamp);
	const leave = interpolate(frame, [caption.out, caption.out + EXIT], [1, 0], clamp);
	const scrimH = caption.kind === 'count' ? 1100 : 820;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: -120,
					right: -120,
					top: caption.y - scrimH / 2,
					height: scrimH,
					background: `radial-gradient(ellipse 62% 50% at 50% 50%, rgba(0,0,0,${
						caption.kind === 'count' ? 0.62 : 0.42
					}), rgba(0,0,0,0) 78%)`,
					opacity: appear * leave,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: caption.y,
					transform: 'translateY(-50%)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					fontFamily: theme.font,
					gap: caption.kind === 'feature' ? 6 : 0,
				}}
			>
				{caption.lines.map((line, i) => (
					<LockupLine key={i} line={line} out={caption.out} />
				))}
			</div>
		</>
	);
};
