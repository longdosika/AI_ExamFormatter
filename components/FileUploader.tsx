"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { parseUploadedFile, ParsedFileResult, revokeParsedFileUrls, validateFile, SUPPORTED_EXTENSIONS } from "@/lib/file-parser";

interface FileUploaderProps {
  onFileParsed: (result: ParsedFileResult) => boolean | Promise<boolean>;
  onError: (errorMessage: string) => void;
  onStart?: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileParsed, onError, onStart }) => {
  const [isDragging, setIsDragging] = useState(false);
  // T-111: bumps on every accepted drop/selection so the icon replays a short "received" motion.
  const [received, setReceived] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParsedFileResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeImport = useRef<AbortController | null>(null);
  useEffect(() => () => activeImport.current?.abort(), []);

  const cancelImport = () => {
    activeImport.current?.abort();
    activeImport.current = null;
    setLoading(false);
    setCurrentFile(null);
  };

  const processFile = async (file: File) => {
    activeImport.current?.abort();
    const controller = new AbortController();
    activeImport.current = controller;
    onStart?.();
    setErrorMessage(null);
    setParseResult(null);
    setCurrentFile(file);
    setLoading(false);

    const validation = validateFile(file);
    if (!validation.valid) {
      const err = validation.error || "ไฟล์ไม่ถูกต้อง";
      setErrorMessage(err);
      onError(err);
      return;
    }

    try {
      setLoading(true);
      const result = await parseUploadedFile(file, { signal: controller.signal });
      result.sourceBlob = file;
      result.originalText = result.rawContent;
      if (globalThis.crypto?.subtle) {
        const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
        result.sourceHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
      }
      if (controller.signal.aborted || activeImport.current !== controller) {
        revokeParsedFileUrls(result);
        return;
      }
      const accepted = await Promise.resolve(onFileParsed(result));
      if (accepted) setParseResult(result);
    } catch (err: unknown) {
      if (controller.signal.aborted || activeImport.current !== controller) return;
      const msg = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอ่านไฟล์";
      setErrorMessage(msg);
      onError(msg);
    } finally {
      if (activeImport.current === controller) {
        activeImport.current = null;
        setLoading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setReceived(count => count + 1);
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = ""; // Clear input value so selecting the same file triggers cleanly
      setReceived(count => count + 1);
      processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group border-[1.5px] border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer transition-[border-color,background-color,transform] duration-200 ${
          isDragging
            ? "border-[var(--ui-olive)] bg-[#eef2ee] scale-[1.01]"
            : errorMessage
            ? "border-[#e2a99f] bg-[#fdf4f2]"
            : "border-[var(--ui-line-strong)] hover:border-[var(--ui-sand)] bg-[var(--ui-sunken)] hover:bg-[#f1eee6]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-upload-input"
          className="hidden"
          accept={SUPPORTED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
        />
        <button type="button" onClick={() => inputRef.current?.click()} className="w-full space-y-3 block rounded-lg" aria-label="เลือกไฟล์ข้อสอบ">
          <div key={received} className={`${received ? "ui-file-received " : ""}w-14 h-14 rounded-2xl bg-white text-[var(--ui-olive)] border border-[var(--ui-line)] flex items-center justify-center mx-auto transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transform-none ${isDragging ? "-translate-y-1" : ""}`}>
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--ui-ink)]">
              {isDragging ? "ปล่อยไฟล์ที่นี่เพื่ออัปโหลด" : "ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์"}
            </p>
            <p className="text-[13px] text-[var(--ui-ink-3)] mt-1">
              รองรับ: .docx, .pdf, .png, .jpg, .md, .html (สูงสุด 50MB)
            </p>
          </div>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div role="status" className="ui-status-in p-3 bg-white border border-[var(--ui-line)] rounded-xl flex items-center gap-3 text-[13px] text-[var(--ui-ink)]">
          <div className="w-4 h-4 border-2 border-[var(--ui-olive)] border-t-transparent rounded-full animate-spin"></div>
          <span className="flex-1 min-w-0 break-words">กำลังอ่านไฟล์ {currentFile?.name}…</span>
          <button type="button" onClick={cancelImport} className="ui-btn ui-btn-quiet h-7">ยกเลิกการอ่าน</button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div role="alert" className="ui-status-in p-3 bg-[#fdf4f2] border border-[#efc9c1] rounded-xl flex items-center gap-2 text-[13px] text-[#8a2f22]">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#c4503d]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Parsed File Details */}
      {parseResult && !loading && (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-emerald-900 font-medium">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {parseResult.fileName}
            </span>
            <span className="text-emerald-700 font-mono">
              {(parseResult.fileSize / 1024).toFixed(1)} KB
            </span>
          </div>
          <p className="text-emerald-800">{parseResult.statusMessage}</p>
          {parseResult.extractedImages.length > 0 && (
            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-700">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>พบรูปภาพฝังในเอกสาร {parseResult.extractedImages.length} รูป</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
