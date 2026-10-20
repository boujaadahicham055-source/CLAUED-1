import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ShotClip} from '../components/Footage';
import {HighlightRing, Segments} from '../components/Graphics';
import {KineticCaption} from '../components/KineticCaption';
import {TopScrim} from '../components/Overlays';
import {FadeWithCue, Visible, Window, useShotPoint} from '../components/Timing';
import type {Shot} from '../data/edit';
import {cue, SHOTS} from '../data/edit';

const ScrimFor: React.FC<{shot: Shot; height?: number; strength?: number}> = ({shot, height, strength}) => (
  <Window range={[shot.from, shot.to]} name={`${shot.id} scrim`}>
    <TopScrim height={height} strength={strength} />
  </Window>
);

// Device position in the wheel shot (source px 346-484 x 588-818 of 576x1024).
const DEVICE_IN_WHEEL_SHOT = {x: 0.72, y: 0.69};

const CompactRing: React.FC = () => {
  const c = cue('compact');
  const p = useShotPoint(SHOTS.compact, DEVICE_IN_WHEEL_SHOT);
  return <HighlightRing x={p.x} y={p.y} r={250} at={c.lines[1][0].at} until={c.out} />;
};

/** D3/D4 — "هاد الجهاز اللي كيبان صغير، غادي تستافد من أربع خدمات فمنتوج واحد" */
export const ProductIntro: React.FC = () => {
  const four = cue('four-services');
  const servicesAt = four.lines[0][1].at;
  return (
    <>
      <ShotClip shot={SHOTS.compact} />
      <ShotClip shot={SHOTS.fourServices} />
      <ScrimFor shot={SHOTS.compact} height={900} strength={0.72} />
      <ScrimFor shot={SHOTS.fourServices} height={1050} strength={0.8} />
      <Visible range={[cue('compact').in, cue('compact').out]}>
        <CompactRing />
      </Visible>
      <KineticCaption cue={cue('compact')} />
      <KineticCaption cue={four} />
      <Visible range={[four.in, four.out]}>
        <AbsoluteFill style={{alignItems: 'center'}}>
          <div style={{position: 'absolute', top: 805}}>
            <FadeWithCue cue={four}>
              <Segments filledAt={[0, 1, 2, 3].map((i) => servicesAt + i * 0.09)} width={120} height={10} gap={16} />
            </FadeWithCue>
          </div>
        </AbsoluteFill>
      </Visible>
    </>
  );
};

/** F1/F2 — "تخيّل! هادشي كامل فجهاز واحد، عملي وساهل تخليه معاك فالطوموبيل" */
export const ValueScene: React.FC = () => (
  <>
    <ShotClip shot={SHOTS.oneDevice} />
    <ShotClip shot={SHOTS.practical} />
    <ShotClip shot={SHOTS.inTheCar} />
    <ScrimFor shot={SHOTS.oneDevice} height={980} strength={0.72} />
    <ScrimFor shot={SHOTS.practical} height={900} strength={0.72} />
    <ScrimFor shot={SHOTS.inTheCar} height={980} strength={0.78} />
    <KineticCaption cue={cue('imagine')} />
    <KineticCaption cue={cue('one-device')} />
    <KineticCaption cue={cue('practical')} />
    <KineticCaption cue={cue('in-the-car')} />
  </>
);
