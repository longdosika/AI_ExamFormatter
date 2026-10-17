"use client";
import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Lock, LogOut } from "lucide-react";

export interface DriveStatus {
  configured: boolean;
  connected: boolean;
  folderReady: boolean;
  folderId: string;
  missingFields?: string[];
  error?: string;
}
interface PickerView { setIncludeFolders(value: boolean): PickerView; setSelectFolderEnabled(value: boolean): PickerView; setMimeTypes(value: string): PickerView }
interface PickerBuilder { addView(view: PickerView): PickerBuilder; setOAuthToken(value: string): PickerBuilder; setDeveloperKey(value: string): PickerBuilder; setAppId(value: string): PickerBuilder; setOrigin(value: string): PickerBuilder; setCallback(callback: (data: {action: string; docs?: {id: string}[]}) => void): PickerBuilder; build(): {setVisible(value: boolean): void} }
interface PickerApi { DocsView: new () => PickerView; PickerBuilder: new () => PickerBuilder; Action: {PICKED: string} }
type PickerWindow = Window & {gapi?: {load(name: string, options: {callback: () => void; onerror: () => void; timeout: number; ontimeout: () => void}): void}; google?: {picker: PickerApi}};
let pickerLoader: Promise<PickerApi> | undefined;
function loadPicker(): Promise<PickerApi> {
  if (pickerLoader) return pickerLoader;
  pickerLoader = new Promise<PickerApi>((resolve, reject) => {
    const target = window as PickerWindow;
    const failed = () => reject(new Error("โหลดตัวเลือกโฟลเดอร์ไม่สำเร็จ กรุณาลองใหม่"));
    const initialize = () => target.gapi?.load("picker", { callback: () => target.google?.picker ? resolve(target.google.picker) : failed(), onerror: failed, timeout: 15000, ontimeout: failed });
    if (target.gapi) { initialize(); return; }
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js"; script.async = true;
    script.onload = initialize; script.onerror = failed;
    document.head.appendChild(script);
  }).catch((error: unknown) => { pickerLoader = undefined; throw error; });
  return pickerLoader;
}

export function GoogleDriveStatus({ onReady, onStatus, active = true, variant = "card" }: {onReady: (ready: boolean) => void; onStatus?: (status: DriveStatus | null) => void; active?: boolean; variant?: "card" | "compact"}) {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/google/session", { cache: "no-store", signal });
    if (!response.ok) throw new Error("ตรวจสถานะ Google ไม่สำเร็จ");
    const value: DriveStatus = await response.json();
    setStatus(value); onStatus?.(value); onReady(value.connected && value.folderReady);
  }, [onReady, onStatus]);
  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch(error => { if (!controller.signal.aborted) { setMessage(error.message); onStatus?.({ configured: false, connected: false, folderReady: false, folderId: "", error: error.message }); onReady(false); } });
    const query = new URLSearchParams(window.location.search);
    if (query.get("google") === "failed") {
      const reasons: Record<string,string> = {
        missing_state: "ไม่พบรอบเชื่อมต่อเดิม กรุณากดเชื่อมบัญชี Google ใหม่จากหน้านี้ และใช้หน้าต่างเบราว์เซอร์เดียวกัน",
        expired: "รอบเชื่อมต่อหมดอายุ กรุณากดเชื่อมบัญชี Google ใหม่",
        invalid_state: "รอบเชื่อมต่อไม่ตรงกัน กรุณากดเชื่อมบัญชี Google ใหม่จากหน้านี้",
        cancelled: "ยกเลิกการเชื่อม Google แล้ว กดเชื่อมบัญชี Google เมื่อต้องการลองใหม่",
        missing_scope: "ยังไม่ได้รับสิทธิ์ Google Drive กรุณาเชื่อมใหม่และอนุญาตสิทธิ์ที่ขอ",
        exchange_failed: "ยืนยันกับ Google ไม่สำเร็จ กรุณาเริ่มเชื่อมใหม่ หากยังเกิดซ้ำให้ตรวจ redirect URI และการตั้งค่า OAuth",
      };
      setMessage(reasons[query.get("reason") || ""] || "เชื่อม Google ไม่สำเร็จ กรุณาลองใหม่");
    }
    return () => controller.abort();
  }, [refresh, onReady, onStatus, active]);
  const selectFolder = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/google/session", {method: "POST"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "กรุณาเชื่อม Google ใหม่");
      const picker = await loadPicker();
      const view = new picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(true).setMimeTypes("application/vnd.google-apps.folder");
      new picker.PickerBuilder().addView(view).setOAuthToken(data.token).setDeveloperKey(data.apiKey).setAppId(data.projectNumber).setOrigin(window.location.origin).setCallback(result => {
        if (result.action === picker.Action.PICKED) {
          if (result.docs?.[0]?.id !== data.folderId) setMessage("กรุณาเลือกโฟลเดอร์ AI_ExamFormatter ตามที่กำหนด");
          else refresh().catch(() => setMessage("ยังยืนยันสิทธิ์โฟลเดอร์ไม่ได้ กรุณาลองใหม่"));
        }
      }).build().setVisible(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : "เลือกโฟลเดอร์ไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  const disconnect = async () => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/google/session", { method: "DELETE" });
      if (!response.ok) throw new Error("ออกจากการเชื่อมต่อไม่สำเร็จ");
      await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "ออกจากการเชื่อมต่อไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  // T-128: compact header form on the import screen (replaces the tagline); the full card stays in the document dialog.
  if (variant === "compact") {
    const state = !status ? "checking" : !status.configured ? "error" : !status.connected ? "connect" : status.folderReady ? "ready" : "folder";
    const label = !status ? "กำลังตรวจ Google…" : !status.configured ? "Google ยังไม่ได้ตั้งค่า" : !status.connected ? "เชื่อม Google Drive" : status.folderReady ? "Drive · AI_ExamFormatter" : "เลือกโฟลเดอร์ AI_ExamFormatter";
    const detail = !status ? "" : !status.configured ? (status.missingFields?.length ? `ขาด: ${status.missingFields.join(", ")}` : status.error || "รอตั้งค่าการเชื่อมต่อ")
      : status.folderReady ? "ส่งออกและเก็บไฟล์ไปที่โฟลเดอร์ AI_ExamFormatter (ต้นฉบับและไฟล์ส่งออกอยู่ที่เดียวกัน)" : "";
    return <div role="group" aria-label="การเชื่อมต่อ Google Drive" className="drive-chip" data-state={state} title={detail || undefined}>
      {/* T-130: the chip is the action itself: lock + connect -> choose folder -> ready (no second button beside a status text). */}
      {state === "connect" ? <a href="/api/google/auth" className="drive-chip-main" aria-label="เชื่อมบัญชี Google"><Lock aria-hidden="true" className="h-3.5 w-3.5" /><span className="drive-chip-label">{label}</span></a>
        : state === "folder" ? <button type="button" disabled={busy} onClick={selectFolder} className="drive-chip-main"><FolderOpen aria-hidden="true" className="h-3.5 w-3.5" /><span className="drive-chip-label">{label}</span></button>
        : <><span aria-hidden="true" className="drive-chip-dot" /><span role="status" className="drive-chip-label">{label}</span></>}
      {status?.connected && <button type="button" disabled={busy} onClick={disconnect} className="drive-chip-quiet" aria-label="ออกจากการเชื่อมต่อ Google" title="ออกจากการเชื่อมต่อ Google"><LogOut aria-hidden="true" className="h-3.5 w-3.5" /></button>}
      {message && <span role="alert" className="drive-chip-error">{message}</span>}
    </div>;
  }
  return <section aria-label="การเชื่อมต่อ Google Drive" className="my-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--ui-line)] bg-white px-4 py-3 text-[13px] text-[var(--ui-ink-2)]">
    <span role="status">
      {!status
        ? "กำลังตรวจการเชื่อมต่อ Google…"
        : !status.configured
        ? status.missingFields && status.missingFields.length > 0
          ? `ยังส่งออก Google Docs ไม่ได้ · ขาด: ${status.missingFields.join(", ")}`
          : status.error
          ? `ยังส่งออก Google Docs ไม่ได้ · ${status.error}`
          : "ยังส่งออก Google Docs ไม่ได้ · รอตั้งค่าการเชื่อมต่อ"
        : !status.connected
        ? "เชื่อม Google ก่อนส่งออก"
        : status.folderReady
        ? "พร้อมส่งออกไป AI_ExamFormatter"
        : "เลือกโฟลเดอร์ AI_ExamFormatter เพื่อให้สิทธิ์ส่งออก"}
    </span>
    {status?.configured && !status.connected && <a href="/api/google/auth" className="ui-btn bg-[var(--ui-teal)] text-white hover:bg-[#005a63]">เชื่อมบัญชี Google</a>}
    {status?.connected && !status.folderReady && <button type="button" disabled={busy} onClick={selectFolder} className="ui-btn bg-[var(--ui-teal)] text-white hover:bg-[#005a63] disabled:opacity-50">เลือกโฟลเดอร์</button>}
    {status?.connected && <button type="button" disabled={busy} onClick={disconnect} className="ui-btn ui-btn-quiet">ออกจากการเชื่อมต่อ</button>}
    {message && <span role="alert" className="text-red-700">{message}</span>}
  </section>;
}
