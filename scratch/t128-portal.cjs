const fs=require('fs');const f='app/page.tsx';let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,60));s=s.replace(a,()=>b);};
rep('import React, { useEffect, useRef, useState } from "react";','import React, { useEffect, useRef, useState } from "react";\nimport { createPortal } from "react-dom";');
rep('  const [showDriveSettings, setShowDriveSettings] = useState(false);','  const [showDriveSettings, setShowDriveSettings] = useState(false);\n  const [driveSlot, setDriveSlot] = useState<HTMLDivElement | null>(null);');
rep('<div className={isDocumentActive ? showDriveSettings ? "fixed inset-0 z-[80] flex items-start justify-center bg-black/30 px-3 pt-24" : "hidden" : "mb-4"}>','<div className={isDocumentActive ? showDriveSettings ? "fixed inset-0 z-[80] flex items-start justify-center bg-black/30 px-3 pt-24" : "hidden" : "hidden"}>');
rep('          <GoogleDriveStatus onReady={setDriveReady} onStatus={setDriveStatus} active={!isDocumentActive || showDriveSettings} />','          {isDocumentActive && <GoogleDriveStatus onReady={setDriveReady} onStatus={setDriveStatus} active={showDriveSettings} />}');
// Portal render near the end of main content: find "{/* Case Decision Manager Overlay */}" and insert before.
rep('      {/* Case Decision Manager Overlay */}','      {!isDocumentActive && driveSlot && createPortal(<GoogleDriveStatus variant="compact" onReady={setDriveReady} onStatus={setDriveStatus} active />, driveSlot)}\n\n      {/* Case Decision Manager Overlay */}');
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('ok');
