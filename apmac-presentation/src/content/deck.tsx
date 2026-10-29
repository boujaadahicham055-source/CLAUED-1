import type { ReactNode } from "react";
import { ARTICLES } from "./statute";
import * as L from "../slides/layouts";

/** Transition families: A article · B chapter · C opening/closing. */
export type Family = "article" | "chapter" | "cinematic";

export interface SlideDef {
  id: string;
  /** label used in the quick-navigation overview */
  label: string;
  family: Family;
  /** articles shown (drives the reference panel) */
  articles: number[];
  /** statute blocks reproduced on this slide, as "article:blockId" */
  covers: string[];
  render: () => ReactNode;
}

const all = (n: number) => ARTICLES.find((a) => a.n === n)!.blocks.map((b) => `${n}:${b.id}`);

export const SLIDES: SlideDef[] = [
  { id: "cover", label: "الغلاف", family: "cinematic", articles: [], covers: [], render: () => <L.Cover /> },
  { id: "overview", label: "أبواب القانون الأساسي", family: "article", articles: [], covers: [], render: () => <L.Overview /> },

  { id: "ch1", label: "الباب الأول", family: "chapter", articles: [], covers: [], render: () => <L.ChapterDivider n={1} /> },
  { id: "a1", label: "الفصل الأول · التأسيس", family: "article", articles: [1], covers: all(1), render: () => <L.Art1 /> },
  { id: "a2", label: "الفصل الثاني · المقر", family: "article", articles: [2], covers: all(2), render: () => <L.Art2 /> },
  { id: "a3", label: "الفصل الثالث · المدة", family: "article", articles: [3], covers: all(3), render: () => <L.Art3 /> },
  { id: "a4", label: "الفصل الرابع · الإطار القانوني المرجعي", family: "article", articles: [4], covers: all(4), render: () => <L.Art4 /> },
  { id: "a5", label: "الفصل الخامس · الأهداف المهنية", family: "article", articles: [5], covers: ["5:aim", "5:means"], render: () => <L.Art5Index /> },
  ...["s1", "s2", "s3", "s4", "s5", "s6"].map((s, k) => ({
    id: `a5-${s}`,
    label: `الفصل الخامس · ${["أولًا", "ثانيًا", "ثالثًا", "رابعًا", "خامسًا", "سادسًا"][k]}`,
    family: "article" as const,
    articles: [5],
    covers: [`5:${s}`],
    render: () => <L.Art5Section id={s} index={k + 1} />,
  })),

  { id: "ch2", label: "الباب الثاني", family: "chapter", articles: [], covers: [], render: () => <L.ChapterDivider n={2} /> },
  { id: "a6", label: "الفصل السادس · شروط العضوية", family: "article", articles: [6], covers: all(6), render: () => <L.Art6 /> },
  { id: "a7", label: "الفصل السابع · أنواع الأعضاء", family: "article", articles: [7], covers: all(7), render: () => <L.Art7 /> },
  { id: "a8", label: "الفصل الثامن · فقدان العضوية", family: "article", articles: [8], covers: all(8), render: () => <L.Art8 /> },

  { id: "ch3", label: "الباب الثالث", family: "chapter", articles: [], covers: [], render: () => <L.ChapterDivider n={3} /> },
  { id: "a9", label: "الفصل التاسع · الجمع العام العادي", family: "article", articles: [9], covers: all(9), render: () => <L.Art9 /> },
  {
    id: "a10-1",
    label: "الفصل العاشر · الانتخاب والتركيبة",
    family: "article",
    articles: [10],
    covers: ["10:term", "10:vote", "10:mandate", "10:size"],
    render: () => <L.Art10Structure />,
  },
  {
    id: "a10-2",
    label: "الفصل العاشر · الرئاسة",
    family: "article",
    articles: [10],
    covers: ["10:president", "10:vp1", "10:vp2"],
    render: () => <L.Art10Presidency />,
  },
  {
    id: "a10-3",
    label: "الفصل العاشر · الكتابة العامة وأمانة المال",
    family: "article",
    articles: [10],
    covers: ["10:sg", "10:dsg", "10:treasurer", "10:dtreasurer"],
    render: () => <L.Art10Offices />,
  },
  {
    id: "a10-4",
    label: "الفصل العاشر · المستشارون ومهام المكتب",
    family: "article",
    articles: [10],
    covers: ["10:counsellors", "10:bureau-duties"],
    render: () => <L.Art10Duties />,
  },
  { id: "a11", label: "الفصل الحادي عشر · مجلس الجمعية", family: "article", articles: [11], covers: all(11), render: () => <L.Art11 /> },

  { id: "ch4", label: "الباب الرابع", family: "chapter", articles: [], covers: [], render: () => <L.ChapterDivider n={4} /> },
  { id: "a12", label: "الفصل الثاني عشر · اللجان", family: "article", articles: [12], covers: all(12), render: () => <L.Art12 /> },

  { id: "ch5", label: "الباب الخامس", family: "chapter", articles: [], covers: [], render: () => <L.ChapterDivider n={5} /> },
  { id: "a13", label: "الفصل الثالث عشر · الموارد", family: "article", articles: [13], covers: all(13), render: () => <L.Art13 /> },
  { id: "a14", label: "الفصل الرابع عشر · التصفية والحل", family: "article", articles: [14], covers: all(14), render: () => <L.Art14 /> },

  { id: "closing", label: "الختام", family: "cinematic", articles: [], covers: [], render: () => <L.Closing /> },
];

/** Every statute block must be reproduced on at least one slide. */
export function coverageReport() {
  const covered = new Set(SLIDES.flatMap((s) => s.covers));
  const expected = ARTICLES.flatMap((a) => a.blocks.map((b) => `${a.n}:${b.id}`));
  const missing = expected.filter((k) => !covered.has(k));
  const map = ARTICLES.map((a) => ({
    article: a.n,
    slides: SLIDES.map((s, i) => (s.articles.includes(a.n) ? i + 1 : 0)).filter(Boolean),
  }));
  return { total: expected.length, missing, map };
}
