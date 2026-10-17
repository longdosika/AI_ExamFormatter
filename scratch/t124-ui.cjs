const fs=require('fs');
function edit(f,pairs){let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');for(const [a,b] of pairs){if(!s.includes(a))throw new Error(f+': missing '+a.slice(0,80));s=s.replace(a,()=>b);}fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);}
edit('lib/harvest-editor.ts',[
 ["import type { ExamItem } from \"./formatter-rules\";","import type { ExamItem } from \"./formatter-rules\";\nimport { CROP_VERSION } from \"./figure-text-cleanup\";"],
 ["      if(bbox) image.dataset.sourceBbox=JSON.stringify(bbox);","      if(bbox) image.dataset.sourceBbox=JSON.stringify(bbox);\n      image.dataset.cropVersion=CROP_VERSION;"],
]);
edit('components/SplitDocumentEditor.tsx',[
 ["import { orderItemSections } from \"@/lib/harvest-editor\";","import { orderItemSections } from \"@/lib/harvest-editor\";\nimport { CROP_VERSION, cleanFigureTextInEditor, figureSource, staleFigures } from \"@/lib/figure-text-cleanup\";\nimport { recropFigure } from \"@/lib/diagram-client\";"],
 ["    const reordered = orderItemSections(editor) > 0;\n    if (cleaned || reordered) onEditorDraftChange?.(editor);","    const reordered = orderItemSections(editor) > 0;\n    // T-124: drafts from older builds kept table rows and figure labels in the stem; remove them with the stored OCR geometry.\n    const figureText = cleanFigureTextInEditor(editor, parsedFile.ocrTextRegions) > 0;\n    if (cleaned || reordered || figureText) onEditorDraftChange?.(editor);"],
 ["      insertedImage.dataset.sourcePage=String(captureFrame.current.page);","      insertedImage.dataset.sourcePage=String(captureFrame.current.page);\n      insertedImage.dataset.cropVersion=\"manual\";"],
 ["                            data-source-bbox={item.sharedContextImageBbox ? JSON.stringify(item.sharedContextImageBbox) : undefined}","                            data-source-bbox={item.sharedContextImageBbox ? JSON.stringify(item.sharedContextImageBbox) : undefined}\n                            data-crop-version={item.sharedContextImageBbox ? CROP_VERSION : undefined}"],
 ["                        data-source-bbox={item.imageBbox ? JSON.stringify(item.imageBbox) : undefined}","                        data-source-bbox={item.imageBbox ? JSON.stringify(item.imageBbox) : undefined}\n                        data-crop-version={item.imageBbox ? CROP_VERSION : undefined}"],
]);
console.log('ok');
