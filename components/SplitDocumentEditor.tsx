"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { parseExamText, parseSharedContextHeader, stripCapturedTableText } from "@/lib/exam-parser";
import { ParsedFileResult, SUPPORTED_EXTENSIONS } from "@/lib/file-parser";
import { ExamItem, FORMATTER_CONSTANTS } from "@/lib/formatter-rules";
import { ANSWER_ORIGINS, decorateAnswerEditor, selectManualAnswer } from "@/lib/answer-editor";
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
  ChevronRight,
  Paperclip,
  Circle,
  ChevronLeft,
  Trash2,
  ImageUp,
  Undo2
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
  onEditorDraftChange?: (editor: HTMLElement) => void;
  onReset?: () => void;
  onExportDrive?: (element: HTMLElement) => Promise<void>;
  onDownloadDocx?: (element: HTMLElement) => Promise<void>;
  exportAvailable?: boolean;
  onCreateStarterDraft?: () => void;
  restoredEditorHtml?: string | null;
  sourceError?: string | null;
  onAttachOriginal?: (file: File) => Promise<void>;
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
  onEditorDraftChange,
  onReset,
  onExportDrive,
  onDownloadDocx,
  exportAvailable = false,
  onCreateStarterDraft,
  restoredEditorHtml = null,
  sourceError = null,
  onAttachOriginal,
}) => {
  const sourceInputRef = useRef<HTMLInputElement>(null);
  const [sourceAttaching, setSourceAttaching] = useState(false);
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
    if (editorPaneRef.current) decorateAnswerEditor(editorPaneRef.current, formattedItems);
  }, [formattedItems, restoredEditorHtml]);
  useEffect(() => {
    editorPaneRef.current?.querySelectorAll<HTMLButtonElement>("button[data-source-page]").forEach(button => { button.disabled = pageCount === 0; });
  }, [pageCount, restoredEditorHtml]);
  const hasOriginalVisualSource = Boolean(
    (parsedFile.pageImages && parsedFile.pageImages.length > 0) ||
    parsedFile.fileUrl ||
    parsedFile.extractedImages.length > 0
  );
  useEffect(() => {
    const editor = editorPaneRef.current;
    if (!editor || !formattedItems.length) return;
    const labelImages = () => editor.querySelectorAll('img').forEach(image => {
      const hasQuestionHeading = (text?: string | null) => Boolean(text?.trim().replace(/\s+/g, "").includes("รูปโจทย์"));
      const isShared = image.closest('[data-shared-image="true"]') ||
        image.previousElementSibling?.textContent?.trim().includes("รูปโจทย์ร่วม") ||
        image.parentElement?.previousElementSibling?.textContent?.trim().includes("รูปโจทย์ร่วม");
      const isChoice = Boolean(image.closest('[data-choice-image="true"]'));
      const isExplanation = Boolean(image.closest('[data-explanation-image="true"]'));
      if (isShared || isChoice || isExplanation) return;
      const preceding = image.previousElementSibling;
      const outerPreceding = image.parentElement?.previousElementSibling;
      if (hasQuestionHeading(preceding?.textContent) || hasQuestionHeading(outerPreceding?.textContent)) return;
      const label = document.createElement('p');
      label.textContent = "รูปโจทย์:";
      label.style.color = FORMATTER_CONSTANTS.COLOR_ORANGE;
      label.style.fontWeight = "bold";
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
  const shouldUseRestoredEditorHtml = Boolean(restoredEditorHtml && itemsList.length > 0);
  // Keep the restored DOM node stable while selection/scroll state changes.
  const restoredContent = useMemo(() => <div dangerouslySetInnerHTML={{ __html: restoredEditorHtml || "" }} />, [restoredEditorHtml]);
  const navigationItems = useMemo(() => itemsList.length ? itemsList : parseExamText(reviewText), [itemsList, reviewText]);
  const [activeQuestionId, setActiveQuestionId] = useState(1);
  // T-107: one range open at a time keeps the strip on a single line.
  const [openGap, setOpenGap] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const navigationGroups = useMemo(() => {
    if (navigationItems.length <= 20) return navigationItems.map(item => ({ anchor: item, hidden: [] as ExamItem[] }));
    const groups: { anchor: ExamItem; hidden: ExamItem[] }[] = [];
    navigationItems.forEach((item, index) => {
      const startsDecade = index > 0 && Math.floor(item.questionNumber / 10) !== Math.floor(navigationItems[index - 1].questionNumber / 10);
      if (!index || index === navigationItems.length - 1 || item.questionNumber % 10 === 0 || startsDecade) groups.push({ anchor: item, hidden: [] });
      else groups[groups.length - 1].hidden.push(item);
    });
    return groups;
  }, [navigationItems]);
  const answersCompleted = formattedItems.some(item => item.reconciliationProvenance === "source_vision" || item.reconciliationProvenance === "ai_generated");
  const completedStepClass = "bg-[#496053] text-white shadow-xs opacity-40 hover:opacity-60";
  const stepIdleClass = "bg-[var(--ui-sunken)] border border-[var(--ui-line)] text-[var(--ui-ink-3)]";
  const nextStepLabel = ocrProgress ? "กำลังสแกน OCR…"
    : !itemsList.length ? (reviewText.trim() ? "ถัดไป: จัดรูปแบบข้อสอบ" : "รอข้อความ OCR")
    : diagramBusy ? "กำลังสกัดรูป…"
    : answerBusy ? "กำลังวิเคราะห์เฉลย…"
    : !diagramsHarvested ? "ถัดไป: สกัดรูปประกอบ"
    : !answersCompleted ? "ถัดไป: วิเคราะห์เฉลย"
    : reviewIssues.length ? `ถัดไป: ตรวจแก้ ${reviewIssues.length} รายการ`
    : "พร้อมส่งออก";
  const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Box-shadow only: background colors are read by export, so the flash must never touch them.
  const flashQuestion = (target: HTMLElement) => {
    if (prefersReducedMotion() || !target.animate) return;
    target.animate([
      { boxShadow: "inset 3px 0 0 0 rgba(242,96,77,.95), 0 0 0 6px rgba(242,96,77,.10)" },
      { boxShadow: "inset 3px 0 0 0 rgba(242,96,77,0), 0 0 0 6px rgba(242,96,77,0)" },
    ], { duration: 1200, easing: "cubic-bezier(.2,.8,.2,1)" });
  };
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const reveal = () => {
      const targets = openGap !== null
        ? [nav.querySelector<HTMLElement>(`#question-gap-${openGap}`)?.parentElement]
        : Array.from(nav.querySelectorAll<HTMLElement>('[aria-current="true"], .nav-gap-marker'));
      const target = targets.find(node => node && node.getBoundingClientRect().width > 0);
      if (!target) return;
      const box = target.getBoundingClientRect();
      const frame = nav.getBoundingClientRect();
      if (box.left >= frame.left + 24 && box.right <= frame.right - 24) return;
      nav.scrollBy({ left: box.left + box.width / 2 - (frame.left + frame.width / 2), behavior: prefersReducedMotion() ? "auto" : "smooth" });
    };
    // Wait for the 300ms width transition so the opened range is measured at full size.
    const timer = setTimeout(reveal, openGap !== null ? 320 : 60);
    return () => clearTimeout(timer);
  }, [activeQuestionId, openGap]);
  const jumpToQuestion = (item: ExamItem) => {
    setActiveQuestionId(item.id);
    setTargetQuestionId(item.id);
    // Accordion: leaving the open range closes it, so only one range is ever expanded.
    if (openGap !== null) {
      const group = navigationGroups.find(entry => entry.anchor.id === openGap);
      if (group && group.anchor.id !== item.id && !group.hidden.some(hidden => hidden.id === item.id)) setOpenGap(null);
    }
    const pane = editorPaneRef.current;
    const target = pane?.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if (pane && target) {
      pane.scrollTo({top:pane.scrollTop + target.getBoundingClientRect().top - pane.getBoundingClientRect().top,behavior:"instant"});
      flashQuestion(target);
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
  useEffect(() => { if (!capturedImageSnippet) setCaptureOrigin("source"); }, [capturedImageSnippet]);
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
  const [captureOrigin, setCaptureOrigin] = useState<"source" | "upload">("source");
  const [imageTools, setImageTools] = useState<{ image: HTMLImageElement; top: number; left: number; width: number; height: number; paneWidth: number } | null>(null);
  const imageToolsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [removedImage, setRemovedImage] = useState<{ node: Element; parent: Node; next: Node | null } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversionPaneRef = useRef<HTMLDivElement>(null);
  const dropTarget = useRef<HTMLElement | null>(null);
  const addImageInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => {
    if (imageToolsTimer.current) clearTimeout(imageToolsTimer.current);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

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

      setCaptureOrigin("source");
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
      label.textContent = "รูปโจทย์:";
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
    persistEditor();
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

  // T-107: add/replace/resize/delete images inside the live editor DOM (the export snapshot).
  const persistEditor = () => { if (editorPaneRef.current) onEditorDraftChange?.(editorPaneRef.current); };
  const readImageFile = (file: File) => new Promise<string>((resolve, reject) => {
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) { reject(new Error("รองรับไฟล์รูป PNG, JPEG, GIF หรือ WebP")); return; }
    if (file.size > 10 * 1024 * 1024) { reject(new Error("ไฟล์รูปใหญ่เกิน 10 MB")); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่ได้"));
    reader.readAsDataURL(file);
  });
  const questionIdAt = (node: Node | null | undefined) => {
    const element = node instanceof Element ? node : node?.parentElement;
    const item = element?.closest<HTMLElement>("[data-item-id]");
    return item && editorPaneRef.current?.contains(item) ? Number(item.dataset.itemId) : activeQuestionId;
  };
  // Uploaded/dropped/pasted files reuse the insert dialog so the user picks question and role.
  const openUploadDialog = async (file: File, questionId: number) => {
    try {
      const dataUrl = await readImageFile(file);
      setTargetQuestionId(questionId);
      setCropTargetRole("question");
      setCaptureOrigin("upload");
      setCapturedImageSnippet(dataUrl);
    } catch (error) { showNotice(error instanceof Error ? error.message : "อ่านไฟล์รูปไม่ได้"); }
  };
  const handleInsertImage = () => {
    if (!itemsList.length) { showNotice("จัดรูปแบบข้อสอบก่อน แล้วจึงแทรกรูป"); return; }
    addImageInputRef.current?.click();
  };
  const placeImageTools = (image: HTMLImageElement) => {
    const pane = conversionPaneRef.current;
    if (!pane || !image.isConnected) { setImageTools(null); return; }
    const box = image.getBoundingClientRect(), frame = pane.getBoundingClientRect();
    setImageTools({ image, top: box.top - frame.top, left: box.left - frame.left, width: box.width, height: box.height, paneWidth: frame.width });
  };
  const keepImageTools = () => { if (imageToolsTimer.current) clearTimeout(imageToolsTimer.current); };
  const releaseImageTools = () => {
    keepImageTools();
    imageToolsTimer.current = setTimeout(() => setImageTools(null), 260);
  };
  const imageFigure = (image: HTMLImageElement) =>
    image.closest<HTMLElement>('[data-question-image], [data-shared-image], [data-choice-image], [data-explanation-image]');
  const replaceImage = async (file: File) => {
    const image = imageTools?.image;
    if (!image) return;
    try {
      image.src = await readImageFile(file);
      image.removeAttribute("srcset");
      persistEditor();
      showNotice("เปลี่ยนรูปแล้ว");
      requestAnimationFrame(() => placeImageTools(image));
    } catch (error) { showNotice(error instanceof Error ? error.message : "เปลี่ยนรูปไม่ได้"); }
  };
  const recaptureImage = () => {
    const image = imageTools?.image;
    if (!image) return;
    const role = image.closest('[data-shared-image]') ? "shared" : image.closest('[data-choice-image]') ? "choice" : image.closest('[data-explanation-image]') ? "explanation" : "question";
    setTargetQuestionId(questionIdAt(image));
    setCropTargetRole(role);
    const key = image.closest<HTMLElement>("[data-choice-key]")?.dataset.choiceKey;
    if (key) setCropTargetChoiceKey(key);
    setIsMagnifierActive(false);
    setIsCaptureActive(true);
    setImageTools(null);
    showNotice("ลากกรอบบนต้นฉบับด้านซ้ายเพื่อแทนรูปนี้");
  };
  const resizeImage = (scale: number) => {
    const image = imageTools?.image;
    if (!image) return;
    if (scale < 1) {
      image.dataset.exportScale = String(scale);
      image.style.width = `${Math.round(Math.min(image.naturalWidth || 600, 600) * scale)}px`;
    } else {
      delete image.dataset.exportScale;
      image.style.width = "";
    }
    image.style.maxWidth = "100%";
    persistEditor();
    requestAnimationFrame(() => placeImageTools(image));
  };
  const deleteImage = () => {
    const image = imageTools?.image;
    if (!image) return;
    let node: Element = image;
    const figure = imageFigure(image);
    if (figure && editorPaneRef.current?.contains(figure)) node = figure;
    else {
      const label = image.previousElementSibling;
      if (label && /^รูป(โจทย์ร่วม|โจทย์|คำอธิบาย)\s*:?\s*$/.test(label.textContent?.trim() || "")) label.remove();
    }
    const parent = node.parentNode;
    if (!parent) return;
    setRemovedImage({ node, parent, next: node.nextSibling });
    node.remove();
    setImageTools(null);
    persistEditor();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemovedImage(null), 8000);
  };
  const undoDeleteImage = () => {
    if (!removedImage) return;
    const { node, parent, next } = removedImage;
    parent.insertBefore(node, next && next.parentNode === parent ? next : null);
    setRemovedImage(null);
    persistEditor();
    showNotice("นำรูปกลับมาแล้ว");
  };

  const currentExportElement = () => {
    if (itemsList.length) return editorPaneRef.current;
    if (!reviewText.trim()) return null;
    const content = document.createElement("div");
    reviewText.split(/\r?\n/).forEach(line => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      content.append(paragraph);
    });
    return content;
  };

  const handleCopyAll = async () => {
    const content = currentExportElement();
    if (!content) return false;
    try {
      await navigator.clipboard.writeText(itemsList.length ? content.innerText : reviewText);
      showNotice("คัดลอกเนื้อหาทั้งหมดเรียบร้อยแล้ว!");
      return true;
    } catch {
      showNotice("คัดลอกไม่ได้ กรุณาเลือกเนื้อหาแล้วคัดลอกด้วยตนเอง");
      return false;
    }
  };

  const handleExportDrive = async () => {
    const content = currentExportElement();
    if (!content || !exportAvailable || !onExportDrive) {
      showNotice("เชื่อมต่อ Google Drive และตรวจสอบโฟลเดอร์ปลายทางก่อนส่งออก");
      return;
    }
    if (exporting) return;
    setExporting(true);
    try {
      await onExportDrive(content);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "ส่งออกไม่ได้ กรุณาลองอีกครั้ง");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadDocx = async () => {
    const content = currentExportElement();
    if (!content || !onDownloadDocx || exporting) return;
    setExporting(true);
    try { await onDownloadDocx(content); }
    catch (error) { showNotice(error instanceof Error ? error.message : "ดาวน์โหลดไม่สำเร็จ"); }
    finally { setExporting(false); }
  };

  const handleAnswerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const sourceLink = (event.target as Element).closest<HTMLElement>("[data-source-page]");
    if (sourceLink && pageCount) { jumpToSourcePage(Number(sourceLink.dataset.sourcePage)); return; }
    const control = (event.target as Element).closest<HTMLElement>("[data-answer-select], [data-clear-answer]");
    const item = control?.closest<HTMLElement>("[data-item-id]");
    if (!control || !item || !editorPaneRef.current) return;
    selectManualAnswer(item, control.dataset.answerSelect || null);
    onEditorDraftChange?.(editorPaneRef.current);
  };

  const handleEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    const editor = editorPaneRef.current;
    if (!editor || event.target instanceof HTMLInputElement) return;
    const anchor = window.getSelection()?.anchorNode;
    const target = anchor instanceof Element ? anchor : anchor?.parentElement;
    const row = target?.closest<HTMLElement>("[data-choice-key]") || (event.target as Element).closest<HTMLElement>("[data-choice-key]");
    const item = row?.closest<HTMLElement>("[data-item-id]");
    if (row && item) {
      const marked = Array.from(item.querySelectorAll<HTMLElement>("[data-choice-key]")).filter(choice => {
        const clone = choice.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("[data-export-ignore], img").forEach(node => node.remove());
        return /\*\s*$/.test(clone.textContent || "");
      });
      const targetMarked = marked.includes(row);
      const selected = item.querySelector<HTMLElement>('[data-answer-origin]:not([data-answer-origin="none"])');
      if (targetMarked && selected !== row) selectManualAnswer(item, row.dataset.choiceKey || null);
      else if (!marked.length && selected) selectManualAnswer(item, null);
    }
    onEditorDraftChange?.(editor);
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div className="relative h-full flex flex-col min-h-0 w-full space-y-2">
      {/* Toast Notification */}
      {notification && (
        <div role="status" data-layout="editor-toast" className="absolute left-1/2 top-1 z-40 flex max-w-[min(92vw,34rem)] -translate-x-1/2 items-center justify-between rounded-full border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur-sm animate-fade-in">
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
                <span id="crop-dialog-title">{captureOrigin === "upload" ? "แทรกรูปจากไฟล์" : "แทรกภาพที่ตัดจากต้นฉบับ"}</span>
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
              {captureOrigin === "source" ? (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  สถานะขอบภาพ: <strong>พร้อมแทรก (ตัดขอบเว้นระยะ 2-3px รอบกรอบ ชดเชยการเอียง)</strong>
                </span>
              ) : (
                <span className="text-[11px] text-[var(--ui-ink-3)]">รูปจากไฟล์ · เลือกข้อและตำแหน่งที่ต้องการวาง ถ้ามีรูปเดิมในตำแหน่งนั้นจะถูกแทนที่</span>
              )}

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
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-full w-full">
        {/* LEFT PANEL: Original Source File (50%) */}
        <div data-workspace="source" className="ui-surface ui-pane-in lg:col-span-6 min-w-0 h-full flex flex-col overflow-hidden relative">
          {/* Header Toolbar (T-106: title, page position and file in one calm row) */}
          <div className="ui-pane-head">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FileText aria-hidden="true" className="w-4 h-4 shrink-0 text-[var(--ui-ink-3)]" />
              <span className="ui-title">ต้นฉบับ</span>
              {pageCount > 0 && (
                <span className="ui-chip py-0.5 font-mono tabular-nums" title="เลื่อนตรวจได้อิสระจากฝั่งข้อสอบ">
                  <span className="sr-only">ต้นฉบับ</span>หน้า <span key={sourcePage} className="ui-status-in inline-block">{sourcePage}</span>/{pageCount}
                </span>
              )}
              <span className="min-w-0 truncate text-[12px] text-[var(--ui-ink-3)]" title={parsedFile.fileName}>
                {parsedFile.fileName}
              </span>
            </div>

            <div className="ui-group ui-rail" role="group" aria-label="เครื่องมือต้นฉบับ">
              <input ref={sourceInputRef} type="file" accept={SUPPORTED_EXTENSIONS.join(",")} className="hidden" aria-label="แนบไฟล์ต้นฉบับเดิม" onChange={async event => {
                const file = event.target.files?.[0]; event.target.value = "";
                if (!file || !onAttachOriginal) return;
                setSourceAttaching(true);
                try { await onAttachOriginal(file); showNotice("เชื่อมไฟล์ต้นฉบับแล้ว งานแก้ไขเดิมยังอยู่ครบ"); }
                catch (error) { showNotice(error instanceof Error ? error.message : "เชื่อมต้นฉบับไม่ได้"); }
                finally { setSourceAttaching(false); }
              }} />
              {onAttachOriginal && <button type="button" aria-label="แนบต้นฉบับกลับมา" disabled={sourceAttaching} onClick={() => sourceInputRef.current?.click()} className="ui-rail-btn"><Paperclip className={`h-4 w-4 ${sourceAttaching ? "animate-pulse" : ""}`} /><span aria-hidden="true" className="ui-rail-label">แนบต้นฉบับ</span></button>}
              {/* 1. Magnifier Glass Button & Zoom Selector */}
              <button
                type="button"
                aria-label="แว่นขยายส่องเฉพาะจุด"
                disabled={!hasOriginalVisualSource}
                aria-pressed={isMagnifierActive}
                onClick={() => {
                  setIsMagnifierActive(!isMagnifierActive);
                  if (isCaptureActive) setIsCaptureActive(false);
                }}
                className="ui-rail-btn disabled:opacity-40"
              >
                <Search className="w-4 h-4" /><span aria-hidden="true" className="ui-rail-label">แว่นขยาย</span>
              </button>
              {isMagnifierActive && (
                <div className="ui-status-in flex items-center gap-0.5 px-0.5" role="group" aria-label="ระดับการขยาย">
                  {[2, 2.5, 3.5].map((z) => (
                    <button
                      key={z}
                      type="button"
                      aria-label={`ขยาย ${z} เท่า`}
                      aria-pressed={magnifierZoom === z}
                      onClick={() => setMagnifierZoom(z)}
                      className={`h-7 min-w-8 rounded-md px-1.5 font-mono text-[11px] font-semibold transition-colors ${
                        magnifierZoom === z ? "bg-white text-[var(--ui-ink)] shadow-[0_1px_2px_rgba(40,51,45,.15)]" : "text-[var(--ui-ink-3)] hover:text-[var(--ui-ink)]"
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
              )}

              {/* 2. Region Snipping / Capture Button */}
              <button
                type="button"
                aria-label="แคปภาพเฉพาะจุด"
                disabled={!hasOriginalVisualSource}
                aria-pressed={isCaptureActive}
                onClick={() => {
                  setIsCaptureActive(!isCaptureActive);
                  if (isMagnifierActive) setIsMagnifierActive(false);
                }}
                className="ui-rail-btn disabled:opacity-40"
              >
                <Crop className="w-4 h-4" /><span aria-hidden="true" className="ui-rail-label">ตัดภาพ</span>
              </button>
            </div>
          </div>

          {/* Capture Active Instruction Banner */}
          {sourceError && <div role="alert" className="border-b border-[#f0deb0] bg-[#fff8e6] px-3.5 py-2 text-[12px] text-[#7a4f05]">{sourceError}</div>}
          {isCaptureActive && (
            <div className="ui-status-in bg-[var(--ui-teal)] text-white px-3.5 py-2 text-[12px] flex items-center justify-between z-30">
              <span className="flex items-center gap-2 font-medium">
                <Crop className="w-3.5 h-3.5 opacity-80" />
                ลากกรอบบนเอกสารเพื่อตัดภาพโจทย์หรือตาราง
              </span>
              <button
                type="button"
                aria-pressed={isCaptureActive}
                onClick={() => {
                  setIsCaptureActive(false);
                  setSelectionBox(null);
                }}
                className="rounded-md bg-white/15 px-2.5 py-1 text-[12px] font-medium hover:bg-white/25"
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
            className="relative flex-1 min-h-0 p-0 overflow-y-auto font-mono text-xs text-[var(--ui-ink)] bg-[#efece4] leading-relaxed select-none"
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
                  ) : null}
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
                    className="relative rounded-lg bg-white overflow-hidden group shadow-[0_1px_3px_rgba(40,51,45,.12),0_10px_24px_-16px_rgba(40,51,45,.35)]"
                  >
                    <div className="absolute top-2 right-2 bg-[#28332d]/75 text-white text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums z-10 backdrop-blur-xs opacity-0 transition-opacity group-hover:opacity-100">
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
            ) : parsedFile.extractedImages.length > 0 ? (
              <div className="p-4 space-y-3" data-source-original-only="embedded-images">
                <div className="font-sans font-semibold text-[#28332d] flex items-center gap-1.5 text-xs">
                  <ImageIcon className="w-4 h-4 text-[#F2604D]" />
                  <span>รูปภาพต้นฉบับที่ฝังในเอกสาร ({parsedFile.extractedImages.length} รูป)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {parsedFile.extractedImages.map((img, idx) => (
                    <div key={idx} className="border border-[#dedad0] rounded-lg p-2 bg-white shadow-2xs text-center space-y-1">
                      <img src={img.dataUrl} alt={`Source figure ${idx}`} className="max-h-36 mx-auto object-contain" />
                      <span className="text-[10px] text-stone-500 block font-mono">{img.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (parsedFile.originalText ?? parsedFile.rawContent).trim() && parsedFile.extension !== ".pdf" ? (
              <pre data-source-original-only="text" className="whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-[#28332d]">{parsedFile.originalText ?? parsedFile.rawContent}</pre>
            ) : (
              <div
                data-source-original-only="missing"
                className="h-full min-h-[420px] flex items-center justify-center p-6 bg-[#f7f6f2]"
              >
                <div className="max-w-sm rounded-xl border border-[#dedad0] bg-[#fdfdfc] p-5 text-center shadow-2xs space-y-3">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#dedad0] bg-[#eae8e1] text-[#496053]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-[#28332d]">ยังไม่มีต้นฉบับที่บันทึกไว้</div>
                    <p className="text-xs leading-relaxed text-stone-600">{parsedFile.fileName}</p>
                    {onAttachOriginal && <button type="button" disabled={sourceAttaching} onClick={() => sourceInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-[#dedad0] bg-white px-3 py-2 text-xs text-[#496053]"><Paperclip className="h-3.5 w-3.5" />แนบไฟล์ต้นฉบับเดิม</button>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: OCR, Conversion & Rich Text Editor (50%) */}
        <div ref={conversionPaneRef} data-workspace="conversion" className="ui-surface ui-pane-in relative lg:col-span-6 min-w-0 h-full flex flex-col overflow-hidden" style={{ animationDelay: "70ms" }}>
          <div data-layout="compact-conversion-header" className="ui-pane-head">
            <div className="flex min-w-0 flex-1 basis-full sm:basis-auto flex-wrap items-center gap-x-3 gap-y-1">
              <span className="ui-title">
                {itemsList.length ? <>ฉบับร่าง <span className="font-normal text-[var(--ui-ink-3)]">· {itemsList.length} ข้อ</span></> : "OCR ดิบ"}
              </span>

              {/* Stepper Timeline with Horizontal Connectors and Status Animations */}
              <div data-layout="icon-stepper" className="flex items-center gap-1" role="group" aria-label="ขั้นตอนการทำงาน">
                {/* Step 1: Format Exam */}
                <button
                  type="button"
                  data-step="format"
                  aria-label={answerBusy ? "กำลังอ่านเฉลย…" : itemsList.length ? "จัดรูปแบบแล้ว" : "แปลงเป็นรูปแบบข้อสอบ"}
                  disabled={Boolean(ocrProgress) || !sourcePagesComplete || !reviewText.trim() || itemsList.length > 0}
                  onClick={() => onConvertReviewedText?.(reviewText)}
                  className={`group relative w-8 h-8 rounded-full transition-[background-color,color,opacity] duration-200 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                    itemsList.length > 0
                      ? completedStepClass
                      : !itemsList.length && reviewText.trim() && !ocrProgress
                      ? "bg-[var(--ui-olive)] text-white ui-halo hover:bg-[var(--ui-olive-dark)]"
                      : stepIdleClass
                  }`}
                  title={itemsList.length ? "ขั้นตอนที่ 1: จัดรูปแบบแล้ว (ผ่านแล้ว)" : "ขั้นตอนที่ 1: แปลง OCR เป็นรูปแบบข้อสอบ (ขั้นตอนปัจจุบัน)"}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="sr-only">{answerBusy ? "กำลังอ่านเฉลย…" : itemsList.length ? "จัดรูปแบบแล้ว" : "แปลงเป็นรูปแบบข้อสอบ"}</span>
                  {itemsList.length > 0 && <StepDoneBadge />}
                </button>

                <span aria-hidden="true" className="ui-connector h-0.5 w-3 sm:w-4 rounded-full shrink-0">{itemsList.length > 0 && <span className="bg-[var(--ui-olive)]" />}</span>

                {/* Step 2: AI Diagram & Figure Extraction */}
                {onHarvestDiagrams && (
                  <button
                    type="button"
                    data-step="diagrams"
                    aria-label={diagramBusy ? "กำลังสกัดรูป…" : diagramsHarvested ? "สกัดรูปแล้ว (สกัดซ้ำได้)" : "สกัดรูปประกอบ (AI)"}
                    disabled={!itemsList.length || diagramBusy || answerBusy}
                    onClick={() => onHarvestDiagrams?.()}
                    className={`group relative w-8 h-8 rounded-full transition-[background-color,color,opacity] duration-200 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                      diagramBusy
                        ? "bg-[var(--ui-teal)] text-white ui-halo-teal"
                        : diagramsHarvested
                        ? completedStepClass
                        : itemsList.length > 0
                        ? "bg-[var(--ui-teal)] hover:bg-[#005a63] text-white ui-halo-teal"
                        : stepIdleClass
                    }`}
                    title={diagramBusy ? "กำลังสกัดรูปภาพและตาราง (กำลังประมวลผล)..." : diagramsHarvested ? "ขั้นตอนที่ 2: สกัดรูปประกอบแล้ว (ผ่านแล้ว · คลิกเพื่อสกัดซ้ำ)" : "ขั้นตอนที่ 2: สกัดรูปประกอบ ตาราง และภาพตัวเลือกด้วย AI Vision (ขั้นตอนปัจจุบัน)"}
                  >
                    <Crop className={`w-4 h-4 ${diagramBusy ? "animate-spin" : ""}`} />
                    <span className="sr-only">{diagramBusy ? "กำลังสกัดรูป…" : diagramsHarvested ? "สกัดรูปแล้ว (สกัดซ้ำได้)" : "สกัดรูปประกอบ (AI)"}</span>
                    {diagramsHarvested && <StepDoneBadge />}
                  </button>
                )}

                {/* Connector 2: Step 2 -> Step 3 */}
                {onExtractAnswers && (
                  <span aria-hidden="true" className="ui-connector h-0.5 w-3 sm:w-4 rounded-full shrink-0">{diagramsHarvested && <span className="bg-[var(--ui-olive)]" />}</span>
                )}

                {/* Step 3: Optional AI Answer Detection */}
                {onExtractAnswers && (
                  <button
                    type="button"
                    data-step="answers"
                    aria-label={answerBusy ? "กำลังวิเคราะห์เฉลย…" : "วิเคราะห์เฉลยจากต้นฉบับและ AI"}
                    disabled={!itemsList.length || answerBusy || diagramBusy}
                    onClick={() => onExtractAnswers?.()}
                    className={`group relative w-8 h-8 rounded-full transition-[background-color,color,opacity] duration-200 flex items-center justify-center shrink-0 disabled:opacity-40 ${
                      answerBusy
                        ? "bg-[var(--ui-olive)] text-white ui-halo"
                        : answersCompleted
                        ? completedStepClass
                        : diagramsHarvested
                        ? "bg-[var(--ui-olive)] hover:bg-[var(--ui-olive-dark)] text-white ui-halo"
                        : stepIdleClass
                    }`}
                    title={answerBusy ? "กำลังวิเคราะห์เฉลย..." : answersCompleted ? "วิเคราะห์แล้ว · คลิกเพื่อตรวจซ้ำ" : "อ่านเฉลยต้นฉบับ แล้วให้ AI เติมข้อที่ยังว่าง"}
                  >
                    <Search className={`w-4 h-4 ${answerBusy ? "animate-spin" : ""}`} />
                    <span className="sr-only">{answerBusy ? "กำลังอ่านเฉลย…" : "ตรวจเฉลยจากภาพ (AI)"}</span>
                    {answersCompleted && <StepDoneBadge />}
                  </button>
                )}

                {/* Step 4: Issue Review (If any issues detected) */}
                {itemsList.length > 0 && (
                  <>
                    <span aria-hidden="true" className="ui-connector h-0.5 w-3 sm:w-4 rounded-full shrink-0">{reviewIssues.length > 0 && <span className="bg-[#e0b04a]" />}</span>
                    <button
                      type="button"
                      data-step="review"
                      aria-label={reviewIssues.length ? "ตรวจสอบฉบับแก้ไข" : "ตรวจสอบฉบับแก้ไข (ไม่มีรายการ)"}
                      disabled={!reviewIssues.length}
                      onClick={() => editorPaneRef.current && onReviewEditor?.(editorPaneRef.current)}
                      className={`group relative w-8 h-8 rounded-full border transition-colors duration-200 flex items-center justify-center shrink-0 disabled:cursor-default disabled:opacity-40 ${reviewIssues.length ? "border-[#ecd196] bg-[#fff8e6] text-[#a16207] hover:bg-[#fdefc8] ui-halo-amber" : "border-[var(--ui-line)] bg-[var(--ui-sunken)] text-[var(--ui-ink-3)]"}`}
                      title={reviewIssues.length ? `ตรวจสอบฉบับแก้ไข (${reviewIssues.length} รายการ)` : "ยังไม่มีรายการตรวจแก้"}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span className="sr-only">ตรวจสอบฉบับแก้ไข</span>
                      {reviewIssues.length > 0 && (
                        <span className="ui-check-in absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#d97706] border-2 border-white text-white text-[9px] font-bold leading-none flex items-center justify-center tabular-nums">
                          {reviewIssues.length}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>

              <span key={nextStepLabel} className="ui-status-in hidden 2xl:inline text-[12px] text-[var(--ui-ink-3)] whitespace-nowrap">{nextStepLabel}</span>
            </div>

            {(itemsList.length > 0 || reviewText.trim()) && (
              <div className="min-w-0 shrink-0" data-editor-tools="true">
                <RichTextToolbar
                  onFormat={handleFormat}
                  onInsertImage={handleInsertImage}
                  onCopyAll={handleCopyAll}
                  onExportDrive={handleExportDrive}
                  onDownloadDocx={handleDownloadDocx}
                  documentAvailable={Boolean(itemsList.length || reviewText.trim())}
                  exportAvailable={exportAvailable}
                  exporting={exporting}
                  editingAvailable={itemsList.length > 0}
                />
              </div>
            )}
          </div>

          {itemsList.length > 0 && reviewIssues.length > 0 && (
            <details className="group/review shrink-0 border-b border-[#f0deb0] bg-[#fffaf0] px-3.5 py-2 text-[12px] text-[#7a4f05]">
              <summary className="cursor-pointer select-none font-medium marker:text-[#c08a1e]">ต้องตรวจแก้ {reviewIssues.length} รายการ <span className="font-normal text-[#8f6a1f]">· แก้ข้อความและแทรกรูปต่อได้ทันที</span></summary>
              <ul className="mt-1.5 max-h-28 list-disc overflow-y-auto pl-5 leading-relaxed">{reviewIssues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>
            </details>
          )}

          {navigationItems.length > 0 && (
            <nav
              ref={navRef}
              data-layout="compact-question-nav"
              aria-label="เลือกข้อสอบ"
              className="nav-scroll flex flex-nowrap items-center gap-x-0.5 overflow-x-auto border-b border-[var(--ui-line)] bg-[var(--ui-sunken)] px-3 py-1.5 shrink-0 min-w-0"
            >
              <span className="mr-1.5 shrink-0 text-[11px] font-medium text-[var(--ui-ink-3)]">ข้อ</span>
              {navigationGroups.map(({ anchor, hidden }) => {
                const expanded = openGap === anchor.id;
                const activeHidden = hidden.find(item => item.id === activeQuestionId);
                const renderNumber = (item: ExamItem) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`ไปข้อ ${item.questionNumber}`}
                  aria-current={activeQuestionId === item.id ? "true" : undefined}
                  onClick={() => jumpToQuestion(item)}
                  className={`nav-chip h-6 min-w-6 shrink-0 rounded-md px-1 text-[11px] leading-none tabular-nums ${
                    activeQuestionId === item.id
                      ? "bg-[var(--ui-olive)] text-white font-semibold"
                      : "text-[var(--ui-ink-2)] hover:bg-white hover:text-[var(--ui-ink)]"
                  }`}
                >
                  {item.questionNumber}
                </button>
                );
                if (!hidden.length) return <React.Fragment key={anchor.id}>{renderNumber(anchor)}</React.Fragment>;
                const range = `${hidden[0].questionNumber}–${hidden[hidden.length - 1].questionNumber}`;
                return <span key={anchor.id} className="nav-range" data-open={expanded ? "true" : "false"}>
                  {renderNumber(anchor)}
                  <button type="button" data-nav-gap={anchor.questionNumber} aria-expanded={expanded} aria-controls={`question-gap-${anchor.id}`} aria-label={`${expanded ? "ซ่อน" : "แสดง"}ข้อ ${hidden[0].questionNumber} ถึง ${hidden[hidden.length - 1].questionNumber}`} title={`${expanded ? "ซ่อน" : "แสดง"}ข้อ ${range}`} onClick={() => setOpenGap(previous => previous === anchor.id ? null : anchor.id)} className={`nav-gap-toggle flex h-6 shrink-0 items-center justify-center rounded-full focus-visible:outline-offset-0 ${!expanded && activeHidden ? "px-0.5" : "w-5"} ${expanded ? "text-[var(--ui-teal)] hover:bg-white" : activeHidden ? "" : "text-[#9aa29d] hover:text-[var(--ui-teal)]"}`}>
                    {expanded
                      ? <ChevronLeft aria-hidden="true" className="nav-gap-icon h-3.5 w-3.5" />
                      : activeHidden
                      ? <span aria-hidden="true" className="nav-gap-marker">{activeHidden.questionNumber}</span>
                      : <Circle aria-hidden="true" className="nav-gap-icon h-1.5 w-1.5 fill-current" />}
                    {!expanded && activeHidden && <span className="sr-only">ข้อปัจจุบัน {activeHidden.questionNumber}</span>}
                  </button>
                  <span id={`question-gap-${anchor.id}`} data-nav-expanded={expanded ? "true" : "false"} className={`nav-gap-region ${expanded ? "is-open" : ""}`} style={{ "--gap-width": `${hidden.length * 26}px` } as React.CSSProperties} ref={node => { if (node) node.inert = !expanded; }} aria-hidden={!expanded}>
                    <span className="nav-gap-content">{hidden.map(renderNumber)}</span>
                  </span>
                </span>;
              })}
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
            onClick={event => {
              if (event.target instanceof HTMLImageElement && itemsList.length) { keepImageTools(); placeImageTools(event.target); }
              handleAnswerClick(event);
            }}
            onInput={handleEditorInput}
            onMouseOver={event => {
              if (!itemsList.length) return;
              const target = event.target as Element;
              if (target instanceof HTMLImageElement && !target.closest("[data-export-ignore]")) { keepImageTools(); placeImageTools(target); }
              else if (imageTools) releaseImageTools();
            }}
            onMouseLeave={() => { if (imageTools) releaseImageTools(); }}
            onScroll={event => {
              if (imageTools) setImageTools(null);
              const pane = event.currentTarget;
              const max = pane.scrollHeight - pane.clientHeight;
              // Direct style write: a state update here would re-render every question on each scroll frame.
              if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, pane.scrollTop / max) : 0})`;
            }}
            onDragOver={event => {
              if (!itemsList.length || !Array.from(event.dataTransfer.items).some(entry => entry.kind === "file" && entry.type.startsWith("image/"))) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              const item = (event.target as Element).closest<HTMLElement>("[data-item-id]");
              if (item !== dropTarget.current) { dropTarget.current?.removeAttribute("data-drop-target"); item?.setAttribute("data-drop-target", "true"); dropTarget.current = item; }
            }}
            onDragLeave={event => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              dropTarget.current?.removeAttribute("data-drop-target"); dropTarget.current = null;
            }}
            onDrop={event => {
              const file = Array.from(event.dataTransfer.files).find(entry => entry.type.startsWith("image/"));
              dropTarget.current?.removeAttribute("data-drop-target"); dropTarget.current = null;
              if (!file || !itemsList.length) return;
              event.preventDefault();
              void openUploadDialog(file, questionIdAt(event.target as Element));
            }}
            onPaste={event => {
              const file = Array.from(event.clipboardData.files).find(entry => entry.type.startsWith("image/"));
              if (!file || !itemsList.length) return;
              event.preventDefault();
              void openUploadDialog(file, questionIdAt(window.getSelection()?.anchorNode));
            }}
            className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4 font-sans text-[12pt] bg-white text-slate-900 focus:outline-none leading-normal"
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
            ) : shouldUseRestoredEditorHtml ? (
              restoredContent
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
                        {FORMATTER_CONSTANTS.LABEL_SHARED_START}:{" "}
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
                    <button type="button" data-export-ignore="true" contentEditable={false} data-source-page={item.sourcePage} disabled={!parsedFile.pageImages?.length} className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500" title={`เปิดต้นฉบับหน้า ${item.sourcePage}`}>
                      หน้า {item.sourcePage}
                    </button>
                  )}
                  <span className="text-slate-900 font-light leading-relaxed text-[12pt]">{item.questionText.split("\n").map((line, index) => <React.Fragment key={index}>{index > 0 && <br />}{line}</React.Fragment>)}</span>
                </div>

                {/* 2. Question Image (if present) */}
                {item.imageUrl && (
                  <div data-question-image="true" className="pl-4 space-y-2">
                    <span className="text-[#F2604D] font-bold text-[12pt] block">
                      รูปโจทย์:
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
                      const origin = choice.isCorrect ? ANSWER_ORIGINS[choice.shadingType === "manual" ? "manual" : isYellowShaded ? "auto_solved" : "source_provided"] : undefined;

                      return (
                        <div
                          key={choice.key}
                          data-choice-key={choice.key}
                          style={{ backgroundColor: origin?.background }}
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
                              <span data-answer-marker="true" className="text-[#F2604D] font-bold ml-1">{choice.isCorrect ? " *" : ""}</span>
                            </div>
                            <span data-answer-badge="true" data-export-ignore="true" contentEditable={false} className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-white/70 shadow-2xs shrink-0 ml-2">
                              {origin?.label || ""}
                            </span>
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
                  <summary>{item.reconciliationProvenance === "ai_generated" ? "เหตุผลเฉลยจาก AI · ตรวจทานกับต้นฉบับ" : `หลักฐานเฉลย · หน้า ${item.sourceAnswerEvidence.page} · กรุณาตรวจเทียบต้นฉบับ`}</summary>
                  <p>{item.sourceAnswerEvidence.evidence}</p>
                </details>}
                <div data-explanation-block="true" className="pl-4 pt-1 space-y-2">
                  {item.explanationText && (
                    <div>
                      <span className="text-[#006D77] font-bold text-[12pt]">
                        {FORMATTER_CONSTANTS.LABEL_EXPLANATION}{" "}
                      </span>
                      <span className="text-slate-700 font-light leading-relaxed text-[12pt]">{item.explanationText}</span>
                    </div>
                  )}
                  {item.explanationImageUrl && (
                    <div data-explanation-image="true" className="pt-1">
                      <span className="text-[#F2604D] font-bold text-[12pt] block mb-2">
                        รูปคำอธิบาย:
                      </span>
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

          {/* T-107: reading progress for long documents */}
          {itemsList.length > 0 && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]">
              <div ref={progressBarRef} data-read-progress="true" className="h-full origin-left bg-[var(--ui-teal)]/70 transition-transform duration-150 ease-out" style={{ transform: "scaleX(0)" }} />
            </div>
          )}

          <input ref={addImageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" aria-label="เลือกไฟล์รูปเพื่อแทรก" onChange={event => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (file) void openUploadDialog(file, questionIdAt(editorSelection.current?.startContainer));
          }} />
          <input ref={replaceImageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" aria-label="เลือกไฟล์รูปเพื่อเปลี่ยน" onChange={event => {
            const file = event.target.files?.[0]; event.target.value = "";
            if (file) void replaceImage(file);
          }} />

          {/* T-107: floating image tools anchored to the hovered editor image */}
          {imageTools && (() => {
            const scale = Number(imageTools.image.dataset.exportScale) || 1;
            const below = imageTools.height < 72;
            const top = below ? imageTools.top + imageTools.height + 6 : Math.max(6, imageTools.top + 8);
            const right = Math.max(8, imageTools.paneWidth - (imageTools.left + imageTools.width) + 8);
            return <>
              <div aria-hidden="true" className="ui-image-frame pointer-events-none absolute z-20 rounded-md" style={{ top: imageTools.top - 3, left: imageTools.left - 3, width: imageTools.width + 6, height: imageTools.height + 6 }} />
              <div role="toolbar" aria-label="จัดการรูปภาพ" data-image-tools="true" onMouseEnter={keepImageTools} onMouseLeave={releaseImageTools} onFocus={keepImageTools} className="ui-status-in absolute z-30 flex items-center gap-0.5 rounded-xl border border-[var(--ui-line)] bg-white/95 p-0.5 shadow-[0_10px_28px_-12px_rgba(40,51,45,.45)] backdrop-blur-sm" style={{ top, right }}>
                <button type="button" aria-label="เปลี่ยนรูปจากไฟล์" data-tip="เปลี่ยนรูปจากไฟล์" onClick={() => replaceImageInputRef.current?.click()} className="ui-icon-btn ui-tip"><ImageUp className="h-4 w-4" /></button>
                <button type="button" aria-label="ตัดใหม่จากต้นฉบับ" data-tip="ตัดใหม่จากต้นฉบับ" disabled={!hasOriginalVisualSource} onClick={recaptureImage} className="ui-icon-btn ui-tip disabled:opacity-40"><Crop className="h-4 w-4" /></button>
                <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[var(--ui-line-strong)]" />
                <div role="group" aria-label="ขนาดรูปในเอกสาร" className="flex items-center">
                  {[0.5, 0.75, 1].map(option => (
                    <button key={option} type="button" aria-label={`ขนาดรูป ${option * 100}%`} aria-pressed={scale === option} onClick={() => resizeImage(option)} className={`h-7 min-w-9 rounded-md px-1 font-mono text-[11px] font-semibold tabular-nums transition-colors ${scale === option ? "bg-[var(--ui-olive)] text-white" : "text-[var(--ui-ink-3)] hover:bg-[var(--ui-hover)] hover:text-[var(--ui-ink)]"}`}>{option * 100}%</button>
                  ))}
                </div>
                <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[var(--ui-line-strong)]" />
                <button type="button" aria-label="ลบรูป" data-tip="ลบรูป" onClick={deleteImage} className="ui-icon-btn ui-tip ui-tip-end hover:!bg-[#fdecea] hover:!text-[#c2412f]"><Trash2 className="h-4 w-4" /></button>
              </div>
            </>;
          })()}

          {removedImage && (
            <div role="status" className="ui-status-in absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[var(--ui-ink)] py-1.5 pl-4 pr-1.5 text-[13px] text-white shadow-lg">
              ลบรูปแล้ว
              <button type="button" onClick={undoDeleteImage} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/15 px-3 font-medium hover:bg-white/25">
                <Undo2 className="h-3.5 w-3.5" />เลิกทำ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// T-106: completed-step check that pops in once instead of a static dot.
function StepDoneBadge() {
  return (
    <span aria-hidden="true" className="ui-check-in absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white bg-[#2f855a]">
      <Check className="h-2 w-2 stroke-[3.5] text-white" />
    </span>
  );
}
