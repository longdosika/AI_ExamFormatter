const fs = require('fs');
const f = 'lib/answer-editor.ts';
let s = fs.readFileSync(f, 'utf8'); const crlf = s.includes('\r\n'); s = s.replace(/\r\n/g, '\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('missing ' + a.slice(0, 70)); s = s.replace(a, () => b); };
const additions = fs.readFileSync('scratch/t126-answer-additions.ts.txt', 'utf8');
rep(`      node.append(clear);
    }`, `      node.append(clear);
    }
    // T-126: several correct answers (the template marks each with "*") and editable choice lists.
    if (!node.querySelector("[data-multi-toggle]")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.dataset.multiToggle = "true";
      toggle.dataset.exportIgnore = "true";
      toggle.contentEditable = "false";
      toggle.setAttribute("aria-label", \`ตอบได้หลายข้อ ข้อ \${item.questionNumber}\`);
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
      add.setAttribute("aria-label", \`เพิ่มตัวเลือกข้อ \${item.questionNumber}\`);
      add.title = "เพิ่มตัวเลือกท้ายข้อนี้ (สูงสุด 5 ตัวเลือก ก–จ)";
      add.textContent = "+ เพิ่มตัวเลือก";
      add.className = "answer-chip";
      node.append(add);
    }
    if (node.dataset.multiAnswer === undefined && item.choices.filter(choice => choice.isCorrect).length > 1) node.dataset.multiAnswer = "true";`);
rep(`        if (!badge.parentNode) header.append(badge);
      }`, `        if (!badge.parentNode) header.append(badge);
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
      }`);
rep(`      paintAnswer(row, origin);
    }
  }
}`, `      paintAnswer(row, origin);
    }
    relabelChoices(node);
    syncAnswerInputs(node);
  }
}
` + additions);
rep(`    const selected = node.querySelector<HTMLElement>('[data-choice-key][data-answer-origin="manual"]')?.dataset.choiceKey;
    return [{
      ...item,
      reconciledAnswerKey: selected,
      reconciliationProvenance: selected ? "manual" : "unresolved",
      sourceAnswerEvidence: undefined,
      choices: choices.map(choice => ({ ...choice, isCorrect: choice.key === selected, shadingType: choice.key === selected ? "manual" : "none" })),
    }];`, `    // T-126: every marked row counts; the first stays the primary key for older consumers.
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
    }];`);
fs.writeFileSync(f, crlf ? s.replace(/\n/g, '\r\n') : s);
let r = fs.readFileSync('lib/formatter-rules.ts', 'utf8');
if (!r.includes('reconciledAnswerKeys')) {
  r = r.replace('  reconciledAnswerKey?: string;', () => '  reconciledAnswerKey?: string;\n  /** T-126: all correct keys when a question has more than one (reconciledAnswerKey stays the first). */\n  reconciledAnswerKeys?: string[];');
  fs.writeFileSync('lib/formatter-rules.ts', r);
}
console.log('ok');
