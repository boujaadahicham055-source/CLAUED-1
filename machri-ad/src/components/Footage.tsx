import React from 'react';
import {AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {clamp, theme} from '../theme';
import type {Look, Shot} from '../timeline';

export const clipSrc = (name: string) => staticFile(`clips/${name}.mp4`);

// Problem scenes run cold and desaturated; the reveal switches to a clean, natural grade.
export const LOOK_FILTER: Record<Look, string> = {
	problem: 'saturate(0.5) contrast(1.06) brightness(0.86)',
	solution: 'saturate(1.08) contrast(1.05) brightness(1.02)',
};

export const LookOverlay: React.FC<{look: Look; opacity?: number}> = ({look, opacity = 1}) => (
	<AbsoluteFill style={{opacity, pointerEvents: 'none'}}>
		{look === 'problem' ? <AbsoluteFill style={{backgroundColor: 'rgba(12,28,52,0.22)'}} /> : null}
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 85% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,${
					look === 'problem' ? 0.6 : 0.38
				}) 100%)`,
			}}
		/>
	</AbsoluteFill>
);

// Source S1/S2 carry a baked-in yellow English caption at source px x 89-487, y 671-862
// (x 167-913, y 1258-1616 after the 1.875x upscale). A blurred, darkened, desaturated
// copy of the same frame is faded in over the lower part of the shot (a progressive
// bottom blur, full width) so the caption dissolves instead of being covered by a box.
const MASK_BOX = {x: 0, y: 1060, w: 1080, h: 860};
const MASK_FADE = 'linear-gradient(to bottom, transparent 0%, black 23%)';

const EmbeddedTextMask: React.FC<{clip: string}> = ({clip}) => (
	<div
		style={{
			position: 'absolute',
			left: MASK_BOX.x,
			top: MASK_BOX.y,
			width: MASK_BOX.w,
			height: MASK_BOX.h,
			overflow: 'hidden',
			maskImage: MASK_FADE,
			WebkitMaskImage: MASK_FADE,
		}}
	>
		<OffthreadVideo
			src={clipSrc(clip)}
			muted
			style={{
				position: 'absolute',
				left: -MASK_BOX.x,
				top: -MASK_BOX.y,
				width: 1080,
				height: 1920,
				filter: 'blur(26px) saturate(0.25) brightness(0.48)',
			}}
		/>
	</div>
);

/** Push-in scale for a shot at a local frame, with optional hold before the move starts. */
export const pushScale = (shot: Shot, f: number) => {
	const delay = shot.pushDelay ?? 0;
	return interpolate(f, [delay, shot.duration - 1], [shot.push.from, shot.push.to], {
		...clamp,
		easing: theme.easeInOut,
	});
};

const WIPE_FRAMES = 9;
const WIPE_SOFT = 16; // % of frame height used as the feathered edge

/** One shot: the clip, a slow push, grade, and its entry transition. Rendered inside a <Sequence>. */
export const ShotLayer: React.FC<{shot: Shot}> = ({shot}) => {
	const f = useCurrentFrame();
	let scale = pushScale(shot, f);
	if (shot.enter === 'settle') {
		// small deceleration into the frame on feature cuts (energy without a "zoom punch")
		scale *= interpolate(f, [0, 8], [1.045, 1], {...clamp, easing: theme.easeOut});
	}

	let wipeStyle: React.CSSProperties = {};
	let edge: React.ReactNode = null;
	if (shot.enter === 'wipe') {
		const p = interpolate(f, [0, WIPE_FRAMES], [0, 1], {...clamp, easing: theme.easeInOut});
		const head = p * (100 + WIPE_SOFT);
		const mask = `linear-gradient(to top, black ${head - WIPE_SOFT}%, transparent ${head}%)`;
		wipeStyle = {maskImage: mask, WebkitMaskImage: mask};
		const edgeY = 1920 * (1 - (head - WIPE_SOFT / 2) / 100);
		edge = (
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: edgeY - 1,
					height: 3,
					background: theme.color.accent,
					boxShadow: `0 0 26px 6px rgba(214,255,58,0.45)`,
					opacity: Math.sin(Math.PI * p) * 0.75,
				}}
			/>
		);
	}

	return (
		<AbsoluteFill>
			<AbsoluteFill style={{overflow: 'hidden', backgroundColor: theme.color.ink, ...wipeStyle}}>
				<AbsoluteFill
					style={{
						transform: `scale(${scale})`,
						transformOrigin: `${shot.push.ox * 100}% ${shot.push.oy * 100}%`,
						filter: LOOK_FILTER[shot.look],
					}}
				>
					<OffthreadVideo src={clipSrc(shot.id)} muted style={{width: '100%', height: '100%'}} />
					{shot.maskEmbeddedText ? <EmbeddedTextMask clip={shot.id} /> : null}
				</AbsoluteFill>
				<LookOverlay look={shot.look} />
			</AbsoluteFill>
			{edge}
		</AbsoluteFill>
	);
};
