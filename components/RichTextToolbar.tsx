"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Image as ImageIcon, 
  Copy, 
  Check,
  Download,
  FolderOutput,
  ExternalLink,
  Loader2,
  Save,
  CloudUpload,
  AlertTriangle,
  ChevronDown,
  Lock,
  Settings2
} from "lucide-react";

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onInsertImage: () => void;
  onCopyAll: () => void | Promise<boolean | void>;
  onExportDrive: () => void;
  onDownloadDocx: () => void;
  documentAvailable?: boolean;
  exportAvailable?: boolean;
  exporting?: boolean;
  downloading?: boolean;
  onSaveDraft?: () => void;
  onBackupDraft?: () => void;
  backingUpDraft?: boolean;
  savingDraft?: boolean;
  draftSaved?: boolean;
  onDriveAction?: () => void;
  driveState?: "checking" | "disconnected" | "needs-folder" | "ready" | "error";
  exportFailed?: boolean;
  /** T-119: current export step ("เตรียมรูป 3/12", "อัปโหลดและแปลง…"). */
  exportPhase?: string | null;
  /** T-119: review findings still open; export asks once before sending when > 0. */
  pendingIssues?: number;
  onReviewFirst?: () => void;
  editingAvailable?: boolean;
  /** T-110: link of the last successful Google export; the same control then offers open + export again. */
  exportedUrl?: string | null;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onFormat,
  onInsertImage,
  onCopyAll,
  onExportDrive,
  onDownloadDocx,
  documentAvailable = true,
  exportAvailable = false,
  exporting = false,
  downloading = false,
  onSaveDraft,
  onBackupDraft,
  backingUpDraft=false,
  savingDraft = false,
  draftSaved = false,
  onDriveAction,
  driveState = "checking",
  exportFailed = false,
  exportPhase = null,
  pendingIssues = 0,
  onReviewFirst,
  editingAvailable = true,
  exportedUrl = null,
}) => {
  // T-107: the copy icon morphs into a check only after the clipboard write really succeeded.
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);
  const copyAll = async () => {
    const ok = await onCopyAll();
    if (ok === false) return;
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 1600);
  };
  const driveLabel = driveState === "checking" ? "กำลังตรวจ Drive" : driveState === "ready" ? "Drive พร้อม" : driveState === "needs-folder" ? "เลือกโฟลเดอร์" : driveState === "error" ? "ตรวจการเชื่อมต่อ" : "เชื่อม Google";
  const [confirmExport, setConfirmExport] = useState(false);
  // T-130: Drive status, export, open-in-Drive and Drive backup are one control; the small menu holds the rarer actions.
  const [exportMenu, setExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!exportMenu) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !exportMenuRef.current?.contains(event.target as Node)) setExportMenu(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, [exportMenu]);
  const exportStep = exporting ? "sending" : exportFailed ? "failed" : exportedUrl ? "exported" : exportAvailable ? "ready" : driveState === "checking" ? "checking" : "locked";
  const exportLabel = exportStep === "sending" ? (exportPhase || "กำลังส่งออก…") : exportStep === "failed" ? "ส่งออกอีกครั้ง" : exportStep === "ready" ? "ส่งออก" : exportStep === "checking" ? "กำลังตรวจ Drive" : driveLabel;
  const exportTitle = exportStep === "locked" ? `${driveLabel}: เชื่อมต่อ Google Drive และตรวจสอบโฟลเดอร์ปลายทางก่อนส่งออก` : exportedUrl ? "ส่งออกฉบับปัจจุบันเป็นเอกสารใหม่อีกครั้ง" : `${driveLabel}: สร้างเอกสารใน Google Drive`;
  const ExportIcon = exportStep === "sending" || exportStep === "checking" ? Loader2 : exportStep === "failed" ? AlertTriangle : exportStep === "ready" ? FolderOutput : Lock;
  const startExport = () => {
    if (pendingIssues > 0 && exportAvailable && !exporting && !confirmExport) { setConfirmExport(true); return; }
    setConfirmExport(false);
    onExportDrive();
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      {/* Formatting Tools */}
      {editingAvailable && <div className="ui-group" role="group" aria-label="จัดรูปแบบข้อความ">
        <button
          type="button"
          onClick={() => onFormat("bold")}
          disabled={!editingAvailable}
          title="ตัวหนา (Ctrl+B)"
          aria-label="ตัวหนา"
          onMouseDown={(event) => event.preventDefault()}
          className="ui-icon-btn"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormat("italic")}
          disabled={!editingAvailable}
          title="ตัวเอียง (Ctrl+I)"
          aria-label="ตัวเอียง"
          onMouseDown={(event) => event.preventDefault()}
          className="ui-icon-btn"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onFormat("underline")}
          disabled={!editingAvailable}
          title="ขีดเส้นใต้ (Ctrl+U)"
          aria-label="ขีดเส้นใต้"
          onMouseDown={(event) => event.preventDefault()}
          className="ui-icon-btn"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
        <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-[var(--ui-line-strong)]" />
        <button
          type="button"
          onClick={onInsertImage}
          disabled={!editingAvailable}
          title="แทรกรูปภาพ"
          aria-label="แทรกรูป"
          className="ui-icon-btn"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <span title="ขนาดตัวอักษรมาตรฐานของแม่แบบ" className="hidden px-1.5 font-mono text-[11px] text-[var(--ui-ink-3)] min-[2100px]:inline">
          12 pt
        </span>
      </div>}

      {/* Action Tools */}
      <div className="flex items-center gap-1">
        {onSaveDraft && <button type="button" onClick={onSaveDraft} disabled={!documentAvailable || savingDraft} aria-label="บันทึกแบบร่าง" aria-busy={savingDraft} data-draft-saved={draftSaved ? "true" : "false"} title={draftSaved ? "บันทึกแบบร่างแล้ว" : "บันทึกแบบร่าง"} className="ui-icon-btn disabled:opacity-40">
          {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : draftSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        </button>}
        <button
          type="button"
          onClick={copyAll}
          aria-label="คัดลอกทั้งหมด" title="คัดลอกทั้งหมด"
          disabled={!documentAvailable}
          className="ui-icon-btn disabled:opacity-40"
        >
          {copied ? <Check className="ui-copied w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        <button type="button" onClick={onDownloadDocx} disabled={!documentAvailable || downloading}
          aria-label="ดาวน์โหลด DOCX" title="ดาวน์โหลดฉบับปัจจุบันเป็น DOCX"
          className="ui-icon-btn disabled:opacity-40">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>

        {/* T-130: one Drive control. Locked (not connected) -> export (ready) -> open in Drive (exported).
            Re-export, Drive backup and Drive settings sit in its small menu, so the toolbar has one Drive entry. */}
        <div ref={exportMenuRef} className="ui-export-area relative" data-drive-state={driveState}>
        <div className={`ui-export ml-1 ${exportedUrl ? "is-done" : ""}`} data-export-control="true" data-export-state={exportStep === "ready" || exportStep === "locked" || exportStep === "checking" ? "idle" : exportStep} data-export-step={exportStep}>
          {exportedUrl && !exporting ? (
            <a href={exportedUrl} target="_blank" rel="noreferrer" aria-label="เปิดเอกสารที่ส่งออกใน Google Docs" title="เปิดเอกสารที่ส่งออกใน Google Docs" className="ui-export-main ui-export-link">
              <ExternalLink className="w-4 h-4" />
              <span aria-hidden="true" className="hidden min-[1500px]:inline">เปิดใน Drive</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={startExport}
              aria-label="ส่งออกเข้า Google Drive" aria-busy={exporting}
              disabled={!documentAvailable || exporting}
              title={exporting && exportPhase ? exportPhase : exportTitle}
              className="ui-export-main"
            >
              <ExportIcon className={`w-4 h-4 ${exportStep === "sending" || exportStep === "checking" ? "animate-spin" : ""}`} />
              <span aria-hidden="true" className={exportStep === "sending" ? "ui-export-phase" : "hidden min-[1500px]:inline"}>{exportLabel}</span>
              <span className="sr-only">{exporting ? "กำลังส่งออก…" : exportStep === "locked" ? `เชื่อมต่อ Google Drive ก่อนส่งออก (${driveLabel})` : ""}</span>
            </button>
          )}
          {(exportAvailable || exportedUrl) && (
            <button type="button" onClick={() => setExportMenu(open => !open)} aria-expanded={exportMenu} aria-controls="export-menu" aria-label="ตัวเลือก Google Drive" title="ส่งออกใหม่ สำรองแบบร่าง และจัดการ Drive" className="ui-export-caret">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div id="export-menu" role="group" aria-label="เมนู Google Drive" hidden={!exportMenu} className="tools-menu ui-export-menu">
          {exportedUrl && (
            <button type="button" onClick={() => { setExportMenu(false); startExport(); }} disabled={!documentAvailable || exporting} aria-label="ส่งออกเข้า Google Drive" title="ส่งออกฉบับปัจจุบันเป็นเอกสารใหม่อีกครั้ง" className="tools-item">
              <FolderOutput className="h-4 w-4" /><span aria-hidden="true">ส่งออกใหม่</span>
            </button>
          )}
          {onBackupDraft && (
            <button type="button" onClick={() => { setExportMenu(false); onBackupDraft(); }} disabled={!documentAvailable || backingUpDraft} aria-label="สำรองแบบร่างบน Drive" aria-busy={backingUpDraft} className="tools-item">
              {backingUpDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}<span aria-hidden="true">สำรองแบบร่างบน Drive</span>
            </button>
          )}
          <button type="button" onClick={() => { setExportMenu(false); onDriveAction?.(); }} aria-label="จัดการการเชื่อมต่อ Google Drive" className="tools-item">
            <Settings2 className="h-4 w-4" /><span aria-hidden="true">จัดการ Google Drive ({driveLabel})</span>
          </button>
        </div>
        {confirmExport && (
          <div role="dialog" aria-label="ยืนยันการส่งออก" className="ui-export-confirm" onKeyDown={event => { if (event.key === "Escape") setConfirmExport(false); }}>
            <p>มี {pendingIssues} ข้อที่ยังต้องตรวจ ส่งออกเลยไหม</p>
            <div className="flex gap-1.5">
              <button type="button" autoFocus onClick={startExport} className="ui-export-confirm-go">ส่งออกเลย</button>
              <button type="button" onClick={() => { setConfirmExport(false); onReviewFirst?.(); }} className="ui-export-confirm-review">ไปตรวจก่อน</button>
            </div>
          </div>
        )}
        </div>
        <span role="status" className="sr-only">{exportedUrl ? "ส่งออกและยืนยันตำแหน่งเรียบร้อยแล้ว เปิดเอกสารได้จากปุ่มข้างปุ่มส่งออก" : ""}</span>
      </div>
    </div>
  );
};
