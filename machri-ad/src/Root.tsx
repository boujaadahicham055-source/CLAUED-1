import React from 'react';
import {Composition} from 'remotion';
import {MachriAd} from './MachriAd';
import {timeline} from './timeline';

export const RemotionRoot: React.FC = () => {
	const {fps, width, height, durationInFrames} = timeline.meta;
	return (
		<Composition
			id="MachriAd"
			component={MachriAd}
			durationInFrames={durationInFrames}
			fps={fps}
			width={width}
			height={height}
		/>
	);
};
