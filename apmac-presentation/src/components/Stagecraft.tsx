import { useContext } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, SlideMotionCtx } from "./Reveal";

/**
 * Abstract proscenium: a hairline stage frame with a valance line and two
 * wing lines. Pure geometry — no curtain illustration, no ornament.
 */
export function Proscenium({ variant = "cover" }: { variant?: "cover" | "chapter" }) {
  const { animate } = useContext(SlideMotionCtx);
  const reduce = useReducedMotion();
  const draw = animate && !reduce;
  const d = variant === "cover" ? 0.5 : 0.35;

  const paths =
    variant === "cover"
      ? [
          { d: "M72 72 H1848 V1008 H72 Z", o: 0.38, delay: 0 },
          { d: "M72 168 H1848", o: 0.55, delay: 0.25 },
          { d: "M232 168 V1008", o: 0.22, delay: 0.45 },
          { d: "M1688 168 V1008", o: 0.22, delay: 0.45 },
          { d: "M232 912 H1688", o: 0.22, delay: 0.6 },
        ]
      : [
          { d: "M72 72 H1848 V1008 H72 Z", o: 0.28, delay: 0 },
          { d: "M72 168 H1848", o: 0.42, delay: 0.15 },
          { d: "M232 168 V1008", o: 0.16, delay: 0.3 },
          { d: "M1688 168 V1008", o: 0.16, delay: 0.3 },
        ];

  return (
    <svg className="proscenium" viewBox="0 0 1920 1080" aria-hidden="true">
      {paths.map((p, idx) =>
        draw ? (
          <motion.path
            key={idx}
            d={p.d}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={1}
            strokeOpacity={p.o}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, delay: d + p.delay, ease: EASE }}
          />
        ) : (
          <path key={idx} d={p.d} fill="none" stroke="var(--gold)" strokeWidth={1} strokeOpacity={p.o} />
        ),
      )}
    </svg>
  );
}

/** A single, very soft pool of stage light. Ivory at low opacity — no hue shift. */
export function Spotlight({ at = "64% 40%" }: { at?: string }) {
  const { animate } = useContext(SlideMotionCtx);
  const reduce = useReducedMotion();
  const style = {
    background: `radial-gradient(ellipse 46% 62% at ${at}, rgb(244 240 232 / 0.075), rgb(244 240 232 / 0.025) 45%, transparent 72%)`,
  };
  if (!animate || reduce) return <div className="spotlight" style={style} aria-hidden="true" />;
  return (
    <motion.div
      className="spotlight"
      style={style}
      aria-hidden="true"
      initial={{ opacity: 0, x: 140, willChange: "transform, opacity" }}
      animate={{ opacity: 1, x: 0, transitionEnd: { willChange: "auto" } }}
      transition={{ duration: 2.4, delay: 0.6, ease: EASE }}
    />
  );
}

/**
 * Curtain reveal, abstracted: two charcoal panels part from the centre.
 * Only their hairline gold leading edges are visible, travelling outward.
 */
export function Curtain() {
  const { animate } = useContext(SlideMotionCtx);
  const reduce = useReducedMotion();
  if (!animate || reduce) return null;
  const t = { duration: 1.7, delay: 0.25, ease: EASE };
  return (
    <div className="curtain" aria-hidden="true">
      <motion.div className="curtain__panel curtain__panel--r" initial={{ x: "0%" }} animate={{ x: "101%" }} transition={t} />
      <motion.div className="curtain__panel curtain__panel--l" initial={{ x: "0%" }} animate={{ x: "-101%" }} transition={t} />
    </div>
  );
}
