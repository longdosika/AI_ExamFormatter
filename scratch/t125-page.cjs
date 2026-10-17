const fs=require('fs');const f='app/page.tsx';let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,70));s=s.replace(a,()=>b);};
rep(`        if (cachedDraft.ocrText && !result.rawContent.trim()) {
          result.rawContent = cachedDraft.ocrText;
          setOcrText(cachedDraft.ocrText);
        }`,`        // T-125: reuse saved OCR text only together with its line geometry. Without geometry the figure crops lose
        // their stem/choice limits and duplicated table text cannot be removed, so such drafts are OCR'd again.
        if (cachedDraft.ocrText && cachedDraft.ocrTextRegions?.some(page => page.length) && !result.rawContent.trim()) {
          result.rawContent = cachedDraft.ocrText;
          result.ocrTextRegions = cachedDraft.ocrTextRegions;
          setOcrText(cachedDraft.ocrText);
        }`);
rep(`      const res = await harvestExamDiagrams(
        workingAnswerItems(),
        images,
        current,
        (done, total, msg) => setInfoNotice(msg),
        parsedFile.ocrTextRegions
      );`,`      // T-125: capture limits and duplicate-text removal need OCR line geometry; fetch it first when this session has none.
      let textRegions = parsedFile.ocrTextRegions;
      if (!textRegions?.some(page => page.length) && images.length) {
        setInfoNotice("กำลังอ่านตำแหน่งข้อความในต้นฉบับก่อนสกัดรูป...");
        const ocrImages = ocrInkFilterEnabled() ? await Promise.all(images.map(removeColouredInk)) : images;
        const geometry = await readOcrDocument(ocrImages, { isCurrent: current });
        if (!current()) return;
        if (geometry.pageResults.some(page => page.textRegions?.length)) {
          textRegions = geometry.pageResults.map(page => page.textRegions || []);
          parsedFile.ocrTextRegions = textRegions;
          try { saveDocumentDraft(window.localStorage, { fileName: parsedFile.fileName, fileBytes: parsedFile.fileSize, sourceHash: parsedFile.sourceHash, ocrText: ocrText || "", ocrTextRegions: textRegions, formattedItems, itemCount: formattedItems.length }); } catch {}
        }
      }
      const res = await harvestExamDiagrams(
        workingAnswerItems(),
        images,
        current,
        (done, total, msg) => setInfoNotice(msg),
        textRegions
      );`);
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('ok');
