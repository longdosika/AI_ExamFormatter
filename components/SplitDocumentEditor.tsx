"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { parseExamText, parseSharedContextHeader, stripCapturedTableText } from "@/lib/exam-parser";
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
  X,
  ChevronRight
} from "lucide-react";

interface SplitDocumentEditorProps {
  parsedFile: ParsedFileResult;
  formattedItems: ExamItem[];
  rawOcrText?: string | null;
  ocrProgress?: {completed:number;total:number} | null;
  sourcePagesComplete?: boolean;
  answerBusy?: boolean;
  diagramBusy?: boolean;
  diagramsHarvested?: boolean;
  reviewIssues?: string[];
  onConvertReviewedText?: (text: string) => void;
  onHarvestDiagrams?: () => void;
  onExtractAnswers?: () => void;
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
  diagramBusy = false,
  diagramsHarvested = false,
  reviewIssues = [],
  onConvertReviewedText,
  onHarvestDiagrams,
  onExtractAnswers,
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
      const isShared = image.closest('[data-shared-image="true"]') ||
        image.previousElementSibling?.textContent?.trim().includes("รูปโจทย์ร่วม") ||
        image.parentElement?.previousElementSibling?.textContent?.trim().includes("รูปโจทย์ร่วม");
      const isChoice = Boolean(image.closest('[data-choice-image="true"]'));
      const isExplanation = Boolean(image.closest('[data-explanation-image="true"]'));
      if (isShared || isChoice || isExplanation) return;
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
  const questionRows = useMemo(() => {
    const rows: typeof navigationItems[] = [];
    for (let i = 0; i < navigationItems.length; i += 30) {
      rows.push(navigationItems.slice(i, i + 30));
    }
    return rows;
  }, [navigationItems]);
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
  const [cropTargetRole, setCropTargetRole] = useState<"question" | "shared" | "choice" | "explanation">("question");
  const [cropTargetChoiceKey, setCropTargetChoiceKey] = useState<string>("ก");

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

    if (cropTargetRole === "question") {
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
      image.alt = "ภาพโจทย์ที่ตัดจากต้นฉบับ";
      image.style.maxHeight = "224px";
      image.style.maxWidth = "100%";
      figure.replaceChildren(label, image);
    } else if (cropTargetRole === "shared") {
      let sharedBlock = target.querySelector<HTMLElement>("[data-shared-context-block='true']");
      if (!sharedBlock) {
        sharedBlock = target;
      }
      let sharedImage = sharedBlock.querySelector<HTMLElement>("[data-shared-image='true']");
      if (!sharedImage) {
        sharedImage = document.createElement("div");
        sharedImage.dataset.sharedImage = "true";
        sharedImage.className = "pt-2 space-y-2";
        sharedBlock.appendChild(sharedImage);
      }
      const label = document.createElement("span");
      label.textContent = "รูปโจทย์ร่วม:";
      label.style.color = FORMATTER_CONSTANTS.COLOR_ORANGE;
      label.style.fontWeight = "bold";
      label.style.fontSize = "12pt";
      label.style.display = "block";
      const image = document.createElement("img");
      image.src = capturedImageSnippet;
      image.alt = "รูปโจทย์ร่วม";
      image.style.maxHeight = "240px";
      image.style.maxWidth = "100%";
      sharedImage.replaceChildren(label, image);

      // Clean up captured table/diagram text in shared block so it only retains directive header
      const textDiv = sharedBlock.querySelector<HTMLElement>(".whitespace-pre-line");
      if (textDiv && textDiv.textContent) {
        textDiv.textContent = stripCapturedTableText(textDiv.textContent);
      }
    } else if (cropTargetRole === "choice") {
      let choiceRow = target.querySelector<HTMLElement>(`[data-choice-key="${CSS.escape(cropTargetChoiceKey)}"]`);
      if (!choiceRow) {
        let choicesContainer = target.querySelector<HTMLElement>(".pl-2.space-y-1\\.5") || target.querySelector<HTMLElement>(".space-y-1\\.5");
        if (!choicesContainer) {
          const choicesSec = document.createElement("div");
          choicesSec.className = "pl-4 space-y-2";
          const label = document.createElement("div");
          label.className = "text-[#006D77] font-bold text-[12pt]";
          label.textContent = FORMATTER_CONSTANTS.LABEL_CHOICES;
          choicesContainer = document.createElement("div");
          choicesContainer.className = "pl-2 space-y-1.5";
          choicesSec.appendChild(label);
          choicesSec.appendChild(choicesContainer);
          target.appendChild(choicesSec);
        }
        choiceRow = document.createElement("div");
        choiceRow.dataset.choiceKey = cropTargetChoiceKey;
        choiceRow.className = "p-2 rounded transition flex flex-col gap-1.5 text-slate-800 hover:bg-slate-50";
        const rowHeader = document.createElement("div");
        rowHeader.className = "flex items-center justify-between";
        const keySpan = document.createElement("span");
        keySpan.className = "font-bold text-[#006D77] text-[12pt]";
        keySpan.textContent = `${cropTargetChoiceKey}. `;
        rowHeader.appendChild(keySpan);
        choiceRow.appendChild(rowHeader);
        choicesContainer.appendChild(choiceRow);
      }
      let choiceImage = choiceRow.querySelector<HTMLElement>("[data-choice-image='true']");
      if (!choiceImage) {
        choiceImage = document.createElement("div");
        choiceImage.dataset.choiceImage = "true";
        choiceImage.className = "pt-1";
        choiceRow.appendChild(choiceImage);
      }
      const image = document.createElement("img");
      image.src = capturedImageSnippet;
      image.alt = `รูปตัวเลือก ${cropTargetChoiceKey}`;
      image.className = "max-w-xs max-h-48 object-contain rounded border border-slate-200 bg-white p-1";
      choiceImage.replaceChildren(image);

      // Clean up choice text when image is attached
      const textSpan = choiceRow.querySelector<HTMLElement>(".font-light");
      if (textSpan) textSpan.textContent = "";
    } else if (cropTargetRole === "explanation") {
      let explBlock = target.querySelector<HTMLElement>("[data-explanation-block='true']");
      if (!explBlock) {
        explBlock = document.createElement("div");
        explBlock.dataset.explanationBlock = "true";
        explBlock.className = "pl-4 pt-1 space-y-2";
        target.appendChild(explBlock);
      }
      let explImage = explBlock.querySelector<HTMLElement>("[data-explanation-image='true']");
      if (!explImage) {
        explImage = document.createElement("div");
        explImage.dataset.explanationImage = "true";
        explImage.className = "pt-1";
        explBlock.appendChild(explImage);
      }
      const image = document.createElement("img");
      image.src = capturedImageSnippet;
      image.alt = "รูปคำอธิบาย";
      image.style.maxHeight = "240px";
      image.style.maxWidth = "100%";
      explImage.replaceChildren(image);
    }

    const roleLabel = cropTargetRole === "question" ? "รูปโจทย์" : cropTargetRole === "shared" ? "รูปโจทย์ร่วม" : cropTargetRole === "choice" ? `ตัวเลือก ${cropTargetChoiceKey}` : "รูปคำอธิบาย";
    setCapturedImageSnippet(null);
    setIsCaptureActive(false);
    showNotice(`แทรกรูปภาพเรียบร้อยแล้วใน [ข้อ ${targetQuestionId}] (${roleLabel})`);
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
                สถานะขอบภาพ: <strong>พร้อมแทรก (ตัดขอบเว้นระยะ 2-3px รอบกรอบ ชดเชยการเอียง)</strong>
              </span>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="crop-target" className="block font-semibold text-slate-700">
                  เลือกข้อสอบ:
                </label>
                <select
                  ref={cropTargetRef}
                  id="crop-target"
                  disabled={!navigationItems.length}
                  value={targetQuestionId}
                  onChange={(e) => setTargetQuestionId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#F2604D]"
                >
                  {!navigationItems.length && <option value={targetQuestionId}>ยังไม่พบข้อสอบ กรุณาตรวจเลขข้อใน OCR ก่อนแทรกรูป</option>}
                  {navigationItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      ข้อ {item.questionNumber}: {item.questionText.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="crop-role" className="block font-semibold text-slate-700">
                  ตำแหน่ง / ประเภทรูปภาพ:
                </label>
                <select
                  id="crop-role"
                  value={cropTargetRole}
                  onChange={(e) => setCropTargetRole(e.target.value as any)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#F2604D]"
                >
                  <option value="question">รูปโจทย์ ([รูปโจทย์])</option>
                  <option value="shared">รูปโจทย์ร่วม (ตาราง/ข้อมูลบทความร่วม)</option>
                  <option value="choice">รูปตัวเลือก (ก, ข, ค, ง)</option>
                  <option value="explanation">รูปคำอธิบาย (เฉลยละเอียด)</option>
                </select>
              </div>
            </div>

            {cropTargetRole === "choice" && (
              <div className="space-y-1.5 text-xs">
                <label htmlFor="crop-choice-key" className="block font-semibold text-slate-700">
                  เลือกข้อตัวเลือก:
                </label>
                <div className="flex gap-2">
                  {["ก", "ข", "ค", "ง"].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setCropTargetChoiceKey(k)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                        cropTargetChoiceKey === k
                          ? "bg-[#006D77] text-white border-[#006D77] shadow-2xs"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      ตัวเลือก {k}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                <span>แทรกภาพ ({cropTargetRole === "question" ? "รูปโจทย์" : cropTargetRole === "shared" ? "รูปโจทย์ร่วม" : cropTargetRole === "choice" ? `ตัวเลือก ${cropTargetChoiceKey}` : "รูปคำอธิบาย"})</span>
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dedad0] bg-[#f7f6f2] px-3 py-1.5 text-[11px] shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#28332d]">
                {itemsList.length ? `ฉบับร่าง (${itemsList.length} ข้อ)` : "OCR ดิบ"}
              </span>

              {/* Stepper Timeline with Horizontal Connectors and Status Animations */}
              <div className="flex items-center gap-1.5 sm:gap-2" role="group" aria-label="ขั้นตอนการทำงาน">
                {/* Step 1: Format Exam */}
                <button 
                  type="button" 
                  aria-label={answerBusy ? "กำลังอ่านเฉลย…" : itemsList.length ? "จัดรูปแบบแล้ว" : "แปลงเป็นรูปแบบข้อสอบ"}
                  disabled={Boolean(ocrProgress) || !sourcePagesComplete || !reviewText.trim() || itemsList.length > 0} 
                  onClick={() => onConvertReviewedText?.(reviewText)} 
                  className={`relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                    itemsList.length > 0
                      ? "bg-[#496053] text-white shadow-xs"
                      : !itemsList.length && reviewText.trim() && !ocrProgress
                      ? "bg-[#496053] text-white shadow-sm ring-2 ring-[#496053]/50 ring-offset-1 animate-pulse hover:animate-none scale-102"
                      : "bg-[#f7f6f2] border border-[#dedad0] text-[#718096]"
                  }`} 
                  title={itemsList.length ? "ขั้นตอนที่ 1: จัดรูปแบบแล้ว (ผ่านแล้ว)" : "ขั้นตอนที่ 1: แปลง OCR เป็นรูปแบบข้อสอบ (ขั้นตอนปัจจุบัน)"}
                >
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="sr-only">{answerBusy ? "กำลังอ่านเฉลย…" : itemsList.length ? "จัดรูปแบบแล้ว" : "แปลงเป็นรูปแบบข้อสอบ"}</span>
                  {itemsList.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-xs">
                      <Check className="w-1.5 h-1.5 text-white stroke-[3]" />
                    </span>
                  )}
                </button>

                {/* Connector 1: Step 1 -> Step 2 */}
                <div className={`h-0.5 w-2 sm:w-3.5 rounded-full transition-colors duration-500 shrink-0 ${
                  itemsList.length > 0 ? "bg-emerald-500" : "bg-[#dedad0]"
                }`} />

                {/* Step 2: AI Diagram & Figure Extraction */}
                {onHarvestDiagrams && (
                  <button
                    type="button"
                    aria-label={diagramBusy ? "กำลังสกัดรูป…" : diagramsHarvested ? "สกัดรูปแล้ว (สกัดซ้ำได้)" : "สกัดรูปประกอบ (AI)"}
                    disabled={!itemsList.length || diagramBusy || answerBusy}
                    onClick={() => onHarvestDiagrams?.()}
                    className={`relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                      diagramBusy
                        ? "bg-[#006D77] text-white ring-2 ring-[#006D77]/40 ring-offset-1 animate-pulse"
                        : diagramsHarvested
                        ? "bg-[#006D77] text-white shadow-xs"
                        : itemsList.length > 0
                        ? "bg-[#006D77] hover:bg-[#005a63] text-white font-semibold ring-2 ring-[#006D77]/50 ring-offset-1 animate-pulse hover:animate-none scale-102 shadow-sm"
                        : "bg-[#f7f6f2] border border-[#dedad0] text-[#718096]"
                    }`}
                    title={diagramBusy ? "กำลังสกัดรูปภาพและตาราง (กำลังประมวลผล)..." : diagramsHarvested ? "ขั้นตอนที่ 2: สกัดรูปประกอบแล้ว (ผ่านแล้ว · คลิกเพื่อสกัดซ้ำ)" : "ขั้นตอนที่ 2: สกัดรูปประกอบ ตาราง และภาพตัวเลือกด้วย AI Vision (ขั้นตอนปัจจุบัน)"}
                  >
                    <Crop className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${diagramBusy ? "animate-spin" : ""}`} />
                    <span className="sr-only">{diagramBusy ? "กำลังสกัดรูป…" : diagramsHarvested ? "สกัดรูปแล้ว (สกัดซ้ำได้)" : "สกัดรูปประกอบ (AI)"}</span>
                    {diagramsHarvested && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-xs">
                        <Check className="w-1.5 h-1.5 text-white stroke-[3]" />
                      </span>
                    )}
                  </button>
                )}

                {/* Connector 2: Step 2 -> Step 3 */}
                {onExtractAnswers && (
                  <div className={`h-0.5 w-2 sm:w-3.5 rounded-full transition-colors duration-500 shrink-0 ${
                    diagramsHarvested ? "bg-emerald-500" : "bg-[#dedad0]"
                  }`} />
                )}

                {/* Step 3: Optional AI Answer Detection */}
                {onExtractAnswers && (
                  <button
                    type="button"
                    aria-label={answerBusy ? "กำลังอ่านเฉลย…" : "ตรวจเฉลยจากภาพ (AI)"}
                    disabled={!itemsList.length || answerBusy || diagramBusy}
                    onClick={() => onExtractAnswers?.()}
                    className={`relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                      answerBusy
                        ? "bg-[#496053] text-white ring-2 ring-[#496053]/40 ring-offset-1 animate-pulse"
                        : formattedItems.some(i => i.reconciliationProvenance === "source_vision")
                        ? "bg-[#496053] text-white shadow-xs"
                        : diagramsHarvested
                        ? "bg-[#496053] hover:bg-[#394c42] text-white font-medium ring-2 ring-[#496053]/50 ring-offset-1 animate-pulse hover:animate-none scale-102 shadow-sm"
                        : "bg-[#f7f6f2] border border-[#dedad0] text-[#718096]"
                    }`}
                    title={answerBusy ? "กำลังตรวจเฉลยจากภาพ (กำลังประมวลผล)..." : formattedItems.some(i => i.reconciliationProvenance === "source_vision") ? "ขั้นตอนที่ 3: ตรวจเฉลยจากภาพแล้ว (ผ่านแล้ว · คลิกเพื่อตรวจซ้ำ)" : "ขั้นตอนที่ 3: ตรวจเฉลยจากภาพ สแกนรอยเฉลยบนต้นฉบับ (ขั้นตอนถัดไป)"}
                  >
                    <Search className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${answerBusy ? "animate-spin" : ""}`} />
                    <span className="sr-only">{answerBusy ? "กำลังอ่านเฉลย…" : "ตรวจเฉลยจากภาพ (AI)"}</span>
                    {formattedItems.some(i => i.reconciliationProvenance === "source_vision") && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-xs">
                        <Check className="w-1.5 h-1.5 text-white stroke-[3]" />
                      </span>
                    )}
                  </button>
                )}

                {/* Step 4: Issue Review (If any issues detected) */}
                {itemsList.length > 0 && reviewIssues.length > 0 && (
                  <>
                    <div className="h-0.5 w-2 sm:w-3.5 rounded-full bg-amber-400 shrink-0" />
                    <button 
                      type="button" 
                      aria-label="ตรวจสอบฉบับแก้ไข"
                      onClick={() => editorPaneRef.current && onReviewEditor?.(editorPaneRef.current)} 
                      className="relative w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 transition-all flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-400/40 animate-pulse hover:animate-none"
                      title={`ขั้นตอนที่ 4: ตรวจสอบฉบับแก้ไข (พบ ${reviewIssues.length} รายการตรวจทาน)`}
                    >
                      <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" />
                      <span className="sr-only">ตรวจสอบฉบับแก้ไข</span>
                      <span className="absolute -top-0.5 -right-0.5 min-w-3 h-3 px-0.5 rounded-full bg-amber-500 border border-white text-white text-[7px] font-bold flex items-center justify-center">
                        {reviewIssues.length}
                      </span>
                    </button>
                  </>
                )}
              </div>

            </div>

            {itemsList.length > 0 && (
              <div className="min-w-0" data-editor-tools="true">
                <RichTextToolbar
                  onFormat={handleFormat}
                  onInsertImage={handleInsertImage}
                  onCopyAll={handleCopyAll}
                  onExportDrive={handleExportDrive}
                  exportAvailable={exportAvailable}
                  exporting={exporting}
                  editingAvailable={itemsList.length > 0}
                />
              </div>
            )}
          </div>

          {itemsList.length > 0 && reviewIssues.length > 0 && (
            <details className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900">
              <summary className="cursor-pointer font-medium">รายการตรวจแก้ {reviewIssues.length} รายการ · แก้ข้อความและแทรกรูปต่อได้</summary>
              <ul className="max-h-28 overflow-y-auto list-disc pl-4 mt-1 text-[11px]">{reviewIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
            </details>
          )}

          {navigationItems.length > 0 && (
            <nav aria-label="เลือกข้อสอบ" className="flex flex-col gap-1 border-b border-[#dedad0] bg-white px-2 py-1 shrink-0 min-w-0">
              {questionRows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex items-center gap-1 min-w-0">
                  <span className="shrink-0 text-[9px] text-[#28332d] font-bold w-4 text-right">
                    {rowIdx === 0 ? "ข้อ" : ""}
                  </span>
                  <div className="flex flex-wrap gap-0.5 min-w-0">
                    {row.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`ไปข้อ ${item.questionNumber}`}
                        aria-current={activeQuestionId === item.id ? "true" : undefined}
                        onClick={() => jumpToQuestion(item)}
                        className={`shrink-0 min-w-5 rounded px-1 py-0.5 text-[10px] transition ${
                          activeQuestionId === item.id
                            ? "bg-[#496053] text-white font-bold"
                            : "bg-[#eae8e1] text-[#28332d] hover:bg-[#dedad0]"
                        }`}
                      >
                        {item.questionNumber}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          )}

          {/* Editable Continuous Document Area */}
          <div
            ref={editorPaneRef}
            role="textbox"
            aria-label="ข้อสอบที่จัดรูปแบบแล้ว"
            aria-multiline="true"
            contentEditable={itemsList.length > 0}
            suppressContentEditableWarning
            className="flex-1 min-h-0 p-5 overflow-y-auto space-y-5 font-sans text-[12pt] bg-white text-slate-900 focus:outline-none leading-normal"
            style={{ fontSize: "12pt", fontFamily: "'Sarabun', sans-serif" }}
          >
            {ocrProgress ? (
              <div role="status" aria-live="polite" aria-label="กำลังสแกน OCR" className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-[#dedad0] bg-white p-6 text-center shadow-xs">
                <div aria-hidden="true" className="relative h-16 w-14 overflow-hidden rounded-lg border-2 border-[#496053] bg-[#f7f6f2] shadow-sm flex items-center justify-center">
                  <div className="space-y-1.5 px-2 py-3 w-full">
                    {[1, 2, 3, 4].map(line => <div key={line} className="h-1 rounded bg-[#dedad0]" />)}
                  </div>
                  <div className="ocr-scan-line absolute inset-x-0 top-0 h-1 bg-[#496053] shadow-[0_0_10px_2px_rgba(73,96,83,0.5)]" />
                </div>
                
                <div className="text-sm font-bold text-[#28332d]">กำลังถอดข้อความ OCR จากต้นฉบับ</div>
                
                {/* PROMINENT PERCENTAGE & PROGRESS BAR */}
                <div className="w-full max-w-xs space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[#496053]">
                    <span>หน้า {ocrProgress.completed} / {ocrProgress.total}</span>
                    <span>{Math.round((ocrProgress.completed / Math.max(1, ocrProgress.total)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#eae8e1] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#496053] h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.round((ocrProgress.completed / Math.max(1, ocrProgress.total)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-stone-500">
                  ระบบจัดกลุ่มบรรทัดอัตโนมัติ สามารถตรวจดูเอกสารฝั่งซ้ายระหว่างรอได้
                </div>
              </div>
            ) : itemsList.length === 0 ? (
              <div className="h-full flex flex-col space-y-2">
                {rawOcrText ? (
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-600">
                      <span className="font-semibold flex items-center gap-1 text-[#28332d]">
                        <FileText className="w-3.5 h-3.5 text-[#496053]" />
                        ข้อความ OCR ดิบ ({navigationItems.length} ข้อที่ตรวจพบ)
                      </span>
                      {reviewIssues.length > 0 && (
                        <span className="text-amber-800 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                          ตรวจทาน {reviewIssues.length} จุด
                        </span>
                      )}
                    </div>
                    <textarea 
                      ref={rawTextRef} 
                      aria-label="ข้อความ OCR สำหรับตรวจแก้" 
                      value={reviewText} 
                      onChange={event => setReviewText(event.target.value)} 
                      className="w-full flex-1 min-h-[460px] resize-y rounded-lg border border-[#dedad0] bg-[#fdfdfc] p-3.5 font-mono text-xs leading-relaxed text-[#28332d] focus:outline-none focus:ring-1 focus:ring-[#496053]" 
                    />
                    {reviewIssues.length > 0 && (
                      <ul aria-label="รายการที่ต้องตรวจแก้" className="mt-2 list-disc pl-5 text-xs text-amber-900">
                        {reviewIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                      </ul>
                    )}
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
                {/* 0. Shared Context Start (โจทย์ร่วม) */}
                {item.isSharedContextStart && (
                  <div
                    data-shared-context-block="true"
                    className="mb-5 p-4 rounded-xl border-2 border-[#006D77]/40 bg-[#006D77]/5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#006D77] font-bold text-[12pt] tracking-wide">
                        {FORMATTER_CONSTANTS.LABEL_SHARED_START}{" "}
                      </span>
                      {item.sharedContextRange && (
                        <span
                          data-export-ignore="true"
                          contentEditable={false}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[#006D77]/15 text-[#006D77] font-semibold"
                        >
                          ข้อ {item.sharedContextRange.start} - {item.sharedContextRange.end}
                        </span>
                      )}
                    </div>
                    {item.sharedContextText && (
                      <div className="text-slate-900 font-light leading-relaxed whitespace-pre-line text-[12pt]">
                        {item.sharedContextImageUrl
                          ? stripCapturedTableText(item.sharedContextText)
                          : item.sharedContextText}
                      </div>
                    )}
                    {item.sharedContextImageUrl && (
                      <div data-shared-image="true" className="mt-3.5 pt-1 space-y-2">
                        <span className="text-[#F2604D] font-bold text-[12pt] block">
                          รูปโจทย์ร่วม:
                        </span>
                        <div className="relative border border-slate-200 rounded-lg p-2 bg-white inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.sharedContextImageUrl}
                            alt="รูปโจทย์ร่วม"
                            loading="lazy"
                            decoding="async"
                            className="max-w-full h-auto object-contain mx-auto rounded border border-slate-200"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 1. Question Number & Text */}
                <div>
                  <span className="text-[#F2604D] font-bold text-[12pt] leading-relaxed">
                    {item.questionNumber}.{" "}
                  </span>
                  {item.sourcePage && (
                    <button type="button" data-export-ignore="true" contentEditable={false} data-source-page={item.sourcePage} disabled={!parsedFile.pageImages?.length} onClick={() => item.sourcePage && jumpToSourcePage(item.sourcePage)} className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500" title={`เปิดต้นฉบับหน้า ${item.sourcePage}`}>
                      หน้า {item.sourcePage}
                    </button>
                  )}
                  <span className="text-slate-900 font-light leading-relaxed text-[12pt]">{item.questionText.split("\n").map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</span>
                </div>

                {/* 2. Question Image (if present) */}
                {item.imageUrl && (
                  <div data-question-image="true" className="pl-4 space-y-2">
                    <span className="text-[#F2604D] font-bold text-[12pt]">
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
                  <div className="text-[#006D77] font-bold text-[12pt]">
                    {FORMATTER_CONSTANTS.LABEL_CHOICES}
                  </div>
                  <div className="pl-2 space-y-1.5">
                    {item.choices.map((choice) => {
                      const isGreenShaded = choice.isCorrect && choice.shadingType === "source_provided";
                      const isYellowShaded = choice.isCorrect && choice.shadingType === "auto_solved";

                      return (
                        <div
                          key={choice.key}
                          data-choice-key={choice.key}
                          className={`p-2 rounded transition flex flex-col gap-1.5 ${
                            isGreenShaded
                              ? "bg-[#E6F4EA] text-emerald-950 font-normal border-l-3 border-emerald-600"
                              : isYellowShaded
                              ? "bg-[#FFF4CC] text-amber-950 font-normal border-l-3 border-amber-500"
                              : "text-slate-800 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-bold text-[#006D77] text-[12pt]">{choice.key}. </span>
                              <span className="font-light text-[12pt]">{choice.text.split(/([;|]\s*)/).map((part, index) => {
                                const label = part.match(/^([^:]+:)([\s\S]*)$/);
                                return label ? <React.Fragment key={index}><u>{label[1]}</u>{label[2]}</React.Fragment> : <React.Fragment key={index}>{part}</React.Fragment>;
                              })}</span>
                              {choice.isCorrect && (
                                <span className="text-[#F2604D] font-bold ml-1"> *</span>
                              )}
                            </div>
                            {choice.isCorrect && (
                              <span data-export-ignore="true" contentEditable={false} className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-white/70 shadow-2xs shrink-0 ml-2">
                                {isGreenShaded ? "เฉลยจากต้นฉบับ" : "เฉลยที่เสนอโดยระบบ"}
                              </span>
                            )}
                          </div>
                          {choice.imageUrl && (
                            <div data-choice-image="true" className="pt-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={choice.imageUrl}
                                alt={`รูปตัวเลือก ${choice.key}`}
                                loading="lazy"
                                decoding="async"
                                className="max-w-xs max-h-48 object-contain rounded border border-slate-200 bg-white p-1"
                              />
                            </div>
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
                <div data-explanation-block="true" className="pl-4 pt-1 space-y-2">
                  <div>
                    <span className="text-[#006D77] font-bold text-[12pt]">
                      {FORMATTER_CONSTANTS.LABEL_EXPLANATION}{" "}
                    </span>
                    <span className="text-slate-700 font-light leading-relaxed text-[12pt]">{item.explanationText}</span>
                  </div>
                  {item.explanationImageUrl && (
                    <div data-explanation-image="true" className="pt-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.explanationImageUrl}
                        alt="รูปคำอธิบาย"
                        loading="lazy"
                        decoding="async"
                        className="max-w-md max-h-60 object-contain rounded border border-slate-200 bg-white p-1"
                      />
                    </div>
                  )}
                  {item.reconciliationProvenance === "reconciled_from_explanation" && (
                    <div data-export-ignore="true" contentEditable={false} className="mt-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>
                        ปรับเฉลยเป็น <strong>ข้อ {item.reconciledAnswerKey}</strong> ตามข้อความคำอธิบาย
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Shared Context End (จบโจทย์ร่วม) */}
                {item.isSharedContextEnd && (
                  <div
                    data-shared-context-end="true"
                    className="mt-4 pt-3 border-t-2 border-dashed border-[#006D77]/30 flex items-center justify-between"
                  >
                    <span className="text-[#006D77] font-bold text-sm tracking-wide">
                      {FORMATTER_CONSTANTS.LABEL_SHARED_END}
                    </span>
                    {item.sharedContextRange && (
                      <span
                        data-export-ignore="true"
                        contentEditable={false}
                        className="text-[11px] text-slate-400 font-medium"
                      >
                        (สิ้นสุดโจทย์ร่วม ข้อ {item.sharedContextRange.start} - {item.sharedContextRange.end})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

