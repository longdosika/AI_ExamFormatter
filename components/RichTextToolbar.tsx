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
  FolderOutput
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
  editingAvailable?: boolean;
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
  editingAvailable = true,
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
        <span title="ขนาดตัวอักษรมาตรฐานของแม่แบบ" className="hidden px-1.5 font-mono text-[11px] text-[var(--ui-ink-3)] min-[1800px]:inline">
          12 pt
        </span>
      </div>}

      {/* Action Tools */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={copyAll}
          aria-label="คัดลอกทั้งหมด" title="คัดลอกทั้งหมด"
          disabled={!documentAvailable}
          className="ui-icon-btn disabled:opacity-40"
        >
          {copied ? <Check className="ui-copied w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>

        <button type="button" onClick={onDownloadDocx} disabled={!documentAvailable || exporting}
          aria-label="ดาวน์โหลด DOCX" title="ดาวน์โหลดฉบับปัจจุบันเป็น DOCX"
          className="ui-icon-btn disabled:opacity-40">
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onExportDrive}
          aria-label="ส่งออกเข้า Google Drive" aria-busy={exporting}
          disabled={!documentAvailable || !exportAvailable || exporting}
          title={exportAvailable ? "สร้างเอกสารใน Google Drive" : "เชื่อมต่อ Google Drive และตรวจสอบโฟลเดอร์ปลายทางก่อนส่งออก"}
          className="ui-btn ml-1 bg-[var(--ui-teal)] text-white hover:bg-[#005a63] disabled:opacity-50"
        >
          <FolderOutput className={`w-4 h-4 ${exporting ? "animate-pulse" : ""}`} />
          <span aria-hidden="true" className="hidden min-[1800px]:inline">{exporting ? "กำลังส่งออก…" : "ส่งออก"}</span>
          <span className="sr-only">{exporting ? "กำลังส่งออก…" : "ส่งออกเข้า Google Drive"}</span>
        </button>
        {!exportAvailable && <span title="เชื่อมต่อ Google Drive ก่อนส่งออก" className="sr-only">เชื่อมต่อ Google Drive ก่อนส่งออก</span>}
      </div>
    </div>
  );
};
