"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, FileUp, RefreshCw, Search, X } from "lucide-react";
import { LibraryFile, libraryLink, libraryRequest, saveLibrarySource } from "@/lib/document-library-client";
import type { DocumentDraft } from "@/lib/document-draft-store";

interface Props {
  onClose: () => void;
  onSaveCurrent?: () => Promise<void>;
  pendingCount: number;
  onRetry: () => Promise<void>;
  onRestoreDraft?: (draft:DocumentDraft,collectionId:string)=>Promise<void>;
}

export function DocumentLibrary({ onClose, onSaveCurrent, pendingCount, onRetry, onRestoreDraft }: Props) {
  const [groups, setGroups] = useState<LibraryFile[]>([]);
  const [detail, setDetail] = useState<{ collection: LibraryFile; files: LibraryFile[] } | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState<{ file: LibraryFile; operation: string } | null>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState("");
  const close = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const refresh = async () => { const result = await libraryRequest(); setGroups(result.collections); };
  const run = async (work: () => Promise<void>) => {
    setBusy(true); setError(""); setNotice("");
    try { await work(); } catch (cause) { setError(cause instanceof Error ? cause.message : "ทำรายการไม่สำเร็จ"); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    close.current?.focus();
    void run(refresh);
    return () => trigger?.focus();
    // Load once per modal opening; user controls subsequent refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const openGroup = async (group: LibraryFile) => {
    setDetail(await libraryRequest(`?collection=${encodeURIComponent(group.id)}`)); setConfirm(null);
  };
  const upload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) throw new Error("ต้นฉบับใหญ่เกิน 50 MB");
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), byte => byte.toString(16).padStart(2, "0")).join("");
    const result = await saveLibrarySource({ fileName: file.name, sourceBlob: file, sourceHash: hash });
    await refresh(); await openGroup(result.collection); setNotice("บันทึกต้นฉบับและตรวจ hash แล้ว");
  };
  const link = (file: LibraryFile, label: string) => {
    const href = libraryLink(file);
    return href ? <a className="ui-icon-btn" title={label} aria-label={label} href={href} target="_blank" rel="noreferrer"><ExternalLink size={16} /></a> : <span className="text-xs">ไม่มีลิงก์จาก Drive</span>;
  };
  const files = detail?.files || [];
  const rows = (role: string) => files.filter(file => file.properties.aefRole === role).sort((a, b) => (b.createdTime || "").localeCompare(a.createdTime || ""));
  return <div className="library-backdrop">
    <section role="dialog" aria-modal="true" aria-labelledby="library-title" className="library-dialog" aria-busy={busy} onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not([type="file"]), textarea')).filter(element => element.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <header className="library-head"><h2 id="library-title">คลังไฟล์บน Drive</h2><div className="flex gap-2">
        <button className="ui-icon-btn" aria-label="รีเฟรชคลัง" title="รีเฟรชคลัง" disabled={busy} onClick={() => void run(async () => { await refresh(); if (detail) await openGroup(detail.collection); })}><RefreshCw size={16} /></button>
        <button ref={close} className="ui-icon-btn" aria-label="ปิดคลังไฟล์" title="ปิดคลังไฟล์" onClick={onClose}><X size={16} /></button>
      </div></header>
      <div className="library-actions">
        <button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => picker.current?.click()}><FileUp size={16} />เพิ่มต้นฉบับ</button>
        <input ref={picker} type="file" aria-label="ไฟล์ต้นฉบับเข้าคลัง" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.md,.html" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void run(() => upload(file)); }} />
        {onSaveCurrent && <button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => void run(async () => { await onSaveCurrent(); await refresh(); setNotice("เก็บต้นฉบับที่เปิดอยู่แล้ว"); })}>เก็บต้นฉบับที่เปิดอยู่</button>}
        {pendingCount > 0 && <button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => void run(async () => { await onRetry(); await refresh(); setNotice("ส่ง output ที่ค้างแล้ว"); })}><RefreshCw size={16} />ส่ง output ที่ค้าง ({pendingCount})</button>}
      </div>
      {error && <p role="alert" className="library-error">{error}</p>}
      <p role="status" className="library-status">{busy ? "กำลังตรวจและบันทึก…" : notice}</p>
      <div className="library-body">
        {!detail ? <>
          <label className="library-search"><Search size={16} /><input aria-label="ค้นหาชุดเอกสาร" placeholder="ค้นหาชุดเอกสาร" value={query} onChange={event => setQuery(event.target.value)} /></label>
          <ul className="library-list">{groups.filter(group => group.name.toLowerCase().includes(query.toLowerCase())).map(group => <li key={group.id}>
            <button className="library-group" disabled={busy} onClick={() => void run(() => openGroup(group))}><strong>{group.name}</strong><small>SHA-256 {group.properties.aefHash?.slice(0, 12)}</small></button>{link(group, `เปิดชุด ${group.name} บน Drive`)}
          </li>)}</ul>
          {!busy && !groups.length && <p className="text-sm">ยังไม่มีชุดเอกสารในคลัง</p>}
        </> : <>
          <button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => { setDetail(null); setConfirm(null); }}><ArrowLeft size={16} />ชุดเอกสารทั้งหมด</button>
          <h3 className="library-title">{detail.collection.name}</h3>
          <p className="library-hash">SHA-256 {detail.collection.properties.aefHash}</p>
          <h4>ต้นฉบับ</h4><ul className="library-list">{rows("source").map(file => <li key={file.id}><span className="library-file">{file.name}<small>{Number(file.size || 0).toLocaleString()} bytes</small></span>{link(file, `เปิดต้นฉบับ ${file.name}`)}</li>)}</ul>
          <h4>Output แต่ละเวอร์ชัน</h4><ul className="library-list">{rows("output").map(file => <li key={file.id} className="library-output">
            <span className="library-file">{file.name}<small>Build {file.properties.aefBuild} · {file.createdTime ? new Date(file.createdTime).toLocaleString("th-TH") : ""}</small></span>
            <div className="flex flex-wrap items-center gap-2">{link(file, `เปิด output ${file.name}`)}{files.filter(view => view.properties.aefRole === "view" && view.properties.aefOutputId === file.id).map(view => <React.Fragment key={view.id}>{link(view, `เปิด Google Doc ${view.name}`)}</React.Fragment>)}
              <button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => { setConfirm({ file, operation: crypto.randomUUID() }); setChecked(false); setNote(""); }}>บันทึกว่านำเข้า QuizFlow แล้ว</button>
            </div>
          </li>)}</ul>
          <h4>แบบร่างทำต่อ</h4><ul className="library-list">{rows("draft").map(file=><li key={file.id}><span className="library-file">{file.name}<small>Build {file.properties.aefBuild}</small></span>{onRestoreDraft&&<button className="ui-btn ui-btn-quiet" disabled={busy} onClick={()=>void run(async()=>{const result=await libraryRequest(`?collection=${encodeURIComponent(detail.collection.id)}&draft=${encodeURIComponent(file.id)}`);await onRestoreDraft(result.draft,detail.collection.id);})}>เปิดทำต่อ</button>}</li>)}</ul>
          {confirm && <div className="library-confirm">
            <strong>{confirm.file.name}</strong>
            <label className="flex items-start gap-2"><input type="checkbox" checked={checked} onChange={event => setChecked(event.target.checked)} />ฉันนำไฟล์เวอร์ชันนี้เข้า QuizFlow สำเร็จแล้ว</label>
            <label>หมายเหตุ<textarea aria-label="หมายเหตุการนำเข้า QuizFlow" maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>
            <div className="flex gap-2"><button className="ui-btn ui-btn-quiet" disabled={busy || !checked} onClick={() => void run(async () => {
              await libraryRequest("", { method: "POST", headers: { "X-Library-Action": "import", "Content-Type": "application/json" }, body: JSON.stringify({ collectionId: detail.collection.id, outputId: confirm.file.id, operation: confirm.operation, confirmed: checked, note }) });
              await openGroup(detail.collection); setNotice("บันทึกสำเนาเวอร์ชันที่ผู้ใช้ยืนยันแล้ว");
            })}><Check size={16} />ยืนยันและเก็บสำเนา</button><button className="ui-btn ui-btn-quiet" disabled={busy} onClick={() => setConfirm(null)}>ยกเลิก</button></div>
          </div>}
          <h4>นำเข้า QuizFlow แล้ว · ผู้ใช้ยืนยัน</h4><ul className="library-list">{rows("quizflow-import").map(file => <li key={file.id}><span className="library-file">{file.name}<small>{file.properties.aefImportedAt} · Output {file.properties.aefOutputId}</small></span>{link(file, `เปิดสำเนานำเข้า ${file.name}`)}</li>)}</ul>
        </>}
      </div>
    </section>
  </div>;
}
