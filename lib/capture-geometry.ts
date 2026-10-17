export interface OcrTextRegion { text: string; bbox: [number, number, number, number] }
import { normalizeThaiOcrText } from "./text-normalization";

/** Unruled tables need a column header and repeated multi-value rows before removing OCR duplicates. */
export function hasTabularTextEvidence(regions: OcrTextRegion[], bbox: [number, number, number, number]): boolean {
  const lines=validTextRegions(regions).filter(row=>row.bbox[0]>=bbox[0]&&row.bbox[1]>=bbox[1]&&row.bbox[2]<=bbox[2]&&row.bbox[3]<=bbox[3]).map(row=>normalizeThaiOcrText(row.text).trim());
  return lines.some(line=>/การละลาย.*การถูกดูดซับ|ระยะทาง.*(?:ค่า|ระยะทาง)|ปริมาณ.*(?:ก่อน|หลัง)/.test(line)) &&
    lines.filter(line=>/^[A-Z]\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(line)).length>=3;
}

/**
 * T-121 (audit): an ordinary table whose ruled grid was not detected. Every OCR line fully inside the captured
 * box reads as short cells, with at least three lines and two numeric rows ("A ของแข็ง ไม่ละลาย 825").
 */
export function hasCellRowEvidence(regions: OcrTextRegion[], bbox: [number, number, number, number]): boolean {
  const lines=validTextRegions(regions).filter(row=>row.bbox[0]>=bbox[0]&&row.bbox[1]>=bbox[1]&&row.bbox[2]<=bbox[2]&&row.bbox[3]<=bbox[3]).map(row=>normalizeThaiOcrText(row.text).trim()).filter(Boolean);
  return lines.length>=3 && lines.every(line=>line.split(/\s+/).every(cell=>cell.length<=12)) && lines.filter(line=>/\d/.test(line)&&line.split(/\s+/).length>=3).length>=2;
}

/** A question can continue below its table before the choices start. Do not capture that line twice. */
export function tableContinuationTop(regions: OcrTextRegion[], bbox: [number, number, number, number], bottomLimit = bbox[2]): number | undefined {
  const rows=validTextRegions(regions);
  const contained=rows.filter(row=>row.bbox[0]>=bbox[0]&&row.bbox[2]<=bbox[2]&&row.bbox[1]>=bbox[1]&&row.bbox[3]<=bbox[3]);
  const header=contained.some(row=>/สาร\s+จุดเดือด.*การละลาย|ค่าการละลาย|ชนิดสาร/.test(normalizeThaiOcrText(row.text)));
  const cells=contained.filter(row=>/^(?:[A-Z]{1,4}\s+)?(?:\d+(?:\.\d+)?|น้อยกว่า)(?:\s|$)/.test(normalizeThaiOcrText(row.text).trim()));
  if(header && cells.length>=2) {
    const lastBottom=Math.max(...cells.map(row=>row.bbox[2]));
    const continuation=rows.filter(row=>row.bbox[0]>lastBottom&&row.bbox[0]<bottomLimit&&row.bbox[3]>bbox[1]&&row.bbox[1]<bbox[3]&&
      /^(?:เมื่อนำ|ถ้า|สารใด|ข้อใด|วิธีใด)/.test(normalizeThaiOcrText(row.text).trim())).sort((a,b)=>a.bbox[0]-b.bbox[0])[0];
    if(continuation) return continuation.bbox[0];
  }
  if(!hasTabularTextEvidence(regions,bbox)) return undefined;
  const data=rows.filter(row=>row.bbox[0]>=bbox[0]&&row.bbox[2]<=bbox[2]&&/^[A-Z]\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(normalizeThaiOcrText(row.text).trim()));
  const last=Math.max(...data.map(row=>row.bbox[2]));
  return rows.filter(row=>row.bbox[0]>last&&row.bbox[0]<bottomLimit&&row.bbox[3]>bbox[1]&&row.bbox[1]<bbox[3]&&row.text.trim().length>6).sort((a,b)=>a.bbox[0]-b.bbox[0])[0]?.bbox[0];
}

/** Remove only complete OCR lines fully inside a captured, evidenced table. */
export function removeCapturedGridText(text: string, regions: OcrTextRegion[], bbox: [number, number, number, number]): string {
  let result=text;
  for(const region of validTextRegions(regions)) {
    if(region.bbox[0]<bbox[0] || region.bbox[1]<bbox[1] || region.bbox[2]>bbox[2] || region.bbox[3]>bbox[3]) continue;
    const line=normalizeThaiOcrText(region.text).trim();
    if(line.length<6 && !/^[A-Z]\s+\d+(?:\.\d+)?\s+\d+(?:\.\d+)?$/.test(line)) continue;
    result=result.split(line).join("");
  }
  // T-121: table rows now arrive one per line, so removed rows must not leave empty lines behind.
  return result.replace(/[ \t]{2,}/g," ").split("\n").map(line=>line.trim()).filter(Boolean).join("\n").trim();
}

export function validTextRegions(value: unknown): OcrTextRegion[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is OcrTextRegion => Boolean(row && typeof row.text === "string" && row.text.length <= 4000 &&
    Array.isArray(row.bbox) && row.bbox.length === 4 && row.bbox.every((n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1000) &&
    row.bbox[0] < row.bbox[2] && row.bbox[1] < row.bbox[3])).slice(0, 2000);
}

/** Only numbered stems known on this page can restrict a figure; labels/guide lines cannot. */
/** Question-number lines on a page, keeping only the one that matches the stem when OCR repeats a number. */
function questionLines(pageQuestions: number[], regions: OcrTextRegion[], knownQuestions: { questionNumber: number; stem: string }[]) {
  const candidates = validTextRegions(regions).map(region => ({ ...region, number: Number(region.text.match(/^\s*(\d+)[.)](?:\s*\S|\s*$)/)?.[1]) }))
    .filter(region => pageQuestions.includes(region.number));
  const comparable = (text: string) => normalizeThaiOcrText(text).replace(/^\s*\d+[.)]\s*/, "").replace(/\s/g, "");
  const stems = knownQuestions.length ? candidates.filter(region => {
    const sameNumber = candidates.filter(row => row.number === region.number);
    if (sameNumber.length === 1) return true;
    const stem = comparable(knownQuestions.find(row => row.questionNumber === region.number)?.stem || "");
    const matching = sameNumber.filter(row => {
      const text = comparable(row.text);
      return text.length >= 8 && stem.length >= 8 && (stem.startsWith(text) || text.startsWith(stem.slice(0, 40)));
    });
    return matching.length === 1 && matching[0] === region;
  }) : candidates;
  return stems;
}

/**
 * T-132 (C-10, C-14 upward): how far a question figure may grow upward over its own ink. Model boxes can start
 * below the real figure top (set 2 Q20, live run: box 850, cylinder from about 808). When the question number is
 * printed left of the figure and the figure sits within three line heights of that line, the crop may walk up
 * over continuous ink to the line top, and once it enters that row its left edge stays at the figure's left.
 */
export function figureReach(question: number, pageQuestions: { questionNumber: number; stem: string }[], regions: OcrTextRegion[], figure: [number, number, number, number]): { top: number; left: number; lineBottom: number } | undefined {
  const own = questionLines(pageQuestions.map(entry => entry.questionNumber), regions, pageQuestions).find(region => region.number === question);
  if (!own || own.bbox[1] >= figure[1]) return undefined;
  const lineHeight = Math.max(1, own.bbox[2] - own.bbox[0]);
  if (figure[0] - own.bbox[2] > 3 * lineHeight || figure[2] < own.bbox[0]) return undefined;
  return { top: Math.max(0, own.bbox[0] - 3), left: figure[1], lineBottom: own.bbox[2] };
}

export function figureVerticalLimits(question: number, pageQuestions: number[], regions: OcrTextRegion[], stopAtChoices = false, figure?: [number, number, number, number], knownQuestions: { questionNumber: number; stem: string }[] = []): [number, number, number, number] {
  const stems = questionLines(pageQuestions, regions, knownQuestions);
  const own = stems.find(region => region.number === question);
  if(own && figure && figure[2]<own.bbox[0]) {
    const previous=stems.filter(region=>region.number<question&&region.bbox[2]<figure[0]).sort((a,b)=>b.bbox[2]-a.bbox[2])[0];
    return [previous?previous.bbox[2]+3:0,0,own.bbox[0]-3,1000];
  }
  const next = own ? stems.filter(region => region.number > question && region.bbox[0] > own.bbox[2]).sort((a, b) => a.bbox[0] - b.bbox[0])[0] : undefined;
  const firstChoice = stopAtChoices && own ? validTextRegions(regions).filter(region => /^\s*ก[.)]\s*\S/.test(region.text) && region.bbox[0]>own.bbox[2]).sort((a,b)=>a.bbox[0]-b.bbox[0])[0] : undefined;
  // T-132 (C-10): a figure printed beside its question line (set 2 Q20/Q22: "22." left, figure, stem right) starts inside
  // that line's row. OCR reads number, figure label and stem as one full-width line, so its bottom would cut the
  // figure top. Figures under the stem start at least 1.25 line heights below the line top (sets 1-3), never inside it.
  const beside = Boolean(own && figure && figure[0] < own.bbox[2]);
  const top = own ? (beside ? Math.max(0, own.bbox[0] - 3) : Math.min(1000, own.bbox[2] + 3)) : 0;
  // The question number shares that row on the left ("20."): padding must not reach it, so the left edge stays near the figure.
  const left = beside && own && figure && own.bbox[1] < figure[1] ? figure[1] : 0;
  return [top, left, Math.min(next ? Math.max(0, next.bbox[0] - 3) : 1000, firstChoice ? Math.max(0,firstChoice.bbox[0]-3) : 1000), 1000];
}

export function constrainFigure(bbox: [number, number, number, number], limits: [number, number, number, number]): [number, number, number, number] | null {
  const result: [number, number, number, number] = [Math.max(bbox[0], limits[0]), Math.max(bbox[1], limits[1]), Math.min(bbox[2], limits[2]), Math.min(bbox[3], limits[3])];
  return result[2] - result[0] >= 8 && result[3] - result[1] >= 8 ? result : null;
}

/**
 * T-121 (owner screenshot Q8): labels printed inside a captured figure ("D", "สี C", "สี A", "สาร ก") are read by
 * OCR as text and land at the end of the stem. Remove only short OCR lines that lie fully inside the figure box,
 * and only from the end of the stem, so the question sentence itself is never touched.
 */
export function stripTrailingFigureLabels(text: string, regions: OcrTextRegion[], bbox: [number, number, number, number]): string {
  // Labels often sit just outside a provider box ("D" beside a chromatogram): allow 2% of the page.
  const pad=20;
  const labels=validTextRegions(regions).filter(row=>row.bbox[0]>=bbox[0]-pad&&row.bbox[1]>=bbox[1]-pad&&row.bbox[2]<=bbox[2]+pad&&row.bbox[3]<=bbox[3]+pad)
    .map(row=>normalizeThaiOcrText(row.text).trim()).filter(label=>label&&label.length<=15).sort((a,b)=>b.length-a.length);
  let result=text.trimEnd();
  for(let changed=true;changed;) {
    changed=false;
    for(const label of labels) {
      if(result.length>label.length&&result.endsWith(label)&&/\s$/.test(result.slice(0,-label.length))) {
        result=result.slice(0,-label.length).trimEnd();changed=true;
      }
    }
  }
  return result;
}

/** Long numbered legends are retained by the parser, then removed only after capture proves ownership. */
export function removeCapturedFigureEnumerations(text: string, regions: OcrTextRegion[], bbox: [number, number, number, number]): string {
  const labels = validTextRegions(regions).filter(row => /^(?:\d{1,2}[.)](?!\d)\s|ระดับ\s+\d[.)]|ของตัวทำละลาย\s+\d[.)]|จุดเริ่มต้น\s)/u.test(normalizeThaiOcrText(row.text).trim()));
  return removeCapturedGridText(text, labels, bbox);
}

/**
 * T-124: the first choice line printed directly under a figure (overlapping it horizontally, starting in its lower
 * half or below) bounds the crop, so padding does not pull in "ก. …" (owner screenshot Q8). Choices printed beside
 * a figure (Q10/Q20 layouts) do not overlap it horizontally and are ignored.
 */
export function choiceBelowFigureTop(regions: OcrTextRegion[], figure: [number, number, number, number]): number | undefined {
  const middle=figure[0]+(figure[2]-figure[0])/2;
  const rows=validTextRegions(regions).filter(row=>/^\s*[ก-จ]\s*[.)]\s*\S/.test(normalizeThaiOcrText(row.text))&&row.bbox[0]>middle&&row.bbox[1]<figure[3]&&row.bbox[3]>figure[1]);
  return rows.length?Math.min(...rows.map(row=>row.bbox[0])):undefined;
}

/** Loose Thai comparison for noisy OCR: drop spaces, punctuation, vowels above/below and tone marks ("น่าปลา" = "น้ำปลา"). */
const looseThai = (value: string) => normalizeThaiOcrText(value).toLowerCase().replace(/[ัำ-ฺ็-๎\s.,;:()|*\-]/g, "");

/**
 * T-130: choices printed as a table ("ข้อ | การระเหย | การตกผลึก", rows ก-ง) are already rebuilt as choice text
 * ("การระเหย: ขั้นตอนที่ 1, 2; การตกผลึก: ขั้นตอนที่ 3"). A detected figure that is that same table is not a
 * question figure (owner screenshot, chapter 7 set 2 Q5/Q8). Evidence: the question has at least three table-built
 * choices, and the OCR lines inside the figure carry their column labels and most of their cell values. Without OCR
 * lines inside the box, only a provider description naming a choice table counts.
 */
export function isChoiceTableFigure(choices: { text: string }[], regions: OcrTextRegion[], bbox: [number, number, number, number], description = ""): boolean {
  const cells=choices.map(choice=>choice.text.split(/\s*[;|]\s*/).map(cell=>cell.match(/^([^:]{1,40}):\s*(.+)$/)).filter((cell): cell is RegExpMatchArray => Boolean(cell))).filter(row=>row.length>=2);
  if(cells.length<3) return false;
  const labels=Array.from(new Set(cells.flat().map(cell=>looseThai(cell[1])).filter(Boolean)));
  const values=Array.from(new Set(cells.flat().flatMap(cell=>cell[2].split(/\s*,\s*|\s+/)).map(looseThai).filter(value=>value.length>=2)));
  const rows=validTextRegions(regions).filter(row=>{const y=(row.bbox[0]+row.bbox[2])/2,x=(row.bbox[1]+row.bbox[3])/2;return y>=bbox[0]&&y<=bbox[2]&&x>=bbox[1]&&x<=bbox[3];}).map(row=>looseThai(row.text));
  const inside=rows.join("|");
  if(!inside) return /ตารางตัวเลือก|choice table|ตัวเลือกคำตอบ/i.test(description);
  const labelHits=labels.filter(label=>inside.includes(label)).length;
  const valueHits=values.filter(value=>inside.includes(value)).length;
  // Cell OCR is noisy (chapter 7 set 2 Q10 matched 7/20 values): every column label plus one row per choice also counts.
  return labelHits>=Math.ceil(labels.length/2) && (valueHits>=Math.max(2,Math.ceil(values.length/3)) || (labelHits===labels.length && rows.length>cells.length));
}
