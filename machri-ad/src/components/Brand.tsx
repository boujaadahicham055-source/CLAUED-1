import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../theme';
import {timeline} from '../timeline';
import {LockupLine, MaskedWord} from './TextLockup';

// No MACHRI logo asset exists in the project: the brand is a restrained typographic
// wordmark only (letter-spaced Cairo Black), never a drawn logo.
const Wordmark: React.FC<{size: number; tracking: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	size,
	tracking,
	style,
	children,
}) => (
	<div
		dir="ltr"
		style={{
			fontFamily: theme.font,
			fontSize: size,
			fontWeight: 900,
			letterSpacing: `${tracking}em`,
			// trailing tracking would push the word off-centre
			paddingLeft: `${tracking}em`,
			color: theme.color.text,
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

/** Small, unobtrusive wordmark from the product reveal until the end card takes over. */
export const BrandBug: React.FC = () => {
	const frame = useCurrentFrame();
	const {brandBug} = timeline;
	if (frame < brandBug.in || frame > brandBug.out + 8) {
		return null;
	}
	const opacity =
		interpolate(frame, [brandBug.in, brandBug.in + 12], [0, 0.9], clamp) *
		interpolate(frame, [brandBug.out, brandBug.out + 6], [1, 0], clamp);
	return (
		<Wordmark
			size={30}
			tracking={0.42}
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: brandBug.y - 22,
				opacity,
				textShadow: theme.shadow,
			}}
		>
			{brandBug.text}
		</Wordmark>
	);
};

/** End card: wordmark, primary CTA pill, secondary promise, stacked above the product. */
export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cta} = timeline;
	if (frame < cta.from) {
		return null;
	}
	const scrim = interpolate(frame, [cta.from, cta.from + 10], [0, 1], clamp);
	const pill = interpolate(frame, [cta.primary.at, cta.primary.at + 12], [0, 1], {...clamp, easing: theme.easeOut});
	// one precise beat on "دابا" (now)
	const beat = interpolate(frame, [620, 624, 632], [1, 1.05, 1], {...clamp, easing: theme.easeInOut});
	const NEVER = 1e9;

	return (
		<AbsoluteFill>
			<AbsoluteFill
				style={{
					opacity: scrim,
					background:
						'linear-gradient(to bottom, rgba(5,7,10,0.78) 0%, rgba(5,7,10,0.55) 24%, rgba(5,7,10,0.0) 42%)',
				}}
			/>
			<div style={{position: 'absolute', left: 0, right: 0, top: cta.wordmark.y - 44, display: 'flex', justifyContent: 'center'}}>
				<Wordmark size={66} tracking={0.42}>
					<MaskedWord text={cta.wordmark.text} accent={false} size="l" start={cta.wordmark.at} out={NEVER} />
				</Wordmark>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: cta.primary.y,
					transform: 'translateY(-50%)',
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<div
					dir="rtl"
					lang="ar"
					style={{
						fontFamily: theme.font,
						fontSize: 104,
						fontWeight: 950,
						lineHeight: 1.2,
						color: theme.color.ink,
						background: theme.color.accent,
						padding: '4px 88px 18px',
						borderRadius: 999,
						boxShadow: '0 18px 50px rgba(0,0,0,0.45), 0 0 46px rgba(214,255,58,0.28)',
						clipPath: `inset(-40px ${(1 - pill) * 50}% -40px ${(1 - pill) * 50}% round 999px)`,
						transform: `scale(${interpolate(pill, [0, 1], [0.94, 1]) * beat})`,
						whiteSpace: 'nowrap',
					}}
				>
					<span style={{display: 'inline-block', opacity: interpolate(pill, [0.35, 1], [0, 1], clamp)}}>
						{cta.primary.text}
					</span>
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: cta.secondary.y,
					transform: 'translateY(-50%)',
					fontFamily: theme.font,
				}}
			>
				<LockupLine line={{t: cta.secondary.text, size: 'm', at: cta.secondary.at}} out={NEVER} />
			</div>
		</AbsoluteFill>
	);
};
