import { ExamItem, ChoiceItem, FORMATTER_CONSTANTS, normalizeChoiceKey } from "./formatter-rules";
import { normalizeThaiOcrText } from "./text-normalization";

/** Reconcile only answer evidence present in the source. */
export function reconcileAnswerKey(choiceAsteriskKey: string | null, explanationText: string): {
  finalKey: string | undefined;
  provenance: ExamItem["reconciliationProvenance"];
} {
  const keys = new Set(Array.from(explanationText.matchAll(/(?:ตอบ|เฉลย|คำตอบ|answer)\s*[:：]?\s*(?:ข้อ)?\s*([ก-จA-E1-5])(?=[\s.)]|$)/gi), match => normalizeChoiceKey(match[1])));
  if (keys.size > 1) return { finalKey: undefined, provenance: "unresolved" };
  if (keys.size === 1) return { finalKey: Array.from(keys)[0], provenance: "reconciled_from_explanation" };
  if (choiceAsteriskKey) return { finalKey: choiceAsteriskKey, provenance: "source_asterisk" };
  return { finalKey: undefined, provenance: "unresolved" };
}

/**
 * Preprocess lines to expand inline choices onto their own lines.
 * Handles cases where choices are laid out horizontally:
 * - 2 choices per line: "ก. ข้อแรก ข. ข้อสอง"
 * - 4 choices per line: "ก. 1 ข. 2 ค. 3 ง. 4"
 * - Question + inline choices: "1. โจทย์ ก. หนึ่ง ข. สอง"
 */
export function splitInlineChoices(rawText: string): string[] {
  const structured = rawText
    .replace(/^\s*\[PAGE(?:\s+(\d+))?\]\s*$/gim, (_m, page) => `--- หน้าที่ ${page || "1"} ---`)
    .replace(/^\s*\[QUESTION\s+(\d+)\]\s*$/gim, "$1. ")
    .replace(/^\s*\[STEM_ITEM\s+(\d+)\]\s*/gim, "$1. ")
    .replace(/^\s*\[CHOICE\s+([ก-จA-E1-5])\]\s*/gim, "$1. ")
    .replace(/^\s*\[EXPLANATION\]\s*/gim, "คำอธิบาย: ")
    .replace(/^\s*\[UNCERTAIN\]\s*/gim, "[UNCERTAIN] ");
  const cleaned = structured
    .replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_table, body: string) => {
      const rows = Array.from(body.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)).map(row =>
        Array.from(row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(cell => cell[1].replace(/<[^>]+>/g, "").trim()));
      const choiceRows = rows.filter(cells => /^[ก-งA-D]$/i.test(cells[0] || ""));
      const isChoiceTable = choiceRows.some(cells => /^[ก-ง]$/.test(cells[0])) || choiceRows.length === 4;
      const header = isChoiceTable && rows[0] && !/^[ก-งA-D]$/i.test(rows[0][0] || "") ? rows[0] : undefined;
      return "\n" + rows.map(cells => isChoiceTable && /^[ก-งA-D]$/i.test(cells[0] || "")
        ? `${cells[0]}. ${cells.slice(1).map((value, index) => header?.[index + 1] ? `${header[index + 1]}: ${value}` : value).join(" | ")}`
        : cells === header ? `ตารางตัวเลือก: ${cells.slice(1).join(" | ")}`
        : `[ตาราง] ${cells.join(" | ")}`).join("\n") + "\n";
    })
    .replace(/<figure>[\s\S]*?<\/figure>/gi, "\n[รูปต้องตรวจสอบ]\n")
    .replace(/<page_number>.*?<\/page_number>/gi, "");

  const rawLines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const resultLines: string[] = [];

  const choiceBoundary = /(?<=\S)\s+(?=(?:[-*+]\s+)?(?:\*{0,2}[ข-จB-Eb-e][.)]\*{0,2}|\([ข-จB-Eb-e]\))\s*)/gi;
  const inlineFirstChoice = /(?<=\S)\s+(?=(?:[-*+]\s+)?(?:\*{0,2}[กAa][.)]\*{0,2}|\(([กAa])\))\s*)/gi;
  const subsequentChoiceTest = /(?<=\S)\s+(?:[-*+]\s+)?(?:\*{0,2}[ข-จB-Eb-e][.)]\*{0,2}|\([ข-จB-Eb-e]\))\s*/i;

  for (const line of rawLines) {
    let current = line;

    // Header prefix
    current = current.replace(/^#{1,6}\s+/, "");

    // Strip leading list bullet (*, -, +) from line start
    current = current.replace(/^[-*+]\s+/, "");

    // If the line has an inline first choice (ก/A) followed later by a subsequent choice (ข/B)
    if (subsequentChoiceTest.test(current) && inlineFirstChoice.test(current)) {
      current = current.replace(inlineFirstChoice, "\n");
    }

    // Split on subsequent choice boundaries (ข-จ, B-E)
    current = current.replace(choiceBoundary, "\n");

    const split = current.split(/\r?\n/).map(s => {
      let l = s.trim();
      // Clean leading bullets if newly exposed after split
      l = l.replace(/^[-*+]\s+/, "");
      // Clean bold questions
      l = l.replace(/^\*\*(\d+)[.)]\*\*/, "$1.");
      l = l.replace(/^\*\*(\d+)\*\*[.)]/, "$1.");
      l = l.replace(/^\*\*ข้อ\s*(?:ที่)?\s*(\d+)[.)]?\*\*/, "ข้อ $1.");
      // Clean bold choices
      l = l.replace(/^\*\*([ก-จA-E1-5])[.)]\*\*/i, "$1.");
      l = l.replace(/^\*\*([ก-จA-E1-5])\*\*[.)]/i, "$1.");
      l = l.replace(/^\*\*([ก-จA-E1-5])[.)]\s*(.*?)\*\*/i, "$1. $2");
      return l;
    }).filter(Boolean);

    resultLines.push(...split);
  }

  return resultLines;
}

/** Parse numbered questions without substituting generated content. */
export function parseExamText(rawText: string, embeddedImages: { id: string; dataUrl: string }[] = [], _fileName = ""): ExamItem[] {
  const lines = splitInlineChoices(normalizeThaiOcrText(rawText));
  const items: ExamItem[] = [];
  let number = 0;
  let question = "";
  let choices: ChoiceItem[] = [];
  let explanation = "";
  let asteriskKeys: string[] = [];
  let insideExplanation = false;
  let numericChoices = false;
  let currentPage: number | undefined;
  let questionSourcePage: number | undefined;
  const numbered = /^(?:(?:ข้อ\s*(?:ที่)?\s*)?(\d+)[.)]\s*|\((\d+)\)\s*)(.*)$/;
  const choicePattern = /^(?:([ก-จA-E1-5])[.)]\s*|\(([ก-จA-E1-5])\)\s*)(.*)$/i;
  const sectionPattern = /^(?:ชุด|ตอน|แบบทดสอบ|ข้อสอบ)\s*(?:ที่)?\s*\d+/i;

  // OCR frequently uses the same numeric form for both question numbers and
  // numeric answer choices. A four-line 1..4 block followed by a later
  // question (rather than a letter choice) is a choice block; treat it as
  // such before applying question-boundary logic. This prevents question 2
  // inside question 1's numeric choices from swallowing the rest of a long
  // document.
  const isNumericChoiceBlockStart = (lineIndex: number, activeNumber: number) => {
    if (activeNumber <= 0) return false;
    const keys = lines.slice(lineIndex, lineIndex + 4).map(candidate => {
      const choice = candidate.match(choicePattern);
      const question = candidate.match(numbered);
      return choice ? Number(choice[1] || choice[2]) : question ? Number(question[1] || question[2]) : NaN;
    });
    if (keys.length !== 4 || !keys.every((key, index) => key === index + 1)) return false;
    const following = lines.slice(lineIndex + 4).find(candidate => !/^--- หน้าที่ \d+ ---$/.test(candidate));
    if (!following) return true;
    if (/^(?:[ก-จA-E])[.)]\s*/i.test(following)) return false;
    const nextQuestion = following.match(numbered);
    if (nextQuestion && Number(nextQuestion[1] || nextQuestion[2]) === 5) {
      // `5.` is often a fifth stem item, but it is also a valid next question
      // after question 4. Treat it as a real boundary when a letter-choice
      // block follows immediately; otherwise preserve the stem enumeration.
      const nextQuestionIndex = lines.indexOf(following, lineIndex + 4);
      const hasImmediateLetterChoices = /^(?:[ก-จA-E])[.)]\s*/i.test(lines[nextQuestionIndex + 1] || "");
      const numericChoiceKeys = lines.slice(nextQuestionIndex + 1, nextQuestionIndex + 5)
        .map(candidate => candidate.match(numbered)?.[1] || candidate.match(numbered)?.[2] || "");
      const hasImmediateNumericChoices = numericChoiceKeys.length === 4 && numericChoiceKeys.every((key, index) => Number(key) === index + 1);
      if (!hasImmediateLetterChoices && !hasImmediateNumericChoices) return false;
    }
    return Boolean(nextQuestion && Number(nextQuestion[1] || nextQuestion[2]) > activeNumber);
  };

  // Numbered reasoning inside explanations is not a new question. Require
  // source choice evidence before accepting an otherwise ambiguous boundary.
  const hasFollowingChoices = (questionIndex: number) => {
    const letterKeys = new Set<string>();
    let numericCount = 0;
    for (let cursor = questionIndex + 1; cursor < lines.length; cursor++) {
      const candidate = lines[cursor];
      if (sectionPattern.test(candidate) || /^(คำอธิบาย|เฉลย)\s*:/.test(candidate)) break;
      const choice = candidate.match(choicePattern);
      const cKey = choice ? (choice[1] || choice[2]) : null;
      if (choice && cKey && /^[ก-จA-E]$/i.test(cKey)) {
        letterKeys.add(normalizeChoiceKey(cKey));
        if (letterKeys.size >= 2) return true;
      } else if (numbered.test(candidate)) {
        if (cKey && Number(cKey) === numericCount + 1 && !letterKeys.size) {
          numericCount++;
          if (numericCount >= 4) return true;
        } else break;
      }
    }
    return false;
  };

  const finish = () => {
    if (number && question) {
      const answer = reconcileAnswerKey(asteriskKeys.length === 1 ? asteriskKeys[0] : null, explanation);
      // An answer pointing outside the actual choices is unresolved.
      const resolved = choices.some(choice => choice.key === answer.finalKey);
      // Explicit inline media belongs to this question; never shift a sparse
      // image list onto earlier questions just because its array index matches.
      const inlineMedia = question.match(/!\[[^\]]*\]\((data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+)\)/);
      const hasFigureMarker = /\[รูป(?:ต้องตรวจสอบ|โจทย์)\]|<figure\b/i.test(question);
      const pageImage = hasFigureMarker && questionSourcePage
        ? embeddedImages.find(image => image.id === `page-${questionSourcePage}`)?.dataUrl
        : undefined;
      const imageUrl = inlineMedia?.[1] || embeddedImages.find(image => image.id === `question-${number}`)?.dataUrl || pageImage ||
        (embeddedImages.some(image => /^question-\d+$/.test(image.id)) ? undefined : embeddedImages[items.length]?.dataUrl);
      const visibleQuestion = question
        .replace(/!\[[^\]]*\]\(data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/=]+\)/g, "")
        .replace(/\[รูป(?:ต้องตรวจสอบ|โจทย์)\]/g, "")
        .trim();
      items.push({
        id: items.length + 1,
        questionNumber: number,
        sourcePage: questionSourcePage,
        questionText: visibleQuestion,
        choices: choices.map(choice => ({
          ...choice,
          isCorrect: resolved && choice.key === answer.finalKey,
          shadingType: resolved && choice.key === answer.finalKey ? "source_provided" : "none",
        })),
        explanationText: explanation.trim(),
        reconciledAnswerKey: resolved ? answer.finalKey : undefined,
        reconciliationProvenance: resolved ? answer.provenance : "unresolved",
        imageUrl,
        imageLabel: imageUrl ? FORMATTER_CONSTANTS.LABEL_QUESTION_IMAGE : undefined,
        imageStatus: imageUrl ? "DIRTY" : undefined,
      });
    }
    number = 0;
    question = "";
    choices = [];
    explanation = "";
    asteriskKeys = [];
    insideExplanation = false;
    numericChoices = false;
    inStemEnumeration = false;
  };

  let inStemEnumeration = false;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const pageMarker = line.match(/^--- หน้าที่ (\d+) ---$/);
    if (pageMarker) { currentPage = Number(pageMarker[1]); continue; }
    if (sectionPattern.test(line)) { finish(); continue; }
    const cMatch = line.match(choicePattern);
    const qMatch = line.match(numbered);
    const cKey = cMatch ? (cMatch[1] || cMatch[2]) : null;
    const cText = cMatch ? cMatch[3] : "";
    const qNum = qMatch ? Number(qMatch[1] || qMatch[2]) : null;
    const qText = qMatch ? qMatch[3] : "";

    if (number && qMatch && qNum === 1 && !choices.length && isNumericChoiceBlockStart(index, number)) {
      numericChoices = true;
    }

    // Detect start of sub-enumeration list (1..N) inside question stem when letter choices follow ahead
    if (number > 1 && !choices.length && !numericChoices && (qNum === 1 || cKey === "1")) {
      for (let c = index; c < lines.length; c++) {
        if (sectionPattern.test(lines[c])) break;
        const cm = lines[c].match(choicePattern);
        const k = cm ? (cm[1] || cm[2]) : null;
        if (k && /^[ก-จA-E]$/i.test(k)) {
          inStemEnumeration = true;
          break;
        }
      }
    }

    // Numeric labels overlap question labels. Require a complete sequential 1-4
    // block before entering numeric-choice mode; incomplete ambiguous input stays literal.
    if (number && !insideExplanation && !choices.length && !inStemEnumeration && cKey === "1") {
      let hasLetterChoicesAhead = false;
      for (let c = index; c < lines.length; c++) {
        if (sectionPattern.test(lines[c])) break;
        const cm = lines[c].match(choicePattern);
        const k = cm ? (cm[1] || cm[2]) : null;
        if (k && /^[ก-จA-E]$/i.test(k)) { hasLetterChoicesAhead = true; break; }
        const qm = lines[c].match(numbered);
        if (qm && Number(qm[1] || qm[2]) > number && hasFollowingChoices(c)) break;
      }
      if (!hasLetterChoicesAhead) {
        const following = lines.slice(index).filter(candidate => numbered.test(candidate)).slice(0, 4);
        numericChoices = following.length === 4 && following.every((candidate, offset) => {
          const m = candidate.match(numbered);
          return Number(m?.[1] || m?.[2]) === offset + 1;
        });
      }
    }

    const isChoice = cMatch && cKey && number && !insideExplanation &&
      // Numeric exams have four answer choices. Once 1..4 are present, a
      // following `5.` is a question boundary (or stem text), never a fifth
      // answer choice. Keeping this cap prevents long scans from losing every
      // question that follows a numeric-choice block.
      (!/^\d$/.test(cKey) || (numericChoices && Number(cKey) === choices.length + 1 && choices.length < 4));

    if (isChoice && cMatch && cKey) {
      inStemEnumeration = false;
      const key = normalizeChoiceKey(cKey);
      const text = cText;
      if (/^\*|\*$/.test(text.trim())) asteriskKeys.push(key);
      choices.push({ key, text: text.replace(/^\s*\*|\*\s*$/g, "").trim(), isCorrect: false });
      continue;
    }

    if (number > 1 && !choices.length && !numericChoices && (qNum === 1 || cKey === "1")) {
      inStemEnumeration = true;
    }

    // A larger number is a new question unless it is one of the pending
    // numeric choices or a numeric stem enumeration. Evaluate this after the
    // stem probe so a 13-page exam does not collapse into a few items.
    const isPendingNumericChoice = Boolean(numericChoices && qNum !== null && qNum > number && qNum <= 4 && choices.length < 4);
    if (qMatch && qNum && qNum > number && !inStemEnumeration && !isPendingNumericChoice && (!insideExplanation || hasFollowingChoices(index))) {
      finish();
      number = qNum;
      questionSourcePage = currentPage;
      question = qText;
      continue;
    }

    const isSubEnumerationInStem = (inStemEnumeration && !choices.length) || (
      number > 0 && !choices.length && (
        (qNum !== null && qNum < number) ||
        (/^\d$/.test(cKey || "") && !numericChoices)
      )
    );
    if (isSubEnumerationInStem) {
      question += (question ? "\n" : "") + line;
      continue;
    }

    if (qMatch && qNum && (!insideExplanation || hasFollowingChoices(index))) {
      finish();
      number = qNum;
      questionSourcePage = currentPage;
      question = qText;
      continue;
    }

    const explanationMatch = line.match(/^(คำอธิบาย|เฉลย|คำตอบ|Answer)\s*:\s*(.*)$/i);
    if (explanationMatch && number) {
      insideExplanation = true;
      const answerLabel = /^(เฉลย|คำตอบ|answer)$/i.test(explanationMatch[1]) ? `${explanationMatch[1]}: ` : "";
      explanation += (explanation ? " " : "") + answerLabel + explanationMatch[2];
      continue;
    }

    if (/^ตัวเลือก\s*:$/.test(line)) continue;
    if (insideExplanation) explanation += " " + line;
    else if (number && choices.length) choices[choices.length - 1].text += " " + line;
    else if (number) question += (inStemEnumeration ? "\n" : " ") + line;
  }

  finish();
  return items;
}
