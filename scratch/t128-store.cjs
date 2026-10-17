const fs=require('fs');const f='lib/document-draft-store.ts';let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,60));s=s.replace(a,()=>b);};
rep(`  diagramsHarvested?: boolean;
  itemCount: number;`,`  diagramsHarvested?: boolean;
  /** T-128: last successful export (DOCX download or Google Docs). */
  exportedAt?: string;
  itemCount: number;`);
rep(`    diagramsHarvested: Boolean(input.diagramsHarvested),`,`    // T-128: saves that do not mention a step keep what the draft already reached.
    diagramsHarvested: input.diagramsHarvested ?? existing.find(entry => entry.docKey === docKey)?.diagramsHarvested ?? false,
    exportedAt: input.exportedAt ?? existing.find(entry => entry.docKey === docKey)?.exportedAt,`);
s=s.trimEnd()+`

/**
 * T-128: every earlier draft of this source, newest first. The SHA-256 of the file decides first, so a renamed copy
 * of a file imported before is still recognised; the old name/size key covers drafts saved without a hash.
 */
export function draftsForSource(storage: StoragePort, fileName: string, fileBytes: number, sourceHash?: string | null): DocumentDraft[] {
  const key = makeDocKey(fileName, fileBytes, sourceHash);
  return loadAllDrafts(storage)
    .filter(draft => (sourceHash && draft.sourceHash === sourceHash) || draft.docKey === key)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** T-128: record an export on the draft of this source without touching its snapshot. */
export function markDraftExported(storage: StoragePort, sourceHash: string | null | undefined, fileName: string, fileBytes: number, at = new Date().toISOString()) {
  const drafts = loadAllDrafts(storage);
  const key = makeDocKey(fileName, fileBytes, sourceHash);
  let changed = false;
  for (const draft of drafts) if ((sourceHash && draft.sourceHash === sourceHash) || draft.docKey === key) { draft.exportedAt = at; changed = true; }
  if (changed) storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  return changed;
}

export interface DraftProgress { converted: boolean; figures: boolean; answered: number; total: number; exportedAt?: string }

/** T-128: how far a draft got: converted, figures captured, answers n/N (from the saved editor), exported. */
export function draftProgress(draft: DocumentDraft): DraftProgress {
  const total = draft.itemCount || draft.formattedItems?.length || 0;
  let answered = 0;
  if (draft.editorHtml) {
    for (const part of draft.editorHtml.split(/data-item-id="/).slice(1)) {
      if (!/data-merged-away="true"/.test(part.slice(0, 200)) && /data-answer-origin="(?:source_provided|auto_solved|manual)"/.test(part)) answered++;
    }
  } else answered = (draft.formattedItems || []).filter(item => item.choices.some(choice => choice.isCorrect)).length;
  return { converted: total > 0, figures: Boolean(draft.diagramsHarvested), answered: Math.min(answered, total || answered), total, exportedAt: draft.exportedAt };
}
`;
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('ok');
