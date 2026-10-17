const fs=require("fs");const f="lib/exam-parser.ts";let s=fs.readFileSync(f,"utf8");const crlf=s.includes("\r\n");s=s.replace(/\r\n/g,"\n");
const rep=(a,b)=>{if(!s.includes(a))throw new Error("missing "+a.slice(0,60));s=s.replace(a,()=>b);};
rep(`  let inStemEnumeration = false;\n`,`  let inStemEnumeration = false;\n  // T-121 (B-18): OCR rows of a table that was not captured stay one row per line instead of one run-on stem.\n  let inStemTable = false;\n`);
rep(`    numericChoices = false;\n    inStemEnumeration = false;\n  };`,`    numericChoices = false;\n    inStemEnumeration = false;\n    inStemTable = false;\n  };`);
rep(`    else if (number) question += (inStemEnumeration ? "\n" : " ") + line;`,`    else if (number) {\n      const tableRow = !choices.length && isStemTableRow(question, line, inStemTable);\n      question += (inStemEnumeration || tableRow || inStemTable ? "\n" : " ") + line;\n      inStemTable = tableRow;\n    }`);
rep(`/** T-121 (B-06): Latin look-alikes`,`/**
 * T-121 (B-18): a stem line is a table row when the stem announces a table and the line is a header of short
 * cells right after it, a row with a number, or a single short sub-header inside the table.
 */
export function isStemTableRow(stem: string, line: string, inTable: boolean): boolean {
  if (!/ตาราง/.test(stem)) return false;
  const cells = line.trim().split(/\s+/);
  const shortCells = cells.every(cell => cell.length <= 12);
  if (inTable) return shortCells && (/\d/.test(line) || cells.length <= 2);
  const lastLine = stem.split("\n").pop() || "";
  return /ตาราง/.test(lastLine) && shortCells && cells.length >= 3;
}
/** T-121 (B-06): Latin look-alikes`);
// Inline stem enumerations: "2. ละลายน้ำแล้วกรอง 3. ระเหยแห้ง" -> two lines (only consecutive numbers).
rep(`export function normalizeChoiceKeyConfusions(text: string): string {\n  return text`,`export function normalizeChoiceKeyConfusions(text: string): string {\n  return splitInlineEnumerations(text)`);
rep(`/** T-121 (B-07): pen ticks`,`/** T-121 (audit): an enumerated stem line holding the next item ("2. ละลาย... 3. ระเหยแห้ง") splits at that item. */
export function splitInlineEnumerations(text: string): string {
  return text.split("\n").map(line => {
    const first = line.match(/^\s*(\d{1,2})\.\s+\S/);
    if (!first) return line;
    let expected = Number(first[1]) + 1;
    let result = line;
    for (;;) {
      const next = result.match(new RegExp(String.raw\`^([\s\S]*\S)\s+(\` + expected + String.raw\`\.\s+[ก-๙A-Za-z][\s\S]*)$\`, "u"));
      if (!next || /\n/.test(next[2])) break;
      result = next[1] + "\n" + next[2];
      expected++;
    }
    return result;
  }).join("\n");
}
/** T-121 (B-07): pen ticks`);
fs.writeFileSync(f,crlf?s.replace(/\n/g,"\r\n"):s);
