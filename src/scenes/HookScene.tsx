import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ShotClip} from '../components/Footage';
import {KineticCaption} from '../components/KineticCaption';
import {Scrim} from '../components/Overlays';
import {Window} from '../components/Timing';
import {cue, SCENES, SHOTS} from '../data/edit';

/** A — "أخيب شعور... تفيق معطّل على الخدمة؟" Breakdown image, jump-zoom on "معطّل". */
export const HookScene: React.FC = () => (
  <>
    <ShotClip shot={SHOTS.hookWide} />
    <ShotClip shot={SHOTS.hookPunch} />
    <Window range={SCENES.hook} name="A scrim">
      <Scrim y={900} height={900} strength={0.5} />
      {/* the unit sits in the lower engine bay — keep it out of the problem beat */}
      <AbsoluteFill
        style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 62%, rgba(0,0,0,0.92) 82%, #000 100%)'}}
      />
    </Window>
    <KineticCaption cue={cue('hook-1')} />
    <KineticCaption cue={cue('hook-2')} />
  </>
);
