import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { SLIDES, type Family } from "../content/deck";
import { ARTICLES, CHAPTERS } from "../content/statute";
import { EASE, FolioCtx, SlideMotionCtx } from "./Reveal";
import { StaticSlide } from "./SlideFrame";
import { StatuteText } from "./StatuteText";
import { pad } from "../slides/parts";

interface Nav {
  index: number;
  /** +1 forward (content travels toward the reading end, i.e. leftward), −1 back */
  dir: 1 | -1;
  family: Family;
  reduce: boolean;
}

const MASK_EASE = [0.65, 0, 0.35, 1] as const;

/* Three transition families ------------------------------------------------ */
const slideVariants: Variants = {
  initial: ({ dir, family, reduce }: Nav) => {
    if (reduce) return { opacity: 0 };
    if (family === "chapter")
      return { opacity: 1, x: 0, clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" };
    if (family === "cinematic") return { opacity: 0, x: 0, clipPath: "inset(0% 0% 0% 0%)" };
    // A — RTL: going forward, the incoming page arrives from the left (reading end)
    return { opacity: 0, x: -72 * dir, clipPath: "inset(0% 0% 0% 0%)" };
  },
  animate: ({ family, reduce }: Nav) => {
    if (reduce) return { opacity: 1, zIndex: 2, transition: { duration: 0.3 } };
    if (family === "chapter")
      return {
        opacity: 1,
        x: 0,
        zIndex: 2,
        clipPath: "inset(0% 0% 0% 0%)",
        transition: { duration: 1.0, ease: MASK_EASE, zIndex: { duration: 0 } },
      };
    if (family === "cinematic")
      return { opacity: 1, x: 0, zIndex: 2, transition: { duration: 1.1, ease: EASE, zIndex: { duration: 0 } } };
    return { opacity: 1, x: 0, zIndex: 2, transition: { duration: 0.78, ease: EASE, zIndex: { duration: 0 } } };
  },
  exit: ({ dir, family, reduce }: Nav) => {
    if (reduce) return { opacity: 0, zIndex: 1, transition: { duration: 0.25 } };
    if (family === "chapter")
      return { opacity: 0.0, x: 36 * dir, zIndex: 1, transition: { duration: 0.95, ease: EASE, zIndex: { duration: 0 } } };
    if (family === "cinematic")
      return { opacity: 0, zIndex: 1, transition: { duration: 0.8, ease: EASE, zIndex: { duration: 0 } } };
    return { opacity: 0, x: 48 * dir, zIndex: 1, transition: { duration: 0.55, ease: EASE, zIndex: { duration: 0 } } };
  },
};

const BASE_DELAY: Record<Family, number> = { article: 0.2, chapter: 0.5, cinematic: 1.0 };

/* Fit the fixed 1920×1080 stage into any viewport (letterboxed) ------------- */
function useFit() {
  const [fit, setFit] = useState({ scale: 1, x: 0, y: 0 });
  useLayoutEffect(() => {
    const on = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 1920, h / 1080);
      setFit({ scale, x: (w - 1920 * scale) / 2, y: (h - 1080 * scale) / 2 });
    };
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return fit;
}

function indexFromHash(): number {
  const m = window.location.hash.match(/^#\/(\d+)/);
  if (!m) return 0;
  return Math.min(Math.max(parseInt(m[1], 10) - 1, 0), SLIDES.length - 1);
}

export function Deck({ animate = true }: { animate?: boolean }) {
  const reduce = !!useReducedMotion();
  const fit = useFit();
  const [nav, setNav] = useState<Nav>(() => {
    const index = indexFromHash();
    return { index, dir: 1, family: SLIDES[index].family, reduce };
  });
  const [overview, setOverview] = useState(false);
  const [source, setSource] = useState(false);
  const [chrome, setChrome] = useState(true);
  const [pinnedHidden, setPinnedHidden] = useState(false);
  const idle = useRef<number | undefined>(undefined);
  const total = SLIDES.length;

  const go = useCallback(
    (target: number) => {
      setNav((cur) => {
        const index = Math.min(Math.max(target, 0), total - 1);
        if (index === cur.index) return cur;
        return { index, dir: index > cur.index ? 1 : -1, family: SLIDES[index].family, reduce };
      });
    },
    [total, reduce],
  );
  const next = useCallback(() => setNav((c) => (c.index >= total - 1 ? c : { index: c.index + 1, dir: 1, family: SLIDES[c.index + 1].family, reduce })), [total, reduce]);
  const prev = useCallback(() => setNav((c) => (c.index <= 0 ? c : { index: c.index - 1, dir: -1, family: SLIDES[c.index - 1].family, reduce })), [reduce]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  /* URL hash <-> slide ----------------------------------------------------- */
  useEffect(() => {
    const h = `#/${nav.index + 1}`;
    if (window.location.hash !== h) window.history.replaceState(null, "", h);
  }, [nav.index]);
  useEffect(() => {
    const on = () => go(indexFromHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, [go]);

  /* Keyboard ---------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      if (k === "Escape") {
        if (overview || source) {
          setOverview(false);
          setSource(false);
          e.preventDefault();
        }
        return;
      }
      if (overview) return; // overview handles its own focus/clicks
      switch (k) {
        // RTL: the reading direction runs leftward, so ← advances and → goes back.
        case "ArrowLeft":
        case "PageDown":
        case "ArrowDown":
        case " ":
        case "Enter":
          e.preventDefault();
          next();
          break;
        case "ArrowRight":
        case "PageUp":
        case "ArrowUp":
        case "Backspace":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(total - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "g":
        case "G":
        case "o":
        case "O":
          setOverview((v) => !v);
          setSource(false);
          break;
        case "t":
        case "T":
        case "s":
        case "S":
          setSource((v) => !v);
          break;
        case "h":
        case "H":
          setPinnedHidden((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, total, overview, source, toggleFullscreen]);

  /* Auto-hiding controls ---------------------------------------------------- */
  useEffect(() => {
    const wake = () => {
      setChrome(true);
      window.clearTimeout(idle.current);
      idle.current = window.setTimeout(() => setChrome(false), 2600);
    };
    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    return () => {
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("touchstart", wake);
      window.clearTimeout(idle.current);
    };
  }, []);

  /* Touch swipe: in RTL, swiping toward the right advances ------------------ */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx > 0) next();
    else prev();
  };

  const slide = SLIDES[nav.index];
  const showChrome = chrome && !pinnedHidden;

  const sourceArticles = useMemo(() => {
    if (slide.articles.length) return ARTICLES.filter((a) => slide.articles.includes(a.n));
    const ch = slide.id.match(/^ch(\d)$/);
    if (ch) {
      const c = CHAPTERS.find((x) => x.n === Number(ch[1]))!;
      return ARTICLES.filter((a) => c.articles.includes(a.n));
    }
    return ARTICLES;
  }, [slide]);

  return (
    <div className="viewport" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div
        className="stage"
        style={{ transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.scale})` }}
        data-slide={nav.index + 1}
        aria-roledescription="عرض تقديمي"
      >
        {animate ? (
          <AnimatePresence initial={true} custom={nav}>
            <motion.div
              key={slide.id}
              className="slide-layer"
              custom={nav}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              aria-label={`الشريحة ${nav.index + 1} من ${total}`}
            >
              <SlideMotionCtx.Provider value={{ animate: true, base: reduce ? 0 : BASE_DELAY[nav.family] }}>
                <FolioCtx.Provider value={nav.index + 1}>{slide.render()}</FolioCtx.Provider>
              </SlideMotionCtx.Provider>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="slide-layer" key={slide.id}>
            <StaticSlide folio={nav.index + 1}>{slide.render()}</StaticSlide>
          </div>
        )}

        {animate && !reduce && nav.family === "chapter" && (
          <motion.div
            key={`sweep-${nav.index}`}
            className="chapter-sweep"
            initial={{ x: nav.dir > 0 ? 1918 : 0, opacity: 1 }}
            animate={{ x: nav.dir > 0 ? 0 : 1918, opacity: [1, 1, 0] }}
            transition={{ duration: 1.0, ease: MASK_EASE, opacity: { duration: 1.15, times: [0, 0.8, 1] } }}
          />
        )}

        <div className="progress" style={{ width: `${((nav.index + 1) / total) * 100}%` }} aria-hidden="true" />
      </div>

      {/* Presenter controls (outside the slide, never part of the composition) */}
      <nav className={`controls ${showChrome ? "" : "is-hidden"}`} aria-label="التحكم في العرض">
        <button type="button" className="controls__btn" onClick={prev} disabled={nav.index === 0} aria-label="الشريحة السابقة">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <span className="controls__pos num" aria-live="polite">
          {pad(nav.index + 1)} / {pad(total)}
        </span>
        <button type="button" className="controls__btn" onClick={next} disabled={nav.index === total - 1} aria-label="الشريحة التالية">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <span className="controls__sep" aria-hidden="true" />
        <button type="button" className="controls__text" onClick={() => { setOverview((v) => !v); setSource(false); }} aria-pressed={overview}>
          الفهرس
        </button>
        <button type="button" className="controls__text" onClick={() => setSource((v) => !v)} aria-pressed={source}>
          النص الأصلي
        </button>
        <button type="button" className="controls__text" onClick={toggleFullscreen}>
          ملء الشاشة
        </button>
      </nav>

      <AnimatePresence>
        {overview && (
          <OverviewGrid
            current={nav.index}
            onPick={(i) => {
              go(i);
              setOverview(false);
            }}
            onClose={() => setOverview(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {source && (
          <motion.aside
            className="source"
            aria-label="النص الأصلي للفصول"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <div className="source__head">
              <span>النص الأصلي</span>
              <button type="button" className="source__close" onClick={() => setSource(false)} aria-label="إغلاق">
                ×
              </button>
            </div>
            <div className="source__scroll">
              <StatuteText articles={sourceArticles} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function OverviewGrid({ current, onPick, onClose }: { current: number; onPick: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumbW, setThumbW] = useState(300);
  useLayoutEffect(() => {
    const on = () => {
      const el = ref.current;
      if (!el) return;
      const cols = window.innerWidth < 900 ? 3 : 5;
      setThumbW((el.clientWidth - (cols - 1) * 20) / cols);
    };
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => {
    const btn = ref.current?.querySelector<HTMLButtonElement>(`[data-i="${current}"]`);
    btn?.focus({ preventScroll: false });
    btn?.scrollIntoView({ block: "center" });
  }, [current]);
  const s = thumbW / 1920;
  return (
    <motion.div
      className="ov"
      role="dialog"
      aria-label="فهرس الشرائح"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="ov__grid" ref={ref}>
        {SLIDES.map((sl, i) => (
          <button
            key={sl.id}
            type="button"
            data-i={i}
            className={`ov__item ${i === current ? "is-current" : ""}`}
            onClick={() => onPick(i)}
          >
            <span className="ov__thumb" style={{ width: thumbW, height: thumbW * (1080 / 1920) }}>
              <span className="ov__canvas" style={{ transform: `scale(${s})` }}>
                <StaticSlide folio={i + 1}>{sl.render()}</StaticSlide>
              </span>
            </span>
            <span className="ov__label">
              <span className="num">{pad(i + 1)}</span> {sl.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
