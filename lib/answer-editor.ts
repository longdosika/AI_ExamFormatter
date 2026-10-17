import { ExamItem, FORMATTER_CONSTANTS } from "./formatter-rules";

export const ANSWER_ORIGINS = {
  source_provided: { label: "เฉลยจากต้นฉบับ", background: FORMATTER_CONSTANTS.SHADING_GREEN, border: "#496053" },
  auto_solved: { label: "เฉลยจาก AI", background: FORMATTER_CONSTANTS.SHADING_YELLOW, border: "#b3996a" },
  manual: { label: "เฉลยโดยผู้ใช้", background: FORMATTER_CONSTANTS.SHADING_BLUE, border: "#397493" },
};
type AnswerOrigin = keyof typeof ANSWER_ORIGINS;

/** Repair snapshots made before React and DOM decoration shared stable slots. */
export function normalizeAnswerDecorations(editor: HTMLElement) {
  editor.querySelectorAll<HTMLElement>("[data-choice-key]").forEach(row => {
    const header = row.firstElementChild as HTMLElement | null;
    if (!header) return;
    const spans = Array.from(header.querySelectorAll<HTMLElement>("span"));
    const markers = spans.filter(span => span.hasAttribute("data-answer-marker") || /^(?:\s*\*)+\s*$/.test(span.textContent || ""));
    const marker = markers.find(span => span.hasAttribute("data-answer-marker")) || markers[0];
    markers.filter(span => span !== marker).forEach(span => span.remove());
    if (marker) {
      marker.dataset.answerMarker = "true";
      // T-127: the managed star is not editable, so a click at the end of a choice never types into it.
      marker.contentEditable = "false";
      marker.textContent = marker.textContent?.includes("*") ? " *" : "";
    }
    const badges = spans.filter(span => span.hasAttribute("data-answer-badge") || /^เฉลย(?:จากต้นฉบับ|จาก AI|โดยผู้ใช้|ที่เสนอโดยระบบ)/.test(span.textContent?.trim() || ""));
    const badge = badges.find(span => span.hasAttribute("data-answer-badge")) || badges[0];
    badges.filter(span => span !== badge).forEach(span => span.remove());
    if (badge) { badge.dataset.answerBadge = "true"; badge.dataset.exportIgnore = "true"; }
    // Some legacy snapshots contain stars in editable text as well as the managed marker.
    if (marker) {
      const walker = document.createTreeWalker(header, NodeFilter.SHOW_TEXT);
      let text: Node | null;
      while ((text = walker.nextNode())) {
        if (!text.parentElement?.closest("[data-answer-marker], [data-export-ignore]")) text.textContent = text.textContent?.replace(/\s*\*(?:\s*\*)*\s*$/u, "") || "";
      }
    }
  });
}

function paintAnswer(row: HTMLElement, origin?: AnswerOrigin) {
  const appearance = origin ? ANSWER_ORIGINS[origin] : null;
  row.dataset.answerOrigin = origin || "none";
  row.style.transitionProperty = "box-shadow";
  row.style.backgroundColor = appearance?.background || "transparent";
  row.style.borderLeft = `3px solid ${appearance?.border || "transparent"}`;
  const radio = row.querySelector<HTMLInputElement>("input[data-answer-select]");
  if (radio) {
    radio.checked = Boolean(origin);
    radio.style.accentColor = appearance?.border || "#397493";
  }
  const badge = row.querySelector<HTMLElement>("[data-answer-badge]");
  if (badge) badge.textContent = appearance?.label || "";
  const marker = row.querySelector<HTMLElement>("[data-answer-marker]");
  if (marker) marker.textContent = appearance ? " *" : "";
}

/** Also upgrades older saved DOM snapshots, whose controls have no React handlers. */
export function decorateAnswerEditor(editor: HTMLElement, items: ExamItem[]) {
  normalizeAnswerDecorations(editor);
  for (const item of items) {
    const node = editor.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if (!node) continue;
    if (!node.querySelector("[data-clear-answer]")) {
      const clear = document.createElement("button");
      clear.type = "button";
      clear.dataset.clearAnswer = "true";
      clear.dataset.exportIgnore = "true";
      clear.contentEditable = "false";
      clear.setAttribute("aria-label", `ล้างเฉลยข้อ ${item.questionNumber}`);
      clear.title = "ล้างเฉลยข้อนี้";
      clear.textContent = "ล้างเฉลย";
      clear.className = "text-[10px] text-stone-500 hover:text-[#F2604D] px-1 py-0.5";
      node.append(clear);
    }
    // T-126: several correct answers (the template marks each with "*") and editable choice lists.
    if (!node.querySelector("[data-multi-toggle]")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.dataset.multiToggle = "true";
      toggle.dataset.exportIgnore = "true";
      toggle.contentEditable = "false";
      toggle.setAttribute("aria-label", `ตอบได้หลายข้อ ข้อ ${item.questionNumber}`);
      toggle.title = "เปิดเพื่อเลือกเฉลยได้มากกว่า 1 ตัวเลือก";
      toggle.className = "answer-chip";
      node.append(toggle);
    }
    if (!node.querySelector("[data-choice-add]")) {
      const add = document.createElement("button");
      add.type = "button";
      add.dataset.choiceAdd = "true";
      add.dataset.exportIgnore = "true";
      add.contentEditable = "false";
      add.setAttribute("aria-label", `เพิ่มตัวเลือกข้อ ${item.questionNumber}`);
      add.title = "เพิ่มตัวเลือกท้ายข้อนี้ (สูงสุด 5 ตัวเลือก ก–จ)";
      add.textContent = "+ เพิ่มตัวเลือก";
      add.className = "answer-chip";
      node.append(add);
    }
    if (node.dataset.multiAnswer === undefined && item.choices.filter(choice => choice.isCorrect).length > 1) node.dataset.multiAnswer = "true";
    for (const choice of item.choices) {
      const row = Array.from(node.querySelectorAll<HTMLElement>("[data-choice-key]")).find(row => row.dataset.choiceKey === choice.key);
      if (!row) continue;
      const header = row.firstElementChild as HTMLElement | null;
      if (!header) continue;
      const textContainer = header.querySelector<HTMLElement>("div") || header;
      if (textContainer !== header) textContainer.style.flex = "1";
      if (!row.querySelector("[data-answer-select]")) {
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `answer-${item.id}`;
        radio.dataset.answerSelect = choice.key;
        radio.dataset.exportIgnore = "true";
        radio.contentEditable = "false";
        radio.setAttribute("aria-label", `เฉลยข้อ ${item.questionNumber} ตัวเลือก ${choice.key}`);
        radio.title = `เลือก ${choice.key} เป็นเฉลยโดยผู้ใช้`;
        radio.className = "mr-2 h-3.5 w-3.5 shrink-0 accent-[#397493] cursor-pointer";
        header.prepend(radio);
      }
      let marker = row.querySelector<HTMLElement>("[data-answer-marker]");
      if (!marker) {
        marker = Array.from(header.querySelectorAll<HTMLElement>("span")).find(span => span.textContent?.trim() === "*") || document.createElement("span");
        marker.dataset.answerMarker = "true";
        marker.className = "text-[#F2604D] font-bold ml-1";
        marker.contentEditable = "false";
        if (!marker.parentNode) textContainer.append(marker);
      }
      let badge = row.querySelector<HTMLElement>("[data-answer-badge]");
      if (!badge) {
        badge = header.querySelector<HTMLElement>("span[data-export-ignore]") || document.createElement("span");
        badge.dataset.answerBadge = "true";
        badge.dataset.exportIgnore = "true";
        badge.contentEditable = "false";
        badge.className = "text-[10px] px-2 py-0.5 rounded text-[#28332d] font-medium bg-white/70 shrink-0 ml-auto";
        if (!badge.parentNode) header.append(badge);
      }
      if (!row.querySelector("[data-choice-delete]")) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.dataset.choiceDelete = "true";
        remove.dataset.exportIgnore = "true";
        remove.contentEditable = "false";
        remove.textContent = "×";
        remove.title = "ลบตัวเลือกนี้";
        remove.className = "choice-delete";
        header.append(remove);
      }
      const stored = node.dataset.answerEdited === "true" ? row.dataset.answerOrigin : undefined;
      const origin = stored && stored in ANSWER_ORIGINS ? stored as AnswerOrigin :
        stored === "none" ? undefined : choice.isCorrect ? (choice.shadingType && choice.shadingType in ANSWER_ORIGINS ? choice.shadingType as AnswerOrigin : "source_provided") : undefined;
      paintAnswer(row, origin);
    }
    relabelChoices(node);
    syncAnswerInputs(node);
  }
}

const CHOICE_KEYS = ["ก", "ข", "ค", "ง", "จ"];
export const MAX_CHOICES = CHOICE_KEYS.length;
export function isMultiAnswer(item: HTMLElement) { return item.dataset.multiAnswer === "true"; }
function questionLabel(item: HTMLElement) { return item.textContent?.trim().match(/^\d+/)?.[0] || item.dataset.itemId || ""; }

/** T-126: radio buttons in single mode, checkboxes in multi mode; the toggle shows its state. */
export function syncAnswerInputs(item: HTMLElement) {
  const multi = isMultiAnswer(item);
  item.querySelectorAll<HTMLInputElement>("input[data-answer-select]").forEach(input => {
    if (input.type !== (multi ? "checkbox" : "radio")) input.type = multi ? "checkbox" : "radio";
  });
  const toggle = item.querySelector<HTMLElement>("[data-multi-toggle]");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(multi));
    toggle.textContent = multi ? "✓ ตอบได้หลายข้อ" : "ตอบได้หลายข้อ";
  }
}

/** T-126: switching back to single mode keeps only the first selected answer. */
export function setMultiAnswer(item: HTMLElement, on: boolean) {
  item.dataset.multiAnswer = on ? "true" : "false";
  if (!on) {
    const selected = Array.from(item.querySelectorAll<HTMLElement>("[data-choice-key]")).filter(row => row.dataset.answerOrigin && row.dataset.answerOrigin !== "none");
    if (selected.length > 1) selectManualAnswer(item, selected[0].dataset.choiceKey || null);
  }
  syncAnswerInputs(item);
}

function clearTypedStars(row: HTMLElement) {
  const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
  let text: Node | null;
  while ((text = walker.nextNode())) {
    if (!text.parentElement?.closest("[data-answer-marker], [data-export-ignore]")) text.textContent = text.textContent?.replace(/\s*\*\s*$/u, "") || "";
  }
}

/** T-126: multi mode adds or removes one key; every remaining answer becomes a user-confirmed answer. */
export function toggleManualAnswer(item: HTMLElement, key: string) {
  item.dataset.answerEdited = "true";
  item.querySelectorAll<HTMLElement>("details[data-export-ignore]").forEach(evidence => { evidence.hidden = true; });
  item.querySelectorAll<HTMLElement>("[data-choice-key]").forEach(row => {
    clearTypedStars(row);
    const selected = Boolean(row.dataset.answerOrigin && row.dataset.answerOrigin !== "none");
    paintAnswer(row, (row.dataset.choiceKey === key ? !selected : selected) ? "manual" : undefined);
  });
}

/** Confirm every current answer of a question (source, AI or user) as a user answer, keeping several in multi mode. */
export function confirmCurrentAnswers(item: HTMLElement) {
  const selected = Array.from(item.querySelectorAll<HTMLElement>("[data-choice-key]")).filter(row => row.dataset.answerOrigin && row.dataset.answerOrigin !== "none");
  if (!selected.length) return 0;
  if (!isMultiAnswer(item) || selected.length === 1) { selectManualAnswer(item, selected[0].dataset.choiceKey || null); return 1; }
  item.dataset.answerEdited = "true";
  selected.forEach(row => paintAnswer(row, "manual"));
  return selected.length;
}

/** T-126: keys follow row order (ก ข ค ง จ); controls and labels follow their row. */
export function relabelChoices(item: HTMLElement) {
  const number = questionLabel(item);
  Array.from(item.querySelectorAll<HTMLElement>("[data-choice-key]")).forEach((row, index) => {
    const key = CHOICE_KEYS[index] || row.dataset.choiceKey || "";
    // React renders the key as two text nodes ("ค" + ". "), so the visible key is replaced at its span.
    const keySpan = choiceKeySpan(row);
    if (keySpan && keySpan.textContent !== `${key}. `) keySpan.textContent = `${key}. `;
    row.dataset.choiceKey = key;
    const input = row.querySelector<HTMLInputElement>("input[data-answer-select]");
    if (input) { input.dataset.answerSelect = key; input.setAttribute("aria-label", `เฉลยข้อ ${number} ตัวเลือก ${key}`); input.title = `เลือก ${key} เป็นเฉลยโดยผู้ใช้`; }
    row.querySelector<HTMLElement>("[data-choice-delete]")?.setAttribute("aria-label", `ลบตัวเลือก ${key} ข้อ ${number}`);
  });
  const add = item.querySelector<HTMLButtonElement>("[data-choice-add]");
  if (add) add.disabled = item.querySelectorAll("[data-choice-key]").length >= MAX_CHOICES;
}

/** The element that shows a row's key ("ก. "), whether React split it into several text nodes or not. */
export function choiceKeySpan(row: HTMLElement): HTMLElement | null {
  return Array.from(row.querySelectorAll<HTMLElement>("span")).find(span => !span.closest("[data-export-ignore], [data-answer-marker]") && /^\s*[ก-จ]\.\s*$/.test(span.textContent || "")) || null;
}

/** T-126: remove one choice; later keys move up and the answers stay on their rows. */
export function deleteChoice(item: HTMLElement, row: HTMLElement) {
  row.remove();
  item.dataset.choicesEdited = "true";
  item.dataset.answerEdited = "true";
  relabelChoices(item);
}


export function selectManualAnswer(item: HTMLElement, key: string | null) {
  item.dataset.answerEdited = "true";
  item.querySelectorAll<HTMLElement>('details[data-export-ignore]').forEach(evidence => { evidence.hidden = true; });
  item.querySelectorAll<HTMLElement>("[data-choice-key]").forEach(row => {
    const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT);
    let text: Node | null;
    while ((text = walker.nextNode())) {
      if (!text.parentElement?.closest("[data-answer-marker], [data-export-ignore]")) text.textContent = text.textContent?.replace(/\s*\*\s*$/u, "") || "";
    }
    paintAnswer(row, row.dataset.choiceKey === key ? "manual" : undefined);
  });
}

/** Merge only answer ownership, leaving structured media and live edited DOM intact. */
export function answerItemsFromEditor(items: ExamItem[], editor: HTMLElement): ExamItem[] {
  return items.flatMap<ExamItem>(item => {
    const node = editor.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if(node?.dataset.mergedAway==="true") return [];
    if (node?.dataset.answerEdited !== "true" && node?.dataset.choicesEdited!=="true") return [item];
    const choices=node?.dataset.choicesEdited==="true" ? Array.from(node.querySelectorAll<HTMLElement>("[data-choice-key]")).map(row=>{
      const key=row.dataset.choiceKey || "",old=item.choices.find(choice=>choice.key===key);
      const clone=row.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("[data-export-ignore],[data-answer-marker],[data-choice-image],input,button").forEach(node=>node.remove());
      const text=(clone.textContent||"").replace(new RegExp(`^\\s*${key}[.)]\\s*`),"").replace(/​/g,"").trim();
      const image=row.querySelector<HTMLImageElement>("[data-choice-image] img");
      return {...old,key,text,isCorrect:old?.isCorrect || false,imageUrl:image?.src,keyInferred:row.dataset.keyInferred==="true"};
    }) : item.choices;
    if(node?.dataset.answerEdited!=="true") return [{...item,choices}];
    // T-126: every marked row counts; the first stays the primary key for older consumers.
    const marked = Array.from(node.querySelectorAll<HTMLElement>("[data-choice-key]")).filter(row => row.dataset.answerOrigin && row.dataset.answerOrigin !== "none");
    const keys = marked.map(row => row.dataset.choiceKey || "").filter(Boolean);
    const origins = new Map(marked.map(row => [row.dataset.choiceKey, row.dataset.answerOrigin as "manual" | "source_provided" | "auto_solved"]));
    const selected = keys[0];
    return [{
      ...item,
      reconciledAnswerKey: selected,
      reconciledAnswerKeys: keys.length > 1 ? keys : undefined,
      reconciliationProvenance: selected ? "manual" : "unresolved",
      sourceAnswerEvidence: undefined,
      choices: choices.map(choice => ({ ...choice, isCorrect: keys.includes(choice.key), shadingType: keys.includes(choice.key) ? origins.get(choice.key) || "manual" : "none" })),
    }];
  });
}
