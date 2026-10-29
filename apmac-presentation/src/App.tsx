import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Deck } from "./components/Deck";
import { StaticSlide } from "./components/SlideFrame";
import { SLIDES } from "./content/deck";

const params = new URLSearchParams(window.location.search);

/** All slides stacked, one per 1920×1080 page — used for the PDF export. */
function PrintDeck() {
  useEffect(() => {
    document.body.classList.add("print-mode");
  }, []);
  return (
    <main>
      {SLIDES.map((s, i) => (
        <section key={s.id} className="print-sheet" data-slide={i + 1}>
          <StaticSlide folio={i + 1}>{s.render()}</StaticSlide>
        </section>
      ))}
    </main>
  );
}

export default function App() {
  if (params.has("print")) return <PrintDeck />;
  return (
    <MotionConfig reducedMotion="user">
      <Deck animate={!params.has("static")} />
    </MotionConfig>
  );
}
