import type { Article } from "../content/statute";
import { chapter } from "../content/statute";
import { Rich } from "../slides/parts";

/** Full original wording of the given articles (reference panel). */
export function StatuteText({ articles }: { articles: Article[] }) {
  let lastChapter = 0;
  return (
    <div className="statute">
      {articles.map((a) => {
        const showChapter = a.chapter !== lastChapter;
        lastChapter = a.chapter;
        const c = chapter(a.chapter);
        return (
          <article key={a.n} className="statute__article">
            {showChapter && (
              <h3 className="statute__chapter">
                {c.ordinal}: {c.title}
              </h3>
            )}
            <h4 className="statute__heading">
              {a.ordinal}
              {a.heading ? `: ${a.heading}` : ""}
            </h4>
            {a.blocks.map((b) => {
              switch (b.kind) {
                case "p":
                  return (
                    <p key={b.id}>
                      <Rich text={b.text} />
                    </p>
                  );
                case "subhead":
                  return (
                    <h5 key={b.id} className="statute__sub">
                      {b.text}:
                    </h5>
                  );
                case "list":
                  return (
                    <div key={b.id}>
                      {b.intro && <p>{b.intro}</p>}
                      <ul>
                        {b.items.map((t, i) => (
                          <li key={i}>
                            <Rich text={t} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                case "section":
                  return (
                    <div key={b.id}>
                      <h5 className="statute__sub">
                        {b.label}: {b.title}
                      </h5>
                      {b.intro && <p>{b.intro}</p>}
                      <ul>
                        {b.items.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  );
                case "role":
                  return (
                    <div key={b.id}>
                      <h5 className="statute__sub">{b.title}:</h5>
                      <ul>
                        {b.items.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  );
                case "entry":
                  return (
                    <p key={b.id}>
                      <strong>{b.title}:</strong> {b.lead ? `${b.lead} ` : ""}
                      {b.text}
                    </p>
                  );
              }
            })}
          </article>
        );
      })}
    </div>
  );
}
