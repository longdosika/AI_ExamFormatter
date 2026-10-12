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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      e.target.value = ""; // Clear input value so selecting the same file triggers cleanly
      processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
          isDragging
            ? "border-[#496053] bg-[#eae8e1]/80"
            : errorMessage
            ? "border-red-300 bg-red-50/20"
            : "border-[#dedad0] hover:border-[#b3996a] bg-[#f7f6f2] hover:bg-[#eae8e1]/50"
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
          <div className="w-12 h-12 rounded-full bg-[#eae8e1] text-[#496053] border border-[#dedad0] flex items-center justify-center mx-auto shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#28332d]">
              {isDragging ? "ปล่อยไฟล์ที่นี่เพื่ออัปโหลด" : "ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกไฟล์"}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              รองรับ: .docx, .pdf, .png, .jpg, .md, .html (สูงสุด 50MB)
            </p>
          </div>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div role="status" className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-800">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="flex-1 min-w-0 break-words">กำลังอ่านไฟล์ {currentFile?.name}…</span>
          <button type="button" onClick={cancelImport} className="underline shrink-0">ยกเลิกการอ่าน</button>
        </div>
      )}

      {/* Error state */}
      {errorMessage && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
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
