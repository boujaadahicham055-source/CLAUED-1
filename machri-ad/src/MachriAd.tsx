import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {BrandBug, CTAScene} from './components/Brand';
import {FourGrid} from './components/FourGrid';
import {ShotLayer} from './components/Footage';
import {TextLockup} from './components/TextLockup';
import {loadFonts} from './fonts';
import {theme} from './theme';
import {timeline} from './timeline';

/**
 * Layer order (bottom → top): footage shots, four-function grid, captions,
 * brand mark, CTA end card. The ElevenLabs voice-over is the only audio:
 * footage clips are encoded without audio and every <OffthreadVideo> is muted.
 */
export const MachriAd: React.FC = () => {
	loadFonts();
	const {shots, grid, captions, meta} = timeline;
	return (
		<AbsoluteFill style={{backgroundColor: theme.color.ink}}>
			{shots.map((shot) => (
				<Sequence key={shot.id} from={shot.from} durationInFrames={shot.duration} name={`${shot.id} · ${shot.scene}`}>
					<ShotLayer shot={shot} />
				</Sequence>
			))}
			<Sequence from={grid.from} durationInFrames={grid.duration} name="grid · 4 in 1">
				<FourGrid />
			</Sequence>
			{captions.map((c) => (
				<TextLockup key={c.id} caption={c} />
			))}
			<BrandBug />
			<CTAScene />
			<Audio src={staticFile(meta.voiceover.file)} />
		</AbsoluteFill>
	);
};
