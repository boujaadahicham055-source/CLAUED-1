const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa6");

const OUT = process.argv[2] || "deck.pptx";

// Palette: theatre ink + stage gold
const P = {
  bg: "15111D", card: "221B2D", card2: "2B2338", line: "3A3049",
  gold: "C9A44C", goldSoft: "E2C987", text: "F4EFE6", muted: "B4ABC0", ghost: "201A2A",
};
const FONT = "Arial";
const W = 13.333, H = 7.5, MX = 0.6, CW = W - 2 * MX;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "القانون الأساسي - APMAC";
pres.author = "APMAC";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

pres.defineSlideMaster({
  title: "APMAC_BASE",
  background: { color: P.bg },
  objects: [
    { text: { text: "APMAC  ·  القانون الأساسي", options: { x: MX, y: 6.98, w: 6, h: 0.3, fontFace: FONT, fontSize: 10, color: P.muted, align: "left", margin: 0 } } },
  ],
  slideNumber: { x: W - MX - 0.6, y: 6.98, w: 0.6, h: 0.3, fontFace: FONT, fontSize: 10, color: P.gold, align: "right", margin: 0 },
});
pres.defineSlideMaster({ title: "APMAC_COVER", background: { color: P.bg }, objects: [] });

// ---------- helpers ----------
const iconCache = {};
async function icon(name, color) {
  const key = name + color;
  if (!iconCache[key]) {
    const C = fa[name];
    if (!C) throw new Error("missing icon " + name);
    const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(C, { color: "#" + color, size: 256 }));
    const buf = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
    iconCache[key] = "image/png;base64," + buf.toString("base64");
  }
  return iconCache[key];
}

function T(slide, text, o) {
  slide.addText(text, {
    fontFace: FONT, color: P.text, rtlMode: true, lang: "ar-MA", align: "right", valign: "top",
    isTextBox: true, margin: 0, ...o,
  });
}

function card(slide, x, y, w, h, fill = P.card, name = "card") {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: P.line, width: 0.75 }, objectName: name,
    shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 10, offset: 3, angle: 90 },
  });
}

async function badge(slide, x, y, d, iconName, inverted = false) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: inverted ? P.bg : P.gold }, line: { color: P.gold, width: 1 }, objectName: "badge" });
  const pad = d * 0.27;
  slide.addImage({ data: await icon(iconName, inverted ? P.gold : P.bg), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: "" });
}

function bullets(items, size, opts = {}) {
  return items.map((t, i) => ({
    text: t,
    options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, fontSize: size, color: opts.color || P.text, paraSpaceAfter: opts.after ?? 6, rtlMode: true },
  }));
}

// Article frame: kicker + title on the right, big faint number on the left
async function article(num, kicker, title, iconName, notes) {
  const s = pres.addSlide({ masterName: "APMAC_BASE", sectionTitle: currentSection });
  s._kind = "article";
  T(s, String(num).padStart(2, "0"), { x: MX - 0.05, y: 0.2, w: 3, h: 1.5, fontSize: 96, bold: true, color: P.ghost, align: "left", rtlMode: false });
  await badge(s, W - MX - 0.72, 0.62, 0.72, iconName);
  T(s, kicker, { x: MX, y: 0.5, w: CW - 0.95, h: 0.4, fontSize: 16, color: P.gold, bold: true });
  T(s, title, { x: MX, y: 0.86, w: CW - 0.95, h: 0.8, fontSize: 36, bold: true, valign: "middle" });
  if (notes) s.addNotes(notes);
  return s;
}

let currentSection = "";
const ORD = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس"];
async function divider(i, title, chapters, iconName) {
  currentSection = `الباب ${ORD[i]}`;
  pres.addSection({ title: currentSection });
  const s = pres.addSlide({ masterName: "APMAC_COVER", sectionTitle: currentSection });
  s._kind = "divider";
  T(s, String(i + 1).padStart(2, "0"), { x: 0.3, y: 0.6, w: 6, h: 4, fontSize: 260, bold: true, color: P.ghost, align: "left", rtlMode: false });
  await badge(s, W - 1.6 - MX + 0.6, 1.75, 1.0, iconName, true);
  T(s, `الباب ${ORD[i]}`, { x: MX, y: 2.95, w: CW, h: 0.55, fontSize: 22, color: P.gold, bold: true });
  T(s, title, { x: MX, y: 3.5, w: CW, h: 1.2, fontSize: 48, bold: true, valign: "middle" });
  T(s, chapters, { x: MX, y: 4.85, w: CW, h: 0.5, fontSize: 16, color: P.muted });
}

// ---------- build ----------
(async () => {
  // Cover
  currentSection = "التقديم";
  pres.addSection({ title: currentSection });
  {
    const s = pres.addSlide({ masterName: "APMAC_COVER", sectionTitle: currentSection });
    s._kind = "cover";
    s.addShape(pres.shapes.OVAL, { x: W / 2 - 0.75, y: 0.75, w: 1.5, h: 1.5, fill: { color: P.bg }, line: { color: P.gold, width: 1.5 }, objectName: "ring" });
    s.addImage({ data: await icon("FaMasksTheater", P.gold), x: W / 2 - 0.42, y: 1.08, w: 0.84, h: 0.84, altText: "قناع المسرح" });
    T(s, "القانون الأساسي", { x: MX, y: 2.55, w: CW, h: 1.1, fontSize: 60, bold: true, align: "center", valign: "middle" });
    T(s, "الجمعية المهنية المغربية للفنانين الممثلين", { x: MX, y: 3.75, w: CW, h: 0.7, fontSize: 30, align: "center", valign: "middle" });
    T(s, "سوس ماسة", { x: MX, y: 4.45, w: CW, h: 0.55, fontSize: 24, color: P.gold, bold: true, align: "center", valign: "middle" });
    T(s, "A P M A C", { x: MX, y: 5.55, w: CW, h: 0.4, fontSize: 16, color: P.goldSoft, bold: true, align: "center", rtlMode: false, charSpacing: 6 });
    T(s, "Association Professionnelle Marocaine des Artistes Comédiens", { x: MX, y: 5.95, w: CW, h: 0.35, fontSize: 12, color: P.muted, align: "center", rtlMode: false });
  }

  // ===== الباب الأول =====
  await divider(0, "التأسيس · الاسم · المقر · الأهداف", "الفصول من 1 إلى 5", "FaLandmark");

  { // الفصل 1
    const s = await article(1, "الفصل الأول", "التأسيس", "FaFileSignature");
    card(s, MX, 2.05, 4.3, 4.6, P.card2);
    T(s, "الاسم المختصر", { x: MX + 0.3, y: 2.35, w: 3.7, h: 0.4, fontSize: 14, color: P.muted, align: "left" });
    T(s, "APMAC", { x: MX + 0.3, y: 2.8, w: 3.7, h: 1.0, fontSize: 54, bold: true, color: P.gold, align: "left", rtlMode: false });
    T(s, "Association Professionnelle Marocaine des Artistes Comédiens", { x: MX + 0.3, y: 3.95, w: 3.7, h: 0.9, fontSize: 14, color: P.text, align: "left", rtlMode: false });
    T(s, "الشخصية المعنوية والاستقلال المالي", { x: MX + 0.3, y: 5.55, w: 3.7, h: 0.7, fontSize: 15, color: P.goldSoft, bold: true, align: "left", valign: "bottom" });
    T(s, bullets([
      "جمعية مهنية مستقلة، ثقافية وفنية، بجهة سوس ماسة.",
      "تحمل اسم «الجمعية المهنية المغربية للفنانين الممثلين».",
      "تأسست وفق ظهير 15 نونبر 1958 المنظم لحق تأسيس الجمعيات، كما وقع تتميمه وتعديله بظهيري 10 أبريل 1973 و23 يوليوز 2002.",
      "تتمتع بالشخصية المعنوية والاستقلال المالي في حدود القوانين الجاري بها العمل.",
    ], 18, { after: 14 }), { x: MX + 4.75, y: 2.15, w: CW - 4.75, h: 4.5 });
  }

  { // الفصل 2
    const s = await article(2, "الفصل الثاني", "المقر", "FaLocationDot");
    card(s, MX, 2.05, CW, 2.45);
    T(s, "المقر المركزي للجمعية", { x: MX + 0.5, y: 2.4, w: CW - 1, h: 0.45, fontSize: 18, color: P.gold, bold: true });
    T(s, "حي الزيتون، بلوك ف، رقم 96 — تيكوين، أكادير", { x: MX + 0.5, y: 2.95, w: CW - 1, h: 0.9, fontSize: 34, bold: true, valign: "middle" });
    card(s, MX, 4.8, CW, 1.85, P.card2);
    T(s, "إمكانية نقل المقر", { x: MX + 0.5, y: 5.05, w: CW - 1, h: 0.4, fontSize: 18, color: P.gold, bold: true });
    T(s, "يجوز نقله إلى أي مدينة أخرى داخل تراب الجهة بقرار من الجمع العام أو من المكتب المسير، مع إشعار السلطات المختصة طبقا للقانون.", { x: MX + 0.5, y: 5.5, w: CW - 1, h: 0.95, fontSize: 18 });
  }

  { // الفصل 3
    const s = await article(3, "الفصل الثالث", "المدة", "FaHourglassHalf");
    card(s, MX, 2.05, 4.6, 4.6, P.card2);
    T(s, "∞", { x: MX, y: 2.35, w: 4.6, h: 2.2, fontSize: 140, color: P.gold, align: "center", valign: "middle", rtlMode: false });
    T(s, "غير محدودة", { x: MX, y: 4.85, w: 4.6, h: 0.8, fontSize: 32, bold: true, align: "center", valign: "middle" });
    T(s, "مدة الجمعية غير محدودة، وتستمر في أداء مهامها إلى حين حلها وفق الشروط القانونية المنصوص عليها في هذا القانون الأساسي.", { x: MX + 5.1, y: 2.9, w: CW - 5.1, h: 2.4, fontSize: 26, valign: "middle", lineSpacingMultiple: 1.2 });
  }

  { // الفصل 4
    const s = await article(4, "الفصل الرابع", "الإطار القانوني المرجعي", "FaScaleBalanced");
    T(s, "تخضع الجمعية في تنظيمها وتسييرها وتدبير أنشطتها إلى:", { x: MX, y: 1.8, w: CW, h: 0.4, fontSize: 16, color: P.muted });
    const items = [
      "الظهير الشريف المنظم لحق تأسيس الجمعيات",
      "القانون رقم 68.16 المتعلق بالفنان والمهن الفنية",
      "مدونة الشغل المغربية (القانون 65.99)",
      "تشريعات حقوق المؤلف والحقوق المجاورة",
      "قوانين الحماية الاجتماعية والتغطية الصحية",
      "القوانين الجبائية المعمول بها",
      "الاتفاقيات الدولية المصادق عليها في المجال الثقافي والفني",
    ];
    const cw = (CW - 0.3) / 2, ch = 0.92, gy = 0.18;
    for (let i = 0; i < items.length; i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const x = col === 0 ? MX + cw + 0.3 : MX; // RTL: first column on the right
      const y = 2.35 + row * (ch + gy);
      card(s, x, y, cw, ch);
      s.addShape(pres.shapes.OVAL, { x: x + cw - 0.75, y: y + 0.21, w: 0.5, h: 0.5, fill: { color: P.bg }, line: { color: P.gold, width: 1 } });
      T(s, String(i + 1), { x: x + cw - 0.75, y: y + 0.21, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: P.gold, align: "center", valign: "middle", rtlMode: false });
      T(s, items[i], { x: x + 0.25, y, w: cw - 1.15, h: ch, fontSize: 16, valign: "middle" });
    }
    const x = MX, y = 2.35 + 3 * (ch + gy);
    card(s, x, y, cw, ch, P.gold);
    T(s, "وتلتزم الجمعية بملاءمة أنشطتها مع هذه النصوص واحترامها في جميع تدخلاتها.", { x: x + 0.3, y, w: cw - 0.6, h: ch, fontSize: 15, bold: true, color: P.bg, valign: "middle" });
  }

  { // الفصل 5
    const s = await article(5, "الفصل الخامس", "الأهداف المهنية", "FaBullseye");
    T(s, "النهوض بأوضاع الفنان الممثل مهنيا واجتماعيا وثقافيا، والارتقاء بالحرفة المسرحية والسمعية البصرية والسينمائية بالمغرب.", { x: MX, y: 1.78, w: CW, h: 0.45, fontSize: 15, color: P.muted });
    const goals = [
      ["الدفاع عن المصالح المهنية", "FaShieldHalved", ["تمثيل الفنانين لدى السلطات والمؤسسات", "الدفاع عن حقوقهم المعنوية والمادية", "الترافع لتطوير الإطار القانوني", "حماية حقوق المؤلف والحقوق المجاورة"]],
      ["التنظيم المهني وسوق الشغل", "FaBriefcase", ["محاربة الممارسات غير القانونية", "تصنيف المهنيين ومحاربة العمالة الدخيلة", "تيسير الحصول على البطائق المهنية", "وساطة لعقود عمل عادلة وشفافة"]],
      ["العقود الفنية والتشغيل", "FaFileContract", ["نماذج عقود: مسرح، سينما، تلفزيون، إشهار", "تتبع احترام العقود من طرف المشغلين", "الحد الأدنى للأجور وظروف عمل لائقة", "محاربة التشغيل غير المصرح به"]],
      ["التكوين والإشعاع الثقافي", "FaGraduationCap", ["مركز للتكوين والبحث في فنون الأداء", "مهرجانات وملتقيات وندوات وورشات", "منشورات ومجلات متخصصة", "منصات على وسائل التواصل الرقمي"]],
      ["الرعاية الاجتماعية والتضامن", "FaHandHoldingHeart", ["دعم الولوج إلى التغطية الصحية", "الترافع من أجل نظام تقاعد للفنانين", "إحداث «صندوق التضامن الفني»", "شراكات لخدمات اجتماعية وصحية"]],
      ["التعاون والشراكات", "FaHandshake", ["شراكات مع جمعيات ونقابات فنية", "الدبلوماسية الثقافية دوليا وقاريا", "شراكات مع المؤسسات والمجالس المنتخبة"]],
    ];
    const gap = 0.25, cw = (CW - 2 * gap) / 3, ch = 2.1;
    for (let i = 0; i < goals.length; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = MX + (2 - col) * (cw + gap), y = 2.4 + row * (ch + gap);
      card(s, x, y, cw, ch);
      await badge(s, x + cw - 0.62, y + 0.17, 0.45, goals[i][1]);
      T(s, goals[i][0], { x: x + 0.2, y: y + 0.17, w: cw - 0.95, h: 0.45, fontSize: 15, bold: true, color: P.gold, valign: "middle" });
      T(s, bullets(goals[i][2], 12.5, { after: 3 }), { x: x + 0.2, y: y + 0.75, w: cw - 0.4, h: ch - 0.85 });
    }
  }

  // ===== الباب الثاني =====
  await divider(1, "العضوية والانخراط", "الفصول من 6 إلى 8", "FaUsers");

  { // الفصل 6
    const s = await article(6, "الفصل السادس", "شروط العضوية", "FaUserCheck");
    const conds = [
      "متمتعا بحقوقه المدنية",
      "يزاول مهنة التمثيل بشكل احترافي وتخصصي",
      "يتوفر على تغطية صحية سارية المفعول",
      "يتوفر على البطاقة المهنية للفنان",
      "يلتزم بالنظامين الأساسي والداخلي ويؤدي واجب الانخراط بانتظام",
      "يوافق المكتب المسير على قبول انخراطه",
      "يوقع على ميثاق الشرف الذي تتبناه الجمعية",
    ];
    T(s, "يشترط في العضو أن يكون:", { x: MX, y: 1.8, w: CW, h: 0.4, fontSize: 16, color: P.muted });
    const cw = (CW - 0.3) / 2, ch = 0.66, gy = 0.14;
    for (let i = 0; i < conds.length; i++) {
      const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4;
      const x = col === 0 ? MX + cw + 0.3 : MX, y = 2.35 + row * (ch + gy);
      card(s, x, y, cw, ch);
      s.addImage({ data: await icon("FaCircleCheck", P.gold), x: x + cw - 0.6, y: y + 0.17, w: 0.32, h: 0.32, altText: "" });
      T(s, conds[i], { x: x + 0.2, y, w: cw - 0.95, h: ch, fontSize: 15, valign: "middle" });
    }
    const y = 2.35 + 3 * (ch + gy);
    card(s, MX, y, cw, ch, P.card2);
    card(s, MX, 5.75, CW, 0.95, P.gold);
    T(s, "تعتمد الجمعية انخراطات لفئات أخرى (طلبة الشعب الدرامية، خريجو المعاهد والكليات، الهواة، ممارسو المسرح الشبابي) حسب القانون الداخلي.", { x: MX + 0.35, y: 5.75, w: CW - 0.7, h: 0.95, fontSize: 15, bold: true, color: P.bg, valign: "middle" });
    T(s, "7 شروط أساسية", { x: MX + 0.2, y, w: cw - 0.4, h: ch, fontSize: 18, bold: true, color: P.gold, valign: "middle" });
  }

  { // الفصل 7
    const s = await article(7, "الفصل السابع", "أنواع الأعضاء المنخرطين", "FaUsersRectangle");
    const types = [
      ["أعضاء عاملون", "FaUserTie", "الممارسون الفعليون للمهنة والمنخرطون بصفة منتظمة.", "الفئة الوحيدة التي يحق لها التصويت والترشح لهياكل الجمعية"],
      ["أعضاء مُحتضَنون", "FaUserGraduate", "طلبة المعاهد والكليات المتخصصة في الفنون الدرامية، شريطة التخصص في مهنة التمثيل، وهواة المسرح.", null],
      ["أعضاء شرفيون", "FaAward", "شخصيات قدمت خدمات جليلة للجمعية.", null],
    ];
    const gap = 0.3, cw = (CW - 2 * gap) / 3;
    for (let i = 0; i < 3; i++) {
      const x = MX + (2 - i) * (cw + gap), y = 2.05, ch = 4.6;
      const hi = i === 0;
      card(s, x, y, cw, ch, hi ? P.card2 : P.card);
      if (hi) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.12, fill: { color: P.card2, transparency: 100 }, line: { color: P.gold, width: 1.5 } });
      await badge(s, x + cw / 2 - 0.45, y + 0.4, 0.9, types[i][1], !hi);
      T(s, types[i][0], { x: x + 0.25, y: y + 1.5, w: cw - 0.5, h: 0.6, fontSize: 24, bold: true, align: "center", valign: "middle", color: hi ? P.gold : P.text });
      T(s, types[i][2], { x: x + 0.3, y: y + 2.2, w: cw - 0.6, h: 1.4, fontSize: 16, align: "center", color: P.muted });
      if (types[i][3]) {
        s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.3, y: y + 3.55, w: cw - 0.6, h: 0.8, rectRadius: 0.1, fill: { color: P.gold }, line: { color: P.gold, width: 0 } });
        T(s, types[i][3], { x: x + 0.4, y: y + 3.55, w: cw - 0.8, h: 0.8, fontSize: 13, bold: true, color: P.bg, align: "center", valign: "middle" });
      }
    }
  }

  { // الفصل 8
    const s = await article(8, "الفصل الثامن", "فقدان العضوية", "FaUserXmark");
    const causes = [
      ["FaDoorOpen", "الاستقالة"],
      ["FaGavel", "الإقالة بسبب إخلال جسيم بالقوانين المنظمة للجمعية"],
      ["FaCalendarXmark", "عدم أداء الانخراط لمدة سنة تامة"],
      ["FaFeather", "الوفاة"],
      ["FaBan", "أي سبب يتعارض مع ركائز الجمعية"],
    ];
    T(s, "تفقد العضوية في الحالات التالية:", { x: MX, y: 1.8, w: CW, h: 0.4, fontSize: 16, color: P.muted });
    const gap = 0.22, cw = (CW - 4 * gap) / 5, ch = 2.9, y = 2.4;
    for (let i = 0; i < causes.length; i++) {
      const x = MX + (4 - i) * (cw + gap);
      card(s, x, y, cw, ch);
      await badge(s, x + cw / 2 - 0.4, y + 0.4, 0.8, causes[i][0]);
      T(s, causes[i][1], { x: x + 0.2, y: y + 1.4, w: cw - 0.4, h: 1.3, fontSize: 16, bold: true, align: "center", valign: "top" });
    }
    card(s, MX, 5.6, CW, 1.05, P.card2);
    s.addImage({ data: await icon("FaStamp", P.gold), x: W - MX - 0.75, y: 5.9, w: 0.45, h: 0.45, altText: "" });
    T(s, "ويتم ذلك بقرار من المكتب التنفيذي المسير.", { x: MX + 0.4, y: 5.6, w: CW - 1.4, h: 1.05, fontSize: 20, bold: true, color: P.goldSoft, valign: "middle" });
  }

  // ===== الباب الثالث =====
  await divider(2, "الهيكلة الإدارية", "الفصول من 9 إلى 11", "FaSitemap");

  { // الفصل 9
    const s = await article(9, "الفصل التاسع", "الجمع العام العادي", "FaPeopleRoof");
    const cols = [
      ["المكانة والانعقاد", ["أعلى هيئة تقريرية في الجمعية", "دورة عادية مرة في كل ولاية من 5 سنوات", "دورة استثنائية كلما دعت الضرورة، بقرار من المكتب المسير أو بطلب من ثلثي الأعضاء"]],
      ["التركيبة", ["أعضاء المكتب المسير", "أعضاء مجلس الجمعية", "مناديب الأقاليم المعينون من طرف المكتب المسير بتشاور مع فناني كل إقليم"]],
      ["جدول التداول", ["قراءة التقريرين الأدبي والمالي والمصادقة عليهما", "تعديل القانون الأساسي إذا دعت الضرورة", "انتخاب المكتب المسير", "انتخاب مجلس الجمعية (20 عضوا فاعلا على الأكثر)"]],
    ];
    const gap = 0.3, cw = (CW - 2 * gap) / 3, y = 2.05, ch = 4.6;
    for (let i = 0; i < 3; i++) {
      const x = MX + (2 - i) * (cw + gap);
      card(s, x, y, cw, ch);
      T(s, String(i + 1).padStart(2, "0"), { x: x + 0.3, y: y + 0.3, w: 1.2, h: 0.6, fontSize: 30, bold: true, color: P.line, align: "left", rtlMode: false });
      T(s, cols[i][0], { x: x + 0.3, y: y + 0.3, w: cw - 0.6, h: 0.6, fontSize: 21, bold: true, color: P.gold, valign: "middle" });
      T(s, bullets(cols[i][1], 17, { after: 14 }), { x: x + 0.3, y: y + 1.15, w: cw - 0.6, h: ch - 1.35 });
    }
  }

  { // الفصل 10
    const s = await article(10, "الفصل العاشر", "المكتب المسير", "FaSitemap",
      "يسهر المكتب التنفيذي على: تنظيم الجموع العامة العادية والاستثنائية والإشراف على تزكية مناديب الأقاليم؛ تمثيل الفنان الممثل المغربي في المحافل الدولية والقارية والوطنية؛ التنسيق المركزي وخلق شراكات مع الوزارات الوصية والسلطات العمومية والمنتخبة وغرف التجارة والصناعة والخدمات؛ خلق شراكات مع مؤسسات حكومية وغير حكومية وطنية ودولية لدعم العمل الثقافي والفني على مستوى الجهة.\n\nيتم التصويت حصرا عبر انتخاب الرئيس بناء على برنامج مرحلي، ويتكلف بتكوين مكتبه في أجل لا يتعدى 7 أيام.");
    const stats = [["5 سنوات", "مدة الولاية"], ["9 – 13", "عدد الأعضاء"], ["7 أيام", "أجل تكوين المكتب بعد انتخاب الرئيس"]];
    const sg = 0.3, sw = (CW - 2 * sg) / 3;
    for (let i = 0; i < 3; i++) {
      const x = MX + (2 - i) * (sw + sg);
      card(s, x, 1.95, sw, 0.95, P.card2);
      T(s, stats[i][0], { x: x + sw - 1.85, y: 1.95, w: 1.6, h: 0.95, fontSize: 26, bold: true, color: P.gold, valign: "middle" });
      T(s, stats[i][1], { x: x + 0.25, y: 1.95, w: sw - 2.2, h: 0.95, fontSize: 13, color: P.muted, valign: "middle", align: "left" });
    }
    const roles = [
      ["الرئيس", "يمثل الجمعية قانونيا، يترأس الاجتماعات، ويوقع الاتفاقيات والشيكات مع أمين المال"],
      ["النائب الأول", "ينوب عن الرئيس عند غيابه أو وجود عائق قانوني، ويمارس الصلاحيات المفوضة له"],
      ["النائب الثاني", "ينوب عند غياب الرئيس ونائبه الأول، ويتكلف بالعلاقات العامة والدبلوماسية الثقافية"],
      ["الكاتب العام", "الشؤون الإدارية، المحاضر والاستدعاءات، التصريح القانوني وسجل المنخرطين"],
      ["نائب الكاتب العام", "يساعد الكاتب العام وينوب عنه، ويوثق الأرشيف ويعد التقارير الأدبية"],
      ["أمين المال", "تدبير الموارد والانخراطات، مسك المحاسبة، وإعداد الميزانية والتقرير المالي"],
      ["نائب أمين المال", "يساعد أمين المال، ويتكلف بجلب المنح وتدبير «صندوق التضامن الفني»"],
      ["المستشارون", "يشاركون في المداولات والتصويت، ويترأسون اللجان الوظيفية"],
    ];
    const gap = 0.22, cw = (CW - 3 * gap) / 4, ch = 1.75;
    for (let i = 0; i < roles.length; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = MX + (3 - col) * (cw + gap), y = 3.1 + row * (ch + gap);
      card(s, x, y, cw, ch);
      T(s, roles[i][0], { x: x + 0.2, y: y + 0.15, w: cw - 0.4, h: 0.42, fontSize: 16, bold: true, color: P.gold, valign: "middle" });
      T(s, roles[i][1], { x: x + 0.2, y: y + 0.62, w: cw - 0.4, h: ch - 0.75, fontSize: 12.5, color: P.text });
    }
  }

  { // الفصل 11
    const s = await article(11, "الفصل الحادي عشر", "مجلس الجمعية", "FaPeopleGroup");
    const rw = 7.3, lw = CW - rw - 0.3;
    card(s, MX + lw + 0.3, 2.05, rw, 4.6);
    T(s, "مجلس الجمعية", { x: MX + lw + 0.6, y: 2.3, w: rw - 0.6, h: 0.5, fontSize: 21, bold: true, color: P.gold });
    T(s, bullets([
      "ينتخب مباشرة بعد انتخاب المكتب التنفيذي في الجمع العام العادي.",
      "يتكون من 20 عضوا عاملا على الأكثر، إضافة إلى أعضاء المكتب التنفيذي ومناديب الأقاليم الستة في حالة انتدابهم.",
      "دورة أولى قبل بداية الموسم الثقافي والفني للتداول في البرنامج العام.",
      "دورة ثانية في ختام الموسم.",
    ], 16, { after: 10 }), { x: MX + lw + 0.6, y: 2.95, w: rw - 0.9, h: 3.5 });
    // stats column
    card(s, MX, 2.05, lw, 1.45, P.card2);
    T(s, "2", { x: MX + lw - 1.3, y: 2.05, w: 1.0, h: 1.45, fontSize: 48, bold: true, color: P.gold, valign: "middle", align: "center", rtlMode: false });
    T(s, "اجتماعان في السنة", { x: MX + 0.25, y: 2.05, w: lw - 1.6, h: 1.45, fontSize: 17, valign: "middle" });
    card(s, MX, 3.7, lw, 2.95, P.card);
    T(s, "الانتدابات الإقليمية", { x: MX + 0.25, y: 3.9, w: lw - 0.5, h: 0.45, fontSize: 18, bold: true, color: P.gold });
    T(s, "مناديب إقليميون لتسهيل التواصل بين المنخرطين والمكتب التنفيذي، بتزكية بناء على ترشيحات فناني كل إقليم، دون تبعات إدارية. تتجدد التزكية سنويا أو تلغى بقرار من المكتب أو بطلب من منخرطي الإقليم.", { x: MX + 0.25, y: 4.4, w: lw - 0.5, h: 2.1, fontSize: 15, color: P.text });
  }

  // ===== الباب الرابع =====
  await divider(3, "اللجان الوظيفية", "الفصل 12", "FaLayerGroup");

  { // الفصل 12
    const s = await article(12, "الفصل الثاني عشر", "اللجان الدائمة", "FaLayerGroup");
    const cs = [
      ["FaGavel", "اللجنة القانونية", "تأطير وتأمين كل ما هو قانوني داخل الجمعية، وحماية أعضائها قانونيا"],
      ["FaGraduationCap", "لجنة التكوين", "تطوير كفاءات الفنانين بالتكوين والتكوين المستمر، ورفع المستوى المهني"],
      ["FaBriefcase", "لجنة المواكبة والتشغيل", "رصد العطالة الفنية وتوثيقها، وتقديم ملفات المنخرطين للمشغلين"],
      ["FaHandshakeAngle", "لجنة الوساطة المهنية", "حل النزاعات بشكل ودي قبل اتخاذ المساطر القانونية"],
      ["FaGlobe", "لجنة العلاقات الدولية", "توسيع إشعاع الجمعية دوليا وبناء شراكات مع هيئات لها نفس الأهداف"],
    ];
    const gap = 0.22, cw = (CW - 4 * gap) / 5, ch = 3.65, y = 2.0;
    for (let i = 0; i < cs.length; i++) {
      const x = MX + (4 - i) * (cw + gap);
      card(s, x, y, cw, ch);
      await badge(s, x + cw / 2 - 0.38, y + 0.3, 0.76, cs[i][0]);
      T(s, cs[i][1], { x: x + 0.15, y: y + 1.2, w: cw - 0.3, h: 0.8, fontSize: 16, bold: true, color: P.gold, align: "center", valign: "middle" });
      T(s, cs[i][2], { x: x + 0.2, y: y + 2.05, w: cw - 0.4, h: 1.5, fontSize: 13, align: "center" });
    }
    card(s, MX, 5.9, CW, 0.8, P.card2);
    T(s, "كما يمكن للمكتب إحداث لجان وظيفية أخرى، أو إلغاء لجان قائمة.", { x: MX + 0.4, y: 5.9, w: CW - 0.8, h: 0.8, fontSize: 17, color: P.goldSoft, bold: true, valign: "middle" });
  }

  // ===== الباب الخامس =====
  await divider(4, "الموارد المالية", "الفصلان 13 و14", "FaCoins");

  { // الفصل 13
    const s = await article(13, "الفصل الثالث عشر", "الموارد", "FaCoins");
    const rs = [
      ["FaIdCard", "واجبات انخراط الأعضاء"],
      ["FaBuildingColumns", "دعم المؤسسات الحكومية والجماعات الترابية والمجالس المنتخبة، ومنح غرف التجارة والصناعة"],
      ["FaTicket", "مداخيل التظاهرات والمهرجانات والسهرات الفنية والدورات التكوينية"],
      ["FaGift", "الهبات ودعم المؤسسات الثقافية والفنية الوطنية والدولية"],
      ["FaMobileScreen", "مداخيل الوسائط المتعددة وبيع المنتوجات وفق القوانين الجاري بها العمل"],
    ];
    const lw = 3.6, rw = CW - lw - 0.3;
    card(s, MX, 2.05, lw, 4.6, P.card2);
    T(s, "5", { x: MX, y: 2.5, w: lw, h: 2.0, fontSize: 120, bold: true, color: P.gold, align: "center", valign: "middle", rtlMode: false });
    T(s, "مصادر لتمويل أنشطة الجمعية", { x: MX + 0.3, y: 4.7, w: lw - 0.6, h: 1.2, fontSize: 20, bold: true, align: "center", valign: "middle" });
    const rh = 0.8, gy = 0.15;
    for (let i = 0; i < rs.length; i++) {
      const x = MX + lw + 0.3, y = 2.05 + i * (rh + gy);
      card(s, x, y, rw, rh);
      await badge(s, x + rw - 0.68, y + 0.14, 0.52, rs[i][0]);
      T(s, rs[i][1], { x: x + 0.25, y, w: rw - 1.1, h: rh, fontSize: 15, valign: "middle" });
    }
  }

  { // الفصل 14
    const s = await article(14, "الفصل الرابع عشر", "التصفية والحل", "FaBoxArchive");
    const steps = [
      ["FaPeopleRoof", "قرار الحل", "يصدر عن الجمع العام الاستثنائي"],
      ["FaFileInvoiceDollar", "سداد الديون", "تصفية جميع الالتزامات المالية للجمعية"],
      ["FaRightLeft", "تحويل الممتلكات", "إلى جمعية أخرى لها نفس الأهداف"],
    ];
    const aw = 0.75, cw = (CW - 2 * aw) / 3, y = 2.25, ch = 3.4;
    for (let i = 0; i < 3; i++) {
      const x = MX + (2 - i) * (cw + aw);
      card(s, x, y, cw, ch, i === 2 ? P.card2 : P.card);
      T(s, `0${i + 1}`, { x: x + 0.3, y: y + 0.3, w: 1, h: 0.5, fontSize: 18, bold: true, color: P.muted, align: "left", rtlMode: false });
      await badge(s, x + cw / 2 - 0.45, y + 0.45, 0.9, steps[i][0]);
      T(s, steps[i][1], { x: x + 0.3, y: y + 1.6, w: cw - 0.6, h: 0.6, fontSize: 24, bold: true, color: P.gold, align: "center", valign: "middle" });
      T(s, steps[i][2], { x: x + 0.3, y: y + 2.25, w: cw - 0.6, h: 0.9, fontSize: 16, align: "center" });
      if (i < 2) s.addImage({ data: await icon("FaArrowLeftLong", P.gold), x: x - aw + 0.17, y: y + ch / 2 - 0.2, w: 0.4, h: 0.4, altText: "" });
    }
    T(s, "عند حل الجمعية بقرار من الجمع العام الاستثنائي، تحول ممتلكاتها إلى جمعية أخرى لها نفس الأهداف بعد سداد الديون.", { x: MX, y: 5.95, w: CW, h: 0.6, fontSize: 16, color: P.muted, align: "center", valign: "middle" });
  }

  // Closing
  currentSection = "الختام";
  pres.addSection({ title: currentSection });
  {
    const s = pres.addSlide({ masterName: "APMAC_COVER", sectionTitle: currentSection });
    s._kind = "cover";
    s.addShape(pres.shapes.OVAL, { x: W / 2 - 0.6, y: 1.5, w: 1.2, h: 1.2, fill: { color: P.bg }, line: { color: P.gold, width: 1.5 } });
    s.addImage({ data: await icon("FaMasksTheater", P.gold), x: W / 2 - 0.34, y: 1.76, w: 0.68, h: 0.68, altText: "قناع المسرح" });
    T(s, "شكرا على حسن المتابعة", { x: MX, y: 3.0, w: CW, h: 1.0, fontSize: 48, bold: true, align: "center", valign: "middle" });
    T(s, "الجمعية المهنية المغربية للفنانين الممثلين · سوس ماسة", { x: MX, y: 4.1, w: CW, h: 0.6, fontSize: 22, color: P.gold, align: "center", valign: "middle" });
    T(s, "A P M A C", { x: MX, y: 5.2, w: CW, h: 0.4, fontSize: 16, color: P.goldSoft, bold: true, align: "center", rtlMode: false, charSpacing: 6 });
  }

  // Record slide kinds for the transition pass
  const kinds = pres._slides.map((s) => s._kind || "article");
  require("fs").writeFileSync(OUT + ".kinds.json", JSON.stringify(kinds));
  await pres.writeFile({ fileName: OUT });
  console.log("wrote", OUT, kinds.length, "slides");
})().catch((e) => { console.error(e); process.exit(1); });
