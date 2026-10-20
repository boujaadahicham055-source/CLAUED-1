import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {ShotClip, StillFrame} from '../components/Footage';
import {HighlightRing, Segments} from '../components/Graphics';
import {TokenLine, useCueExit, useReveal} from '../components/KineticCaption';
import {TopScrim} from '../components/Overlays';
import {Visible, Window} from '../components/Timing';
import type {Cue} from '../data/edit';
import {cue, SCENES, SHOTS} from '../data/edit';
import {COLORS, EASE_OUT, FONT_FAMILY, FPS, sec} from '../theme';

const FEATURES = [1, 2, 3, 4].map((i) => cue(`feature-${i}`));
const CARD_RANGE: readonly [number, number] = [SHOTS.inflatorWheel.to, SCENES.features[1]];
const POWER_BANK_RANGE: readonly [number, number] = [CARD_RANGE[0], FEATURES[3].in];
const LIGHT_RANGE: readonly [number, number] = [FEATURES[3].in, CARD_RANGE[1]];

const CARD = {left: 90, top: 600, width: 900, height: 900};
// Light button (bulb icon) on the hand-held unit, source px (271, 743) of 576x1024.
const LIGHT_BUTTON = {x: 0.47, y: 0.726};
const LIGHT_FOCUS = {x: 0.47, y: 0.7};

const RIGHT = 84;
const HEADER_TOP = 292;

const activeFeature = (t: number) => {
  for (let i = FEATURES.length - 1; i >= 0; i--) {
    if (t >= FEATURES[i].in) {
      return i;
    }
  }
  return 0;
};

/** Index + progress row: persists across the four features, number slides on change. */
const IndexRow: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const i = activeFeature(t);
  const change = interpolate(frame - FEATURES[i].in * FPS, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  const enter = interpolate(frame - FEATURES[0].in * FPS, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: HEADER_TOP,
        right: RIGHT,
        left: RIGHT,
        display: 'flex',
        flexDirection: 'row',
        direction: 'rtl',
        alignItems: 'center',
        gap: 26,
        opacity: enter,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{display: 'flex', direction: 'ltr', alignItems: 'baseline', gap: 10}}>
        <span style={{fontSize: 40, fontWeight: 700, color: COLORS.muted}}>/ 04</span>
        <span
          style={{
            fontSize: 66,
            fontWeight: 900,
            color: COLORS.accent,
            display: 'inline-block',
            opacity: change,
            transform: `translateY(${(1 - change) * 26}px)`,
          }}
        >
          {String(i + 1).padStart(2, '0')}
        </span>
      </div>
      <div style={{flex: 1, height: 2, backgroundColor: COLORS.hairline}} />
      <Segments
        filledAt={FEATURES.map((f) => f.in)}
        activeIndex={i}
        width={54}
        height={8}
        gap={10}
      />
    </div>
  );
};

const FeatureLabel: React.FC<{c: Cue}> = ({c}) => {
  const exit = useCueExit(c);
  const latin = useReveal(c.lines[0][0].at + 0.12, 12);
  return (
    <div
      style={{
        position: 'absolute',
        top: HEADER_TOP + 82,
        right: RIGHT,
        left: RIGHT,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 20}px)`,
        filter: exit > 0.02 ? `blur(${exit * 8}px)` : undefined,
      }}
    >
      <TokenLine tokens={c.lines[0]} justify="flex-start" gap={30} />
      <div
        style={{
          marginTop: 2,
          textAlign: 'right',
          fontFamily: FONT_FAMILY,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: '0.28em',
          color: COLORS.muted,
          opacity: latin.opacity,
          transform: `translateY(${(1 - latin.p) * 14}px)`,
        }}
      >
        {c.latin}
      </div>
    </div>
  );
};

const CardFrame: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 11], [0, 1], {extrapolateRight: 'clamp', easing: EASE_OUT});
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 80% 45% at 50% 62%, ${COLORS.graphiteLight} 0%, ${COLORS.graphite} 55%, ${COLORS.ink} 100%)`,
        opacity: interpolate(frame, [0, 5], [0, 1], {extrapolateRight: 'clamp'}),
      }}
    >
      <div
        style={{
          position: 'absolute',
          ...CARD,
          borderRadius: 44,
          overflow: 'hidden',
          border: `2px solid ${COLORS.hairline}`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.55)',
          opacity: enter,
          transform: `translateY(${(1 - enter) * 50}px) scale(${0.96 + 0.04 * enter})`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** 04: the light function is not demonstrated in the footage, so the card points at
 * the real light button instead of faking a beam; the frame dims on "الظلام". */
const LightCard: React.FC = () => {
  const frame = useCurrentFrame();
  const duration = sec(LIGHT_RANGE[1]) - sec(LIGHT_RANGE[0]);
  const darkAt = sec(27.42 - LIGHT_RANGE[0]);
  const dim = interpolate(frame, [darkAt - 2, darkAt + 10], [1, 0.42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ledAt = FEATURES[3].lines[0][1].at;
  return (
    <StillFrame
      name="device-buttons"
      durationInFrames={duration}
      focus={LIGHT_FOCUS}
      zoom={[1.25, 1.3]}
      grade="natural"
      width={CARD.width}
      height={CARD.height}
      extraFilter={`brightness(${dim})`}
    >
      {(box) => {
        const p = {x: box.left + LIGHT_BUTTON.x * box.width, y: box.top + LIGHT_BUTTON.y * box.height};
        return (
          <AbsoluteFill>
            <HighlightRingRelative x={p.x} y={p.y} at={ledAt} start={LIGHT_RANGE[0]} />
          </AbsoluteFill>
        );
      }}
    </StillFrame>
  );
};

/** HighlightRing expects absolute time; inside the card Sequence the frame is relative. */
const HighlightRingRelative: React.FC<{x: number; y: number; at: number; start: number}> = ({x, y, at, start}) => (
  <HighlightRing x={x} y={y} r={70} at={at - start} />
);

/** E — four services, synchronized to "بوستر / منفاخ / باور بانك / ضو LED". */
export const FeatureShowcase: React.FC = () => (
  <>
    <ShotClip shot={SHOTS.boosterClamp} />
    <ShotClip shot={SHOTS.boosterDash} />
    <ShotClip shot={SHOTS.inflatorGauge} />
    <ShotClip shot={SHOTS.inflatorWheel} />
    <Window range={[SCENES.features[0], CARD_RANGE[0]]} name="E scrim">
      <TopScrim height={860} strength={0.82} />
    </Window>

    <Window range={CARD_RANGE} name="E cards 03-04">
      <CardFrame>
        <Sequence durationInFrames={sec(POWER_BANK_RANGE[1]) - sec(POWER_BANK_RANGE[0])} name="03 power bank">
          <StillFrame
            name="device-front"
            durationInFrames={sec(POWER_BANK_RANGE[1]) - sec(POWER_BANK_RANGE[0])}
            focus={{x: 0.4, y: 0.7}}
            zoom={[1.0, 1.05]}
            grade="natural"
            width={CARD.width}
            height={CARD.height}
          />
        </Sequence>
        <Sequence from={sec(LIGHT_RANGE[0]) - sec(CARD_RANGE[0])} name="04 LED light">
          <LightCard />
        </Sequence>
      </CardFrame>
    </Window>

    <Visible range={[FEATURES[0].in, SCENES.features[1]]}>
      <AbsoluteFill>
        <IndexRow />
        {FEATURES.map((c) => (
          <Visible key={c.id} range={[c.in, c.out]}>
            <FeatureLabel c={c} />
          </Visible>
        ))}
      </AbsoluteFill>
    </Visible>
  </>
);
