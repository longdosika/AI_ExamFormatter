"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { 
  Sparkles, 
  BookOpen, 
  History, 
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Wrench,
  X,
  FileText, 
  Download,
  Bookmark,
  Trash2,
  FolderArchive
} from "lucide-react";
import { FileUploader } from "@/components/FileUploader";
import { ParsedFileResult, parseUploadedFile, revokeParsedFileUrls } from "@/lib/file-parser";
import { mergeHarvestedEditor } from "@/lib/harvest-editor";
import { saveOriginalSource, loadOriginalSource, deleteOriginalSource, sourceMatchesDraft } from "@/lib/original-source-store";
import { parseExamText } from "@/lib/exam-parser";
import { validateExamItems } from "@/lib/exam-validation";
import { readReviewedDocument } from "@/lib/reviewed-document";
import { APP_VERSION } from "@/lib/version";
import { ExamItem, FORMATTER_CONSTANTS } from "@/lib/formatter-rules";
import { CaseDecisionManager } from "@/components/CaseDecisionManager";
import { SplitDocumentEditor } from "@/components/SplitDocumentEditor";
import { StatisticsModal } from "@/components/StatisticsModal";
import { GoogleDriveStatus, type DriveStatus } from "@/components/GoogleDriveStatus";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { DraftProgress } from "@/components/DraftProgress";
import { saveLibrarySource, saveLibraryOutput, libraryRequest } from "@/lib/document-library-client";
import { draftBackup, sanitizeDraftHtml } from "@/lib/draft-backup";
import { PendingLibraryOutput, readPendingOutputs, putPendingOutput, removePendingOutput } from "@/lib/library-pending-store";
import { generateFallbackExamItems } from "@/lib/exam-fallback";
import { prepareExportDocument, snapshotDocument } from "@/lib/export-document";
import { answerItemsFromEditor } from "@/lib/answer-editor";
import { appendExperiment, experimentReport, readExperiments, ImportExperiment } from "@/lib/experiment-stats";
import { readOcrDocument } from "@/lib/ocr-client";
import { exportName } from "@/lib/export-naming";
import { OCR_INK_FILTER_STORAGE_KEY, ocrInkFilterEnabled, removeColouredInk } from "@/lib/ink-filter";
import { readSourceAnswers, solveUnresolvedAnswers } from "@/lib/source-answer-client";
import { harvestExamDiagrams } from "@/lib/diagram-client";
import { readImportHistory, recordImport, ImportHistoryEntry } from "@/lib/import-history";
import { 
  loadAllDrafts, 
  findDraftByDoc,
  draftsForSource,
  markDraftExported,
  saveDocumentDraft, 
  deleteDocumentDraft, 
  clearAllDocumentDrafts, 
  DocumentDraft 
} from "@/lib/document-draft-store";

export default function Home() {
  const [filterOcrInk,setFilterOcrInk]=useState(false);
  useEffect(()=>{setFilterOcrInk(ocrInkFilterEnabled());},[]);
  const [parsedFile, setParsedFile] = useState<ParsedFileResult | null>(null);
  const [formattedItems, setFormattedItems] = useState<ExamItem[] | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [reviewIssues, setReviewIssues] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [showCaseLog, setShowCaseLog] = useState(false);
  const [documentVersion, setDocumentVersion] = useState(0);
  const [driveReady, setDriveReady] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveStatus | null>(null);
  const [showDriveSettings, setShowDriveSettings] = useState(false);
  const [driveSlot, setDriveSlot] = useState<HTMLDivElement | null>(null);
  const driveSettingsClose = useRef<HTMLButtonElement>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [pendingOutputs, setPendingOutputs] = useState<PendingLibraryOutput[]>([]);
  useEffect(() => {
    void readPendingOutputs().then(entries => setPendingOutputs(previous => [...previous, ...entries.filter(entry => !previous.some(item => item.version === entry.version))])).catch(() => setLibraryError("อ่านคิว output ในเครื่องไม่ได้ กรุณาตรวจพื้นที่เบราว์เซอร์"));
  }, []);
  const [exportLink, setExportLink] = useState<string | null>(null);
  const [statisticsError, setStatisticsError] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState<{completed:number;total:number} | null>(null);
  const [answerBusy, setAnswerBusy] = useState(false);
  const [diagramBusy, setDiagramBusy] = useState(false);
  const [diagramsHarvested, setDiagramsHarvested] = useState(false);
  const answerEpoch = useRef(0);
  // T-129: import history is shown inside the drafts list (one list) instead of its own dialog.
  const [historyEntries, setHistoryEntries] = useState<ImportHistoryEntry[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [experimentRuns, setExperimentRuns] = useState<ImportExperiment[]>([]);
  const parserImages = (file: ParsedFileResult) => [
    ...file.extractedImages,
    ...(file.pageImages || []).map((dataUrl, index) => ({ id: `page-${index + 1}`, dataUrl })),
  ];
  const [availableDraft, setAvailableDraft] = useState<DocumentDraft | null>(null);
  // T-128: a file imported before (same SHA-256, any name) asks before any OCR/AI work.
  type DuplicateChoice = "new" | "resume" | "library" | "cancel";
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ fileName: string; drafts: DocumentDraft[]; driveName: string | null } | null>(null);
  const duplicateResolver = useRef<((choice: DuplicateChoice) => void) | null>(null);
  const answerDuplicate = (choice: DuplicateChoice) => { const resolve = duplicateResolver.current; duplicateResolver.current = null; setDuplicatePrompt(null); resolve?.(choice); };
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<DocumentDraft[]>([]);
  // T-111: the upload screen offers the latest drafts so work can resume in one click.
  const [recentDrafts, setRecentDrafts] = useState<DocumentDraft[]>([]);
  // T-119: number of saved drafts shown on the drafts button.
  const [draftCount, setDraftCount] = useState(0);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [draftOpening, setDraftOpening] = useState(false);
  const sourceDraftKey = useRef<string | undefined>(undefined);
  const restoredEditorHtml = useRef<string | null>(null);
  const autosaveTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !toolsRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [toolsOpen]);
  const openDraftsModal = () => {
    try {
      const drafts = loadAllDrafts(window.localStorage);
      setSavedDrafts(drafts);
      try { setHistoryEntries(readImportHistory(window.localStorage)); } catch { setHistoryEntries([]); }
      setShowDraftsModal(true);
    } catch {
      setStatisticsError("อ่านแบบร่างไม่ได้");
    }
  };

  const parsedFileFromDraft = (draft: DocumentDraft): ParsedFileResult => ({
    fileName: draft.fileName,
    fileSize: draft.fileBytes,
    sourceHash: draft.sourceHash || undefined,
    fileType: "application/pdf",
    extension: draft.fileName.includes(".") ? `.${draft.fileName.split(".").pop()?.toLowerCase() || "pdf"}` : ".pdf",
    rawContent: "",
    ocrTextRegions: draft.ocrTextRegions,
    extractedImages: [],
    isClean: true,
    statusMessage: "โหลดจากแบบร่างที่บันทึกไว้ในเครื่อง",
  });

  const handleApplyDraft = async (draft: DocumentDraft) => {
    sourceItemCount.current = draft.sourceItemCount;
    const epoch = ++uploadEpoch.current;
    setDraftOpening(true);
    setSourceError(null);
    setOcrProgress(null);
    answerEpoch.current++;
    setAnswerBusy(false);
    setDiagramBusy(false);
    setExportLink(null);
    let currentFile = activeFile.current && sourceMatchesDraft(activeFile.current, draft) ? activeFile.current : null;
    if (!currentFile) {
      try { currentFile = await loadOriginalSource(draft); }
      catch { if (epoch === uploadEpoch.current) setSourceError("อ่านไฟล์ต้นฉบับที่เก็บไว้ไม่ได้ กรุณาแนบไฟล์เดิมกลับมา"); }
    }
    if (epoch !== uploadEpoch.current) { if (currentFile && currentFile !== activeFile.current) revokeParsedFileUrls(currentFile); setDraftOpening(false); return; }
    if (activeFile.current && activeFile.current !== currentFile) revokeParsedFileUrls(activeFile.current);
    currentFile ||= parsedFileFromDraft(draft);
    currentFile.ocrTextRegions ||= draft.ocrTextRegions;
    sourceDraftKey.current = draft.docKey;
    activeFile.current = currentFile;
    setParsedFile(currentFile);
    setOcrText(draft.ocrText || currentFile.rawContent || "");
    if (draft.formattedItems && draft.formattedItems.length > 0) {
      restoredEditorHtml.current = draft.editorHtml || null;
      setFormattedItems(draft.formattedItems);
      sourceQuestionNumbers.current = draft.formattedItems.map(item => item.questionNumber);
      setDiagramsHarvested(Boolean(draft.diagramsHarvested));
      setReviewIssues(validateExamItems(draft.formattedItems));
      sourcePagesComplete.current = true;
      setErrorMessage(null);
    } else {
      restoredEditorHtml.current = null;
      setFormattedItems([]);
      sourceQuestionNumbers.current = draft.ocrText ? parseExamText(draft.ocrText, [], draft.fileName).map(item => item.questionNumber) : [];
      setReviewIssues(draft.ocrText ? validateExamItems(parseExamText(draft.ocrText, [], draft.fileName)) : []);
      sourcePagesComplete.current = true;
      setErrorMessage(null);
    }
    setDocumentVersion(version => version + 1);
    setAvailableDraft(null);
    setShowDraftsModal(false);
    setDraftOpening(false);
    setInfoNotice(`โหลดแบบร่างและประวัติ OCR เรียบร้อย (${draft.itemCount || (draft.formattedItems?.length ?? 0)} ข้อ) แก้ไขต่อได้โดยไม่ต้องเริ่มใหม่หรือเรียก AI ซ้ำ`);
  };

  const handleDeleteDraft = (id: string) => {
    try {
      const draft = loadAllDrafts(window.localStorage).find(entry => entry.id === id);
      deleteDocumentDraft(window.localStorage, id);
      if (draft) void deleteOriginalSource(draft.docKey).catch(() => setStatisticsError("ลบไฟล์ต้นฉบับที่เก็บไว้ไม่ได้"));
      setSavedDrafts(loadAllDrafts(window.localStorage));
      if (availableDraft?.id === id) setAvailableDraft(null);
    } catch {
      // ignore
    }
  };

  const handleClearAllDrafts = () => {
    try {
      clearAllDocumentDrafts(window.localStorage);
      void deleteOriginalSource().catch(() => setStatisticsError("ลบไฟล์ต้นฉบับที่เก็บไว้ไม่ได้"));
      setSavedDrafts([]);
      setAvailableDraft(null);
    } catch {
      // ignore
    }
  };

  const openStatisticsModal = () => {
    try {
      const runs = readExperiments(window.localStorage);
      setExperimentRuns(runs);
      setShowStatisticsModal(true);
    } catch {
      setStatisticsError("อ่านสถิติไม่ได้ ข้อมูลเดิมยังไม่ถูกลบ กรุณาตรวจพื้นที่จัดเก็บของเบราว์เซอร์");
    }
  };

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

  const [exportPhase, setExportPhase] = useState<string | null>(null);
  const exportDocument = async (editor: HTMLElement) => {
    try {
      if (!parsedFile) throw new Error("ไม่พบเอกสารที่จะส่งออก");
      setExportLink(null);
      setExportPhase("เตรียมเอกสาร…");
      const document = await prepareExportDocument(editor, parsedFile.fileName, (done, total) => setExportPhase(total ? `เตรียมรูป ${done}/${total}` : "เตรียมเอกสาร…"));
      setExportPhase("อัปโหลดและแปลงเป็น Google Docs…");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (parsedFile.sourceBlob && parsedFile.sourceHash) {
        const { collection } = await saveLibrarySource(parsedFile);
        headers["X-Collection-Id"] = collection.id;
        headers["X-Version-Id"] = crypto.randomUUID();
      } else setLibraryError("ส่งออกได้ แต่ยังผูกคลังไม่ได้ กรุณาแนบต้นฉบับเดิม");
      const response = await fetch("/api/google/export", { method: "POST", headers, body: JSON.stringify(document) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "ส่งออกไม่สำเร็จ");
      setExportLink(result.url);
      try { markDraftExported(window.localStorage, parsedFile.sourceHash, parsedFile.fileName, parsedFile.fileSize); } catch {}
    } finally {
      setExportPhase(null);
    }
  };

  const downloadDocument = async (editor: HTMLElement) => {
    if (!parsedFile) return;
    const exportSnapshot = await prepareExportDocument(editor, parsedFile.fileName);
    const response = await fetch("/api/export/docx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(exportSnapshot) });
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "ดาวน์โหลดไม่สำเร็จ");
    }
    const bytes = await response.blob();
    const url = URL.createObjectURL(bytes);
    const link = document.createElement("a");
    link.href = url;
    // T-128: "[original filename]_[yymmdd-hhmm].docx", the same name the export gets on Drive.
    link.download = `${exportName(parsedFile.fileName)}.docx`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    try { markDraftExported(window.localStorage, parsedFile.sourceHash, parsedFile.fileName, parsedFile.fileSize); } catch {}
    if (!parsedFile.sourceBlob || !parsedFile.sourceHash) {
      setLibraryError("ดาวน์โหลดแล้ว แต่ยังผูกคลังไม่ได้: กรุณาแนบต้นฉบับเดิมแล้วส่งออกใหม่ ไม่ได้เพิ่มรายการนี้เข้าคิว Drive");
      return;
    }
    const pending = { file: { fileName: parsedFile.fileName, sourceBlob: parsedFile.sourceBlob, sourceHash: parsedFile.sourceHash }, bytes, name: link.download, version: crypto.randomUUID() };
    setPendingOutputs(previous => [...previous, pending]);
    try { await putPendingOutput(pending); }
    catch { setLibraryError("ดาวน์โหลดแล้ว แต่เก็บคิวในเครื่องไม่ได้ อย่าปิดหน้านี้ก่อนส่งคลังสำเร็จ"); }
    if (driveReady) {
      try {
        const { collection } = await saveLibrarySource(pending.file);
        await saveLibraryOutput(collection.id, bytes, pending.name, pending.version);
        await removePendingOutput(pending.version);
        setPendingOutputs(previous => previous.filter(item => item.version !== pending.version));
        setLibraryError(null);
      } catch (error) { setLibraryError(`ดาวน์โหลดแล้ว แต่เก็บคลังยังไม่สำเร็จ: ${error instanceof Error ? error.message : "ลองใหม่ในคลังไฟล์"}`); }
    } else setLibraryError("ดาวน์โหลดแล้ว · output ยังรอเก็บ Drive กรุณาเชื่อม Google และส่งรายการค้างก่อนปิดหน้านี้");
  };

  const retryLibraryOutputs = async () => {
    for (const pending of pendingOutputs) {
      const { collection } = await saveLibrarySource(pending.file);
      await saveLibraryOutput(collection.id, pending.bytes, pending.name, pending.version);
      await removePendingOutput(pending.version);
      setPendingOutputs(previous => previous.filter(item => item.version !== pending.version));
    }
    setLibraryError(null);
  };

  useEffect(() => {
    if (!driveReady || !parsedFile?.sourceBlob || !parsedFile.sourceHash) return;
    let current = true;
    void saveLibrarySource(parsedFile).then(() => { if (current) setLibraryError(null); }).catch(error => { if (current) setLibraryError(`ยังเก็บต้นฉบับใน Drive ไม่สำเร็จ: ${error instanceof Error ? error.message : "ลองใหม่ในคลังไฟล์"}`); });
    return () => { current = false; };
  }, [driveReady, parsedFile]);

  const workingAnswerItems = () => {
    const editor = document.querySelector<HTMLElement>('[role="textbox"][aria-label="ข้อสอบที่จัดรูปแบบแล้ว"]');
    return editor ? answerItemsFromEditor(formattedItems || [], editor) : formattedItems || [];
  };

  const activeFile = useRef<ParsedFileResult | null>(null);
  const sourceQuestionNumbers = useRef<number[]>([]);
  const sourceItemCount = useRef<number | undefined>(undefined);
  const sourcePagesComplete = useRef(true);
  const uploadEpoch = useRef(0);
  const caseButton = useRef<HTMLButtonElement>(null);
  useEffect(() => () => {
    if (activeFile.current) revokeParsedFileUrls(activeFile.current);
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
  }, []);

  const handleReset = () => {
    sourceItemCount.current = undefined;
    sourceDraftKey.current = undefined;
    setSourceError(null);
    answerEpoch.current++;
    setAnswerBusy(false);
    setDiagramBusy(false);
    setDiagramsHarvested(false);
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
    setAvailableDraft(null);
    restoredEditorHtml.current = null;
  };

  const handleStartUpload = () => {
    // Clear previous document immediately when a new file upload starts
    handleReset();
  };

  const attachOriginalSource = async (file: File) => {
    const expected = activeFile.current;
    if (!expected) return;
    const epoch = uploadEpoch.current;
    if (file.name !== expected.fileName || file.size !== expected.fileSize) throw new Error("ไฟล์ไม่ตรงกับแบบร่าง กรุณาเลือกต้นฉบับชื่อและขนาดเดิม");
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("");
    if (expected.sourceHash && expected.sourceHash !== hash) throw new Error("เนื้อหาไฟล์ไม่ตรงกับต้นฉบับของแบบร่างนี้ (SHA-256)");
    const restored = await parseUploadedFile(file);
    restored.sourceHash = expected.sourceHash;
    restored.sourceBlob = file;
    restored.originalText = restored.rawContent;
    if (epoch !== uploadEpoch.current || activeFile.current !== expected) { revokeParsedFileUrls(restored); return; }
    setSourceError(null);
    try { await saveOriginalSource(restored, sourceDraftKey.current); }
    catch { if (epoch === uploadEpoch.current) setSourceError("เก็บต้นฉบับในเครื่องไม่ได้ ไฟล์จะแสดงได้เฉพาะรอบนี้ กรุณาตรวจพื้นที่จัดเก็บ"); }
    if (epoch !== uploadEpoch.current || activeFile.current !== expected) { revokeParsedFileUrls(restored); return; }
    revokeParsedFileUrls(expected);
    activeFile.current = restored;
    setParsedFile(restored);
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
    try {
      saveDocumentDraft(window.localStorage, {
        fileName: activeFile.current.fileName,
        fileBytes: activeFile.current.fileSize,
        sourceHash: activeFile.current.sourceHash,
        ocrText: ocrText || activeFile.current.rawContent || "",
        formattedItems: fallbackItems,
        itemCount: fallbackItems.length,
      });
    } catch {}
  };

  const handleFileParsed = async (result: ParsedFileResult) => {
    // T-128: warn before importing a file that was imported before, recognised by its bytes (renamed copies too).
    const previousDrafts = draftsForSource(window.localStorage, result.fileName, result.fileSize, result.sourceHash);
    let driveName: string | null = null;
    if (result.sourceHash && driveReady) {
      try {
        const response = await fetch(`/api/google/library?hash=${result.sourceHash}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
        const found = response.ok ? await response.json() : null;
        if (found?.collection?.name) driveName = String(found.collection.name);
      } catch { /* Drive is optional for this check; local drafts still decide. */ }
    }
    if (previousDrafts.length || driveName) {
      const choice = await new Promise<DuplicateChoice>(resolve => {
        duplicateResolver.current = resolve;
        setDuplicatePrompt({ fileName: result.fileName, drafts: previousDrafts, driveName });
      });
      if (choice === "cancel") { revokeParsedFileUrls(result); return false; }
      if (choice === "library") { revokeParsedFileUrls(result); setShowLibrary(true); return false; }
      if (choice === "resume" && previousDrafts[0]) { revokeParsedFileUrls(result); await handleApplyDraft(previousDrafts[0]); return false; }
    }
    sourceItemCount.current = undefined;
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
    setDiagramBusy(false);
    setDiagramsHarvested(false);
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
      try { await saveOriginalSource(result); }
      catch { if (epoch === uploadEpoch.current) setSourceError("เก็บไฟล์ต้นฉบับในเครื่องไม่ได้ กรุณาตรวจพื้นที่จัดเก็บ ก่อนปิดหน้านี้ให้ดาวน์โหลดงานไว้"); }
      if (epoch !== uploadEpoch.current) { revokeParsedFileUrls(result); return false; }
      const cachedDraft = findDraftByDoc(window.localStorage, result.fileName, result.fileSize, result.sourceHash);
      if (cachedDraft && (cachedDraft.ocrText || (cachedDraft.formattedItems && cachedDraft.formattedItems.length > 0))) {
        setAvailableDraft(cachedDraft);
        // T-125: reuse saved OCR text only together with its line geometry. Without geometry the figure crops lose
        // their stem/choice limits and duplicated table text cannot be removed, so such drafts are OCR'd again.
        if (cachedDraft.ocrText && cachedDraft.ocrTextRegions?.some(page => page.length) && !result.rawContent.trim()) {
          result.rawContent = cachedDraft.ocrText;
          result.ocrTextRegions = cachedDraft.ocrTextRegions;
          setOcrText(cachedDraft.ocrText);
        }
      }

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
      let items = parseExamText(result.rawContent, parserImages(result), result.fileName);
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
            // T-121 (B-26): OCR reads a copy without coloured pen marks; the source pane keeps the original.
            const ocrImages = ocrInkFilterEnabled() ? await Promise.all(imagesToOcr.map(removeColouredInk)) : imagesToOcr;
            const ocrData = await readOcrDocument(ocrImages, {
              isCurrent: () => epoch === uploadEpoch.current,
              onProgress: (completed, total) => {
                if (epoch === uploadEpoch.current) {
                  setOcrProgress({completed,total});
                  setInfoNotice(`กำลังอ่าน OCR: ดำเนินการ ${completed}/${total} หน้า ระบบแบ่งส่งอัตโนมัติ`);
                }
              },
            });
            ocrFailure = ocrData.error;
            result.ocrTextRegions = ocrData.pageResults.map(page => page.textRegions || []);
            if (!ocrData.success) observation.status = "failed";
            observation.models = Array.from(new Set(ocrData.pageResults.map(page => page.modelUsed).filter((model): model is string => typeof model === "string" && Boolean(model))));
            if (activeFile.current !== result) return true;
            sourcePagesComplete.current = ocrData.allPagesSuccess === true;
            if (typeof ocrData.text === "string" && ocrData.text.trim()) {
              // Keep the latest OCR text on the parsed-file record as well as
              // in React state. This makes image fallback/review actions use
              // the actual OCR result instead of the initial image placeholder.
              result.rawContent = ocrData.text;
              const observedItems = parseExamText(ocrData.text, parserImages(result), result.fileName);
              observeItems(observedItems, validateExamItems(observedItems).length + (ocrData.allPagesSuccess ? 0 : 1));
              sourceQuestionNumbers.current = parseExamText(ocrData.text, [], result.fileName).map(item => item.questionNumber);
              setOcrText(ocrData.text);
              setReviewIssues(validateExamItems(parseExamText(ocrData.text, parserImages(result), result.fileName)));
              try {
                saveDocumentDraft(window.localStorage, {
                  fileName: result.fileName,
                  fileBytes: result.fileSize,
                  sourceHash: result.sourceHash,
                  ocrText: ocrData.text,
                  ocrTextRegions: result.ocrTextRegions,
                  itemCount: observedItems.length,
                });
              } catch {}
            }

            const structuredReady = ocrData.success && ocrData.text &&
              ocrData.quality === "ready" && ocrData.questionMarkers > 0 &&
              ocrData.allPagesSuccess;
            if (structuredReady) {
              const ocrItems = parseExamText(ocrData.text, parserImages(result), result.fileName);
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
    const items = parseExamText(text, parserImages(parsedFile), parsedFile.fileName);
    const originalAnswers = new Map(parseExamText(ocrText || parsedFile.rawContent, [], parsedFile.fileName).map(item => [item.questionNumber, item.reconciledAnswerKey]));
    items.forEach(item => {
      if (item.reconciledAnswerKey && item.reconciledAnswerKey !== originalAnswers.get(item.questionNumber)) {
        item.reconciliationProvenance = "manual";
        item.sourceAnswerEvidence = undefined;
        item.choices.forEach(choice => { choice.shadingType = choice.isCorrect ? "manual" : "none"; });
      }
    });
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
    if (!current()) return;
    setFormattedItems(items);
    setDiagramsHarvested(false);
    // Review findings are represented by the compact review icon in the editor rail;
    // keep the document workspace free of a duplicate full-width alert.
    setErrorMessage(null);
    setInfoNotice(`จัดโครงสร้างข้อสอบได้ ${items.length} ข้อเรียบร้อย (กด 'สกัดรูปประกอบ' เพื่อดึงภาพ/ตาราง หรือตรวจทานฝั่งขวา)`);
    try {
      saveDocumentDraft(window.localStorage, {
        fileName: parsedFile.fileName,
        fileBytes: parsedFile.fileSize,
        sourceHash: parsedFile.sourceHash,
        ocrText: text,
        formattedItems: items,
        itemCount: items.length,
      });
    } catch {}
  };

  const handleHarvestDiagrams = async () => {
    if (!parsedFile || !formattedItems || formattedItems.length === 0) return;
    const epoch = ++answerEpoch.current;
    const upload = uploadEpoch.current;
    const current = () => epoch === answerEpoch.current && upload === uploadEpoch.current;
    setDiagramBusy(true);
    setInfoNotice("กำลังสกัดรูปประกอบ ตาราง และภาพตัวเลือกด้วย AI Vision...");
    try {
      const images = parsedFile.pageImages?.length
        ? parsedFile.pageImages
        : parsedFile.fileType.startsWith("image/")
        ? parsedFile.extractedImages.map(img => img.dataUrl)
        : [];
      // T-125: capture limits and duplicate-text removal need OCR line geometry; fetch it first when this session has none.
      let textRegions = parsedFile.ocrTextRegions;
      if (!textRegions?.some(page => page.length) && images.length) {
        setInfoNotice("กำลังอ่านตำแหน่งข้อความในต้นฉบับก่อนสกัดรูป...");
        const ocrImages = ocrInkFilterEnabled() ? await Promise.all(images.map(removeColouredInk)) : images;
        const geometry = await readOcrDocument(ocrImages, { isCurrent: current });
        if (!current()) return;
        if (geometry.pageResults.some(page => page.textRegions?.length)) {
          textRegions = geometry.pageResults.map(page => page.textRegions || []);
          parsedFile.ocrTextRegions = textRegions;
        }
      }
      const res = await harvestExamDiagrams(
        workingAnswerItems(),
        images,
        current,
        (done, total, msg) => setInfoNotice(msg),
        textRegions
      );
      if (!current()) return;
      if (res.items) {
        const editor=document.querySelector<HTMLElement>('[data-workspace="conversion"] [contenteditable="true"]');
        if(editor) restoredEditorHtml.current=mergeHarvestedEditor(editor,formattedItems,res.items);
        setFormattedItems(res.items);
      }
      setDiagramsHarvested(!res.error);
      setReviewIssues(validateExamItems(res.items));
      setInfoNotice(res.error ? `สกัดได้ ${res.count} รูป แต่ยังไม่ครบ: ${res.error}` : `สกัดรูปประกอบสำเร็จ ${res.count} รูป (รูปโจทย์, ตาราง, ตัวเลือก) ตรวจทานฝั่งขวาหรือกด 'ตรวจเฉลยจากภาพ'`);
      try {
        saveDocumentDraft(window.localStorage, {
          fileName: parsedFile.fileName,
          fileBytes: parsedFile.fileSize,
          sourceHash: parsedFile.sourceHash,
          ocrText: ocrText || "",
          ocrTextRegions: textRegions,
          formattedItems: res.items || formattedItems,
          editorHtml: restoredEditorHtml.current || "",
          diagramsHarvested: !res.error,
          itemCount: (res.items || formattedItems).length,
        });
      } catch {}
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "สกัดรูปประกอบไม่สำเร็จ");
    } finally {
      if (current()) setDiagramBusy(false);
    }
  };

  const handleExtractAnswers = async () => {
    if (!parsedFile || !formattedItems || formattedItems.length === 0) return;
    const epoch = ++answerEpoch.current;
    const upload = uploadEpoch.current;
    const current = () => epoch === answerEpoch.current && upload === uploadEpoch.current;
    const items = workingAnswerItems();
    let sourceAnswerCount = 0;
    let aiAnswerCount = 0;
    let answerError = "";
    setAnswerBusy(true);
    setInfoNotice("กำลังตรวจเฉลยจากต้นฉบับ และเตรียม AI เติมข้อที่ยังไม่มีเฉลย...");
    try {
      const images = parsedFile.pageImages?.length ? parsedFile.pageImages : parsedFile.fileType.startsWith("image/") ? parsedFile.extractedImages.map(image => image.dataUrl) : [];
      const sourceResult = await readSourceAnswers(items, images, current, page => setInfoNotice(`กำลังอ่านเฉลยจากต้นฉบับหน้า ${page}/${images.length || "-"}`));
      sourceAnswerCount = sourceResult.count;
      setInfoNotice("กำลังให้ AI วิเคราะห์ข้อที่ยังไม่มีเฉลยจากต้นฉบับ...");
      const aiResult = await solveUnresolvedAnswers(items, images, current, (page, total) => setInfoNotice(`กำลังวิเคราะห์เฉลยจาก AI ชุด ${page}/${total}`));
      aiAnswerCount = aiResult.count;
      const failedPages = [...new Set([...sourceResult.failures, ...aiResult.failures])];
      if (failedPages.length) answerError = `ยังวิเคราะห์ไม่สำเร็จชุด ${failedPages.join(", ")}`;
    } catch (error) { 
      sourceAnswerCount = items.filter(item => item.reconciliationProvenance === "source_vision").length;
      aiAnswerCount = items.filter(item => item.reconciliationProvenance === "ai_generated").length;
      answerError = error instanceof Error ? error.message : "อ่านเฉลยไม่สำเร็จ"; 
    } finally { 
      if (current()) setAnswerBusy(false); 
    }
    if (!current()) return;
    setFormattedItems(items);
    const unresolvedCount = items.filter(item => !item.reconciledAnswerKey && item.choices.length).length;
    setInfoNotice(`ตรวจเฉลยเสร็จ · ต้นฉบับ ${sourceAnswerCount} · AI ${aiAnswerCount} · เหลือ ${unresolvedCount} ข้อ${answerError ? ` · ${answerError}` : " · กรุณาตรวจทานเฉลย AI กับต้นฉบับ"}`);
    try {
      saveDocumentDraft(window.localStorage, {
        fileName: parsedFile.fileName,
        fileBytes: parsedFile.fileSize,
        sourceHash: parsedFile.sourceHash,
        ocrText: ocrText || "",
        formattedItems: items,
        diagramsHarvested,
        itemCount: items.length,
      });
    } catch {}
  };

  const reviewLiveEditor = (editor: HTMLElement) => {
    if (!parsedFile || !formattedItems) return;
    // Review must inspect the live DOM without rebuilding it from plain text.
    // The rendered editor owns images and managed labels that the exam parser
    // intentionally does not model; replacing formattedItems here used to
    // erase choice images and turn labels into question text before export.
    const normalizeManagedLabels = () => {
      const ensureManagedLabel = (container: HTMLElement, text: string) => {
        const labels = Array.from(container.querySelectorAll<HTMLElement>("span,p")).filter(label => label.textContent?.trim() === text);
        if (!labels.length) {
          const label = document.createElement("span");
          label.textContent = text;
          label.style.color = "#F2604D";
          label.style.fontWeight = "bold";
          label.style.display = "block";
          container.insertBefore(label, container.firstChild);
        } else {
          labels.slice(1).forEach(label => label.remove());
        }
      };
      editor.querySelectorAll<HTMLElement>("[data-item-id]").forEach(itemNode => {
        const questionImage = itemNode.querySelector<HTMLElement>("[data-question-image]");
        if (questionImage) {
          const questionText = itemNode.querySelector<HTMLElement>(".text-slate-900");
          if (questionText) questionText.textContent = questionText.textContent?.replace(/(?:รูปโจทย์:|รูปโจทย์ร่วม:)\s*/gu, "").trim() || "";
          ensureManagedLabel(questionImage, "รูปโจทย์:");
        }
        const sharedImage = itemNode.querySelector<HTMLElement>("[data-shared-image='true']");
        if (sharedImage) {
          ensureManagedLabel(sharedImage, "รูปโจทย์ร่วม:");
        }
        const explanationImage = itemNode.querySelector<HTMLElement>("[data-explanation-image='true']");
        if (explanationImage) {
          ensureManagedLabel(explanationImage, "รูปคำอธิบาย:");
        }
      });
    };
    normalizeManagedLabels();
    const reviewClone = editor.cloneNode(true) as HTMLElement;
    reviewClone.querySelectorAll("[data-question-image], [data-shared-image='true'], [data-choice-image='true'], [data-explanation-image='true'], [data-export-ignore]").forEach(node => node.remove());
    const snapshot = snapshotDocument(reviewClone, parsedFile?.fileName || "ข้อสอบ");
    const text = snapshot.paragraphs.map(paragraph => paragraph.runs.map(run => run.text || "").join("")).join("\n");
    const items = parseExamText(text, parserImages(parsedFile), parsedFile?.fileName);
    const liveItemNodes = Array.from(editor.querySelectorAll<HTMLElement>("[data-item-id]"));
    items.forEach((item, index) => {
      const liveNode = liveItemNodes[index];
      const previous = formattedItems[index];
      // T-131: keep every question figure (source order as shown in the editor), not only the first.
      const images = Array.from(liveNode?.querySelectorAll<HTMLImageElement>("[data-question-image] img") || []);
      if (images.length) {
        item.questionImages = images.map(image => { try { const bbox = JSON.parse(image.dataset.sourceBbox || "null"); return { url: image.src, bbox: Array.isArray(bbox) && bbox.length === 4 ? bbox as [number, number, number, number] : undefined }; } catch { return { url: image.src }; } });
        item.imageUrl = images[0].src;
        item.imageBbox = item.questionImages[0].bbox;
      } else if (previous?.imageUrl) { item.imageUrl = previous.imageUrl; item.questionImages = previous.questionImages; }
      const sharedImage = liveNode?.querySelector<HTMLImageElement>("[data-shared-image='true'] img");
      if (sharedImage) item.sharedContextImageUrl = sharedImage.src;
      else if (previous?.sharedContextImageUrl) item.sharedContextImageUrl = previous.sharedContextImageUrl;
      item.choices = item.choices.map(choice => {
        const previousChoice = previous?.choices.find(candidate => candidate.key === choice.key);
        const choiceImage = liveNode?.querySelector<HTMLImageElement>(`[data-choice-key="${CSS.escape(choice.key)}"] [data-choice-image='true'] img`);
        return { ...choice, imageUrl: choiceImage?.src || previousChoice?.imageUrl };
      });
    });
    const issues = validateExamItems(items);
    if (!sourcePagesComplete.current) issues.push("OCR ยังอ่านไม่ครบทุกหน้า");
    for (const number of sourceQuestionNumbers.current) {
      if (!items.some(item => item.questionNumber === number)) issues.push(`ข้อ ${number}: ไม่พบในฉบับแก้ไข`);
    }
    setReviewIssues(issues);
    // The review icon/badge remains the single source of truth once the editor is open.
    setErrorMessage(null);
    setInfoNotice(issues.length ? "แก้ฉบับร่างต่อได้ แล้วตรวจสอบอีกครั้ง" : "ตรวจโครงสร้างฉบับแก้ไขผ่านแล้ว กรุณาเทียบต้นฉบับก่อนส่งออก");
    if (parsedFile) {
      try {
        saveDocumentDraft(window.localStorage, {
          fileName: parsedFile.fileName,
          fileBytes: parsedFile.fileSize,
          sourceHash: parsedFile.sourceHash,
          ocrText: ocrText || parsedFile.rawContent || "",
          // Keep the structured model that owns media/answer provenance. The
          // editorHtml snapshot is the authoritative edited text; storing the
          // parser-only review result here would drop choice-image metadata
          // when a draft is reopened without its live DOM.
          formattedItems: answerItemsFromEditor(formattedItems, editor),
          editorHtml: editor.innerHTML,
          diagramsHarvested,
          itemCount: items.length || formattedItems.length,
        });
      } catch {}
    }
  };

  const saveCurrentDraft = async (editor: HTMLElement, rawText?: string) => {
    if (!parsedFile) throw new Error("ไม่มีเอกสารให้บันทึก");
    if (autosaveTimer.current) { window.clearTimeout(autosaveTimer.current); autosaveTimer.current = null; }
    saveDocumentDraft(window.localStorage, {
      docKey: sourceDraftKey.current,
      fileName: parsedFile.fileName, fileBytes: parsedFile.fileSize, sourceHash: parsedFile.sourceHash,
      ocrText: rawText ?? ocrText ?? parsedFile.rawContent,
      formattedItems: rawText === undefined ? answerItemsFromEditor(formattedItems || [], editor) : [],
      editorHtml: rawText === undefined ? editor.innerHTML : "",
      diagramsHarvested: rawText === undefined && diagramsHarvested,
      itemCount: rawText === undefined ? formattedItems?.length || 0 : parseExamText(rawText).length,
      sourceItemCount: sourceItemCount.current ?? sourceQuestionNumbers.current.length,
    }, { requireFullSnapshot: true });
    setAvailableDraft(null);
  };
  const backupCurrentDraft = async (editor: HTMLElement,rawText?:string) => {
    if(!parsedFile) throw new Error("ไม่มีเอกสารให้สำรอง");
    await saveCurrentDraft(editor,rawText);
    const draft=loadAllDrafts(window.localStorage).find(entry=>entry.docKey===sourceDraftKey.current || (entry.sourceHash===parsedFile.sourceHash&&entry.fileName===parsedFile.fileName));
    if(!draft) throw new Error("อ่านแบบร่างที่บันทึกไว้ไม่ได้");
    const {collection}=await saveLibrarySource(parsedFile);
    await libraryRequest("",{method:"POST",headers:{"X-Library-Action":"draft","X-Collection-Id":collection.id,"X-Version-Id":crypto.randomUUID(),"Content-Type":"application/json"},body:JSON.stringify(draftBackup(draft))});
  };
  const restoreDriveDraft = async (draft:DocumentDraft,collectionId:string) => {
    const response=await fetch(`/api/google/library?collection=${encodeURIComponent(collectionId)}&source=1`,{cache:"no-store"});
    if(!response.ok) throw new Error("อ่านต้นฉบับจาก Drive ไม่ได้ ยังไม่เปลี่ยนเอกสารปัจจุบัน");
    const blob=await response.blob();
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await blob.arrayBuffer())),byte=>byte.toString(16).padStart(2,"0")).join("");
    if(hash!==draft.sourceHash) throw new Error("ต้นฉบับจาก Drive ไม่ตรงกับแบบร่าง");
    const original=await parseUploadedFile(new File([blob],draft.fileName,{type:blob.type}));
    original.sourceHash=hash;
    original.sourceBlob=blob;
    if(!sourceMatchesDraft(original,draft) || original.sourceHash!==draft.sourceHash) {revokeParsedFileUrls(original);throw new Error("ต้นฉบับจาก Drive ไม่ตรงกับแบบร่าง");}
    try {await saveOriginalSource(original,draft.docKey);} finally {revokeParsedFileUrls(original);}
    if(autosaveTimer.current) {window.clearTimeout(autosaveTimer.current);autosaveTimer.current=null;}
    const clean={...draft,editorHtml:draft.editorHtml ? sanitizeDraftHtml(draft.editorHtml) : ""};
    const saved=saveDocumentDraft(window.localStorage,clean,{requireFullSnapshot:true});
    setShowLibrary(false);
    await handleApplyDraft(saved);
  };

  const handleEditorDraftChange = (editor: HTMLElement) => {
    if (!parsedFile || !formattedItems?.length) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    const html = editor.innerHTML;
    const answerItems = answerItemsFromEditor(formattedItems, editor);
    autosaveTimer.current = window.setTimeout(() => {
      try {
        saveDocumentDraft(window.localStorage, {
          fileName: parsedFile.fileName,
          fileBytes: parsedFile.fileSize,
          sourceHash: parsedFile.sourceHash,
          ocrText: ocrText || parsedFile.rawContent || "",
          formattedItems: answerItems,
          editorHtml: html,
          diagramsHarvested,
          itemCount: formattedItems.length,
        });
      } catch {}
    }, 600);
  };

  const isDocumentActive = Boolean(parsedFile && formattedItems);
  useEffect(() => {
    if (!isDocumentActive || !showDriveSettings) return;
    const trigger = document.activeElement as HTMLElement | null;
    driveSettingsClose.current?.focus();
    return () => trigger?.focus();
  }, [isDocumentActive, showDriveSettings]);
  useEffect(() => {
    const refresh = () => { try { setDraftCount(loadAllDrafts(window.localStorage).length); } catch { setDraftCount(0); } };
    refresh();
    window.addEventListener("storage", refresh);
    const timer = window.setInterval(refresh, 15000);
    return () => { window.removeEventListener("storage", refresh); window.clearInterval(timer); };
  }, [isDocumentActive, showDraftsModal, savedDrafts, availableDraft]);
  // T-111: refresh the recent-draft cards whenever the upload screen is shown.
  useEffect(() => {
    if (isDocumentActive) return;
    try {
      setRecentDrafts([...loadAllDrafts(window.localStorage)].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4));
    } catch {
      setRecentDrafts([]);
    }
  }, [isDocumentActive]);

  return (
    <main className={isDocumentActive ? "w-full h-screen max-h-screen flex flex-col gap-2 p-2 sm:p-2.5 bg-[var(--background)] overflow-hidden" : "max-w-[1600px] mx-auto px-4 py-6"}>
      {/* T-106: identity · live status · actions. Utilities are quiet icons; one primary action. */}
      <header className={`relative flex flex-wrap items-center gap-x-3 gap-y-2 shrink-0 ${isDocumentActive ? "min-h-11 px-1 sm:px-1.5" : "ui-surface px-5 py-3 mb-4"}`}>
        <div className="flex items-center gap-2.5 shrink-0">
          <div aria-hidden="true" className="relative w-8 h-8 rounded-[10px] bg-[var(--ui-olive)] flex items-center justify-center text-[#f7f6f2] shrink-0 overflow-hidden">
            <FileText className="w-4 h-4" />
            <span className="ui-logo-scan absolute inset-x-1.5 top-1.5 h-px bg-[#cbb58c]" />
          </div>
          <div className="flex flex-col leading-tight">
            <h1 className="text-[15px] font-semibold text-[var(--ui-ink)] tracking-tight whitespace-nowrap">AI Exam Formatter</h1>
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--ui-ink-3)]">
              <span className="font-mono">{APP_VERSION}</span>
            </span>
          </div>
          {/* T-128: the Google Drive connection sits here on the import screen (replaces the tagline). */}
          {!isDocumentActive && <div ref={setDriveSlot} className="ml-3 min-w-0 border-l border-[var(--ui-line)] pl-3" />}
        </div>

        <div className={`flex min-w-0 flex-1 items-center gap-2 ${isDocumentActive && !availableDraft ? "justify-start" : "justify-center"}`}>
          {isDocumentActive && availableDraft && (
            <div role="group" aria-label="แบบร่างเดิมของไฟล์นี้" className="ui-status-in flex shrink-0 items-center gap-1 text-[12px] text-[var(--ui-olive-dark)]" title={`บันทึกเมื่อ ${new Date(availableDraft.updatedAt).toLocaleString("th-TH")}`}>
              <Bookmark aria-hidden="true" className="h-3.5 w-3.5" />
              <button type="button" onClick={() => handleApplyDraft(availableDraft)} aria-label="โหลดแบบร่างเดิม (ประหยัดค่าใช้จ่าย)" className="ml-1 h-6 rounded-full bg-[var(--ui-olive)] px-2.5 text-[12px] font-medium text-white hover:bg-[var(--ui-olive-dark)]">โหลด</button>
              <button type="button" onClick={() => setAvailableDraft(null)} aria-label="ไม่ใช้แบบร่างเดิม" className="ui-icon-btn h-6 w-6 rounded-full"><X className="h-3.5 w-3.5" /></button>
            </div>
          )}
          {/* T-130: owner asked to remove the header status text; progress stays readable for assistive tech only.
              Step chips, the question strip and the answer summary already show the state on screen. */}
          {isDocumentActive && <div role="status" data-layout="compact-status" aria-label={infoNotice || undefined} className="sr-only">{infoNotice}</div>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="ui-inline-rail-anchor">
          <div className="ui-group ui-rail ui-inline-rail" role="group" aria-label="เครื่องมือเสริม">
            <button type="button" onClick={() => setShowLibrary(true)} aria-label="คลังไฟล์บน Drive" title="คลังไฟล์บน Drive" className="ui-rail-btn"><FolderArchive className="w-4 h-4" /><span aria-hidden="true" className="ui-rail-label">คลังไฟล์</span></button>
            <button type="button" onClick={openDraftsModal} aria-label="แบบร่างและแคช OCR" className="ui-rail-btn">
              <Bookmark className="w-4 h-4" />{draftCount > 0 && <span aria-hidden="true" className="ui-rail-badge">{draftCount > 99 ? "99+" : draftCount}</span>}<span aria-hidden="true" className="ui-rail-label">แบบร่าง/ประวัติ</span>
            </button>
            <span aria-hidden="true" className="ui-rail-divider" />
            {/* T-129: statistics, statistics download and the case log share one tools menu. */}
            <div ref={toolsRef} className="tools-anchor">
              <button type="button" onClick={() => setToolsOpen(open => !open)} aria-expanded={toolsOpen} aria-controls="tools-menu" aria-label="เครื่องมือ: สถิติ ดาวน์โหลดสถิติ บันทึกปัญหา" className="ui-rail-btn">
                <Wrench className="w-4 h-4" /><span aria-hidden="true" className="ui-rail-label">เครื่องมือ</span>
              </button>
              <div id="tools-menu" role="group" aria-label="เมนูเครื่องมือ" hidden={!toolsOpen} className="tools-menu">
                <button type="button" onClick={() => { setToolsOpen(false); openStatisticsModal(); }} aria-label="สถิติ 10 รอบล่าสุด" className="tools-item">
                  <BarChart3 className="w-4 h-4" /><span aria-hidden="true">สถิติ</span>
                </button>
                <button type="button" onClick={() => { setToolsOpen(false); downloadStatistics(); }} aria-label="ดาวน์โหลดสถิติการทดลอง" className="tools-item">
                  <Download className="w-4 h-4" /><span aria-hidden="true">ดาวน์โหลดสถิติ</span>
                </button>
                <button
                  ref={caseButton}
                  type="button"
                  aria-expanded={showCaseLog}
                  aria-controls="case-log-panel"
                  aria-label="บันทึกปัญหาและวิธีแก้"
                  onClick={() => { setToolsOpen(false); setShowCaseLog(!showCaseLog); }}
                  className="tools-item"
                >
                  <History className="w-4 h-4" /><span aria-hidden="true">บันทึกปัญหา</span>
                </button>
              </div>
            </div>
            <a
              href={FORMATTER_CONSTANTS.TEMPLATE_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="แม่แบบข้อสอบ (Google Docs)"
              className="ui-rail-btn"
            >
              <BookOpen className="w-4 h-4" /><span aria-hidden="true" className="ui-rail-label">แม่แบบ ↗</span>
            </a>
          </div>
          </div>
          {parsedFile && (
            <button type="button" onClick={handleReset} title="เลือกไฟล์ใหม่" aria-label="เลือกไฟล์ใหม่" className="ui-btn ui-btn-quiet">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">เลือกไฟล์ใหม่</span>
            </button>
          )}
        </div>
      </header>

      {libraryError && <div role="alert" className="mb-2 flex flex-wrap items-center gap-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900"><span>{libraryError}</span><button type="button" className="ui-btn ui-btn-quiet" onClick={() => setShowLibrary(true)}>เปิดคลังไฟล์</button></div>}
      {duplicatePrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="duplicate-title" aria-describedby="duplicate-body" className="duplicate-dialog">
            <h2 id="duplicate-title">ไฟล์นี้เคยนำเข้าแล้ว</h2>
            <p id="duplicate-body">
              <strong>{duplicatePrompt.fileName}</strong> มีเนื้อหาตรงกับไฟล์ที่เคยนำเข้า (ตรวจจากเนื้อไฟล์ จึงจับได้แม้เปลี่ยนชื่อ)
              {duplicatePrompt.driveName && <> และมีต้นฉบับในคลัง Drive ชื่อ <strong>{duplicatePrompt.driveName}</strong></>}
            </p>
            {duplicatePrompt.drafts[0] && (
              <div className="duplicate-draft">
                <div><strong>แบบร่างล่าสุด</strong> {duplicatePrompt.drafts[0].fileName} · {new Date(duplicatePrompt.drafts[0].updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}{duplicatePrompt.drafts.length > 1 ? ` · มีแบบร่างของไฟล์นี้ ${duplicatePrompt.drafts.length} ชุด` : ""}</div>
                <DraftProgress draft={duplicatePrompt.drafts[0]} />
              </div>
            )}
            <div className="duplicate-actions">
              {duplicatePrompt.drafts[0] && <button type="button" autoFocus className="ui-btn ui-btn-primary" onClick={() => answerDuplicate("resume")}>ทำต่อจากแบบร่างเดิม</button>}
              {!duplicatePrompt.drafts[0] && duplicatePrompt.driveName && <button type="button" autoFocus className="ui-btn ui-btn-primary" onClick={() => answerDuplicate("library")}>เปิดจากคลัง Drive</button>}
              <button type="button" className="ui-btn ui-btn-quiet" onClick={() => answerDuplicate("new")}>นำเข้าใหม่</button>
              <button type="button" className="ui-btn ui-btn-quiet" onClick={() => answerDuplicate("cancel")}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
      {showLibrary && <DocumentLibrary onClose={() => setShowLibrary(false)} pendingCount={pendingOutputs.length} onRetry={retryLibraryOutputs} onRestoreDraft={restoreDriveDraft} onSaveCurrent={parsedFile?.sourceBlob ? async () => { await saveLibrarySource(parsedFile); setLibraryError(null); } : undefined} />}

      {/* Google Drive Status: Full Card on upload screen, background-active in document view */}
      <div className={isDocumentActive ? showDriveSettings ? "fixed inset-0 z-[80] flex items-start justify-center bg-black/30 px-3 pt-24" : "hidden" : "hidden"}>
        <section role={isDocumentActive && showDriveSettings ? "dialog" : undefined} aria-modal={isDocumentActive && showDriveSettings ? true : undefined} aria-label={isDocumentActive && showDriveSettings ? "จัดการ Google Drive" : undefined} className={isDocumentActive ? "w-full max-w-lg rounded-lg bg-white p-4 shadow-xl" : undefined} onKeyDown={event => {
          if (event.key === "Escape") setShowDriveSettings(false);
          if (event.key === "Tab" && isDocumentActive && showDriveSettings) {
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]'));
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}>
          {isDocumentActive && <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Google Drive</h2><button ref={driveSettingsClose} type="button" aria-label="ปิดการจัดการ Google Drive" className="ui-icon-btn" onClick={() => setShowDriveSettings(false)}><X className="h-4 w-4" /></button></div>}
          {isDocumentActive && <GoogleDriveStatus onReady={setDriveReady} onStatus={setDriveStatus} active={showDriveSettings} />}
        </section>
      </div>

      {!isDocumentActive && driveSlot && createPortal(<GoogleDriveStatus variant="compact" onReady={setDriveReady} onStatus={setDriveStatus} active />, driveSlot)}

      {/* Case Decision Manager Overlay */}

      {/* Document Drafts & OCR Cache Modal */}
      {showDraftsModal && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="drafts-history-title"
          onKeyDown={event => {
            if (event.key === "Escape") setShowDraftsModal(false);
          }}
          className="fixed inset-4 z-50 mx-auto flex max-w-2xl flex-col rounded-xl border border-[#dedad0] bg-[#fdfdfc] p-4 shadow-xl"
          data-theme-surface="earth"
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#dedad0] pb-2">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-[#496053]" />
              <h2 id="drafts-history-title" className="text-sm font-semibold text-[#28332d]">
                แบบร่างและประวัติไฟล์นำเข้า
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {savedDrafts.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllDrafts}
                  className="text-xs text-[#F2604D] hover:text-[#b64535] px-2 py-1 rounded border border-transparent hover:border-[#F2604D]/25 hover:bg-[#F2604D]/10 transition"
                >
                  ล้างทั้งหมด
                </button>
              )}
              <button
                type="button"
                aria-label="ปิดหน้าต่างแบบร่าง"
                onClick={() => setShowDraftsModal(false)}
                className="rounded border border-[#dedad0] bg-[#f7f6f2] p-1.5 hover:bg-[#eae8e1]"
              >
                <X className="h-4 w-4 text-[#28332d]" />
              </button>
            </div>
          </div>
          <p className="my-2.5 text-xs text-stone-600">
            บันทึกแคช OCR, โครงสร้างข้อสอบ และรูปประกอบล่าสุดไว้ในเครื่อง ช่วยประหยัดเวลาและค่าใช้จ่าย API เมื่อทำงานกับเอกสารเดิม
          </p>
          <div tabIndex={0} aria-label="รายการแบบร่างที่บันทึกไว้" className="overflow-y-auto text-xs flex-1">
            {savedDrafts.length ? (
              <ol className="divide-y divide-[#eae8e1]">
                {savedDrafts.map(draft => (
                  <li key={draft.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="break-all font-semibold text-[#28332d] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#496053] shrink-0" />
                        <span>{draft.fileName}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-stone-500 flex flex-wrap items-center gap-2">
                        <span>{new Date(draft.updatedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</span>
                        <span>·</span>
                        <span>{(draft.fileBytes / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span className="font-medium text-[#496053]">
                          {draft.itemCount ? `${draft.itemCount} ข้อ` : draft.ocrText ? "มีข้อความ OCR" : "แบบร่าง"}
                        </span>
                      </div>
                      <DraftProgress draft={draft} />
                      {(() => { const imports = historyEntries.filter(entry => entry.fileName === draft.fileName); return imports.length ? <div className="mt-0.5 text-[11px] text-stone-500">นำเข้า {imports.length} ครั้ง · ล่าสุด {new Date(imports[0].importedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</div> : null; })()}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApplyDraft(draft)}
                        disabled={draftOpening}
                        className="bg-[#496053] hover:bg-[#394c42] text-white px-2.5 py-1 rounded text-xs font-medium shadow-2xs transition"
                      >
                        เปิดทำต่อ
                      </button>
                      <button
                        type="button"
                        aria-label={`ลบแบบร่าง ${draft.fileName}`}
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="text-stone-400 hover:text-[#F2604D] p-1 rounded hover:bg-[#F2604D]/10 transition"
                        title="ลบแบบร่างนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-stone-500 py-6 text-center">ยังไม่มีแบบร่างหรือประวัติ OCR ที่บันทึกไว้</p>
            )}
            {(() => {
              const withoutDraft = historyEntries.filter(entry => !savedDrafts.some(draft => draft.fileName === entry.fileName));
              return (
                <section aria-labelledby="import-history-title" className="mt-4 border-t border-[#eae8e1] pt-3">
                  <h3 id="import-history-title" className="text-[12px] font-semibold text-[#28332d]">ประวัติไฟล์นำเข้า</h3>
                  <p className="mt-0.5 text-[11px] text-stone-500">ไฟล์ที่เคยนำเข้าแต่ไม่มีแบบร่างแล้ว (เก็บเฉพาะชื่อและเวลา {historyEntries.length} ครั้งล่าสุดในเบราว์เซอร์นี้)</p>
                  {withoutDraft.length ? (
                    <ol aria-label="รายการไฟล์ที่เคยนำเข้า" className="mt-2 divide-y divide-[#eae8e1] text-xs">
                      {withoutDraft.map(entry => <li key={entry.id} className="flex items-center justify-between gap-3 py-1.5"><span className="break-all text-[#28332d]">{entry.fileName}</span><span className="shrink-0 text-stone-500">{new Date(entry.importedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}</span></li>)}
                    </ol>
                  ) : <p className="mt-2 text-[11px] text-stone-500">{historyEntries.length ? "ทุกไฟล์ที่เคยนำเข้ามีแบบร่างอยู่ด้านบนแล้ว" : "ยังไม่มีประวัติการนำเข้าในเบราว์เซอร์นี้"}</p>}
                </section>
              );
            })()}
          </div>
        </section>
      )}

      {showStatisticsModal && (
        <StatisticsModal
          isOpen={showStatisticsModal}
          onClose={() => setShowStatisticsModal(false)}
          runs={experimentRuns}
          onDownloadJson={downloadStatistics}
        />
      )}
      {showCaseLog && (
        <div id="case-log-panel" className={isDocumentActive ? "fixed inset-4 z-50 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-[#dedad0] p-4 overflow-y-auto max-w-4xl mx-auto" : "mb-6"}>
          <CaseDecisionManager onClose={() => { setShowCaseLog(false); caseButton.current?.focus(); }} />
        </div>
      )}

      {/* Status & Error Alerts */}
      {availableDraft && !isDocumentActive && (
        <div className="ui-status-in flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--ui-line)] bg-white py-1.5 pl-3 pr-1.5 text-[13px] text-[var(--ui-ink)] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <Bookmark className="w-4 h-4 text-[#496053] shrink-0" />
            <span className="truncate">
              พบแบบร่าง/แคช OCR เดิมของ <strong>{availableDraft.fileName}</strong> ({availableDraft.itemCount} ข้อ บันทึกเมื่อ {new Date(availableDraft.updatedAt).toLocaleTimeString("th-TH")})
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleApplyDraft(availableDraft)}
              className="ui-btn ui-btn-primary h-7"
            >
              โหลดแบบร่างเดิม (ประหยัดค่าใช้จ่าย)
            </button>
            <button
              type="button"
              onClick={() => setAvailableDraft(null)}
              className="ui-btn h-7 text-[var(--ui-ink-2)] hover:bg-[var(--ui-hover)]"
            >
              ไม่ใช้
            </button>
          </div>
        </div>
      )}
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
            sourceError={sourceError}
            onAttachOriginal={attachOriginalSource}
            formattedItems={formattedItems}
            rawOcrText={ocrText}
            ocrProgress={ocrProgress}
            sourcePagesComplete={sourcePagesComplete.current}
            sourceQuestionCount={sourceItemCount.current ?? sourceQuestionNumbers.current.length}
            reviewIssues={reviewIssues}
            restoredEditorHtml={restoredEditorHtml.current}
            onConvertReviewedText={convertReviewedText}
            onHarvestDiagrams={handleHarvestDiagrams}
            onExtractAnswers={handleExtractAnswers}
            diagramBusy={diagramBusy}
            diagramsHarvested={diagramsHarvested}
            answerBusy={answerBusy}
            onReviewEditor={reviewLiveEditor}
            onEditorDraftChange={handleEditorDraftChange}
            onReset={handleReset}
            onExportDrive={exportDocument}
            onDownloadDocx={downloadDocument}
            onSaveDraft={saveCurrentDraft}
            onBackupDraft={backupCurrentDraft}
            onDriveAction={() => setShowDriveSettings(true)}
            driveState={!driveStatus ? "checking" : !driveStatus.configured || driveStatus.error ? "error" : !driveStatus.connected ? "disconnected" : driveReady ? "ready" : "needs-folder"}
            exportAvailable={driveReady}
            exportedUrl={exportLink}
            exportPhase={exportPhase}
            onCreateStarterDraft={handleCreateStarterDraft}
          />
        </div>
      ) : (
        /* Initial File Import & Setup Screen */
        <div className="ui-pane-in max-w-xl mx-auto space-y-6 pt-4 sm:pt-12">
          <div className="ui-surface p-5 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ui-ink)]">นำเข้าไฟล์ข้อสอบ</h2>
              <p className="text-[13px] leading-relaxed text-[var(--ui-ink-3)]">
                เลือกไฟล์เพื่อเทียบต้นฉบับกับข้อสอบที่จัดรูปแบบแล้ว จากนั้นตรวจทานและแก้ไขข้อความได้
              </p>
            </div>

            <label className="mb-3 flex items-center gap-2 text-sm text-[var(--ui-ink-2)]">
              <input type="checkbox" checked={filterOcrInk} onChange={event=>{
                setFilterOcrInk(event.target.checked);
                try {window.localStorage.setItem(OCR_INK_FILTER_STORAGE_KEY,event.target.checked ? "on" : "off");} catch {}
              }} />กรองรอยปากกาสีก่อน OCR
            </label>
            <FileUploader 
              onFileParsed={handleFileParsed} 
              onError={handleUploadError} 
              onStart={handleStartUpload}
            />
            {recentDrafts.length > 0 && (
              <section aria-labelledby="recent-drafts-title" className="space-y-2">
                <h3 id="recent-drafts-title" className="text-[13px] font-semibold text-[var(--ui-ink-2)]">ทำต่อจากแบบร่างล่าสุด</h3>
                <ul className="space-y-1.5">
                  {recentDrafts.map((draft, index) => (
                    <li key={draft.id} className="recent-draft" style={{ animationDelay: `${index * 60}ms` }}>
                      <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--ui-olive)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-[var(--ui-ink)]" title={draft.fileName}>{draft.fileName}</div>
                        <div className="text-[11px] text-[var(--ui-ink-3)]">{draft.itemCount ? `${draft.itemCount} ข้อ` : "ข้อความ OCR"}, {new Date(draft.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</div>
                        <DraftProgress draft={draft} />
                      </div>
                      <button type="button" disabled={draftOpening} onClick={() => handleApplyDraft(draft)} aria-label={`ทำต่อจากแบบร่าง ${draft.fileName}`} className="ui-btn ui-btn-quiet h-8 shrink-0">ทำต่อ</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* BUILD_STAMP: 261017-2120 */
