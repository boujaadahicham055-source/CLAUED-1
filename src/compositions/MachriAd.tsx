import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CallToAction, Wordmark} from '../components/CallToAction';
import {FeatureReveal} from '../components/FeatureReveal';
import {KineticText, NumberReveal} from '../components/KineticText';
import {FourInOneGrid, RingHighlight} from '../components/ProductHero';
import {ProductShot} from '../components/ProductShot';
import {COMPOSITION_FRAMES, VO, cue} from '../data/audioTimeline';
import {type Enter, SHOTS} from '../data/shotMap';
import {COLORS} from '../styles/brand';

// Entrances that blend with the outgoing shot need it to keep rendering underneath.
const OVERLAPPING: Enter[] = ['dissolve', 'focusPull', 'wipe', 'blinds', 'zoomIn'];
const EXTRA_TAIL: Record<string, number> = {sh09b: 6, sh12b: 12};

const tailFor = (i: number) => {
  const next = SHOTS[i + 1];
  const own = EXTRA_TAIL[SHOTS[i].id] ?? 0;
  if (next && next.from === SHOTS[i].to && OVERLAPPING.includes(next.enter)) {
    return Math.max(own, next.enterDur ?? 8);
  }
  return own;
};

const SFX: {file: string; at: number; volume: number}[] = [
  {file: 'sfx/impact.wav', at: 116, volume: 0.14}, // "ما بغاتش تديماري!" freeze
  {file: 'sfx/swell.wav', at: 304, volume: 0.2}, // lead-in to the reveal
  {file: 'sfx/impact.wav', at: 331, volume: 0.24}, // product reveal
  {file: 'sfx/whoosh.wav', at: 363, volume: 0.2}, // features open (wipe)
  {file: 'sfx/whoosh.wav', at: 462, volume: 0.15}, // power bank (blinds)
  {file: 'sfx/impact.wav', at: 557, volume: 0.26}, // "4"
  {file: 'sfx/whoosh.wav', at: 771, volume: 0.15}, // closing card
  {file: 'sfx/tick.wav', at: 777, volume: 0.22}, // CTA lands
];

const Grading: React.FC = () => (
  <>
    {/* Top scrim for headline legibility; bottom scrim grounds the frame under platform UI. */}
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(8,9,11,0.86) 0px, rgba(8,9,11,0.62) 380px, rgba(8,9,11,0.25) 600px, rgba(8,9,11,0) 760px)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(8,9,11,0.85) 0px, rgba(8,9,11,0.35) 330px, rgba(8,9,11,0) 560px)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(120% 75% at 50% 52%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)'}} />
  </>
);

/** Quiet brand presence through the ad; the full wordmark only lands on the closing card. */
const BrandTag: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 10, 760, 772], [0, 0.6, 0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (o <= 0) {
    return null;
  }
  return <Wordmark size={26} inAt={-20} y={1566} opacity={o} />;
};

const Typography: React.FC = () => {
  const c = cue;
  return (
    <>
      {/* S01 hook */}
      <KineticText text={c('T01a').text} inAt={c('T01a').in} outAt={c('T01a').out} variant="MaskedReveal" size={78} weight={800} color={COLORS.inkSoft} y={392} />
      <KineticText text={c('T01b').text} inAt={c('T01b').in} outAt={c('T01b').out} variant="MaskedReveal" size={150} y={520} stagger={4} />
      <KineticText text={c('T01c').text} inAt={c('T01c').in} outAt={c('T01c').out} variant="DirectionalSlide" size={50} weight={700} color={COLORS.inkSoft} y={652} stagger={3} />

      {/* S02 problem */}
      <KineticText text={c('T02a').text} inAt={c('T02a').in} outAt={c('T02a').out} variant="DirectionalSlide" size={64} weight={700} color={COLORS.inkSoft} y={392} />
      <KineticText text={c('T02b').text} inAt={c('T02b').in} outAt={c('T02b').out} variant="SoftScale" size={116} y={524} stagger={2} wordColors={{0: COLORS.danger, 1: COLORS.danger}} />

      {/* S03 old battery -> cold */}
      <KineticText text={c('T03a').text} inAt={c('T03a').in} outAt={c('T03a').out} variant="DirectionalSlide" size={64} weight={700} color={COLORS.inkSoft} y={392} />
      <KineticText
        text={c('T03b').text}
        inAt={c('T03b').in}
        outAt={c('T03b').out}
        variant="MaskedReveal"
        size={128}
        y={522}
        stagger={7}
        marks={[{word: 1, type: 'underline', color: COLORS.accent, at: 211}]}
      />
      <KineticText text={c('T03c').text} inAt={c('T03c').in} outAt={c('T03c').out} variant="DirectionalSlide" size={64} weight={700} color={COLORS.inkSoft} y={392} />
      <KineticText
        text={c('T03d').text}
        inAt={c('T03d').in}
        outAt={c('T03d').out}
        variant="SoftScale"
        outVariant="fade"
        size={190}
        y={548}
        color={COLORS.ice}
        marks={[{word: 0, type: 'glow', color: '#7FC4FF', at: 250}]}
      />

      {/* S04 emotional turn: type-led, with the natural pause after "علاش" */}
      <KineticText text={c('T04a').text} inAt={c('T04a').in} outAt={c('T04a').out} variant="MaskedReveal" size={96} weight={800} color={COLORS.inkSoft} y={812} />
      <KineticText text={c('T04b').text} inAt={c('T04b').in} outAt={c('T04b').out} variant="MaskedReveal" size={150} y={960} wordIn={[278, 286]} />

      {/* S05 reveal */}
      <KineticText text={c('T05').text} inAt={c('T05').in} outAt={c('T05').out} variant="DirectionalSlide" size={70} weight={800} y={430} stagger={3} />

      {/* S06-S09 the four functions */}
      <FeatureReveal index={1} title={c('T06').text} railIn={366} titleIn={c('T06').in} outAt={c('T06').out} />
      <FeatureReveal index={2} title={c('T07').text} railIn={418} titleIn={c('T07').in} outAt={c('T07').out} />
      <FeatureReveal index={3} title={c('T08').text} dir="ltr" railIn={466} titleIn={c('T08').in} outAt={c('T08').out} size={112} letterSpacing={4} accentWords={[0]} />
      <FeatureReveal index={4} title={c('T09').text} railIn={512} titleIn={c('T09').in} outAt={c('T09').out} size={124} />

      {/* S10 payoff */}
      <NumberReveal inAt={c('T10a').in} outAt={c('T10a').out} size={420} x={790} y={500} />
      <KineticText text={c('T10b').text} inAt={c('T10b').in} outAt={c('T10b').out} variant="MaskedReveal" size={150} x={400} y={540} />
      <KineticText
        text="فجِهاز واحد"
        inAt={c('T10c').in}
        outAt={c('T10c').out}
        variant="MaskedReveal"
        size={150}
        y={470}
        wordIn={[c('T10c').in, c('T10d').in]}
        wordColors={{1: COLORS.accent}}
        marks={[{word: 1, type: 'underline', color: COLORS.accent, at: 608}]}
      />

      {/* S11 convenience */}
      <KineticText text={c('T11a').text} inAt={c('T11a').in} outAt={c('T11a').out} variant="DirectionalSlide" size={64} weight={700} color={COLORS.inkSoft} y={392} />
      <KineticText text={c('T11b').text} inAt={c('T11b').in} outAt={c('T11b').out} variant="SoftScale" size={150} y={522} wordColors={{1: COLORS.accent}} />

      {/* S12 stock (no timers, no counters) */}
      <StockBadge />
      <KineticText
        text={c('T12b').text}
        inAt={c('T12b').in}
        outAt={c('T12b').out}
        variant="MaskedReveal"
        size={112}
        y={600}
        stagger={5}
        marks={[{word: 1, type: 'underline', color: COLORS.accent, at: 752}]}
      />
    </>
  );
};

/** "رجع للستوك" as a solid pill label (MaskedReveal inside an accent pill). */
const StockBadge: React.FC = () => {
  const f = useCurrentFrame();
  const t = cue('T12a');
  const p = interpolate(f - t.in, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(f - t.out, [0, 7], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (p <= 0 || o <= 0) {
    return null;
  }
  return (
    <>
      <div style={{position: 'absolute', left: 540 - 300, top: 440 - 76, width: 600, height: 152, borderRadius: 76, background: COLORS.accent, opacity: o, clipPath: `inset(0 ${(1 - p) * 50}% 0 ${(1 - p) * 50}% round 76px)`, boxShadow: `0 16px 50px ${COLORS.accent}55`}} />
      <KineticText text={t.text} inAt={t.in + 3} outAt={t.out} variant="MaskedReveal" size={92} y={440} stagger={4} />
    </>
  );
};

export const MachriAd: React.FC = () => {
  const s05 = SHOTS.find((s) => s.id === 'sh05')!;
  return (
    <AbsoluteFill style={{backgroundColor: COLORS.bg}}>
      {/* Master narration: one continuous, untouched track from frame 0. */}
      <Html5Audio src={staticFile(VO.file)} volume={1} />
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={45} layout="none" name={`sfx ${s.file}@${s.at}`}>
          <Html5Audio src={staticFile(s.file)} volume={s.volume} />
        </Sequence>
      ))}

      {SHOTS.map((shot, i) => (
        <Sequence key={shot.id} from={shot.from} durationInFrames={shot.to - shot.from + tailFor(i)} name={`${shot.scene} ${shot.id}`}>
          <ProductShot shot={shot} />
          {shot.id === 'sh05' ? <RingHighlight shot={s05} center={[228, 310]} radius={118} inAt={12} outAt={29} /> : null}
        </Sequence>
      ))}

      <Sequence from={556} durationInFrames={45} name="S10 4-in-1 grid">
        <FourInOneGrid collapseAt={33} />
      </Sequence>

      <Grading />
      <BrandTag />
      <Typography />

      <Sequence from={773} durationInFrames={COMPOSITION_FRAMES - 773} name="S13 call to action">
        <CallToAction ctaIn={cue('T13a').in - 773} trustIn={cue('T13b').in - 773} wordmarkIn={cue('T13w').in - 773} />
      </Sequence>
    </AbsoluteFill>
  );
};
