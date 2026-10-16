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
      const stored = node.dataset.answerEdited === "true" ? row.dataset.answerOrigin : undefined;
      const origin = stored && stored in ANSWER_ORIGINS ? stored as AnswerOrigin :
        stored === "none" ? undefined : choice.isCorrect ? (choice.shadingType && choice.shadingType in ANSWER_ORIGINS ? choice.shadingType as AnswerOrigin : "source_provided") : undefined;
      paintAnswer(row, origin);
    }
  }
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
  return items.map(item => {
    const node = editor.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`);
    if (node?.dataset.answerEdited !== "true") return item;
    const selected = node.querySelector<HTMLElement>('[data-choice-key][data-answer-origin="manual"]')?.dataset.choiceKey;
    return {
      ...item,
      reconciledAnswerKey: selected,
      reconciliationProvenance: selected ? "manual" : "unresolved",
      sourceAnswerEvidence: undefined,
      choices: item.choices.map(choice => ({ ...choice, isCorrect: choice.key === selected, shadingType: choice.key === selected ? "manual" : "none" })),
    };
  });
}
