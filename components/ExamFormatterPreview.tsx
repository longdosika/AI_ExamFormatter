"use client";

import React from "react";
import { ExamItem, FORMATTER_CONSTANTS } from "@/lib/formatter-rules";
import { CheckCircle2, AlertTriangle, Image as ImageIcon } from "lucide-react";

interface ExamFormatterPreviewProps {
  items: ExamItem[];
}

export const ExamFormatterPreview: React.FC<ExamFormatterPreviewProps> = ({ items }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">
            ตัวอย่างจัดรูปแบบตามคัมภีร์สูงสุด ({items.length} ข้อ)
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1 rounded">
          Font Size: {FORMATTER_CONSTANTS.FONT_SIZE_PT}pt · Compliant
        </span>
      </div>

      <div className="space-y-6 font-sans text-xs bg-white border border-slate-200 rounded-xl p-6 shadow-sm" style={{ fontSize: "12pt", fontFamily: "'Sarabun', sans-serif" }}>
        {items.map((item) => (
          <div key={item.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 space-y-3">
            {/* 1. Question Number & Text */}
            <div>
              <span className="text-[#F2604D] font-bold text-sm leading-relaxed">
                {item.questionNumber}.{" "}
              </span>
              <span className="text-slate-900 font-light leading-relaxed">{item.questionText}</span>
            </div>

            {/* 2. Question Image (if present) */}
            {item.imageUrl && (
              <div className="pl-4 space-y-2">
                <span className="text-[#F2604D] font-bold">
                  {FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE}
                </span>
                <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 inline-block">
                  <img
                    src={item.imageUrl}
                    alt={`Question ${item.questionNumber} Figure`}
                    className="max-h-48 w-auto object-contain mx-auto"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <ImageIcon className="w-3 h-3 text-emerald-600" />
                      4-Side Perimeter Clearance: <strong>{item.imageStatus || "CLEAN"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Choices Section */}
            <div className="pl-4 space-y-2">
              <div className="text-[#006D77] font-bold text-xs">
                {FORMATTER_CONSTANTS.LABEL_CHOICES}
              </div>
              <div className="pl-2 space-y-1.5">
                {item.choices.map((choice) => {
                  const isGreenShaded = choice.isCorrect && choice.shadingType === "source_provided";
                  const isYellowShaded = choice.isCorrect && choice.shadingType === "auto_solved";
                  const isManualShaded = choice.isCorrect && choice.shadingType === "manual";

                  return (
                    <div
                      key={choice.key}
                      className={`p-2 rounded transition flex items-center justify-between ${
                        isGreenShaded
                          ? "bg-[#E6F4EA] text-emerald-950 font-normal border-l-3 border-emerald-600"
                          : isYellowShaded
                          ? "bg-[#FFF4CC] text-amber-950 font-normal border-l-3 border-amber-500"
                          : isManualShaded ? "bg-[#E3EFFA] text-[#28332d] border-l-3 border-[#397493]" : "text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <span className="font-semibold">{choice.key}. </span>
                        <span className="font-light">{choice.text}</span>
                        {choice.isCorrect && (
                          <span className="text-[#F2604D] font-bold ml-1"> *</span>
                        )}
                      </div>
                      {choice.isCorrect && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-white/70 shadow-2xs">
                          {isManualShaded ? "เฉลยโดยผู้ใช้" : isGreenShaded ? "เฉลยจากต้นฉบับ" : "เฉลยจาก AI"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Explanation Section */}
            <div className="pl-4 pt-1">
              <span className="text-[#006D77] font-bold">
                {FORMATTER_CONSTANTS.LABEL_EXPLANATION}{" "}
              </span>
              <span className="text-slate-700 font-light leading-relaxed">{item.explanationText}</span>
              {item.reconciliationProvenance === "reconciled_from_explanation" && (
                <div className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>
                    Master Reconciliation: ปรับปุ่มเฉลยเป็น <strong>ข้อ {item.reconciledAnswerKey}</strong> ตามข้อความคำอธิบาย
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
