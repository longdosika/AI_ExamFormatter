# T-127 Answer Star Integrity Verification (Claude, 2026-10-17)

Owner screenshot on 261017-1342 (set 3 Q15): a user-created choice marked as the answer shows "เฉลยโดยผู้ใช้" but no "*", and nothing records it as correct.

## Reproduction and cause
- `scripts/test-t127-answer-star.cjs` on 261017-1342: add a choice, select it, click its text and type. Result: origin none, star empty, first letter lost ("ารระเหย…"), no "*" in DOCX.
- The managed star span was editable; the click put the caret in or after it, the first keystroke landed there, and the "typed star" rule (clear the answer when no row ends with "*") cleared it.
- "แยกตัวเลือก" wrote split text into the bold key span and dropped "ง.": React renders the key as two text nodes and the regex built in a template string had lost its backslashes.

## Fix
- Star span `contentEditable=false` (React rows and saved drafts via normalizeAnswerDecorations/decorateAnswerEditor).
- Text typed after the star is moved into the choice text span; a typed "*" only adds an answer; clearing uses "ล้างเฉลย".
- insertChoiceAfter uses choiceKeySpan for the key and the text span for text.

## Verification
- test-t127-answer-star: fails on 1342, passes after the fix (Q14 added จ typed after selection keeps answer + star; Q15 split ง shows key, text outside key span, answer + star; save/reload; DOCX "*" on both). Images `q14-added-answer.png`, `q15-split-answer.png`.
- `node scripts/finish-task.mjs T-127` exit 0 on dev (`completion-gate.log`).
- Production 261017-1417 (`.next-production-t127`) on localhost:3000: badge, CSS ok; deployed test-t127, test-t126, test-t125 and test-e2e exit 0.
