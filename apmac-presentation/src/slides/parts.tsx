import { Fragment, useContext, type ReactNode } from "react";
import { article, chapter, DOCUMENT } from "../content/statute";
import { FolioCtx, Reveal } from "../components/Reveal";

export const pad = (n: number) => String(n).padStart(2, "0");

const LATIN_RUN = /([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .,'’()-]*[A-Za-zÀ-ÿ)])/g;

/** Renders Arabic text, isolating embedded Latin runs as LTR so bidi stays correct. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(LATIN_RUN);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="ltr" lang="fr" dir="ltr">
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

/** Emphasises exact sub-phrases of a verbatim sentence without altering it. */
export function Hl({ text, phrases, className = "hl" }: { text: string; phrases: string[]; className?: string }) {
  const out: ReactNode[] = [];
  let rest = text;
  let k = 0;
  for (const ph of phrases) {
    const at = rest.indexOf(ph);
    if (at < 0) throw new Error(`Highlight phrase not found verbatim: ${ph}`);
    if (at > 0) out.push(<Fragment key={k++}>{rest.slice(0, at)}</Fragment>);
    out.push(
      <em key={k++} className={className}>
        {ph}
      </em>,
    );
    rest = rest.slice(at + ph.length);
  }
  if (rest) out.push(<Fragment key={k++}>{rest}</Fragment>);
  return <>{out}</>;
}

/**
 * Splits a verbatim statutory sentence into display fragments and asserts
 * that, re-joined, they reproduce the source exactly (nothing dropped/added).
 */
export function verbatimSplit(text: string, parts: string[]): string[] {
  if (parts.join(" ") !== text) {
    throw new Error(`Verbatim split mismatch:\n${parts.join(" ")}\n≠\n${text}`);
  }
  return parts;
}

interface HeadProps {
  n: number;
  /** presentation-only continuation label for multi-slide articles */
  part?: { label: string; index: number; total: number };
  tone?: "ivory" | "dark";
  className?: string;
}

/** Article masthead: chapter · exact article ordinal, exact heading, numeral. */
export function ArticleHead({ n, part, className = "" }: HeadProps) {
  const a = article(n);
  const c = chapter(a.chapter);
  return (
    <header className={`ahead ${className}`}>
      <div className="ahead__text">
        <Reveal i={0} className="ahead__eyebrow">
          <span className="ahead__chapter">{c.ordinal}</span>
          <span className="ahead__dot" aria-hidden="true" />
          {a.heading ? <span className="ahead__ordinal">{a.ordinal}</span> : <span className="ahead__ordinal">{c.title}</span>}
          {part && (
            <>
              <span className="ahead__dot" aria-hidden="true" />
              <span className="ahead__part">
                {part.label}
                <span className="ahead__count num">
                  {" "}
                  {part.index}/{part.total}
                </span>
              </span>
            </>
          )}
        </Reveal>
        <Reveal i={1} as="h2" className="ahead__title">
          {a.heading ?? a.ordinal}
        </Reveal>
      </div>
      <Reveal i={0} className="ahead__num num" aria-hidden={true}>
        {pad(n)}
      </Reveal>
    </header>
  );
}

export function Footer({ tone = "ivory" }: { tone?: "ivory" | "dark" }) {
  const folio = useContext(FolioCtx);
  return (
    <footer className={`folio folio--${tone}`}>
      <span>
        {DOCUMENT.title} · {DOCUMENT.association} – {DOCUMENT.region}
      </span>
      <span className="num">{pad(folio)}</span>
    </footer>
  );
}

/** Provision list with hairline gold markers. */
export function Provisions({
  items,
  start = 2,
  className = "",
  step = 1,
}: {
  items: string[];
  start?: number;
  className?: string;
  step?: number;
}) {
  return (
    <ul className={`prov ${className}`}>
      {items.map((t, i) => (
        <Reveal as="li" key={i} i={start + i * step}>
          <Rich text={t} />
        </Reveal>
      ))}
    </ul>
  );
}
