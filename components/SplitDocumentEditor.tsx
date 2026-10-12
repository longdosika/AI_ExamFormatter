"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { parseExamText } from "@/lib/exam-parser";
import { ParsedFileResult } from "@/lib/file-parser";
import { ExamItem, FORMATTER_CONSTANTS } from "@/lib/formatter-rules";
import { RichTextToolbar } from "./RichTextToolbar";
import { 
  FileText, 
  CheckCircle2, 
  Image as ImageIcon, 
  Sparkles, 
  AlertTriangle, 
  Search, 
  Crop, 
  Check, 
  X
} from "lucide-react";

interface SplitDocumentEditorProps {
  parsedFile: ParsedFileResult;
  formattedItems: ExamItem[];
  rawOcrText?: string | null;
  ocrProgress?: {completed:number;total:number} | null;
  sourcePagesComplete?: boolean;
  answerBusy?: boolean;
  reviewIssues?: string[];
  onConvertReviewedText?: (text: string) => void;
  onReviewEditor?: (editor: HTMLElement) => void;
  onReset?: () => void;
  onExportDrive?: (element: HTMLElement) => Promise<void>;
  exportAvailable?: boolean;
  onCreateStarterDraft?: () => void;
}

export const SplitDocumentEditor: React.FC<SplitDocumentEditorProps> = ({
  parsedFile,
  formattedItems,
  rawOcrText = null,
  ocrProgress = null,
  sourcePagesComplete = true,
  answerBusy = false,
  reviewIssues = [],
  onConvertReviewedText,
  onReviewEditor,
  onReset,
  onExportDrive,
  exportAvailable = false,
  onCreateStarterDraft,
}) => {
  const sourcePaneRef = useRef<HTMLDivElement>(null);
  const [sourcePage, setSourcePage] = useState(1);
  const pageCount = parsedFile.pageImages?.length || 0;
  const jumpToSourcePage = (page: number) => {
    const pane = sourcePaneRef.current;
    const target = pane?.querySelector<HTMLElement>(`[data-source-page-target="${page}"]`);
    if (!pane || !target) return;
    pane.scrollTo({ top: pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top, behavior: "instant" });
    setSourcePage(page);
  };
  useEffect(() => {
    const pane = sourcePaneRef.current;
    if (!pane || !pageCount) return;
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const threshold = pane.getBoundingClientRect().top + Math.min(80, pane.clientHeight / 3);
      let current = 1;
      pane.querySelectorAll<HTMLElement>("[data-source-page-target]").forEach(target => {
        if (target.getBoundingClientRect().top <= threshold) current = Number(target.dataset.sourcePageTarget);
      });
      if (pane.scrollHeight - pane.scrollTop - pane.clientHeight <= 2 && pane.scrollTop > 0) current = pageCount;
      setSourcePage(current);
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(update); };
    pane.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => { pane.removeEventListener("scroll", schedule); if (frame !== null) cancelAnimationFrame(frame); };
  }, [pageCount, parsedFile]);
  const [reviewText, setReviewText] = useState(rawOcrText || "");
  useEffect(() => { setReviewText(rawOcrText || ""); }, [rawOcrText]);
  const editorPaneRef = useRef<HTMLDivElement>(null);
  const rawTextRef = useRef<HTMLTextAreaElement>(null);
  const editorSelection = useRef<Range | null>(null);
  useEffect(() => {
    const editor = editorPaneRef.current;
    if (!editor || !formattedItems.length) return;
    const labelImages = () => editor.querySelectorAll('img').forEach(image => {
      const preceding = image.previousElementSibling;
      const outerPreceding = image.parentElement?.previousElementSibling;
      if (preceding?.textContent?.trim() === FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE ||
        (!preceding && outerPreceding?.textContent?.trim() === FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE)) return;
      const label = document.createElement('p');
      label.textContent = FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE;
      label.style.color = FORMATTER_CONSTANTS.COLOR_ORANGE;
      image.before(label);
    });
    labelImages();
    const observer = new MutationObserver(labelImages);
    observer.observe(editor, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [formattedItems]);
  useEffect(() => {
    const rememberSelection = () => {
      const selection = window.getSelection();
      if (selection?.rangeCount && editorPaneRef.current?.contains(selection.anchorNode)) {
        editorSelection.current = selection.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", rememberSelection);
    return () => document.removeEventListener("selectionchange", rememberSelection);
  }, []);

  // Dynamic Exam Items List
  const itemsList = formattedItems;
  const navigationItems = useMemo(() => itemsList.length ? itemsList : parseExamText(reviewText), [itemsList, reviewText]);
  const [activeQuestionId, setActiveQuestionId] = useState(1);
  const jumpToQuestion = (item: ExamItem) => {
    setActiveQuestionId(item.id);
    setTargetQuestionId(item.id);
    const pane = editorPaneRef.current;
    const target = pane?.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if (pane && target) {
      pane.scrollTo({top:pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top,behavior:"instant"});
    } else if (rawTextRef.current) {
      const text = rawTextRef.current;
      const match = new RegExp(`^\\s*(?:\\*{1,2})?${item.questionNumber}[.)]\\s+`, "m").exec(text.value);
      if (match) {
        text.focus();
        text.setSelectionRange(match.index, match.index + match[0].length);
        const line = text.value.slice(0,match.index).split("\n").length - 1;
        text.scrollTop = Math.max(0,line * (parseFloat(getComputedStyle(text).lineHeight) || 18) - 40);
      }
    }
  };
  useEffect(() => {
    const pane = editorPaneRef.current;
    if (!pane || !itemsList.length) return;
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const top = pane.getBoundingClientRect().top + 60;
      let current = itemsList[0].id;
      pane.querySelectorAll<HTMLElement>("[data-item-id]").forEach(target => {
        if (target.getBoundingClientRect().top <= top) current = Number(target.dataset.itemId);
      });
      if (pane.scrollHeight - pane.scrollTop - pane.clientHeight <= 2 && pane.scrollTop > 0) current = itemsList[itemsList.length-1].id;
      setActiveQuestionId(current);
    };
    const schedule = () => { if (frame === null) frame = requestAnimationFrame(update); };
    pane.addEventListener("scroll",schedule,{passive:true});
    update();
    return () => {pane.removeEventListener("scroll",schedule);if(frame!==null)cancelAnimationFrame(frame);};
  }, [itemsList]);

  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  // 1. Magnifier Glass Tool State
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierZoom, setMagnifierZoom] = useState(2.5);
  const [mouseCoord, setMouseCoord] = useState<{
    clientX: number;
    clientY: number;
    docX: number;
    docY: number;
    visible: boolean;
  }>({
    clientX: 0,
    clientY: 0,
    docX: 0,
    docY: 0,
    visible: false,
  });

  // 2. Region Capture / Snipping Tool State
  const [isCaptureActive, setIsCaptureActive] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  } | null>(null);

  const [capturedImageSnippet, setCapturedImageSnippet] = useState<string | null>(null);
  const [pendingCropInsert, setPendingCropInsert] = useState(false);
  const cropTargetRef = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (!capturedImageSnippet) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    cropTargetRef.current?.focus();
    return () => previousFocus?.focus();
  }, [capturedImageSnippet]);
  const [targetQuestionId, setTargetQuestionId] = useState<number>(
    formattedItems[0]?.id || 0
  );

  useEffect(() => {
    if (formattedItems.length > 0) {
      setTargetQuestionId(formattedItems[0].id);
    }
  }, [formattedItems]);

  // Independent source scrolling (tracks magnifier without affecting editor)
  const handleSourceScroll = () => {
    if (isMagnifierActive && mouseCoord.visible && sourcePaneRef.current) {
      const left = sourcePaneRef.current;
      const rect = left.getBoundingClientRect();
      setMouseCoord((prev) => ({
        ...prev,
        docX: prev.clientX - rect.left + left.scrollLeft,
        docY: prev.clientY - rect.top + left.scrollTop,
      }));
    }
  };

  // Magnifier & Capture Mouse Handlers over source panel
  const handleSourceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sourcePaneRef.current) return;
    const rect = sourcePaneRef.current.getBoundingClientRect();
    const docX = e.clientX - rect.left + sourcePaneRef.current.scrollLeft;
    const docY = e.clientY - rect.top + sourcePaneRef.current.scrollTop;

    if (isMagnifierActive) {
      setMouseCoord({
        clientX: e.clientX,
        clientY: e.clientY,
        docX,
        docY,
        visible: true,
      });
    }

    if (isCaptureActive && selectionBox && selectionBox.isDragging) {
      setSelectionBox((prev) => (prev ? { ...prev, currentX: docX, currentY: docY } : null));
    }
  };

  const handleCaptureMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isCaptureActive || !sourcePaneRef.current) return;
    const rect = sourcePaneRef.current.getBoundingClientRect();
    const docX = e.clientX - rect.left + sourcePaneRef.current.scrollLeft;
    const docY = e.clientY - rect.top + sourcePaneRef.current.scrollTop;

    setSelectionBox({
      startX: docX,
      startY: docY,
      currentX: docX,
      currentY: docY,
      isDragging: true,
    });
  };

  const handleCaptureMouseUp = () => {
    if (!isCaptureActive || !selectionBox || !selectionBox.isDragging) return;

    const width = Math.abs(selectionBox.currentX - selectionBox.startX);
    const height = Math.abs(selectionBox.currentY - selectionBox.startY);
    const selLeft = Math.min(selectionBox.startX, selectionBox.currentX);
    const selTop = Math.min(selectionBox.startY, selectionBox.currentY);

    if (width > 20 && height > 20 && sourcePaneRef.current) {
      // Find image element within selection to crop real pixels
      const imgElements = sourcePaneRef.current.querySelectorAll("img");
      let croppedDataUrl: string | null = null;

      for (const img of Array.from(imgElements)) {
        const imgRect = img.getBoundingClientRect();
        const containerRect = sourcePaneRef.current.getBoundingClientRect();
        const imgTopInContainer = imgRect.top - containerRect.top + sourcePaneRef.current.scrollTop;
        const imgLeftInContainer = imgRect.left - containerRect.left + sourcePaneRef.current.scrollLeft;

        // Check intersection with selection
        if (
          selTop >= imgTopInContainer &&
          selTop + height <= imgTopInContainer + img.clientHeight &&
          selLeft >= imgLeftInContainer &&
          selLeft + width <= imgLeftInContainer + img.clientWidth
        ) {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(width);
            canvas.height = Math.round(height);
            const ctx = canvas.getContext("2d");

            if (ctx && img.naturalWidth) {
              const scaleX = img.naturalWidth / img.clientWidth;
              const scaleY = img.naturalHeight / img.clientHeight;
              const sx = Math.max(0, (selLeft - imgLeftInContainer) * scaleX);
              const sy = Math.max(0, (selTop - imgTopInContainer) * scaleY);
              const sw = Math.min(img.naturalWidth - sx, width * scaleX);
              const sh = Math.min(img.naturalHeight - sy, height * scaleY);

              ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
              croppedDataUrl = canvas.toDataURL("image/png");
              break;
            }
          } catch (e) {
            console.warn("Canvas crop fallback:", e);
          }
        }
      }

      if (!croppedDataUrl) {
        setCapturedImageSnippet(null);
        setSelectionBox(null);
        showNotice("ตัดภาพไม่ได้ กรุณาเลือกพื้นที่ภายในรูปต้นฉบับที่โหลดแล้ว ไม่รองรับการตัดจากข้อความหรือ PDF iframe");
        return;
      }

      setCapturedImageSnippet(croppedDataUrl);
      showNotice("แคปภาพพื้นที่สำเร็จ! กรุณาเลือกข้อสอบที่ต้องการแทรก");
    }

    setSelectionBox(null);
  };

  // Insert Captured Image into Target Question Item
  const handleInsertCapturedImage = () => {
    if (!capturedImageSnippet) return;
    if (!itemsList.length) {
      if (!navigationItems.length) { showNotice("ยังไม่พบข้อสอบ กรุณาตรวจเลขข้อใน OCR ก่อนแทรกรูป"); return; }
      setPendingCropInsert(true);
      onConvertReviewedText?.(reviewText);
      return;
    }

    // Insert into the live editor DOM: rerendering React children would erase manual edits.
    const target = editorPaneRef.current?.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(String(targetQuestionId))}"]`);
    if (!target) {
      showNotice("ไม่พบข้อสอบปลายทาง กรุณาเลือกข้อสอบใหม่");
      return;
    }
    let figure = target.querySelector<HTMLElement>("[data-question-image]");
    if (!figure) {
      figure = document.createElement("div");
      figure.dataset.questionImage = "true";
      target.insertBefore(figure, target.children[1] || null);
    }
    const label = document.createElement("p");
    label.textContent = FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE;
    const image = document.createElement("img");
    image.src = capturedImageSnippet;
    image.alt = "ภาพโจทย์ที่ตัดจากต้นฉบับ — ยังไม่ได้ตรวจสอบขอบ";
    image.style.maxHeight = "224px";
    image.style.maxWidth = "100%";
    figure.replaceChildren(label, image);

    setCapturedImageSnippet(null);
    setIsCaptureActive(false);
    showNotice(`แทรกรูปภาพเรียบร้อยแล้วใน [${targetQuestionId}]`);
  };

  useEffect(() => {
    if (!pendingCropInsert || !itemsList.length) return;
    setPendingCropInsert(false);
    handleInsertCapturedImage();
    // Apply once after draft DOM mounts; keep manual edits in the live DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCropInsert, itemsList]);

  // Rich Text Format Commands
  const restoreEditorSelection = () => {
    editorPaneRef.current?.focus();
    if (editorSelection.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(editorSelection.current);
    }
  };
  const handleFormat = (command: string, value?: string) => {
    restoreEditorSelection();
    document.execCommand(command, false, value);
  };

  const handleInsertImage = () => {
    const url = prompt("กรอกลิงก์รูปภาพ HTTPS หรือข้อมูลรูปภาพ (data:image):", "");
    if (url) {
      if (!/^https:\/\//i.test(url) && !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(url)) {
        showNotice("กรุณาใช้ลิงก์ HTTPS หรือข้อมูลรูปภาพ PNG, JPEG, WebP, GIF");
        return;
      }
      restoreEditorSelection();
      const selection = window.getSelection();
      const element = selection?.anchorNode instanceof Element ? selection.anchorNode : selection?.anchorNode?.parentElement;
      const target = element?.closest('[data-item-id]') || editorPaneRef.current?.querySelector(`[data-item-id="${CSS.escape(String(targetQuestionId))}"]`);
      if (!target || !editorPaneRef.current?.contains(target)) { showNotice("เลือกข้อสอบที่ต้องการแทรกรูปก่อน"); return; }
      const figure = document.createElement("div");
      figure.dataset.questionImage = "true";
      const label = document.createElement("p"); label.textContent = FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE;
      const image = document.createElement("img"); image.src = url; image.alt = "รูปโจทย์"; image.style.maxWidth = "100%";
      figure.append(label, image);
      target.insertBefore(figure, target.children[1] || null);
    }
  };

  const handleCopyAll = async () => {
    if (!editorPaneRef.current) return;
    try {
      await navigator.clipboard.writeText(editorPaneRef.current.innerText);
      showNotice("คัดลอกเนื้อหาทั้งหมดเรียบร้อยแล้ว!");
    } catch {
      showNotice("คัดลอกไม่ได้ กรุณาเลือกเนื้อหาแล้วคัดลอกด้วยตนเอง");
    }
  };

  const handleExportDrive = async () => {
    if (!itemsList.length || !exportAvailable || !onExportDrive || !editorPaneRef.current) {
      showNotice("เชื่อมต่อ Google Drive และตรวจสอบโฟลเดอร์ปลายทางก่อนส่งออก");
      return;
    }
    if (exporting) return;
    setExporting(true);
    try {
      await onExportDrive(editorPaneRef.current);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "ส่งออกไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 w-full space-y-2">
      {/* Toast Notification */}
      {notification && (
        <div role="status" className="bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between animate-fade-in">
          <span className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            {notification}
          </span>
        </div>
      )}

      {/* Captured Image Preview Modal */}
      {capturedImageSnippet && (
        <div role="dialog" aria-modal="true" aria-labelledby="crop-dialog-title" onKeyDown={(event) => {
          if (event.key === "Escape") setCapturedImageSnippet(null);
          if (event.key === "Tab") {
            const controls = event.currentTarget.querySelectorAll<HTMLElement>("button, select");
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Crop className="w-4 h-4 text-[#F2604D]" />
                <span id="crop-dialog-title">แทรกภาพที่ตัดจากต้นฉบับ</span>
              </div>
              <button
                aria-label="ปิดหน้าต่างแทรกภาพ"
                onClick={() => setCapturedImageSnippet(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center space-y-2">
              <img
                src={capturedImageSnippet}
                alt="ภาพที่ตัดจากต้นฉบับ"
                className="max-h-52 mx-auto object-contain rounded border border-slate-200 shadow-2xs"
              />
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                สถานะขอบภาพ: <strong>ยังไม่ได้ตรวจสอบ</strong>
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="crop-target" className="block text-xs font-semibold text-slate-700">
                เลือกข้อสอบที่ต้องการแทรกรูปภาพนี้เป็น [รูปโจทย์]:
              </label>
              <select
                ref={cropTargetRef}
                id="crop-target"
                disabled={!navigationItems.length}
                value={targetQuestionId}
                onChange={(e) => setTargetQuestionId(Number(e.target.value))}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#F2604D]"
              >
                {!navigationItems.length && <option value={targetQuestionId}>ยังไม่พบข้อสอบ กรุณาตรวจเลขข้อใน OCR ก่อนแทรกรูป</option>}
                {navigationItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} · ข้อ {item.questionNumber}: {item.questionText.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCapturedImageSnippet(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleInsertCapturedImage}
                disabled={!navigationItems.length || pendingCropInsert}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F2604D] hover:bg-[#d84d3b] rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>แทรกเป็นรูปโจทย์</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen 50-50 Split Container filling height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 h-full w-full">
        {/* LEFT PANEL: Original Source File (50%) */}
        <div data-workspace="source" className="lg:col-span-6 min-w-0 h-full flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden relative">
          {/* Header Toolbar */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex flex-wrap gap-2 items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <FileText className="w-4 h-4 text-[#F2604D]" />
              <span>ต้นฉบับ</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Magnifier Glass Button & Zoom Selector */}
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  aria-label="แว่นขยายส่องเฉพาะจุด"
                  aria-pressed={isMagnifierActive}
                  onClick={() => {
                    setIsMagnifierActive(!isMagnifierActive);
                    if (isCaptureActive) setIsCaptureActive(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition ${
                    isMagnifierActive
                      ? "bg-[#F2604D] text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  title="เปิด/ปิด แว่นขยายส่องเฉพาะจุด"
                >
                  <Search className="w-3.5 h-3.5" />
                  
                </button>
                {isMagnifierActive && (
                  <div className="flex items-center gap-0.5 pl-1 pr-1 border-l border-slate-200">
                    {[2, 2.5, 3.5].map((z) => (
                      <button
                        key={z}
                        aria-label={`ขยาย ${z} เท่า`}
                        aria-pressed={magnifierZoom === z}
                        onClick={() => setMagnifierZoom(z)}
                        className={`px-1.5 py-0.5 text-[10px] rounded font-bold ${
                          magnifierZoom === z ? "bg-[#F2604D] text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Region Snipping / Capture Button */}
              <button
                aria-label="แคปภาพเฉพาะจุด"
                aria-pressed={isCaptureActive}
                onClick={() => {
                  setIsCaptureActive(!isCaptureActive);
                  if (isMagnifierActive) setIsMagnifierActive(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg transition ${
                  isCaptureActive
                    ? "bg-[#006D77] text-white shadow-sm ring-2 ring-[#006D77]/30"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
                title="คลิกลากครอบพื้นที่รูปภาพ/สมการเฉพาะจุดเพื่อนำไปใช้เป็นรูปโจทย์"
              >
                <Crop className="w-3.5 h-3.5" />
                
              </button>

              <span className="min-w-0 flex-1 truncate font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                {parsedFile.fileName}
              </span>
            </div>
          </div>

          {/* Capture Active Instruction Banner */}
          {pageCount > 0 && <div className="px-3 py-1 text-[9px] text-slate-500 border-b border-slate-100">ต้นฉบับหน้า {sourcePage}/{pageCount} · เลื่อนตรวจได้อิสระจากฝั่งขวา</div>}
          {isCaptureActive && (
            <div className="bg-[#006D77] text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs z-30">
              <span className="flex items-center gap-1.5 font-medium">
                <Crop className="w-3.5 h-3.5 text-emerald-300" />
                คลิกลากกรอบสี่เหลี่ยมบนเอกสารเพื่อตัดภาพโจทย์ / ตาราง
              </span>
              <button
                aria-pressed={isCaptureActive}
                onClick={() => {
                  setIsCaptureActive(false);
                  setSelectionBox(null);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded text-[11px]"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* Document Content View & Interactive Capture Layer */}
          <div
            ref={sourcePaneRef}
            onScroll={handleSourceScroll}
            onMouseMove={handleSourceMouseMove}
            onMouseLeave={() => {
              setMouseCoord((prev) => ({ ...prev, visible: false }));
              if (!selectionBox?.isDragging) setSelectionBox(null);
            }}
            className="relative flex-1 min-h-0 p-0 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-100/70 leading-relaxed select-none"
          >
            {/* Capture Transparent Interceptor Layer (Eliminates native img drag interference) */}
            {isCaptureActive && (
              <div
                className="absolute inset-0 z-30 cursor-crosshair select-none"
                style={{ height: `${sourcePaneRef.current?.scrollHeight || 1000}px` }}
                onMouseDown={handleCaptureMouseDown}
                onMouseMove={handleSourceMouseMove}
                onMouseUp={handleCaptureMouseUp}
              />
            )}

            {/* Interactive Region Capture Drag Selection Box */}
            {isCaptureActive && selectionBox && (
              <div
                className="absolute z-40 border-2 border-dashed border-[#F2604D] bg-[#F2604D]/25 pointer-events-none rounded shadow-xs"
                style={{
                  left: `${Math.min(selectionBox.startX, selectionBox.currentX)}px`,
                  top: `${Math.min(selectionBox.startY, selectionBox.currentY)}px`,
                  width: `${Math.abs(selectionBox.currentX - selectionBox.startX)}px`,
                  height: `${Math.abs(selectionBox.currentY - selectionBox.startY)}px`,
                }}
              >
                <span className="absolute -top-5 left-0 bg-[#F2604D] text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                  {Math.round(Math.abs(selectionBox.currentX - selectionBox.startX))} x{" "}
                  {Math.round(Math.abs(selectionBox.currentY - selectionBox.startY))} px
                </span>
              </div>
            )}

            {/* Optical Centered Magnifier Glass Lens Overlay (Earth Tone - Rose Benedict) */}
            {isMagnifierActive && mouseCoord.visible && (
              <div
                className="pointer-events-none fixed z-50 rounded-full border-4 border-[#b3996a] bg-white shadow-2xl overflow-hidden flex items-center justify-center"
                style={{
                  width: "220px",
                  height: "220px",
                  left: `${mouseCoord.clientX - 110}px`,
                  top: `${mouseCoord.clientY - 110}px`,
                  boxShadow: "0 14px 40px rgba(0,0,0,0.5), inset 0 0 15px rgba(0,0,0,0.15)",
                }}
              >
                {/* Zoom Badge */}
                <div className="absolute top-2.5 bg-[#496053] text-white text-[9px] px-2.5 py-0.5 rounded-full font-bold shadow-xs z-20">
                  {magnifierZoom}x ZOOM
                </div>

                {/* Center Crosshair Reticle */}
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-full border border-[#b3996a]/80 bg-[#b3996a]/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b3996a]"></div>
                  </div>
                  <div className="absolute w-8 h-[1px] bg-[#b3996a]/50"></div>
                  <div className="absolute h-8 w-[1px] bg-[#b3996a]/50"></div>
                </div>

                {/* Magnified Content Layer - Exact Optical Translation */}
                <div
                  className="absolute pointer-events-none origin-top-left"
                  style={{
                    width: `${sourcePaneRef.current?.clientWidth || 700}px`,
                    transform: `scale(${magnifierZoom})`,
                    left: `${110 - mouseCoord.docX * magnifierZoom}px`,
                    top: `${110 - mouseCoord.docY * magnifierZoom}px`,
                  }}
                >
                  {parsedFile.pageImages && parsedFile.pageImages.length > 0 ? (
                    <div className="space-y-4 p-4 bg-white">
                      {parsedFile.pageImages.map((url, idx) => (
                        <div key={idx} className="relative border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <img
                            src={url}
                            alt={`Zoom Page ${idx + 1}`}
                            className="w-full h-auto block select-none"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  ) : parsedFile.fileUrl && [".png", ".jpg", ".jpeg"].includes(parsedFile.extension) ? (
                    <div className="p-4 bg-white">
                      <img
                        src={parsedFile.fileUrl}
                        alt={parsedFile.fileName}
                        className="max-w-full h-auto rounded-lg mx-auto select-none"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="p-6 font-mono text-xs whitespace-pre-wrap bg-white text-slate-800">
                      {parsedFile.rawContent}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Continuous Page Images Renderer (DOM Native Pages) */}
            {parsedFile.pageImages && parsedFile.pageImages.length > 0 ? (
              <div className="space-y-4 p-4">
                {parsedFile.pageImages.map((pageUrl, idx) => (
                  <div
                    key={idx}
                    data-source-page-target={idx + 1}
                    className="relative border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden group"
                  >
                    <div className="absolute top-2 right-2 bg-slate-900/70 text-white text-[8px] px-1.5 py-0.5 rounded font-mono z-10 backdrop-blur-xs">
                      หน้าที่ {idx + 1} / {parsedFile.pageImages?.length}
                    </div>
                    <img
                      src={pageUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-auto block select-none pointer-events-auto"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                  </div>
                ))}
              </div>
            ) : parsedFile.fileUrl && parsedFile.extension === ".pdf" ? (
              <iframe
                src={parsedFile.fileUrl}
                className="w-full h-full min-h-[650px] border-0 bg-white"
                title="ไฟล์ PDF ต้นฉบับ"
              />
            ) : parsedFile.fileUrl && [".png", ".jpg", ".jpeg"].includes(parsedFile.extension) ? (
              <div className="p-4 space-y-4 text-center">
                <div className="border border-slate-200 rounded-xl p-2 bg-white shadow-xs inline-block max-w-full">
                  <img
                    src={parsedFile.fileUrl}
                    alt={parsedFile.fileName}
                    className="max-w-full h-auto max-h-[850px] object-contain rounded-lg mx-auto"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-sans">
                  ไฟล์รูปภาพต้นฉบับ ({parsedFile.fileName}) - แสดงผลความละเอียดเต็มสำหรับสอบทาน OCR
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="whitespace-pre-wrap">{parsedFile.rawContent}</div>

                {parsedFile.extractedImages.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="font-sans font-semibold text-slate-700 flex items-center gap-1.5 text-xs">
                      <ImageIcon className="w-4 h-4 text-[#F2604D]" />
                      <span>รูปภาพฝังในเอกสาร ({parsedFile.extractedImages.length} รูป):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {parsedFile.extractedImages.map((img, idx) => (
                        <div key={idx} className="border border-slate-200 rounded-lg p-2 bg-white shadow-2xs text-center space-y-1">
                          <img src={img.dataUrl} alt={`Source figure ${idx}`} className="max-h-36 mx-auto object-contain" />
                          <span className="text-[10px] text-slate-400 block font-mono">{img.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: OCR, Conversion & Rich Text Editor (50%) */}
        <div data-workspace="conversion" className="lg:col-span-6 min-w-0 h-full flex flex-col bg-white border border-[#dedad0] rounded-xl shadow-xs overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#dedad0] bg-[#f7f6f2] px-3 py-1.5 text-[10px] shrink-0">
            <span className="font-semibold text-[#28332d]">{itemsList.length ? reviewIssues.length ? "ฉบับร่าง · ตรวจแก้ต่อได้" : "ข้อสอบที่จัดรูปแบบแล้ว" : "OCR"}</span>
            <button type="button" disabled={answerBusy || Boolean(ocrProgress) || !sourcePagesComplete || !reviewText.trim() || itemsList.length > 0} onClick={() => onConvertReviewedText?.(reviewText)} className="rounded bg-[#496053] hover:bg-[#394c42] px-2.5 py-1.5 text-xs text-white disabled:opacity-50 transition" title="จัดข้อความเป็นข้อสอบและใช้เฉลยเฉพาะที่มีในต้นฉบับ">
              {answerBusy ? "กำลังอ่านเฉลย…" : itemsList.length ? "จัดรูปแบบแล้ว" : "แปลงเป็นรูปแบบข้อสอบ"}
            </button>
            <span className="sr-only">{ocrProgress ? "รอ OCR อ่านครบก่อนแปลง" : !sourcePagesComplete ? "OCR ยังอ่านไม่ครบทุกหน้า" : itemsList.length ? "แก้ข้อความ จัดรูป และส่งออกจากฝั่งขวา" : "ตรวจข้อความ แล้วกดแปลง · ใช้เฉลยถ้ามีในต้นฉบับ"}</span>
            {itemsList.length > 0 && reviewIssues.length > 0 && <button type="button" onClick={() => editorPaneRef.current && onReviewEditor?.(editorPaneRef.current)} className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-900">ตรวจสอบฉบับแก้ไข</button>}
            {itemsList.length > 0 && <div className="min-w-0 flex-1" data-editor-tools="true">
            <RichTextToolbar
              onFormat={handleFormat}
              onInsertImage={handleInsertImage}
              onCopyAll={handleCopyAll}
              onExportDrive={handleExportDrive}
              exportAvailable={exportAvailable}
              exporting={exporting}
              editingAvailable={itemsList.length > 0}
            />
            </div>}

          </div>
          {itemsList.length > 0 && reviewIssues.length > 0 && <details className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900"><summary>รายการตรวจแก้ {reviewIssues.length} รายการ · แก้ข้อความและแทรกรูปต่อได้</summary><ul className="max-h-32 overflow-y-auto list-disc pl-4">{reviewIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul></details>}
          {navigationItems.length > 0 && <nav aria-label="เลือกข้อสอบ" className="flex items-center gap-1 border-b border-[#dedad0] bg-white px-2 py-1 shrink-0 min-w-0">
            <span className="shrink-0 text-[9px] text-[#28332d]">ข้อ</span>
            <div className="flex gap-0.5 overflow-x-auto min-w-0 py-0.5">{navigationItems.map(item => <button key={item.id} type="button" aria-label={`ไปข้อ ${item.questionNumber}`} aria-current={activeQuestionId === item.id ? "true" : undefined} onClick={() => jumpToQuestion(item)} className={`shrink-0 min-w-5 rounded px-1 py-0.5 text-[10px] transition ${activeQuestionId === item.id ? "bg-[#496053] text-white" : "bg-[#eae8e1] text-[#28332d] hover:bg-[#dedad0]"}`}>{item.questionNumber}</button>)}</div>
          </nav>}
          {/* Editable Continuous Document Area */}
          <div
            ref={editorPaneRef}
            role="textbox"
            aria-label="ข้อสอบที่จัดรูปแบบแล้ว"
            aria-multiline="true"
            contentEditable={itemsList.length > 0}
            suppressContentEditableWarning
            className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 font-sans text-xs bg-white text-slate-900 focus:outline-none leading-relaxed"
            style={{ fontSize: "12pt", fontFamily: "'Sarabun', sans-serif" }}
          >
            {ocrProgress ? (
              <div role="status" aria-live="polite" aria-label="กำลังสแกน OCR" className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-6 text-center">
                <div aria-hidden="true" className="relative h-20 w-16 overflow-hidden rounded-lg border-2 border-teal-600 bg-white shadow-sm">
                  <div className="space-y-2 px-2 py-3">{[1,2,3,4,5].map(line => <div key={line} className="h-1 rounded bg-teal-100" />)}</div>
                  <div className="ocr-scan-line absolute inset-x-0 top-0 h-1 bg-teal-500 shadow-[0_0_12px_3px_rgba(20,184,166,0.4)]" />
                </div>
                <div className="text-sm font-semibold text-teal-900">กำลังสแกนและอ่านข้อความจากต้นฉบับ</div>
                <div className="text-xs text-slate-600">ดำเนินการแล้ว {ocrProgress.completed}/{ocrProgress.total} หน้า · ระบบแบ่งส่งเป็นล็อตให้อัตโนมัติ</div>
                <div className="text-xs text-slate-500">ระหว่างรอ ตรวจต้นฉบับและแคปรูปจากฝั่งซ้ายได้</div>
              </div>
            ) : itemsList.length === 0 ? (
              <div className="space-y-4">
                <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold">{rawOcrText && !reviewIssues.length ? "อ่านข้อความแล้ว พร้อมจัดรูปแบบ" : rawOcrText ? "ข้อความมีส่วนที่ต้องตรวจแก้ก่อนจัดรูปแบบ" : "ยังไม่มีข้อความ OCR ที่อ่านได้"}</div>
                  <div className="mt-1 text-xs">ตรวจข้อความฝั่งขวาเทียบต้นฉบับฝั่งซ้าย แล้วกดแปลง ระบบใช้เฉลยจากต้นฉบับถ้ามี</div>
                </div>
                {rawOcrText ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      ข้อความ OCR ดิบสำหรับตรวจสอบก่อนจัดรูปแบบ
                    </div>
                    <textarea ref={rawTextRef} aria-label="ข้อความ OCR สำหรับตรวจแก้" value={reviewText} onChange={event => setReviewText(event.target.value)} className="w-full min-h-[420px] resize-y rounded border border-slate-300 p-3 font-mono text-xs leading-relaxed" />
                    {reviewIssues.length > 0 && <ul aria-label="รายการที่ต้องตรวจแก้" className="mt-3 list-disc pl-5 text-xs text-amber-900">{reviewIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div role="status" className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                      <div className="font-semibold text-slate-800 mb-1">ยังไม่มีข้อความ OCR ที่ได้รับกลับมา</div>
                      <div className="text-slate-500">สามารถพิมพ์ข้อความด้านล่าง วางข้อความ หรือกดสร้างแบบร่างเริ่มต้นเพื่อเริ่มทำงานทันที</div>
                    </div>

                    {onCreateStarterDraft && (
                      <div className="rounded-xl border border-[#dedad0] bg-[#eae8e1]/60 p-5 text-center space-y-3 shadow-2xs">
                        <div className="w-10 h-10 rounded-full bg-[#eae8e1] text-[#b3996a] border border-[#dedad0] flex items-center justify-center mx-auto shadow-2xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-[#28332d] text-sm">ทางเลือก A (เน้นความเร็ว): สร้างแบบร่างข้อสอบทันที</div>
                          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                            เปิดโครงข้อสอบ 1..N ข้อเริ่มต้น เพื่อให้คุณสามารถตรวจเทียบต้นฉบับฝั่งซ้าย ตัดรูปโจทย์มาใส่ และพิมพ์/แก้ไขตัวเลือกได้ทันทีโดยไม่ต้องรอ OCR
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={onCreateStarterDraft}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#b3996a] hover:bg-[#9c8355] text-white text-xs font-semibold rounded-lg shadow-sm transition active:scale-98"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>สร้างแบบร่างข้อสอบทันที (เน้นความเร็ว)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : itemsList.map((item) => (
              <div key={item.id} data-item-id={item.id} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0 space-y-3">
                {/* 1. Question Number & Text */}
                <div>
                  <span className="text-[#F2604D] font-bold text-sm leading-relaxed">
                    {item.questionNumber}.{" "}
                  </span>
                  {item.sourcePage && (
                    <button type="button" data-export-ignore="true" contentEditable={false} data-source-page={item.sourcePage} disabled={!parsedFile.pageImages?.length} onClick={() => item.sourcePage && jumpToSourcePage(item.sourcePage)} className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500" title={`เปิดต้นฉบับหน้า ${item.sourcePage}`}>
                      หน้า {item.sourcePage}
                    </button>
                  )}
                  <span className="text-slate-900 font-light leading-relaxed">{item.questionText.split("\n").map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</span>
                </div>

                {/* 2. Question Image (if present) */}
                {item.imageUrl && (
                  <div data-question-image="true" className="pl-4 space-y-2">
                    <span className="text-[#F2604D] font-bold">
                      {FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE}
                    </span>
                    <div className="relative border border-slate-200 rounded-lg p-2 bg-slate-50 inline-block">
                      <img
                        src={item.imageUrl}
                        alt={`Question ${item.questionNumber} Figure`}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full h-auto object-contain mx-auto rounded border border-slate-200 shadow-2xs"
                      />
                      <div data-export-ignore="true" contentEditable={false} className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                          สถานะขอบภาพ: <strong>{item.imageStatus || "ยังไม่ได้ตรวจสอบ"}</strong>
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

                      return (
                        <div
                          key={choice.key}
                          className={`p-2 rounded transition flex items-center justify-between ${
                            isGreenShaded
                              ? "bg-[#E6F4EA] text-emerald-950 font-normal border-l-3 border-emerald-600"
                              : isYellowShaded
                              ? "bg-[#FFF4CC] text-amber-950 font-normal border-l-3 border-amber-500"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <span className="font-bold text-[#006D77]">{choice.key}. </span>
                            <span className="font-light">{choice.text.split(/([;|]\s*)/).map((part, index) => {
                              const label = part.match(/^([^:]+:)([\s\S]*)$/);
                              return label ? <React.Fragment key={index}><u>{label[1]}</u>{label[2]}</React.Fragment> : <React.Fragment key={index}>{part}</React.Fragment>;
                            })}</span>
                            {choice.isCorrect && (
                              <span className="text-[#F2604D] font-bold ml-1"> *</span>
                            )}
                          </div>
                          {choice.isCorrect && (
                            <span data-export-ignore="true" contentEditable={false} className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-white/70 shadow-2xs">
                              {isGreenShaded ? "เฉลยจากต้นฉบับ" : "เฉลยที่เสนอโดยระบบ"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Explanation Section */}
                {item.sourceAnswerEvidence && <details data-export-ignore="true" contentEditable={false} className="text-xs text-slate-500 pl-4">
                  <summary>หลักฐานเฉลย · หน้า {item.sourceAnswerEvidence.page} · กรุณาตรวจเทียบต้นฉบับ</summary>
                  <p>{item.sourceAnswerEvidence.evidence}</p>
                </details>}
                <div className="pl-4 pt-1">
                  <span className="text-[#006D77] font-bold">
                    {FORMATTER_CONSTANTS.LABEL_EXPLANATION}{" "}
                  </span>
                  <span className="text-slate-700 font-light leading-relaxed">{item.explanationText}</span>
                  {item.reconciliationProvenance === "reconciled_from_explanation" && (
                    <div data-export-ignore="true" contentEditable={false} className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        ปรับเฉลยเป็น <strong>ข้อ {item.reconciledAnswerKey}</strong> ตามข้อความคำอธิบาย
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

