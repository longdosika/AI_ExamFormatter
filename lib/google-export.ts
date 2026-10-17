import JSZip from "jszip";
import { exportName } from "./export-naming";
import { ExportDocument, PARAGRAPH_ROLES } from "./export-document";
import { EXPORT_PAGE, IMAGE_MAX, LaidOutParagraph, LaidOutRun, TEMPLATE_COLORS, FOOTER_TABS, layoutExamDocument } from "./export-layout";

export const TARGET_FOLDER = "1bZeNZ7De9pxsoQH-Zo9ni3A3Rd6XmnuG";
export const EXPORT_LIMIT = 8 * 1024 * 1024;
const xml = (text: string) => text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/[<>&"']/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[c]!));
const validColor = (value: unknown) => typeof value === "string" && /^[A-Fa-f0-9]{6}$/.test(value);

export function validateExportDocument(value: unknown): asserts value is ExportDocument {
  if (!value || typeof value !== "object") throw new Error("เอกสารส่งออกไม่ถูกต้อง");
  const doc = value as ExportDocument;
  if (typeof doc.title !== "string" || !doc.title.trim() || doc.title.length > 200 || !Array.isArray(doc.paragraphs) || !doc.paragraphs.length || doc.paragraphs.length > 25000) throw new Error("ชื่อหรือขนาดเอกสารไม่ถูกต้อง");
  let size = 0;
  for (const paragraph of doc.paragraphs) {
    if (!paragraph || !Array.isArray(paragraph.runs) || paragraph.runs.length > 10000 || (paragraph.background !== undefined && !validColor(paragraph.background))) throw new Error("รูปแบบย่อหน้าไม่ถูกต้อง");
    if ((paragraph.role !== undefined && !PARAGRAPH_ROLES.includes(paragraph.role)) || (paragraph.item !== undefined && (!Number.isInteger(paragraph.item) || paragraph.item < 0))) throw new Error("รูปแบบย่อหน้าไม่ถูกต้อง");
    for (const run of paragraph.runs) {
      if (!run || typeof run !== "object") throw new Error("ข้อความไม่ถูกต้อง");
      if (run.color !== undefined && !validColor(run.color)) throw new Error("สีข้อความไม่ถูกต้อง");
      if (run.text !== undefined && typeof run.text !== "string") throw new Error("ข้อความไม่ถูกต้อง");
      if (run.image !== undefined && (typeof run.image !== "string" || !/^data:image\/(png|jpeg|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(run.image))) throw new Error("รองรับรูปฝัง PNG/JPEG/GIF เท่านั้น กรุณาใช้รูปที่นำเข้าหรือจับภาพไว้");
      for (const flag of [run.bold, run.italic, run.underline]) if (flag !== undefined && typeof flag !== "boolean") throw new Error("รูปแบบข้อความไม่ถูกต้อง");
      for (const dimension of [run.width, run.height]) if (dimension !== undefined && (!Number.isFinite(dimension) || dimension <= 0 || dimension > 100000)) throw new Error("ขนาดรูปไม่ถูกต้อง");
      size += (run.text?.length || 0) * 3 + (run.image?.length || 0);
      if (size > EXPORT_LIMIT) throw new Error("เอกสารใหญ่เกินขีดจำกัดส่งออก 8 MB กรุณาแบ่งชุดข้อสอบ");
    }
  }
}

/** Native OOXML keeps embedded images and edited text styles during Drive conversion. */
export async function createExportDocx(doc: ExportDocument, now = new Date()): Promise<Buffer> {
  validateExportDocument(doc);
  // T-109: reshape into the master QuizFlow template layout (design.md §1.1) before writing OOXML.
  const laid = layoutExamDocument(doc, now);
  const zip = new JSZip();
  const relationships: string[] = [];
  const imageTypes = new Map<string, string>();
  let imageCount = 0;
  const renderRun = (run: LaidOutRun): string => {
    if (run.image) {
      const match = run.image.match(/^data:image\/(png|jpeg|gif);base64,(.*)$/)!;
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      const id = ++imageCount;
      const name = `image${id}.${ext}`;
      zip.file(`word/media/${name}`, Buffer.from(match[2], "base64"));
      imageTypes.set(ext, `image/${match[1]}`);
      relationships.push(`<Relationship Id="img${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);
      const sourceWidth = run.width || 500, sourceHeight = run.height || 300;
      const scale = Math.min(1, IMAGE_MAX.question / sourceWidth, 800 / sourceHeight);
      const width = sourceWidth * scale, height = sourceHeight * scale;
      const cx = Math.round(width * 9525), cy = Math.round(height * 9525);
      return `<w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Image ${id}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="img${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    }
    const size = run.size || 24;
    const styles = `<w:rFonts w:ascii="Sarabun" w:hAnsi="Sarabun" w:cs="Sarabun"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/>${run.bold ? '<w:b/><w:bCs/>' : ''}${run.italic ? '<w:i/><w:iCs/>' : ''}${run.underline ? '<w:u w:val="single"/>' : ''}<w:color w:val="${run.color || '000000'}"/>${run.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${run.shade}"/>` : ''}`;
    const text = (run.text || "").split("\n").map(part => `<w:t xml:space="preserve">${xml(part)}</w:t>`).join("<w:br/>");
    return `<w:r><w:rPr>${styles}</w:rPr>${text}</w:r>`;
  };
  const paragraphProps = (p: LaidOutParagraph) => {
    const spacing = `<w:spacing w:before="${p.before ?? 0}" w:after="${p.after ?? 0}"${p.line ? ` w:line="${p.line}"` : ''} w:lineRule="auto"/>`;
    const indent = p.indentLeft || p.hanging ? `<w:ind w:left="${p.indentLeft ?? 0}"${p.hanging ? ` w:hanging="${p.hanging}"` : ' w:firstLine="0"'}/>` : '';
    return `<w:pPr>${p.keepWithNext ? '<w:keepNext/>' : ''}<w:keepLines/>${p.background ? `<w:shd w:val="clear" w:color="auto" w:fill="${p.background}"/>` : ''}${spacing}${indent}<w:jc w:val="${p.align || 'left'}"/></w:pPr>`;
  };
  const body = laid.paragraphs.map(p => `<w:p>${paragraphProps(p)}${p.runs.map(renderRun).join('')}</w:p>`).join('');
  const page = EXPORT_PAGE;
  // Template footer: italic "V-<date>" | file name in red | "PAGE of NUMPAGES", positions measured from the template render.
  const footerRun = (content: string, color?: string) => `<w:r><w:rPr><w:rFonts w:ascii="Sarabun" w:hAnsi="Sarabun" w:cs="Sarabun"/><w:i/><w:iCs/>${color ? `<w:color w:val="${color}"/>` : ''}<w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>${content}</w:r>`;
  const field = (code: string) => ['<w:fldChar w:fldCharType="begin"/>', `<w:instrText xml:space="preserve"> ${code} </w:instrText>`, '<w:fldChar w:fldCharType="separate"/>', '<w:t>1</w:t>', '<w:fldChar w:fldCharType="end"/>'].map(part => footerRun(part)).join('');
  const footer = `<?xml version="1.0" encoding="UTF-8"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="${FOOTER_TABS.name}"/><w:tab w:val="right" w:pos="${FOOTER_TABS.page}"/></w:tabs><w:spacing w:before="0" w:after="0"/><w:ind w:left="${FOOTER_TABS.indent}" w:firstLine="0"/></w:pPr>${footerRun(`<w:t xml:space="preserve">${xml(laid.footer.code)}</w:t><w:tab/>`)}${footerRun(`<w:t xml:space="preserve">${xml(laid.footer.name)}</w:t>`, TEMPLATE_COLORS.footerName)}${footerRun('<w:tab/>')}${field("PAGE")}${footerRun('<w:t xml:space="preserve"> of </w:t>')}${field("NUMPAGES")}</w:p></w:ftr>`;
  zip.file("word/footer1.xml", footer);
  relationships.push('<Relationship Id="footer1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>');
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}<w:sectPr><w:footerReference w:type="default" r:id="footer1"/><w:pgSz w:w="${page.widthTwips}" w:h="${page.heightTwips}" w:orient="portrait"/><w:pgMar w:top="${page.marginTopTwips}" w:right="${page.marginRightTwips}" w:bottom="${page.marginBottomTwips}" w:left="${page.marginLeftTwips}" w:header="${page.headerTwips}" w:footer="${page.footerTwips}" w:gutter="0"/><w:pgNumType w:start="1"/></w:sectPr></w:body></w:document>`);
  zip.file("_rels/.rels", '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="doc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Sarabun" w:hAnsi="Sarabun" w:eastAsia="Sarabun" w:cs="Sarabun"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="th-TH" w:bidi="th-TH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:lineRule="auto"/><w:jc w:val="left"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
  relationships.push('<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>');
  zip.file("word/_rels/document.xml.rels", `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships.join('')}</Relationships>`);
  zip.file("[Content_Types].xml", `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${Array.from(imageTypes, ([ext, mime]) => `<Default Extension="${ext}" ContentType="${mime}"/>`).join('')}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export async function checkTargetFolder(token: string, request = fetch): Promise<boolean> {
  const response = await request(`https://www.googleapis.com/drive/v3/files/${TARGET_FOLDER}?fields=id,mimeType,capabilities(canAddChildren)&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) return false;
  const folder = await response.json();
  return folder.id === TARGET_FOLDER && folder.mimeType === "application/vnd.google-apps.folder" && folder.capabilities?.canAddChildren === true;
}

export async function uploadGoogleDocument(doc: ExportDocument, token: string, request = fetch, archived?: { bytes: Buffer; folder: string; properties: Record<string, string>; name: string }): Promise<{ id: string; url: string }> {
  if (!await checkTargetFolder(token, request)) throw new Error("ยังเข้าโฟลเดอร์ปลายทางไม่ได้ กรุณาเลือกโฟลเดอร์ AI_ExamFormatter และตรวจสิทธิ์บัญชี");
  const bytes = archived?.bytes || await createExportDocx(doc);
  const parent = archived?.folder || TARGET_FOLDER;
  const boundary = `quizflow_${crypto.randomUUID().replace(/-/g, '')}`;
  const metadata = JSON.stringify({ name: archived?.name || exportName(doc.title), mimeType: "application/vnd.google-apps.document", parents: [parent], ...(archived ? { properties: archived.properties } : {}) });
  const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`), bytes, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  const response = await request("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id&supportsAllDrives=true", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` }, body, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error("Google Drive ส่งออกไม่สำเร็จ กรุณาตรวจสิทธิ์หรือเชื่อมต่อใหม่");
  const created = await response.json();
  if (typeof created.id !== "string" || !/^[\w-]+$/.test(created.id)) throw new Error("Google ไม่คืนรหัสเอกสารที่ตรวจสอบได้");
  const readback = await request(`https://www.googleapis.com/drive/v3/files/${created.id}?fields=id,mimeType,parents,webViewLink&supportsAllDrives=true`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  const file = readback.ok ? await readback.json() : null;
  if (!file || file.mimeType !== "application/vnd.google-apps.document" || !file.parents?.includes(parent) || typeof file.webViewLink !== "string" || !/^https:\/\/docs\.google\.com\/document\//.test(file.webViewLink)) throw new Error("อาจสร้างเอกสารแล้ว แต่ยืนยันผลปลายทางไม่ได้ กรุณาตรวจ Drive ก่อนลองส่งซ้ำ");
  return { id: file.id, url: file.webViewLink };
}
