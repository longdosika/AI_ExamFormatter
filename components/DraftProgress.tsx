import React from "react";
import { draftProgress, type DocumentDraft } from "@/lib/document-draft-store";

/** T-128: how far a saved draft got (converted, figures, answers, export), shown wherever drafts are offered. */
export const DraftProgress: React.FC<{ draft: DocumentDraft }> = ({ draft }) => {
  const progress = draftProgress(draft);
  const steps = [
    { label: progress.converted ? "แปลงแล้ว" : "ยังไม่แปลง", done: progress.converted },
    { label: progress.figures ? "สกัดรูปแล้ว" : "ยังไม่สกัดรูป", done: progress.figures },
    { label: `เฉลย ${progress.answered}/${progress.total}`, done: progress.total > 0 && progress.answered >= progress.total },
    { label: progress.exportedAt ? `ส่งออกแล้ว ${new Date(progress.exportedAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Bangkok" })}` : "ยังไม่ส่งออก", done: Boolean(progress.exportedAt) },
  ];
  return (
    <ol className="draft-progress" aria-label={`ความคืบหน้า: ${steps.map(step => step.label).join(", ")}`}>
      {steps.map(step => <li key={step.label} data-done={step.done ? "true" : undefined}>{step.label}</li>)}
    </ol>
  );
};
