/**
 * Generates docs/APPENDIX_FULL_TEXT.md (complete statute wording)
 * from the same data module the slides use.
 *   node --experimental-strip-types scripts/full-text.mjs
 */
import fs from "node:fs";
import path from "node:path";
const root = new URL("..", import.meta.url).pathname;
const { ARTICLES, CHAPTERS, DOCUMENT } = await import(path.join(root, "src/content/statute.ts"));

const lines = [`# ${DOCUMENT.title} — ${DOCUMENT.association} – ${DOCUMENT.region}`, "", `<div dir="rtl" lang="ar">`, ""];
let ch = 0;
for (const a of ARTICLES) {
  if (a.chapter !== ch) {
    ch = a.chapter;
    const c = CHAPTERS.find((x) => x.n === ch);
    lines.push(`## ${c.ordinal}: ${c.title}`, "");
  }
  lines.push(`### ${a.ordinal}${a.heading ? `: ${a.heading}` : ""}`, "");
  for (const b of a.blocks) {
    if (b.kind === "p") lines.push(b.text, "");
    if (b.kind === "subhead") lines.push(`**${b.text}:**`, "");
    if (b.kind === "list") {
      if (b.intro) lines.push(b.intro, "");
      for (const i of b.items) lines.push(`- ${i}`);
      lines.push("");
    }
    if (b.kind === "section") {
      lines.push(`**${b.label}: ${b.title}**`, "");
      if (b.intro) lines.push(b.intro, "");
      for (const i of b.items) lines.push(`- ${i}`);
      lines.push("");
    }
    if (b.kind === "role") {
      lines.push(`**${b.title}:**`, "");
      for (const i of b.items) lines.push(`- ${i}`);
      lines.push("");
    }
    if (b.kind === "entry") lines.push(`**${b.title}:** ${b.lead ? b.lead + " " : ""}${b.text}`, "");
  }
}
lines.push("</div>", "");
fs.writeFileSync(path.join(root, "docs/APPENDIX_FULL_TEXT.md"), lines.join("\n"));
console.log("written docs/APPENDIX_FULL_TEXT.md");
