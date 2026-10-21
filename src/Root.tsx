import React from 'react';
import {Composition, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {MachriAd} from './compositions/MachriAd';
import {COMPOSITION_FRAMES} from './data/audioTimeline';
import {FONT, FPS, HEIGHT, WIDTH} from './styles/brand';

// Cairo (SIL OFL 1.1, public/fonts/OFL.txt), loaded from local files so renders are offline and deterministic.
for (const weight of ['500', '700', '800', '900']) {
  loadFont({family: FONT, url: staticFile(`fonts/Cairo-${weight}.ttf`), weight});
}

export const RemotionRoot: React.FC = () => (
  <Composition id="MachriAd" component={MachriAd} durationInFrames={COMPOSITION_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
