import type { ReactNode } from "react";
import { FolioCtx, SlideMotionCtx } from "./Reveal";

/** Renders one slide without motion (thumbnails, print, static QA). */
export function StaticSlide({ folio, children }: { folio: number; children: ReactNode }) {
  return (
    <SlideMotionCtx.Provider value={{ animate: false, base: 0 }}>
      <FolioCtx.Provider value={folio}>{children}</FolioCtx.Provider>
    </SlideMotionCtx.Provider>
  );
}
