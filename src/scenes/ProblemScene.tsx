import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ShotClip, StillFrame} from '../components/Footage';
import {BatteryEmpty} from '../components/Graphics';
import {KineticCaption} from '../components/KineticCaption';
import {Scrim} from '../components/Overlays';
import {FadeWithCue, Visible, Window} from '../components/Timing';
import {cue, SHOTS} from '../data/edit';
import {sec} from '../theme';

const WALOU: readonly [number, number] = [SHOTS.keyTurn.to, SHOTS.battery.from];

/** The key-turn freezes on "والو!" — nothing happens. */
const WalouFreeze: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = sec(WALOU[1]) - sec(WALOU[0]);
  // the frame sinks a little further into darkness when the word lands
  const dark = interpolate(frame, [sec(5.7 - WALOU[0]) - 2, sec(5.7 - WALOU[0]) + 6], [1, 0.72], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{filter: `brightness(${dark})`}}>
      <StillFrame
        name="key-turn"
        durationInFrames={duration}
        focus={SHOTS.keyTurn.focus}
        zoom={[SHOTS.keyTurn.zoom[1], SHOTS.keyTurn.zoom[1] + 0.06]}
        grade="monoDeep"
      />
    </AbsoluteFill>
  );
};

/** B — "وتجي باش تشعل الطوموبيل ديالك... والو! البطارية ما بغاتش تعاون" */
export const ProblemScene: React.FC = () => {
  const battery = cue('battery-2');
  return (
    <>
      <ShotClip shot={SHOTS.keyTurn} />
      <Window range={WALOU} name="B2 freeze — والو!">
        <WalouFreeze />
      </Window>
      <ShotClip shot={SHOTS.battery} />

      <Window range={[SHOTS.keyTurn.from, SHOTS.keyTurn.to]} name="B1 scrim">
        <Scrim y={620} height={620} strength={0.5} />
      </Window>
      <Window range={[SHOTS.battery.from, SHOTS.battery.to]} name="B3 scrim">
        <Scrim y={980} height={900} strength={0.55} />
      </Window>

      <KineticCaption cue={cue('battery-1')} />
      <KineticCaption cue={cue('battery-walou')} />
      <Visible range={[battery.in, battery.out]}>
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 770}}>
            <FadeWithCue cue={battery}>
              <BatteryEmpty at={battery.lines[0][0].at} />
            </FadeWithCue>
          </div>
        </AbsoluteFill>
      </Visible>
      <KineticCaption cue={battery} />
    </>
  );
};
