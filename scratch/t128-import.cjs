const fs=require('fs');const f='lib/drive-library.ts';let s=fs.readFileSync(f,'utf8');const crlf=s.includes('\r\n');s=s.replace(/\r\n/g,'\n');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a.slice(0,60));s=s.replace(a,()=>b);};
rep(`        const imports = await section(group, "imports", "03 นำเข้า QuizFlow แล้ว");
        const existing = (await children(imports.id, "quizflow-import")).find(entry => entry.properties.aefOperation === operation);`,`        // T-128: confirmed QuizFlow imports are recorded next to the original as "[original]_QuizFlow_[stamp]".
        const info = await details(group.id);
        const existing = info.files.find(entry => entry.properties.aefRole === "quizflow-import" && entry.properties.aefOperation === operation);`);
rep('body: JSON.stringify({ name: `QuizFlow_${operation.slice(0, 8)}_${file.name}`, parents: [imports.id],','body: JSON.stringify({ name: `${baseName(info.files.find(entry => entry.properties.aefRole === "source")?.name || group.name)}_QuizFlow_${exportStamp()}`, parents: [TARGET_FOLDER],');
rep('!verified.parents?.includes(imports.id)','!verified.parents?.includes(TARGET_FOLDER)');
fs.writeFileSync(f,crlf?s.replace(/\n/g,'\r\n'):s);console.log('ok');
