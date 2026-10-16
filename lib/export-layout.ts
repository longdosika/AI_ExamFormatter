import { ExportDocument, ExportParagraph, ExportRun, ParagraphRole } from "./export-document";

/**
 * T-109 export layout = the master QuizFlow template ("QuizFlow Import Template v1.1",
 * docs.google.com/document/d/1uA8A1Q1lXCDIGRPtgBA0H77xYoMWCoo7thp5Hi0nvBQ, evidence/t109-master-template.docx),
 * the supreme reference in design.md §1.1. Values below are measured from that file (twips, half-points).
 * Pure function: DOCX download and Google Drive export share it through createExportDocx.
 */
export const EXPORT_PAGE = {
  widthTwips: 11909, heightTwips: 16834, // A4
  marginTopTwips: 283, marginBottomTwips: 694, marginLeftTwips: 850, marginRightTwips: 429,
  headerTwips: 283, footerTwips: 283,
} as const;
/** Template footer starts 567 twips left of the margin; file name and page field sit at measured stops (twips from the margin). */
export const FOOTER_TABS = { indent: -567, name: 3600, page: 9240 } as const;

export const TEMPLATE_COLORS = { coral: "F25F4D", teal: "006D77", ink: "102A2E", black: "000000", answer: "B8F2E6", footerName: "FF0000" } as const;
const { coral: CORAL, teal: TEAL, ink: INK, black: BLACK, answer: ANSWER } = TEMPLATE_COLORS;
const MANAGED = new Set(["F2604D", CORAL, TEAL]);
export const IMAGE_MAX = { question: 661, shared: 661, choice: 353, explanation: 510 } as const;

/** size is in half-points (34 = 17 pt); shade is a run-level fill like the template's answer mark. */
export interface LaidOutRun extends ExportRun { size?: number; shade?: string }
/** background is only kept for role-less (raw OCR) paragraphs; template roles never shade whole paragraphs. */
export interface LaidOutParagraph extends Omit<ExportParagraph, "runs"> {
  runs: LaidOutRun[];
  before?: number; after?: number; line?: number;
  indentLeft?: number; hanging?: number; align?: "center";
}
export interface LaidOutDocument { title: string; paragraphs: LaidOutParagraph[]; footer: { code: string; name: string } }

/** Thai Buddhist year, Asia/Bangkok wall clock: "691013-1607". The footer code uses the date part ("V-691013"). */
export function exportStamp(now: Date): string {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(now).map(part => [part.type, part.value]));
  const year = String((Number(parts.year) + 543) % 100).padStart(2, "0");
  return `${year}${parts.month}${parts.day}-${parts.hour === "24" ? "00" : parts.hour}${parts.minute}`;
}

// Paragraph geometry per template block.
const BLOCK = {
  title: { before: 0, after: 60 },
  titleGap: { before: 60, after: 100 },
  question: { before: 160, after: 80 },
  questionMore: { before: 0, after: 60, indentLeft: 400 },
  label: { before: 0, after: 40, indentLeft: 400 },
  figure: { before: 0, after: 40, indentLeft: 400 },
  spacer: { before: 0, after: 0, line: 276 },
  choicesLabel: { before: 40, after: 60, indentLeft: 400 },
  choice: { before: 0, after: 60, indentLeft: 660, hanging: 260 },
  explanation: { before: 60, after: 100, indentLeft: 400 },
  explanationFigure: { before: 60, after: 100, indentLeft: 400 },
  sharedHeader: { before: 0, after: 100 },
  sharedText: { before: 0, after: 100, indentLeft: 360 },
  sharedLabel: { before: 0, after: 100, indentLeft: 360 },
  sharedEnd: { before: 0, after: 100 },
  body: { before: 0, after: 60 },
} satisfies Record<string, Partial<LaidOutParagraph>>;

const isBlank = (paragraph: ExportParagraph) => paragraph.runs.every(run => !run.image && !(run.text || "").trim());
const isStar = (run: ExportRun) => run.text?.trim() === "*";
const recolor = (run: ExportRun, color: string, bold?: boolean): LaidOutRun => ({ ...run, color, ...(bold === undefined ? {} : { bold }) });
const inked = (color: string) => (run: ExportRun): LaidOutRun => run.image || (run.color && MANAGED.has(run.color.toUpperCase())) ? run : recolor(run, color);
const fitImage = (run: ExportRun, max: number): LaidOutRun => {
  if (!run.image || !run.width || !run.height || run.width <= max) return run;
  return { ...run, width: max, height: run.height * max / run.width };
};
const spacer = (): LaidOutParagraph => ({ runs: [], keepWithNext: true, ...BLOCK.spacer });

/** The editor splits text into many DOM text nodes ("ก", ". "); join neighbours that share formatting. */
function mergeRuns<T extends LaidOutRun>(runs: T[]): T[] {
  const merged: T[] = [];
  const same = (a: T, b: T) => !a.image && !b.image && a.text !== undefined && b.text !== undefined
    && Boolean(a.bold) === Boolean(b.bold) && Boolean(a.italic) === Boolean(b.italic) && Boolean(a.underline) === Boolean(b.underline)
    && (a.color || "").toUpperCase() === (b.color || "").toUpperCase() && a.shade === b.shade && a.size === b.size;
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && same(last, run)) merged[merged.length - 1] = { ...last, text: (last.text || "") + run.text };
    else merged.push({ ...run });
  }
  return merged;
}

const CHOICE_KEY = /^\s*(?:[ก-ฮ]|\d{1,2}|[A-Za-z])[.)]\s*/;
/** Template choices carry no "ก./ข." key: drop the editor's key run (or key prefix) from the export only. */
function withoutChoiceKey(runs: ExportRun[]): ExportRun[] {
  const [first, ...rest] = runs;
  if (!first?.text) return runs;
  if (/^\s*(?:[ก-ฮ]|\d{1,2}|[A-Za-z])[.)]\s*$/.test(first.text)) return rest;
  return [{ ...first, text: first.text.replace(CHOICE_KEY, "") }, ...rest].filter(run => run.image || run.text);
}

function styleChoice(paragraph: ExportParagraph, images: ExportRun[]): LaidOutParagraph {
  const runs = withoutChoiceKey(mergeRuns(paragraph.runs));
  const correct = runs.some(isStar);
  const text = runs.filter(run => !isStar(run)).map(run => recolor(run, BLACK, run.bold ? undefined : false));
  // Template: choice images sit inline in the choice paragraph, before the answer star.
  const figures = images.map(image => fitImage(image, IMAGE_MAX.choice));
  const star: LaidOutRun[] = correct ? [{ text: "  *", color: CORAL }] : [];
  const all = [...text.map(run => ({ ...run, text: run.text?.replace(/\s+$/, "") })).filter(run => run.image || run.text), ...figures, ...star];
  return { ...BLOCK.choice, item: paragraph.item, role: "choice", runs: mergeRuns(correct ? all.map(run => ({ ...run, shade: ANSWER })) : all) };
}

/** "โจทย์ร่วม <first line>" shares one paragraph; later stem lines become passage paragraphs. */
function mergeSharedHeaders(paragraphs: ExportParagraph[]): ExportParagraph[] {
  const merged: ExportParagraph[] = [];
  for (let index = 0; index < paragraphs.length; index++) {
    const paragraph = paragraphs[index];
    const next = paragraphs[index + 1];
    const labelOnly = paragraph.role === "sharedHeader" && /^\s*โจทย์ร่วม\s*:?\s*$/.test(paragraph.runs.map(run => run.text || "").join(""));
    if (!labelOnly || next?.role !== "sharedText" || next.runs.some(run => run.image)) { merged.push(paragraph); continue; }
    const lines = next.runs.map(run => run.text || "").join("").split("\n").map(line => line.trim()).filter(Boolean);
    merged.push({ ...paragraph, runs: [...paragraph.runs, { text: lines[0] || "" }] });
    for (const line of lines.slice(1)) merged.push({ ...next, runs: [{ text: line }] });
    index++;
  }
  return merged;
}

export function layoutExamDocument(doc: ExportDocument, now = new Date()): LaidOutDocument {
  const title = doc.title.replace(/\s+—\s+QuizFlow$/, "");
  const out: LaidOutParagraph[] = [
    { ...BLOCK.title, runs: [{ text: title, bold: true, color: BLACK, size: 34 }] },
    { ...BLOCK.titleGap, runs: [] },
  ];
  const push = (paragraph: LaidOutParagraph) => { if (paragraph.runs.length || paragraph.line) out.push(paragraph); };
  const lastIsSpacer = () => out[out.length - 1]?.line === BLOCK.spacer.line && !out[out.length - 1].runs.length;
  const ensureSpacer = () => { if (out.length > 2 && !lastIsSpacer()) out.push(spacer()); };

  const source = mergeSharedHeaders(doc.paragraphs.filter(paragraph => !isBlank(paragraph)));
  for (let index = 0; index < source.length; index++) {
    const paragraph = source[index];
    const role: ParagraphRole | undefined = paragraph.role;
    const runs = mergeRuns(paragraph.runs);
    const previous = source[index - 1];
    const base = { item: paragraph.item, role, keepWithNext: true } as const;
    switch (role) {
      case "question": {
        if (previous?.item === paragraph.item && previous?.role === "question") {
          push({ ...base, ...BLOCK.questionMore, runs: runs.map(inked(BLACK)) });
          break;
        }
        ensureSpacer();
        const [first, ...rest] = runs;
        const numbered = first?.text !== undefined && /^\s*\d+\.\s*$/.test(first.text);
        push({ ...base, ...BLOCK.question, runs: numbered ? [recolor(first, CORAL, true), ...rest.map(inked(INK))] : runs.map(inked(INK)) });
        break;
      }
      case "questionImageLabel":
        push({ ...base, ...BLOCK.label, runs: [{ text: "รูปคำถาม:", bold: true, color: CORAL }] });
        break;
      case "questionImage":
        push({ ...base, ...BLOCK.figure, runs: runs.filter(run => run.image).map(run => fitImage(run, IMAGE_MAX.question)) });
        break;
      case "choicesLabel":
        ensureSpacer();
        push({ ...base, ...BLOCK.choicesLabel, runs: [{ text: "ตัวเลือก:", bold: true, color: TEAL }] });
        break;
      case "choice": {
        const images: ExportRun[] = [];
        while (source[index + 1]?.role === "choiceImage" && source[index + 1].item === paragraph.item) {
          images.push(...source[index + 1].runs.filter(run => run.image));
          index++;
        }
        push({ ...styleChoice(paragraph, images), keepWithNext: source[index + 1]?.role === "choice" && source[index + 1].item === paragraph.item });
        break;
      }
      case "choiceImage":
        // An image whose choice row was not exported still belongs to the choice list.
        push({ ...base, ...BLOCK.choice, runs: runs.filter(run => run.image).map(run => fitImage(run, IMAGE_MAX.choice)) });
        break;
      case "explanation": {
        const [first, ...rest] = runs;
        const labelled = first?.text?.trim().startsWith("คำอธิบาย");
        push({ ...base, keepWithNext: false, ...BLOCK.explanation, runs: labelled ? [recolor(first, TEAL, true), ...rest.map(inked(INK))] : runs.map(inked(INK)) });
        break;
      }
      case "explanationImageLabel":
        push({ ...base, ...BLOCK.label, runs: runs.filter(run => run.text?.trim()).map(run => recolor(run, CORAL, true)) });
        break;
      case "explanationImage":
        push({ ...base, keepWithNext: false, ...BLOCK.explanationFigure, runs: runs.filter(run => run.image).map(run => fitImage(run, IMAGE_MAX.explanation)) });
        break;
      case "sharedHeader": {
        ensureSpacer();
        const text = runs.map(run => run.text || "").join("");
        const label = text.match(/^\s*โจทย์ร่วม\s*:?\s*/);
        const rest = label ? text.slice(label[0].length) : text;
        push({ ...base, ...BLOCK.sharedHeader, runs: label
          ? [{ text: "โจทย์ร่วม", bold: true, color: TEAL }, ...(rest ? [{ text: ` ${rest}`, color: INK }] : [])]
          : runs.map(inked(INK)) });
        break;
      }
      case "sharedText":
        push({ ...base, ...BLOCK.sharedText, runs: runs.map(run => ({ ...inked(BLACK)(run), italic: true })) });
        break;
      case "sharedImageLabel":
        push({ ...base, ...BLOCK.sharedLabel, runs: runs.filter(run => run.text?.trim()).map(run => recolor(run, CORAL, true)) });
        break;
      case "sharedImage":
        push({ ...base, ...BLOCK.figure, runs: runs.filter(run => run.image).map(run => fitImage(run, IMAGE_MAX.shared)) });
        break;
      case "sharedEnd":
        push({ ...base, keepWithNext: false, ...BLOCK.sharedEnd, runs: [{ text: "จบโจทย์ร่วม", bold: true, color: TEAL }] });
        push({ ...BLOCK.spacer, align: "center", runs: [{ text: "◆", color: BLACK }] });
        break;
      default:
        push({ ...BLOCK.body, keepWithNext: paragraph.keepWithNext, background: paragraph.background, runs });
    }
  }
  while (out.length > 2 && lastIsSpacer()) out.pop();
  return { title: doc.title, paragraphs: out, footer: { code: `V-${exportStamp(now).slice(0, 6)}`, name: title } };
}
