const fs=require('fs');const f='app/page.tsx';let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,70));s=s.replace(a,()=>b);};
rep(`          parsedFile.ocrTextRegions = textRegions;
          try { saveDocumentDraft(window.localStorage, { fileName: parsedFile.fileName, fileBytes: parsedFile.fileSize, sourceHash: parsedFile.sourceHash, ocrText: ocrText || "", ocrTextRegions: textRegions, formattedItems, itemCount: formattedItems.length }); } catch {}
`,`          parsedFile.ocrTextRegions = textRegions;
`);
rep(`          ocrText: ocrText || "",
          formattedItems: res.items || formattedItems,
          editorHtml: restoredEditorHtml.current || "",
          diagramsHarvested: !res.error,`,`          ocrText: ocrText || "",
          ocrTextRegions: textRegions,
          formattedItems: res.items || formattedItems,
          editorHtml: restoredEditorHtml.current || "",
          diagramsHarvested: !res.error,`);
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('ok');
