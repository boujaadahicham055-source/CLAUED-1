import {Audio} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import './fonts';
import {Grain, Vignette} from './components/Overlays';
import {FeatureShowcase} from './scenes/FeatureShowcase';
import {FinalCTA} from './scenes/FinalCTA';
import {FrustrationScene} from './scenes/FrustrationScene';
import {HookScene} from './scenes/HookScene';
import {ProblemScene} from './scenes/ProblemScene';
import {ProductIntro, ValueScene} from './scenes/ProductHero';
import {RecapScene} from './scenes/RecapScene';
import {SolutionReveal} from './scenes/SolutionReveal';
import {COLORS} from './theme';

export type ProductAdProps = {
  /** "جرّب قبل ما تخلّص" — only keep if try-before-you-pay is the seller's confirmed policy. */
  showTryBeforePay: boolean;
};

/**
 * MACHRI 4-in-1 jump starter — Moroccan Darija vertical ad.
 * The ElevenLabs voice-over is the only audio; every footage instance is muted and
 * reads a master file that has no audio stream at all.
 */
export const ProductAd: React.FC<ProductAdProps> = ({showTryBeforePay}) => (
  <AbsoluteFill style={{backgroundColor: COLORS.ink}}>
    <Audio src={staticFile('assets/voiceover.mp3')} volume={1} />

    <HookScene />
    <ProblemScene />
    <FrustrationScene />
    <SolutionReveal />
    <ProductIntro />
    <FeatureShowcase />
    <ValueScene />
    <RecapScene />
    <FinalCTA showTryBeforePay={showTryBeforePay} />

    <Vignette strength={0.42} />
    <Grain opacity={0.06} />
  </AbsoluteFill>
);
