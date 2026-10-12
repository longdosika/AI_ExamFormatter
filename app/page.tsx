"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Sparkles, 
  BookOpen, 
  History, 
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Files,
  X,
  FileText
} from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { ParsedFileResult, revokeParsedFileUrls } from "@/lib/file-parser";
import { parseExamText } from "@/lib/exam-parser";
import { validateExamItems } from "@/lib/exam-validation";
import { readReviewedDocument } from "@/lib/reviewed-document";
import { APP_VERSION } from "@/lib/version";
import { ExamItem, FORMATTER_CONSTANTS } from "@/lib/formatter-rules";
import { CaseDecisionManager } from "@/components/CaseDecisionManager";
import { SplitDocumentEditor } from "@/components/SplitDocumentEditor";
import { GoogleDriveStatus } from "@/components/GoogleDriveStatus";
import { generateFallbackExamItems } from "@/lib/exam-fallback";
import { snapshotDocument } from "@/lib/export-document";
import { appendExperiment, experimentReport, readExperiments, ImportExperiment } from "@/lib/experiment-stats";
import { readOcrDocument } from "@/lib/ocr-client";
import { readSourceAnswers } from "@/lib/source-answer-client";
import { readImportHistory, recordImport, ImportHistoryEntry } from "@/lib/import-history";

export default function Home() {
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [formattedItems, setFormattedItems] = useState<ExamItem[] | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [reviewIssues, setReviewIssues] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [showCaseLog, setShowCaseLog] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [driveReady, setDriveReady] = useState(false);
  const [exportLink, setExportLink] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{completed:number;total:number} | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const answerEpoch = useRef(0);
  const [importHistory, setImportHistory] = useState<ImportHistoryEntry[] | null>(null);
  const historyButton = useRef<HTMLButtonElement>(null);
  const historyCloseButton = useRef<HTMLButtonElement>(null);
  const openImportHistory = () => {
    try { setImportHistory(readImportHistory(window.localStorage)); }
    catch { setStatisticsError("อ่านประวัติไฟล์ไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์"); }
  };
  useEffect(() => {
    if (!importHistory) return;
    const trigger = historyButton.current;
    historyCloseButton.current?.focus();
    return () => { trigger?.focus(); };
  }, [importHistory]);

  const downloadStatistics = () => {
    try {
      const report = experimentReport(readExperiments(window.localStorage));
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `exam-experiments-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatisticsError(null);
    } catch {
      setStatisticsError("อ่านสถิติไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์");
    }
  };

  const exportDocument = async (editor: HTMLElement) => {
    if (!parsedFile) throw new Error("ไม่พบเอกสารที่จะส่งออก");
    setExportLink(null);
    const document = snapshotDocument(editor, parsedFile.fileName);
    const response = await fetch("/api/google/export", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(document) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "ส่งออกไม่สำเร็จ");
    setExportLink(result.url);
  };

  const activeFile = useRef<ParsedFileResult | null>(null);
  const sourceQuestionNumbers = useRef<number[]>([]);
  const sourcePagesComplete = useRef(true);
  const uploadEpoch = useRef(0);
  const caseButton = useRef<HTMLButtonElement>(null);
  useEffect(() => () => {
    if (activeFile.current) revokeParsedFileUrls(activeFile.current);
  }, []);

  const handleReset = () => {
    answerEpoch.current++;
    setAnswerBusy(false);
    setOcrProgress(null);
    uploadEpoch.current++;
    setExportLink(null);
    if (activeFile.current) revokeParsedFileUrls(activeFile.current);
    activeFile.current = null;
    sourceQuestionNumbers.current = [];
    sourcePagesComplete.current = true;
    // Clean reset of all document state
    setParsedFile(null);
    setFormattedItems(null);
    setOcrText(null);
    setReviewIssues([]);
    setErrorMessage(null);
    setInfoNotice(null);
  };

  const handleStartUpload = () => {
    // Clear previous document immediately when a new file upload starts
    handleReset();
  };

  const handleCreateStarterDraft = () => {
    if (!activeFile.current) return;
    const fallbackItems = generateFallbackExamItems(activeFile.current);
    sourcePagesComplete.current = true;
    sourceQuestionNumbers.current = fallbackItems.map(item => item.questionNumber);
    setFormattedItems(fallbackItems);
    setReviewIssues([]);
    setErrorMessage(null);
    setInfoNotice(`เปิดแบบร่างข้อสอบเริ่มต้น ${fallbackItems.length} ข้อเรียบร้อย (เน้นความเร็ว) คุณสามารถตรวจเทียบต้นฉบับฝั่งซ้าย ตัดภาพ และแก้ไขข้อความได้ทันที`);
  };

  const handleFileParsed = async (result: ParsedFileResult) => {
    const startedAt = performance.now();
    const observation = {
      mode: "file-text" as ImportExperiment["mode"], status: "needs-review" as ImportExperiment["status"],
      models: [] as string[], questions: 0, choices: 0, mediaGroups: 0, validationIssues: 0,
    };
    const observeItems = (items: ExamItem[], issues: number) => {
      observation.questions = items.length;
      observation.choices = items.reduce((sum,item) => sum + item.choices.length, 0);
      observation.mediaGroups = items.filter(item => item.imageUrl).length;
      observation.validationIssues = issues;
      observation.status = items.length && !issues ? "structured" : "needs-review";
    };
    const epoch = ++uploadEpoch.current;
    answerEpoch.current++;
    setAnswerBusy(false);
    setExportLink(null);
    if (activeFile.current) revokeParsedFileUrls(activeFile.current);
    activeFile.current = null;
    // Completely clear previous state before loading new file
    setParsedFile(null);
    setFormattedItems(null);
    setOcrText(null);
    setReviewIssues([]);
    setErrorMessage(null);
    setInfoNotice(null);

    try {
      if (result.sourceHash && result.pageImages?.length) {
        try {
          const response = await fetch(`/reviewed/${result.sourceHash}.json`, { signal: AbortSignal.timeout(10000) });
          if (epoch !== uploadEpoch.current) { revokeParsedFileUrls(result); return false; }
          const reviewed = response.ok ? readReviewedDocument(await response.json(), result.sourceHash, result.pageImages.length) : null;
          if (epoch !== uploadEpoch.current) { revokeParsedFileUrls(result); return false; }
          if (reviewed) {
            observation.mode = "reviewed-reuse";
            observeItems(reviewed.items, 0);
            result.rawContent = reviewed.text;
            setParsedFile(result);
            setFormattedItems([]);
            setOcrText(reviewed.text);
            sourceQuestionNumbers.current = reviewed.items.map(item => item.questionNumber);
            sourcePagesComplete.current = true;
            activeFile.current = result;
            setDocumentVersion(version => version + 1);
            setInfoNotice(`โหลดฉบับตรวจแก้ที่ตรงกับไฟล์ต้นฉบับ ${reviewed.items.length} ข้อ พร้อมรูปที่ตรวจแล้ว กดจัดรูปแบบเมื่อพร้อม`);
            return true;
          }
        } catch { /* Unknown/unavailable corpus falls back to the normal OCR flow. */ }
        if (epoch !== uploadEpoch.current) { revokeParsedFileUrls(result); return false; }
      }
      let items = parseExamText(result.rawContent, result.extractedImages, result.fileName);
      observeItems(items, validateExamItems(items).length);
      const isScannedDocument = !items.length && (
        (result.pageImages && result.pageImages.length > 0) ||
        result.fileType.startsWith("image/") ||
        Boolean(result.fileUrl && !result.rawContent.trim())
      );

      if (isScannedDocument) {
        let ocrFailure: string | undefined;
        observation.mode = "ocr";
        sourcePagesComplete.current = false;
        // Step 1: Open Split View immediately, but never present fabricated questions as converted data.
        setParsedFile(result);
        setFormattedItems([]);
        activeFile.current = result;
        setDocumentVersion((v) => v + 1);
        setInfoNotice("กำลังใช้ AI OCR อ่านข้อความและสกัดโจทย์ภาษาไทยจากเอกสารต้นฉบับ...");

        // Step 2: Trigger AI OCR in background to extract actual text from page images
        const imagesToOcr = result.pageImages?.length
          ? result.pageImages
          : result.fileType.startsWith("image/") ? result.extractedImages.map(image => image.dataUrl)
          : (result.fileUrl ? [result.fileUrl] : []);

        if (imagesToOcr.length > 0) {
          setOcrProgress({completed:0,total:imagesToOcr.length});
          try {
            const ocrData = await readOcrDocument(imagesToOcr, {
              isCurrent: () => epoch === uploadEpoch.current,
              onProgress: (completed, total) => {
                if (epoch === uploadEpoch.current) {
                  setOcrProgress({completed,total});
                  setInfoNotice(`กำลังอ่าน OCR: ดำเนินการ ${completed}/${total} หน้า ระบบแบ่งส่งอัตโนมัติ`);
                }
              },
            });
            ocrFailure = ocrData.error;
            if (!ocrData.success) observation.status = "failed";
            observation.models = Array.from(new Set(ocrData.pageResults.map(page => page.modelUsed).filter((model): model is string => typeof model === "string" && Boolean(model))));
            if (activeFile.current !== result) return true;
            sourcePagesComplete.current = ocrData.allPagesSuccess === true;
            if (typeof ocrData.text === "string" && ocrData.text.trim()) {
              const observedItems = parseExamText(ocrData.text, result.extractedImages, result.fileName);
              observeItems(observedItems, validateExamItems(observedItems).length + (ocrData.allPagesSuccess ? 0 : 1));
              sourceQuestionNumbers.current = parseExamText(ocrData.text, [], result.fileName).map(item => item.questionNumber);
              setOcrText(ocrData.text);
              setReviewIssues(validateExamItems(parseExamText(ocrData.text, result.extractedImages, result.fileName)));
            }

            const structuredReady = ocrData.success && ocrData.text &&
              ocrData.quality === "ready" && ocrData.questionMarkers > 0 &&
              ocrData.allPagesSuccess;
            if (structuredReady) {
              const ocrItems = parseExamText(ocrData.text, result.extractedImages, result.fileName);
              const issues = validateExamItems(ocrItems);
              observeItems(ocrItems, issues.length);
              setReviewIssues(issues);
              const hasUsableStructure = issues.length === 0;
              if (hasUsableStructure) {
                result.rawContent = ocrData.text;
                setFormattedItems([]);
                setInfoNotice(`OCR อ่านครบแล้ว ${ocrItems.length} ข้อ ตรวจข้อความแล้วกดจัดรูปแบบ`);
                return true;
              }
            }
          } catch (ocrErr) {
            observation.status = "failed";
            ocrFailure = ocrErr instanceof Error ? ocrErr.message : "เชื่อมต่อ OCR ไม่สำเร็จ";
          } finally {
            if (epoch === uploadEpoch.current) setOcrProgress(null);
          }
        }
        if (activeFile.current !== result) return true;
        if (observation.status !== "failed") observation.status = "needs-review";
        sourcePagesComplete.current = true;
        setErrorMessage(ocrFailure ? `อ่าน OCR ไม่ครบ: ${ocrFailure}` : "การแปลงยังต้องตรวจทาน: ตรวจแก้ข้อความ OCR แล้วกดตรวจสอบและจัดรูปแบบอีกครั้ง");
        setInfoNotice("เปิดต้นฉบับแล้ว คุณสามารถกด 'สร้างแบบร่างข้อสอบทันที' เพื่อเริ่มจัดทำข้อสอบและตัดภาพได้เลย (เน้นความเร็ว)");
        return true;
      }

      if (!items.length) {
        setOcrText(result.rawContent);
        setReviewIssues(validateExamItems(items));
        setInfoNotice("เปิดต้นฉบับแล้ว กรุณาตรวจแก้ข้อความก่อนจัดรูปแบบ");
      }
      setParsedFile(result);
      setFormattedItems([]);
      setOcrText(result.rawContent);
      sourceQuestionNumbers.current = items.map(item => item.questionNumber);
      setReviewIssues(validateExamItems(items));
      if (items.length) setInfoNotice("อ่านข้อความแล้ว ตรวจข้อความแล้วกดจัดรูปแบบ");
      activeFile.current = result;
      setDocumentVersion((version) => version + 1);
      return true;
    } catch (error) {
      observation.status = "failed";
      revokeParsedFileUrls(result);
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถแยกข้อสอบได้");
      return false;
    } finally {
      try {
        recordImport(window.localStorage, {id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,fileName:result.fileName.slice(0,256),importedAt:new Date().toISOString(),fileBytes:result.fileSize});
      } catch {
        setStatisticsError("บันทึกประวัติไฟล์ไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์");
      }
      if (epoch !== uploadEpoch.current) observation.status = "cancelled";
      try {
        appendExperiment(window.localStorage, {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          capturedAt: new Date().toISOString(), appVersion: APP_VERSION,
          sourceHash: result.sourceHash || null, fileType: result.fileName.split(".").pop()?.toLowerCase() || "unknown",
          fileBytes: result.fileSize, pages: result.pageImages?.length || (result.fileType.startsWith("image/") ? 1 : 0),
          durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
          environment: `${navigator.userAgent}; logicalCpus=${navigator.hardwareConcurrency || "unknown"}`,
          semanticAccuracy: null, ...observation,
        });
      } catch {
        setStatisticsError("บันทึกสถิติไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์");
      }
    }
  };

  const handleUploadError = (error: string) => {
    setErrorMessage(error);
  };

  const convertReviewedText = async (text: string) => {
    if (!parsedFile) return;
    const epoch = ++answerEpoch.current;
    const upload = uploadEpoch.current;
    const current = () => epoch === answerEpoch.current && upload === uploadEpoch.current;
    const items = parseExamText(text, parsedFile.extractedImages, parsedFile.fileName);
    const issues = validateExamItems(items);
    if (!sourcePagesComplete.current) issues.push("OCR ยังอ่านไม่ครบทุกหน้า กรุณานำเข้าต้นฉบับใหม่ก่อนจัดรูปแบบ");
    const originalNumbers = sourceQuestionNumbers.current;
    const revisedNumbers = new Set(items.map(item => item.questionNumber));
    for (const number of originalNumbers) {
      if (!revisedNumbers.has(number)) issues.push(`ข้อ ${number}: หายไประหว่างตรวจแก้ กรุณาเทียบต้นฉบับ`);
    }
    setOcrText(text);
    setReviewIssues(issues);
    if (!items.length) {
      setErrorMessage("ยังไม่พบข้อสอบสำหรับสร้างฉบับร่าง กรุณาตรวจเลขข้อใน OCR");
      return;
    }
    let answerCount = 0;
    let answerError = "";
    setAnswerBusy(true);
    try {
      const images = parsedFile.pageImages?.length ? parsedFile.pageImages : parsedFile.fileType.startsWith("image/") ? parsedFile.extractedImages.map(image => image.dataUrl) : [];
      const result = await readSourceAnswers(items, images, current, page => setInfoNotice(`กำลังอ่านเฉลยจากต้นฉบับหน้า ${page}/${images.length}`));
      answerCount = result.count;
      if (result.failures.length) answerError = `ยังอ่านเฉลยไม่สำเร็จหน้า ${result.failures.join(", ")}`;
    } catch (error) { answerCount = items.filter(item => item.reconciliationProvenance === "source_vision").length; answerError = error instanceof Error ? error.message : "อ่านเฉลยไม่สำเร็จ"; }
    finally { if (current()) setAnswerBusy(false); }
    if (!current()) return;
    setFormattedItems(items);
    setErrorMessage(issues.length ? `เปิดฉบับร่างแล้ว: มี ${issues.length} รายการให้ตรวจแก้ต่อ` : null);
    setInfoNotice(`จัดโครงสร้างได้ ${items.length} ข้อ · อ่านเฉลยจากภาพได้ ${answerCount} ข้อ${answerError ? ` · ${answerError}` : " · ข้อที่หลักฐานไม่ชัดเจนเว้นเฉลยไว้"} กรุณาเทียบต้นฉบับก่อนส่งออก`);
  };

  const reviewLiveEditor = (editor: HTMLElement) => {
    const snapshot = snapshotDocument(editor, parsedFile?.fileName || "ข้อสอบ");
    const text = snapshot.paragraphs.map(paragraph => paragraph.runs.map(run => run.text || "").join("")).join("\n");
    const items = parseExamText(text);
    items.forEach((item, index) => {
      const image = editor.querySelectorAll('[data-item-id]')[index]?.querySelector('img');
      if (image) item.imageUrl = image.src;
    });
    const issues = validateExamItems(items);
    if (!sourcePagesComplete.current) issues.push("OCR ยังอ่านไม่ครบทุกหน้า");
    for (const number of sourceQuestionNumbers.current) {
      if (!items.some(item => item.questionNumber === number)) issues.push(`ข้อ ${number}: ไม่พบในฉบับแก้ไข`);
    }
    setReviewIssues(issues);
    setErrorMessage(issues.length ? `ฉบับร่างยังมี ${issues.length} รายการให้ตรวจแก้ต่อ` : null);
    setInfoNotice(issues.length ? "แก้ฉบับร่างต่อได้ แล้วตรวจสอบอีกครั้ง" : "ตรวจโครงสร้างฉบับแก้ไขผ่านแล้ว กรุณาเทียบต้นฉบับก่อนส่งออก");
  };

  const isDocumentActive = Boolean(parsedFile && formattedItems);

  return (
    <main className={isDocumentActive ? "w-full h-screen max-h-screen flex flex-col p-2 bg-[#f7f6f2] overflow-hidden" : "max-w-[1600px] mx-auto px-4 py-6"}>
      {/* Top Header Navigation - Single-Line Compact (Earth Tone - Rose Benedict) */}
      <header className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#dedad0] bg-white rounded-lg shadow-2xs shrink-0 ${isDocumentActive ? "min-h-10 px-3 py-1 mb-1.5" : "px-5 py-3 mb-4 rounded-xl"}`}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-[#496053] flex items-center justify-center text-[#eae8e1] font-bold shadow-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-bold text-[#28332d] tracking-tight whitespace-nowrap">AI Exam Formatter</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#eae8e1] text-[#496053] border border-[#dedad0] rounded shadow-2xs">
              {APP_VERSION}
            </span>
            {isDocumentActive && driveReady && (
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold text-[#496053] bg-[#eae8e1] border border-[#dedad0] px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-[#496053]" />
                Drive พร้อม
              </span>
            )}
          </div>
          {!isDocumentActive && (
            <p className="hidden md:block text-xs text-stone-500 ml-2">จัดรูปแบบข้อสอบ ตรวจทาน และแก้ไขก่อนนำไปใช้งาน</p>
          )}
        </div>

        {/* Inlined Notice Pill when document is active - Zero Vertical Space consumed */}
        {isDocumentActive && infoNotice && (
          <div role="status" className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] text-[#496053] bg-[#eae8e1] border border-[#dedad0] rounded-full max-w-sm lg:max-w-md truncate shrink min-w-0">
            <span className="truncate">{infoNotice}</span>
            <button 
              onClick={() => setInfoNotice(null)} 
              className="text-[#496053] hover:text-[#28332d] font-bold px-1 rounded hover:bg-[#dedad0] text-xs shrink-0" 
              title="ปิดข้อความแจ้งเตือน"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <button ref={historyButton} type="button" onClick={openImportHistory} aria-label="ประวัติไฟล์นำเข้า" title="ประวัติไฟล์นำเข้า" className="flex items-center gap-1 px-2 py-1 text-xs text-[#28332d] bg-[#f7f6f2] border border-[#dedad0] rounded-md hover:bg-[#eae8e1]"><Files className="w-3.5 h-3.5" /><span className="hidden lg:inline">ประวัติไฟล์</span></button>
          <button type="button" onClick={downloadStatistics} aria-label="ดาวน์โหลดสถิติการทดลอง" title="ดาวน์โหลดสถิติการทดลอง (เก็บในเบราว์เซอร์นี้)" className="flex items-center gap-1 px-2 py-1 text-xs text-[#28332d] bg-[#f7f6f2] border border-[#dedad0] rounded-md hover:bg-[#eae8e1]">
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">สถิติ</span>
          </button>
          {parsedFile && (
            <button
              onClick={handleReset}
              title="เลือกไฟล์ใหม่"
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#28332d] bg-[#f7f6f2] border border-[#dedad0] hover:bg-[#eae8e1] rounded-md transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">เลือกไฟล์ใหม่</span>
            </button>
          )}

          <button 
            ref={caseButton}
            aria-expanded={showCaseLog}
            aria-controls="case-log-panel"
            onClick={() => setShowCaseLog(!showCaseLog)}
            title="บันทึกปัญหาและวิธีแก้"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition ${
              showCaseLog 
                ? "bg-[#496053] text-white shadow-xs" 
                : "text-[#28332d] bg-[#f7f6f2] border border-[#dedad0] hover:bg-[#eae8e1]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">บันทึกปัญหาและวิธีแก้</span>
          </button>

          <a
            href={FORMATTER_CONSTANTS.TEMPLATE_URL}
            target="_blank"
            rel="noreferrer"
            title="ดูแม่แบบข้อสอบ (Google Docs)"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#496053] border border-[#496053]/30 rounded-md hover:bg-[#eae8e1] transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">แม่แบบ</span>
            <ExternalLink className="w-3 h-3 hidden md:inline" />
          </a>
        </div>
      </header>

      {/* Google Drive Status: Full Card on upload screen, background-active in document view */}
      <div className={isDocumentActive ? "hidden" : "mb-4"}>
        <GoogleDriveStatus onReady={setDriveReady} />
      </div>

      {exportLink && (
        <div role="status" className="mb-2 px-3 py-1.5 rounded-lg bg-[#eae8e1] border border-[#dedad0] text-xs text-[#496053] flex items-center justify-between shrink-0">
          <span>ส่งออกและยืนยันตำแหน่งเรียบร้อยแล้ว</span>
          <a href={exportLink} target="_blank" rel="noreferrer" className="underline font-semibold flex items-center gap-1 text-[#496053] hover:text-[#394c42]">
            เปิด Google Doc <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Case Decision Manager Overlay */}
      {importHistory && (
        <section role="dialog" aria-modal="true" aria-labelledby="import-history-title" onKeyDown={event => {
          if (event.key === "Escape") setImportHistory(null);
          if (event.key === "Tab") {
 const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
 const first = controls[0]; const last = controls[controls.length - 1];
 if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
 if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
 }
        }} className="fixed inset-4 z-50 mx-auto flex max-w-2xl flex-col rounded-xl border border-[#dedad0] bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2"><h2 id="import-history-title" className="text-sm font-semibold text-[#28332d]">ประวัติไฟล์นำเข้า</h2><button ref={historyCloseButton} type="button" aria-label="ปิดประวัติไฟล์" onClick={() => setImportHistory(null)} className="rounded bg-[#f7f6f2] p-2 hover:bg-[#eae8e1]"><X className="h-4 w-4 text-[#28332d]" /></button></div>
          <p className="my-3 text-xs text-stone-600">ล่าสุด 100 ครั้งในเบราว์เซอร์นี้ เก็บเฉพาะชื่อและเวลานำเข้า ไม่เก็บเนื้อไฟล์สำหรับเปิดซ้ำ</p>
          <div tabIndex={0} aria-label="รายการไฟล์ที่เคยนำเข้า" className="overflow-y-auto text-xs">{importHistory.length ? <ol className="divide-y divide-[#eae8e1]">{importHistory.map(entry => <li key={entry.id} className="py-3"><div className="break-all font-medium text-[#28332d]">{entry.fileName}</div><div className="mt-1 text-stone-500">{new Date(entry.importedAt).toLocaleString("th-TH",{timeZone:"Asia/Bangkok"})} · {(entry.fileBytes/1024).toFixed(1)} KB</div></li>)}</ol> : <p>ยังไม่มีประวัติไฟล์นำเข้า</p>}</div>
        </section>
      )}
      {showCaseLog && (
        <div id="case-log-panel" className={isDocumentActive ? "fixed inset-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-[#dedad0] p-4 overflow-y-auto max-w-4xl mx-auto" : "mb-6"}>
          <CaseDecisionManager onClose={() => { setShowCaseLog(false); caseButton.current?.focus(); }} />
        </div>
      )}

      {/* Status & Error Alerts */}
      {statisticsError && <p role="alert" className="mb-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 shrink-0">{statisticsError}</p>}
      {errorMessage && (
        <div role="alert" className="mb-2 rounded-lg bg-amber-50/90 border border-amber-300 p-2.5 text-xs text-amber-950 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <span>{errorMessage}</span>
          <div className="flex items-center gap-2">
            {activeFile.current?.rawContent && activeFile.current.rawContent.trim().length > 30 && !activeFile.current.rawContent.startsWith("[รูปภาพต้นฉบับ") && (!formattedItems || formattedItems.length === 0) && (
              <button
                type="button"
                onClick={() => {
                  if (!activeFile.current) return;
                  setOcrText(activeFile.current.rawContent);
                  setErrorMessage(null);
                  setInfoNotice("โหลดข้อความดิจิทัลเดิมจากไฟล์เรียบร้อย ตรวจสอบข้อความฝั่งขวาแล้วกดแปลงเป็นรูปแบบข้อสอบ");
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#496053] hover:bg-[#394c42] text-white text-[11px] font-medium rounded-md shadow-2xs transition shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ดึงข้อความดิจิทัลเดิม</span>
              </button>
            )}
            {activeFile.current && (!formattedItems || formattedItems.length === 0) && (
              <button
                type="button"
                onClick={handleCreateStarterDraft}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#b3996a] hover:bg-[#9c8355] text-white text-[11px] font-semibold rounded-md shadow-2xs transition shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {!isDocumentActive && infoNotice && (
        <div role="status" className="mb-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-800 flex items-center justify-between shrink-0">
          <span>{infoNotice}</span>
          <button onClick={() => setInfoNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 hover:bg-emerald-200 transition ml-2">
            รับทราบ
          </button>
        </div>
      )}

      {isDocumentActive && parsedFile && formattedItems ? (
        /* Full-Screen 50-50 Split View taking 100% available viewport height */
        <div className="flex-1 min-h-0 h-full w-full">
          <SplitDocumentEditor
            key={`${parsedFile.fileName}_${documentVersion}`}
            parsedFile={parsedFile}
            formattedItems={formattedItems}
            rawOcrText={ocrText}
            ocrProgress={ocrProgress}
            sourcePagesComplete={sourcePagesComplete.current}
            reviewIssues={reviewIssues}
            onConvertReviewedText={convertReviewedText}
            answerBusy={answerBusy}
            onReviewEditor={reviewLiveEditor}
            onReset={handleReset}
            onExportDrive={exportDocument}
            exportAvailable={driveReady && formattedItems.length > 0 && reviewIssues.length === 0}
            onCreateStarterDraft={handleCreateStarterDraft}
          />
        </div>
      ) : (
        /* Initial File Import & Setup Screen */
        <div className="max-w-xl mx-auto space-y-6 pt-4 sm:pt-12">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-base font-bold text-slate-900">นำเข้าไฟล์ข้อสอบ</h2>
              <p className="text-xs text-slate-500">
                เลือกไฟล์เพื่อเทียบต้นฉบับกับข้อสอบที่จัดรูปแบบแล้ว จากนั้นตรวจทานและแก้ไขข้อความได้
              </p>
            </div>

            <FileUploader 
              onFileParsed={handleFileParsed} 
              onError={handleUploadError} 
              onStart={handleStartUpload}
            />
          </div>
        </div>
      )}
    </main>
  );
}
