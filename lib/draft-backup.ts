import { validateDraftEntry, type DocumentDraft } from "./document-draft-store";

export function readDraftBackup(value: unknown): DocumentDraft {
  if (!value || typeof value !== "object") throw new Error("รูปแบบสำรองแบบร่างไม่ถูกต้อง");
  const envelope=value as {schemaVersion?:unknown;kind?:unknown;draft?:unknown};
  if(envelope.schemaVersion!==1 || envelope.kind!=="exam-formatter-draft" || !validateDraftEntry(envelope.draft)) throw new Error("ไฟล์นี้ไม่ใช่แบบร่างที่รองรับ");
  const draft=envelope.draft;
  if(!draft.sourceHash || !/^[a-f0-9]{64}$/.test(draft.sourceHash) || typeof draft.ocrText!=="string" || (draft.editorHtml!==undefined && typeof draft.editorHtml!=="string")) throw new Error("แบบร่างไม่มีข้อมูลต้นฉบับที่ยืนยันได้");
  if(draft.formattedItems!==undefined && (!Array.isArray(draft.formattedItems) || draft.formattedItems.length>1000 || draft.formattedItems.some(item=>!item || !Number.isSafeInteger(item.id) || !Number.isSafeInteger(item.questionNumber) || typeof item.questionText!=="string" || !Array.isArray(item.choices) || item.choices.some(choice=>!choice || typeof choice.key!=="string" || typeof choice.text!=="string")))) throw new Error("โครงสร้างข้อสอบในแบบร่างไม่ถูกต้อง");
  return draft;
}

export function draftBackup(draft: DocumentDraft) {
  const envelope={schemaVersion:1,kind:"exam-formatter-draft",draft};
  readDraftBackup(envelope);
  return envelope;
}

/** Restored markup remains editable but cannot execute scripts or make remote image/style requests. */
export function sanitizeDraftHtml(html: string): string {
  const doc=new DOMParser().parseFromString(html,"text/html");
  doc.querySelectorAll("script,style,link,meta,iframe,object,embed,form,input,button,svg,math,video,audio,source").forEach(node=>node.remove());
  for(const element of Array.from(doc.body.querySelectorAll<HTMLElement>("*"))) {
    for(const attribute of Array.from(element.attributes)) {
      if(!/^(?:class|style|alt|title|colspan|rowspan|hidden|open|role|aria-[\w-]+|data-[\w-]+|src)$/i.test(attribute.name)) element.removeAttribute(attribute.name);
    }
    if(element.hasAttribute("src") && (element.tagName!=="IMG" || !/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(element.getAttribute("src")||""))) element.removeAttribute("src");
    const style=element.getAttribute("style")||"";element.removeAttribute("style");
    if(!/url\s*\(|expression\s*\(|@import|javascript:/i.test(style)) {
      const safe=new Option().style;safe.cssText=style;
      for(const property of ["color","background-color","font-weight","font-style","text-decoration","font-size","width","height","max-width","max-height","margin-left","padding-left","border-left","display","white-space"]) if(safe.getPropertyValue(property)) element.style.setProperty(property,safe.getPropertyValue(property));
    }
  }
  return doc.body.innerHTML;
}
