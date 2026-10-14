"use client";

import React, { useMemo } from "react";
import { ImportExperiment } from "@/lib/experiment-stats";
import { 
  BarChart3, 
  X, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Cpu, 
  Layers 
} from "lucide-react";

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  runs: ImportExperiment[];
  onDownloadJson: () => void;
}

export function StatisticsModal({ isOpen, onClose, runs, onDownloadJson }: StatisticsModalProps) {
  // Recent 10 runs (sorted newest first)
  const recentRuns = useMemo(() => {
    return [...runs].reverse().slice(0, 10);
  }, [runs]);

  // Overall metrics
  const stats = useMemo(() => {
    if (!runs.length) return { medianSec: 0, total: 0, structuredRate: 0, avgQuestions: 0 };
    const durations = runs.map(r => r.durationMs).sort((a, b) => a - b);
    const mid = Math.floor(durations.length / 2);
    const medianMs = durations.length % 2 === 0 
      ? (durations[mid - 1] + durations[mid]) / 2 
      : durations[mid];
    
    const structuredCount = runs.filter(r => r.status === "structured").length;
    const avgQ = Math.round(runs.reduce((sum, r) => sum + r.questions, 0) / runs.length);

    return {
      medianSec: (medianMs / 1000).toFixed(1),
      total: runs.length,
      structuredRate: Math.round((structuredCount / runs.length) * 100),
      avgQuestions: avgQ,
    };
  }, [runs]);

  if (!isOpen) return null;

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} ${d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-label="สถิติและประวัติการทำงาน"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div 
        className="w-full max-w-4xl bg-white border border-[#dedad0] rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dedad0] bg-[#f7f6f2] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#496053] flex items-center justify-center text-[#eae8e1]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#28332d]">สถิติและประวัติประสิทธิภาพการทำงาน</h2>
              <p className="text-[11px] text-stone-500">บันทึกสะสมต่อเนื่องในเบราว์เซอร์สำหรับเปรียบเทียบการปรับปรุง</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            aria-label="ปิดหน้าต่างสถิติ"
            className="p-1 rounded-md text-stone-500 hover:text-stone-800 hover:bg-[#eae8e1] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#fbfbfa] border-b border-[#dedad0] shrink-0 text-xs">
          <div className="p-3 bg-white border border-[#dedad0] rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-[#496053]" />
              <span>เวลากลาง (Median)</span>
            </div>
            <div className="mt-1 text-lg font-bold text-[#28332d]">{stats.medianSec}s</div>
            <div className="text-[10px] text-stone-400">ต่อการนำเข้าเอกสาร</div>
          </div>

          <div className="p-3 bg-white border border-[#dedad0] rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-[#496053]" />
              <span>ประวัติสะสมทั้งหมด</span>
            </div>
            <div className="mt-1 text-lg font-bold text-[#28332d]">{stats.total} ครั้ง</div>
            <div className="text-[10px] text-stone-400">เก็บรักษาต่อเนื่องในเครื่อง</div>
          </div>

          <div className="p-3 bg-white border border-[#dedad0] rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#496053]" />
              <span>อัตราความสมบูรณ์</span>
            </div>
            <div className="mt-1 text-lg font-bold text-[#28332d]">{stats.structuredRate}%</div>
            <div className="text-[10px] text-stone-400">จัดโครงสร้างสำเร็จ</div>
          </div>

          <div className="p-3 bg-white border border-[#dedad0] rounded-lg shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-[#496053]" />
              <span>จำนวนข้อเฉลี่ย</span>
            </div>
            <div className="mt-1 text-lg font-bold text-[#28332d]">{stats.avgQuestions} ข้อ</div>
            <div className="text-[10px] text-stone-400">ต่อชุดข้อสอบ</div>
          </div>
        </div>

        {/* Recent 10 Runs Table */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#28332d]">
              10 รอบล่าสุด (เปรียบเทียบผลลัพธ์)
            </span>
            <span className="text-[11px] text-stone-500">
              แสดง {recentRuns.length} จากทั้งหมด {runs.length} ครั้ง
            </span>
          </div>

          {recentRuns.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 border border-dashed border-[#dedad0] rounded-lg">
              ยังไม่มีประวัติการนำเข้าในเบราว์เซอร์นี้
            </div>
          ) : (
            <div className="border border-[#dedad0] rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f7f6f2] border-b border-[#dedad0] text-[11px] font-semibold text-stone-600">
                    <th className="py-2 px-3">เวลาที่บันทึก</th>
                    <th className="py-2 px-3">ชนิด / หน้า</th>
                    <th className="py-2 px-3">ข้อ / ตัวเลือก</th>
                    <th className="py-2 px-3">โมเดล OCR</th>
                    <th className="py-2 px-3 text-right">เวลาที่ใช้</th>
                    <th className="py-2 px-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dedad0] font-mono text-[11px]">
                  {recentRuns.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-[#fbfbfa] transition">
                      <td className="py-2 px-3 font-sans text-stone-700 whitespace-nowrap">
                        {formatTimestamp(r.capturedAt)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="uppercase font-bold text-[#496053]">{r.fileType}</span>
                        <span className="text-stone-500 font-sans ml-1.5">({r.pages} หน้า)</span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap font-sans">
                        <span className="font-semibold text-stone-800">{r.questions} ข้อ</span>
                        <span className="text-stone-400 text-[10px] ml-1">({r.choices} ตัวเลือก)</span>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap text-stone-600 font-sans">
                        <span className="inline-flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-stone-400" />
                          {r.models?.join(", ") || r.mode}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-[#28332d] whitespace-nowrap">
                        {(r.durationMs / 1000).toFixed(2)}s
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {r.status === "structured" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            สำเร็จ
                          </span>
                        ) : r.status === "needs-review" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            ตรวจทาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            {r.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#dedad0] bg-[#f7f6f2] shrink-0">
          <button
            type="button"
            onClick={onDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#28332d] bg-white border border-[#dedad0] hover:bg-[#eae8e1] rounded-lg shadow-2xs transition"
            title="ดาวน์โหลดข้อมูลสถิติประวัติการทำงานทั้งหมดในรูปแบบ JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#496053]" />
            <span>ดาวน์โหลดข้อมูลทั้งหมด (.JSON)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#496053] hover:bg-[#394c42] rounded-lg shadow-2xs transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
