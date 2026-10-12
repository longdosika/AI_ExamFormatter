"use client";

import React from "react";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Image as ImageIcon, 
  Copy, 
  FolderOutput
} from "lucide-react";

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onInsertImage: () => void;
  onCopyAll: () => void;
  onExportDrive: () => void;
  exportAvailable?: boolean;
  exporting?: boolean;
  editingAvailable?: boolean;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onFormat,
  onInsertImage,
  onCopyAll,
  onExportDrive,
  exportAvailable = false,
  exporting = false,
  editingAvailable = true,
}) => {
  return (
    <div className="px-0 py-0 flex items-center justify-between gap-2 flex-wrap text-xs ">
      {/* Formatting Tools */}
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="จัดรูปแบบข้อความ">
        <button
          type="button"
          onClick={() => onFormat("bold")}
          disabled={!editingAvailable}
          title="ตัวหนา (Ctrl+B)"
          aria-label="ตัวหนา"
          onMouseDown={(event) => event.preventDefault()}
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold transition"
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
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 italic transition"
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
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 underline transition"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={onInsertImage}
          disabled={!editingAvailable}
          title="แทรกรูปภาพ"
          aria-label="แทรกรูป"
          className="flex items-center gap-1 p-1.5 hover:bg-slate-200 rounded text-slate-700 font-medium transition"
        >
          <ImageIcon className="w-4 h-4 text-[#F2604D]" />
          
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
          12 pt
        </span>
      </div>

      {/* Action Tools */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCopyAll}
          aria-label="คัดลอกทั้งหมด" title="คัดลอกทั้งหมด"
          disabled={!editingAvailable}
          className="flex items-center gap-1.5 p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-medium shadow-2xs transition"
        >
          <Copy className="w-3.5 h-3.5 text-slate-600" />
          
        </button>

        <button
          type="button"
          onClick={onExportDrive}
          aria-label="ส่งออกเข้า Google Drive" aria-busy={exporting}
          disabled={!exportAvailable || exporting}
          title={exportAvailable ? "สร้างเอกสารใน Google Drive" : "เชื่อมต่อ Google Drive และตรวจสอบโฟลเดอร์ปลายทางก่อนส่งออก"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#006D77] hover:bg-[#005a63] text-white rounded-lg font-medium shadow-2xs transition"
        >
          <FolderOutput className="w-3.5 h-3.5 text-emerald-300" />
          <span className="sr-only">{exporting ? "กำลังส่งออก…" : "ส่งออกเข้า Google Drive"}</span>
        </button>
        {!exportAvailable && <span title="เชื่อมต่อ Google Drive ก่อนส่งออก" className="sr-only">เชื่อมต่อ Google Drive ก่อนส่งออก</span>}
      </div>
    </div>
  );
};
