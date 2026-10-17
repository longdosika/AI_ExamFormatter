const fs = require('fs');
const f = 'app/page.tsx';
let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 70)); s = s.replace(a, () => b); };
s = s.replace(/  findDraftByDoc,[ \t]*\n/, () => "  findDraftByDoc,\n  draftsForSource,\n  markDraftExported,\n");
rep(`import { DocumentLibrary } from "@/components/DocumentLibrary";`, `import { DocumentLibrary } from "@/components/DocumentLibrary";
import { DraftProgress } from "@/components/DraftProgress";`);
rep(`  const [availableDraft, setAvailableDraft] = useState<DocumentDraft | null>(null);`, `  const [availableDraft, setAvailableDraft] = useState<DocumentDraft | null>(null);
  // T-128: a file imported before (same SHA-256, any name) asks before any OCR/AI work.
  type DuplicateChoice = "new" | "resume" | "library" | "cancel";
  const [duplicatePrompt, setDuplicatePrompt] = useState<{ fileName: string; drafts: DocumentDraft[]; driveName: string | null } | null>(null);
  const duplicateResolver = useRef<((choice: DuplicateChoice) => void) | null>(null);
  const answerDuplicate = (choice: DuplicateChoice) => { const resolve = duplicateResolver.current; duplicateResolver.current = null; setDuplicatePrompt(null); resolve?.(choice); };`);
rep(`  const handleFileParsed = async (result: ParsedFileResult) => {
    sourceItemCount.current = undefined;`, `  const handleFileParsed = async (result: ParsedFileResult) => {
    // T-128: warn before importing a file that was imported before, recognised by its bytes (renamed copies too).
    const previousDrafts = draftsForSource(window.localStorage, result.fileName, result.fileSize, result.sourceHash);
    let driveName: string | null = null;
    if (result.sourceHash && driveReady) {
      try {
        const response = await fetch(\`/api/google/library?hash=\${result.sourceHash}\`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
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
    sourceItemCount.current = undefined;`);
// Mark exports on the draft.
rep(`      setExportLink(result.url);
    } finally {
      setExportPhase(null);
    }`, `      setExportLink(result.url);
      try { markDraftExported(window.localStorage, parsedFile.sourceHash, parsedFile.fileName, parsedFile.fileSize); } catch {}
    } finally {
      setExportPhase(null);
    }`);
rep(`    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);`, `    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    try { markDraftExported(window.localStorage, parsedFile.sourceHash, parsedFile.fileName, parsedFile.fileSize); } catch {}`);
// Four latest drafts with progress on the landing page.
rep(`.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3));`, `.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 4));`);
rep(`                        <div className="text-[11px] text-[var(--ui-ink-3)]">{draft.itemCount ? \`\${draft.itemCount} ข้อ\` : "ข้อความ OCR"}, {new Date(draft.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</div>`, `                        <div className="text-[11px] text-[var(--ui-ink-3)]">{draft.itemCount ? \`\${draft.itemCount} ข้อ\` : "ข้อความ OCR"}, {new Date(draft.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</div>
                        <DraftProgress draft={draft} />`);
// Progress in the drafts modal.
rep(`                        {draft.diagramsHarvested && (
                          <span className="bg-[#eef5f2] text-[#496053] px-1.5 py-0.2 rounded text-[10px] border border-[#496053]/25">
                            สกัดรูปแล้ว
                          </span>
                        )}
                      </div>`, `                      </div>
                      <DraftProgress draft={draft} />`);
// The dialog itself, rendered next to the library modal.
rep(`      {showLibrary && <DocumentLibrary`, `      {duplicatePrompt && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 p-4" role="presentation">
          <div role="alertdialog" aria-modal="true" aria-labelledby="duplicate-title" aria-describedby="duplicate-body" className="duplicate-dialog">
            <h2 id="duplicate-title">ไฟล์นี้เคยนำเข้าแล้ว</h2>
            <p id="duplicate-body">
              <strong>{duplicatePrompt.fileName}</strong> มีเนื้อหาตรงกับไฟล์ที่เคยนำเข้า (ตรวจจากเนื้อไฟล์ จึงจับได้แม้เปลี่ยนชื่อ)
              {duplicatePrompt.driveName && <> และมีต้นฉบับในคลัง Drive ชื่อ <strong>{duplicatePrompt.driveName}</strong></>}
            </p>
            {duplicatePrompt.drafts[0] && (
              <div className="duplicate-draft">
                <div><strong>แบบร่างล่าสุด</strong> {duplicatePrompt.drafts[0].fileName} · {new Date(duplicatePrompt.drafts[0].updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}{duplicatePrompt.drafts.length > 1 ? \` · มีแบบร่างของไฟล์นี้ \${duplicatePrompt.drafts.length} ชุด\` : ""}</div>
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
      {showLibrary && <DocumentLibrary`);
fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('ok');
