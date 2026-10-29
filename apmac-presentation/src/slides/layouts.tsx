import { article, block, chapter, CHAPTERS, DOCUMENT } from "../content/statute";
import { DrawRule, Reveal } from "../components/Reveal";
import { Curtain, Proscenium, Spotlight } from "../components/Stagecraft";
import { ArticleHead, Footer, Hl, pad, Provisions, Rich, verbatimSplit } from "./parts";

const articleRange = (ns: number[]) =>
  ns.length === 1 ? `الفصل ${ns[0]}` : `الفصول من ${ns[0]} إلى ${ns[ns.length - 1]}`;

/* ================================================================
   C — Opening & closing
   ================================================================ */

export function Cover() {
  return (
    <div className="slide slide--dark cover">
      <Spotlight />
      <Proscenium variant="cover" />
      <div className="cover__body">
        <Reveal i={0} as="h1" className="cover__title" y={28}>
          {DOCUMENT.title}
        </Reveal>
        <DrawRule i={2} className="cover__rule" duration={1.2} />
        <Reveal i={3} as="p" className="cover__assoc">
          للجمعية المهنية المغربية للفنانين الممثلين
        </Reveal>
        <Reveal i={4} as="p" className="cover__region">
          {DOCUMENT.region}
        </Reveal>
      </div>
      <Reveal i={7} className="cover__acronym latin-caps" aria-hidden={false}>
        {DOCUMENT.acronym}
      </Reveal>
      <Curtain />
    </div>
  );
}

export function Closing() {
  return (
    <div className="slide slide--dark cover cover--closing">
      <Spotlight at="40% 46%" />
      <Proscenium variant="cover" />
      <div className="cover__body">
        <Reveal i={0} as="p" className="cover__assoc cover__assoc--lead">
          {DOCUMENT.association}
        </Reveal>
        <Reveal i={1} as="p" className="cover__region">
          {DOCUMENT.region}
        </Reveal>
        <DrawRule i={2} className="cover__rule" duration={1.2} />
        <Reveal i={3} as="p" className="cover__closing-title">
          {DOCUMENT.title}
        </Reveal>
      </div>
      <Reveal i={6} className="cover__acronym latin-caps">
        {DOCUMENT.acronym}
      </Reveal>
    </div>
  );
}

/* ================================================================
   Overview of the five chapters
   ================================================================ */

export function Overview() {
  return (
    <div className="slide slide--ivory overview">
      <div className="overview__side">
        <Reveal i={0} className="eyebrow">
          {DOCUMENT.title}
        </Reveal>
        <Reveal i={1} as="h2" className="overview__title">
          خمسة أبواب
          <br />
          وأربعة عشر فصلًا
        </Reveal>
        <DrawRule i={2} className="overview__rule" />
      </div>
      <ol className="overview__list">
        {CHAPTERS.map((c, k) => (
          <Reveal as="li" i={2 + k} key={c.n} className="overview__row">
            <span className="overview__num num">{pad(c.n)}</span>
            <span className="overview__ordinal">{c.ordinal}</span>
            <span className="overview__name">{c.title}</span>
            <span className="overview__range">{articleRange(c.articles)}</span>
          </Reveal>
        ))}
      </ol>
      <Footer />
    </div>
  );
}

/* ================================================================
   B — Chapter divider
   ================================================================ */

export function ChapterDivider({ n }: { n: number }) {
  const c = chapter(n);
  return (
    <div className="slide slide--dark chapter">
      <Proscenium variant="chapter" />
      <div className="chapter__num num" aria-hidden="true">
        {pad(n)}
      </div>
      <div className="chapter__body">
        <Reveal i={0} className="chapter__ordinal">
          {c.ordinal}
        </Reveal>
        <Reveal i={1} as="h2" className="chapter__title">
          {c.title}
        </Reveal>
        <DrawRule i={2} className="chapter__rule" duration={1.1} />
        <ul className="chapter__index">
          {c.articles.map((an, k) => {
            const a = article(an);
            return (
              <Reveal as="li" i={4 + k} key={an}>
                <span className="chapter__index-ord">{a.ordinal}</span>
                {a.heading && <span className="chapter__index-name">{a.heading}</span>}
              </Reveal>
            );
          })}
        </ul>
      </div>
      <Footer tone="dark" />
    </div>
  );
}

/* ================================================================
   Chapter I
   ================================================================ */

export function Art1() {
  const founding = block(1, "founding", "p").text;
  const legal = block(1, "legal-basis", "p").text;
  const personality = block(1, "personality", "p").text;

  const [f1, f2, f3] = verbatimSplit(founding, [
    "تأسست جمعية مهنية مستقلة ثقافية وفنية بجهة سوس ماسة تحت اسم",
    "«الجمعية المهنية المغربية للفنانين الممثلين»، ويشار لها اختصارًا بـ:",
    "Association Professionnelle Marocaine des Artistes Comédiens (APMAC)،",
  ]);
  const [l0, l1, l2, l3] = verbatimSplit(legal, [
    "وذلك وفق مقتضيات",
    "الظهير الشريف المؤرخ في 03 جمادى الأولى سنة 1378 (الموافق لـ 15 نونبر 1958) بتنظيم حق تأسيس الجمعيات، كما وقع تتميمه وتعديله بمقتضى",
    "الظهير الشريف المؤرخ في 6 ربيع الأول 1393 (الموافق لـ 10 أبريل 1973)",
    "والظهير الشريف المؤرخ في 12 جمادى الأولى 1423 (الموافق لـ 23 يوليوز 2002).",
  ]);
  // «name»، | ويشار لها اختصارًا بـ:
  const nameLine = f2.slice(0, f2.indexOf("»") + 2);
  const after = f2.slice(f2.indexOf("»") + 3);

  return (
    <div className="slide slide--ivory art art1">
      <div className="safe">
        <ArticleHead n={1} />
        <div className="art1__grid">
          <div className="art1__name">
            <Reveal i={2} as="p" className="body">
              {f1}
            </Reveal>
            <Reveal i={3} as="p" className="art1__assoc">
              {nameLine}
              <span className="art1__after">{after}</span>
            </Reveal>
            <Reveal i={4} as="p" className="art1__fr ltr" lang="fr" dir="ltr">
              {f3.replace(/،$/, "")}
              <span dir="rtl">،</span>
            </Reveal>
          </div>
          <div className="art1__law">
            <Reveal i={4} as="p" className="support art1__law-intro">
              {l0}
            </Reveal>
            <ol className="timeline">
              {[l1, l2, l3].map((t, k) => (
                <Reveal as="li" i={5 + k} key={k} className="timeline__item">
                  <span className="timeline__year num">{["1958", "1973", "2002"][k]}</span>
                  <span className="timeline__text">{t}</span>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
        <Reveal i={8} as="p" className="art1__personality lead">
          {personality}
        </Reveal>
      </div>
      <Footer />
    </div>
  );
}

export function Art2() {
  const seat = block(2, "seat", "p").text;
  const [s1, s2] = verbatimSplit(seat, [
    "يقع المقر المركزي للجمعية بمدينة أكادير في العنوان:",
    "حي الزيتون بلوك ف رقم 96 تيكوين أكادير.",
  ]);
  return (
    <div className="slide slide--ivory art art2">
      <div className="safe">
        <ArticleHead n={2} />
        <div className="art2__grid">
          <div className="art2__seat">
            <Reveal i={2} as="p" className="lead">
              {s1}
            </Reveal>
            <Reveal i={3} as="p" className="art2__address">
              {s2}
            </Reveal>
          </div>
          <div className="art2__transfer">
            <DrawRule i={4} className="rule--short" />
            <Reveal i={5} as="p" className="body">
              {block(2, "transfer", "p").text}
            </Reveal>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art3() {
  const t = block(3, "duration", "p").text;
  const [a, b] = verbatimSplit(t, [
    "مدة الجمعية غير محدودة،",
    "وتستمر في أداء مهامها إلى حين حلها وفق الشروط القانونية المنصوص عليها في هذا القانون الأساسي.",
  ]);
  return (
    <div className="slide slide--ivory art art3">
      <div className="safe">
        <ArticleHead n={3} />
        <div className="art3__statement">
          <Reveal i={2} as="p" className="art3__big">
            {a}
          </Reveal>
          <DrawRule i={3} className="rule--short" />
          <Reveal i={4} as="p" className="lead art3__rest">
            {b}
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art4() {
  const f = block(4, "framework", "list");
  return (
    <div className="slide slide--ivory art art4">
      <div className="safe">
        <ArticleHead n={4} />
        <Reveal i={2} as="p" className="lead art4__intro">
          {f.intro}
        </Reveal>
        <ol className="register">
          {f.items.map((t, k) => (
            <Reveal as="li" i={3 + k * 0.6} key={k} className="register__row">
              <Rich text={t} />
            </Reveal>
          ))}
        </ol>
        <Reveal i={8} as="p" className="support art4__close">
          {block(4, "compliance", "p").text}
        </Reveal>
      </div>
      <Footer />
    </div>
  );
}

export function Art5Index() {
  const sections = ["s1", "s2", "s3", "s4", "s5", "s6"].map((id) => block(5, id, "section"));
  return (
    <div className="slide slide--ivory art art5i">
      <div className="safe">
        <ArticleHead n={5} />
        <Reveal i={2} as="p" className="lead art5i__aim">
          {block(5, "aim", "p").text}
        </Reveal>
        <Reveal i={3} as="p" className="support art5i__means">
          {block(5, "means", "p").text}
        </Reveal>
        <ol className="art5i__grid">
          {sections.map((s, k) => (
            <Reveal as="li" i={4 + k * 0.6} key={s.id} className="art5i__cell">
              <span className="art5i__label">{s.label}</span>
              <span className="art5i__title">{s.title}</span>
            </Reveal>
          ))}
        </ol>
      </div>
      <Footer />
    </div>
  );
}

export function Art5Section({ id, index }: { id: string; index: number }) {
  const s = block(5, id, "section");
  const dense = s.items.join("").length > 520;
  return (
    <div className="slide slide--ivory art art5s">
      <aside className="art5s__band">
        <Reveal i={0} className="art5s__eyebrow">
          الفصل الخامس · الأهداف المهنية
          <span className="num"> {index}/6</span>
        </Reveal>
        <Reveal i={1} className="art5s__label">
          {s.label}
        </Reveal>
        <Reveal i={2} as="h2" className="art5s__title">
          {s.title}
        </Reveal>
        <DrawRule i={3} className="art5s__rule" />
      </aside>
      <div className={`art5s__body ${dense ? "is-dense" : ""}`}>
        {s.intro && (
          <Reveal i={3} as="p" className="support art5s__intro">
            {s.intro}
          </Reveal>
        )}
        <Provisions items={s.items} start={3} step={0.7} />
      </div>
      <Footer />
    </div>
  );
}

/* ================================================================
   Chapter II
   ================================================================ */

export function Art6() {
  const c = block(6, "conditions", "list");
  return (
    <div className="slide slide--ivory art art6">
      <div className="safe">
        <ArticleHead n={6} />
        <Reveal i={2} as="p" className="lead art6__intro">
          {c.intro}
        </Reveal>
        <ol className="art6__grid">
          {c.items.map((t, k) => (
            <Reveal as="li" i={3 + k * 0.5} key={k} className="art6__item">
              {t}
            </Reveal>
          ))}
        </ol>
        <Reveal i={7} className="note">
          <p className="support">{block(6, "other-categories", "p").text}</p>
        </Reveal>
      </div>
      <Footer />
    </div>
  );
}

export function Art7() {
  const cats = [block(7, "active", "entry"), block(7, "incubated", "entry"), block(7, "honorary", "entry")];
  const activeText = cats[0].text;
  const [activeDef, activeRight] = verbatimSplit(activeText, [
    "الممارسون الفعليون للمهنة والمنخرطون بصفة منتظمة.",
    "(الفئة الوحيدة التي يحق لها التصويت والترشح لهياكل الجمعية)",
  ]);
  return (
    <div className="slide slide--ivory art art7">
      <div className="safe">
        <ArticleHead n={7} />
        <div className="compare">
          <div className="compare__rowhead compare__rowhead--def" />
          {cats.map((c, k) => (
            <Reveal key={c.id} i={2 + k} className={`compare__col ${k === 0 ? "is-key" : ""}`}>
              <h3 className="compare__title">{c.title}</h3>
              <p className="compare__def">{k === 0 ? activeDef : c.text}</p>
            </Reveal>
          ))}
          <Reveal i={5} className="compare__rowhead">
            التصويت والترشح لهياكل الجمعية
          </Reveal>
          <Reveal i={6} className="compare__cell is-key">
            <span className="compare__mark">يحق</span>
            <span className="compare__quote">{activeRight}</span>
          </Reveal>
          <Reveal i={6.5} className="compare__cell">
            <span className="compare__mark compare__mark--no">لا يحق</span>
          </Reveal>
          <Reveal i={7} className="compare__cell">
            <span className="compare__mark compare__mark--no">لا يحق</span>
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art8() {
  const t = block(8, "loss", "p").text;
  return (
    <div className="slide slide--ivory art art8">
      <div className="safe">
        <ArticleHead n={8} />
        <div className="art8__body">
          <Reveal i={2} as="p" className="art8__text">
            <Hl
              text={t}
              phrases={[
                "بالاستقالة",
                "الإقالة",
                "عدم أداء الانخراط لمدة سنة تامة",
                "الوفاة",
                "لأي سبب يتعارض مع ركائز الجمعية",
                "وبقرار من المكتب التنفيذي المسير",
              ]}
            />
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ================================================================
   Chapter III
   ================================================================ */

export function Art9() {
  const role = block(9, "role", "p").text;
  const [r1, r2, r3] = verbatimSplit(role, [
    "يعتبر الجمع العام أعلى هيئة تقريرية في الجمعية،",
    "ويجتمع في دورة عادية مرة في كل ولاية من 05 سنوات،",
    "وقد ينعقد بصفة استثنائية كلما دعت الضرورة إلى ذلك، بقرار من المكتب المسير أو بطلب من ثلثي أعضائه،",
  ]);
  const agenda = block(9, "agenda", "list");
  return (
    <div className="slide slide--ivory art art9">
      <div className="safe">
        <ArticleHead n={9} />
        <div className="art9__grid">
          <div className="art9__facts">
            <Reveal i={2} className="fact fact--key">
              <span className="fact__label">المكانة</span>
              <p className="fact__text">{r1}</p>
            </Reveal>
            <Reveal i={3} className="fact">
              <span className="fact__label">الدورة العادية</span>
              <p className="fact__text">{r2}</p>
            </Reveal>
            <Reveal i={4} className="fact">
              <span className="fact__label">الدورة الاستثنائية</span>
              <p className="fact__text">{r3}</p>
            </Reveal>
            <Reveal i={5} className="fact">
              <span className="fact__label">التركيبة</span>
              <p className="fact__text">{block(9, "composition", "p").text}</p>
            </Reveal>
          </div>
          <div className="art9__agenda">
            <Reveal i={5} as="h3" className="col-head">
              {agenda.intro}
            </Reveal>
            <Provisions items={agenda.items} start={6} step={0.6} className="prov--dense" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const BUREAU_TIERS: { ids: string[] }[] = [
  { ids: ["president"] },
  { ids: ["vp1", "vp2"] },
  { ids: ["sg", "dsg", "treasurer", "dtreasurer"] },
  { ids: ["counsellors"] },
];

export function Art10Structure() {
  const short = (id: string) => {
    const t = block(10, id, "role").title;
    return id === "counsellors" ? "المستشارون" : t;
  };
  return (
    <div className="slide slide--ivory art art10a">
      <div className="safe">
        <ArticleHead n={10} part={{ label: "الانتخاب والتركيبة", index: 1, total: 4 }} />
        <div className="art10a__grid">
          <div className="art10a__text">
            <Reveal i={2} as="p" className="art10a__term">
              {block(10, "term", "p").text}
            </Reveal>
            <Reveal i={3} as="p" className="body-dense">
              {block(10, "vote", "p").text}
            </Reveal>
            <Reveal i={4} as="p" className="body-dense">
              {block(10, "mandate", "p").text}
            </Reveal>
            <Reveal i={5} as="p" className="body-dense art10a__size">
              {block(10, "size", "p").text}
            </Reveal>
          </div>
          <div className="org" aria-label="هيكل المكتب المسير">
            {BUREAU_TIERS.map((tier, k) => (
              <Reveal i={4 + k * 0.8} key={k} className={`org__tier org__tier--${k}`}>
                {tier.ids.map((id) => (
                  <div key={id} className={`org__node ${id === "president" ? "is-head" : ""}`}>
                    {short(id)}
                  </div>
                ))}
              </Reveal>
            ))}
            <Reveal i={8} as="p" className="org__caption">
              <span className="num">09</span> أعضاء على الأقل · <span className="num">13</span> عضوًا على الأكثر
            </Reveal>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Role({ id, i, wide = false }: { id: string; i: number; wide?: boolean }) {
  const r = block(10, id, "role");
  const m = r.title.match(/^(.*?)\s*\((.*)\)$/);
  return (
    <Reveal i={i} className={`role ${wide ? "role--wide" : ""}`}>
      <h3 className="role__title">
        {m ? m[1] : r.title}
        {m && <span className="role__note"> ({m[2]})</span>}
      </h3>
      <ul className="prov prov--dense">
        {r.items.map((t, k) => (
          <li key={k}>{t}</li>
        ))}
      </ul>
    </Reveal>
  );
}

export function Art10Presidency() {
  return (
    <div className="slide slide--ivory art art10b">
      <div className="safe">
        <ArticleHead n={10} part={{ label: "الرئاسة", index: 2, total: 4 }} />
        <div className="roles roles--presidency">
          <Role id="president" i={2} wide />
          <div className="roles__stack">
            <Role id="vp1" i={3} />
            <Role id="vp2" i={4} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art10Offices() {
  return (
    <div className="slide slide--ivory art art10c">
      <div className="safe">
        <ArticleHead n={10} part={{ label: "الكتابة العامة وأمانة المال", index: 3, total: 4 }} />
        <div className="roles roles--grid">
          <Role id="sg" i={2} />
          <Role id="treasurer" i={3} />
          <Role id="dsg" i={4} />
          <Role id="dtreasurer" i={5} />
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art10Duties() {
  const d = block(10, "bureau-duties", "list");
  return (
    <div className="slide slide--ivory art art10d">
      <div className="safe">
        <ArticleHead n={10} part={{ label: "المستشارون ومهام المكتب التنفيذي", index: 4, total: 4 }} />
        <div className="art10d__grid">
          <Role id="counsellors" i={2} />
          <div className="art10d__duties">
            <Reveal i={3} as="h3" className="col-head">
              {d.intro}
            </Reveal>
            <Provisions items={d.items} start={4} step={0.6} className="prov--dense" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function Art11() {
  return (
    <div className="slide slide--ivory art art11">
      <div className="safe">
        <ArticleHead n={11} />
        <div className="art11__grid">
          <section className="art11__council">
            <Reveal i={2} className="art11__figures">
              <div className="figure">
                <span className="figure__value">مرتين</span>
                <span className="figure__label">في السنة</span>
              </div>
              <div className="figure">
                <span className="figure__value num">20</span>
                <span className="figure__label">عضوًا عاملًا على الأكثر</span>
              </div>
            </Reveal>
            <Reveal i={3} as="p" className="body-dense">
              <Hl
                text={block(11, "council", "p").text}
                phrases={["مرتين في السنة", "20 عضوًا عاملًا على الأكثر", "مناديب الأقاليم الستة في حالة انتدابهم"]}
              />
            </Reveal>
          </section>
          <section className="art11__deleg">
            <Reveal i={4} as="h3" className="col-head col-head--burgundy">
              {block(11, "delegations-head", "subhead").text}
            </Reveal>
            <Reveal i={5} as="p" className="body-dense">
              {block(11, "delegations", "p").text}
            </Reveal>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ================================================================
   Chapter IV
   ================================================================ */

export function Art12() {
  const ids = ["legal", "training", "employment", "mediation", "international"];
  const items = ids.map((id) => block(12, id, "entry"));
  return (
    <div className="slide slide--ivory art art12">
      <div className="safe">
        <ArticleHead n={12} />
        <div className="committees">
          <Reveal i={2} className="committees__head">
            <span>{block(12, "intro", "p").text}</span>
            <span className="committees__lead">{items[0].lead}</span>
          </Reveal>
          {items.map((c, k) => (
            <Reveal key={c.id} i={3 + k * 0.6} className="committees__row">
              <h3 className="committees__name">{c.title}</h3>
              <p className="committees__text">{c.text}</p>
            </Reveal>
          ))}
          <Reveal i={7} as="p" className="support committees__note">
            {block(12, "flex", "p").text}
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ================================================================
   Chapter V
   ================================================================ */

export function Art13() {
  const r = block(13, "resources", "list");
  return (
    <div className="slide slide--ivory art art13">
      <div className="safe">
        <ArticleHead n={13} />
        <ol className="ledger">
          {r.items.map((t, k) => (
            <Reveal as="li" i={2 + k * 0.6} key={k} className="ledger__row">
              <span className="ledger__mark" aria-hidden="true" />
              <span className="ledger__text">{t}</span>
            </Reveal>
          ))}
        </ol>
      </div>
      <Footer />
    </div>
  );
}

export function Art14() {
  return (
    <div className="slide slide--ivory art art14">
      <div className="safe">
        <ArticleHead n={14} />
        <div className="art14__body">
          <DrawRule i={2} className="rule--short" />
          <Reveal i={3} as="p" className="art14__text">
            {block(14, "dissolution", "p").text}
          </Reveal>
        </div>
      </div>
      <Footer />
    </div>
  );
}
