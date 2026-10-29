import { createContext, createElement, useContext, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export interface SlideMotion {
  /** false in overview thumbnails, print/PDF export and static QA captures */
  animate: boolean;
  /** delay (s) before the first content group appears; depends on the transition family */
  base: number;
}

export const SlideMotionCtx = createContext<SlideMotion>({ animate: false, base: 0 });

/** 1-based folio of the slide being rendered (for footers). */
export const FolioCtx = createContext<number>(0);

type Tag = "div" | "p" | "li" | "h1" | "h2" | "h3" | "span" | "section" | "ul" | "header";

interface RevealProps {
  i?: number;
  as?: Tag;
  className?: string;
  style?: CSSProperties;
  y?: number;
  children?: ReactNode;
  "aria-hidden"?: boolean;
  lang?: string;
  dir?: "ltr" | "rtl";
}

/**
 * Staggered entrance for one meaningful content group.
 * Animates whole blocks only (opacity + small vertical offset) — never
 * individual Arabic letters or words, so contextual shaping is untouched.
 */
export function Reveal({ i = 0, as = "div", className, style, y = 18, children, ...rest }: RevealProps) {
  const { animate, base } = useContext(SlideMotionCtx);
  const reduce = useReducedMotion();
  if (!animate) return createElement(as, { className, style, ...rest }, children);
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      style={style}
      {...rest}
      initial={{ opacity: 0, y: reduce ? 0 : y, willChange: "transform, opacity" }}
      animate={{ opacity: 1, y: 0, transitionEnd: { willChange: "auto" } }}
      transition={{ duration: reduce ? 0.25 : 0.7, delay: reduce ? 0 : base + i * 0.09, ease: EASE }}
    >
      {children}
    </M>
  );
}

/** Thin gold rule that draws from the reading start (right edge in RTL). */
export function DrawRule({ i = 0, className = "", duration = 0.9 }: { i?: number; className?: string; duration?: number }) {
  const { animate, base } = useContext(SlideMotionCtx);
  const reduce = useReducedMotion();
  if (!animate || reduce) return <div className={`rule ${className}`} />;
  return (
    <motion.div
      className={`rule ${className}`}
      style={{ transformOrigin: "100% 50%" }}
      initial={{ scaleX: 0, willChange: "transform" }}
      animate={{ scaleX: 1, transitionEnd: { willChange: "auto" } }}
      transition={{ duration, delay: base + i * 0.09, ease: EASE }}
    />
  );
}
