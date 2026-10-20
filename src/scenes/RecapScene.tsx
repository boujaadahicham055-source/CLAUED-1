import React from 'react';
import {ShotClip} from '../components/Footage';
import {KineticCaption} from '../components/KineticCaption';
import {Scrim} from '../components/Overlays';
import {Window} from '../components/Timing';
import {cue, SCENES, SHOTS} from '../data/edit';

/** "ما تخليش مشكل فالبطارية ولا العجلة مفشوشة يعطلك نهارك" — both problems struck out. */
export const RecapScene: React.FC = () => (
  <>
    <ShotClip shot={SHOTS.recapBattery} />
    <ShotClip shot={SHOTS.recapTire} />
    <Window range={SCENES.recap} name="F3 scrim">
      <Scrim y={1060} height={820} strength={0.62} />
    </Window>
    <KineticCaption cue={cue('recap')} />
  </>
);
