const fs = require('fs');
function edit(f, pairs) {
  let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
  for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(f + ': missing ' + a.slice(0, 80)); s = s.replace(a, () => b); }
  for (let i = 0; i < 5; i++) { try { fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s); return; } catch { require('child_process').execSync('sleep 2'); } }
  throw new Error('write failed ' + f);
}
edit('lib/harvest-editor.ts', [['function createChoiceRow(root: HTMLElement, item: HTMLElement, key: string): HTMLElement | null {', 'export function createChoiceRow(root: HTMLElement, item: HTMLElement, key: string): HTMLElement | null {']]);
edit('components/SplitDocumentEditor.tsx', [
  ['import { orderItemSections } from "@/lib/harvest-editor";', 'import { createChoiceRow, orderItemSections } from "@/lib/harvest-editor";'],
  ['import { ANSWER_ORIGINS, decorateAnswerEditor, selectManualAnswer } from "@/lib/answer-editor";', 'import { ANSWER_ORIGINS, MAX_CHOICES, confirmCurrentAnswers, decorateAnswerEditor, deleteChoice, isMultiAnswer, relabelChoices, selectManualAnswer, setMultiAnswer, toggleManualAnswer } from "@/lib/answer-editor";'],
  [`    editor.querySelectorAll<HTMLElement>("[data-item-id]").forEach(item => {
      const row = item.querySelector<HTMLElement>('[data-answer-origin="auto_solved"]');
      if (row?.dataset.choiceKey) { selectManualAnswer(item, row.dataset.choiceKey); confirmed++; }
    });`, `    editor.querySelectorAll<HTMLElement>("[data-item-id]").forEach(item => {
      // T-126: a multi-answer question keeps all of its answers when they are confirmed.
      if (item.querySelector('[data-answer-origin="auto_solved"]') && confirmCurrentAnswers(item)) confirmed++;
    });`],
  [`          event.preventDefault();
          selectManualAnswer(itemElement, choiceKey);`, `          event.preventDefault();
          if (isMultiAnswer(itemElement)) toggleManualAnswer(itemElement, choiceKey);
          else selectManualAnswer(itemElement, choiceKey);`],
  [`    const control = (event.target as Element).closest<HTMLElement>("[data-answer-select], [data-clear-answer]");
    const item = control?.closest<HTMLElement>("[data-item-id]");
    if (!control || !item || !editorPaneRef.current) return;
    selectManualAnswer(item, control.dataset.answerSelect || null);`, `    const control = (event.target as Element).closest<HTMLElement>("[data-answer-select], [data-clear-answer], [data-multi-toggle], [data-choice-delete], [data-choice-add]");
    const item = control?.closest<HTMLElement>("[data-item-id]");
    if (!control || !item || !editorPaneRef.current) return;
    // T-126: multi-answer mode, deleting and adding choices.
    if (control.dataset.multiToggle) {
      setMultiAnswer(item, !isMultiAnswer(item));
      showNotice(isMultiAnswer(item) ? "ข้อนี้ตอบได้หลายข้อ: คลิกเพื่อเพิ่มหรือเอาเฉลยออกทีละตัวเลือก" : "ข้อนี้กลับเป็นเฉลยข้อเดียว");
    } else if (control.dataset.choiceDelete) {
      const row = control.closest<HTMLElement>("[data-choice-key]");
      if (!row) return;
      const key = row.dataset.choiceKey;
      deleteChoice(item, row);
      showNotice(\`ลบตัวเลือก \${key} แล้ว ตัวเลือกที่เหลือเรียงอักษรใหม่\`);
    } else if (control.dataset.choiceAdd) {
      const count = item.querySelectorAll("[data-choice-key]").length;
      if (count >= MAX_CHOICES) { showNotice(\`มีตัวเลือกครบ \${MAX_CHOICES} ตัวแล้ว\`); return; }
      const key = THAI_KEYS[count] || "จ";
      const row = createChoiceRow(editorPaneRef.current, item, key);
      if (!row) { showNotice("เพิ่มตัวเลือกไม่ได้ ไม่พบแบบแถวตัวเลือก"); return; }
      row.querySelectorAll("[data-choice-delete]").forEach((node, index) => { if (index > 0) node.remove(); });
      item.dataset.choicesEdited = "true";
      relabelChoices(item);
      const body = Array.from(row.querySelectorAll<HTMLElement>("span")).find(span => !span.closest("[data-export-ignore], [data-answer-marker]") && !/^\\s*[ก-จ]\\.\\s*$/.test(span.textContent || "")) || row;
      body.textContent = "\\u200b";
      const range = document.createRange();
      range.selectNodeContents(body);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      showNotice(\`เพิ่มตัวเลือก \${key} แล้ว พิมพ์ข้อความได้เลย\`);
    } else if (control.dataset.answerSelect && isMultiAnswer(item)) {
      toggleManualAnswer(item, control.dataset.answerSelect);
    } else {
      selectManualAnswer(item, control.dataset.answerSelect || null);
    }`],
]);
console.log('ok');
