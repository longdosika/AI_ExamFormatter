import { createHash } from "node:crypto";
import { TARGET_FOLDER } from "./google-export";
import { readDraftBackup } from "./draft-backup";
import { baseName, exportName, exportStamp } from "./export-naming";

const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const APP = "exam-library-v1";
const FIELDS = "id,name,mimeType,parents,properties,webViewLink,createdTime,size,md5Checksum";
export const SOURCE_LIMIT = 50 * 1024 * 1024;
export interface LibraryFile {
  id: string; name: string; mimeType: string; parents?: string[]; properties: Record<string, string>;
  webViewLink?: string; createdTime?: string; size?: string; md5Checksum?: string;
}
type RequestPort = typeof fetch;
const locks = new Map<string, Promise<unknown>>();
async function serial<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) || Promise.resolve();
  const current = previous.catch(() => {}).then(work);
  locks.set(key, current);
  try { return await current; } finally { if (locks.get(key) === current) locks.delete(key); }
}
export const validDriveId = (value: string) => /^[A-Za-z0-9_-]{10,200}$/.test(value);
export const validVersionId = (value: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
const sha = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const md5 = (bytes: Buffer) => createHash("md5").update(bytes).digest("hex");
function safeName(name: string) {
  const result = name.replace(/[\\/\u0000-\u001f]/g, "_").trim();
  if (!result || result.length > 200) throw new Error("ชื่อไฟล์ไม่ถูกต้องหรือยาวเกิน 200 ตัวอักษร");
  return result;
}

export { baseName, exportName, exportStamp };

/**
 * Drive library. T-128 layout: everything lives directly in the AI_ExamFormatter folder, named after the original
 * ("[original filename]" for the source, "[original]_[yymmdd-hhmm].docx" and a Google Doc of the same name for each
 * export, "[original]_แบบร่าง_[stamp].json" for draft backups, "[original]_QuizFlow_[stamp]" for confirmed imports).
 * Files of one document are tied by the SHA-256 property aefHash, so renaming never breaks the link. Collections
 * created before T-128 (one folder per document with numbered sub-folders) stay readable and are never moved.
 */
export function driveLibrary(token: string, request: RequestPort = fetch) {
  const ownerKey = sha(Buffer.from(token));
  const call = async (url: string, init: RequestInit = {}) => {
    const response = await request(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(response.status === 401 ? "การเชื่อมต่อ Google หมดอายุ กรุณาเชื่อมใหม่" : `คลัง Google Drive ทำรายการไม่สำเร็จ (HTTP ${response.status})`);
    return response;
  };
  const metadata = async (id: string): Promise<LibraryFile> => {
    if (!validDriveId(id)) throw new Error("รหัสไฟล์ไม่ถูกต้อง");
    const file = await (await call(`${API}/${id}?${new URLSearchParams({ fields: FIELDS, supportsAllDrives: "true" })}`)).json();
    return { ...file, properties: file.properties || {} };
  };
  const list = async (q: string): Promise<LibraryFile[]> => {
    const files: LibraryFile[] = [];
    let pageToken = "";
    do {
      const result = await (await call(`${API}?${new URLSearchParams({ q: `${q} and trashed = false`, fields: `nextPageToken,files(${FIELDS})`, pageSize: "100", orderBy: "createdTime", supportsAllDrives: "true", includeItemsFromAllDrives: "true", ...(pageToken ? { pageToken } : {}) })}`)).json();
      files.push(...(result.files || []).map((file: LibraryFile) => ({ ...file, properties: file.properties || {} })));
      pageToken = result.nextPageToken || "";
      if (files.length >= 5000 && pageToken) throw new Error("รายการในคลังเกินขีดจำกัด กรุณาแบ่งคลัง");
    } while (pageToken);
    return files;
  };
  const children = (parent: string, role?: string, hash?: string) => list(`'${parent}' in parents and properties has { key='aefApp' and value='${APP}' }${role ? ` and properties has { key='aefRole' and value='${role}' }` : ""}${hash ? ` and properties has { key='aefHash' and value='${hash}' }` : ""}`);
  const privateFolder = async (id: string) => {
    const folder = await (await call(`${API}/${id}?${new URLSearchParams({ fields: "id,mimeType,permissions(type),capabilities(canAddChildren)", supportsAllDrives: "true" })}`)).json();
    if (folder.mimeType !== FOLDER || folder.capabilities?.canAddChildren !== true || !Array.isArray(folder.permissions)) throw new Error("ยังยืนยันสิทธิ์และความเป็นส่วนตัวของโฟลเดอร์ไม่ได้");
    if (folder.permissions.some((permission: { type: string }) => permission.type === "anyone" || permission.type === "domain")) throw new Error("โฟลเดอร์คลังเปิดสิทธิ์สาธารณะหรือทั้งโดเมน กรุณาใช้โฟลเดอร์ส่วนตัวก่อนเก็บต้นฉบับ");
  };
  const createFolder = async (name: string, parent: string, role: string, hash?: string) => {
    const file = await (await call(`${API}?fields=${encodeURIComponent(FIELDS)}&supportsAllDrives=true`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent], properties: { aefApp: APP, aefRole: role, ...(hash ? { aefHash: hash } : {}) } }) })).json();
    const verified = await metadata(file.id);
    if (!verified.parents?.includes(parent) || verified.mimeType !== FOLDER) throw new Error("สร้างโฟลเดอร์แล้ว แต่ยืนยันตำแหน่งไม่ได้ กรุณาตรวจ Drive ก่อนลองใหม่");
    return verified;
  };
  const root = async (create: boolean) => serial(`${ownerKey}:root`, async () => {
    const found = (await children(TARGET_FOLDER, "library"))[0];
    if (found || !create) return found;
    await privateFolder(TARGET_FOLDER);
    return createFolder("คลังชุดเอกสาร", TARGET_FOLDER, "library");
  });
  const isFlat = (group: LibraryFile) => group.mimeType !== FOLDER;
  const flatFiles = async (hash: string) => (await children(TARGET_FOLDER, undefined, hash))
    .filter(file => ["source", "output", "view", "draft", "quizflow-import"].includes(file.properties.aefRole));
  const collection = async (id: string) => {
    const file = await metadata(id);
    // T-128: a flat document is identified by its original file in the AI_ExamFormatter folder.
    if (file.mimeType !== FOLDER && file.properties.aefApp === APP && file.properties.aefRole === "source" && /^[a-f0-9]{64}$/.test(file.properties.aefHash || "") && file.parents?.includes(TARGET_FOLDER)) return file;
    const libraryRoot = await root(false);
    if (!libraryRoot || file.mimeType !== FOLDER || file.properties.aefApp !== APP || file.properties.aefRole !== "collection" || !/^[a-f0-9]{64}$/.test(file.properties.aefHash || "") || !file.parents?.includes(libraryRoot.id)) throw new Error("ไม่พบชุดเอกสารในคลังนี้");
    return file;
  };
  const upload = async (bytes: Buffer, name: string, mimeType: string, parent: string, properties: Record<string, string>) => {
    const response = await call(`${UPLOAD}?uploadType=resumable&fields=id&supportsAllDrives=true`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Upload-Content-Type": mimeType, "X-Upload-Content-Length": String(bytes.length) },
      body: JSON.stringify({ name, mimeType, parents: [parent], properties: { aefApp: APP, ...properties } }),
    });
    const location = new URL(response.headers.get("location") || "");
    if (location.protocol !== "https:" || location.hostname !== "www.googleapis.com" || location.pathname !== "/upload/drive/v3/files") throw new Error("Google คืนปลายทางอัปโหลดที่ไม่ถูกต้อง");
    const created = await (await call(location.href, { method: "PUT", headers: { "Content-Type": mimeType, "Content-Length": String(bytes.length) }, body: new Uint8Array(bytes) })).json();
    const verified = await metadata(created.id);
    if (!verified.parents?.includes(parent) || verified.md5Checksum !== md5(bytes) || Object.entries(properties).some(([key, value]) => verified.properties[key] !== value)) throw new Error("อาจบันทึกไฟล์แล้ว แต่ยังยืนยันเนื้อหาและความสัมพันธ์ไม่ได้ กรุณาตรวจคลังก่อนลองใหม่");
    return verified;
  };
  const details = async (id: string) => {
    const group = await collection(id);
    const sections = isFlat(group) ? [] : await children(group.id);
    const files: LibraryFile[] = [];
    for (const child of sections.filter(file => file.mimeType === FOLDER && ["originals", "outputs", "imports", "drafts"].includes(file.properties.aefRole) && file.properties.aefHash === group.properties.aefHash)) {
      const roles = child.properties.aefRole === "originals" ? ["source"] : child.properties.aefRole === "outputs" ? ["output", "view"] : child.properties.aefRole === "drafts" ? ["draft"] : ["quizflow-import"];
      files.push(...(await children(child.id)).filter(file => roles.includes(file.properties.aefRole) && file.properties.aefHash === group.properties.aefHash));
    }
    // T-128: files written flat into the AI_ExamFormatter folder belong to the same document by hash.
    for (const file of await flatFiles(group.properties.aefHash)) if (!files.some(entry => entry.id === file.id)) files.push(file);
    return { collection: group, files };
  };
  const verifiedChild = async (collectionId: string, fileId: string, role: string) => {
    const group = await collection(collectionId), file = await metadata(fileId);
    const parents = isFlat(group) ? [] : await children(group.id);
    const inLegacyOutputs = parents.some(parent => parent.mimeType === FOLDER && parent.properties.aefRole === "outputs" && parent.properties.aefHash === group.properties.aefHash && file.parents?.includes(parent.id));
    const inFlatFolder = Boolean(file.parents?.includes(TARGET_FOLDER));
    if (file.properties.aefApp !== APP || file.properties.aefRole !== role || file.properties.aefHash !== group.properties.aefHash || !(inLegacyOutputs || inFlatFolder)) throw new Error("ไฟล์ไม่สัมพันธ์กับชุดเอกสารนี้");
    if (role === "output" && (file.mimeType !== DOCX || !/^[a-f0-9]{32}$/.test(file.md5Checksum || "") || file.properties.aefMd5 !== file.md5Checksum || !/^[a-f0-9]{64}$/.test(file.properties.aefSha256 || ""))) throw new Error("ไฟล์ output ถูกแก้ภายนอกหรือไม่ใช่ snapshot ที่ยืนยันแล้ว");
    return { group, file };
  };
  return {
    async listCollections() {
      const libraryRoot = await root(false);
      const legacy = libraryRoot ? await children(libraryRoot.id, "collection") : [];
      const flat = await children(TARGET_FOLDER, "source");
      return { root: libraryRoot || null, collections: [...flat, ...legacy.filter(group => !flat.some(source => source.properties.aefHash === group.properties.aefHash))] };
    },
    /** T-128: has a file with these exact bytes been stored before (flat or legacy)? Used before re-importing. */
    async findByHash(hash: string) {
      if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("SHA-256 ไม่ถูกต้อง");
      const flat = (await children(TARGET_FOLDER, "source", hash))[0];
      if (flat) return { collection: flat };
      const libraryRoot = await root(false);
      const legacy = libraryRoot ? (await children(libraryRoot.id, "collection", hash))[0] : undefined;
      return { collection: legacy || null };
    },
    details,
    async readSource(collectionId:string) {
      const info=await details(collectionId),file=info.files.find(file=>file.properties.aefRole==="source");
      if(!file || !Number.isSafeInteger(Number(file.size)) || Number(file.size)<=0 || Number(file.size)>SOURCE_LIMIT) throw new Error("ต้นฉบับในคลังไม่ถูกต้อง");
      const bytes=Buffer.from(await (await call(`${API}/${file.id}?alt=media`)).arrayBuffer());
      if(bytes.length>SOURCE_LIMIT || sha(bytes)!==info.collection.properties.aefHash || md5(bytes)!==file.md5Checksum) throw new Error("ต้นฉบับใน Drive ไม่ตรง hash เดิม");
      return {source:file,bytes};
    },
    async saveDraft(collectionId:string,bytes:Buffer,version:string,build:string) {
      if(!validVersionId(version) || !bytes.length || bytes.length>8*1024*1024) throw new Error("ไฟล์สำรองแบบร่างใหญ่เกินหรือเวอร์ชันไม่ถูกต้อง");
      const draft=readDraftBackup(JSON.parse(bytes.toString("utf8")));
      return serial(`${ownerKey}:draft:${collectionId}`,async()=>{
        const group=await collection(collectionId);
        if(draft.sourceHash!==group.properties.aefHash) throw new Error("แบบร่างไม่สัมพันธ์กับต้นฉบับชุดนี้");
        const info=await details(collectionId),existing=info.files.find(file=>file.properties.aefRole==="draft"&&file.properties.aefVersion===version);
        if(existing) { if(existing.md5Checksum!==md5(bytes)) throw new Error("แบบร่างเวอร์ชันเดิมมีเนื้อหาต่างกัน");return {draft:existing}; }
        // T-128: draft backups sit next to the original, named after it.
        await privateFolder(TARGET_FOLDER);
        const sourceName=info.files.find(file=>file.properties.aefRole==="source")?.name || group.name;
        return {draft:await upload(bytes,`${baseName(sourceName)}_แบบร่าง_${exportStamp()}.json`,"application/json",TARGET_FOLDER,{aefRole:"draft",aefHash:group.properties.aefHash,aefVersion:version,aefBuild:build.slice(0,30),aefMd5:md5(bytes),aefSha256:sha(bytes)})};
      });
    },
    async readDraft(collectionId:string,id:string) {
      const info=await details(collectionId),file=info.files.find(file=>file.id===id&&file.properties.aefRole==="draft");
      if(!file || file.mimeType!=="application/json" || !Number.isSafeInteger(Number(file.size)) || Number(file.size)<=0 || Number(file.size)>8*1024*1024 || file.md5Checksum!==file.properties.aefMd5) throw new Error("แบบร่างถูกแก้ภายนอกหรือไม่อยู่ในชุดนี้");
      const bytes=Buffer.from(await (await call(`${API}/${file.id}?alt=media`)).arrayBuffer());
      if(bytes.length>8*1024*1024 || md5(bytes)!==file.properties.aefMd5 || sha(bytes)!==file.properties.aefSha256) throw new Error("เนื้อหาแบบร่างไม่ตรง hash ที่บันทึกไว้");
      const draft=readDraftBackup(JSON.parse(bytes.toString("utf8")));
      if(draft.sourceHash!==info.collection.properties.aefHash) throw new Error("แบบร่างไม่สัมพันธ์กับต้นฉบับ");
      return {draft};
    },
    async saveSource(bytes: Buffer, fileName: string, mimeType: string, expectedHash: string) {
      const hash = sha(bytes), name = safeName(fileName);
      if (!bytes.length || bytes.length > SOURCE_LIMIT || hash !== expectedHash) throw new Error("ต้นฉบับมีขนาดหรือ SHA-256 ไม่ตรงกับไฟล์ที่นำเข้า");
      if (!/\.(?:pdf|docx?|png|jpe?g|md|html)$/i.test(name)) throw new Error("ชนิดไฟล์ต้นฉบับไม่รองรับ");
      if (!mimeType || mimeType.startsWith("application/vnd.google-apps.")) throw new Error("ต้นฉบับต้องเก็บเป็นไฟล์เดิม ไม่แปลงเป็น Google Docs");
      return serial(`${ownerKey}:${hash}`, async () => {
        await privateFolder(TARGET_FOLDER);
        // T-128: the same bytes are stored once, whatever the file is called now (flat or a pre-T-128 collection).
        let source = (await children(TARGET_FOLDER, "source", hash))[0];
        if (!source) {
          const libraryRoot = await root(false);
          const legacy = libraryRoot ? (await children(libraryRoot.id, "collection", hash))[0] : undefined;
          const legacySource = legacy && (await details(legacy.id)).files.find(file => file.properties.aefRole === "source");
          if (legacy && legacySource) {
            if (legacySource.md5Checksum !== md5(bytes)) throw new Error("ต้นฉบับในคลังถูกแก้ไขหรือยืนยันไม่ได้ ไม่เขียนทับไฟล์เดิม");
            return { collection: legacy, source: legacySource };
          }
        }
        if (source && source.md5Checksum !== md5(bytes)) throw new Error("ต้นฉบับในคลังถูกแก้ไขหรือยืนยันไม่ได้ ไม่เขียนทับไฟล์เดิม");
        source ||= await upload(bytes, name, mimeType || "application/octet-stream", TARGET_FOLDER, { aefRole: "source", aefHash: hash });
        return { collection: source, source };
      });
    },
    async saveOutput(collectionId: string, bytes: Buffer, name: string, version: string, build: string) {
      if (!validVersionId(version) || !bytes.length || bytes.length > 8 * 1024 * 1024 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error("ไฟล์หรือเวอร์ชัน output ไม่ถูกต้อง");
      return serial(`${ownerKey}:output:${collectionId}`, async () => {
        const group = await collection(collectionId), info = await details(group.id);
        const source = info.files.find(file => file.properties.aefRole === "source");
        if (!source) throw new Error("ยังไม่มีต้นฉบับที่ยืนยันแล้วในชุดนี้");
        const existing = info.files.find(file => file.properties.aefRole === "output" && file.properties.aefVersion === version);
        if (existing) {
          if (existing.md5Checksum !== md5(bytes)) throw new Error("รหัสเวอร์ชันเดิมมีเนื้อหาต่างกัน ไม่เขียนทับ");
          return { output: existing, folder: existing.parents![0] };
        }
        // T-128: "[original filename]_[yymmdd-hhmm].docx" next to the original (no per-document folders).
        safeName(name);
        await privateFolder(TARGET_FOLDER);
        const output = await upload(bytes, `${safeName(exportName(source.name))}.docx`, DOCX, TARGET_FOLDER, {
          aefRole: "output", aefHash: group.properties.aefHash, aefVersion: version, aefSourceId: source.id,
          aefSha256: sha(bytes), aefMd5: md5(bytes), aefBuild: build.slice(0, 30),
        });
        return { output, folder: TARGET_FOLDER };
      });
    },
    async outputTarget(collectionId: string, outputId: string) {
      const { file } = await verifiedChild(collectionId, outputId, "output");
      await privateFolder(TARGET_FOLDER);
      await privateFolder(file.parents![0]);
      return { output: file, folder: file.parents![0] };
    },
    async confirmImport(collectionId: string, outputId: string, operation: string, confirmed: boolean, note: string) {
      if (!validVersionId(operation) || confirmed !== true || typeof note !== "string" || note.length > 1000) throw new Error("ต้องยืนยันเวอร์ชันที่นำเข้า QuizFlow จริงก่อนบันทึก");
      return serial(`${ownerKey}:import:${collectionId}`, async () => {
        const { group, file } = await verifiedChild(collectionId, outputId, "output");
        // T-128: confirmed QuizFlow imports are recorded next to the original as "[original]_QuizFlow_[stamp]".
        const info = await details(group.id);
        const existing = info.files.find(entry => entry.properties.aefRole === "quizflow-import" && entry.properties.aefOperation === operation);
        if (existing) {
          if (existing.properties.aefOutputId !== file.id) throw new Error("รหัสการนำเข้าเดิมผูกกับเวอร์ชันอื่น");
          return existing;
        }
        const properties = { ...file.properties, aefRole: "quizflow-import", aefOutputId: file.id, aefOperation: operation, aefImportedAt: new Date().toISOString(), aefConfirmation: "user-reported" };
        const created = await (await call(`${API}/${file.id}/copy?fields=id&supportsAllDrives=true`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: `${baseName(info.files.find(entry => entry.properties.aefRole === "source")?.name || group.name)}_QuizFlow_${exportStamp()}`, parents: [TARGET_FOLDER], properties, description: `User-reported QuizFlow import; not verified by a QuizFlow API. ${note}` }) })).json();
        const verified = await metadata(created.id);
        if (verified.md5Checksum !== file.md5Checksum || !verified.parents?.includes(TARGET_FOLDER) || verified.properties.aefOutputId !== file.id) throw new Error("อาจสร้างไฟล์นำเข้าแล้ว แต่ยืนยันสำเนาไม่ได้ กรุณาตรวจคลังก่อนลองใหม่");
        return verified;
      });
    },
  };
}

