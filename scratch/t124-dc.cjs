const fs=require('fs');const f='lib/diagram-client.ts';let s=fs.readFileSync(f,'utf8');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,70));s=s.replace(a,()=>b);};
rep("        let safeBbox = constrainFigure(diag.bbox, limits);\n","        // T-124: a choice line directly under the figure bounds it as well.\n        const choiceTop = diag.type === \"question\" ? choiceBelowFigureTop(textRegions[pageIndex] || [], diag.bbox) : undefined;\n        if (choiceTop !== undefined) limits[2] = Math.min(limits[2], choiceTop - 3);\n        let safeBbox = constrainFigure(diag.bbox, limits);\n");
rep("import { constrainFigure, figureVerticalLimits, hasCellRowEvidence,","import { choiceBelowFigureTop, constrainFigure, figureVerticalLimits, hasCellRowEvidence,");
rep("export async function cropBboxFromImage(",`/**
 * T-124: re-crop a figure that was cropped by an older version, from its original page and stored source box,
 * with the current limits (stem lines, a choice line directly below, table continuation, edge widening).
 */
export async function recropFigure(pageImage: string, bbox: [number, number, number, number], role: "question" | "shared", question: number,
  pageQuestions: { questionNumber: number; stem: string }[], regions: OcrTextRegion[], isTable: boolean): Promise<{ url: string; bbox: [number, number, number, number] } | null> {
  const limits: [number, number, number, number] = role === "question"
    ? figureVerticalLimits(question, pageQuestions.map(entry => entry.questionNumber), regions, isTable, bbox, pageQuestions)
    : [0, 0, 1000, 1000];
  const choiceTop = role === "question" ? choiceBelowFigureTop(regions, bbox) : undefined;
  if (choiceTop !== undefined) limits[2] = Math.min(limits[2], choiceTop - 3);
  let safe = constrainFigure(bbox, limits);
  const continuation = safe && isTable ? tableContinuationTop(regions, safe, limits[2]) : undefined;
  if (continuation !== undefined) { limits[2] = Math.min(limits[2], continuation - 3); safe = safe && constrainFigure(safe, limits); }
  if (!safe) return null;
  const url = await cropBboxFromImage(pageImage, safe, role === "question" ? 32 : 16, 3, "all", limits);
  return { url, bbox: safe };
}

export async function cropBboxFromImage(`);
fs.writeFileSync(f,s);console.log('ok');
