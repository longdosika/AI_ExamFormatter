"use client";

import React, { useEffect, useState } from "react";
import { CaseDecisionEntry, INITIAL_CASE_DECISIONS, loadCaseEntries, saveCaseEntries } from "@/lib/case-ledger";
import { 
  FileCheck, 
  PlusCircle, 
  Search, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Brain,
  X
} from "lucide-react";

interface CaseDecisionManagerProps {
  onClose?: () => void;
}

export const CaseDecisionManager: React.FC<CaseDecisionManagerProps> = ({ onClose }) => {
  const [cases, setCases] = useState<CaseDecisionEntry[]>(INITIAL_CASE_DECISIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    try {
      setCases(loadCaseEntries(window.localStorage));
      setStorageReady(true);
    } catch {
      setStorageError("อ่านข้อมูลเคสที่บันทึกไว้ไม่ได้ ข้อมูลเดิมยังไม่ถูกเขียนทับ กรุณาเก็บสำเนาข้อมูลและตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์");
    }
  }, []);

  // Form State
  const [newTopic, setNewTopic] = useState("");
  const [newSourceFile, setNewSourceFile] = useState("");
  const [newProblem, setNewProblem] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newOutput, setNewOutput] = useState("");

  const handleAddCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageReady || !newTopic.trim() || !newProblem.trim() || !newDecision.trim()) return;

    const newEntry: CaseDecisionEntry = {
      id: `CASE-${crypto.randomUUID()}`,
      topic: newTopic.trim(),
      sourceFile: newSourceFile.trim() || "ไม่ระบุไฟล์ต้นฉบับ",
      problemDescription: newProblem.trim(),
      decisionTaken: newDecision.trim(),
      outputResult: newOutput.trim() || "ยังไม่ได้ตรวจสอบผลลัพธ์",
      timestamp: `${new Date().toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" })} (+07:00)`,
      status: "NEEDS_REVIEW",
    };

    const updated = [newEntry, ...cases];
    try {
      saveCaseEntries(window.localStorage, updated);
    } catch {
      setStorageError("บันทึกเคสไม่ได้ พื้นที่จัดเก็บอาจเต็มหรือถูกปิดใช้งาน ข้อมูลในฟอร์มยังอยู่ กรุณาลองอีกครั้ง");
      return;
    }
    setStorageError(null);
    setCases(updated);
    setShowAddForm(false);
    // Reset form
    setNewTopic("");
    setNewSourceFile("");
    setNewProblem("");
    setNewDecision("");
    setNewOutput("");
  };

  const filteredCases = cases.filter(
    (c) =>
      c.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sourceFile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.problemDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportAILearning = () => {
    const jsonStr = JSON.stringify(cases, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-case-decisions-learning.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 border border-slate-800">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              บันทึกปัญหาและวิธีแก้
            </h2>
            <p className="text-xs text-slate-400">
              รวบรวมปัญหา วิธีแก้ และผลการตรวจสอบไว้ทบทวนเมื่อต้องจัดรูปแบบข้อสอบครั้งต่อไป
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAILearning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>ดาวน์โหลดบันทึก (JSON)</span>
          </button>
          {onClose && (
            <button aria-label="ปิดบันทึกปัญหา" onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar & Search */}
      <p className="text-xs text-slate-400">เก็บเคสในเบราว์เซอร์นี้เท่านั้น · ดาวน์โหลด JSON เพื่อสำรองข้อมูล · CASE-001 ถึง CASE-003 เป็นตัวอย่างบทเรียน ไม่ใช่หลักฐานตรวจสอบไฟล์ที่นำเข้า</p>
      {storageError && <p role="alert" className="text-xs text-amber-300">{storageError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            aria-label="ค้นหาบันทึกปัญหา"
            placeholder="ค้นหาเคสตามหัวข้อ, ชื่อไฟล์ หรือปัญหา..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-orange-500"
          />
        </div>
        <button
          aria-expanded={showAddForm}
          aria-controls="case-add-form"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#F2604D] hover:bg-[#d94f3c] text-white rounded-xl transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>เพิ่มบันทึกปัญหา</span>
        </button>
      </div>

      {/* Add New Case Form */}
      {showAddForm && (
        <form id="case-add-form" onSubmit={handleAddCase} className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            เพิ่มบันทึกปัญหาและวิธีแก้
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="case-topic" className="block text-slate-300 font-medium mb-1">หัวข้อปัญหา</label>
              <input id="case-topic"
                type="text"
                required
                placeholder="เช่น ขอบตารางในรูปถูกตัด"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label htmlFor="case-source" className="block text-slate-300 font-medium mb-1">ไฟล์หรือลิงก์ต้นฉบับ</label>
              <input id="case-source"
                type="text"
                placeholder="เช่น references/image-crop-rules.md หรือ exam-set-02.docx"
                value={newSourceFile}
                onChange={(e) => setNewSourceFile(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <label htmlFor="case-problem" className="block text-slate-300 font-medium mb-1">ปัญหาที่พบ</label>
              <textarea id="case-problem"
                required
                rows={2}
                placeholder="อธิบายปัญหา เช่น ขอบรูปตารางถูกตัดขาด หรือ ดอกจันเฉลยพิมพ์ผิดข้อ..."
                value={newProblem}
                onChange={(e) => setNewProblem(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="case-decision" className="block text-slate-300 font-medium mb-1">วิธีแก้และเหตุผล</label>
              <textarea id="case-decision"
                required
                rows={2}
                placeholder="ระบุว่าเราตัดสินใจแก้ไขหรือกำหนดกฎอย่างไร..."
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label htmlFor="case-output" className="block text-slate-300 font-medium mb-1">ผลการตรวจสอบ</label>
              <input id="case-output"
                type="text"
                placeholder="เช่น ตรวจสอบแล้วว่าขอบตารางครบทุกด้าน"
                value={newOutput}
                onChange={(e) => setNewOutput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!storageReady}
              className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              บันทึก
            </button>
          </div>
        </form>
      )}

      {/* Case List Display */}
      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {filteredCases.length === 0 && <p role="status" className="text-sm text-slate-300 py-4">ไม่พบบันทึกที่ตรงกับคำค้น ลองค้นด้วยหัวข้อหรือชื่อไฟล์อื่น</p>}
        {filteredCases.map((c) => (
          <div key={c.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 space-y-3 hover:border-slate-600 transition">
            <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-700/60 pb-2.5">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="break-all font-mono text-[11px] bg-orange-500/20 text-orange-300 font-semibold px-2 py-0.5 rounded border border-orange-500/30">
                  {c.id}
                </span>
                <h3 className="text-xs font-bold text-white">{c.topic}</h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>{c.timestamp}</span>
                <span className={`px-2 py-0.5 rounded border ${c.status === "RESOLVED" ? "text-emerald-300 bg-emerald-950/60 border-emerald-800/60" : "text-amber-300 bg-amber-950/60 border-amber-800/60"}`}>
                  {c.status === "RESOLVED" ? "แก้ไขแล้ว" : "รอตรวจสอบ"}
                </span>
              </div>
            </div>

            {/* Source File Link */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
              <LinkIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="min-w-0 font-mono font-medium truncate">{c.sourceFile}</span>
            </div>

            {/* Problem & Decision Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ปัญหาที่พบ:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{c.problemDescription}</p>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>วิธีแก้และเหตุผล:</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">{c.decisionTaken}</p>
              </div>
            </div>

            {/* Output Result */}
            <div className="text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex flex-wrap gap-2 items-center justify-between text-slate-300">
              <span className="text-slate-400 text-[11px]">ผลการตรวจสอบ:</span>
              <span className="text-emerald-300 font-medium flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {c.outputResult}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
